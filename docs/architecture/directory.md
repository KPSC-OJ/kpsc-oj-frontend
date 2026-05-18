# 디렉토리 문서 - kpsc-oj-frontend

이 파일은 현재 프로젝트 구조를 설명하는 기준 문서다.

## 현재 구조
| Path | Type | Responsibility | Owner | Notes |
| --- | --- | --- | --- | --- |
| `kpsc-oj-frontend/src/App.tsx` | file | React Router 라우트 구성 | Routing | layout과 page를 연결한다. |
| `kpsc-oj-frontend/src/main.tsx` | file | React 앱 진입점 | App bootstrap | `index.css`와 `App`을 로드한다. |
| `kpsc-oj-frontend/src/index.css` | file | Tailwind import와 전역 HTML 스타일 | Styling | 기본 전역 스타일과 `data-theme="dark"` 기반 black/zinc/violet 다크 모드 색상 오버라이드를 둔다. |
| `kpsc-oj-frontend/src/layouts` | directory | 라우트별 화면 경계 | Presentation layout | Public, App, Contest, Problem Workspace layout을 포함한다. |
| `kpsc-oj-frontend/src/layouts/PublicLayout.tsx` | file | 공개 홈 레이아웃 | Presentation layout | 공통 Header/Footer와 outlet을 조립한다. |
| `kpsc-oj-frontend/src/layouts/AppLayout.tsx` | file | 앱 내부 레이아웃 | Presentation layout | 공통 Header/Footer, 사이드 내비게이션, outlet을 조립한다. |
| `kpsc-oj-frontend/src/layouts/ContestLayout.tsx` | file | 대회별 전용 화면 레이아웃 | Presentation layout | AppLayout sidebar 없이 대회 전용 Header/Footer, 대회 상세 hero, child route context를 제공한다. |
| `kpsc-oj-frontend/src/layouts/ContestSiteHeader.tsx` | file | 대회 전용 Header 조립 | Presentation layout | 공통 SiteHeader에 대회 탭 내비게이션과 `OJ로 돌아가기` 버튼을 주입한다. |
| `kpsc-oj-frontend/src/layouts/ContestProblemWorkspaceLayout.tsx` | file | 대회 문제 제출 작업 레이아웃 | Presentation layout | 대회 상세를 조회하고 대회 전용 Header를 사용하며 Footer 없이 대회 문제 제출 화면에 viewport 높이를 배정한다. |
| `kpsc-oj-frontend/src/layouts/ProblemWorkspaceLayout.tsx` | file | 문제 제출 작업 레이아웃 | Presentation layout | 공통 Header와 제출 화면 outlet을 조립하며 Footer 없이 화면 높이를 editor에 배정한다. |
| `kpsc-oj-frontend/src/pages` | directory | 라우팅 단위 화면 조립 | Page | hook 호출 후 컴포넌트에 props를 전달한다. |
| `kpsc-oj-frontend/src/pages/HomePage.tsx` | file | 홈 대시보드 | Page | 공개 홈 화면을 조립한다. |
| `kpsc-oj-frontend/src/pages/LoginPage.tsx` | file | 로그인과 최초 가입 화면 | Page | auth store action을 호출하고 인증 UI를 조립한다. |
| `kpsc-oj-frontend/src/pages/ProblemsPage.tsx` | file | 문제 목록 | Page | 문제 목록 hook 상태를 `ProblemTable`에 전달한다. |
| `kpsc-oj-frontend/src/pages/SubmitPage.tsx` | file | 제출 작업 화면 | Page | 문제 상세/서브테스크 메타데이터 조회, 현재 문제 내 제출 목록 탭, 제출 생성, 제출 상세/서브테스크 결과 표시 흐름을 조립한다. |
| `kpsc-oj-frontend/src/pages/SubmissionsPage.tsx` | file | 제출 기록 | Page | 내 제출 목록 hook 상태를 테이블로 표시한다. |
| `kpsc-oj-frontend/src/pages/RankingPage.tsx` | file | 랭킹 | Page | 백엔드 랭킹 계약이 없어 준비 상태를 표시한다. |
| `kpsc-oj-frontend/src/pages/AdminProblemNewPage.tsx` | file | 문제 생성 폼 | Page | 문제 생성 공용 폼에 생성 hook을 연결한다. |
| `kpsc-oj-frontend/src/pages/AdminProblemEditPage.tsx` | file | 문제 수정 폼 | Page | 라우트 문제 번호를 검증하고 문제 정의 조회/수정 hook을 공용 폼에 연결한다. |
| `kpsc-oj-frontend/src/pages/ContestsPage.tsx` | file | 대회 목록 | Page | Contest 목록 hook 상태를 카드형 리스트, 검색 입력, 상태 필터와 함께 표시하고 선택한 대회의 전용 페이지로 이동시킨다. |
| `kpsc-oj-frontend/src/pages/ContestHomePage.tsx` | file | 대회 홈 | Page | 대회 상세 context, 문제 요약, 참가 상태, 승인 대기 참가자 관리, 스코어보드 미리보기를 조립한다. |
| `kpsc-oj-frontend/src/pages/ContestProblemsPage.tsx` | file | 대회 문제 목록 | Page | ContestProblem 목록과 운영진 문제 생성/수정/삭제 진입을 조립한다. |
| `kpsc-oj-frontend/src/pages/ContestProblemDetailPage.tsx` | file | 대회 문제 상세/제출 | Page | ContestProblem 상세와 예제, 내 제출 탭, 화면 높이를 크게 쓰는 Monaco 제출 workspace를 조립한다. |
| `kpsc-oj-frontend/src/pages/ContestSubmissionsPage.tsx` | file | 대회 제출 목록 | Page | 내 대회 제출 목록과 운영진 전체 제출 목록 toggle을 조립한다. |
| `kpsc-oj-frontend/src/pages/ContestScoreboardPage.tsx` | file | 대회 스코어보드 | Page | Contest scoreboard hook 상태를 ICPC 테이블로 표시한다. |
| `kpsc-oj-frontend/src/pages/ContestProblemNewPage.tsx` | file | 대회 문제 생성 | Page | `isStaff` context를 확인하고 ContestProblem 생성 폼과 hook을 연결한다. |
| `kpsc-oj-frontend/src/pages/ContestProblemEditPage.tsx` | file | 대회 문제 수정/삭제 | Page | `isStaff` context를 확인하고 ContestProblem 수정/삭제 hook을 연결한다. |
| `kpsc-oj-frontend/src/components/common` | directory | 공통 UI 컴포넌트 | Shared UI | Button, Badge, Card, MarkdownContent, ResizableSplitPane을 포함한다. MarkdownContent는 Markdown과 LaTeX 수식 표시를 담당한다. |
| `kpsc-oj-frontend/src/components/common/ResizableSplitPane.tsx` | file | 제출 workspace 분할 크기 조절 | Shared UI | 문제 영역과 코드 작성 영역 사이 divider의 pointer drag와 keyboard resize 상태를 담당한다. |
| `kpsc-oj-frontend/src/components/auth` | directory | 인증 UI 컴포넌트 | Auth UI | GoogleIdentityButton을 포함한다. |
| `kpsc-oj-frontend/src/components/auth/ProtectedRoute.tsx` | file | 인증/role 보호 라우트 경계 | Auth route UI | 로그인 세션이 없는 사용자를 `/login`으로 이동시키고, 필요한 role이 없으면 보호 화면을 조립하지 않는다. |
| `kpsc-oj-frontend/src/components/layout` | directory | 전역 레이아웃 UI 컴포넌트 | Shared layout UI | SiteHeader, SiteFooter, ThemeModeToggle을 포함한다. |
| `kpsc-oj-frontend/src/components/contest` | directory | 대회 도메인 표시/입력 컴포넌트 | Feature UI | Contest 배지, 전용 네비게이션, 문제 폼, 제출 테이블, 스코어보드 테이블을 포함한다. ContestProblemForm은 선택 checker, 생성 전용 reference solution, 일반/서브테스크 테스트 케이스 입력을 소유한다. |
| `kpsc-oj-frontend/src/components/problem` | directory | 문제 도메인 표시/입력 컴포넌트 | Feature UI | `ProblemTable`, `ProblemExampleBlock`, `ProblemDefinitionForm`, `CheckerGuide`를 포함한다. |
| `kpsc-oj-frontend/src/components/problem/ProblemExampleBlock.tsx` | file | 예제 입출력 표시 | Feature UI | 제출 화면의 공개 예제 Input/Output 원문과 클립보드 복사 버튼을 표시한다. |
| `kpsc-oj-frontend/src/components/problem/ProblemDefinitionForm.tsx` | file | 문제 정의 입력 폼 | Feature UI | 문제 생성/수정에서 공유하는 제목, 제한, 본문, checker, 일반/서브테스크 테스트 케이스, 서브테스크 선행 관계 입력과 client-side validation을 담당한다. |
| `kpsc-oj-frontend/src/components/problem/CheckerGuide.tsx` | file | checker 작성 안내 | Feature UI | 커스텀 checker를 선택한 출제자에게 checker 사용 시점, 실행 규약, 템플릿, 작성 전 확인 목록을 표시한다. |
| `kpsc-oj-frontend/src/components/submission` | directory | 제출 도메인 표시 컴포넌트 | Feature UI | `SubmissionStatusBadge`, `ProblemSubmissionHistory`를 포함한다. |
| `kpsc-oj-frontend/src/components/submission/ProblemSubmissionHistory.tsx` | file | 문제별 내 제출 기록 표시 | Feature UI | 제출 작업 화면에서 현재 문제의 내 제출 목록, 빈 상태, 오류 상태, pagination UI를 표시한다. |
| `kpsc-oj-frontend/src/hooks` | directory | 화면 유스케이스 hook | Application hook | API service와 page 사이의 비동기 흐름을 캡슐화한다. |
| `kpsc-oj-frontend/src/hooks/useCreateProblem.ts` | file | 문제 생성 hook | Application hook | auth store가 갱신한 access token으로 문제 생성 service를 호출한다. |
| `kpsc-oj-frontend/src/hooks/useProblemDefinition.ts` | file | 문제 정의 조회 hook | Application hook | 수정 화면용 전체 문제/서브테스크 정의 API 응답을 UI 모델로 변환한다. |
| `kpsc-oj-frontend/src/hooks/useUpdateProblem.ts` | file | 문제 수정 hook | Application hook | auth store가 갱신한 access token으로 문제 수정 service를 호출한다. |
| `kpsc-oj-frontend/src/hooks/useProblemList.ts` | file | 문제 목록 hook | Application hook | 문제 목록 API 응답을 UI 모델로 변환하고 현재 세션 기준 수정 가능 여부를 계산한다. |
| `kpsc-oj-frontend/src/hooks/useProblemDetail.ts` | file | 문제 상세 hook | Application hook | 문제 상세 API 응답을 제출 화면 모델로 변환한다. |
| `kpsc-oj-frontend/src/hooks/useCreateSubmission.ts` | file | 제출 생성 hook | Application hook | auth store가 갱신한 access token으로 제출 생성 service를 호출한다. |
| `kpsc-oj-frontend/src/hooks/useMySubmissions.ts` | file | 내 제출 목록 hook | Application hook | 내 제출 목록 API 응답을 UI 모델로 변환한다. |
| `kpsc-oj-frontend/src/hooks/useSubmissionDetail.ts` | file | 제출 상세 hook | Application hook | 제출 상세 API 응답을 UI 모델로 변환하고 진행 중 상태를 polling한다. |
| `kpsc-oj-frontend/src/hooks/useContestData.ts` | file | Contest 유스케이스 hook | Application hook | Contest 목록/상세/문제/제출/스코어보드 API 응답을 UI 모델로 변환하고 대회 제출 목록 polling과 운영진 mutation을 캡슐화한다. |
| `kpsc-oj-frontend/src/hooks/contestErrorMessage.ts` | file | Contest 오류 메시지 정규화 | Application hook helper | Contest API error code를 사용자 메시지로 변환한다. |
| `kpsc-oj-frontend/src/services` | directory | 백엔드 API client와 service | Service/API boundary | auth API 호출, token refresh API 호출, 공통 JSON/error 처리를 담당한다. |
| `kpsc-oj-frontend/src/services/apiClient.ts` | file | 공통 JSON API client | Service/API boundary | JSON request, Authorization header, error body 정규화, DELETE 204 응답 처리를 담당한다. |
| `kpsc-oj-frontend/src/services/problemService.ts` | file | 문제 API service | Service/API boundary | 문제 목록/상세/정의 조회와 문제 생성/수정 API 호출을 담당한다. |
| `kpsc-oj-frontend/src/services/submissionService.ts` | file | 제출 API service | Service/API boundary | 제출 생성, 내 제출 목록 조회, 제출 상세 조회 API 호출을 담당한다. |
| `kpsc-oj-frontend/src/services/contestService.ts` | file | Contest API service | Service/API boundary | Contest 목록/상세/참가/참가 승인, ContestProblem 관리, 대회 제출, 스코어보드 API 호출을 담당한다. |
| `kpsc-oj-frontend/src/components/layout/ThemeModeToggle.tsx` | file | 라이트/다크 모드 전환 버튼 | Shared layout UI | Header에서 전역 theme mode store를 호출해 색상 모드를 전환한다. |
| `kpsc-oj-frontend/src/stores` | directory | 전역 UI/application state | Store | AuthProvider, auth context, useAuth hook, ThemeProvider, theme context, useTheme hook, session role 정규화, access token 갱신 흐름을 포함한다. |
| `kpsc-oj-frontend/src/stores/themeContext.ts` | file | 테마 context 계약 | Store contract | theme mode context value와 `ThemeMode` 타입을 정의한다. |
| `kpsc-oj-frontend/src/stores/themeStore.tsx` | file | 테마 Provider | Store | theme mode localStorage persistence와 document theme attribute 반영을 담당한다. |
| `kpsc-oj-frontend/src/stores/useTheme.ts` | file | 테마 hook | Store hook | 전역 theme context 접근을 캡슐화한다. |
| `kpsc-oj-frontend/src/types` | directory | API DTO와 UI-facing 타입 정의 | Type contract | API DTO와 화면 모델을 분리한다. |
| `kpsc-oj-frontend/src/types/problemApi.ts` | file | 문제 API DTO 타입 | API DTO contract | 문제 목록/상세/정의/생성/수정 request/response DTO, 목록 생성자 식별 필드, optional checker field, 서브테스크 및 선행 관계 DTO를 정의한다. |
| `kpsc-oj-frontend/src/types/submissionApi.ts` | file | 제출 API DTO 타입 | API DTO contract | 제출 생성/목록/상세 request/response DTO와 서브테스크 결과 DTO를 정의한다. |
| `kpsc-oj-frontend/src/types/contestApi.ts` | file | Contest API DTO 타입 | API DTO contract | Contest, 참가 상태/승인 대기 참가자, ContestProblem, ContestProblem subtask/checker/reference solution, ContestSubmission, Scoreboard request/response DTO와 enum 타입을 정의한다. |
| `kpsc-oj-frontend/src/types/contest.ts` | file | Contest 화면 모델 타입 | UI view model contract | Contest API DTO에서 변환된 대회 목록/상세/참가 결과/승인 대기 참가자/문제/폼/서브테스크 입력/제출/스코어보드 화면 모델을 정의한다. |
| `kpsc-oj-frontend/src/assets` | directory | 정적 asset | Static asset | 현재 MVP 라우팅에서는 직접 사용하지 않는다. |
