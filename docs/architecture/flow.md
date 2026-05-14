# 흐름 문서 - kpsc-oj-frontend

주요 기능 흐름을 단계별로 기록한다.

## 문제 목록 조회
- Actor: 일반 사용자
- Entry point: `/problems`
- Preconditions: 로그인 세션이 있어야 한다.
- Steps: `ProtectedRoute`가 로그인 세션을 확인한다. `ProblemsPage`가 `useProblemList(page)`를 호출하고 hook이 `requestWithFreshSession()`으로 유효한 access token을 확보한 뒤 `problemService.listProblems()`를 통해 `GET /api/v1/problems?page={page}`를 요청한다. hook은 API DTO를 `ProblemPage` view model로 변환하고 `ProblemTable`에 전달한다.
- Validation: page는 1 이상의 정수 상태로 관리한다. 백엔드가 page query parameter를 최종 검증한다.
- Empty state: 조회된 문제가 없으면 빈 목록 안내를 표시한다.
- Error state: 401이면 재로그인 안내, 그 외 API 오류는 정규화된 메시지를 표시한다.
- Permission behavior: authenticated
- Retry or recovery: 페이지 이동 버튼으로 다시 조회할 수 있다.
- Side effects: 문제 제목 선택 시 `/problems/:problemNumber/submit`으로 이동한다. 현재 로그인한 `serviceUsername`이 문제의 `createdByServiceUsername`과 일치하는 경우에만 수정 버튼으로 `/admin/problems/:problemNumber/edit`에 진입할 수 있다.
- Related API: `GET /api/v1/problems`
- Related DB tables: 없음

## 로그인
- Actor: 일반 사용자
- Entry point: `/login`
- Preconditions: 백엔드 auth API가 접근 가능해야 한다. Google 버튼 사용 시 `VITE_GOOGLE_CLIENT_ID`가 필요하다.
- Steps: 사용자가 Google Identity Services 버튼으로 학교 계정을 선택한다. `LoginPage`는 `signInWithGoogleIdToken()`만 호출하고, auth store가 Google credential을 정규화한 뒤 `authService.startGoogleLogin()`을 통해 `POST /api/v1/auth/google`을 호출한다. 응답이 `requiresSignup=false`이면 service가 token 응답을 `AuthSession`으로 변환하고 auth store가 세션을 저장한 뒤 `/problems`로 이동한다. 응답이 `requiresSignup=true`이면 auth store가 기존 local session을 제거하고 `signupToken`, `email`을 pending signup state로 저장해 회원가입 폼으로 전환한다.
- Validation: Google credential이 비어 있으면 auth store가 요청하지 않는다. 백엔드가 Google token, email 검증, domain 검증을 수행한다.
- Empty state: 로그인 전 폼 표시
- Error state: service에서 정규화된 error message를 LoginPage에 표시한다.
- Permission behavior: public
- Retry or recovery: 실패 시 같은 폼에서 다시 제출할 수 있다.
- Side effects: 기존 사용자이면 JWT를 localStorage에 저장하고 `/problems`로 이동한다. 최초 로그인 사용자이면 signup 완료 전까지 JWT를 저장하지 않는다.
- Related API: `POST /api/v1/auth/google`
- Related DB tables: 백엔드 auth/user/session table

## 최초 가입
- Actor: 최초 로그인 사용자
- Entry point: `/login`
- Preconditions: `POST /api/v1/auth/google` 응답이 `requiresSignup=true`이고 signup token이 있어야 한다.
- Steps: 사용자가 service username을 입력하고 `completeSignup()`을 호출한다. auth store가 service username을 정규화한 뒤 `authService.completeFirstLoginSignup()`을 통해 `POST /api/v1/auth/signup`을 호출한다. signup 응답 token을 `AuthSession`으로 변환해 localStorage에 저장하고 `/problems`로 이동한다.
- Validation: service username이 비어 있거나 3-32자의 영문/숫자/underscore 형식이 아니면 auth store가 요청하지 않는다. 중복 검증과 최종 정규화는 백엔드가 수행한다.
- Empty state: pending signup form
- Error state: 백엔드 검증 실패 메시지를 표시한다.
- Permission behavior: public with signup token
- Retry or recovery: 취소 시 pending signup 상태를 제거하고 로그인 폼으로 돌아간다.
- Side effects: signup 완료 응답의 JWT를 localStorage에 저장하고 `/problems`로 이동한다.
- Related API: `POST /api/v1/auth/signup`
- Related DB tables: 백엔드 user/session table

