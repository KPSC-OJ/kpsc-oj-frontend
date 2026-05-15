# Contest API - kpsc-oj-backend

프론트 `/contests/{contestId}` 하네스가 참조하는 Contest 기능 계약이다.

## 기능 개요
- Contest 생성/수정/삭제와 ContestStaff 지정은 백엔드 Thymeleaf Admin 페이지에서 수행한다.
- 실제 대회 조회, 참가, ContestProblem 관리, Submission, Scoreboard는 REST API로 제공한다.
- ContestProblem은 일반 `Problem`과 분리된 대회 전용 문제다.
- Contest Submission은 `submissions.contest_id`, `submissions.contest_problem_id`를 사용하고 일반 문제 제출은 기존 `submissions.problem_id`를 사용한다.
- HIDDEN testcase는 문제 상세 API에 절대 포함하지 않는다.

## 권한 정책
- 전체 `ADMIN` 계정은 모든 ContestProblem 생성/수정/삭제, 전체 제출 조회가 가능하다.
- Thymeleaf `/admin/**` 접근은 기존 환경 변수 기반 admin-session만 사용한다.
- `ContestStaff`는 Thymeleaf Admin 페이지 권한이 아니다. 프론트 `/contests/{contestId}` 내부 관리 기능에서만 해당 contest에 대해 유효하다.
- `ContestStaff.role`은 `OWNER`, `MANAGER`이며 현재 둘 다 ContestProblem 관리 권한을 가진다.
- `PUBLIC` contest는 비로그인 조회가 가능하다.
- `PRIVATE` contest는 ADMIN, ContestStaff, ContestParticipant만 조회 가능하다.
- `POST`, `PATCH`, `DELETE`, 제출/참가/제출 목록 API는 JWT access token이 필요하다.

## Admin Thymeleaf 페이지
| Method | URL | Auth | 설명 |
| --- | --- | --- | --- |
| GET | `/admin/contests` | admin-session | Contest 목록 조회 |
| GET | `/admin/contests/new` | admin-session | Contest 생성 화면 |
| POST | `/admin/contests` | admin-session | Contest 생성 |
| GET | `/admin/contests/{contestId}/edit` | admin-session | Contest 수정 및 staff 관리 화면 |
| POST | `/admin/contests/{contestId}` | admin-session | Contest 수정 |
| POST | `/admin/contests/{contestId}/delete` | admin-session | Contest 삭제 |
| POST | `/admin/contests/{contestId}/staff` | admin-session | ContestStaff 추가 |
| POST | `/admin/contests/{contestId}/staff/{staffId}/delete` | admin-session | ContestStaff 제거 |

## Enum 값
- `Contest.visibility`: `PUBLIC`, `PRIVATE`
- `Contest.registrationMode`: `OPEN`, `STAFF_ONLY`
- `Contest.status`: `DRAFT`, `SCHEDULED`, `RUNNING`, `ENDED`
- `ContestStaff.role`: `OWNER`, `MANAGER`
- `ContestProblemTestCase.kind`: `EXAMPLE`, `HIDDEN`
- `ContestProblem.solvedStatus`: `NOT_SUBMITTED`, `ATTEMPTED`, `SOLVED`
- `Submission.language`: `cpp17`, `python3`
- `Submission.status`: 기존 제출 상태 enum과 동일

## 에러 응답
모든 Contest REST API 오류 응답은 다음 형태다.

```json
{
  "code": "CONTEST_NOT_FOUND",
  "message": "Contest was not found.",
  "details": null
}
```

필수 에러 코드:
- `CONTEST_NOT_FOUND`: contestId가 존재하지 않음.
- `CONTEST_NOT_RUNNING`: 대회가 제출 가능한 `RUNNING` 상태가 아님.
- `CONTEST_NOT_JOINED`: STAFF_ONLY 대회에서 참가하지 않은 사용자가 제출함.
- `CONTEST_FORBIDDEN`: PRIVATE 조회 또는 STAFF_ONLY 참가 등 contest 권한 없음.
- `CONTEST_PROBLEM_NOT_FOUND`: contestProblemId가 해당 contest에 존재하지 않음.
- `CONTEST_STAFF_REQUIRED`: ContestStaff 또는 ADMIN 권한 필요.
- `VALIDATION_ERROR`: request body, enum, 시간 범위, 테스트 케이스 입력 오류.
- `AUTHENTICATION_FAILED`: 인증 필요 또는 JWT/session 오류.
- `UNSUPPORTED_LANGUAGE`: `language`가 `cpp17`, `python3`이 아님.

