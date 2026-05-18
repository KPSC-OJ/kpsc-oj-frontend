# 엔드포인트 목록 - kpsc-oj-frontend

이 문서는 목록 전용이다. Request/Response 상세를 작성하지 않는다.

| Method | URL | Auth | 설명 |
| --- | --- | --- | --- |
| GET | /health | public | 상태 확인 |
| POST | /api/v1/auth/google | public | Google ID token 검증 및 로그인 시작 |
| POST | /api/v1/auth/signup | public | 최초 로그인 사용자 서비스 아이디 등록 |
| POST | /api/v1/auth/refresh | public | refresh token으로 access/refresh token 재발급 |
| POST | /api/v1/auth/logout | authenticated | 현재 access token session 폐기 |
| GET | /api/v1/contests | public | 대회 목록 조회 |
| GET | /api/v1/contests/{contestId} | public | 대회 상세와 현재 사용자 참가/운영진 상태 조회 |
| POST | /api/v1/contests/{contestId}/join | authenticated | 대회 참가 또는 참가 승인 대기 신청 |
| GET | /api/v1/contests/{contestId}/participants/pending | authenticated | 운영진 참가 승인 대기 목록 조회 |
| POST | /api/v1/contests/{contestId}/participants/{participantId}/approve | authenticated | 운영진 참가 신청 승인 |
| GET | /api/v1/contests/{contestId}/problems | public | 대회 문제 목록 조회 |
| GET | /api/v1/contests/{contestId}/problems/{contestProblemId} | public | 대회 문제 상세 조회 |
| POST | /api/v1/contests/{contestId}/problems | authenticated | 운영진 대회 문제 생성 및 예시 정답 검증 |
| PATCH | /api/v1/contests/{contestId}/problems/{contestProblemId} | authenticated | 운영진 대회 문제 정의와 테스트 세트 수정 |
| DELETE | /api/v1/contests/{contestId}/problems/{contestProblemId} | authenticated | 운영진 대회 문제 삭제 |
| POST | /api/v1/contests/{contestId}/problems/{contestProblemId}/submissions | authenticated | 대회 문제 제출 생성 |
| GET | /api/v1/contests/{contestId}/submissions/me | authenticated | 내 대회 제출 목록 조회 |
| GET | /api/v1/contests/{contestId}/submissions | authenticated | 운영진 대회 전체 제출 목록 조회 |
| GET | /api/v1/contests/{contestId}/scoreboard | public | 대회 스코어보드 조회 |
| GET | /api/v1/problems | authenticated | 문제 목록 및 생성자 식별 정보 조회 |
| GET | /api/v1/problems/{problemNumber} | authenticated | 문제 상세 및 서브테스크 메타데이터 조회 |
| GET | /api/v1/problems/{problemNumber}/definition | authenticated | 문제 수정용 전체 문제/서브테스크 정의 조회 |
| POST | /api/v1/problems | admin-only | 문제 본문, 선택 checker, 테스트 케이스, 선택 서브테스크 생성 |
| PATCH | /api/v1/problems/{problemNumber} | authenticated | 문제 본문, 선택 checker, 테스트 케이스, 선택 서브테스크 수정 |
| POST | /api/v1/submissions | authenticated | 소스 코드 제출 생성 |
| GET | /api/v1/submissions/me | authenticated | 내 제출 목록 조회 |
| GET | /api/v1/submissions/{submissionId} | authenticated | 제출 상세, 전체 점수, 서브테스크 채점 결과 조회 |
