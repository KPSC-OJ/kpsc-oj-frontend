# Checker 코드 작성 가이드

이 문서는 출제자가 `checker_code`를 사용해 스페셜 저지 문제를 만들 때 지켜야 할 규약과 예시를 정리한다.

## 사용 시점

기본 채점은 제출 프로그램의 stdout과 테스트케이스의 `expected_output` 문자열을 직접 비교한다. 다음과 같이 정답이 하나로 고정되지 않거나 비교 규칙이 필요한 문제는 `checker_code`를 사용한다.

- 여러 출력 중 하나만 만족해도 정답인 구성 문제
- 실수 오차를 허용해야 하는 문제
- 공백, 줄바꿈, leading zero 등 표현 차이를 허용해야 하는 문제
- 출력 전체를 파싱해 조건을 검증해야 하는 문제

## 실행 규약

`checker_code`는 C++17 전체 소스 코드다. judge는 요청을 받을 때 checker를 한 번 컴파일하고, 제출 프로그램이 성공한 테스트케이스마다 checker를 실행한다.

| 항목 | 규약 |
| --- | --- |
| 언어 | C++17 |
| 컴파일 | `g++ -std=c++17` |
| 실행 형식 | `checker <expected_output_file> <actual_output_file>` |
| `argv[1]` | 해당 테스트케이스의 `expected_output` 내용을 UTF-8 파일로 저장한 경로 |
| `argv[2]` | 제출 프로그램 stdout을 UTF-8 파일로 저장한 경로 |
| 정답 | checker가 exit code `0`으로 종료 |
| 오답 | checker가 `0`이 아닌 exit code로 종료 |

checker의 stdout과 stderr는 정답 여부에 영향을 주지 않는다. 현재 API 응답도 checker의 stdout/stderr를 별도 피드백으로 노출하지 않으므로, 판정은 반드시 exit code로 표현한다.

## 기본 템플릿

```cpp
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    if (argc != 3) {
        return 1;
    }

    ifstream expected_file(argv[1]);
    ifstream actual_file(argv[2]);

    if (!expected_file.is_open() || !actual_file.is_open()) {
        return 1;
    }

    // expected_file: 테스트케이스 expected_output
    // actual_file: 제출 프로그램 stdout

    bool accepted = false;

    return accepted ? 0 : 1;
}
```

## 작성 원칙

- checker는 제출 코드가 정상 종료한 뒤에만 실행된다. 제출 코드가 런타임 오류, 시간 초과, 메모리 초과를 내면 checker는 실행되지 않는다.
- checker도 요청의 `time_limit_seconds`, `memory_limit_megabytes` 제한 안에서 실행된다. 불필요하게 무거운 검증은 피한다.
- 한 테스트케이스라도 실패하면 이후 테스트케이스는 실행하지 않는다.
- checker 컴파일이 실패하면 전체 채점 시도는 `failed_compile`로 끝난다.
- 현재 checker에는 원본 input 파일 경로가 전달되지 않는다. 입력값이나 숨겨진 검증 데이터가 필요하면 `expected_output`에 checker 전용 데이터를 함께 넣고 `argv[1]`에서 파싱한다.
- `return 2`, `return 3`처럼 다른 non-zero 값을 사용해도 judge는 모두 `wrong_answer`로 처리한다.
- 파일은 텍스트 모드로 열어도 되며, 현재 judge는 UTF-8 문자열로 expected/actual 파일을 만든다.

## 예시 1: 토큰 단위 비교