## 로그아웃
- Actor: 로그인 사용자
- Entry point: 공통 Header 로그아웃 버튼
- Preconditions: localStorage 또는 auth store에 access token이 있어야 한다.
- Steps: Header가 `signOut()`을 호출하고 auth store가 local session을 제거한 뒤 `POST /api/v1/auth/logout`을 호출한다.
- Validation: access token이 없으면 local state만 제거한다.
- Empty state: 로그인 버튼 표시
- Error state: backend logout 실패와 무관하게 local session은 제거한다.
- Permission behavior: authenticated
- Retry or recovery: 다시 로그인할 수 있다.
- Side effects: localStorage auth session 제거
- Related API: `POST /api/v1/auth/logout`
- Related DB tables: 백엔드 auth_sessions table

## 토큰 갱신
- Actor: 로그인 사용자
- Entry point: 모든 보호 API 호출 hook
- Preconditions: localStorage 또는 auth store에 refresh token이 있는 인증 세션이 있어야 한다.
- Steps: 앱 시작 시 저장된 session의 access token이 이미 refresh 기준 시각을 지났으면 `AuthProvider`가 `authService.refreshAuthSession()`으로 `POST /api/v1/auth/refresh`를 한 번 시도한다. 보호 API 호출 hook은 service를 직접 호출하기 전에 `requestWithFreshSession()`을 호출한다. auth store는 access token 만료까지 60초 미만이면 같은 refresh API를 요청한다. 성공하면 새 access token과 refresh token을 `AuthSession`으로 변환해 localStorage와 React state를 갱신한 뒤 원래 service 호출을 계속한다. 보호 API가 401 또는 `AUTHENTICATION_FAILED`를 반환하면 auth store가 refresh를 한 번 강제로 수행하고 원래 요청을 한 번 재시도한다.
- Validation: refresh token 유효성, session active 여부, rotation 일치 여부는 백엔드가 최종 검증한다.
- Empty state: 저장된 session이 없으면 로그인 필요 오류를 반환한다.
- Error state: refresh가 400/401 또는 `INVALID_REQUEST`/`AUTHENTICATION_FAILED`로 실패하면 auth store가 local session을 제거한다. 네트워크 오류나 5xx는 session을 보존하고 호출자에게 오류를 전달한다.
- Permission behavior: public with refresh token
- Retry or recovery: 사용자는 다시 로그인할 수 있다. 동시 보호 API 호출은 하나의 refresh 요청 결과를 공유한다.
- Side effects: refresh 성공 시 기존 refresh token은 rotation으로 폐기되고 새 token set이 localStorage에 저장된다.
- Related API: `POST /api/v1/auth/refresh`
- Related DB tables: 백엔드 auth_sessions table

## 제출 작업 화면
- Actor: 일반 사용자
- Entry point: `/problems/:id/submit`
- Preconditions: 로그인 세션이 있어야 하고 URL에 문제 번호가 포함되어야 한다.
- Steps: `SubmitPage`가 `useProblemDetail(problemNumber)`로 `GET /api/v1/problems/{problemNumber}`를 호출해 문제 본문, 공개 예제, 서브테스크 메타데이터를 표시한다. 문제 본문의 `statementMarkdown`은 `MarkdownContent`로 렌더링해 풀이 사용자가 Markdown 원문이 아니라 렌더링된 지문과 `$...$`, `$$...$$` 수식을 보게 한다. 공개 예제 Input/Output은 `ProblemExampleBlock`으로 표시하며 각 블록의 복사 버튼은 예제 원문을 클립보드에 복사한다. 서브테스크가 있으면 제목, 배점, 비공개 테스트 케이스 개수만 표시하고 HIDDEN 테스트 케이스 본문은 표시하지 않는다. 같은 화면의 `내 제출` 탭은 `useMySubmissions(submissionListPage, problemNumber, submissionListRefreshKey)`로 해당 문제의 내 제출 목록을 조회하고 `ProblemSubmissionHistory`가 목록과 pagination을 표시한다. 사용자가 제출하면 `useCreateSubmission()`이 `POST /api/v1/submissions`를 호출한다. 생성된 제출 ID가 있으면 `useSubmissionDetail(submissionId)`가 `GET /api/v1/submissions/{submissionId}`를 호출해 채점 상태, 전체 점수, 서브테스크별 결과, 컴파일/런타임 오류 메시지를 조회한다. 각 보호 API 호출 전에는 `requestWithFreshSession()`이 access token 갱신을 처리한다. 제출 상태가 `QUEUED`, `RUNNING`, `JUDGING`, `PENDING`이면 2.5초 후 상세 조회를 반복한다.
- Validation: 프론트엔드는 문제 번호가 양의 정수인지, 소스 코드가 비어 있지 않은지 확인한다. 지원 언어와 문제 존재 여부는 백엔드가 최종 검증한다.
- Empty state: 최근 제출이 없으면 제출 기록 없음 안내를 표시하고, `내 제출` 탭에서는 현재 문제에 대한 제출 기록 없음 안내를 표시한다.
- Error state: 문제 조회 404, 제출 400/401/404, 미지원 언어 오류, 제출 상세 403/404 오류를 화면에 표시한다. 예제 복사가 실패하면 해당 복사 버튼이 실패 상태를 표시한다.
- Permission behavior: authenticated
- Retry or recovery: 소스 코드 수정 후 다시 제출할 수 있다.
- Side effects: 제출 성공 시 백엔드에 제출이 생성되고 초기 상태가 표시된다. 제출 목록은 1페이지로 돌아가 재조회되며, 이후 비동기 채점 결과와 서브테스크 점수가 상세 조회 polling으로 갱신된다.
- Related API: `GET /api/v1/problems/{problemNumber}`, `GET /api/v1/submissions/me`, `POST /api/v1/submissions`, `GET /api/v1/submissions/{submissionId}`
- Related DB tables: 없음

