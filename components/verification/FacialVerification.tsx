import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { detectFace, loadModels } from '@/services/faceDetection'

interface FacialVerificationProps {
  onVerificationComplete: (imageData: string, verificationData: VerificationData) => Promise<void>
  isVerifying?: boolean
}

export interface VerificationData {
  timestamp: number
  faceDetected: boolean
  confidence: number
  imageHash: string
}

export function FacialVerification({ onVerificationComplete, isVerifying = false }: FacialVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  useEffect(() => {
    loadModels()
      .then(() => setIsLoadingModels(false))
      .catch((error) => {
        console.error('Error loading face detection models:', error)
        toast.error('Failed to load face detection models')
      })
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsCapturing(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Unable to access camera')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }, [stream])

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg')

      // Detect face in the captured image
      const { faceDetected, confidence } = await detectFace(video)

      if (!faceDetected) {
        toast.error('No face detected. Please try again.')
        return
      }

      // Generate verification data
      const verificationData: VerificationData = {
        timestamp: Date.now(),
        faceDetected,
        confidence,
        imageHash: await generateImageHash(imageData)
      }

      await onVerificationComplete(imageData, verificationData)
      stopCamera()
    } catch (error) {
      console.error('Error capturing image:', error)
      toast.error('Failed to capture and verify image')
    }
  }, [onVerificationComplete, stopCamera])

  // Mock function - replace with actual hash generation
  const generateImageHash = async (imageData: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(imageData)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  if (isLoadingModels) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-gray-500">Loading face detection models...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Facial Verification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCapturing ? 'block' : 'hidden'}`}
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          {!isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Camera inactive</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isCapturing ? (
          <Button 
            onClick={startCamera}
            disabled={isVerifying}
          >
            Start Camera
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={stopCamera}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button 
              onClick={captureImage}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Capture & Verify'}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
} 