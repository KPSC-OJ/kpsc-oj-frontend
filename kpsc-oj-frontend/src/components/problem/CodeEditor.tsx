import type { ReactElement } from 'react'
import Editor from '@monaco-editor/react'
import { useTheme } from '../../stores/useTheme'

export type CodeEditorLanguage = 'cpp' | 'java' | 'python'

type CodeEditorProps = {
  language: CodeEditorLanguage
  onChange: (sourceCode: string) => void
  value: string
}

export function CodeEditor({ language, onChange, value }: CodeEditorProps): ReactElement {
  const { isDarkMode } = useTheme()

  return (
    <div className="h-full min-h-0 flex-1 overflow-hidden bg-white">
      <Editor
        height="100%"
        language={language}
        loading={
          <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
            Editor loading
          </div>
        }
        onChange={(nextValue) => onChange(nextValue ?? '')}
        options={{
          automaticLayout: true,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 14,
          lineHeight: 22,
          minimap: { enabled: false },
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          scrollBeyondLastLine: false,
          tabSize: 4,
          wordWrap: 'on',
        }}
        theme={isDarkMode ? 'vs-dark' : 'vs'}
        value={value}
      />
    </div>
  )
}
