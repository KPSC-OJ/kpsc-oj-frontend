import type { ReactElement } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MarkdownContentProps = {
  className?: string
  markdown: string
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ')
}

const markdownComponents: Components = {
  a({ children, href }) {
    return (
      <a
        className="font-semibold text-blue-700 underline-offset-2 hover:underline"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    )
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-slate-200 pl-4 text-slate-600">
        {children}
      </blockquote>
    )
  },
  code({ children, className }) {
    const isBlockCode = className?.startsWith('language-') ?? false

    return (
      <code
        className={joinClassNames(
          isBlockCode
            ? 'font-mono text-[0.9em]'
            : 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900',
          className,
        )}
      >
        {children}
      </code>
    )
  },
  h1({ children }) {
    return <h1 className="text-xl font-black text-slate-950">{children}</h1>
  },
  h2({ children }) {
    return <h2 className="text-lg font-black text-slate-950">{children}</h2>
  },
  h3({ children }) {
    return <h3 className="text-base font-black text-slate-950">{children}</h3>
  },
  li({ children }) {
    return <li className="pl-1">{children}</li>
  },
  ol({ children }) {
    return <ol className="list-decimal space-y-1 pl-5">{children}</ol>
  },
  p({ children }) {
    return <p className="text-sm leading-7 text-slate-600">{children}</p>
  },
  pre({ children }) {
    return (
      <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
        {children}
      </pre>
    )
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-max border-collapse text-sm">{children}</table>
      </div>
    )
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-slate-100">{children}</tbody>
  },
  td({ children }) {
    return <td className="px-3 py-2 align-top text-slate-600">{children}</td>
  },
  th({ children }) {
    return (
      <th className="bg-slate-50 px-3 py-2 text-left font-bold text-slate-700">
        {children}
      </th>
    )
  },
  thead({ children }) {
    return <thead className="border-b border-slate-200">{children}</thead>
  },
  ul({ children }) {
    return <ul className="list-disc space-y-1 pl-5">{children}</ul>
  },
}

/** 사용자에게 노출되는 Markdown 문서를 안전한 React 요소로 렌더링한다. */
export function MarkdownContent({
  className,
  markdown,
}: MarkdownContentProps): ReactElement {
  return (
    <div className={joinClassNames('space-y-4 text-sm text-slate-600', className)}>
      <Markdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {markdown}
      </Markdown>
    </div>
  )
}
