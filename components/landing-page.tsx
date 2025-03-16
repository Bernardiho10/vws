"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { PreviewCircle } from "@/components/preview-circle"
import Link from 'next/link';

interface ImageCaptureConfig {
  readonly quality: number
  readonly format: string
}

interface VideoConstraints {
  readonly facingMode: string
  readonly width: { readonly ideal: number }
  readonly height: { readonly ideal: number }
}

interface MediaConfig {
  readonly iconSize: string
  readonly buttonSize: string
}

const IMAGE_CAPTURE_CONFIG: ImageCaptureConfig = {
  quality: 0.8,
  format: "image/jpeg"
} as const

const VIDEO_CONSTRAINTS: VideoConstraints = {
  facingMode: "user",
  width: { ideal: 1280 },
  height: { ideal: 720 }
} as const

const MEDIA_CONFIG: MediaConfig = {
  iconSize: "h-20 w-20",
  buttonSize: "h-4 w-4"
} as const

const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert blob to base64"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read blob"))
    reader.readAsDataURL(blob)
  })
}

const convertFileToBase64 = async (file: File): Promise<string> => {
  const blob = new Blob([file], { type: file.type })
  return convertBlobToBase64(blob)
}

export function LandingPage() {
  const router = useRouter()
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  const handleCameraAccess = async (): Promise<void> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: false
      })
      setStream(mediaStream)
      setCameraActive(true)
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const handleCapture = async (): Promise<void> => {
    const video = videoRef.current
    if (!video) return
    const config = IMAGE_CAPTURE_CONFIG
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          config.format,
          config.quality
        )
      })
      const base64Image = await convertBlobToBase64(blob)
      setCapturedImage(base64Image)
      if(localStorage.getItem("croppedImage")){
        console.log("Item exist")
        localStorage.clear()
      }
      localStorage.setItem("croppedImage", base64Image)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      setStream(null)
      setCameraActive(false)
    } catch (error) {
      console.error("Error creating blob:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const base64Image = await convertFileToBase64(file)
        setCapturedImage(base64Image)
        localStorage.setItem("croppedImage", base64Image)
      } catch (error) {
        console.error("Error processing file:", error)
      }
    }
  }

  const handleNext = (): void => {
    if (capturedImage) {
      router.push("/emoji")
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <nav>
        <Link href="/profile">Profile</Link>
      </nav>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Vote With Sense 9ja</h1>
        <ModeToggle />
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Show Your Support</CardTitle>
          <CardDescription>Take a selfie or upload an image to customize and share your support</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col items-center justify-center gap-6">
          {!cameraActive && !capturedImage && (
            <div className="w-full flex flex-col gap-4 items-center">
              <PreviewCircle variant="dashed">
                {cameraActive ? (
                  <video autoPlay playsInline className="w-full h-full object-cover" ref={videoRef} />
                ) : (
                  <Camera className={`${MEDIA_CONFIG.iconSize} text-muted-foreground`} />
                )}
              </PreviewCircle>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button onClick={handleCameraAccess} className="gap-2">
                  <Camera className={MEDIA_CONFIG.buttonSize} />
                  Give Access to Camera
                </Button>

                <div className="relative">
                  <Button variant="outline" className="w-full gap-2">
                    <Upload className={MEDIA_CONFIG.buttonSize} />
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {cameraActive && !capturedImage && (
            <div className="w-full flex flex-col gap-4 items-center">
              <PreviewCircle>
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  ref={videoRef}
                />
              </PreviewCircle>

              <div className="flex gap-4">
                <Button onClick={handleCapture} className="gap-2">
                  <Camera className={MEDIA_CONFIG.buttonSize} />
                  Take Photo
                </Button>
                <Button variant="outline" onClick={() => setCameraActive(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="w-full flex flex-col gap-4 items-center">
              <PreviewCircle>
                <img src={capturedImage || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
              </PreviewCircle>

              <div className="flex gap-4">
                <Button onClick={handleNext} className="gap-2">
                  Next
                </Button>
                <Button variant="outline" onClick={() => setCapturedImage(null)}>
                  Reject
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground text-center">
            Join thousands of supporters showing their commitment to a better future
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
