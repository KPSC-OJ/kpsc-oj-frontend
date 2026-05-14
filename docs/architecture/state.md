# 상태 문서 - kpsc-oj-frontend

중요한 상태 모델과 상태 전이를 이 문서에 기록한다.

## 상태 종류
| State | Owner | Source of Truth | Persisted | Notes |
| --- | --- | --- | --- | --- |
| Problem list state | `useProblemList` | Backend API | No | `GET /api/v1/problems` 응답에서 변환한 문제 목록, pagination 상태, 현재 세션 기준 수정 가능 여부 |
| Problem detail state | `useProblemDetail` | Backend API | No | `GET /api/v1/problems/{problemNumber}` 응답에서 변환한 제출 화면 문제 상세와 서브테스크 메타데이터 및 선행 관계 |
| Problem definition state | `useProblemDefinition` | Backend API | No | `GET /api/v1/problems/{problemNumber}/definition` 응답에서 변환한 수정 화면 문제 정의와 서브테스크 정의 및 선행 관계 |
| Submission list state | `useMySubmissions` | Backend API | No | `GET /api/v1/submissions/me` 응답에서 변환한 내 제출 목록과 pagination 상태. 제출 작업 화면에서는 `problemNumber` 필터와 refresh key로 현재 문제의 내 제출 목록을 재조회한다. |
| Created submission state | `SubmitPage` | React state | No | `POST /api/v1/submissions` 성공 응답 표시 상태 |
| Submission detail state | `useSubmissionDetail` | Backend API | No | `GET /api/v1/submissions/{submissionId}` 응답에서 변환한 제출 상세, 전체 점수, 서브테스크 채점 결과 상태 |
| Submit panel UI state | `SubmitPage` | React state | No | 제출 작업 화면 좌측 패널의 `문제 설명`/`내 제출` 탭, 문제별 제출 목록 page, 제출 성공 후 목록 refresh key |
| Route state | `react-router-dom` | browser location | No | URL path와 `:id` 라우트 파라미터 |
| Example copy feedback state | `ProblemExampleBlock` | React state | No | 예제 Input/Output 복사 버튼의 idle/copied/failed 표시 상태 |
| Problem definition form state | `ProblemDefinitionForm` | React state | No | 문제 생성/수정 request DTO로 변환되는 제목, 태그, 제한, Markdown 본문, 커스텀 checker 사용 여부와 optional checker code, 예제/일반 실제 테스트 케이스, 서브테스크 사용 여부, 서브테스크별 테스트 케이스와 선행 order 입력값 |
| Problem mutation result state | `ProblemDefinitionForm` | React state | No | 문제 생성/수정 성공 응답과 오류 메시지 표시 상태 |
| Code editor UI state | `SubmitPage` | React state | No | Monaco Editor의 선택 언어와 현재 소스 코드 |
| Theme mode state | `ThemeProvider` | React state + localStorage | Yes | 라이트/다크 모드 선택값. `kpsc_oj_theme_mode` localStorage key와 document `data-theme` 속성으로 반영한다. |
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
| `SubmissionStatus` | `PARTIAL_ACCEPTED` | 서브테스크 문제에서 일부 점수 획득 | Yes | 종료 상태 |
| `SubmissionStatus` | `WRONG_ANSWER` | 오답 | Yes | 종료 상태 |
| `SubmissionStatus` | `COMPILE_ERROR` | 컴파일 실패 | Yes | 종료 상태 |
| `SubmissionStatus` | `RUNTIME_ERROR` | 런타임 실패 | Yes | 종료 상태 |
| `SubmissionStatus` | `TIME_LIMIT_EXCEEDED` | 시간 제한 초과 | Yes | 종료 상태 |
| `SubmissionStatus` | `MEMORY_LIMIT_EXCEEDED` | 메모리 제한 초과 | Yes | 종료 상태 |
| `SubmissionStatus` | `JUDGE_ERROR` | judge 또는 채점기 오류 | Yes | 종료 상태 |
| `SubmissionStatus` | `INTERNAL_ERROR` | 채점 내부 오류 | Yes | 종료 상태 |
| `SubmissionStatus` | string | 백엔드가 반환하는 제출 상태 enum | Depends | 프론트엔드는 알 수 없는 상태도 원문으로 표시한다. |
| `SubmissionSubtaskResultStatus` | `ACCEPTED` | 해당 서브테스크의 HIDDEN 테스트 케이스 모두 통과 | Yes | 서브테스크 결과 배지로 표시 |
| `SubmissionSubtaskResultStatus` | `FAILED` | 해당 서브테스크의 HIDDEN 테스트 케이스 중 하나 이상 실패 | Yes | 서브테스크 결과 배지로 표시 |
| `ThemeMode` | `light` | 화이트 모드 | No | 기본 밝은 UI. 저장값이 없고 시스템 다크 선호가 아니면 사용 |
| `ThemeMode` | `dark` | 다크 모드 | No | 어두운 UI. 저장값이 없으면 시스템 다크 선호를 초기값으로 사용할 수 있음 |
| `AuthUserRole` | `USER` | 일반 사용자 | No | 문제 생성 화면 진입 불가 |
| `AuthUserRole` | `ADMIN` | 관리자 | No | 문제 생성 화면 진입 가능 |

