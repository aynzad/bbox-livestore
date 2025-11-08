import { Rect } from 'react-konva'
import type { Bbox } from './types'

interface BboxRectProps {
  bbox: Bbox
  isSelected: boolean
  isDraggable: boolean
  onDragEnd: (e: any) => void
  onTransformEnd: (e: any) => void
}

export function BboxRect({
  bbox,
  isSelected,
  isDraggable,
  onDragEnd,
  onTransformEnd,
}: BboxRectProps) {
  return (
    <Rect
      id={`bbox-${bbox.id}`}
      name="bbox"
      x={bbox.x}
      y={bbox.y}
      width={bbox.width}
      height={bbox.height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke={isSelected ? '#3b82f6' : '#60a5fa'}
      strokeWidth={isSelected ? 2 : 1}
      draggable={isDraggable}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  )
}