## 제출 기록 조회
- Actor: 일반 사용자
- Entry point: `/submissions`
- Preconditions: 로그인 세션이 있어야 한다.
- Steps: `SubmissionsPage`가 `useMySubmissions(page)`를 호출하고 hook이 `requestWithFreshSession()`으로 유효한 access token을 확보한 뒤 `submissionService.listMySubmissions()`로 `GET /api/v1/submissions/me`를 요청한다. API DTO는 `SubmissionPage` view model로 변환되어 테이블에 표시된다.
- Validation: page는 1 이상의 정수 상태로 관리한다. 백엔드가 page query parameter를 최종 검증한다.
- Empty state: 제출 기록이 없으면 빈 목록 안내를 표시한다.
- Error state: 401이면 재로그인 안내, 그 외 API 오류는 정규화된 메시지를 표시한다.
- Permission behavior: authenticated
- Retry or recovery: 페이지 이동 버튼으로 다시 조회할 수 있다.
- Side effects: 없음
- Related API: `GET /api/v1/submissions/me`
- Related DB tables: 없음

## 랭킹 조회
- Actor: 일반 사용자
- Entry point: `/ranking`
- Preconditions: 로그인 세션이 있어야 한다.
- Steps: 현재 백엔드 랭킹 API 계약이 없으므로 `RankingPage`는 준비 상태를 표시한다.
- Validation: 현재 없음
- Empty state: 랭킹 집계 준비 상태 표시
- Error state: 현재 호출할 랭킹 API 없음
- Permission behavior: authenticated
- Retry or recovery: 현재 없음
- Side effects: 없음
- Related API: 백엔드 랭킹 endpoint 미정
- Related DB tables: 없음

## 문제 생성 폼
- Actor: 관리자
- Entry point: `/admin/problems/new`
- Preconditions: 로그인 세션이 있어야 하며 auth session role이 `ADMIN`이어야 한다. 백엔드 기준 관리자 권한이 필요하다.
- Steps: 비로그인 사용자가 접근하면 `ProtectedRoute`가 `/login`으로 이동시킨다. 로그인했지만 `ADMIN`이 아닌 사용자는 `ProtectedRoute requiredRole=ADMIN`이 `/problems`로 이동시켜 문제 생성 화면을 조립하지 않는다. 관리자는 `AdminProblemNewPage`에서 제목, 태그, 시간 제한, 메모리 제한, Markdown 본문, 공개 예제 테스트 케이스, 예시 정답 코드, 일반 실제 채점 테스트 케이스 또는 서브테스크별 테스트 케이스를 입력한다. 커스텀 checker 사용 체크박스를 켜면 C++17 실행 규약, 템플릿, 확인 목록, checker 코드 입력란이 표시된다. 서브테스크 사용 체크박스를 켜면 배점과 서브테스크별 HIDDEN 테스트 케이스를 입력한다. 제출 시 page가 request DTO를 만들고 `useCreateProblem()`이 `requestWithFreshSession()`으로 유효한 access token을 확보한 뒤 `problemService.createProblem()`을 호출해 `POST /api/v1/problems`를 요청한다.
- Validation: 프론트엔드는 제목 필수/20자 이하, 태그 필수/64자 이하, 시간/메모리 양의 정수, 본문 필수, 예제 테스트 케이스 최소 1개, 예시 정답 코드 필수를 확인한다. 서브테스크를 사용하지 않으면 일반 실제 테스트 케이스 최소 1개를 입력하고, 서브테스크를 사용하면 각 서브테스크 제목/양수 배점/테스트 케이스 최소 1개와 배점 합 100을 확인한다. 커스텀 checker를 선택했는데 코드가 공백이면 제출하지 않는다. checker 코드 형식, 입출력 배열 개수 일치, 관리자 권한, 서브테스크 최종 유효성은 백엔드가 최종 검증한다.
- Empty state: 빈 폼
- Error state: 401이면 재로그인 안내, 403이면 문제 생성 권한 없음, 400이면 백엔드 검증 오류 메시지를 표시한다.
- Permission behavior: 프론트엔드는 인증 세션이 없는 접근과 `ADMIN`이 아닌 접근을 차단한다. 백엔드 `admin-only` 검증이 최종 권한 경계다.
- Retry or recovery: 오류 수정 후 같은 폼에서 다시 제출할 수 있다.
- Side effects: 성공 시 백엔드에 문제, 선택 checker, 일반 실제 테스트 케이스 또는 서브테스크 테스트 케이스가 생성되고, 생성 결과 요약을 표시한 뒤 폼을 초기화한다.
- Related API: `POST /api/v1/problems`
- Related DB tables: 없음

