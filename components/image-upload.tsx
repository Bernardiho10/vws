'use client'

import { useState, useCallback } from 'react'
import { validateImage, compressImage, resizeImage } from '@/lib/image-utils'

interface ImageUploadProps {
  onUpload: (file: File) => void
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [error, setError] = useState<string>('')

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!validateImage(file)) {
      setError('Invalid image format or size (max 5MB)')
      return
    }

    try {
      // Compress and resize the image
      const compressedImageBlob = await compressImage(file)
      const resizedImageBlob = await resizeImage(new File([compressedImageBlob], file.name), 1200, 800)
      onUpload(new File([resizedImageBlob], file.name))
      setError('')
    } catch {
      setError('Failed to process image')
    }
  }, [onUpload])

  return (
    <div>
      <input 
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