공백과 줄바꿈 차이를 무시하고 토큰 목록만 비교한다.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    if (argc != 3) return 1;

    ifstream expected_file(argv[1]);
    ifstream actual_file(argv[2]);

    vector<string> expected_tokens;
    vector<string> actual_tokens;
    string token;

    while (expected_file >> token) {
        expected_tokens.push_back(token);
    }

    while (actual_file >> token) {
        actual_tokens.push_back(token);
    }

    return expected_tokens == actual_tokens ? 0 : 1;
}
```

## 예시 2: 실수 오차 허용

단일 실수 답을 절대 오차 또는 상대 오차 `1e-6` 안에서 허용한다.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    if (argc != 3) return 1;

    ifstream expected_file(argv[1]);
    ifstream actual_file(argv[2]);

    double expected;
    double actual;

    if (!(expected_file >> expected)) return 1;
    if (!(actual_file >> actual)) return 1;
    if (!isfinite(actual)) return 1;

    const double eps = 1e-6;
    double diff = abs(expected - actual);
    double scale = max(1.0, abs(expected));

    return diff <= eps || diff <= eps * scale ? 0 : 1;
}
```

## 예시 3: 순서가 상관없는 정답

정답으로 출력해야 하는 정수 목록의 순서 차이를 허용하고, 같은 multiset인지 비교한다.

```cpp
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    if (argc != 3) return 1;

    ifstream expected_file(argv[1]);
    ifstream actual_file(argv[2]);

    vector<long long> expected_values;
    vector<long long> actual_values;
    long long value;

    while (expected_file >> value) {
        expected_values.push_back(value);
    }

    while (actual_file >> value) {
        actual_values.push_back(value);
    }

    sort(expected_values.begin(), expected_values.end());
    sort(actual_values.begin(), actual_values.end());

    return expected_values == actual_values ? 0 : 1;
}
```

## 예시 4: checker 전용 데이터 사용

원본 input이 checker에 전달되지 않으므로, 검증에 필요한 데이터는 `expected_output`에 넣어둘 수 있다. 아래 예시는 `expected_output` 첫 줄에 `n target`을 넣고, 제출 출력이 합이 `target`인 `n`개의 정수인지 확인한다.

테스트케이스 예시:

```json
{
  "input": "5 10\n",
  "expected_output": "5 10\n"
}
```

checker:

```cpp
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    if (argc != 3) return 1;

    ifstream expected_file(argv[1]);
    ifstream actual_file(argv[2]);

    int n;
    long long target;
    if (!(expected_file >> n >> target)) return 1;

    vector<long long> values(n);
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        if (!(actual_file >> values[i])) return 1;
        sum += values[i];
    }

    string extra;
    if (actual_file >> extra) return 1;

    return sum == target ? 0 : 1;
}
```

## API 요청 예시

`checker_code`에는 C++17 소스 전체를 문자열로 전달한다.

```json
{
  "problem_id": "float-answer",
  "language": "python3",
  "source_code": "print(0.3333333333)\n",
  "checker_code": "#include <bits/stdc++.h>\nusing namespace std;\nint main(int argc, char* argv[]) {\n    if (argc != 3) return 1;\n    ifstream expected_file(argv[1]);\n    ifstream actual_file(argv[2]);\n    double expected, actual;\n    if (!(expected_file >> expected)) return 1;\n    if (!(actual_file >> actual)) return 1;\n    return abs(expected - actual) <= 1e-6 ? 0 : 1;\n}\n",
  "test_cases": [
    {
      "input": "",
      "expected_output": "0.3333333333333333\n"
    }
  ],
  "time_limit_seconds": 2.0,
  "memory_limit_megabytes": 128
}
```

## 출제 전 확인 목록

- checker가 로컬에서 `g++ -std=c++17`로 컴파일되는가?
- `argc != 3`인 경우를 처리하는가?
- `argv[1]`을 expected, `argv[2]`를 actual로 읽고 있는가?
- 제출 출력이 부족하거나 형식이 틀린 경우 오답 처리하는가?
- 제출 출력 뒤에 불필요한 토큰이 남으면 오답이어야 하는 문제인지 확인했는가?
- 실수 문제라면 `NaN`, `inf`를 거부하는가?
- checker 전용 데이터가 필요하다면 `expected_output` 형식이 문서화되어 있는가?
- 최악의 제출 출력 크기에서도 checker가 시간/메모리 제한 안에 끝나는가?
