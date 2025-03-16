"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Share2, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Textarea } from "@/components/ui/textarea"
import { CANVAS_SIZE } from "@/utils/canvas-constants"

interface StoredData {
  readonly image: string
  readonly emojiId: string | null
  readonly emojiPosition: { x: number, y: number } | null
  readonly sloganId: string | null
  readonly sloganPosition: { x: number, y: number } | null
  readonly locationId: string | null
}

const STORAGE_KEYS = {
  editedImage: "editedImage",
  selectedEmoji: "selectedEmoji",
  emojiPosition: "emojiPosition",
  selectedSlogan: "selectedSlogan",
  sloganPosition: "sloganPosition",
  selectedLocation: "selectedLocation",
  finalImage: "finalImage",
  caption: "caption"
} as const

const loadStoredData = (): StoredData => {
  const storedImage = localStorage.getItem(STORAGE_KEYS.editedImage)
  const storedEmojiId = localStorage.getItem(STORAGE_KEYS.selectedEmoji)
  const storedSloganId = localStorage.getItem(STORAGE_KEYS.selectedSlogan)
  const storedLocationId = localStorage.getItem(STORAGE_KEYS.selectedLocation)
  
  // Parse position data
  let emojiPosition = null
  try {
    const emojiPositionJson = localStorage.getItem(STORAGE_KEYS.emojiPosition)
    if (emojiPositionJson) {
      emojiPosition = JSON.parse(emojiPositionJson)
    }
  } catch (error) {
    console.error("Error parsing emoji position:", error)
  }
  
  let sloganPosition = null
  try {
    const sloganPositionJson = localStorage.getItem(STORAGE_KEYS.sloganPosition)
    if (sloganPositionJson) {
      sloganPosition = JSON.parse(sloganPositionJson)
    }
  } catch (error) {
    console.error("Error parsing slogan position:", error)
  }
  
  return {
    image: storedImage || "",
    emojiId: storedEmojiId,
    emojiPosition,
    sloganId: storedSloganId,
    sloganPosition,
    locationId: storedLocationId
  }
}

export default function PreviewPage() {
  const router = useRouter()
  const [finalImage, setFinalImage] = useState<string | null>(null)
  const [caption, setCaption] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const initializePreview = async (): Promise<void> => {
      try {
        setLoading(true)
        const storedData = loadStoredData()
        
        // Validate if we have the necessary data
        if (!storedData.image) {
          router.replace("/")
          return
        }
        
        // No need to recreate the image as it should already be fully rendered by the location page
        // Just use it directly as the final image
        setFinalImage(storedData.image)
        
        // Load previous caption if it exists
        const savedCaption = localStorage.getItem(STORAGE_KEYS.caption)
        if (savedCaption) {
          setCaption(savedCaption)
        }
      } catch (error) {
        console.error("Error initializing preview:", error)
      } finally {
        setLoading(false)
      }
    }
    
    initializePreview()
  }, [router])

  const handleBack = (): void => {
    router.push("/location")
  }

  const handleShare = (): void => {
    if (finalImage) {
      localStorage.setItem(STORAGE_KEYS.finalImage, finalImage)
      localStorage.setItem(STORAGE_KEYS.caption, caption)
      router.push("/share")
    }
  }

  const handleDownload = (): void => {
    if (!finalImage) return
    
    const link = document.createElement("a")
    link.href = finalImage
    link.download = "vote-with-sense.jpg"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <PageHeader 
        title="Preview & Share" 
        step={5} 
        totalSteps={5} 
        onBack={handleBack} 
      />

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Your Customized Image</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col items-center justify-between gap-6">
          {loading ? (
            <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
              <p>Loading your image...</p>
            </div>
          ) : finalImage ? (
            <div className="w-full flex justify-center">
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={finalImage}
                  alt="Your customized image"
                  width={CANVAS_SIZE.width}
                  height={CANVAS_SIZE.height}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
              <p>Error loading image</p>
            </div>
          )}

          <div className="w-full">
            <Textarea
              placeholder="Add a caption for sharing..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownload} 
              disabled={!finalImage}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={!finalImage}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Hidden canvas for any potential additional processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