## REST API

### GET `/api/v1/contests`
- Auth: public. Authorization header가 있으면 PRIVATE contest 표시 여부 판단에 사용한다.
- Response body: array
  - `id`: string UUID, required.
  - `title`: string, required.
  - `description`: string, required.
  - `startTime`: string datetime, required.
  - `endTime`: string datetime, required.
  - `status`: string enum, required. 현재 시간 기준 계산값.
  - `visibility`: string enum, required.

### GET `/api/v1/contests/{contestId}`
- Auth: public.
- Response body:
  - `id`, `title`, `description`, `startTime`, `endTime`, `visibility`, `registrationMode`, `status`
  - `isStaff`: boolean, required. 현재 사용자가 ADMIN 또는 ContestStaff이면 `true`.
  - `isParticipant`: boolean, required.
- Error cases: `CONTEST_NOT_FOUND`, `CONTEST_FORBIDDEN`.

### GET `/api/v1/contests/{contestId}/problems`
- Auth: public.
- Response body: array
  - `id`: string UUID, ContestProblem id.
  - `label`: string, required. 예: `A`.
  - `title`: string, required.
  - `score`: number, required.
  - `displayOrder`: number, required.
  - `solvedStatus`: string enum, required. 비로그인은 `NOT_SUBMITTED`.

### GET `/api/v1/contests/{contestId}/problems/{contestProblemId}`
- Auth: public.
- Response body:
  - `id`, `label`, `title`
  - `statement`: string, required.
  - `inputDescription`: string, required.
  - `outputDescription`: string, required.
  - `constraints`: string, required.
  - `timeLimitMillis`: number, required.
  - `memoryLimitKb`: number, required.
  - `score`: number, required.
  - `displayOrder`: number, required.
  - `exampleTestCases`: array, required.
  - `exampleTestCases[].caseOrder`: number.
  - `exampleTestCases[].input`: string.
  - `exampleTestCases[].output`: string.
- HIDDEN testcase는 응답하지 않는다.

### POST `/api/v1/contests/{contestId}/join`
- Auth: authenticated.
- 동작: `OPEN` 대회 참가 처리. 이미 참가한 경우도 성공.
- `STAFF_ONLY` 대회는 ADMIN 또는 ContestStaff만 직접 참가 가능하다.
- Request body: 없음.
- Response body:
  - `contestId`: string UUID.
  - `joined`: boolean, 항상 성공 시 `true`.

### POST `/api/v1/contests/{contestId}/problems`
- Auth: authenticated, ADMIN 또는 ContestStaff.
- Request body:
  - `label`: string, required.
  - `title`: string, required.
  - `statement`: string, required.
  - `inputDescription`: string, required.
  - `outputDescription`: string, required.
  - `constraints`: string, required.
  - `timeLimitMillis`: number, required, positive.
  - `memoryLimitKb`: number, required, positive.
  - `score`: number, required, positive.
  - `displayOrder`: number, required, positive.
  - `testCases`: array, required, 최소 1개 HIDDEN 포함.
  - `testCases[].caseOrder`: number, required, positive.
  - `testCases[].kind`: string enum, `EXAMPLE` 또는 `HIDDEN`.
  - `testCases[].inputText`: string, required, 빈 문자열 가능.
  - `testCases[].outputText`: string, required, 빈 문자열 가능.
- Response body:
  - `id`, `contestId`, `label`, `title`, `score`, `displayOrder`
  - `exampleTestCaseCount`, `hiddenTestCaseCount`

### PATCH `/api/v1/contests/{contestId}/problems/{contestProblemId}`
- Auth: authenticated, ADMIN 또는 ContestStaff.
- Request/Response body: `POST /problems`와 동일. 기존 testcase set은 요청 내용으로 교체된다.

