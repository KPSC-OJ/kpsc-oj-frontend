# 아키텍처 문서 - kpsc-oj-frontend

## 요약
kpsc-oj-frontend는 KPSC Online Judge의 React 프론트엔드 MVP다.
현재 구현은 인증, 문제 목록, 문제 상세, 문제 생성/수정, 제출 생성, 제출 상세/채점 결과, 내 제출 목록 화면에서 백엔드 REST API를 호출한다.
백엔드 연결을 위해 화면 조립, UI 컴포넌트, service, 상태 저장소 경계를 분리한다.

## 기본 정보
- 스택: React, TypeScript, Tailwind CSS, Vite
- 라우팅: react-router-dom
- 데이터베이스: 프론트엔드 직접 사용 없음
- 인증 사용: Google ID token 기반 백엔드 로그인, signup, token refresh, logout, session role 연동
- 문제/제출 사용: authenticated backend API 연동
- 관리자 문제 생성/수정: `ADMIN` role 세션에만 화면 노출, backend problem definition API 연동
- 외부 API 연동: Google Identity Services script, kpsc-oj-backend auth API

## 계층 방향
- `kpsc-oj-frontend/src/layouts`: 라우트별 화면 껍데기와 공통 내비게이션을 담당한다.
- `kpsc-oj-frontend/src/pages`: 라우팅 단위 화면 조립을 담당한다.
- `kpsc-oj-frontend/src/components`: 재사용 가능한 표시 컴포넌트를 담당한다.
- `kpsc-oj-frontend/src/hooks`: page와 service 사이의 화면 유스케이스 흐름을 담당한다.
- `kpsc-oj-frontend/src/services`: 백엔드 API 호출과 오류 정규화를 담당한다.
- `kpsc-oj-frontend/src/stores`: 전역 auth 상태와 token persistence를 담당한다.
- `kpsc-oj-frontend/src/types`: API DTO와 UI-facing view model 타입을 분리해 정의한다.

의존성 방향은 `Route/App -> Layout -> Page -> Hook/Store -> Service -> Type` 순서로 흐른다.
컴포넌트는 API 호출을 수행하지 않으며, page는 hook 또는 auth store를 통해 데이터를 받아 UI 컴포넌트에 props로 전달한다.

## React 아키텍처 메모
- page는 라우팅 단위 화면 조립을 담당한다.
- layout은 Public, App, Problem Workspace 화면 경계를 담당한다. Public/App은 공통 Header/Footer를 사용하고, Problem Workspace는 화면 높이를 editor에 배정하기 위해 Header만 사용한다.
- component는 재사용 가능한 UI와 표시 책임을 담당한다.
- service는 API 호출과 공통 오류 정규화를 담당한다.
- store는 인증 session, session role, signup pending 상태, localStorage persistence를 담당한다.
- hook은 API DTO를 UI view model로 변환하고 page의 loading/error 상태를 캡슐화한다.
- page가 직접 fetch를 호출하지 않도록 `src/services` API 경계를 유지한다.

## 흐름 메모
- 문제 데이터 흐름: Page -> Hook -> Problem service -> Backend API
- 제출 데이터 흐름: Page -> Hook -> Submission service -> Backend API. 제출 생성 후 상세 결과는 `useSubmissionDetail`이 조회하고 진행 중 상태에서는 polling한다.
- 인증 흐름: Google Identity Services 버튼 -> LoginPage -> Auth store -> Auth service -> Backend auth API -> 기존 사용자 세션 저장 또는 최초 로그인 회원가입 대기 -> signup 완료 후 세션 저장
- API 흐름: Page -> Hook/Store -> Service -> Backend API
- 저장 흐름: Auth session은 localStorage에 저장하고 access token 만료 전 또는 인증 401 응답 시 refresh token으로 갱신한다. refresh 실패가 인증 실패이면 저장된 세션을 제거한다.
- 외부 연동 흐름: Google Identity Services script는 LoginPage의 GoogleIdentityButton 경계에서만 사용한다.

