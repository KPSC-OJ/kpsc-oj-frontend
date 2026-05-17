# API 명세 - kpsc-oj-backend

정확한 API 계약을 이 문서에 기록한다.

## 엔드포인트 템플릿
### METHOD /path
- 설명:
- 인증:
- Path params:
- Query params:
- Request body:
- Response body:
- Status codes:
- Error cases:

## 인증 계약
- 인증 방식: Google ID token 검증 후 서비스 자체 JWT 발급.
- 허용 Google email domain: `kookmin.ac.kr`.
- 보호 API header: `Authorization: Bearer {accessToken}`.
- Access token TTL: 15분.
- Refresh token TTL: 14일.
- Signup token TTL: 10분.
- Logout은 access token에 포함된 session id를 기준으로 `auth_sessions.revoked_at`을 기록한다.
- Refresh는 refresh token에 포함된 session id를 기준으로 active session을 확인하고, 저장된 `refresh_token_hash`와 요청 token hash가 일치할 때만 새 access/refresh token을 발급한다.
- Refresh 성공 시 refresh token rotation을 수행하며 `auth_sessions.refresh_token_hash`와 `auth_sessions.expires_at`을 새 refresh token 기준으로 갱신한다. 이전 refresh token은 즉시 무효화된다.

## 시간 계약
- 대회, 제출, 스코어보드처럼 사용자에게 노출되는 시간 응답 필드는 ISO-8601 문자열이며 `Asia/Seoul` 기준 offset `+09:00`을 포함한다.
- 관리자 대회 생성/수정 form에서 offset 없는 `yyyy-MM-ddTHH:mm[:ss]` 입력은 한국 시간으로 해석한다. `Z` 또는 명시적 offset이 있는 입력은 해당 offset을 기준으로 해석한다.
- DB와 내부 상태 계산은 절대 시각으로 유지하고, API/관리자 화면 경계에서 한국 시간으로 변환한다.

## 엔드포인트

### GET /health
- 설명: 서비스 상태 확인.
- 인증: public.
- Path params: 없음.
- Query params: 없음.
- Request body: 없음.
- Response body:
  - `status`: string, required, 상태 값. 현재 `ok`.
- Status codes:
  - 200: 정상.
- Error cases: 없음.

### POST /api/v1/auth/google
- 설명: Google ID token을 검증하고 기존 계정이면 JWT를 발급한다. 최초 로그인 계정이면 회원가입 완료에 필요한 signup token을 반환한다.
- 인증: public.
- Path params: 없음.
- Query params: 없음.
- Request body:
  - `idToken`: string, required, Google 로그인에서 발급된 ID token.
- Response body:
  - `requiresSignup`: boolean, required, 서비스 아이디 등록 필요 여부.
  - `tokens`: object, optional, `requiresSignup=false`일 때 반환.
  - `tokens.accessToken`: string, required when `tokens` exists, 서비스 access JWT.
  - `tokens.refreshToken`: string, required when `tokens` exists, 서비스 refresh JWT.
  - `tokens.tokenType`: string, required when `tokens` exists, 값은 `Bearer`.
  - `tokens.expiresInSeconds`: number, required when `tokens` exists, access token 만료까지 남은 초.
  - `tokens.serviceUsername`: string, required when `tokens` exists, 서비스에서 사용하는 고유 아이디.
  - `signupToken`: string, optional, `requiresSignup=true`일 때 반환.
  - `email`: string, optional, `requiresSignup=true`일 때 반환되는 검증된 Google email.
- Status codes:
  - 200: 로그인 확인 성공. 기존 계정이면 JWT 발급, 최초 로그인 계정이면 signup token 발급.
  - 400: 요청 field 형식 오류.
  - 401: Google token 검증 실패 또는 email 미검증.
  - 403: email domain이 `kookmin.ac.kr`이 아님.
- Error cases:
  - `INVALID_REQUEST`: `idToken` 누락.
  - `AUTHENTICATION_FAILED`: Google ID token이 유효하지 않거나 email이 검증되지 않음.
  - `FORBIDDEN_EMAIL_DOMAIN`: Google email domain이 허용되지 않음.

### POST /api/v1/auth/signup
- 설명: 최초 로그인 사용자가 서비스 아이디를 등록하고 인증을 완료한다.
- 인증: public. 단, 유효한 signup token 필요.
- Path params: 없음.
- Query params: 없음.
- Request body:
  - `signupToken`: string, required, `POST /api/v1/auth/google`의 최초 로그인 응답에서 발급된 signup JWT.
  - `serviceUsername`: string, required, 3-32자, 영문/숫자/underscore만 허용, 저장 시 lowercase로 정규화, 서비스 내 고유.
- Response body:
  - `accessToken`: string, required, 서비스 access JWT.
  - `refreshToken`: string, required, 서비스 refresh JWT.
  - `tokenType`: string, required, 값은 `Bearer`.
  - `expiresInSeconds`: number, required, access token 만료까지 남은 초.
  - `serviceUsername`: string, required, 등록된 서비스 아이디.
- Status codes:
  - 201: 계정 생성 및 인증 완료.
  - 400: 요청 field 형식 오류.
  - 401: signup token 검증 실패 또는 만료.
  - 403: signup token의 email domain이 허용되지 않음.
  - 409: 이미 등록된 email 또는 중복 service username.
- Error cases:
  - `INVALID_REQUEST`: field 누락 또는 `serviceUsername` 형식 오류.
  - `AUTHENTICATION_FAILED`: signup token이 유효하지 않음.
  - `FORBIDDEN_EMAIL_DOMAIN`: signup token의 email domain이 허용되지 않음.
  - `ACCOUNT_ALREADY_EXISTS`: 해당 email 계정이 이미 등록됨.
  - `DUPLICATE_SERVICE_USERNAME`: 서비스 아이디가 이미 사용 중임.

### POST /api/v1/auth/refresh
- 설명: refresh token으로 현재 로그인 session의 access token과 refresh token을 재발급한다.
- 인증: public. 단, 유효한 refresh token 필요. `Authorization` header는 사용하지 않는다.
- Path params: 없음.
- Query params: 없음.
- Request body:
  - `refreshToken`: string, required, 기존 로그인 또는 직전 refresh 응답에서 발급된 refresh JWT.
- Response body:
  - `accessToken`: string, required, 새 서비스 access JWT.
  - `refreshToken`: string, required, 새 서비스 refresh JWT. 기존 refresh token은 rotation으로 즉시 무효화된다.
  - `tokenType`: string, required, 값은 `Bearer`.
  - `expiresInSeconds`: number, required, 새 access token 만료까지 남은 초.
  - `serviceUsername`: string, required, session 소유 계정의 서비스 아이디.
- Status codes:
  - 200: token 재발급 완료.
  - 400: 요청 field 형식 오류.
  - 401: refresh token 검증 실패, 만료, 폐기된 session, 이미 rotation된 refresh token, 또는 session 불일치.
- Error cases:
  - `INVALID_REQUEST`: `refreshToken` 누락.
  - `AUTHENTICATION_FAILED`: refresh token이 유효하지 않거나 session이 active 상태가 아님.

### POST /api/v1/auth/logout
- 설명: 현재 access token의 session을 폐기한다.
- 인증: authenticated.
- Path params: 없음.
- Query params: 없음.
- Request body: 없음.
- Response body:
  - `loggedOut`: boolean, required, 로그아웃 완료 여부. 성공 시 `true`.
