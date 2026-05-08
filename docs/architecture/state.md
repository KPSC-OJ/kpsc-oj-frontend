# 상태 문서 - kpsc-oj-frontend

중요한 상태 모델과 상태 전이를 이 문서에 기록한다.

## 상태 종류
| State | Owner | Source of Truth | Persisted | Notes |
| --- | --- | --- | --- | --- |
| Problem list state | `useProblemList` | Backend API | No | `GET /api/v1/problems` 응답에서 변환한 문제 목록과 pagination 상태 |
| Problem detail state | `useProblemDetail` | Backend API | No | `GET /api/v1/problems/{problemNumber}` 응답에서 변환한 제출 화면 문제 상세 |
| Submission list state | `useMySubmissions` | Backend API | No | `GET /api/v1/submissions/me` 응답에서 변환한 내 제출 목록과 pagination 상태 |
| Created submission state | `SubmitPage` | React state | No | `POST /api/v1/submissions` 성공 응답 표시 상태 |
| Submission detail state | `useSubmissionDetail` | Backend API | No | `GET /api/v1/submissions/{submissionId}` 응답에서 변환한 제출 상세와 채점 결과 상태 |
| Route state | `react-router-dom` | browser location | No | URL path와 `:id` 라우트 파라미터 |
| Problem creation form state | `AdminProblemNewPage` | React state | No | 문제 생성 request DTO로 변환되는 제목, 태그, 제한, Markdown 본문, optional checker code, 예제/실제 테스트 케이스 입력값 |
| Problem creation result state | `AdminProblemNewPage` | React state | No | 문제 생성 성공 응답과 오류 메시지 표시 상태 |
| Code editor UI state | `SubmitPage` | React state | No | Monaco Editor의 선택 언어와 현재 소스 코드 |
| Auth session state | `AuthProvider` | React state + localStorage | Yes | access token, refresh token, token type, 만료 시각, service username, role |
| Pending signup state | `AuthProvider` | React state | No | `requiresSignup=true` 로그인 응답에서 생성되는 signup token과 검증된 Google email |

## Enum 값
| Enum | Value | Meaning | Terminal | Notes |
| --- | --- | --- | --- | --- |
| `SubmissionLanguageDto` | `cpp17` | C++17 제출 언어 | No | `POST /api/v1/submissions` 허용 값 |
| `SubmissionLanguageDto` | `python3` | Python 3 제출 언어 | No | `POST /api/v1/submissions` 허용 값 |
| `SubmissionStatus` | `QUEUED` | 제출 생성 직후 채점 대기 | No | 백엔드 생성 응답에서 명시된 현재 초기 상태 |
| `SubmissionStatus` | `RUNNING` | 채점 실행 중 | No | 상세 조회 polling 대상 |
| `SubmissionStatus` | `JUDGING` | 채점 진행 중 | No | 상세 조회 polling 대상 |
| `SubmissionStatus` | `PENDING` | 채점 전 대기 또는 준비 중 | No | 상세 조회 polling 대상 |
| `SubmissionStatus` | `ACCEPTED` | 모든 테스트 통과 | Yes | 종료 상태 |
| `SubmissionStatus` | `WRONG_ANSWER` | 오답 | Yes | 종료 상태 |
| `SubmissionStatus` | `COMPILE_ERROR` | 컴파일 실패 | Yes | 종료 상태 |
| `SubmissionStatus` | `RUNTIME_ERROR` | 런타임 실패 | Yes | 종료 상태 |
| `SubmissionStatus` | `TIME_LIMIT_EXCEEDED` | 시간 제한 초과 | Yes | 종료 상태 |
| `SubmissionStatus` | `MEMORY_LIMIT_EXCEEDED` | 메모리 제한 초과 | Yes | 종료 상태 |
| `SubmissionStatus` | `INTERNAL_ERROR` | 채점 내부 오류 | Yes | 종료 상태 |
| `SubmissionStatus` | string | 백엔드가 반환하는 제출 상태 enum | Depends | 프론트엔드는 알 수 없는 상태도 원문으로 표시한다. |
| `AuthUserRole` | `USER` | 일반 사용자 | No | 문제 생성 화면 진입 불가 |
| `AuthUserRole` | `ADMIN` | 관리자 | No | 문제 생성 화면 진입 가능 |

## 상태 전이 규칙
| From | To | Trigger | Validator | Side Effects |
| --- | --- | --- | --- | --- |
| none | `QUEUED` | 사용자가 `POST /api/v1/submissions`로 제출 생성 | Backend service | 생성된 제출 ID와 제출 시각을 화면에 표시한다. |
| `QUEUED`, `RUNNING`, `JUDGING`, `PENDING` | terminal status | 백엔드 비동기 채점 완료 후 상세 조회 | Backend processor | `useSubmissionDetail`이 2.5초 간격으로 상세 조회를 반복해 결과를 갱신한다. |

## 인증 상태
- Auth session은 `kpsc_oj_auth_session` localStorage key에 저장한다.
- 저장 필드: `accessToken`, `refreshToken`, `tokenType`, `expiresInSeconds`, `expiresAtEpochMs`, `serviceUsername`, `role`.
- access token 만료 시 저장된 session을 제거한다.
- access token payload의 `role`, `roles`, `authority`, `authorities`, `scope` claim에서 `ADMIN` 권한을 우선 정규화한다. claim에 role이 없으면 인증 응답 또는 기존 localStorage session의 role을 사용하고, 그래도 없으면 `USER`로 정규화한다.
- `ADMIN`이 아닌 session은 문제 생성 nav와 `/admin/problems/new` 화면을 볼 수 없다.
- `POST /api/v1/auth/google` 응답이 `requiresSignup=true`이면 기존 local session을 제거하고 pending signup state만 유지한다.
- `POST /api/v1/auth/signup` 성공 응답의 token set을 `AuthSession`으로 변환하면 로그인 완료 상태가 된다.
- refresh token 재발급 endpoint가 아직 정의되지 않았으므로 자동 refresh는 수행하지 않는다.
- logout은 local session을 먼저 제거하고 `POST /api/v1/auth/logout`으로 백엔드 session 폐기를 요청한다.