## 라우트
| Path | Layout | Page | Notes |
| --- | --- | --- | --- |
| `/` | PublicLayout | HomePage | 공개 홈 대시보드 |
| `/login` | PublicLayout | LoginPage | Google ID token 기반 로그인과 signup |
| `/problems` | AppLayout + ProtectedRoute | ProblemsPage | 인증된 문제 목록 |
| `/problems/:id` | AppLayout | Redirect | `/problems/:id/submit`으로 즉시 이동 |
| `/problems/:id/submit` | ProblemWorkspaceLayout + ProtectedRoute | SubmitPage | 인증된 제출 작업 화면 |
| `/submissions` | AppLayout + ProtectedRoute | SubmissionsPage | 인증된 내 제출 기록 |
| `/ranking` | AppLayout + ProtectedRoute | RankingPage | 랭킹 준비 상태 |
| `/admin/problems/new` | AppLayout + ProtectedRoute requiredRole=ADMIN | AdminProblemNewPage | `ADMIN` 세션만 접근 가능한 문제 생성 폼 |
| `/admin/problems/:problemNumber/edit` | AppLayout + ProtectedRoute requiredRole=ADMIN | AdminProblemEditPage | `ADMIN` 세션만 접근 가능한 문제 수정 폼 |

## 아키텍처 결정
| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-05-07 | MVP는 초기 mock data 조회 함수 기반으로 구현했다. | API 호출 금지 요구사항과 추후 백엔드 연결 준비를 동시에 만족하기 위함. | 이후 백엔드 계약이 확정된 문제/제출 흐름은 API 호출로 전환했다. |
| 2026-05-07 | 제출 화면은 ProblemWorkspaceLayout으로 분리한다. | 문제 풀이/코드 입력 화면은 일반 AppLayout보다 넓고 집중된 작업 공간이 필요하다. | `/problems/:id/submit` 라우트는 별도 workspace layout을 사용하되 라이트 모드 배경을 유지한다. |
| 2026-05-07 | Header와 Footer는 `SiteHeader`, `SiteFooter` 공통 컴포넌트를 사용한다. | 라우트별 레이아웃 간 브랜드와 전역 이동 경험을 일관되게 유지하기 위함. | Public, App layout이 같은 Header/Footer 컴포넌트에 의존한다. |
| 2026-05-07 | 문제 상세 페이지를 제거하고 문제 선택 시 제출 작업 화면으로 이동한다. | 사용자가 문제를 고르면 바로 풀이 화면에 진입해야 한다는 디자인 요구사항 반영. | `ProblemDetailPage`를 삭제하고 문제 링크를 `/problems/:id/submit`으로 변경한다. |
| 2026-05-07 | 제출 코드 입력은 Monaco Editor 컴포넌트를 사용한다. | 온라인 저지 제출 화면에서 코드 편집 경험을 제공하기 위함. | `SubmitPage`는 코드/언어 UI 상태를 관리하고 `CodeEditor`가 Monaco 표시 책임을 가진다. |
| 2026-05-07 | 제출 화면은 프로그래머스 풀이 화면을 벤치마킹한 좌우 분할 워크스페이스로 구성한다. | 문제 설명을 읽으면서 같은 화면에서 코드를 작성하고 하단에서 실행/제출 액션을 선택하는 흐름을 제공하기 위함. | 좌측 문제 설명 패널, 우측 Monaco Editor, 하단 테스트/액션 영역을 하나의 제출 화면으로 조립한다. |
| 2026-05-07 | 제출 화면은 내부 카드 반복 대신 main을 채우는 단일 워크스페이스로 사용한다. | 페이지 안 section margin/padding이 main 내부 공백을 만들기 때문이다. | `SubmitPage`는 최상위 section을 사용하지 않고 main을 채우는 div와 경계선 기반 패널로 구성한다. |
| 2026-05-07 | 제출 editor 화면에서는 Footer를 제거하고 viewport 높이를 초과하지 않도록 고정한다. | editor 화면은 문제 설명과 코드 작성 공간이 사용자의 화면에 맞아야 하며 문서 전체 스크롤이 생기면 작업성이 떨어진다. | `ProblemWorkspaceLayout`은 `h-screen`과 `overflow-hidden`을 사용하고, `SubmitPage` 내부 패널만 필요한 곳에서 스크롤한다. |
| 2026-05-07 | 인증 API 연동은 `authService`와 `AuthProvider` 경계 뒤에 둔다. | UI 컴포넌트에서 직접 fetch를 수행하지 않고 백엔드 인증 계약 변경을 한 곳에 모으기 위함. | LoginPage는 auth store action만 호출하고, token persistence와 logout은 store/service가 담당한다. |
| 2026-05-08 | 로그인 응답의 `requiresSignup` 분기는 service/store 경계에서 처리한다. | 백엔드 DTO를 UI가 직접 해석하지 않고 로그인 완료와 최초 가입 대기 상태를 명확히 나누기 위함. | `authService.startGoogleLogin()`은 `AuthLoginResult`를 반환하고, `AuthProvider`는 pending signup 또는 auth session 상태 전이를 담당한다. |
| 2026-05-08 | 문제 생성 페이지는 `ProtectedRoute`와 `useCreateProblem` 경계를 사용한다. | UI 컴포넌트에서 API 호출과 권한 판단을 직접 수행하지 않고 라우트/store/service 경계를 유지하기 위함. | 비로그인 사용자는 `/login`으로 이동하고, `POST /api/v1/problems` 403 응답은 권한 없음 상태로 표시한다. |
| 2026-05-08 | 문제 목록/상세와 제출 흐름은 mock data를 제거하고 백엔드 API로 전환한다. | 백엔드 계약에 `GET /problems`, `GET /problems/{problemNumber}`, `POST /submissions`, `GET /submissions/me`가 정의되었기 때문이다. | `/problems`, `/problems/:id/submit`, `/submissions`는 로그인 세션이 필요하며, ranking은 API 계약이 없어 준비 상태만 표시한다. |
| 2026-05-09 | 관리자 문제 생성 화면은 auth session role이 `ADMIN`일 때만 노출한다. | 일반 사용자는 문제 생성창 자체를 볼 수 없어야 한다는 요구사항을 반영하기 위함. | Header, AppLayout, ProblemsPage의 출제 진입점을 숨기고 `/admin/problems/new` 직접 접근도 `/problems`로 돌려보낸다. |
| 2026-05-09 | 문제 생성 요청에 선택 `checkerCode`를 추가한다. | 문제별 C++17 checker를 선택적으로 등록할 수 있어야 한다. | 관리자 문제 생성 폼에 checker 입력을 추가하고 공백이면 요청 body에서 생략한다. |
| 2026-05-09 | 제출 생성 후 제출 상세 API를 polling한다. | 백엔드가 제출을 `QUEUED`로 저장한 뒤 비동기로 채점하기 때문이다. | `SubmitPage`는 제출 생성 직후 `GET /api/v1/submissions/{submissionId}`를 조회하고 진행 중 상태에서는 2.5초 간격으로 결과를 갱신한다. |
| 2026-05-09 | 보호 API 호출 전에 auth store가 access token을 갱신한다. | access token TTL이 15분이라 사용 중 세션 만료가 빈번하게 발생할 수 있기 때문이다. | Hook은 `requestWithFreshSession()`으로 service를 호출하고, `AuthProvider`는 `POST /api/v1/auth/refresh` rotation 결과를 localStorage에 저장한다. |
| 2026-05-09 | 문제 생성과 수정 폼을 `ProblemDefinitionForm`으로 공유한다. | 백엔드의 생성/수정 request DTO가 같은 문제 정의 구조를 사용하기 때문이다. | 생성 페이지는 `POST /api/v1/problems`, 수정 페이지는 definition 조회 후 `PATCH /api/v1/problems/{problemNumber}`를 호출한다. |
