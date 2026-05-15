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
- Steps: `SubmitPage`가 `useProblemDetail(problemNumber)`로 `GET /api/v1/problems/{problemNumber}`를 호출해 문제 본문, 공개 예제, 서브테스크 메타데이터를 표시한다. 문제 본문의 `statementMarkdown`은 `MarkdownContent`로 렌더링해 풀이 사용자가 Markdown 원문이 아니라 렌더링된 지문과 `$...$`, `$$...$$`, `\(...\)`, `\[...\]` 수식을 보게 한다. 공개 예제 Input/Output은 `ProblemExampleBlock`으로 표시하며 각 블록의 복사 버튼은 예제 원문을 클립보드에 복사한다. 서브테스크가 있으면 제목, 배점, 비공개 테스트 케이스 개수, 선행 서브테스크 order만 표시하고 HIDDEN 테스트 케이스 본문은 표시하지 않는다. 같은 화면의 `내 제출` 탭은 `useMySubmissions(submissionListPage, problemNumber, submissionListRefreshKey)`로 해당 문제의 내 제출 목록을 조회하고 `ProblemSubmissionHistory`가 목록과 pagination을 표시한다. 사용자가 제출하면 `useCreateSubmission()`이 `POST /api/v1/submissions`를 호출한다. 생성된 제출 ID가 있으면 `useSubmissionDetail(submissionId)`가 `GET /api/v1/submissions/{submissionId}`를 호출해 채점 상태, 전체 점수, 서브테스크별 결과, 컴파일/런타임 오류 메시지를 조회한다. 각 보호 API 호출 전에는 `requestWithFreshSession()`이 access token 갱신을 처리한다. 제출 상태가 `QUEUED`, `RUNNING`, `JUDGING`, `PENDING`이면 2.5초 후 상세 조회를 반복한다.
- Validation: 프론트엔드는 문제 번호가 양의 정수인지, 소스 코드가 비어 있지 않은지, 소스 코드가 10000자를 초과하지 않는지 확인한다. 지원 언어와 문제 존재 여부는 백엔드가 최종 검증한다.
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

## 대회 목록과 홈
- Actor: 일반 사용자, 대회 참가자, 운영진
- Entry point: `/contests`, `/contests/:contestId`
- Preconditions: public contest는 비로그인 조회 가능하다. PRIVATE contest는 백엔드 권한이 필요하다.
- Steps: `ContestsPage`는 `useContestList()`로 `GET /api/v1/contests`를 호출하고 예정/진행중/종료 그룹으로 표시한다. `ContestLayout`은 `useContest(contestId)`로 `GET /api/v1/contests/{contestId}`를 호출해 대회 상세, `isStaff`, `isParticipant`를 child route context로 제공한다. 로그인 세션이 있으면 public GET에도 `requestWithFreshSession()`을 통해 Authorization header를 붙인다. `ContestHomePage`는 문제 요약과 스코어보드 미리보기를 함께 조회하고, 참가 버튼은 `useJoinContest()`로 `POST /api/v1/contests/{contestId}/join`을 호출한 뒤 대회 상세를 재조회한다.
- Validation: contestId 존재 여부와 PRIVATE 접근 권한은 백엔드가 최종 검증한다. 프론트는 `isStaff`와 `isParticipant`를 화면 노출 기준으로만 사용한다.
- Empty state: 대회 목록, 문제 요약, 스코어보드 row가 없으면 빈 상태를 표시한다.
- Error state: `CONTEST_NOT_FOUND`, `CONTEST_FORBIDDEN`, `AUTHENTICATION_FAILED`를 사용자 메시지로 표시한다.
- Permission behavior: 조회는 public이지만 PRIVATE contest는 백엔드 권한을 따른다. 참가 API는 authenticated.
- Retry or recovery: 대회 홈에서 참가 요청을 다시 시도하거나 목록으로 돌아갈 수 있다.
- Side effects: 참가 성공 시 `isParticipant` 상태가 true로 갱신된다.
- Related API: `GET /api/v1/contests`, `GET /api/v1/contests/{contestId}`, `POST /api/v1/contests/{contestId}/join`, `GET /api/v1/contests/{contestId}/problems`, `GET /api/v1/contests/{contestId}/scoreboard`
- Related DB tables: 백엔드 contest 관련 table