- Status codes:
  - 200: 로그아웃 완료.
  - 401: access token 누락, 검증 실패, 만료, 또는 이미 폐기된 session.
- Error cases:
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.

### GET /api/v1/problems
- 설명: 문제 번호 오름차순으로 문제 목록을 조회한다. 한 페이지에는 최대 20개 문제가 포함된다.
- 인증: authenticated. `Authorization: Bearer {accessToken}` 필요.
- Path params: 없음.
- Query params:
  - `page`: number, optional, 1부터 시작하는 페이지 번호. 생략 시 `1`. 정수만 허용하며 1 미만은 허용하지 않음.
- Request body: 없음.
- Response body:
  - `page`: number, required, 요청한 1-based 페이지 번호.
  - `pageSize`: number, required, 페이지당 문제 수. 현재 `20`.
  - `totalElements`: number, required, 전체 문제 수.
  - `totalPages`: number, required, 전체 페이지 수.
  - `problems`: array, required, 현재 페이지의 문제 목록.
  - `problems[].problemNumber`: number, required, 사용자에게 노출되는 문제 번호. `1000`부터 생성 순서대로 증가.
  - `problems[].createdByServiceUsername`: string, required, 문제 생성자의 서비스 아이디.
  - `problems[].title`: string, required, 문제 제목.
  - `problems[].tag`: string, required, 문제 유형 태그.
  - `problems[].timeLimitSeconds`: number, required, 채점 시간 제한 seconds 단위.
  - `problems[].memoryLimitMegabytes`: number, required, 채점 메모리 제한 MB 단위.
- Status codes:
  - 200: 문제 목록 조회 성공.
  - 400: `page`가 정수가 아니거나 1 미만.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
- Error cases:
  - `INVALID_REQUEST`: `page` query parameter 형식 오류 또는 1 미만.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.

### GET /api/v1/problems/{problemNumber}
- 설명: 문제 번호를 기준으로 문제 상세 정보를 조회한다. 공개 예시 테스트 케이스만 반환하며 실제 채점용 비공개 테스트 케이스는 반환하지 않는다.
- 인증: authenticated. `Authorization: Bearer {accessToken}` 필요.
- Path params:
  - `problemNumber`: number, required, `1000`부터 생성 순서대로 증가하는 문제 번호.
- Query params: 없음.
- Request body: 없음.
- Response body:
  - `problemNumber`: number, required, 사용자에게 노출되는 문제 번호.
  - `title`: string, required, 문제 제목.
  - `tag`: string, required, 문제 유형 태그.
  - `timeLimitSeconds`: number, required, 채점 시간 제한 seconds 단위.
  - `memoryLimitMegabytes`: number, required, 채점 메모리 제한 MB 단위.
  - `statementMarkdown`: string, required, Markdown 문법의 문제 지문.
  - `exampleTestCases`: array, required, 공개 예시 테스트 케이스 목록. 실제 채점용 HIDDEN 테스트 케이스는 포함하지 않음.
  - `exampleTestCases[].order`: number, required, 예시 테스트 케이스 순서. 1부터 시작.
  - `exampleTestCases[].input`: string, required, 공개 예시 입력 본문. 빈 문자열 가능.
  - `exampleTestCases[].output`: string, required, 공개 예시 기대 출력 본문. 빈 문자열 가능.
  - `subtasks`: array, required, 서브테스크 목록. 서브테스크가 없는 일반 문제이면 빈 배열.
  - `subtasks[].order`: number, required, 같은 문제 안에서 고유한 서브테스크 순서.
  - `subtasks[].title`: string, required, 서브테스크 제목.
  - `subtasks[].score`: number, required, 서브테스크 최대 점수.
  - `subtasks[].prerequisiteSubtaskOrders`: number array, required, 이 서브테스크가 점수를 받기 전에 `PASSED`여야 하는 같은 문제의 서브테스크 순서 목록. 없으면 빈 배열.
  - `subtasks[].testCases`: array, required, 해당 서브테스크에 속한 HIDDEN 테스트 케이스 메타데이터. 입력/출력 본문은 포함하지 않음.
  - `subtasks[].testCases[].order`: number, required, judge 요청 기준 HIDDEN 테스트 케이스 순서.
- Status codes:
  - 200: 문제 상세 조회 성공.
  - 400: `problemNumber` path parameter가 정수가 아님.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
  - 404: 해당 문제 번호가 존재하지 않음.
- Error cases:
  - `INVALID_REQUEST`: `problemNumber` path parameter 형식 오류.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.
  - `PROBLEM_NOT_FOUND`: 해당 문제 번호의 문제가 존재하지 않음.

### GET /api/v1/problems/{problemNumber}/definition
- 설명: 문제 생성자가 문제 수정을 위해 전체 문제 정의를 조회한다. 선택 checker code와 실제 채점용 비공개 테스트 케이스를 포함하므로 문제 생성자에게만 반환한다.
- 인증: authenticated. `Authorization: Bearer {accessToken}` 필요. 요청 사용자는 해당 문제의 `createdBy` 계정이어야 한다.
- Path params:
  - `problemNumber`: number, required, 조회할 문제 번호.
- Query params: 없음.
- Request body: 없음.
- Response body:
  - `id`: string, required, 문제 UUID.
  - `problemNumber`: number, required, 사용자에게 노출되는 문제 번호.
  - `title`: string, required, 문제 제목.
  - `tag`: string, required, 문제 유형 태그.
  - `timeLimitSeconds`: number, required, 채점 시간 제한 seconds 단위.
  - `memoryLimitMegabytes`: number, required, 채점 메모리 제한 MB 단위.
  - `statementMarkdown`: string, required, Markdown 문법의 문제 지문.
  - `checkerCode`: string, optional, testlib 기반 C++17 checker 코드. judge 기본 출력 비교를 사용하면 null.
  - `exampleInputs`: string array, required, 공개 예시 입력 목록. 각 값 null 불가, 빈 문자열 가능.
  - `exampleOutputs`: string array, required, 공개 예시 출력 목록. `exampleInputs`와 같은 순서와 개수.
  - `actualTestCaseInputs`: string array, required, 실제 채점용 입력 목록. 각 값 null 불가, 빈 문자열 가능.
  - `actualTestCaseOutputs`: string array, required, 실제 채점용 출력 목록. `actualTestCaseInputs`와 같은 순서와 개수.
  - `subtasks`: array, required, 서브테스크 정의 목록. 서브테스크가 없는 일반 문제이면 빈 배열.
  - `subtasks[].order`: number, required, 같은 문제 안에서 고유한 서브테스크 순서.
  - `subtasks[].title`: string, required, 서브테스크 제목.
  - `subtasks[].score`: number, required, 서브테스크 최대 점수.
  - `subtasks[].prerequisiteSubtaskOrders`: number array, required, 이 서브테스크가 점수를 받기 전에 `PASSED`여야 하는 같은 문제의 서브테스크 순서 목록. 없으면 빈 배열.
  - `subtasks[].testCases`: array, required, 해당 서브테스크에 속한 HIDDEN 테스트 케이스 목록.
  - `subtasks[].testCases[].order`: number, required, judge 요청 기준 HIDDEN 테스트 케이스 순서.
  - `subtasks[].testCases[].input`: string, required, 실제 채점용 입력 본문. 빈 문자열 가능.
  - `subtasks[].testCases[].output`: string, required, 실제 채점용 기대 출력 본문. 빈 문자열 가능.
