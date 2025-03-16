"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Text } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TextSelectionCarousel } from "@/components/text-selection-carousel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { createCanvasImage } from "@/utils/canvas"
import { CANVAS_SIZE, IMAGE_QUALITY } from "../../utils/canvas-constants"
import { type SloganItem, type SloganPosition, drawSlogan } from "../../utils/slogan-canvas"

const SLOGANS: readonly SloganItem[] = [
  { id: "vote", text: "VOTE" },
  { id: "vote-wisely", text: "VOTE WISELY" },
  { id: "your-voice", text: "YOUR VOICE MATTERS" },
  { id: "democracy", text: "DEMOCRACY IN ACTION" },
] as const

interface ImageState {
  readonly src: string
  readonly width: number
  readonly height: number
  readonly element: HTMLImageElement | null
}

interface EmojiState {
  readonly id: string
  readonly src: string
  readonly element: HTMLImageElement | null
  readonly position: {
    readonly x: number
    readonly y: number
  }
}

interface TextItem {
  readonly id: string
  readonly text: string
}

// Default position for slogan - bottom right
const DEFAULT_SLOGAN_POSITION: SloganPosition = {
  x: 0.9,
  y: 0.9
} as const

const STORAGE_KEYS = {
  editedImage: "editedImage",
  selectedSlogan: "selectedSlogan",
  sloganPosition: "sloganPosition"
} as const

// Convert slogans to text items for the carousel
const SLOGAN_TEXT_ITEMS: readonly TextItem[] = SLOGANS.map(slogan => ({
  id: slogan.id,
  text: slogan.text
}))

