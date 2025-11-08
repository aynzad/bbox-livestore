import { Group } from 'react-konva'
import { BackgroundImage } from './BackgroundImage'
import { BboxRect } from './BboxRect'
import { TempBboxRect } from './TempBboxRect'
import { useEditorStore } from './editor.store'
import type { Bbox } from './types'

interface CanvasContentProps {
  image: HTMLImageElement | null
  bboxes: Bbox[]
  onBboxDragEnd: (e: any) => void
  onBboxTransformEnd: (e: any) => void
}

export function CanvasContent({
  image,
  bboxes,
  onBboxDragEnd,
  onBboxTransformEnd,
}: CanvasContentProps) {
  const selectedId = useEditorStore((state) => state.selectedId)
  const tool = useEditorStore((state) => state.tool)
  const tempBbox = useEditorStore((state) => state.tempBbox)
  const position = useEditorStore((state) => state.position)
  const scale = useEditorStore((state) => state.scale)

  return (
    <Group x={position.x} y={position.y} scaleX={scale} scaleY={scale}>
      {image && <BackgroundImage image={image} />}

      {bboxes.map((bbox) => (
        <BboxRect
          key={bbox.id}
          bbox={bbox}
          isSelected={selectedId === bbox.id}
          isDraggable={tool === 'select' && selectedId === bbox.id}
          onDragEnd={onBboxDragEnd}
          onTransformEnd={onBboxTransformEnd}
        />
      ))}

      {tempBbox && (
        <TempBboxRect
          x={tempBbox.x}
          y={tempBbox.y}
          width={tempBbox.width}
          height={tempBbox.height}
        />
      )}
    </Group>
  )
}
