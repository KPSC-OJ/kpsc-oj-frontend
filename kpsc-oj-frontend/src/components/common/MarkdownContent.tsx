import { useMemo, type ReactElement, type ReactNode } from 'react'
import { BlockMath, InlineMath } from 'react-katex'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

type MarkdownContentProps = {
  className?: string
  markdown: string
}

type MarkdownSegment = {
  isCode: boolean
  text: string
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ')
}

function classNameIncludes(className: string | undefined, targetClassName: string): boolean {
  return className?.split(/\s+/).includes(targetClassName) ?? false
}

function getTextContent(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }

  if (Array.isArray(children)) {
    return children.map(getTextContent).join('')
  }

  return ''
}

function renderInlineMathError(math: string): ReactElement {
  return (
    <code className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[0.9em] text-rose-700">
      {`$${math}$`}
    </code>
  )
}

function renderBlockMathError(math: string): ReactElement {
  return (
    <pre className="overflow-x-auto rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
      {math}
    </pre>
  )
}

function splitFencedCodeSegments(markdown: string): MarkdownSegment[] {
  const lines = markdown.split('\n')
  const segments: MarkdownSegment[] = []
  let currentText = ''
  let isInsideFence = false
  let fenceCharacter: '`' | '~' | null = null
  let fenceLength = 0

  function pushCurrentText(isCode: boolean): void {
    if (!currentText) {
      return
    }

    segments.push({ isCode, text: currentText })
    currentText = ''
  }

  for (const [index, line] of lines.entries()) {
    const lineWithEnding = index === lines.length - 1 ? line : `${line}\n`
    const fenceMatch = line.match(/^[ \t]*(`{3,}|~{3,})/)

    if (!isInsideFence && fenceMatch) {
      pushCurrentText(false)
      isInsideFence = true
      fenceCharacter = fenceMatch[1][0] as '`' | '~'
      fenceLength = fenceMatch[1].length
      currentText += lineWithEnding

      continue
    }

    if (isInsideFence) {
      currentText += lineWithEnding

      if (
        fenceCharacter &&
        fenceMatch &&
        fenceMatch[1][0] === fenceCharacter &&
        fenceMatch[1].length >= fenceLength
      ) {
        pushCurrentText(true)
        isInsideFence = false
        fenceCharacter = null
        fenceLength = 0
      }

      continue
    }

    currentText += lineWithEnding
  }

  pushCurrentText(isInsideFence)

  return segments
}

function splitInlineCodeSegments(markdown: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  let currentIndex = 0

  while (currentIndex < markdown.length) {
    const openingIndex = markdown.indexOf('`', currentIndex)

    if (openingIndex === -1) {
      segments.push({ isCode: false, text: markdown.slice(currentIndex) })

      break
    }

    let tickCount = 1

    while (markdown[openingIndex + tickCount] === '`') {
      tickCount += 1
    }

    const marker = '`'.repeat(tickCount)
    const closingIndex = markdown.indexOf(marker, openingIndex + tickCount)

    if (closingIndex === -1) {
      segments.push({ isCode: false, text: markdown.slice(currentIndex) })

      break
    }

    if (openingIndex > currentIndex) {
      segments.push({ isCode: false, text: markdown.slice(currentIndex, openingIndex) })
    }

    segments.push({
      isCode: true,
      text: markdown.slice(openingIndex, closingIndex + tickCount),
    })
    currentIndex = closingIndex + tickCount
  }

  return segments.filter((segment) => segment.text.length > 0)
}

function normalizeBlockMathContent(math: string): string {
  return math.trim()
}

function normalizeStandaloneDoubleDollarMath(markdown: string): string {
  return markdown.replace(
    /^([ \t]*)\$\$([^\n]+?)\$\$[ \t]*$/gm,
    (_match, indent: string, math: string) =>
      `${indent}$$\n${normalizeBlockMathContent(math)}\n${indent}$$`,
  )
}

function normalizeMathDelimitersInText(markdown: string): string {
  const markdownWithDisplayMath = markdown.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_match, math: string) => `\n$$\n${normalizeBlockMathContent(math)}\n$$\n`,
  )
  const markdownWithInlineMath = markdownWithDisplayMath.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_match, math: string) => `$${math.trim()}$`,
  )

  return normalizeStandaloneDoubleDollarMath(markdownWithInlineMath)
}

// remark-math only receives dollar-based math nodes, while Markdown escapes
// backslash bracket delimiters before they can reach KaTeX.
function normalizeMarkdownMath(markdown: string): string {
  return splitFencedCodeSegments(markdown)
    .map((fencedSegment) => {
      if (fencedSegment.isCode) {
        return fencedSegment.text
      }

      return splitInlineCodeSegments(fencedSegment.text)
        .map((inlineSegment) =>
          inlineSegment.isCode
            ? inlineSegment.text
            : normalizeMathDelimitersInText(inlineSegment.text),
        )
        .join('')
    })
    .join('')
}

function isMathDisplayPreNode(node: unknown): boolean {
  const candidate = node as
    | {
        children?: Array<{
          properties?: {
            className?: unknown
          }
        }>
      }
    | undefined
  const firstChildClassName = candidate?.children?.[0]?.properties?.className

  return Array.isArray(firstChildClassName) && firstChildClassName.includes('math-display')
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
    const math = getTextContent(children).replace(/\n$/, '')

    if (classNameIncludes(className, 'math-inline')) {
      return (
        <InlineMath math={math} renderError={() => renderInlineMathError(math)} />
      )
    }

    if (classNameIncludes(className, 'math-display')) {
      return <BlockMath math={math} renderError={() => renderBlockMathError(math)} />
    }

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
  pre({ children, node }) {
    if (isMathDisplayPreNode(node)) {
      return <div className="overflow-x-auto py-1">{children}</div>
    }

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
  const normalizedMarkdown = useMemo(() => normalizeMarkdownMath(markdown), [markdown])

  return (
    <div className={joinClassNames('space-y-4 text-sm text-slate-600', className)}>
      <Markdown components={markdownComponents} remarkPlugins={[remarkGfm, remarkMath]}>
        {normalizedMarkdown}
      </Markdown>
    </div>
  )
}
