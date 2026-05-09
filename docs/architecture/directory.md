# 디렉토리 문서 - kpsc-oj-frontend

이 파일은 현재 프로젝트 구조를 설명하는 기준 문서다.

## 현재 구조
| Path | Type | Responsibility | Owner | Notes |
| --- | --- | --- | --- | --- |
| `kpsc-oj-frontend/src/App.tsx` | file | React Router 라우트 구성 | Routing | layout과 page를 연결한다. |
| `kpsc-oj-frontend/src/main.tsx` | file | React 앱 진입점 | App bootstrap | `index.css`와 `App`을 로드한다. |
| `kpsc-oj-frontend/src/index.css` | file | Tailwind import와 전역 HTML 스타일 | Styling | 라이트 모드 기본 전역 스타일만 둔다. |
| `kpsc-oj-frontend/src/layouts` | directory | 라우트별 화면 경계 | Presentation layout | Public, App, Problem Workspace layout을 포함한다. |
| `kpsc-oj-frontend/src/layouts/PublicLayout.tsx` | file | 공개 홈 레이아웃 | Presentation layout | 공통 Header/Footer와 outlet을 조립한다. |
| `kpsc-oj-frontend/src/layouts/AppLayout.tsx` | file | 앱 내부 레이아웃 | Presentation layout | 공통 Header/Footer, 사이드 내비게이션, outlet을 조립한다. |
| `kpsc-oj-frontend/src/layouts/ProblemWorkspaceLayout.tsx` | file | 문제 제출 작업 레이아웃 | Presentation layout | 공통 Header와 제출 화면 outlet을 조립하며 Footer 없이 화면 높이를 editor에 배정한다. |
| `kpsc-oj-frontend/src/pages` | directory | 라우팅 단위 화면 조립 | Page | hook 호출 후 컴포넌트에 props를 전달한다. |
| `kpsc-oj-frontend/src/pages/HomePage.tsx` | file | 홈 대시보드 | Page | 공개 홈 화면을 조립한다. |
| `kpsc-oj-frontend/src/pages/LoginPage.tsx` | file | 로그인과 최초 가입 화면 | Page | auth store action을 호출하고 인증 UI를 조립한다. |
| `kpsc-oj-frontend/src/pages/ProblemsPage.tsx` | file | 문제 목록 | Page | 문제 목록 hook 상태를 `ProblemTable`에 전달한다. |
| `kpsc-oj-frontend/src/pages/SubmitPage.tsx` | file | 제출 작업 화면 | Page | 문제 상세 조회, 제출 생성, 제출 상세 결과 표시 흐름을 조립한다. |
| `kpsc-oj-frontend/src/pages/SubmissionsPage.tsx` | file | 제출 기록 | Page | 내 제출 목록 hook 상태를 테이블로 표시한다. |
| `kpsc-oj-frontend/src/pages/RankingPage.tsx` | file | 랭킹 | Page | 백엔드 랭킹 계약이 없어 준비 상태를 표시한다. |
| `kpsc-oj-frontend/src/pages/AdminProblemNewPage.tsx` | file | 문제 생성 폼 | Page | 문제 생성 입력 상태와 결과 표시를 조립하고 hook을 호출한다. |
| `kpsc-oj-frontend/src/components/common` | directory | 공통 UI 컴포넌트 | Shared UI | Button, Badge, Card를 포함한다. |
| `kpsc-oj-frontend/src/components/auth` | directory | 인증 UI 컴포넌트 | Auth UI | GoogleIdentityButton을 포함한다. |
| `kpsc-oj-frontend/src/components/auth/ProtectedRoute.tsx` | file | 인증/role 보호 라우트 경계 | Auth route UI | 로그인 세션이 없는 사용자를 `/login`으로 이동시키고, 필요한 role이 없으면 보호 화면을 조립하지 않는다. |
| `kpsc-oj-frontend/src/components/layout` | directory | 전역 레이아웃 UI 컴포넌트 | Shared layout UI | SiteHeader, SiteFooter를 포함한다. |
| `kpsc-oj-frontend/src/components/problem` | directory | 문제 도메인 표시 컴포넌트 | Feature UI | `ProblemTable`을 포함한다. |
| `kpsc-oj-frontend/src/components/submission` | directory | 제출 도메인 표시 컴포넌트 | Feature UI | `SubmissionStatusBadge`를 포함한다. |
| `kpsc-oj-frontend/src/hooks` | directory | 화면 유스케이스 hook | Application hook | API service와 page 사이의 비동기 흐름을 캡슐화한다. |
| `kpsc-oj-frontend/src/hooks/useCreateProblem.ts` | file | 문제 생성 hook | Application hook | auth store가 갱신한 access token으로 문제 생성 service를 호출한다. |
| `kpsc-oj-frontend/src/hooks/useProblemList.ts` | file | 문제 목록 hook | Application hook | 문제 목록 API 응답을 UI 모델로 변환한다. |
| `kpsc-oj-frontend/src/hooks/useProblemDetail.ts` | file | 문제 상세 hook | Application hook | 문제 상세 API 응답을 제출 화면 모델로 변환한다. |
| `kpsc-oj-frontend/src/hooks/useCreateSubmission.ts` | file | 제출 생성 hook | Application hook | auth store가 갱신한 access token으로 제출 생성 service를 호출한다. |
| `kpsc-oj-frontend/src/hooks/useMySubmissions.ts` | file | 내 제출 목록 hook | Application hook | 내 제출 목록 API 응답을 UI 모델로 변환한다. |
| `kpsc-oj-frontend/src/hooks/useSubmissionDetail.ts` | file | 제출 상세 hook | Application hook | 제출 상세 API 응답을 UI 모델로 변환하고 진행 중 상태를 polling한다. |
| `kpsc-oj-frontend/src/services` | directory | 백엔드 API client와 service | Service/API boundary | auth API 호출, token refresh API 호출, 공통 JSON/error 처리를 담당한다. |
| `kpsc-oj-frontend/src/services/problemService.ts` | file | 문제 API service | Service/API boundary | 문제 목록/상세 조회와 문제 생성 API 호출을 담당한다. |
| `kpsc-oj-frontend/src/services/submissionService.ts` | file | 제출 API service | Service/API boundary | 제출 생성, 내 제출 목록 조회, 제출 상세 조회 API 호출을 담당한다. |
| `kpsc-oj-frontend/src/stores` | directory | 전역 UI/application state | Store | AuthProvider, auth context, useAuth hook, session role 정규화, access token 갱신 흐름을 포함한다. |
| `kpsc-oj-frontend/src/types` | directory | API DTO와 UI-facing 타입 정의 | Type contract | API DTO와 화면 모델을 분리한다. |
| `kpsc-oj-frontend/src/types/problemApi.ts` | file | 문제 API DTO 타입 | API DTO contract | 문제 목록/상세/생성 request/response DTO와 optional checker field를 정의한다. |
| `kpsc-oj-frontend/src/types/submissionApi.ts` | file | 제출 API DTO 타입 | API DTO contract | 제출 생성/목록/상세 request/response DTO를 정의한다. |
| `kpsc-oj-frontend/src/assets` | directory | 정적 asset | Static asset | 현재 MVP 라우팅에서는 직접 사용하지 않는다. |
