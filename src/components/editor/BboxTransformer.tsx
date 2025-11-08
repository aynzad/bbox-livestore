import { Transformer } from 'react-konva'

interface BboxTransformerProps {
  transformerRef: React.RefObject<any>
}

export function BboxTransformer({ transformerRef }: BboxTransformerProps) {
  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Limit minimum size
        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
          return oldBox
        }
        return newBox
      }}
    />
  )
}

