import { Button } from '@/components/ui/button'
import {
  MousePointer2,
  Square,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useEditorStore } from './editor.store'

interface EditorToolbarProps {
  onDelete: () => void
}

export function EditorToolbar({ onDelete }: EditorToolbarProps) {
  const tool = useEditorStore((state) => state.tool)
  const selectedId = useEditorStore((state) => state.selectedId)
  const setTool = useEditorStore((state) => state.setTool)
  const zoomIn = useEditorStore((state) => state.zoomIn)
  const zoomOut = useEditorStore((state) => state.zoomOut)
  const reset = useEditorStore((state) => state.reset)

  return (
    <div className="flex justify-between md:justify-start items-center gap-2 p-4 border-b bg-muted">
      <Button
        variant={tool === 'select' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTool('select')}
        title="Select tool"
      >
        <MousePointer2 className="size-4" />
        <span className="hidden md:inline">Select</span>
      </Button>
      <Button
        variant={tool === 'bbox' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTool('bbox')}
        title="Bounding box tool"
      >
        <Square className="size-4" />
        <span className="hidden md:inline">Bbox</span>
      </Button>
      <Button
        variant={tool === 'pan' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTool('pan')}
        title="Pan tool"
      >
        <Hand className="size-4" />
        <span className="hidden md:inline">Pan</span>
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom in">
        <ZoomIn className="size-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom out">
        <ZoomOut className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={reset}
        title="Reset zoom and pan"
      >
        <RotateCcw className="size-4" />
        <span className="hidden md:inline">Reset</span>
      </Button>
      {selectedId && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            disabled={!selectedId}
            variant="destructive"
            size="sm"
            onClick={onDelete}
            title="Delete selected bbox"
          >
            <Trash2 className="size-4" />
            <span className="hidden lg:inline">Delete</span>
          </Button>
        </>
      )}
    </div>
  )
}
