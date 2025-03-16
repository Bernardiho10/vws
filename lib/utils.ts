import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs - Class names to combine
 * @returns Combined class names string
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs))
}

/**
 * Validates a base64 image string
 * @param base64String - Base64 encoded image string to validate
 * @returns True if valid base64 image, false otherwise
 */
export const isValidBase64Image = (base64String: string): boolean => {
  if (!base64String) return false
  try {
    const [header, content] = base64String.split(",")
    return (
      header.startsWith("data:image/") &&
      header.includes(";base64") &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(content)
    )
  } catch {
    return false
  }
}

/**
 * Interface for image dimensions
 */
export interface ImageDimensions {
  readonly width: number
  readonly height: number
}

/**
 * Safely loads an image and returns its dimensions
 * @param src - Image source URL or base64 string
 * @returns Promise resolving to image dimensions
 */
export const getImageDimensions = (src: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ 
      width: img.naturalWidth, 
      height: img.naturalHeight 
    } as const)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"] as const
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
