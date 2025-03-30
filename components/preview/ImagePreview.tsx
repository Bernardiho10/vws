import React from 'react'
import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface ImagePreviewProps {
  image: string
  emoji?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

export function ImagePreview({ image, emoji, location }: ImagePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <img
          src={image}
          alt="Preview"
          className="w-full h-auto rounded-lg"
        />
        {emoji && (
          <div className="absolute bottom-4 right-4 text-4xl">
            {emoji}
          </div>
        )}
      </div>

      {location && (
        <Card className="p-4 flex items-start space-x-2">
          <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-mono text-sm">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
            {location.address && (
              <p className="text-sm text-muted-foreground mt-1">
                {location.address}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
} 