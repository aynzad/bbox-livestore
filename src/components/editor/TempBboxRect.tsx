import { Rect } from 'react-konva'

interface TempBboxRectProps {
  x: number
  y: number
  width: number
  height: number
}

export function TempBboxRect({ x, y, width, height }: TempBboxRectProps) {
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3b82f6"
      strokeWidth={1}
      dash={[5, 5]}
    />
  )
}

