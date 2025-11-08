import { create } from 'zustand'
import type { Tool } from './types'

interface EditorState {
  // Tool selection
  tool: Tool
  setTool: (tool: Tool) => void

  // Selection
  selectedId: string | null
  setSelectedId: (id: string | null) => void

  // Zoom and pan
  scale: number
  position: { x: number; y: number }
  setScale: (scale: number) => void
  setPosition: (position: { x: number; y: number }) => void

  // Drawing state
  isDrawing: boolean
  drawStart: { x: number; y: number } | null
  tempBbox: { x: number; y: number; width: number; height: number } | null
  setIsDrawing: (isDrawing: boolean) => void
  setDrawStart: (drawStart: { x: number; y: number } | null) => void
  setTempBbox: (tempBbox: {
    x: number
    y: number
    width: number
    height: number
  } | null) => void

  // Panning state
  isPanning: boolean
  panStart: { x: number; y: number } | null
  setIsPanning: (isPanning: boolean) => void
  setPanStart: (panStart: { x: number; y: number } | null) => void

  // Actions
  resetZoom: () => void
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  // Tool selection
  tool: 'select',
  setTool: (tool) => set({ tool }),

  // Selection
  selectedId: null,
  setSelectedId: (selectedId) => set({ selectedId }),

  // Zoom and pan
  scale: 1,
  position: { x: 0, y: 0 },
  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),

  // Drawing state
  isDrawing: false,
  drawStart: null,
  tempBbox: null,
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setDrawStart: (drawStart) => set({ drawStart }),
  setTempBbox: (tempBbox) => set({ tempBbox }),

  // Panning state
  isPanning: false,
  panStart: null,
  setIsPanning: (isPanning) => set({ isPanning }),
  setPanStart: (panStart) => set({ panStart }),

  // Actions
  resetZoom: () => set({ scale: 1, position: { x: 0, y: 0 } }),
  zoomIn: () =>
    set((state) => ({
      scale: Math.min(5, state.scale * 1.2),
    })),
  zoomOut: () =>
    set((state) => ({
      scale: Math.max(0.1, state.scale / 1.2),
    })),
  reset: () =>
    set({
      scale: 1,
      position: { x: 0, y: 0 },
      selectedId: null,
    }),
}))