export default function SloganPage() {
  const router = useRouter()
  const [selectedSlogan, setSelectedSlogan] = useState<string | null>(null)
  const [imageState, setImageState] = useState<ImageState | null>(null)
  const [emojiState, setEmojiState] = useState<EmojiState | null>(null)
  const [sloganPosition, setSloganPosition] = useState<SloganPosition>(DEFAULT_SLOGAN_POSITION)
  const [isEditing, setIsEditing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const updateCanvas = useCallback(async (currentSloganId?: string): Promise<void> => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !imageState?.element) return

    // Set canvas dimensions
    canvas.width = CANVAS_SIZE.width
    canvas.height = CANVAS_SIZE.height
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    try {
      // Draw the full image as background
      const userImg = await createCanvasImage({ src: imageState.src })
      ctx.drawImage(userImg, 0, 0, canvas.width, canvas.height)
      
      // Draw emoji if available (from previous page)
      if (emojiState?.element) {
        const emojiSize = 50
        const emojiX = canvas.width * emojiState.position.x - (emojiSize / 2)
        const emojiY = canvas.height * emojiState.position.y - (emojiSize / 2)
        
        // Handle dark mode
        const isDarkMode = document.documentElement.classList.contains("dark")
        if (isDarkMode) {
          ctx.filter = "invert(1)"
        }
        
        ctx.drawImage(emojiState.element, emojiX, emojiY, emojiSize, emojiSize)
        ctx.filter = "none"
      }
      
      // Draw slogan text
      const sloganId = currentSloganId || selectedSlogan
      if (sloganId) {
        const slogan = SLOGANS.find((item: SloganItem) => item.id === sloganId)
        if (slogan) {
          drawSlogan({
            ctx,
            text: slogan.text,
            position: sloganPosition,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height
          })
        }
      }
      
      // Update preview image
      setPreviewImage(canvas.toDataURL("image/jpeg", IMAGE_QUALITY))
    } catch (error) {
      console.error("Error generating image:", error)
    }
  }, [imageState, emojiState, selectedSlogan, sloganPosition])

  // Load saved data on component mount
  useEffect(() => {
    let mounted = true
    
    const loadStoredData = async (): Promise<void> => {
      try {
        // Get edited image from emoji page or fall back to cropped image
        const storedImage = localStorage.getItem(STORAGE_KEYS.editedImage)
        if (!storedImage) {
          router.replace("/emoji")
          return
        }
        
        // Load the image
        const img = await createCanvasImage({ src: storedImage })
        if (!mounted) return
        
        setImageState({
          src: storedImage,
          width: img.naturalWidth,
          height: img.naturalHeight,
          element: img
        })
        
        // Load emoji data
        const storedEmojiId = localStorage.getItem("selectedEmoji")
        const storedEmojiPositionJson = localStorage.getItem("emojiPosition")
        
        if (storedEmojiId && mounted) {
          // Find the emoji in our list
          const emojiSrc = `/emojis/${storedEmojiId}.svg`
          try {
            const emojiElement = await createCanvasImage({ src: emojiSrc })
            let emojiPosition = DEFAULT_SLOGAN_POSITION // Default position
            
            // Parse stored position if available
            if (storedEmojiPositionJson) {
              try {
                emojiPosition = JSON.parse(storedEmojiPositionJson)
              } catch (e) {
                console.error("Error parsing emoji position:", e)
              }
            }
            
            if (mounted) {
              setEmojiState({
                id: storedEmojiId,
                src: emojiSrc,
                element: emojiElement,
                position: emojiPosition
              })
            }
          } catch (error) {
            console.error("Error loading emoji:", error)
          }
        }
        
        // Load stored slogan and position if available
        const storedSlogan = localStorage.getItem(STORAGE_KEYS.selectedSlogan)
        const storedPositionJson = localStorage.getItem(STORAGE_KEYS.sloganPosition)
        
        if (storedSlogan && mounted) {
          setSelectedSlogan(storedSlogan)
        }
        
        if (storedPositionJson && mounted) {
          try {
            const position = JSON.parse(storedPositionJson) as SloganPosition
            setSloganPosition(position)
          } catch (e) {
            console.error("Error parsing stored slogan position:", e)
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
        if (mounted) {
          router.replace("/emoji")
        }
      }
    }
    
    loadStoredData()
    
    return () => {
      mounted = false
    }
  }, [router])

  // Update canvas when data changes
  useEffect(() => {
    if (imageState) {
      updateCanvas()
    }
  }, [imageState, emojiState, selectedSlogan, sloganPosition, updateCanvas])

  const handleSloganSelect = (sloganId: string): void => {
    setSelectedSlogan(sloganId)
    localStorage.setItem(STORAGE_KEYS.selectedSlogan, sloganId)
  }

  const handleImageClick = (event: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isEditing || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    setSloganPosition({ x, y })
  }

  const handleSave = (): void => {
    if (!canvasRef.current) return
    
    // Save the slogan position
    localStorage.setItem(STORAGE_KEYS.sloganPosition, JSON.stringify(sloganPosition))
    
    // Save the final edited image
    const finalImage = canvasRef.current.toDataURL("image/jpeg", IMAGE_QUALITY)
    localStorage.setItem(STORAGE_KEYS.editedImage, finalImage)
    setIsEditing(false)
  }

  const handleBack = (): void => {
    router.back()
  }

  const handleNext = (): void => {
    if (selectedSlogan && imageState) {
      // Save both slogan selection and position
      localStorage.setItem(STORAGE_KEYS.selectedSlogan, selectedSlogan)
      localStorage.setItem(STORAGE_KEYS.sloganPosition, JSON.stringify(sloganPosition))
      
      // Save final image
      if (canvasRef.current) {
        const finalImage = canvasRef.current.toDataURL("image/jpeg", IMAGE_QUALITY)
        localStorage.setItem(STORAGE_KEYS.editedImage, finalImage)
      }
      
      router.push("/location")
    }
  }

  const handleEditDialogChange = (open: boolean): void => {
    setIsEditing(open)
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <PageHeader
        title="Add a Slogan"
        step={3}
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
              onClick={() => selectedSlogan && setIsEditing(true)}
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Your photo with slogan"
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
              {selectedSlogan && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
                  <Text className="w-6 h-6 text-white" />
                  <span className="ml-2 text-white font-medium">Click to position slogan</span>
                </div>
              )}
            </div>
          )}

          <TextSelectionCarousel
            items={SLOGAN_TEXT_ITEMS}
            selectedItemId={selectedSlogan}
            onSelect={handleSloganSelect}
          />
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedSlogan || !imageState}
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
            <DialogTitle>Position Your Slogan</DialogTitle>
            <DialogDescription>
              Click anywhere on the image to position your slogan. The text will be anchored at the clicked position.
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
