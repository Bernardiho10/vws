"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImage: string) => void
}

export function ImageCropper({ image, onCropComplete }: ImageCropperProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Generate cropped image whenever scale, rotation or position changes
  useEffect(() => {
    const generateCroppedImage = () => {
      if (!imageRef.current || !containerRef.current) return

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size to the container size (circular crop)
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight
      canvas.width = containerWidth
      canvas.height = containerHeight

      // Create circular clipping path
      ctx.beginPath()
      ctx.arc(containerWidth / 2, containerHeight / 2, Math.min(containerWidth, containerHeight) / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      // Draw the image with transformations
      ctx.save()
      ctx.translate(containerWidth / 2, containerHeight / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(scale, scale)

      const img = imageRef.current
      ctx.drawImage(
        img,
        -img.width / 2 + position.x / scale,
        -img.height / 2 + position.y / scale,
        img.width,
        img.height,
      )
      ctx.restore()

      // Convert to data URL and pass to parent
      const dataUrl = canvas.toDataURL("image/jpeg")
      onCropComplete(dataUrl)
    }

    // Wait for image to load before generating cropped version
    const img = imageRef.current
    if (img && img.complete) {
      generateCroppedImage()
    } else if (img) {
      img.onload = generateCroppedImage
    }
  }, [scale, rotation, position, onCropComplete])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return

    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <div className="w-full flex flex-col gap-6 items-center">
      <div
        ref={containerRef}
        className="w-64 h-64 rounded-full overflow-hidden border-2 border-primary relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <img
            ref={imageRef}
            src={image || "/placeholder.svg"}
            alt="Crop preview"
            className="max-w-none"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: "center",
              touchAction: "none",
            }}
            draggable={false}
          />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex items-center gap-2">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[scale]}
            min={0.5}
            max={3}
            step={0.01}
            onValueChange={(value) => setScale(value[0])}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>

        <Button variant="outline" onClick={handleRotate} className="w-full">
          <RotateCw className="mr-2 h-4 w-4" />
          Rotate
        </Button>
      </div>
    </div>
  )
}

