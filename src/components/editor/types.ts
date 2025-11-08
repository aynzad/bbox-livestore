export interface Bbox {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type Tool = 'select' | 'bbox' | 'pan'