## 대회 문제 풀이와 제출
- Actor: 대회 참가자
- Entry point: `/contests/:contestId/problems`, `/contests/:contestId/problems/:contestProblemId`
- Preconditions: 대회 상세 조회가 가능해야 한다. 제출은 로그인 세션, `RUNNING` 상태, 참가 상태가 필요하다.
- Steps: `ContestProblemsPage`는 `useContestProblems(contestId)`로 대회 문제 목록과 `solvedStatus`를 조회한다. `ContestProblemDetailPage`는 `useContestProblem(contestId, contestProblemId)`로 문제 본문, 입력/출력 설명, 제약, EXAMPLE testcase만 표시한다. 제출 폼은 기존 `CodeEditor`를 재사용하되 `useSubmitContestProblem()`으로 `POST /api/v1/contests/{contestId}/problems/{contestProblemId}/submissions`를 호출한다. 제출 성공 후 `useContestSubmissions(contestId, 'mine', ..., true)`가 내 대회 제출 목록을 polling해 상태 변화를 표시한다.
- Validation: 프론트는 sourceCode 공백과 10000자 초과를 확인한다. `language`, contest 상태, 참가 여부, 문제 존재 여부는 백엔드가 최종 검증한다.
- Empty state: 문제 목록이나 해당 문제 제출 기록이 없으면 빈 상태를 표시한다.
- Error state: `CONTEST_NOT_RUNNING`, `CONTEST_NOT_JOINED`, `CONTEST_PROBLEM_NOT_FOUND`, `UNSUPPORTED_LANGUAGE`, `VALIDATION_ERROR`를 사용자 메시지로 표시한다.
- Permission behavior: 문제 상세 조회는 public 계약을 따르며, 제출 API는 authenticated. STAFF_ONLY에서 참가하지 않은 일반 사용자는 백엔드가 거부한다.
- Retry or recovery: 사용자는 참가 후 다시 제출하거나 소스 코드를 수정해 재제출할 수 있다.
- Side effects: 성공 시 contest submission이 `QUEUED`로 생성되고 기존 judge queue가 채점한다.
- Related API: `GET /api/v1/contests/{contestId}/problems`, `GET /api/v1/contests/{contestId}/problems/{contestProblemId}`, `POST /api/v1/contests/{contestId}/problems/{contestProblemId}/submissions`, `GET /api/v1/contests/{contestId}/submissions/me`
- Related DB tables: 백엔드 contest submissions table

## 대회 운영진 문제 관리
- Actor: ContestStaff 또는 ADMIN
- Entry point: `/contests/:contestId/manage/problems/new`, `/contests/:contestId/manage/problems/:contestProblemId/edit`
- Preconditions: `GET /api/v1/contests/{contestId}`의 `isStaff=true`여야 화면을 표시한다. 백엔드의 `CONTEST_STAFF_REQUIRED`가 최종 권한 경계다.
- Steps: `ContestProblemNewPage`와 `ContestProblemEditPage`는 `ContestProblemForm`을 사용해 label, title, statement, input/output description, constraints, time/memory limit, score, displayOrder, EXAMPLE/HIDDEN testcase를 입력받는다. 생성은 `POST /api/v1/contests/{contestId}/problems`, 수정은 `PATCH /api/v1/contests/{contestId}/problems/{contestProblemId}`, 삭제는 `DELETE /api/v1/contests/{contestId}/problems/{contestProblemId}`를 호출한다. 현재 상세 API는 HIDDEN testcase를 반환하지 않으므로 수정 화면은 공개 상세 필드와 EXAMPLE testcase를 초기값으로 사용하고 저장 시 입력된 testcase set으로 교체한다.
- Validation: 프론트는 필수 텍스트, 양수 숫자, testcase order 양수/중복, HIDDEN testcase 최소 1개를 확인한다. enum과 DB 제약, 제출이 연결된 문제 삭제 가능 여부는 백엔드가 최종 검증한다.
- Empty state: 새 문제 생성은 빈 폼을 표시한다.
- Error state: `CONTEST_STAFF_REQUIRED`, `CONTEST_PROBLEM_NOT_FOUND`, `VALIDATION_ERROR`를 사용자 메시지로 표시한다.
- Permission behavior: 운영진 UI는 `isStaff`가 true일 때만 노출한다. `isStaff=false`이면 manage route에서 대회 홈으로 이동한다.
- Retry or recovery: 오류 수정 후 같은 폼에서 다시 저장할 수 있고, 삭제 실패 시 목록으로 돌아가지 않는다.
- Side effects: 성공 시 ContestProblem과 testcase set이 생성/수정/삭제된다.
- Related API: `POST /api/v1/contests/{contestId}/problems`, `PATCH /api/v1/contests/{contestId}/problems/{contestProblemId}`, `DELETE /api/v1/contests/{contestId}/problems/{contestProblemId}`
- Related DB tables: 백엔드 contest problem/testcase table