- Status codes:
  - 200: 문제 정의 조회 성공.
  - 400: `problemNumber` path parameter가 정수가 아님.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
  - 403: 인증 계정이 해당 문제 생성자가 아님.
  - 404: 해당 문제 번호가 존재하지 않음.
- Error cases:
  - `INVALID_REQUEST`: `problemNumber` path parameter 형식 오류.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.
  - `FORBIDDEN_OPERATION`: 문제 생성자가 아니므로 전체 문제 정의 조회 권한이 없음.
  - `PROBLEM_NOT_FOUND`: 해당 문제 번호의 문제가 존재하지 않음.

### POST /api/v1/problems
- 설명: 관리자 계정이 문제 본문과 예시/실제 채점 테스트 케이스를 생성한다. 저장 전에 필수 예시 정답 코드를 실제 채점 테스트 케이스로 사전 채점하며, judge 결과가 전체 통과일 때만 문제를 생성한다.
- 인증: admin-only. `Authorization: Bearer {accessToken}` 필요.
- Path params: 없음.
- Query params: 없음.
- Request body:
  - `title`: string, required, 1-20자, 문제 제목, null 불가.
  - `tag`: string, required, 1-64자, 문제 유형 태그, null 불가.
  - `timeLimitSeconds`: number, required, 양의 정수, 채점 시간 제한 seconds 단위, null 불가.
  - `memoryLimitMegabytes`: number, required, 양의 정수, 채점 메모리 제한 MB 단위, null 불가.
  - `statementMarkdown`: string, required, Markdown 문법의 문제 지문, null 불가.
  - `checkerCode`: string, optional, testlib 기반 C++17 checker 코드. 없거나 null이면 judge 기본 출력 비교를 사용한다. 제공 시 빈 문자열 또는 공백 문자열 불가.
  - `referenceSolutionCode`: string, required, C++17 예시 정답 코드. 문제 저장 전에 `actualTestCaseInputs`/`actualTestCaseOutputs` 전체로 judge 사전 채점을 수행하며, 저장하지 않고 응답에도 포함하지 않는다. 빈 문자열 또는 공백 문자열 불가.
  - `exampleInputs`: string array, required, 최소 1개, 공개 예시 입력 목록, 각 값 null 불가. 빈 문자열은 입력이 없는 예시를 표현할 수 있음.
  - `exampleOutputs`: string array, required, 최소 1개, 공개 예시 출력 목록, 각 값 null 불가. `exampleInputs`와 같은 개수여야 함.
  - `actualTestCaseInputs`: string array, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점용 입력 목록. 최소 1개, 각 값 null 불가. `subtasks`가 있으면 생략하거나 빈 배열이어야 함.
  - `actualTestCaseOutputs`: string array, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점용 출력 목록. `actualTestCaseInputs`와 같은 개수여야 하며 `subtasks`가 있으면 생략하거나 빈 배열이어야 함.
  - `subtasks`: object array, optional, 서브테스크 문제의 배점과 HIDDEN 테스트 케이스 정의. 없거나 빈 배열이면 일반 문제로 처리한다.
  - `subtasks[].order`: number, required when `subtasks[]` exists, 같은 문제 안에서 고유한 양의 정수.
  - `subtasks[].title`: string, required when `subtasks[]` exists, 1-64자 서브테스크 제목.
  - `subtasks[].score`: number, required when `subtasks[]` exists, 0보다 큰 정수. 전체 서브테스크 score 합은 정확히 100이어야 함.
  - `subtasks[].prerequisiteSubtaskOrders`: number array, optional, 같은 문제 안에서 먼저 `PASSED`여야 하는 서브테스크 order 목록. 자기 자신, 존재하지 않는 order, 순환 dependency는 허용하지 않음.
  - `subtasks[].testCases`: object array, required when `subtasks[]` exists, 최소 1개. 해당 서브테스크에 속한 실제 채점용 HIDDEN 테스트 케이스 목록.
  - `subtasks[].testCases[].input`: string, required, 실제 채점용 입력 본문. 빈 문자열 가능.
  - `subtasks[].testCases[].output`: string, required, 실제 채점용 기대 출력 본문. 빈 문자열 가능.
- Request example:
```json
{
  "title": "Subtask Problem",
  "tag": "implementation",
  "timeLimitSeconds": 1,
  "memoryLimitMegabytes": 128,
  "statementMarkdown": "# Problem",
  "checkerCode": null,
  "referenceSolutionCode": "#include <bits/stdc++.h>\nint main() { return 0; }\n",
  "exampleInputs": ["1 2"],
  "exampleOutputs": ["3"],
  "actualTestCaseInputs": [],
  "actualTestCaseOutputs": [],
  "subtasks": [
    {
      "order": 1,
      "title": "base",
      "score": 40,
      "prerequisiteSubtaskOrders": [],
      "testCases": [{"input": "1 2", "output": "3"}]
    },
    {
      "order": 2,
      "title": "dependent",
      "score": 60,
      "prerequisiteSubtaskOrders": [1],
      "testCases": [{"input": "10 20", "output": "30"}]
    }
  ]
}
```
- Response body:
  - `id`: string, required, 생성된 문제 UUID.
  - `problemNumber`: number, required, 사용자에게 노출되는 문제 번호. 첫 문제는 `1000`이며 이후 문제 생성 순서대로 1씩 증가.
  - `title`: string, required, 저장된 문제 제목.
  - `tag`: string, required, 저장된 문제 유형 태그.
  - `timeLimitSeconds`: number, required, 저장된 시간 제한 seconds 단위.
  - `memoryLimitMegabytes`: number, required, 저장된 메모리 제한 MB 단위.
  - `exampleTestCaseCount`: number, required, 저장된 공개 예시 테스트 케이스 수.
  - `actualTestCaseCount`: number, required, 저장된 실제 채점 테스트 케이스 수. 서브테스크 내부 테스트 케이스도 이 개수에 포함하며 실제 채점 입출력 본문은 응답에 포함하지 않음.
  - checker code는 응답에 포함하지 않음.
- Status codes:
  - 201: 문제 생성 완료.
  - 400: 요청 field 형식 오류 또는 입출력 목록 개수 불일치.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
  - 403: 인증 계정이 관리자 권한이 아님.
  - 503: judge 서버 설정 누락, 연결 실패, 인증 실패, 또는 응답 매핑 실패로 예시 정답 코드 사전 채점을 완료하지 못함.
- Error cases:
  - `INVALID_REQUEST`: field 누락, 형식 오류, 빈 checker code, 빈 reference solution code, 입출력 목록 개수 불일치, subtask score 합이 100이 아님, 중복 subtask order, subtask score가 0 이하, 자기 자신/존재하지 않는/순환 prerequisite, 또는 서브테스크 문제에서 일반 HIDDEN 테스트 케이스가 함께 제공됨.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.
  - `FORBIDDEN_OPERATION`: 문제 생성 권한이 없음.
  - `PROBLEM_VERIFICATION_FAILED`: 예시 정답 코드가 실제 채점 테스트 케이스 전체를 통과하지 못함.
  - `JUDGE_UNAVAILABLE`: judge 서버 설정 누락, 연결 실패, 인증 실패, 또는 응답 매핑 실패로 사전 채점을 완료하지 못함.

### PATCH /api/v1/problems/{problemNumber}
- 설명: 문제를 생성한 인증 사용자가 문제 본문, 제한, 선택 checker code, 예시/실제 채점 테스트 케이스를 수정한다. 문제 번호와 생성자는 변경하지 않는다.
- 인증: authenticated. `Authorization: Bearer {accessToken}` 필요. 요청 사용자는 해당 문제의 `createdBy` 계정이어야 한다.
- Path params:
  - `problemNumber`: number, required, 수정할 문제 번호.