## 상태 전이 규칙
| From | To | Trigger | Validator | Side Effects |
| --- | --- | --- | --- | --- |
| none | `QUEUED` | 사용자가 `POST /api/v1/submissions`로 제출 생성 | Backend service | 생성된 제출 ID와 제출 시각을 화면에 표시한다. |
| `QUEUED`, `RUNNING`, `JUDGING`, `PENDING` | terminal status | 백엔드 비동기 채점 완료 후 상세 조회 | Backend processor | `useSubmissionDetail`이 2.5초 간격으로 상세 조회를 반복해 결과를 갱신한다. 서브테스크 문제는 `totalScore`와 `subtaskResults`로 획득 점수를 표시한다. |
| `light` | `dark` | 사용자가 Header 테마 버튼 클릭 | ThemeProvider | localStorage와 document `data-theme`를 갱신하고 Monaco editor를 dark theme로 표시한다. |
| `dark` | `light` | 사용자가 Header 테마 버튼 클릭 | ThemeProvider | localStorage와 document `data-theme`를 갱신하고 Monaco editor를 light theme로 표시한다. |
| persisted auth session | refreshed auth session | access token 만료 60초 전 또는 보호 API 401 응답 | `POST /api/v1/auth/refresh` | 새 access token, refresh token, 만료 시각을 localStorage에 저장한다. |
| persisted auth session | none | refresh token 검증 실패, 만료, 폐기된 session, rotation 불일치 | Backend auth API | localStorage auth session을 제거하고 로그인 화면으로 돌아갈 수 있게 한다. |

## 인증 상태
- Auth session은 `kpsc_oj_auth_session` localStorage key에 저장한다.
- 저장 필드: `accessToken`, `refreshToken`, `tokenType`, `expiresInSeconds`, `expiresAtEpochMs`, `serviceUsername`, `role`.
- 저장된 session으로 앱을 시작했을 때 access token이 이미 refresh 기준 시각을 지났으면 `AuthProvider`가 `POST /api/v1/auth/refresh`를 한 번 시도한다.
- access token 만료 60초 전부터 보호 API 호출은 `POST /api/v1/auth/refresh`로 새 access token과 refresh token을 먼저 발급받는다.
- 보호 API가 401 또는 `AUTHENTICATION_FAILED`를 반환하면 refresh token으로 한 번 갱신한 뒤 원래 요청을 한 번 재시도한다.
- 여러 보호 API 호출이 동시에 refresh를 필요로 하면 `AuthProvider`는 하나의 refresh 요청만 수행하고 그 결과를 공유한다.
- refresh가 400/401 또는 `INVALID_REQUEST`/`AUTHENTICATION_FAILED`로 실패하면 저장된 session을 제거한다.
- access token payload의 `role`, `roles`, `authority`, `authorities`, `scope` claim에서 `ADMIN` 권한을 우선 정규화한다. claim에 role이 없으면 인증 응답 또는 기존 localStorage session의 role을 사용하고, 그래도 없으면 `USER`로 정규화한다.
- `ADMIN`이 아닌 session은 문제 생성 nav와 `/admin/problems/new` 화면을 볼 수 없다.
- 문제 수정 진입은 role만으로 결정하지 않고 문제 목록의 `createdByServiceUsername`과 현재 session의 `serviceUsername`이 일치할 때만 표시한다. 직접 URL 접근과 저장 요청은 백엔드의 문제 생성자 검증으로 최종 차단한다.
- `POST /api/v1/auth/google` 응답이 `requiresSignup=true`이면 기존 local session을 제거하고 pending signup state만 유지한다.
- `POST /api/v1/auth/signup` 성공 응답의 token set을 `AuthSession`으로 변환하면 로그인 완료 상태가 된다.
- logout은 local session을 먼저 제거하고 `POST /api/v1/auth/logout`으로 백엔드 session 폐기를 요청한다.

## 테마 상태
- Theme mode는 `kpsc_oj_theme_mode` localStorage key에 저장한다.
- 저장 값은 `light` 또는 `dark`만 허용한다.
- 저장 값이 없으면 브라우저의 `prefers-color-scheme: dark` 결과를 초기값으로 사용하고, 그 외에는 `light`를 사용한다.
- `ThemeProvider`는 현재 mode를 document root의 `data-theme` 속성과 `dark` class에 반영한다.
- 일반 UI 색상은 `src/index.css`의 `data-theme="dark"` 전역 오버라이드로 전환하고, Monaco Editor는 `CodeEditor`가 `vs`/`vs-dark` theme를 선택한다.