## 대회 제출과 스코어보드 조회
- Actor: 대회 참가자, 운영진, 일반 조회자
- Entry point: `/contests/:contestId/submissions`, `/contests/:contestId/scoreboard`
- Preconditions: 내 제출 조회는 로그인 세션이 필요하다. 전체 제출 조회는 `isStaff=true` 사용자에게만 UI를 제공하며 백엔드 운영진 권한이 필요하다. 스코어보드는 public 계약을 따른다.
- Steps: `ContestSubmissionsPage`는 `useContestSubmissions(contestId, 'mine')`로 내 제출을 조회하고, 운영진이면 scope를 `all`로 바꿔 `GET /api/v1/contests/{contestId}/submissions`를 호출할 수 있다. `ContestScoreboardPage`는 `useContestScoreboard(contestId)`로 `GET /api/v1/contests/{contestId}/scoreboard`를 호출하고 `ContestScoreboardTable`이 rank, user, solvedCount, penalty, 문제별 cell을 가로 스크롤 테이블로 표시한다.
- Validation: 제출 목록 scope는 UI state로 관리한다. 스코어보드 정렬과 penalty 계산은 백엔드가 수행한다.
- Empty state: 제출 또는 스코어보드 row가 없으면 빈 상태를 표시한다.
- Error state: 인증 실패, 운영진 권한 없음, 대회 없음, PRIVATE 접근 권한 없음 오류를 사용자 메시지로 표시한다.
- Permission behavior: 전체 제출 UI는 `isStaff=true`일 때만 노출한다. 스코어보드 조회는 public 계약을 따른다.
- Retry or recovery: 스코어보드는 새로고침 버튼으로 다시 조회한다.
- Side effects: 없음
- Related API: `GET /api/v1/contests/{contestId}/submissions/me`, `GET /api/v1/contests/{contestId}/submissions`, `GET /api/v1/contests/{contestId}/scoreboard`
- Related DB tables: 백엔드 contest submissions/scoreboard 관련 table

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

## 테마 전환
- Actor: 모든 사용자
- Entry point: 공통 Header 테마 버튼
- Preconditions: 브라우저 localStorage와 document root 접근이 가능해야 한다.
- Steps: 사용자가 Header의 테마 버튼을 클릭한다. `ThemeModeToggle`은 `useTheme()`으로 현재 mode를 읽고 `toggleThemeMode()`를 호출한다. `ThemeProvider`는 `light`와 `dark`를 전환하고 `kpsc_oj_theme_mode` localStorage key에 저장한 뒤 document root의 `data-theme` 속성과 `dark` class를 갱신한다. `src/index.css`의 전역 theme override가 화면 색상을 전환하고, `CodeEditor`는 현재 mode에 맞춰 Monaco `vs` 또는 `vs-dark` theme를 사용한다.
- Validation: 저장된 theme mode가 `light` 또는 `dark`가 아니면 무시한다.
- Empty state: 저장된 mode가 없으면 브라우저의 dark color scheme 선호를 초기값으로 사용하고, 없으면 light mode를 사용한다.
- Error state: 현재 사용자에게 별도 오류 상태를 표시하지 않는다.
- Permission behavior: public
- Retry or recovery: 사용자는 같은 버튼으로 언제든 다시 전환할 수 있다.
- Side effects: localStorage theme mode 저장, document root theme attribute 변경
- Related API: 없음
- Related DB tables: 없음

## 문제 생성 폼
- Actor: 관리자
- Entry point: `/admin/problems/new`
- Preconditions: 로그인 세션이 있어야 하며 auth session role이 `ADMIN`이어야 한다. 백엔드 기준 관리자 권한이 필요하다.
- Steps: 비로그인 사용자가 접근하면 `ProtectedRoute`가 `/login`으로 이동시킨다. 로그인했지만 `ADMIN`이 아닌 사용자는 `ProtectedRoute requiredRole=ADMIN`이 `/problems`로 이동시켜 문제 생성 화면을 조립하지 않는다. 관리자는 `AdminProblemNewPage`에서 제목, 태그, 시간 제한, 메모리 제한, Markdown 본문, 공개 예제 테스트 케이스, 예시 정답 코드, 일반 실제 채점 테스트 케이스 또는 서브테스크별 테스트 케이스를 입력한다. 커스텀 checker 사용 체크박스를 켜면 C++17 실행 규약, 템플릿, 확인 목록, checker 코드 입력란이 표시된다. 서브테스크 사용 체크박스를 켜면 배점, 선행 서브테스크 order, 서브테스크별 HIDDEN 테스트 케이스를 입력한다. 제출 시 page가 request DTO를 만들고 `useCreateProblem()`이 `requestWithFreshSession()`으로 유효한 access token을 확보한 뒤 `problemService.createProblem()`을 호출해 `POST /api/v1/problems`를 요청한다.
- Validation: 프론트엔드는 제목 필수/20자 이하, 태그 필수/64자 이하, 시간/메모리 양의 정수, 본문 필수, 예제 테스트 케이스 최소 1개, 예시 정답 코드 필수를 확인한다. 서브테스크를 사용하지 않으면 일반 실제 테스트 케이스 최소 1개를 입력하고, 서브테스크를 사용하면 각 서브테스크 제목/양수 배점/테스트 케이스 최소 1개, 배점 합 100, 선행 order 양의 정수/중복/자기 참조/없는 order/순환 관계를 확인한다. 커스텀 checker를 선택했는데 코드가 공백이면 제출하지 않는다. checker 코드 형식, 입출력 배열 개수 일치, 관리자 권한, 서브테스크 최종 유효성은 백엔드가 최종 검증한다.
- Empty state: 빈 폼
- Error state: 401이면 재로그인 안내, 403이면 문제 생성 권한 없음, 400이면 백엔드 검증 오류 메시지를 표시한다.
- Permission behavior: 프론트엔드는 인증 세션이 없는 접근과 `ADMIN`이 아닌 접근을 차단한다. 백엔드 `admin-only` 검증이 최종 권한 경계다.
- Retry or recovery: 오류 수정 후 같은 폼에서 다시 제출할 수 있다.
- Side effects: 성공 시 백엔드에 문제, 선택 checker, 일반 실제 테스트 케이스 또는 서브테스크 테스트 케이스와 선행 관계가 생성되고, 생성 결과 요약을 표시한 뒤 폼을 초기화한다.
- Related API: `POST /api/v1/problems`
- Related DB tables: 없음

