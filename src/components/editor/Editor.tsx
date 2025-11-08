import { useRef, useEffect } from 'react'
import { Stage, Layer } from 'react-konva'
import { EditorToolbar } from './EditorToolbar'
import { CanvasContent } from './CanvasContent'
import { BboxTransformer } from './BboxTransformer'
import { useImageLoader } from './useImageLoader'
import { useResizeDetector } from './useResizeDetector'
import { useZoom } from './useZoom'
import { useCanvasInteractions } from './useCanvasInteractions'
import { useEditorStore } from './editor.store'
import type { Bbox } from './types'

export interface EditorProps {
  bboxes?: Bbox[]
  onAdd?: (bbox: {
    x: number
    y: number
    width: number
    height: number
  }) => void
  onUpdate?: (bbox: {
    id: string
    x: number
    y: number
    width: number
    height: number
  }) => void
  onRemove?: (id: string) => void
  imageUrl?: string
}

export type { Bbox }

export function Editor({
  bboxes = [],
  onAdd,
  onUpdate,
  onRemove,
  imageUrl,
}: EditorProps) {
  const stageRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)

  const selectedId = useEditorStore((state) => state.selectedId)
  const tool = useEditorStore((state) => state.tool)
  const setSelectedId = useEditorStore((state) => state.setSelectedId)

  const { image } = useImageLoader(imageUrl)
  const { containerRef, containerSize } = useResizeDetector()
  const { handleWheel } = useZoom()

  const {
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleBboxDragEnd,
    handleTransformEnd,
    getCursor,
    isSpacePressed,
  } = useCanvasInteractions({
    onAdd,
    onUpdate,
  })

  // Update cursor dynamically
  const cursor = getCursor()

  // Update cursor style directly when space key state changes
  useEffect(() => {
    if (stageRef.current) {
      const stageNode = stageRef.current.getStage()
      if (stageNode) {
        stageNode.container().style.cursor = cursor
      }
    }
  }, [cursor, isSpacePressed])

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const stage = stageRef.current
      const selectedNode = stage.findOne(`#bbox-${selectedId}`)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer()?.batchDraw()
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([])
    }
  }, [selectedId])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && onRemove) {
          onRemove(selectedId)
          setSelectedId(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, onRemove, setSelectedId])

  const handleDelete = () => {
    if (selectedId && onRemove) {
      onRemove(selectedId)
      setSelectedId(null)
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <EditorToolbar onDelete={handleDelete} />

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-muted/10 w-full h-full relative"
      >
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle, var(--muted) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        <Stage
          className="relative z-10"
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onWheel={handleWheel}
          style={{ cursor }}
        >
          <Layer>
            <CanvasContent
              image={image}
              bboxes={bboxes}
              onBboxDragEnd={handleBboxDragEnd}
              onBboxTransformEnd={handleTransformEnd}
            />

            {selectedId && tool === 'select' && (
              <BboxTransformer transformerRef={transformerRef} />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
