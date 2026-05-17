# 컴포넌트 및 모듈 문서 - kpsc-oj-frontend

프로젝트 단위를 어떻게 분리하고 재사용하는지 기록한다.

## 분리 기준
- 공통 단위: `components/common`은 특정 도메인에 묶이지 않는 Button, Badge, Card만 담당한다.
- 전역 레이아웃 단위: `components/layout`은 모든 layout에서 공유하는 SiteHeader, SiteFooter, ThemeModeToggle을 담당한다.
- 인증 단위: `components/auth`는 Google Identity Services 버튼처럼 인증 UI 표시와 SDK script 경계를 담당한다.
- 라우트 보호 단위: `components/auth/ProtectedRoute.tsx`는 인증 세션과 필요한 role이 있는 화면의 진입 경계를 담당한다.
- 기능 전용 단위: `components/problem`, `components/submission`, `components/contest`는 문제/제출/대회 표시 책임만 가진다. 문제 정의 입력과 서브테스크 입력처럼 생성/수정 화면이 공유하는 폼 UI도 해당 기능 컴포넌트가 소유한다.
- Layout 단위: `layouts`는 라우트별 화면 구조와 내비게이션을 담당한다. 일반 제출 화면과 대회 문제 제출 화면은 workspace layout으로 분리해 Footer 없이 화면 높이를 editor에 배정한다.
- Page 단위: `pages`는 라우트 파라미터 처리, hook 호출, 컴포넌트 조립을 담당한다.
- Hook 단위: `hooks`는 page에서 필요한 비동기 유스케이스와 service 호출을 캡슐화한다.
- Service/Application 단위: `src/services/authService.ts`는 백엔드 인증 DTO를 `AuthLoginResult` 또는 `AuthSession`으로 변환하고 token refresh API를 호출한다. `src/services/problemService.ts`, `src/services/submissionService.ts`, `src/services/contestService.ts`는 문제/제출/Contest API 호출을 담당한다.
- Repository/Adapter 단위: 현재 없음. 외부 API 계약 확정 후 adapter/client 경계를 추가한다.

## 계약 규칙
- Props 또는 입력 모델 규칙: 컴포넌트는 `types`의 명시적 타입 또는 로컬 props 타입을 사용한다.
- 출력/result 모델 규칙: 컴포넌트는 JSX 표시만 반환하고 저장, API 호출, 전역 상태 변경을 수행하지 않는다.
- 재사용 기준: 버튼, 배지, 카드처럼 도메인과 무관한 UI는 common으로 둔다.
- 소유 경계: 문제 테이블과 제출 상태 배지는 각각 problem/submission 기능 폴더가 소유한다.