## 문제 수정 폼
- Actor: 문제 생성자
- Entry point: `/admin/problems/:problemNumber/edit`
- Preconditions: 로그인 세션이 있어야 하며 해당 문제를 출제한 계정이어야 한다. 프론트엔드는 문제 목록의 생성자 정보로 수정 버튼 노출을 제한하고, 백엔드는 해당 문제의 `createdBy` 계정인지 최종 검증한다.
- Steps: 문제 목록에서 본인이 출제한 문제의 수정 버튼으로 문제 수정 화면에 진입한다. `AdminProblemEditPage`가 라우트의 문제 번호를 양의 정수로 검증하고 `useProblemDefinition(problemNumber)`을 호출한다. hook은 `requestWithFreshSession()`으로 유효한 access token을 확보한 뒤 `problemService.getProblemDefinition()`으로 `GET /api/v1/problems/{problemNumber}/definition`을 요청한다. 응답은 `ProblemDefinition` view model로 변환되고 `ProblemDefinitionForm`의 초기값이 된다. 기존 checker가 있으면 커스텀 checker 체크박스가 켜진 상태로 시작하고, 기존 서브테스크가 있으면 서브테스크 사용 체크박스가 켜진 상태로 시작한다. 사용자가 내용을 수정해 저장하면 page가 `useUpdateProblem()`을 통해 `PATCH /api/v1/problems/{problemNumber}`를 호출한다.
- Validation: 프론트엔드는 문제 번호, 제목 필수/20자 이하, 태그 필수/64자 이하, 시간/메모리 양의 정수, 본문 필수, 예제 테스트 케이스 최소 1개를 확인한다. 서브테스크를 사용하지 않으면 일반 실제 테스트 케이스 최소 1개를 입력하고, 서브테스크를 사용하면 각 서브테스크 제목/양수 배점/테스트 케이스 최소 1개와 배점 합 100을 확인한다. 커스텀 checker를 선택했는데 코드가 공백이면 제출하지 않는다. checker 코드 형식, 입출력 배열 개수 일치, 서브테스크 최종 유효성, 문제 생성자 권한은 백엔드가 최종 검증한다.
- Empty state: 수정 대상 문제 정의를 불러오는 동안 loading 상태를 표시한다.
- Error state: 정의 조회 401/403/404, 수정 요청 400/401/403/404 오류를 화면에 표시한다.
- Permission behavior: 프론트엔드는 인증 세션이 없는 접근을 차단하고, 목록에서는 본인 출제 문제에만 수정 버튼을 표시한다. 백엔드의 문제 생성자 검증이 최종 권한 경계다.
- Retry or recovery: 조회 실패 시 문제 목록으로 돌아갈 수 있고, 저장 실패 시 오류 수정 후 같은 폼에서 다시 저장할 수 있다.
- Side effects: 성공 시 백엔드의 문제 정의, 선택 checker, 공개 예제, 일반 실제 테스트 케이스 또는 서브테스크 테스트 케이스가 교체되고 저장 결과 요약을 표시한다.
- Related API: `GET /api/v1/problems/{problemNumber}/definition`, `PATCH /api/v1/problems/{problemNumber}`
- Related DB tables: 없음
