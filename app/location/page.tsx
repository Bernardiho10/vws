"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, MapPin, Search } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createCanvasImage } from "@/utils/canvas"
import { CANVAS_SIZE, IMAGE_QUALITY } from "../../utils/canvas-constants"

interface LocationItem {
  readonly id: string
  readonly name: string
  readonly type: string
}

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

interface SloganState {
  readonly id: string
  readonly text: string
  readonly position: {
    readonly x: number
    readonly y: number
  }
}

// Sample location data
const LOCATIONS: readonly LocationItem[] = [
  // Nigerian states
  { id: "lagos", name: "Lagos", type: "state" },
  { id: "abuja", name: "Abuja", type: "state" },
  { id: "rivers", name: "Rivers", type: "state" },
  { id: "kano", name: "Kano", type: "state" },
  { id: "enugu", name: "Enugu", type: "state" },
  // Countries
  { id: "united-states", name: "United States", type: "country" },
  { id: "united-kingdom", name: "United Kingdom", type: "country" },
  { id: "canada", name: "Canada", type: "country" },
  { id: "australia", name: "Australia", type: "country" },
  { id: "germany", name: "Germany", type: "country" },
] as const

const STORAGE_KEYS = {
  editedImage: "editedImage",
  selectedLocation: "selectedLocation",
} as const

// Default position for location text
const LOCATION_POSITION = {
  x: 0.5,  // Centered horizontally
  y: 0.1   // Near the top
} as const

const LOCATION_FONT_SIZE = 24 as const
const LOCATION_FONT_FAMILY = "Arial, sans-serif" as const

export default function LocationPage() {
  const router = useRouter()
  const [imageState, setImageState] = useState<ImageState | null>(null)
  const [emojiState, setEmojiState] = useState<EmojiState | null>(null)
  const [sloganState, setSloganState] = useState<SloganState | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Update canvas when data changes
  const updateCanvas = useCallback(async (): Promise<void> => {
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
      
      // Draw slogan text if available
      if (sloganState) {
        const { text, position } = sloganState
        
        // Slogan text styling
        ctx.font = "bold 28px Arial, sans-serif"
        ctx.fillStyle = "white"
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2
        
        // Position text
        const x = canvas.width * position.x
        const y = canvas.height * position.y
        
        // Draw text with outline for visibility
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.strokeText(text, x, y)
        ctx.fillText(text, x, y)
      }
      
      // Draw location text if selected
      if (selectedLocation) {
        const location = LOCATIONS.find(loc => loc.id === selectedLocation)
        if (location) {
          // Location text styling
          ctx.font = `bold ${LOCATION_FONT_SIZE}px ${LOCATION_FONT_FAMILY}`
          ctx.fillStyle = "white"
          ctx.strokeStyle = "black"
          ctx.lineWidth = 2
          
          // Position text
          const x = canvas.width * LOCATION_POSITION.x
          const y = canvas.height * LOCATION_POSITION.y
          
          // Draw text with outline for visibility
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.strokeText(location.name, x, y)
          ctx.fillText(location.name, x, y)
        }
      }
      
      // Update preview image
      setPreviewImage(canvas.toDataURL("image/jpeg", IMAGE_QUALITY))
    } catch (error) {
      console.error("Error generating image:", error)
    }
  }, [imageState, emojiState, sloganState, selectedLocation])

  // Load saved data on component mount
  useEffect(() => {
    let mounted = true
    
    const loadStoredData = async (): Promise<void> => {
      try {
        // Get edited image from slogan page
        const storedImage = localStorage.getItem(STORAGE_KEYS.editedImage)
        if (!storedImage) {
          router.replace("/slogan")
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
            let emojiPosition = { x: 0.1, y: 0.9 } // Default position
            
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
        
        // Load slogan data
        const storedSloganId = localStorage.getItem("selectedSlogan")
        const storedSloganPositionJson = localStorage.getItem("sloganPosition")
        
        if (storedSloganId && mounted) {
          let sloganPosition = { x: 0.9, y: 0.9 } // Default position
          
          // Parse stored position if available
          if (storedSloganPositionJson) {
            try {
              sloganPosition = JSON.parse(storedSloganPositionJson)
            } catch (e) {
              console.error("Error parsing slogan position:", e)
            }
          }
          
          // Find the slogan text
          const sloganText = storedSloganId === "vote" ? "VOTE" :
                          storedSloganId === "vote-wisely" ? "VOTE WISELY" :
                          storedSloganId === "your-voice" ? "YOUR VOICE MATTERS" :
                          storedSloganId === "democracy" ? "DEMOCRACY IN ACTION" : "VOTE";
          
          if (mounted) {
            setSloganState({
              id: storedSloganId,
              text: sloganText,
              position: sloganPosition
            })
          }
        }
        
        // Load stored location if available
        const storedLocation = localStorage.getItem(STORAGE_KEYS.selectedLocation)
        if (storedLocation && mounted) {
          setSelectedLocation(storedLocation)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        if (mounted) {
          router.replace("/slogan")
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
  }, [imageState, emojiState, sloganState, selectedLocation, updateCanvas])

  const handleLocationSelect = (locationId: string): void => {
    setSelectedLocation(locationId)
    localStorage.setItem(STORAGE_KEYS.selectedLocation, locationId)
  }

  const handleBack = (): void => {
    router.push("/slogan")
  }

  const handleNext = (): void => {
    if (selectedLocation && imageState) {
      // Save the selected location
      localStorage.setItem(STORAGE_KEYS.selectedLocation, selectedLocation)
      
      // Save final image with location
      if (canvasRef.current) {
        const finalImage = canvasRef.current.toDataURL("image/jpeg", IMAGE_QUALITY)
        localStorage.setItem(STORAGE_KEYS.editedImage, finalImage)
      }
      
      router.push("/preview")
    }
  }

  // Filter locations based on search query
  const filteredLocations = LOCATIONS.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <PageHeader
        title="Select Location"
        step={4}
        totalSteps={5}
        onBack={handleBack}
      />

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Choose Your Location</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col items-center justify-between gap-6">
          {imageState && (
            <div className="w-full aspect-video relative rounded-lg overflow-hidden bg-muted">
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Your photo with location"
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
            </div>
          )}

          <div className="w-full space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search locations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-4 space-y-2">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={cn(
                      "flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-all",
                      selectedLocation === location.id ? "border-primary bg-primary/5" : "border-muted"
                    )}
                    onClick={() => handleLocationSelect(location.id)}
                  >
                    <div className="text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{location.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{location.type}</p>
                    </div>
                  </div>
                ))}

                {filteredLocations.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">No locations found</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedLocation || !imageState}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Hidden canvas for rendering */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  )
}
