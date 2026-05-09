# 컴포넌트 및 모듈 문서 - kpsc-oj-frontend

프로젝트 단위를 어떻게 분리하고 재사용하는지 기록한다.

## 분리 기준
- 공통 단위: `components/common`은 특정 도메인에 묶이지 않는 Button, Badge, Card만 담당한다.
- 전역 레이아웃 단위: `components/layout`은 모든 layout에서 공유하는 SiteHeader, SiteFooter를 담당한다.
- 인증 단위: `components/auth`는 Google Identity Services 버튼처럼 인증 UI 표시와 SDK script 경계를 담당한다.
- 라우트 보호 단위: `components/auth/ProtectedRoute.tsx`는 인증 세션과 필요한 role이 있는 화면의 진입 경계를 담당한다.
- 기능 전용 단위: `components/problem`, `components/submission`은 문제/제출 표시 책임만 가진다.
- Layout 단위: `layouts`는 라우트별 화면 구조와 내비게이션을 담당한다.
- Page 단위: `pages`는 라우트 파라미터 처리, hook 호출, 컴포넌트 조립을 담당한다.
- Hook 단위: `hooks`는 page에서 필요한 비동기 유스케이스와 service 호출을 캡슐화한다.
- Service/Application 단위: `src/services/authService.ts`는 백엔드 인증 DTO를 `AuthLoginResult` 또는 `AuthSession`으로 변환하고 token refresh API를 호출한다. `src/services/problemService.ts`와 `src/services/submissionService.ts`는 문제/제출 API 호출을 담당한다.
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
| `GoogleIdentityButton` | auth | onCredential | Google Identity Services script 로드와 credential callback 처리 |
| `ProtectedRoute` | auth | children, requiredRole | 인증 세션이 없으면 로그인 화면으로 이동하고, 필요한 role이 없으면 보호 화면을 조립하지 않음 |
| `SiteHeader` | layout | none | 전역 브랜드, 주요 내비게이션, 시작 액션 표시 |
| `SiteFooter` | layout | none | 전역 하단 브랜드와 주요 링크 표시 |
| `CodeEditor` | problem | language, value, onChange | Monaco 기반 코드 입력 UI |
| `ProblemTable` | problem | `ProblemSummary[]` | 문제 목록 테이블 표시 |
| `SubmissionStatusBadge` | submission | `SubmissionStatus` | 제출 상태 색상 매핑 |

## React 메모
- 컴포넌트 안에서 fetch/axios 호출을 직접 수행하지 않는다.
- 복잡한 상태 전이는 hook 또는 store action으로 분리한다.
- API 타입과 UI view model의 변환 위치는 추후 service/data 경계에 둔다.
- 인증 API 호출, session role 정규화, access token 갱신은 `src/services/authService.ts`와 `src/stores/authStore.tsx`를 통해서만 수행한다. role은 access token payload claim을 우선 확인하고, 없으면 token 응답 또는 저장된 session role을 사용한다.
- 보호 API를 호출하는 hook은 `requestWithFreshSession()`으로 유효한 access token을 받은 뒤 domain service를 호출한다.
- Header, AppLayout, ProblemsPage는 auth store의 `isAdmin` 값으로 문제 생성 진입점을 숨긴다.
- 로그인 응답의 `requiresSignup` 분기는 `authService`와 auth store 경계에서 처리하고, `LoginPage`는 로그인/회원가입 화면 상태 조립만 담당한다.
- `LoginPage`는 실제 서비스 사용자를 기준으로 구성하며 backend URL, OAuth client id, raw ID token 입력 같은 개발자용 진단 UI를 표시하지 않는다.
- 문제 조회/생성 API 호출은 `Page -> problem hook -> auth store token refresh -> problemService -> Backend API` 흐름을 따른다.
- 문제 생성 폼의 optional checker code는 `CreateProblemRequestDto.checkerCode`로만 전달하며, 공백이면 요청 body에서 생략한다.
- 제출 조회/생성/상세 API 호출은 `Page -> submission hook -> auth store token refresh -> submissionService -> Backend API` 흐름을 따른다.
- 제출 생성 후 상세 결과는 `useSubmissionDetail`이 `SubmissionDetail` view model로 변환하며, 채점 진행 중 상태에서는 polling한다.
