import { useCallback } from 'react'
import { useEditorStore } from './editor.store'

interface UseCanvasInteractionsProps {
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
}

export function useCanvasInteractions({
  onAdd,
  onUpdate,
}: UseCanvasInteractionsProps) {
  const tool = useEditorStore((state) => state.tool)
  const scale = useEditorStore((state) => state.scale)
  const position = useEditorStore((state) => state.position)
  const isDrawing = useEditorStore((state) => state.isDrawing)
  const drawStart = useEditorStore((state) => state.drawStart)
  const tempBbox = useEditorStore((state) => state.tempBbox)
  const isPanning = useEditorStore((state) => state.isPanning)
  const panStart = useEditorStore((state) => state.panStart)

  const setSelectedId = useEditorStore((state) => state.setSelectedId)
  const setPosition = useEditorStore((state) => state.setPosition)
  const setIsDrawing = useEditorStore((state) => state.setIsDrawing)
  const setDrawStart = useEditorStore((state) => state.setDrawStart)
  const setTempBbox = useEditorStore((state) => state.setTempBbox)
  const setIsPanning = useEditorStore((state) => state.setIsPanning)
  const setPanStart = useEditorStore((state) => state.setPanStart)

  const handleStageMouseDown = useCallback(
    (e: any) => {
      const stage = e.target.getStage()
      const pointerPos = stage.getPointerPosition()

      // Transform pointer position to account for zoom and pan
      const x = (pointerPos.x - position.x) / scale
      const y = (pointerPos.y - position.y) / scale

      if (tool === 'pan') {
        setIsPanning(true)
        setPanStart(pointerPos)
        return
      }

      if (tool === 'bbox') {
        setIsDrawing(true)
        setDrawStart({ x, y })
        setTempBbox({ x, y, width: 0, height: 0 })
        setSelectedId(null)
        return
      }

      // Select tool
      const clickedOnEmpty = e.target === stage
      if (clickedOnEmpty) {
        setSelectedId(null)
        return
      }

      // Check if clicked on a bbox
      const clickedOnBbox = e.target.hasName('bbox')
      if (clickedOnBbox) {
        const id = e.target.id().replace('bbox-', '')
        setSelectedId(id)
      }
    },
    [
      tool,
      scale,
      position,
      setIsPanning,
      setPanStart,
      setIsDrawing,
      setDrawStart,
      setTempBbox,
      setSelectedId,
    ],
  )

  const handleStageMouseMove = useCallback(
    (e: any) => {
      const stage = e.target.getStage()
      const pointerPos = stage.getPointerPosition()

      if (isPanning && panStart && tool === 'pan') {
        const dx = pointerPos.x - panStart.x
        const dy = pointerPos.y - panStart.y
        setPosition({
          x: position.x + dx,
          y: position.y + dy,
        })
        setPanStart(pointerPos)
        return
      }

      if (isDrawing && drawStart && tool === 'bbox') {
        const x = (pointerPos.x - position.x) / scale
        const y = (pointerPos.y - position.y) / scale

        const width = x - drawStart.x
        const height = y - drawStart.y

        setTempBbox({
          x: width < 0 ? x : drawStart.x,
          y: height < 0 ? y : drawStart.y,
          width: Math.abs(width),
          height: Math.abs(height),
        })
      }
    },
    [
      isPanning,
      panStart,
      tool,
      position,
      setPosition,
      setPanStart,
      isDrawing,
      drawStart,
      scale,
      setTempBbox,
    ],
  )

  const handleStageMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false)
      setPanStart(null)
      return
    }

    if (isDrawing && tempBbox && tool === 'bbox') {
      // Only add if bbox has minimum size
      if (tempBbox.width > 5 && tempBbox.height > 5 && onAdd) {
        onAdd(tempBbox)
      }
      setIsDrawing(false)
      setDrawStart(null)
      setTempBbox(null)
    }
  }, [
    isPanning,
    setIsPanning,
    setPanStart,
    isDrawing,
    tempBbox,
    tool,
    onAdd,
    setIsDrawing,
    setDrawStart,
    setTempBbox,
  ])

  const handleBboxDragEnd = useCallback(
    (e: any) => {
      const node = e.target
      const id = node.id().replace('bbox-', '')
      const updatedBbox = {
        id,
        x: node.x(),
        y: node.y(),
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY(),
      }

      // Reset scale
      node.scaleX(1)
      node.scaleY(1)

      if (onUpdate) {
        onUpdate(updatedBbox)
      }
    },
    [onUpdate],
  )

  const handleTransformEnd = useCallback(
    (e: any) => {
      const node = e.target
      const id = node.id().replace('bbox-', '')
      const updatedBbox = {
        id,
        x: node.x(),
        y: node.y(),
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY(),
      }

      // Reset scale
      node.scaleX(1)
      node.scaleY(1)

      if (onUpdate) {
        onUpdate(updatedBbox)
      }
    },
    [onUpdate],
  )

  const getCursor = useCallback(() => {
    if (isPanning) return 'grabbing'
    if (tool === 'pan') return 'grab'
    if (tool === 'bbox') return 'crosshair'
    return 'default'
  }, [isPanning, tool])

  return {
    tempBbox,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleBboxDragEnd,
    handleTransformEnd,
    getCursor,
  }
}
