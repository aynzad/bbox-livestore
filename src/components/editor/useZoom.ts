import { useCallback } from 'react'
import { useEditorStore } from './editor.store'

export function useZoom() {
  const scale = useEditorStore((state) => state.scale)
  const position = useEditorStore((state) => state.position)
  const setScale = useEditorStore((state) => state.setScale)
  const setPosition = useEditorStore((state) => state.setPosition)

  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault()

      const stage = e.target.getStage()
      const oldScale = scale
      const pointer = stage.getPointerPosition()

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      }

      const scaleBy = 1.1
      const newScale =
        e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      const clampedScale = Math.max(0.1, Math.min(5, newScale))

      setScale(clampedScale)

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      }
      setPosition(newPos)
    },
    [scale, position, setScale, setPosition],
  )

  const handleZoomIn = useEditorStore((state) => state.zoomIn)
  const handleZoomOut = useEditorStore((state) => state.zoomOut)
  const handleReset = useEditorStore((state) => state.resetZoom)

  return {
    scale,
    position,
    setPosition,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  }
}
