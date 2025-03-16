"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Smile } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SelectionCarousel } from "@/components/selection-carousel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { createCanvasImage } from "@/utils/canvas"
import { CANVAS_SIZE, IMAGE_QUALITY } from "../../utils/canvas-constants"

interface EmojiSelection {
  readonly id: string
  readonly src: string
  readonly alt: string
}

const EMOJIS: readonly EmojiSelection[] = [
  { id: "thumbs-up", src: "/emojis/thumbs-up.svg", alt: "Thumbs Up" },
  { id: "check-vote", src: "/emojis/check-vote.svg", alt: "Check Vote" },
  { id: "peace", src: "/emojis/peace.svg", alt: "Peace" },
  { id: "heart", src: "/emojis/heart.svg", alt: "Heart" },
] as const

interface ImageState {
  readonly src: string
  readonly width: number
  readonly height: number
  readonly element?: HTMLImageElement
}

interface EmojiPosition {
  readonly x: number
  readonly y: number
}

// Default position for emoji - bottom left
const DEFAULT_EMOJI_POSITION: EmojiPosition = {
  x: 0.1,
  y: 0.9
} as const

const STORAGE_KEYS = {
  croppedImage: "croppedImage",
  editedImage: "editedImage",
  selectedEmoji: "selectedEmoji",
  emojiPosition: "emojiPosition"
} as const

const EMOJI_SIZE = 50 as const