## 문제 수정 폼
- Actor: 문제 생성자
- Entry point: `/admin/problems/:problemNumber/edit`
- Preconditions: 로그인 세션이 있어야 하며 해당 문제를 출제한 계정이어야 한다. 프론트엔드는 문제 목록의 생성자 정보로 수정 버튼 노출을 제한하고, 백엔드는 해당 문제의 `createdBy` 계정인지 최종 검증한다.
- Steps: 문제 목록에서 본인이 출제한 문제의 수정 버튼으로 문제 수정 화면에 진입한다. `AdminProblemEditPage`가 라우트의 문제 번호를 양의 정수로 검증하고 `useProblemDefinition(problemNumber)`을 호출한다. hook은 `requestWithFreshSession()`으로 유효한 access token을 확보한 뒤 `problemService.getProblemDefinition()`으로 `GET /api/v1/problems/{problemNumber}/definition`을 요청한다. 응답은 `ProblemDefinition` view model로 변환되고 `ProblemDefinitionForm`의 초기값이 된다. 기존 checker가 있으면 커스텀 checker 체크박스가 켜진 상태로 시작하고, 기존 서브테스크가 있으면 서브테스크 사용 체크박스가 켜진 상태로 시작하며 기존 선행 order도 입력값으로 채워진다. 사용자가 내용을 수정해 저장하면 page가 `useUpdateProblem()`을 통해 `PATCH /api/v1/problems/{problemNumber}`를 호출한다.
- Validation: 프론트엔드는 문제 번호, 제목 필수/20자 이하, 태그 필수/64자 이하, 시간/메모리 양의 정수, 본문 필수, 예제 테스트 케이스 최소 1개를 확인한다. 서브테스크를 사용하지 않으면 일반 실제 테스트 케이스 최소 1개를 입력하고, 서브테스크를 사용하면 각 서브테스크 제목/양수 배점/테스트 케이스 최소 1개, 배점 합 100, 선행 order 양의 정수/중복/자기 참조/없는 order/순환 관계를 확인한다. 커스텀 checker를 선택했는데 코드가 공백이면 제출하지 않는다. checker 코드 형식, 입출력 배열 개수 일치, 서브테스크 최종 유효성, 문제 생성자 권한은 백엔드가 최종 검증한다.
- Empty state: 수정 대상 문제 정의를 불러오는 동안 loading 상태를 표시한다.
- Error state: 정의 조회 401/403/404, 수정 요청 400/401/403/404 오류를 화면에 표시한다.
- Permission behavior: 프론트엔드는 인증 세션이 없는 접근을 차단하고, 목록에서는 본인 출제 문제에만 수정 버튼을 표시한다. 백엔드의 문제 생성자 검증이 최종 권한 경계다.
- Retry or recovery: 조회 실패 시 문제 목록으로 돌아갈 수 있고, 저장 실패 시 오류 수정 후 같은 폼에서 다시 저장할 수 있다.
- Side effects: 성공 시 백엔드의 문제 정의, 선택 checker, 공개 예제, 일반 실제 테스트 케이스 또는 서브테스크 테스트 케이스와 선행 관계가 교체되고 저장 결과 요약을 표시한다.
- Related API: `GET /api/v1/problems/{problemNumber}/definition`, `PATCH /api/v1/problems/{problemNumber}`
- Related DB tables: 없음
