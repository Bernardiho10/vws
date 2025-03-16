'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { applyGrayscale, applySepia } from '@/lib/image-editing-utils'

interface ImageEditorProps {
  initialImage: string
  onSave: (editedImage: string) => void
  className?: string
}

export function ImageEditor({ initialImage, onSave, className }: ImageEditorProps) {
  const [image, setImage] = useState<string>(initialImage)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const handleSave = useCallback(() => {
    onSave(image)
    setIsEditing(false)
  }, [image, onSave])

  const handleFilter = (filter: string) => {
    const imgElement = document.createElement('img')
    imgElement.src = image
    imgElement.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = imgElement.width
        canvas.height = imgElement.height
        ctx.drawImage(imgElement, 0, 0)
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        if (filter === 'grayscale') {
          imageData = applyGrayscale(imageData)
        } else if (filter === 'sepia') {
          imageData = applySepia(imageData)
        }

        ctx.putImageData(imageData, 0, 0)
        setImage(canvas.toDataURL())
      }
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;

    setCropArea({ x: startX, y: startY, width: 0, height: 0 });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const width = moveEvent.clientX - rect.left - startX;
      const height = moveEvent.clientY - rect.top - startY;
      setCropArea({ x: startX, y: startY, width, height });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCrop = useCallback(() => {
    if (cropArea) {
      const imgElement = document.createElement('img')
      imgElement.src = image
      imgElement.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = cropArea.width;
          canvas.height = cropArea.height;
          ctx.drawImage(
            imgElement,
            cropArea.x,
            cropArea.y,
            cropArea.width,
            cropArea.height,
            0,
            0,
            cropArea.width,
            cropArea.height
          );
          setImage(canvas.toDataURL())
        }
      }
    }
  }, [image, cropArea]);

  const handleRotate = useCallback(() => {
    const imgElement = document.createElement('img')
    imgElement.src = image
    imgElement.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const angle = 90; // Rotate by 90 degrees

      if (ctx) {
        canvas.width = imgElement.height;
        canvas.height = imgElement.width;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);
        setImage(canvas.toDataURL())
      }
    }
  }, [image])

  return (
    <div onMouseDown={handleMouseDown} className={cn('relative group', className)}>
      <Image 
        src={image} 
        alt="Editable content"
        width={600}
        height={400}
        className="w-full h-auto rounded-lg"
      />
      {isEditing && (
        <div className="absolute inset-0 bg-black/50 opacity-100 transition-opacity">
          <button
            onClick={handleSave}
            className="absolute top-2 right-2 p-2 bg-white rounded-full"
          >
            Save
          </button>
          <button
            onClick={() => handleFilter('grayscale')}
            className="absolute top-10 right-2 p-2 bg-white rounded-full"
          >
            Grayscale
          </button>
          <button
            onClick={() => handleFilter('sepia')}
            className="absolute top-20 right-2 p-2 bg-white rounded-full"
          >
            Sepia
          </button>
          <button
            onClick={handleCrop}
            className="absolute top-30 right-2 p-2 bg-white rounded-full"
          >
            Crop
          </button>
          <button
            onClick={handleRotate}
            className="absolute top-40 right-2 p-2 bg-white rounded-full"
          >
            Rotate
          </button>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 p-2 bg-white rounded-full"
        >
          Edit
        </button>
      </div>
    </div>
  )
}
