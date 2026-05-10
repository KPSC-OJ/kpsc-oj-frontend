import { useState, type ReactElement } from 'react'
import { Check, Copy, X } from 'lucide-react'

type CopyStatus = 'idle' | 'copied' | 'failed'

type ProblemExampleBlockProps = {
  label: string
  value: string
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)

    return true
  }

  const textAreaElement = document.createElement('textarea')
  textAreaElement.value = value
  textAreaElement.setAttribute('readonly', '')
  textAreaElement.style.position = 'fixed'
  textAreaElement.style.left = '-9999px'
  textAreaElement.style.top = '0'
  document.body.appendChild(textAreaElement)
  textAreaElement.select()

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textAreaElement)
  }
}

function getCopyButtonLabel(label: string, copyStatus: CopyStatus): string {
  if (copyStatus === 'copied') {
    return `${label} 복사됨`
  }

  if (copyStatus === 'failed') {
    return `${label} 복사 실패`
  }

  return `${label} 복사`
}

function getCopyButtonClassName(copyStatus: CopyStatus): string {
  return [
    'inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-slate-500 transition hover:bg-white hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
    copyStatus === 'copied'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : copyStatus === 'failed'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-slate-200 bg-slate-50',
  ].join(' ')
}

/** 문제 예제 입출력을 표시하고 사용자가 원문을 클립보드에 복사할 수 있게 한다. */
export function ProblemExampleBlock({ label, value }: ProblemExampleBlockProps): ReactElement {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const copyButtonLabel = getCopyButtonLabel(label, copyStatus)

  async function copyExampleValue(): Promise<void> {
    try {
      const wasCopied = await copyTextToClipboard(value)
      setCopyStatus(wasCopied ? 'copied' : 'failed')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-black uppercase text-slate-400">{label}</div>
        <button
          aria-label={copyButtonLabel}
          className={getCopyButtonClassName(copyStatus)}
          onClick={copyExampleValue}
          title={copyButtonLabel}
          type="button"
        >
          {copyStatus === 'copied' ? (
            <Check size={15} />
          ) : copyStatus === 'failed' ? (
            <X size={15} />
          ) : (
            <Copy size={15} />
          )}
        </button>
      </div>
      <pre className="min-h-16 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {value}
      </pre>
    </div>
  )
}
