# 아키텍처 문서 - kpsc-oj-frontend

## 요약
kpsc-oj-frontend는 KPSC Online Judge의 React 프론트엔드 MVP다.
현재 구현은 인증, 문제 목록, 문제 상세/서브테스크 메타데이터, 문제 생성/수정, 제출 생성, 제출 상세/채점 결과, 내 제출 목록, Contest 목록/홈/문제/제출/스코어보드/운영진 문제 관리 화면에서 백엔드 REST API를 호출한다.
일반 문제 제출 화면과 대회 문제 제출 화면은 Footer와 AppLayout 사이드바 없이 viewport 전체 높이를 사용하는 workspace layout을 사용한다.
백엔드 연결을 위해 화면 조립, UI 컴포넌트, service, 상태 저장소 경계를 분리한다.

## 기본 정보
- 스택: React, TypeScript, Tailwind CSS, Vite
- 라우팅: react-router-dom
- 데이터베이스: 프론트엔드 직접 사용 없음
- 인증 사용: Google ID token 기반 백엔드 로그인, signup, token refresh, logout, session role 연동
- 문제/제출 사용: authenticated backend API 연동. 문제 상세는 서브테스크 메타데이터를 포함하고, 제출 상세는 서브테스크별 결과를 표시한다.
- Contest 사용: public 조회 가능한 Contest REST API 연동. 로그인 세션이 있으면 GET 요청에도 Authorization header를 붙여 PRIVATE 접근과 `isStaff`/`isParticipant` 권한 정보를 정확히 받는다.
- 테마 사용: 사용자 선택 라이트/다크 모드를 localStorage에 저장하고 전역 `data-theme` 속성으로 반영
- 관리자 문제 생성: `ADMIN` role 세션에만 화면 노출, backend problem creation API 연동
- 문제 수정: 문제 목록 응답의 생성자 정보로 본인이 출제한 문제에만 수정 진입 노출, backend problem definition API에서 생성자 권한 최종 검증
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
- layout은 Public, App, Contest, Contest Problem Workspace, Problem Workspace 화면 경계를 담당한다. Public/App은 공통 Header/Footer를 사용하고, Contest는 대회별 전용 내비게이션을 제공하며, Contest Problem Workspace와 Problem Workspace는 화면 높이를 editor에 배정하기 위해 Footer 없이 Header 중심으로 구성한다.
- component는 재사용 가능한 UI와 표시 책임을 담당한다.
- service는 API 호출과 공통 오류 정규화를 담당한다.
- store는 인증 session, session role, signup pending 상태, theme mode, localStorage persistence를 담당한다.
- hook은 API DTO를 UI view model로 변환하고 page의 loading/error 상태를 캡슐화한다.
- page가 직접 fetch를 호출하지 않도록 `src/services` API 경계를 유지한다.

## 흐름 메모
- 문제 데이터 흐름: Page -> Hook -> Problem service -> Backend API. 문제 상세/정의 응답의 `subtasks`와 `prerequisiteSubtaskOrders`는 hook에서 UI view model로 변환한다.
- 제출 데이터 흐름: Page -> Hook -> Submission service -> Backend API. 제출 생성 후 상세 결과는 `useSubmissionDetail`이 조회하고 진행 중 상태에서는 polling하며, `totalScore`와 `subtaskResults`를 결과 패널에 표시한다.
- Contest 데이터 흐름: Page -> Contest hook -> Contest service -> Backend API. Contest DTO는 `src/types/contestApi.ts`, 화면 모델은 `src/types/contest.ts`로 분리한다. ContestProblem은 일반 Problem과 다른 타입으로 취급한다.
- 인증 흐름: Google Identity Services 버튼 -> LoginPage -> Auth store -> Auth service -> Backend auth API -> 기존 사용자 세션 저장 또는 최초 로그인 회원가입 대기 -> signup 완료 후 세션 저장
- 테마 흐름: SiteHeader ThemeModeToggle -> Theme store -> localStorage 저장 -> document `data-theme`와 Monaco editor theme 반영
- API 흐름: Page -> Hook/Store -> Service -> Backend API
- 저장 흐름: Auth session은 localStorage에 저장하고 `AuthProvider`가 access token 만료 60초 전 자동 refresh를 예약한다. 보호 API 호출 전 또는 인증 401 응답 시에도 refresh token으로 갱신한다. refresh 실패가 인증 실패이면 저장된 세션을 제거한다.
- 외부 연동 흐름: Google Identity Services script는 LoginPage의 GoogleIdentityButton 경계에서만 사용한다.

