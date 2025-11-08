import { Image as KonvaImage } from 'react-konva'

interface BackgroundImageProps {
  image: HTMLImageElement
}

export function BackgroundImage({ image }: BackgroundImageProps) {
  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={image.width}
      height={image.height}
    />
  )
}