- Query params: 없음.
- Request body:
  - `title`: string, required, 1-20자, 문제 제목, null 불가.
  - `tag`: string, required, 1-64자, 문제 유형 태그, null 불가.
  - `timeLimitSeconds`: number, required, 양의 정수, 채점 시간 제한 seconds 단위, null 불가.
  - `memoryLimitMegabytes`: number, required, 양의 정수, 채점 메모리 제한 MB 단위, null 불가.
  - `statementMarkdown`: string, required, Markdown 문법의 문제 지문, null 불가.
  - `checkerCode`: string, optional, testlib 기반 C++17 checker 코드. 없거나 null이면 judge 기본 출력 비교를 사용한다. 제공 시 빈 문자열 또는 공백 문자열 불가.
  - `exampleInputs`: string array, required, 최소 1개, 공개 예시 입력 목록, 각 값 null 불가. 빈 문자열은 입력이 없는 예시를 표현할 수 있음.
  - `exampleOutputs`: string array, required, 최소 1개, 공개 예시 출력 목록, 각 값 null 불가. `exampleInputs`와 같은 개수여야 함.
  - `actualTestCaseInputs`: string array, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점용 입력 목록. 최소 1개, 각 값 null 불가. `subtasks`가 있으면 생략하거나 빈 배열이어야 함.
  - `actualTestCaseOutputs`: string array, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점용 출력 목록. `actualTestCaseInputs`와 같은 개수여야 하며 `subtasks`가 있으면 생략하거나 빈 배열이어야 함.
  - `subtasks`: object array, optional, 서브테스크 문제의 배점과 HIDDEN 테스트 케이스 정의. 없거나 빈 배열이면 일반 문제로 처리한다. 수정 시 기존 서브테스크와 HIDDEN 테스트 케이스는 요청 내용으로 교체된다.
  - `subtasks[].order`: number, required when `subtasks[]` exists, 같은 문제 안에서 고유한 양의 정수.
  - `subtasks[].title`: string, required when `subtasks[]` exists, 1-64자 서브테스크 제목.
  - `subtasks[].score`: number, required when `subtasks[]` exists, 0보다 큰 정수. 전체 서브테스크 score 합은 정확히 100이어야 함.
  - `subtasks[].prerequisiteSubtaskOrders`: number array, optional, 같은 문제 안에서 먼저 `PASSED`여야 하는 서브테스크 order 목록. 자기 자신, 존재하지 않는 order, 순환 dependency는 허용하지 않음.
  - `subtasks[].testCases`: object array, required when `subtasks[]` exists, 최소 1개. 해당 서브테스크에 속한 실제 채점용 HIDDEN 테스트 케이스 목록.
  - `subtasks[].testCases[].input`: string, required, 실제 채점용 입력 본문. 빈 문자열 가능.
  - `subtasks[].testCases[].output`: string, required, 실제 채점용 기대 출력 본문. 빈 문자열 가능.
- Response body:
  - `id`: string, required, 수정된 문제 UUID.
  - `problemNumber`: number, required, 사용자에게 노출되는 문제 번호. 수정 전과 동일하다.
  - `title`: string, required, 저장된 문제 제목.
  - `tag`: string, required, 저장된 문제 유형 태그.
  - `timeLimitSeconds`: number, required, 저장된 시간 제한 seconds 단위.
  - `memoryLimitMegabytes`: number, required, 저장된 메모리 제한 MB 단위.
  - `exampleTestCaseCount`: number, required, 저장된 공개 예시 테스트 케이스 수.
  - `actualTestCaseCount`: number, required, 저장된 실제 채점 테스트 케이스 수. 서브테스크 내부 테스트 케이스도 이 개수에 포함하며 실제 채점 입출력 본문은 응답에 포함하지 않음.
  - checker code는 응답에 포함하지 않음.
- Status codes:
  - 200: 문제 수정 완료.
  - 400: 요청 field 형식 오류 또는 입출력 목록 개수 불일치.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
  - 403: 인증 계정이 해당 문제 생성자가 아님.
  - 404: 해당 문제 번호가 존재하지 않음.
- Error cases:
  - `INVALID_REQUEST`: field 누락, 형식 오류, 빈 checker code, 입출력 목록 개수 불일치, subtask score 합이 100이 아님, 중복 subtask order, subtask score가 0 이하, 자기 자신/존재하지 않는/순환 prerequisite, 또는 서브테스크 문제에서 일반 HIDDEN 테스트 케이스가 함께 제공됨.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.
  - `FORBIDDEN_OPERATION`: 문제 생성자가 아니므로 수정 권한이 없음.
  - `PROBLEM_NOT_FOUND`: 해당 문제 번호의 문제가 존재하지 않음.

### POST /api/v1/submissions
- 설명: 인증된 사용자가 특정 문제에 소스 코드를 제출한다. 생성된 제출은 즉시 `QUEUED` 상태로 저장되며, HTTP 응답 이후 백그라운드 processor가 judge 상태를 확인해 비동기로 채점한다.
- 인증: authenticated. `Authorization: Bearer {accessToken}` 필요.
- Path params: 없음.
- Query params: 없음.
- Request body:
  - `problemNumber`: number, required, 제출 대상 문제 번호. `1000`부터 생성 순서대로 증가하는 문제 번호.
  - `language`: string, required, 제출 언어. 허용 값은 `cpp17`, `python3`.
  - `sourceCode`: string, required, 제출할 전체 소스 코드. 빈 문자열 불가, 최대 10000자.
- Response body:
  - `id`: string, required, 생성된 제출 UUID.
  - `problemNumber`: number, required, 제출 대상 문제 번호.
  - `language`: string, required, 저장된 제출 언어. 값은 `cpp17` 또는 `python3`.
  - `status`: string, required, 생성 직후 제출 상태. 값은 `QUEUED`.
  - `submittedAt`: string, required, ISO-8601 형식의 제출 생성 시각. 한국 시간 offset `+09:00` 포함.
- Status codes:
  - 201: 제출 생성 완료.
  - 400: 요청 field 형식 오류, 소스 코드 길이 초과, 또는 지원하지 않는 언어.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
  - 404: 해당 문제 번호가 존재하지 않음.
- Error cases:
  - `INVALID_REQUEST`: field 누락, 형식 오류, 빈 소스 코드, 또는 `sourceCode`가 10000자를 초과함.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.
  - `PROBLEM_NOT_FOUND`: 제출 대상 문제 번호가 존재하지 않음.
  - `UNSUPPORTED_LANGUAGE`: `language`가 `cpp17`, `python3` 중 하나가 아님.

### GET /api/v1/submissions/me
- 설명: 인증된 사용자의 제출 목록을 최신 제출 순으로 조회한다. 한 페이지에는 최대 20개 제출이 포함된다.
- 인증: authenticated. `Authorization: Bearer {accessToken}` 필요.
- Path params: 없음.
- Query params:
  - `page`: number, optional, 1부터 시작하는 페이지 번호. 생략 시 `1`. 정수만 허용하며 1 미만은 허용하지 않음.
  - `problemNumber`: number, optional, 특정 문제 번호의 내 제출만 조회하기 위한 필터. 정수만 허용하며 1 미만은 허용하지 않음.
