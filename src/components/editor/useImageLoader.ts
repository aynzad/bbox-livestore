import { useState, useEffect, useRef } from 'react'

export function useImageLoader(imageUrl?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.src = imageUrl
      img.onload = () => {
        setImage(img)
        imageRef.current = img
      }
    }
  }, [imageUrl])

  return { image, imageRef }
}

