import { useCallback, useState, useEffect } from 'react'
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
  const setScale = useEditorStore((state) => state.setScale)

  // Track space key state for cursor updates and panning
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  // Track touch state for pinch-to-zoom and multi-touch handling
  const [touchState, setTouchState] = useState<{
    touches: Touch[]
    lastDistance: number | null
    lastCenter: { x: number; y: number } | null
  }>({
    touches: [],
    lastDistance: null,
    lastCenter: null,
  })

  const handleStageMouseDown = useCallback(
    (e: any) => {
      const stage = e.target.getStage()
      const pointerPos = stage.getPointerPosition()

      // Transform pointer position to account for zoom and pan
      const x = (pointerPos.x - position.x) / scale
      const y = (pointerPos.y - position.y) / scale

      // Temporary pan with Space key (takes priority)
      if (isSpacePressed) {
        setIsPanning(true)
        setPanStart(pointerPos)
        return
      }

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
      isSpacePressed,
    ],
  )

  const handleStageMouseMove = useCallback(
    (e: any) => {
      const stage = e.target.getStage()
      const pointerPos = stage.getPointerPosition()

      // Handle panning (either from pan tool or temporary space pan)
      // Only continue panning if it was already started (via mouse down)
      if (isPanning && panStart) {
        // Check if we should continue panning (pan tool or space still pressed)
        if (tool === 'pan' || isSpacePressed) {
          const dx = pointerPos.x - panStart.x
          const dy = pointerPos.y - panStart.y
          setPosition({
            x: position.x + dx,
            y: position.y + dy,
          })
          setPanStart(pointerPos)
          return
        } else {
          // Space was released, stop panning
          setIsPanning(false)
          setPanStart(null)
        }
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
      setIsPanning,
      isDrawing,
      drawStart,
      scale,
      setTempBbox,
      isSpacePressed,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault() // Prevent page scrolling
        setIsSpacePressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(false)
        // If panning with space and space is released, stop panning
        if (isPanning && tool !== 'pan') {
          setIsPanning(false)
          setPanStart(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPanning, tool, setIsPanning, setPanStart])

  const getCursor = useCallback(() => {
    if (isPanning) return 'grabbing'
    if (isSpacePressed) return 'grab'
    if (tool === 'pan') return 'grab'
    if (tool === 'bbox') return 'crosshair'
    return 'default'
  }, [isPanning, isSpacePressed, tool])

  // Helper function to get distance between two touches
  const getTouchDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Helper function to get center point between two touches
  const getTouchCenter = useCallback((touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    }
  }, [])

  // Helper function to convert touch position to stage coordinates
  const getTouchPosition = useCallback(
    (touch: Touch, stage: any) => {
      const box = stage.container().getBoundingClientRect()
      return {
        x: touch.clientX - box.left,
        y: touch.clientY - box.top,
      }
    },
    [],
  )

  const handleStageTouchStart = useCallback(
    (e: any) => {
      e.evt.preventDefault() // Prevent default touch behaviors
      const stage = e.target.getStage()
      const touches = Array.from(e.evt.touches) as Touch[]

      // Handle two-finger pinch-to-zoom
      if (touches.length === 2) {
        const distance = getTouchDistance(touches[0], touches[1])
        const center = getTouchCenter(touches[0], touches[1])
        const centerPos = getTouchPosition(
          { clientX: center.x, clientY: center.y } as Touch,
          stage,
        )

        setTouchState({
          touches,
          lastDistance: distance,
          lastCenter: centerPos,
        })
        return
      }

      // Handle single touch
      if (touches.length === 1) {
        const touch = touches[0]
        const pointerPos = getTouchPosition(touch, stage)

        // Transform pointer position to account for zoom and pan
        const x = (pointerPos.x - position.x) / scale
        const y = (pointerPos.y - position.y) / scale

        // On touch devices, pan is the default behavior (like space key)
        if (tool === 'pan') {
          setIsPanning(true)
          setPanStart(pointerPos)
          setTouchState({ touches, lastDistance: null, lastCenter: null })
          return
        }

        if (tool === 'bbox') {
          setIsDrawing(true)
          setDrawStart({ x, y })
          setTempBbox({ x, y, width: 0, height: 0 })
          setSelectedId(null)
          setTouchState({ touches, lastDistance: null, lastCenter: null })
          return
        }

        // Select tool - on touch, allow panning when clicking on empty area
        const clickedOnEmpty = e.target === stage
        if (clickedOnEmpty) {
          setSelectedId(null)
          // Start panning on touch devices for better UX
          setIsPanning(true)
          setPanStart(pointerPos)
          setTouchState({ touches, lastDistance: null, lastCenter: null })
          return
        }

        // Check if clicked on a bbox
        const clickedOnBbox = e.target.hasName('bbox')
        if (clickedOnBbox) {
          const id = e.target.id().replace('bbox-', '')
          setSelectedId(id)
          // Don't start panning if clicking on a bbox
          setTouchState({ touches, lastDistance: null, lastCenter: null })
          return
        }

        setTouchState({ touches, lastDistance: null, lastCenter: null })
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
      getTouchDistance,
      getTouchCenter,
      getTouchPosition,
    ],
  )

  const handleStageTouchMove = useCallback(
    (e: any) => {
      e.evt.preventDefault() // Prevent default touch behaviors
      const stage = e.target.getStage()
      const touches = Array.from(e.evt.touches) as Touch[]

      // Handle two-finger pinch-to-zoom
      if (touches.length === 2 && touchState.lastDistance && touchState.lastCenter) {
        const distance = getTouchDistance(touches[0], touches[1])
        const center = getTouchCenter(touches[0], touches[1])
        const centerPos = getTouchPosition(
          { clientX: center.x, clientY: center.y } as Touch,
          stage,
        )

        const scaleBy = distance / touchState.lastDistance
        const newScale = scale * scaleBy
        const clampedScale = Math.max(0.1, Math.min(5, newScale))

        // Calculate zoom center point in stage coordinates
        const mousePointTo = {
          x: (touchState.lastCenter.x - position.x) / scale,
          y: (touchState.lastCenter.y - position.y) / scale,
        }

        const newPos = {
          x: centerPos.x - mousePointTo.x * clampedScale,
          y: centerPos.y - mousePointTo.y * clampedScale,
        }

        setScale(clampedScale)
        setPosition(newPos)

        setTouchState({
          touches,
          lastDistance: distance,
          lastCenter: centerPos,
        })
        return
      }

      // Handle single touch panning (pan tool or select tool on empty area)
      if (touches.length === 1 && isPanning && panStart && (tool === 'pan' || tool === 'select')) {
        const touch = touches[0]
        const pointerPos = getTouchPosition(touch, stage)
        const dx = pointerPos.x - panStart.x
        const dy = pointerPos.y - panStart.y
        setPosition({
          x: position.x + dx,
          y: position.y + dy,
        })
        setPanStart(pointerPos)
        setTouchState({ touches, lastDistance: null, lastCenter: null })
        return
      }

      // Handle single touch drawing
      if (touches.length === 1 && isDrawing && drawStart && tool === 'bbox') {
        const touch = touches[0]
        const pointerPos = getTouchPosition(touch, stage)
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
        setTouchState({ touches, lastDistance: null, lastCenter: null })
        return
      }

      // Update touch state
      if (touches.length > 0) {
        setTouchState((prev) => ({
          ...prev,
          touches,
        }))
      }
    },
    [
      isPanning,
      panStart,
      tool,
      position,
      setPosition,
      setPanStart,
      setIsPanning,
      isDrawing,
      drawStart,
      scale,
      setTempBbox,
      touchState,
      getTouchDistance,
      getTouchCenter,
      getTouchPosition,
      setScale,
    ],
  )

  const handleStageTouchEnd = useCallback(
    (e: any) => {
      e.evt.preventDefault() // Prevent default touch behaviors
      const touches = Array.from(e.evt.touches) as Touch[]

      // If no touches remain, reset state
      if (touches.length === 0) {
        if (isPanning) {
          setIsPanning(false)
          setPanStart(null)
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

        setTouchState({
          touches: [],
          lastDistance: null,
          lastCenter: null,
        })
        return
      }

      // If one touch remains after two-finger gesture, reset pinch state
      if (touches.length === 1) {
        setTouchState({
          touches,
          lastDistance: null,
          lastCenter: null,
        })
      }
    },
    [
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
    ],
  )

  return {
    tempBbox,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleStageTouchStart,
    handleStageTouchMove,
    handleStageTouchEnd,
    handleBboxDragEnd,
    handleTransformEnd,
    getCursor,
    isSpacePressed,
  }
}