### DELETE `/api/v1/contests/{contestId}/problems/{contestProblemId}`
- Auth: authenticated, ADMIN 또는 ContestStaff.
- Response: `204 No Content`.
- 현재 구현은 실제 삭제다. 기존 제출이 연결된 문제는 DB 제약에 따라 삭제가 실패할 수 있으므로 프론트는 제출이 있는 문제 삭제를 제한하는 UX를 둔다.

### POST `/api/v1/contests/{contestId}/problems/{contestProblemId}/submissions`
- Auth: authenticated.
- 동작:
  - 대회 시작 전 또는 종료 후 제출 불가.
  - 참가자가 아니면 제출 불가.
  - 단 `OPEN` 대회는 제출 시 자동 참가 처리한다.
  - `STAFF_ONLY` 대회는 참가하지 않은 일반 유저 제출을 거부한다.
  - 기존 judge queue를 재사용해 `QUEUED` 제출을 생성한다.
- Request body:
  - `language`: string, required, `cpp17` 또는 `python3`.
  - `sourceCode`: string, required, 빈 문자열 불가, 최대 10000자.
- Response body:
  - `id`: string UUID, submission id.
  - `contestId`: string UUID.
  - `contestProblemId`: string UUID.
  - `problemLabel`: string.
  - `language`: string.
  - `status`: string, 생성 직후 `QUEUED`.
  - `submittedAt`: string datetime.

### GET `/api/v1/contests/{contestId}/submissions/me`
- Auth: authenticated.
- Response body: array
  - `id`, `contestProblemId`, `problemLabel`, `submitterServiceUsername`
  - `language`, `status`, `scorePercentage`, `submittedAt`

### GET `/api/v1/contests/{contestId}/submissions`
- Auth: authenticated, ADMIN 또는 ContestStaff.
- Response body: `submissions/me`와 같은 item array. 해당 contest 전체 제출을 최신순으로 반환한다.

### GET `/api/v1/contests/{contestId}/scoreboard`
- Auth: public.
- Response body:
  - `contestId`: string UUID.
  - `problems`: array of `{id,label,title,score,displayOrder,solvedStatus}`. `solvedStatus`는 scoreboard problem header에서는 `NOT_SUBMITTED`.
  - `rows`: array.
  - `rows[].participantId`: string UUID, user account id.
  - `rows[].serviceUsername`: string.
  - `rows[].solvedCount`: number.
  - `rows[].penalty`: number, minutes.
  - `rows[].lastAcceptedAt`: string datetime or null.
  - `rows[].cells`: array.
  - `cells[].contestProblemId`: string UUID.
  - `cells[].problemLabel`: string.
  - `cells[].attempts`: number. solved이면 첫 AC까지의 시도 수, unsolved이면 전체 시도 수.
  - `cells[].solved`: boolean.
  - `cells[].penalty`: number or null.
  - `cells[].firstSolved`: boolean.

## 스코어보드 계산 방식
- 정렬: `solvedCount desc`, `penalty asc`, `lastAcceptedAt asc`, `serviceUsername asc`.
- 문제별 solved는 첫 `ACCEPTED` 제출 기준이다.
- 문제별 penalty:
  - `accepted submission time - contest start time`을 분 단위로 계산.
  - 첫 AC 전 오답 제출 수마다 20분 추가.
  - `penalty = acceptedMinutes + wrongBeforeAccepted * 20`.
- 전체 penalty는 solved cell penalty 합이다.
- `firstSolved`는 해당 문제의 전체 참가자 중 가장 이른 AC 제출을 가진 참가자 cell에만 `true`.

## 프론트 구현 시 주의사항
- ContestStaff는 `/admin/**` 접근 권한이 아니다. 프론트 내부 관리 버튼 노출은 `isStaff=true` 또는 별도 ADMIN 판단으로 처리한다.
- `GET` 조회 API는 public이지만 권한 정보는 Authorization header가 있을 때만 정확하다.
- 문제 상세에는 HIDDEN testcase가 없으므로 제출/채점용 testcase 편집 화면은 staff용 문제 생성/수정 API의 request body를 별도로 관리해야 한다.
- `DELETE ContestProblem`은 실제 삭제이므로 제출이 있는 문제에는 실패할 수 있다.
- `status`는 응답 시점의 계산값이다. `DRAFT`는 저장 상태가 DRAFT일 때 유지되고, 그 외 상태는 현재 시간과 start/end 기준으로 계산된다.