- Request body: 없음.
- Response body:
  - `page`: number, required, 요청한 1-based 페이지 번호.
  - `pageSize`: number, required, 페이지당 제출 수. 현재 `20`.
  - `totalElements`: number, required, 필터 적용 후 전체 제출 수.
  - `totalPages`: number, required, 필터 적용 후 전체 페이지 수.
  - `submissions`: array, required, 현재 페이지의 제출 목록.
  - `submissions[].id`: string, required, 제출 UUID.
  - `submissions[].problemNumber`: number, required, 제출 대상 문제 번호.
  - `submissions[].language`: string, required, 제출 언어. 값은 `cpp17` 또는 `python3`.
  - `submissions[].status`: string, required, 제출 상태 enum.
  - `submissions[].scorePercentage`: number, optional, 채점 점수 percentage. 채점 전이면 null.
  - `submissions[].submittedAt`: string, required, ISO-8601 형식의 제출 생성 시각. 한국 시간 offset `+09:00` 포함.
- Status codes:
  - 200: 내 제출 목록 조회 성공.
  - 400: `page` 또는 `problemNumber` query parameter 형식 오류 또는 1 미만.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
- Error cases:
  - `INVALID_REQUEST`: `page` 또는 `problemNumber` query parameter 형식 오류 또는 1 미만.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.

### GET /api/v1/submissions/{submissionId}
- 설명: 제출 UUID를 기준으로 제출 상세 정보를 조회한다. 제출자 본인 또는 관리자만 조회할 수 있으며, 이 상세 응답에는 제출 소스 코드가 포함된다.
- 인증: authenticated. `Authorization: Bearer {accessToken}` 필요.
- Path params:
  - `submissionId`: string, required, 제출 UUID.
- Query params: 없음.
- Request body: 없음.
- Response body:
  - `id`: string, required, 제출 UUID.
  - `problemNumber`: number, required, 제출 대상 문제 번호.
  - `language`: string, required, 제출 언어. 값은 `cpp17` 또는 `python3`.
  - `status`: string, required, 제출 상태 enum.
  - `scorePercentage`: number, optional, 통과한 테스트 비율 percentage. 채점 전이면 null. 테스트 케이스 개수와 통과 개수는 노출하지 않는다.
  - `totalScore`: number, optional, 백엔드가 저장한 최종 점수. 일반 문제에서는 `scorePercentage`와 같은 값이고, 서브테스크 문제에서는 획득한 서브테스크 점수 합이다. 채점 전이면 null.
  - `submittedAt`: string, required, ISO-8601 형식의 제출 생성 시각. 한국 시간 offset `+09:00` 포함.
  - `sourceCode`: string, required, 제출한 전체 소스 코드. 제출자 본인 또는 관리자에게만 반환.
  - 테스트 케이스별 결과, 테스트 케이스 개수, 통과 개수, 실패 케이스 순서와 종류는 응답에 포함하지 않는다.
  - `compileErrorMessage`: string, optional, 컴파일 오류 메시지. `status=COMPILE_ERROR`일 때 사용하며 없으면 null.
  - `runtimeErrorMessage`: string, optional, 런타임 오류 메시지. `status=RUNTIME_ERROR`일 때 사용하며 없으면 null.
  - `subtaskResults`: array, required, 서브테스크별 채점 결과. 일반 문제 또는 채점 전이면 빈 배열.
  - `subtaskResults[].subtaskOrder`: number, required, 서브테스크 순서.
  - `subtaskResults[].title`: string, required, 서브테스크 제목.
  - `subtaskResults[].status`: string, required, 서브테스크 결과. `PASSED`, `FAILED`, `BLOCKED`.
  - `subtaskResults[].earnedScore`: number, required, 해당 서브테스크에서 획득한 점수. `PASSED`이면 `maxScore`, `FAILED` 또는 `BLOCKED`이면 `0`.
  - `subtaskResults[].maxScore`: number, required, 해당 서브테스크의 최대 점수.
  - `subtaskResults[].passedTestCaseCount`: number, required, 서브테스크 내부 HIDDEN 채점 대상 테스트 케이스 중 통과한 개수. EXAMPLE은 제외.
  - `subtaskResults[].totalTestCaseCount`: number, required, 서브테스크 내부 HIDDEN 채점 대상 테스트 케이스 전체 개수. EXAMPLE은 제외.
  - `subtaskResults[].failedReason`: string, optional, 자기 테스트케이스 실패 또는 선행 서브테스크 차단 사유. 없으면 null.
  - `subtaskResults[].prerequisiteSubtaskOrders`: number array, required, 이 서브테스크가 요구한 선행 서브테스크 순서 목록.
