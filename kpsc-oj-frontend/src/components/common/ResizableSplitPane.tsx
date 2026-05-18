import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'

const wideLayoutMinWidthPixels = 1024
const defaultFirstPaneRatio = 42.5
const keyboardStepRatio = 3

type ResizableSplitPaneProps = {
  ariaLabel: string
  className?: string
  firstPane: ReactNode
  initialFirstPaneRatio?: number
  minFirstPanePixels?: number
  minSecondPanePixels?: number
  secondPane: ReactNode
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(Math.max(value, minValue), maxValue)
}

export function ResizableSplitPane({
  ariaLabel,
  className,
  firstPane,
  initialFirstPaneRatio = defaultFirstPaneRatio,
  minFirstPanePixels = 320,
  minSecondPanePixels = 420,
  secondPane,
}: ResizableSplitPaneProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isWideLayout, setIsWideLayout] = useState(true)
  const [firstPaneRatio, setFirstPaneRatio] = useState(initialFirstPaneRatio)

  const getBoundedRatio = useCallback(
    (nextRatio: number, containerSize: number): number => {
      if (containerSize <= 0) {
        return clamp(nextRatio, 25, 75)
      }

      const minRatio = Math.min((minFirstPanePixels / containerSize) * 100, 75)
      const maxRatio = Math.max(100 - (minSecondPanePixels / containerSize) * 100, 25)

      if (minRatio > maxRatio) {
        return clamp(nextRatio, 25, 75)
      }

      return clamp(nextRatio, minRatio, maxRatio)
    },
    [minFirstPanePixels, minSecondPanePixels],
  )

  const updateRatioFromPointer = useCallback(
    (clientX: number, clientY: number): void => {
      const container = containerRef.current

      if (!container) {
        return
      }

      const rect = container.getBoundingClientRect()
      const containerSize = isWideLayout ? rect.width : rect.height
      const pointerOffset = isWideLayout ? clientX - rect.left : clientY - rect.top
      const nextRatio = (pointerOffset / containerSize) * 100

      setFirstPaneRatio(getBoundedRatio(nextRatio, containerSize))
    },
    [getBoundedRatio, isWideLayout],
  )

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const observedContainer = container

    function updateLayoutMode(): void {
      setIsWideLayout(observedContainer.clientWidth >= wideLayoutMinWidthPixels)
    }

    updateLayoutMode()

    const resizeObserver = new ResizeObserver(updateLayoutMode)
    resizeObserver.observe(observedContainer)

    return () => resizeObserver.disconnect()
  }, [])

  function handleDividerPointerDown(event: PointerEvent<HTMLDivElement>): void {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    updateRatioFromPointer(event.clientX, event.clientY)
  }

  function handleDividerPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return
    }

    updateRatioFromPointer(event.clientX, event.clientY)
  }

  function handleDividerPointerUp(event: PointerEvent<HTMLDivElement>): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleDividerKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const container = containerRef.current

    if (!container) {
      return
    }

    const containerSize = isWideLayout ? container.clientWidth : container.clientHeight

    if (event.key === 'Home') {
      event.preventDefault()
      setFirstPaneRatio(getBoundedRatio(25, containerSize))

      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setFirstPaneRatio(getBoundedRatio(75, containerSize))

      return
    }

    const shouldDecrease =
      (isWideLayout && event.key === 'ArrowLeft') ||
      (!isWideLayout && event.key === 'ArrowUp')
    const shouldIncrease =
      (isWideLayout && event.key === 'ArrowRight') ||
      (!isWideLayout && event.key === 'ArrowDown')

    if (!shouldDecrease && !shouldIncrease) {
      return
    }

    event.preventDefault()
    setFirstPaneRatio((currentRatio) =>
      getBoundedRatio(
        currentRatio + (shouldDecrease ? -keyboardStepRatio : keyboardStepRatio),
        containerSize,
      ),
    )
  }

  const splitPaneClassName = ['grid h-full min-h-0 w-full flex-1 overflow-hidden', className]
    .filter(Boolean)
    .join(' ')
  const splitPaneStyle: CSSProperties = isWideLayout
    ? { gridTemplateColumns: `${firstPaneRatio}% 10px minmax(0, 1fr)` }
    : { gridTemplateRows: `${firstPaneRatio}% 10px minmax(0, 1fr)` }
  const dividerClassName = [
    'relative z-10 flex touch-none select-none items-center justify-center bg-slate-100 text-slate-400 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 active:bg-blue-100',
    isWideLayout
      ? 'cursor-col-resize border-x border-slate-200'
      : 'cursor-row-resize border-y border-slate-200',
  ].join(' ')
  const handleClassName = isWideLayout
    ? 'h-10 w-1 rounded-full bg-slate-300'
    : 'h-1 w-10 rounded-full bg-slate-300'

  return (
    <div className={splitPaneClassName} ref={containerRef} style={splitPaneStyle}>
      <div className="resizable-split-pane__pane">{firstPane}</div>
      <div
        aria-label={ariaLabel}
        aria-orientation={isWideLayout ? 'vertical' : 'horizontal'}
        aria-valuemax={75}
        aria-valuemin={25}
        aria-valuenow={Math.round(firstPaneRatio)}
        className={dividerClassName}
        onKeyDown={handleDividerKeyDown}
        onPointerCancel={handleDividerPointerUp}
        onPointerDown={handleDividerPointerDown}
        onPointerMove={handleDividerPointerMove}
        onPointerUp={handleDividerPointerUp}
        role="separator"
        tabIndex={0}
      >
        <span className={handleClassName} />
      </div>
      <div className="resizable-split-pane__pane">{secondPane}</div>
    </div>
  )
}
