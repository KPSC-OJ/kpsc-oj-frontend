import type { ReactElement } from 'react'
import { Card } from '../common/Card'

const checkerTemplate = `#include <bits/stdc++.h>
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

    // expected_file: 테스트케이스 expected output
    // actual_file: 제출 프로그램 stdout

    bool accepted = false;

    return accepted ? 0 : 1;
}`

const checkerUseCases = [
  '여러 출력 중 하나만 만족해도 정답인 문제',
  '실수 오차를 허용해야 하는 문제',
  '공백, 줄바꿈, leading zero 같은 표현 차이를 허용해야 하는 문제',
  '출력 전체를 파싱해 조건을 검증해야 하는 문제',
]

const checkerChecklist = [
  'g++ -std=c++17로 로컬 컴파일이 되는지 확인한다.',
  'argc != 3인 경우를 오답으로 처리한다.',
  'argv[1]은 expected, argv[2]는 actual 출력 파일로 읽는다.',
  '제출 출력이 부족하거나 형식이 틀리면 non-zero exit code를 반환한다.',
  'checker 전용 데이터가 필요하면 expected output에 넣고 argv[1]에서 파싱한다.',
  '최악의 출력 크기에서도 문제의 시간/메모리 제한 안에 끝나는지 확인한다.',
]

/** 출제자가 C++17 checker 코드를 작성할 때 필요한 실행 규약과 확인 항목을 표시한다. */
export function CheckerGuide(): ReactElement {
  return (
    <Card className="space-y-5 bg-slate-50 shadow-none">
      <div>
        <h2 className="text-lg font-black text-slate-950">checker 작성 가이드</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          기본 채점은 expected output과 제출 stdout을 직접 비교합니다. 정답이 여러
          형태로 가능하거나 별도 비교 규칙이 필요할 때만 checker를 등록합니다.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-black text-slate-800">사용 시점</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            {checkerUseCases.map((useCase) => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-black text-slate-800">실행 규약</h3>
          <dl className="mt-2 grid grid-cols-[88px_1fr] gap-x-3 gap-y-1 text-sm leading-6">
            <dt className="font-bold text-slate-500">언어</dt>
            <dd className="text-slate-700">C++17</dd>
            <dt className="font-bold text-slate-500">컴파일</dt>
            <dd className="font-mono text-xs text-slate-700">g++ -std=c++17</dd>
            <dt className="font-bold text-slate-500">실행</dt>
            <dd className="font-mono text-xs text-slate-700">
              checker &lt;expected_output_file&gt; &lt;actual_output_file&gt;
            </dd>
            <dt className="font-bold text-slate-500">정답</dt>
            <dd className="text-slate-700">exit code 0</dd>
            <dt className="font-bold text-slate-500">오답</dt>
            <dd className="text-slate-700">0이 아닌 exit code</dd>
          </dl>
        </div>
      </div>

      <details className="rounded-md border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-black text-slate-800">
          기본 템플릿 보기
        </summary>
        <pre className="max-h-96 overflow-auto border-t border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {checkerTemplate}
        </pre>
      </details>

      <details className="rounded-md border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-black text-slate-800">
          작성 전 확인 목록
        </summary>
        <ul className="list-disc space-y-1 border-t border-slate-200 px-8 py-4 text-sm leading-6 text-slate-600">
          {checkerChecklist.map((checkItem) => (
            <li key={checkItem}>{checkItem}</li>
          ))}
        </ul>
      </details>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        checker stdout과 stderr는 정답 여부에 영향을 주지 않습니다. 판정은 반드시 exit
        code로 표현해야 하며, 제출 코드가 런타임 오류, 시간 초과, 메모리 초과를 내면
        checker는 실행되지 않습니다.
      </div>
    </Card>
  )
}