## 주요 컴포넌트
| Component | Owner | Input | Responsibility |
| --- | --- | --- | --- |
| `Button`, `ButtonLink` | common | variant, size, children | 버튼과 라우터 링크 버튼 스타일 |
| `Badge` | common | tone, children | 상태와 카테고리 라벨 표시 |
| `Card` | common | children | 반복 패널 프레임 |
| `MarkdownContent` | common | markdown | 문제 지문 같은 Markdown 본문과 `$...$`, `$$...$$`, `\(...\)`, `\[...\]` LaTeX 수식을 React 요소로 렌더링 |
| `GoogleIdentityButton` | auth | onCredential | Google Identity Services script 로드와 credential callback 처리 |
| `ProtectedRoute` | auth | children, requiredRole | 인증 세션이 없으면 로그인 화면으로 이동하고, 필요한 role이 없으면 보호 화면을 조립하지 않음 |
| `SiteHeader` | layout | none | 전역 브랜드, 주요 내비게이션, 테마 토글, 시작 액션 표시 |
| `SiteFooter` | layout | none | 전역 하단 브랜드와 주요 링크 표시 |
| `ThemeModeToggle` | layout | none | 라이트/다크 모드 전환 버튼 |
| `CodeEditor` | problem | language, value, onChange | Monaco 기반 코드 입력 UI. 전역 테마에 따라 `vs` 또는 `vs-dark`를 사용한다. |
| `ProblemExampleBlock` | problem | label, value | 문제 예제 입출력 원문 표시와 클립보드 복사 버튼 |
| `ProblemTable` | problem | `ProblemListItem[]` | 문제 목록 테이블과 본인 출제 문제의 수정 진입 표시 |
| `CheckerGuide` | problem | none | 커스텀 checker 사용을 선택한 출제자에게 C++17 checker 실행 규약, 템플릿, 확인 목록 표시 |
| `ProblemDefinitionForm` | problem | initial problem definition, submit callback | 문제 생성/수정 공용 입력 폼, 일반/서브테스크 테스트 케이스와 서브테스크 선행 관계 입력, client-side validation |
| `ProblemSubmissionHistory` | submission | submission page state, pagination callback | 제출 작업 화면에서 현재 문제로 필터링된 내 제출 기록 표시 |
| `SubmissionStatusBadge` | submission | `SubmissionStatus` | 제출 상태 색상 매핑 |
| `ContestStatusBadge`, `ContestProblemStatusBadge`, `ContestVisibilityBadge` | contest | Contest status/visibility/solvedStatus | 대회 상태, 공개 범위, 대회 문제 풀이 상태 배지 표시 |
| `ContestNavigation` | contest | contestId, isStaff | 대회 전용 Home/Problems/Submissions/Scoreboard/Manage 내비게이션 표시 |
| `ContestProblemForm` | contest | initial contest problem form value, submit callback | ContestProblem 생성/수정 공용 입력 폼, EXAMPLE/HIDDEN testcase 입력과 client-side validation |
| `ContestSubmissionTable` | contest | contest submissions, showSubmitter | 내 대회 제출 또는 운영진 전체 제출 목록 표시 |
| `ContestScoreboardTable` | contest | ContestScoreboard | ICPC 스타일 rank/user/solved/penalty/problem cell 테이블 표시 |

