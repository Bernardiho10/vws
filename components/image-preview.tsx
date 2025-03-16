"use client"

import { useEffect, useRef } from "react"

interface ImagePreviewProps {
  image: string
  emoji?: string
  slogan?: string
  location?: string
}

export function ImagePreview({ image, emoji, slogan, location }: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the user image
    const userImg = new Image()
    userImg.crossOrigin = "anonymous"
    userImg.src = image

    userImg.onload = () => {
      // Draw circular user image
      ctx.save()
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height)
      ctx.restore()

      // Draw emoji if provided
      if (emoji) {
        const emojiImg = new Image()
        emojiImg.crossOrigin = "anonymous"
        emojiImg.src = emoji

        emojiImg.onload = () => {
          ctx.drawImage(emojiImg, canvas.width - 60, canvas.height - 60, 50, 50)
        }
      }

      // Draw slogan if provided
      if (slogan) {
        ctx.font = "bold 16px sans-serif"
        ctx.textAlign = "center"
        ctx.fillStyle = "white"
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2

        // Draw text with stroke for better visibility
        ctx.strokeText(slogan, canvas.width / 2, canvas.height - 20)
        ctx.fillText(slogan, canvas.width / 2, canvas.height - 20)
      }

      // Draw location if provided
      if (location) {
        ctx.font = "14px sans-serif"
        ctx.textAlign = "center"
        ctx.fillStyle = "white"
        ctx.strokeStyle = "black"
        ctx.lineWidth = 1.5

        ctx.strokeText(location, canvas.width / 2, 30)
        ctx.fillText(location, canvas.width / 2, 30)
      }
    }
  }, [image, emoji, slogan, location])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={250} height={250} className=" border-2 border-primary" />
    </div>
  )
}