- Response example:
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "problemNumber": 1000,
  "language": "cpp17",
  "status": "WRONG_ANSWER",
  "scorePercentage": 0.0,
  "totalScore": 0.0,
  "submittedAt": "2026-05-14T09:00:00+09:00",
  "sourceCode": "#include <bits/stdc++.h>\nint main() { return 0; }\n",
  "compileErrorMessage": null,
  "runtimeErrorMessage": null,
  "subtaskResults": [
    {
      "subtaskOrder": 1,
      "title": "base",
      "status": "FAILED",
      "earnedScore": 0.0,
      "maxScore": 40.0,
      "passedTestCaseCount": 0,
      "totalTestCaseCount": 1,
      "failedReason": "Test case 1 failed: WRONG_ANSWER.",
      "prerequisiteSubtaskOrders": []
    },
    {
      "subtaskOrder": 2,
      "title": "dependent",
      "status": "BLOCKED",
      "earnedScore": 0.0,
      "maxScore": 60.0,
      "passedTestCaseCount": 1,
      "totalTestCaseCount": 1,
      "failedReason": "Prerequisite subtask 1 is not PASSED.",
      "prerequisiteSubtaskOrders": [1]
    }
  ]
}
```
- Status codes:
  - 200: 제출 상세 조회 성공.
  - 400: `submissionId` path parameter가 UUID 형식이 아님.
  - 401: access token 누락, 검증 실패, 만료, 또는 폐기된 session.
  - 403: 제출자 본인 또는 관리자가 아님.
  - 404: 해당 제출이 존재하지 않음.
- Error cases:
  - `INVALID_REQUEST`: `submissionId` path parameter 형식 오류.
  - `AUTHENTICATION_FAILED`: 인증이 없거나 session이 유효하지 않음.
  - `FORBIDDEN_OPERATION`: 제출 상세 조회 권한이 없음.
  - `SUBMISSION_NOT_FOUND`: 해당 제출이 존재하지 않음.

### GET /admin/login
- Contest API 상세 계약은 프론트 전달용 [docs/contest-api.md](../contest-api.md)를 기준으로 한다. 아래 항목은 `docs/api/endpoints.md`와 동일한 공개 endpoint set을 유지하기 위한 요약 명세다.

### GET /api/v1/contests
- 설명: 조회 가능한 대회 목록을 반환한다. Authorization header가 있으면 PRIVATE 대회 표시 권한 판단에 사용한다.
- 인증: public.
- Request body: 없음.
- Response body: array of object.
  - `id`: string UUID, required.
  - `title`: string, required.
  - `description`: string, required.
  - `startTime`: string datetime, required, ISO-8601 한국 시간 offset `+09:00` 포함.
  - `endTime`: string datetime, required, ISO-8601 한국 시간 offset `+09:00` 포함.
  - `status`: string, required, `DRAFT`, `SCHEDULED`, `RUNNING`, `ENDED`.
  - `visibility`: string, required, `PUBLIC`, `PRIVATE`.
- Status codes: 200.

### GET /api/v1/contests/{contestId}
- 설명: 대회 상세와 현재 사용자 기준 `isStaff`, `isParticipant` 권한 정보를 반환한다.
- 인증: public.
- Path params: `contestId` string UUID.
- Response body: `id`, `title`, `description`, `startTime`, `endTime`, `visibility`, `registrationMode`, `status`, `isStaff`, `isParticipant`.
- Status codes: 200, 403, 404.
- Error cases: `CONTEST_NOT_FOUND`, `CONTEST_FORBIDDEN`.

### GET /api/v1/contests/{contestId}/problems
- 설명: 대회 문제 목록과 현재 사용자 풀이 상태를 반환한다.
- 인증: public.
- Response body: array of `{id,label,title,score,displayOrder,solvedStatus}`.
- `solvedStatus`: `NOT_SUBMITTED`, `ATTEMPTED`, `SOLVED`.
- Status codes: 200, 403, 404.

### GET /api/v1/contests/{contestId}/problems/{contestProblemId}
- 설명: 대회 문제 상세를 반환한다. HIDDEN testcase는 반환하지 않는다.
- 인증: public.
- Response body: `id`, `label`, `title`, `statement`, `inputDescription`, `outputDescription`, `constraints`, `timeLimitMillis`, `memoryLimitKb`, `score`, `displayOrder`, `exampleTestCases`.
- `exampleTestCases[]`: `{caseOrder,input,output}`.
- Status codes: 200, 403, 404.

### POST /api/v1/contests/{contestId}/join
- 설명: OPEN 대회 참가를 처리한다. 이미 참가한 경우도 성공이다.
- 인증: authenticated.
- Request body: 없음.
- Response body: `contestId`, `joined`.
- Status codes: 200, 401, 403, 404.
- Error cases: `CONTEST_FORBIDDEN`, `CONTEST_NOT_FOUND`.

### POST /api/v1/contests/{contestId}/problems
- 설명: ContestStaff 또는 ADMIN이 대회 문제와 테스트 케이스를 생성한다.
- 인증: authenticated, ContestStaff 또는 ADMIN.
- Request body: `label`, `title`, `statement`, `inputDescription`, `outputDescription`, `constraints`, `timeLimitMillis`, `memoryLimitKb`, `score`, `displayOrder`, `testCases`.
- `testCases[]`: `{caseOrder,kind,inputText,outputText}`, `kind`는 `EXAMPLE` 또는 `HIDDEN`, 최소 1개 HIDDEN 필요.
- Response body: `id`, `contestId`, `label`, `title`, `score`, `displayOrder`, `exampleTestCaseCount`, `hiddenTestCaseCount`.
- Status codes: 201, 400, 401, 403, 404.
- Error cases: `VALIDATION_ERROR`, `CONTEST_STAFF_REQUIRED`, `CONTEST_NOT_FOUND`.

### PATCH /api/v1/contests/{contestId}/problems/{contestProblemId}
- 설명: ContestStaff 또는 ADMIN이 대회 문제 기본 정보와 테스트 케이스 set을 교체한다.
- 인증: authenticated, ContestStaff 또는 ADMIN.
- Request/Response body: `POST /api/v1/contests/{contestId}/problems`와 동일.
- Status codes: 200, 400, 401, 403, 404.
- Error cases: `VALIDATION_ERROR`, `CONTEST_STAFF_REQUIRED`, `CONTEST_PROBLEM_NOT_FOUND`.

### DELETE /api/v1/contests/{contestId}/problems/{contestProblemId}
- 설명: ContestStaff 또는 ADMIN이 대회 문제를 실제 삭제한다.
- 인증: authenticated, ContestStaff 또는 ADMIN.
- Response body: 없음.
- Status codes: 204, 401, 403, 404.

### POST /api/v1/contests/{contestId}/problems/{contestProblemId}/submissions
- 설명: 대회 문제 제출을 `QUEUED` 상태로 생성하고 기존 judge queue가 처리하게 한다.
- 인증: authenticated.
- Request body:
  - `language`: string, required, `cpp17` 또는 `python3`.
  - `sourceCode`: string, required, 빈 문자열 불가, 최대 10000자.
- Response body: `id`, `contestId`, `contestProblemId`, `problemLabel`, `language`, `status`, `submittedAt`. `submittedAt`은 한국 시간 offset `+09:00` 포함.
- Status codes: 201, 400, 401, 403, 404.
- Error cases: `CONTEST_NOT_RUNNING`, `CONTEST_NOT_JOINED`, `CONTEST_PROBLEM_NOT_FOUND`, `VALIDATION_ERROR`, `UNSUPPORTED_LANGUAGE`.

### GET /api/v1/contests/{contestId}/submissions/me
- 설명: 인증 사용자의 해당 대회 제출 목록을 최신순으로 반환한다.
- 인증: authenticated.
- Response body: array of `{id,contestProblemId,problemLabel,submitterServiceUsername,language,status,scorePercentage,submittedAt}`. `submittedAt`은 한국 시간 offset `+09:00` 포함.

### GET /api/v1/contests/{contestId}/submissions
- 설명: ContestStaff 또는 ADMIN이 해당 대회 전체 제출 목록을 최신순으로 반환한다.
- 인증: authenticated, ContestStaff 또는 ADMIN.
- Response body: `submissions/me`와 동일한 array.
- Error cases: `CONTEST_STAFF_REQUIRED`.

### GET /api/v1/contests/{contestId}/scoreboard
- 설명: ICPC 스타일 스코어보드를 반환한다.
- 인증: public.
- Response body: `contestId`, `problems`, `rows`.
- `rows[]`: `{participantId,serviceUsername,solvedCount,penalty,lastAcceptedAt,cells}`. `lastAcceptedAt`은 값이 있으면 한국 시간 offset `+09:00` 포함.
- `cells[]`: `{contestProblemId,problemLabel,attempts,solved,penalty,firstSolved}`.
- 정렬: `solvedCount desc`, `penalty asc`, `lastAcceptedAt asc`.
- penalty: 첫 AC 제출 시간과 contest start 차이 분 + 첫 AC 전 오답 수 * 20분.

### GET /admin/login
- 설명: Thymeleaf 기반 관리자 로그인 화면을 반환한다.
- 인증: public.
- Path params: 없음.
- Query params:
  - `error`: string, optional, 로그인 실패 후 표시 상태.
  - `logout`: string, optional, 로그아웃 완료 후 표시 상태.
- Request body: 없음.
- Response body: HTML document.
- Status codes:
  - 200: 로그인 화면 반환.
- Error cases: 없음.

### POST /admin/login
- 설명: `.env` 또는 runtime 환경 변수의 `ADMIN_USERNAME`, `ADMIN_PASSWORD`와 form 입력을 비교해 관리자 세션을 생성한다.
- 인증: public. CSRF token 필요.
- Path params: 없음.
- Query params: 없음.
- Request body: `application/x-www-form-urlencoded`.
  - `username`: string, required, 관리자 아이디.
  - `password`: string, required, 관리자 비밀번호.
  - `_csrf`: string, required, Spring Security CSRF token.
- Response body: 없음. 성공/실패 모두 redirect.
- Status codes:
  - 302: 성공 시 `/admin`, 실패 시 `/admin/login?error`로 redirect.
- Error cases:
  - 인증 실패: `/admin/login?error`로 redirect.

### GET /admin
- 설명: 인증된 관리자에게 Thymeleaf 관리자 대시보드 화면을 반환한다.
- 인증: admin-session. `POST /admin/login`으로 생성된 서버 세션 필요.
- Path params: 없음.
- Query params: 없음.
- Request body: 없음.
- Response body: HTML document.
- Status codes:
  - 200: 관리자 대시보드 반환.
  - 302: 관리자 세션이 없으면 `/admin/login`으로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.

### GET /admin/users
- 설명: 인증된 관리자에게 사용자 목록과 계정 권한 변경 form이 포함된 Thymeleaf 사용자 관리 화면을 반환한다.
- 인증: admin-session. `POST /admin/login`으로 생성된 서버 세션 필요.
- Path params: 없음.
- Query params: 없음.
- Request body: 없음.
- Response body: HTML document.
  - 표시 정보: 서비스 아이디, email, 계정 상태, 생성 시각, 현재 권한.
  - 권한 선택 값: `USER`, `ADMIN`.
- Status codes:
  - 200: 사용자 관리 화면 반환.
  - 302: 관리자 세션이 없으면 `/admin/login`으로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.

### POST /admin/users/{userAccountId}/role
- 설명: 관리자 화면에서 선택한 사용자 계정의 권한을 변경한다.
- 인증: admin-session. CSRF token 필요.
- Path params:
  - `userAccountId`: string, required, 권한을 변경할 사용자 계정 UUID.
- Query params: 없음.
- Request body: `application/x-www-form-urlencoded`.
  - `role`: string, required, 변경할 권한. 허용 값은 `USER`, `ADMIN`.
  - `_csrf`: string, required, Spring Security CSRF token.
- Response body: 없음. 성공/실패 모두 redirect.
- Status codes:
  - 302: 처리 후 `/admin/users`로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.
  - 유효하지 않은 사용자 또는 role: `/admin/users`로 redirect하고 오류 메시지를 표시한다.

### GET /admin/problems
- 설명: 인증된 관리자에게 전체 문제 목록과 수정 진입 링크가 포함된 Thymeleaf 문제 관리 화면을 반환한다.
- 인증: admin-session. `POST /admin/login`으로 생성된 서버 세션 필요.
- Path params: 없음.
- Query params: 없음.
- Request body: 없음.
- Response body: HTML document.
  - 표시 정보: 문제 번호, 제목, 태그, 생성자, 수정 시각.
- Status codes:
  - 200: 문제 관리 화면 반환.
  - 302: 관리자 세션이 없으면 `/admin/login`으로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.

### GET /admin/problems/new
- 설명: 인증된 관리자에게 문제 생성 form이 포함된 Thymeleaf 화면을 반환한다.
- 인증: admin-session. `POST /admin/login`으로 생성된 서버 세션 필요.
- Path params: 없음.
- Query params: 없음.
- Request body: 없음.
- Response body: HTML document.
  - 생성자 선택 값: 현재 DB에 존재하는 `ADMIN` 권한 사용자 계정.
  - 입력 항목: 제목, 태그, 시간 제한, 메모리 제한, 문제 설명 Markdown, 필수 예시 정답 코드, 선택 testlib checker code, 예시 테스트 케이스, 채점 테스트 케이스.
  - checker guide: checker code는 선택 항목이며 화면은 `testlib.h`, `registerTestlibCmd(argc, argv)`, `inf`/`ouf`/`ans` stream, `quitf` verdict 사용을 안내한다.
- Status codes:
  - 200: 문제 생성 화면 반환.
  - 302: 관리자 세션이 없으면 `/admin/login`으로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.
  - `ADMIN` 권한 사용자 계정이 없으면 화면에 오류 메시지를 표시하고 제출 버튼을 비활성화한다.

### POST /admin/problems
- 설명: 관리자 화면에서 입력한 문제 본문과 예시/실제 채점 테스트 케이스를 생성한다. 저장 전에 필수 예시 정답 코드를 실제 채점 테스트 케이스로 사전 채점하며, judge 결과가 전체 통과일 때만 문제를 생성한다.
- 인증: admin-session. CSRF token 필요.
- Path params: 없음.
- Query params: 없음.
- Request body: `application/x-www-form-urlencoded`.
  - `createdByUserAccountId`: string, required, 문제 생성자로 저장할 `ADMIN` 권한 사용자 계정 UUID.
  - `title`: string, required, 1-20자, 문제 제목.
  - `tag`: string, required, 1-64자, 문제 유형 태그.
  - `timeLimitSeconds`: number, required, 양수.
  - `memoryLimitMegabytes`: number, required, 양수.
  - `statementMarkdown`: string, required, 문제 지문 Markdown.
  - `checkerCode`: string, optional, testlib 기반 C++17 checker source code. 빈 문자열은 저장 시 null로 처리한다.
  - `referenceSolutionCode`: string, required, C++17 예시 정답 코드. 문제 저장 전에 실제 채점 테스트로 사전 채점하며 저장하지 않는다.
  - `exampleInputs[index]`: string, required, 예시 입력. 최소 1개.
  - `exampleOutputs[index]`: string, required, 예시 출력. `exampleInputs`와 같은 개수.
  - `actualTestCaseInputs[index]`: string, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점 입력. 최소 1개.
  - `actualTestCaseOutputs[index]`: string, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점 출력. `actualTestCaseInputs`와 같은 개수.
  - `subtasks[index].order`: number, optional, 서브테스크 순서. 하나 이상의 서브테스크를 보내면 전체 score 합이 100이어야 한다.
  - `subtasks[index].title`: string, optional, 서브테스크 제목.
  - `subtasks[index].score`: number, optional, 서브테스크 배점.
  - `subtasks[index].prerequisiteSubtaskOrdersText`: string, optional, 쉼표로 구분한 선행 서브테스크 order 목록.
  - `subtasks[index].testCaseInputs[index]`: string, optional, 해당 서브테스크의 실제 채점 입력.
  - `subtasks[index].testCaseOutputs[index]`: string, optional, 해당 서브테스크의 실제 채점 출력.
  - `_csrf`: string, required, Spring Security CSRF token.
- Response body: 없음. 성공/실패 모두 HTML redirect 또는 form 재표시.
- Status codes:
  - 200: validation 실패 또는 생성 실패 시 문제 생성 화면을 다시 반환.
  - 302: 생성 성공 시 `/admin/problems/new`로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.
  - 입력 형식 오류, 입출력 목록 개수 불일치, 생성자 권한 부족, 사용자 없음, 예시 정답 코드 사전 채점 실패, 또는 judge 호출 실패: 문제 생성 화면을 다시 표시하고 오류 메시지를 표시한다.

### GET /admin/problems/{problemNumber}/edit
- 설명: 인증된 관리자에게 기존 문제 수정 form이 포함된 Thymeleaf 화면을 반환한다. 관리자 페이지에서는 문제 생성자와 무관하게 모든 문제를 수정할 수 있다.
- 인증: admin-session. `POST /admin/login`으로 생성된 서버 세션 필요.
- Path params:
  - `problemNumber`: number, required, 수정할 문제 번호.
- Query params: 없음.
- Request body: 없음.
- Response body: HTML document.
  - 입력 항목: 제목, 태그, 시간 제한, 메모리 제한, 문제 설명 Markdown, 선택 testlib checker code, 예시 테스트 케이스, 실제 채점용 비공개 테스트 케이스.
- Status codes:
  - 200: 문제 수정 화면 반환.
  - 302: 관리자 세션이 없으면 `/admin/login`으로 redirect. 문제가 없으면 `/admin/problems`로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.
  - 문제 없음: `/admin/problems`로 redirect하고 오류 메시지를 표시한다.

### POST /admin/problems/{problemNumber}
- 설명: 관리자 화면에서 입력한 문제 본문과 예시/실제 채점 테스트 케이스 수정 내용을 저장한다. 문제 번호와 생성자는 변경하지 않는다.
- 인증: admin-session. CSRF token 필요.
- Path params:
  - `problemNumber`: number, required, 수정할 문제 번호.
- Query params: 없음.
- Request body: `application/x-www-form-urlencoded`.
  - `title`: string, required, 1-20자, 문제 제목.
  - `tag`: string, required, 1-64자, 문제 유형 태그.
  - `timeLimitSeconds`: number, required, 양수.
  - `memoryLimitMegabytes`: number, required, 양수.
  - `statementMarkdown`: string, required, 문제 지문 Markdown.
  - `checkerCode`: string, optional, testlib 기반 C++17 checker source code. 빈 문자열은 저장 시 null로 처리한다.
  - `exampleInputs[index]`: string, required, 예시 입력. 최소 1개.
  - `exampleOutputs[index]`: string, required, 예시 출력. `exampleInputs`와 같은 개수.
  - `actualTestCaseInputs[index]`: string, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점 입력. 최소 1개.
  - `actualTestCaseOutputs[index]`: string, conditionally required, 서브테스크가 없는 일반 문제의 실제 채점 출력. `actualTestCaseInputs`와 같은 개수.
  - `subtasks[index].order`: number, optional, 서브테스크 순서. 하나 이상의 서브테스크를 보내면 기존 서브테스크와 HIDDEN 테스트 케이스를 요청 내용으로 교체한다.
  - `subtasks[index].title`: string, optional, 서브테스크 제목.
  - `subtasks[index].score`: number, optional, 서브테스크 배점.
  - `subtasks[index].prerequisiteSubtaskOrdersText`: string, optional, 쉼표로 구분한 선행 서브테스크 order 목록.
  - `subtasks[index].testCaseInputs[index]`: string, optional, 해당 서브테스크의 실제 채점 입력.
  - `subtasks[index].testCaseOutputs[index]`: string, optional, 해당 서브테스크의 실제 채점 출력.
  - `_csrf`: string, required, Spring Security CSRF token.
- Response body: 없음. 성공/실패 모두 HTML redirect 또는 form 재표시.
- Status codes:
  - 200: validation 실패 또는 수정 실패 시 문제 수정 화면을 다시 반환.
  - 302: 수정 성공 시 `/admin/problems`로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.
  - 입력 형식 오류, 입출력 목록 개수 불일치, 문제 없음: 문제 수정 화면을 다시 표시하고 오류 메시지를 표시한다.

### POST /admin/logout
- 설명: 관리자 서버 세션을 종료하고 로그인 화면으로 이동한다.
- 인증: admin-session. CSRF token 필요.
- Path params: 없음.
- Query params: 없음.
- Request body: `application/x-www-form-urlencoded`.
  - `_csrf`: string, required, Spring Security CSRF token.
- Response body: 없음. 성공 시 redirect.
- Status codes:
  - 302: `/admin/login?logout`으로 redirect.
- Error cases:
  - 인증 필요: `/admin/login`으로 redirect.

## 외부 API 매핑
- `POST /api/v1/auth/google`은 Google issuer `https://accounts.google.com`의 JWK/metadata를 통해 Google ID token을 검증한다.
- Google token audience는 `GOOGLE_OAUTH_CLIENT_ID` 환경 변수로 설정한다.
- `POST /api/v1/submissions`는 judge를 직접 호출하지 않는다. 제출을 `QUEUED`로 저장하고 백그라운드 processor가 `GET /api/v1/judge-status`로 idle 상태를 확인한 뒤 가장 오래된 제출 하나를 `RUNNING`으로 전환해 `POST /api/v1/judge-attempts`를 호출한다. status endpoint가 404 또는 405를 반환하는 judge 버전에서는 백엔드의 단일 queue processor lock으로 중복 실행을 막고 가장 오래된 제출 하나를 진행한다.
- `POST /api/v1/problems`는 문제 row를 저장하기 전에 `referenceSolutionCode`를 `language=cpp17`, `problem_id=null`, `checker_code=checkerCode`, HIDDEN 테스트 케이스, 문제 시간/메모리 제한과 함께 `POST /api/v1/judge-attempts`로 동기 사전 채점한다. 서브테스크 문제는 `subtasks[].testCases`를 HIDDEN 테스트 케이스로 flatten해서 전달한다. judge 결과가 `completed`이고 전체 실제 채점 테스트 케이스 수와 통과 수가 일치할 때만 문제를 저장한다.
- judge 요청에는 `problem_id=problems.id`, 제출 언어, 제출 소스 코드, `problems.checker_code`, HIDDEN 테스트 케이스, 문제 시간/메모리 제한을 전달한다.
- judge status 조회가 연결 실패, 인증 실패, 5xx 등으로 실패하면 제출은 `QUEUED`로 유지해 다음 poll에서 재시도한다. status endpoint 미지원(404 또는 405)은 compatibility fallback으로 처리해 한 제출을 진행한다. 채점 요청 실패 또는 응답 매핑 실패 시 해당 제출은 `JUDGE_ERROR`로 종료한다.
- judge result mapping:
  - `completed` -> `ACCEPTED`.
  - `failed_compile` -> `COMPILE_ERROR`.
  - `failed_runtime_missing` -> `JUDGE_ERROR`.
  - `failed_test_case` -> 첫 실패 테스트 케이스 상태에 따라 `WRONG_ANSWER`, `RUNTIME_ERROR`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`.
- subtask scoring:
  - judge는 테스트 케이스 단위 결과만 반환하고 서브테스크 점수 계산을 하지 않는다.
  - 백엔드는 EXAMPLE 테스트 케이스를 제외하고 HIDDEN 테스트 케이스 결과를 `problem_test_cases.subtask_id` 기준으로 그룹화한다.
  - 한 서브테스크의 모든 HIDDEN 테스트 케이스가 `passed`이고 `problem_subtask_prerequisites`에 정의된 모든 선행 서브테스크가 실제 `PASSED`이면 해당 `problem_subtasks.score`를 획득한다.
  - 자기 HIDDEN 테스트 케이스 중 하나라도 실패하거나 결과가 누락되면 서브테스크 결과는 `FAILED`이고 0점을 획득한다.
  - 자기 HIDDEN 테스트 케이스는 모두 통과했지만 선행 서브테스크가 `FAILED` 또는 `BLOCKED`이면 서브테스크 결과는 `BLOCKED`이고 0점을 획득한다.
  - 전체 점수는 획득한 서브테스크 점수 합이며 `submissions.score_percentage`에 저장한다.
  - 전체 점수가 100이면 `ACCEPTED`, 0보다 크고 100보다 작으면 `PARTIAL_ACCEPTED`, 0이면 첫 실패 테스트 케이스 상태를 대표 실패 상태로 사용한다.
- 문제 생성 시 저장된 `checkerCode`는 judge 요청의 `checker_code`로 전달한다. 값이 null이면 judge 기본 출력 비교를 사용한다.
- 외부 retry 정책은 judge status 조회 장애에 대한 다음 poll 재시도만 정의한다. status endpoint 미지원 fallback과 달리 채점 요청 자체가 실패하면 이미 `JUDGE_ERROR`가 된 제출의 재채점 API는 아직 정의하지 않는다.