## 라우트
| Path | Layout | Page | Notes |
| --- | --- | --- | --- |
| `/` | PublicLayout | HomePage | 공개 홈 대시보드 |
| `/login` | PublicLayout | LoginPage | Google ID token 기반 로그인과 signup |
| `/contests` | AppLayout | ContestsPage | 공개/권한 기반 대회 목록 |
| `/contests/:contestId` | AppLayout + ContestLayout | ContestHomePage | 대회 홈, 참가 상태, 문제 요약, 스코어보드 미리보기 |
| `/contests/:contestId/problems` | AppLayout + ContestLayout | ContestProblemsPage | 대회 전용 문제 목록과 운영진 관리 액션 |
| `/contests/:contestId/problems/:contestProblemId` | ContestProblemWorkspaceLayout | ContestProblemDetailPage | 대회 문제 상세와 대회 제출 workspace |
| `/contests/:contestId/submissions` | AppLayout + ContestLayout | ContestSubmissionsPage | 내 대회 제출, 운영진이면 전체 제출 조회 |
| `/contests/:contestId/scoreboard` | AppLayout + ContestLayout | ContestScoreboardPage | ICPC 스타일 대회 스코어보드 |
| `/contests/:contestId/manage/problems/new` | AppLayout + ContestLayout | ContestProblemNewPage | `isStaff=true` 사용자만 사용하는 대회 문제 생성 폼 |
| `/contests/:contestId/manage/problems/:contestProblemId/edit` | AppLayout + ContestLayout | ContestProblemEditPage | `isStaff=true` 사용자만 사용하는 대회 문제 수정/삭제 폼 |
| `/problems` | AppLayout + ProtectedRoute | ProblemsPage | 인증된 문제 목록 |
| `/problems/:id` | AppLayout | Redirect | `/problems/:id/submit`으로 즉시 이동 |
| `/problems/:id/submit` | ProblemWorkspaceLayout + ProtectedRoute | SubmitPage | 인증된 제출 작업 화면 |
| `/submissions` | AppLayout + ProtectedRoute | SubmissionsPage | 인증된 내 제출 기록 |
| `/ranking` | AppLayout + ProtectedRoute | RankingPage | 랭킹 준비 상태 |
| `/admin/problems/new` | AppLayout + ProtectedRoute requiredRole=ADMIN | AdminProblemNewPage | `ADMIN` 세션만 접근 가능한 문제 생성 폼 |
| `/admin/problems/:problemNumber/edit` | AppLayout + ProtectedRoute | AdminProblemEditPage | 인증 사용자가 접근할 수 있으나 백엔드가 문제 생성자만 전체 정의 조회와 수정을 허용 |

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
| 2026-05-17 | AuthProvider가 access token 만료 60초 전 자동 refresh를 예약한다. | 사용자가 문제 풀이 중 오래 코드만 작성하면 보호 API 호출이 없어 access token이 만료될 수 있기 때문이다. | 로그인 세션이 있으면 자동 timer가 refresh token rotation을 수행하고, 성공 시 다음 만료 시각 기준으로 다시 예약한다. |
| 2026-05-09 | 문제 생성과 수정 폼을 `ProblemDefinitionForm`으로 공유한다. | 백엔드의 생성/수정 request DTO가 같은 문제 정의 구조를 사용하기 때문이다. | 생성 페이지는 `POST /api/v1/problems`, 수정 페이지는 definition 조회 후 `PATCH /api/v1/problems/{problemNumber}`를 호출한다. |
| 2026-05-10 | 문제 수정 진입은 본인이 출제한 문제에만 노출한다. | 관리자라도 본인이 출제한 문제가 아니면 수정할 수 없어야 한다는 요구사항을 반영하기 위함. | 문제 목록 DTO의 `createdByServiceUsername`과 auth session의 `serviceUsername`이 일치할 때만 수정 버튼을 표시하고, 직접 접근은 definition API의 403으로 차단한다. |
| 2026-05-10 | 제출 화면의 문제 지문은 Markdown과 LaTeX 수식으로 렌더링한다. | 문제 본문은 Markdown 문법과 `$...$`, `$$...$$` 수식을 포함할 수 있으므로 풀이 사용자는 원문이 아니라 렌더링된 지문을 봐야 한다. | `SubmitPage`는 `MarkdownContent`를 사용해 `statementMarkdown`을 표시하고, `MarkdownContent`는 `react-katex`로 수식을 렌더링한다. |
| 2026-05-10 | 문제 생성/수정 폼에 checker 사용 선택과 작성 가이드를 표시한다. | 출제자가 기본 출력 비교와 커스텀 checker 사용 여부를 명확히 구분하고, C++17 checker 실행 규약과 exit code 판정 방식을 프론트에서 확인할 수 있어야 한다. | `ProblemDefinitionForm`은 커스텀 checker 체크박스를 제공하고, 선택한 경우에만 `CheckerGuide`와 checker 코드 입력란을 표시한다. |
| 2026-05-10 | 제출 화면의 `내 제출` 탭에서 현재 문제의 내 제출 기록을 표시한다. | 풀이 중인 사용자가 별도 제출 기록 페이지로 이동하지 않고 해당 문제의 제출 이력을 확인해야 한다. | `SubmitPage`는 `useMySubmissions`에 `problemNumber` 필터와 refresh key를 전달하고, `ProblemSubmissionHistory`는 목록/빈 상태/pagination 표시만 담당한다. |
| 2026-05-14 | 서브테스크 문제는 문제 정의 폼과 제출 결과 패널에서 지원한다. | 백엔드가 문제별 선택 서브테스크와 서브테스크별 부분 점수 결과를 API 계약에 추가했기 때문이다. | `ProblemDefinitionForm`은 일반 실제 테스트 케이스와 서브테스크 테스트 케이스 중 하나를 전송하고, `SubmitPage`는 문제 서브테스크 메타데이터와 제출별 `subtaskResults`를 표시한다. |
| 2026-05-14 | 라이트/다크 모드는 전역 ThemeProvider가 관리한다. | 개발자가 장시간 사용하는 온라인 저지 UI에서 눈 피로를 줄이기 위해 사용자 선택 색상 모드가 필요하다. | `ThemeModeToggle`은 Header에서 모드를 전환하고, `ThemeProvider`는 `kpsc_oj_theme_mode` localStorage 값과 document `data-theme` 속성을 관리한다. |
| 2026-05-14 | Markdown 수식 렌더링은 `MarkdownContent`에서 LaTeX delimiter를 정규화한다. | `remark-math`는 `$...$` 중심 문법을 처리하며, Markdown parser가 `\(...\)`와 `\[...\]`를 일반 escape로 소비해 일부 수식이 텍스트로 남을 수 있기 때문이다. | `MarkdownContent`가 code fence와 inline code를 보존한 뒤 `\(...\)`, `\[...\]`, 한 줄짜리 독립 `$$...$$`를 `remark-math`가 인식하는 형태로 변환한다. |
| 2026-05-14 | 서브테스크 선행 관계는 문제 정의 폼에서 입력한다. | 백엔드 문제 생성/수정 계약에 `subtasks[].prerequisiteSubtaskOrders`가 추가되어 서브테스크 점수 획득 조건을 표현해야 한다. | `ProblemDefinitionForm`은 선행 order 입력을 검증해 request DTO로 변환하고, `SubmitPage`는 문제 상세의 선행 order 메타데이터를 표시한다. |
| 2026-05-15 | Contest 페이지는 일반 Problem 흐름과 분리된 Contest 전용 타입, service, hook, layout을 사용한다. | ContestProblem, ContestParticipant, Scoreboard는 일반 문제/제출 계약과 필드 및 권한이 다르기 때문이다. | Contest home/list/manage 라우트는 `ContestLayout`과 `contestService`를 사용하고, 운영진 UI는 `GET /api/v1/contests/{contestId}`의 `isStaff`를 기준으로 표시한다. |
| 2026-05-17 | 대회 문제 상세/제출 화면은 ContestProblemWorkspaceLayout으로 분리한다. | 대회 제출도 일반 문제 제출처럼 문제 지문과 코드 editor를 동시에 크게 사용해야 한다. | `/contests/:contestId/problems/:contestProblemId` 라우트는 AppLayout의 max-width, sidebar, Footer 제약을 벗어나고, ContestProblemDetailPage 내부 패널만 스크롤한다. |