## React 메모
- 컴포넌트 안에서 fetch/axios 호출을 직접 수행하지 않는다.
- 복잡한 상태 전이는 hook 또는 store action으로 분리한다.
- API 타입과 UI view model의 변환 위치는 추후 service/data 경계에 둔다.
- 라이트/다크 테마 상태는 `src/stores/themeStore.tsx`와 `src/stores/themeContext.ts`에서 관리하고, `ThemeModeToggle`과 `CodeEditor`는 `useTheme()`으로 표시 상태만 읽는다.
- 인증 API 호출, session role 정규화, access token 갱신은 `src/services/authService.ts`와 `src/stores/authStore.tsx`를 통해서만 수행한다. `AuthProvider`는 access token 만료 60초 전에 자동 refresh를 예약하고, role은 access token payload claim을 우선 확인하며 없으면 token 응답 또는 저장된 session role을 사용한다.
- 보호 API를 호출하는 hook은 `requestWithFreshSession()`으로 유효한 access token을 받은 뒤 domain service를 호출한다.
- Header, AppLayout, ProblemsPage는 auth store의 `isAdmin` 값으로 문제 생성 진입점을 숨긴다.
- ProblemTable은 문제별 `canEdit` view model 값이 참인 행에만 수정 버튼을 표시한다.
- 로그인 응답의 `requiresSignup` 분기는 `authService`와 auth store 경계에서 처리하고, `LoginPage`는 로그인/회원가입 화면 상태 조립만 담당한다.
- `LoginPage`는 실제 서비스 사용자를 기준으로 구성하며 backend URL, OAuth client id, raw ID token 입력 같은 개발자용 진단 UI를 표시하지 않는다.
- 문제 조회/생성/수정 API 호출은 `Page -> problem hook -> auth store token refresh -> problemService -> Backend API` 흐름을 따른다.
- 제출 화면의 문제 본문은 `MarkdownContent`를 통해 Markdown과 `$...$`, `$$...$$`, `\(...\)`, `\[...\]` LaTeX 수식을 렌더링하고, `SubmitPage`는 Markdown/수식 파싱 세부사항을 직접 갖지 않는다.
- `MarkdownContent`는 Markdown code fence와 inline code를 보존한 뒤 LaTeX delimiter를 정규화한다. `remark-math`가 직접 처리하지 못하는 `\(...\)`와 `\[...\]`, 한 줄짜리 독립 `$$...$$`는 렌더링 직전에 `remark-math`가 인식하는 형태로 변환한다.
- 제출 화면의 공개 예제 입출력은 `ProblemExampleBlock`이 표시하며, 각 Input/Output 블록은 브라우저 Clipboard API 또는 textarea fallback으로 원문 복사를 제공한다.
- 제출 화면의 서브테스크 메타데이터는 `SubmitPage`가 `useProblemDetail` view model에서 받아 제목, 배점, 비공개 테스트 케이스 개수와 선행 서브테스크 order를 표시한다.
- 문제 생성/수정 폼의 optional checker code는 request DTO의 `checkerCode`로만 전달한다. 커스텀 checker를 선택하지 않으면 `checkerCode=null`을 전달해 기본 출력 비교를 사용한다.
- 문제 생성/수정 폼은 커스텀 checker 사용 체크박스를 제공하고, 선택한 경우에만 `CheckerGuide`와 코드 입력란을 표시한다. checker 컴파일 가능 여부와 최종 유효성은 백엔드와 judge가 검증한다.
- 문제 생성/수정 폼은 서브테스크 사용 체크박스를 제공한다. 체크하지 않으면 `actualTestCaseInputs`/`actualTestCaseOutputs`를 전송하고, 체크하면 일반 실제 테스트 케이스 배열을 비운 뒤 `subtasks[].testCases`와 `subtasks[].prerequisiteSubtaskOrders`를 전송한다.
- `ProblemDefinitionForm`은 서브테스크 선행 관계 입력을 쉼표 구분 order 문자열로 받고, 요청 DTO 변환 전에 양의 정수, 중복, 자기 참조, 존재하지 않는 order, 순환 관계를 검증한다.
- 제출 조회/생성/상세 API 호출은 `Page -> submission hook -> auth store token refresh -> submissionService -> Backend API` 흐름을 따른다.
- Contest 조회/참가/문제/제출/스코어보드 API 호출은 `Page -> contest hook -> auth store token refresh(optional) -> contestService -> Backend API` 흐름을 따른다. public GET API는 비로그인 호출을 허용하고, 로그인 세션이 있으면 Authorization header를 붙여 권한 정보를 받는다.
- ContestProblem은 일반 `Problem`과 다른 타입으로 취급한다. API DTO는 `contestApi.ts`, 화면 모델은 `contest.ts`에 분리한다.
- Contest API의 datetime 필드는 `useContestData`에서 화면 모델로 변환할 때 일반 사용자 표시용 `yyyy-MM-dd-hh-mm` 형식으로 정규화한다.
- Contest 운영진 UI는 `GET /api/v1/contests/{contestId}` 응답의 `isStaff` 값으로만 노출하고, 백엔드 403/`CONTEST_STAFF_REQUIRED`가 최종 권한 경계다.
- Contest 문제 상세는 API 계약상 EXAMPLE testcase만 표시하고 HIDDEN testcase를 표시하지 않는다. 생성/수정 폼의 `testCases` 입력은 ContestProblem mutation request DTO로만 전송한다.
- 대회 문제 상세/제출 route는 `ContestProblemWorkspaceLayout`을 사용해 AppLayout의 sidebar, max-width, Footer 제약을 받지 않는다. `ContestProblemDetailPage`는 좌측 문제 설명/내 제출 탭과 우측 Monaco editor 및 제출 결과 패널을 조립하고, 실제 API 호출은 contest hook과 service 경계를 통해 수행한다.
- Contest 제출 생성 후 상세 endpoint가 없으므로 `useContestSubmissions`가 대회 제출 목록을 polling해 생성된 제출 상태 변화를 반영한다.
- 제출 작업 화면의 `내 제출` 탭은 `SubmitPage`가 보유한 탭/page/refresh 상태를 `ProblemSubmissionHistory`에 props로 전달하고, 컴포넌트는 API 호출 없이 목록 표시와 pagination 버튼만 담당한다.
- 제출 생성 후 상세 결과는 `useSubmissionDetail`이 `SubmissionDetail` view model로 변환하며, 채점 진행 중 상태에서는 polling한다. 서브테스크 결과가 있으면 `SubmitPage`가 `subtaskResults`의 상태와 점수를 표시한다.