export default function EmojiPage() {
  const router = useRouter()
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [imageState, setImageState] = useState<ImageState | null>(null)
  const [emojiPosition, setEmojiPosition] = useState<EmojiPosition>(DEFAULT_EMOJI_POSITION)
  const [isEditing, setIsEditing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const updateCanvas = useCallback(async (currentEmojiId?: string): Promise<void> => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !imageState?.element) return

    // Set canvas dimensions to match the image aspect ratio
    canvas.width = CANVAS_SIZE.width
    canvas.height = CANVAS_SIZE.height

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    try {
      // Draw the full image as background
      const userImg = await createCanvasImage({ src: imageState.src })
      ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height)
      
      // Draw emoji if needed
      const emojiId = currentEmojiId || selectedEmoji
      if (emojiId) {
        const emoji = EMOJIS.find(e => e.id === emojiId)
        if (emoji) {
          const emojiImg = await createCanvasImage({ src: emoji.src })
          const emojiX = canvas.width * emojiPosition.x - (EMOJI_SIZE / 2)
          const emojiY = canvas.height * emojiPosition.y - (EMOJI_SIZE / 2)
          
          // Handle dark mode by adjusting emoji
          const isDarkMode = document.documentElement.classList.contains("dark")
          if (isDarkMode) {
            ctx.filter = "invert(1)"
          }
          
          ctx.drawImage(emojiImg, emojiX, emojiY, EMOJI_SIZE, EMOJI_SIZE)
          ctx.filter = "none"
        }
      }

      // Update preview image
      setPreviewImage(canvas.toDataURL("image/jpeg", IMAGE_QUALITY))
    } catch (error) {
      console.error("Error generating image:", error)
    }
  }, [imageState, selectedEmoji, emojiPosition])

  useEffect(() => {
    let mounted = true
    
    const loadImage = async (): Promise<void> => {
      const savedImage = localStorage.getItem(STORAGE_KEYS.croppedImage)
      if (!savedImage) {
        router.replace("/")
        return
      }

      try {
        const img = await createCanvasImage({ src: savedImage })
        if (!mounted) return
        
        setImageState({
          src: savedImage,
          width: img.naturalWidth,
          height: img.naturalHeight,
          element: img
        })

        // Load stored emoji and position if available
        const storedEmoji = localStorage.getItem(STORAGE_KEYS.selectedEmoji)
        const storedPositionJson = localStorage.getItem(STORAGE_KEYS.emojiPosition)
        
        if (storedEmoji && mounted) {
          setSelectedEmoji(storedEmoji)
        }
        
        if (storedPositionJson && mounted) {
          try {
            const position = JSON.parse(storedPositionJson) as EmojiPosition
            setEmojiPosition(position)
          } catch (e) {
            console.error("Error parsing stored emoji position:", e)
          }
        }
      } catch (error) {
        console.error("Error loading image:", error)
        if (mounted) {
          router.replace("/")
        }
      }
    }
    
    loadImage()
    
    return () => {
      mounted = false
    }
  }, [router])

  // Update canvas when data changes
  useEffect(() => {
    if (imageState && selectedEmoji) {
      updateCanvas()
    }
  }, [imageState, selectedEmoji, emojiPosition, updateCanvas])

  const handleEmojiSelect = (emojiId: string): void => {
    setSelectedEmoji(emojiId)
    localStorage.setItem(STORAGE_KEYS.selectedEmoji, emojiId)
  }

  const handleImageClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isEditing || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    setEmojiPosition({ x, y })
  }

  const handleSave = (): void => {
    if (!canvasRef.current) return
    // Save the emoji position
    localStorage.setItem(STORAGE_KEYS.emojiPosition, JSON.stringify(emojiPosition))
    
    // Save the edited image
    const editedImage = canvasRef.current.toDataURL("image/jpeg", IMAGE_QUALITY)
    localStorage.setItem(STORAGE_KEYS.editedImage, editedImage)
    setIsEditing(false)
  }

  const handleBack = (): void => {
    router.back()
  }

  const handleNext = (): void => {
    if (selectedEmoji && imageState) {
      // Save both emoji selection and position
      localStorage.setItem(STORAGE_KEYS.selectedEmoji, selectedEmoji)
      localStorage.setItem(STORAGE_KEYS.emojiPosition, JSON.stringify(emojiPosition))
      
      // Save canvas image
      if (canvasRef.current) {
        const editedImage = canvasRef.current.toDataURL("image/jpeg", IMAGE_QUALITY)
        localStorage.setItem(STORAGE_KEYS.editedImage, editedImage)
      }
      
      router.push("/slogan")
    }
  }

  const handleEditDialogChange = (open: boolean): void => {
    setIsEditing(open)
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <PageHeader
        title="Choose an Emoji"
        step={2}
        totalSteps={4}
        onBack={handleBack}
      />

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-between gap-6">
          {imageState && (
            <div 
              className={cn(
                "w-full aspect-video relative rounded-lg overflow-hidden bg-muted",
                "cursor-pointer transition-transform hover:scale-[1.02]",
                "group"
              )}
              onClick={() => selectedEmoji && setIsEditing(true)}
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Your photo with emoji"
                  width={CANVAS_SIZE.width}
                  height={CANVAS_SIZE.height}
                  className="w-full h-full object-contain"
                  priority
                  unoptimized
                />
              ) : (
                <Image
                  src={imageState.src}
                  alt="Your photo"
                  width={imageState.width}
                  height={imageState.height}
                  className="w-full h-full object-contain"
                  priority
                  unoptimized
                />
              )}
              {selectedEmoji && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                  <Smile className="w-6 h-6 text-white" />
                  <span className="ml-2 text-white font-medium">Click to position emoji</span>
                </div>
              )}
            </div>
          )}

          <SelectionCarousel
            items={Array.from(EMOJIS)}
            selectedItemId={selectedEmoji}
            onSelect={handleEmojiSelect}
          />
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedEmoji || !imageState}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isEditing} onOpenChange={handleEditDialogChange}>
        <DialogContent className="sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Position Your Emoji</DialogTitle>
            <DialogDescription>
              Click anywhere on the image to position your emoji. The emoji will be centered at the clicked position.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full aspect-video">
            <canvas
              ref={canvasRef}
              onClick={handleImageClick}
              className="w-full h-full cursor-crosshair"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Position
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
