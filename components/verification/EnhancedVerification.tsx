import React, { useState } from 'react'
import { FacialVerification, VerificationData } from './FacialVerification'
import { EmojiPicker } from '../emoji/EmojiPicker'
import { LocationPicker } from '../location/LocationPicker'
import { ImageCropper } from '../crop/ImageCropper'
import { ImagePreview } from '../preview/ImagePreview'
import { ShareOptions } from '../share/ShareOptions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface EnhancedVerificationProps {
  onVerificationComplete: (data: EnhancedVerificationData) => Promise<void>
  isVerifying?: boolean
}

export interface EnhancedVerificationData extends VerificationData {
  emoji?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  croppedImage?: string
}

enum VerificationStep {
  FACIAL = 'FACIAL',
  EMOJI = 'EMOJI',
  LOCATION = 'LOCATION',
  CROP = 'CROP',
  PREVIEW = 'PREVIEW',
  SHARE = 'SHARE'
}

export function EnhancedVerification({
  onVerificationComplete,
  isVerifying = false
}: EnhancedVerificationProps) {
  const [step, setStep] = useState<VerificationStep>(VerificationStep.FACIAL)
  const [verificationData, setVerificationData] = useState<Partial<EnhancedVerificationData>>({})
  const [imageData, setImageData] = useState<string>('')

  const handleFacialVerification = async (
    imageData: string,
    verificationData: VerificationData
  ) => {
    setImageData(imageData)
    setVerificationData(verificationData)
    setStep(VerificationStep.EMOJI)
  }

  const handleEmojiSelect = (emoji: string) => {
    setVerificationData(prev => ({ ...prev, emoji }))
    setStep(VerificationStep.LOCATION)
  }

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setVerificationData(prev => ({ ...prev, location }))
    setStep(VerificationStep.CROP)
  }

  const handleImageCrop = (croppedImage: string) => {
    setVerificationData(prev => ({ ...prev, croppedImage }))
    setStep(VerificationStep.PREVIEW)
  }

  const handleShare = async () => {
    if (verificationData) {
      await onVerificationComplete(verificationData as EnhancedVerificationData)
    }
    setStep(VerificationStep.SHARE)
  }

  const renderStep = () => {
    switch (step) {
      case VerificationStep.FACIAL:
        return (
          <FacialVerification
            onVerificationComplete={handleFacialVerification}
            isVerifying={isVerifying}
          />
        )
      case VerificationStep.EMOJI:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Add an Emoji Reaction</CardTitle>
            </CardHeader>
            <CardContent>
              <EmojiPicker onSelect={handleEmojiSelect} />
            </CardContent>
          </Card>
        )
      case VerificationStep.LOCATION:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Add Your Location</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationPicker onSelect={handleLocationSelect} />
            </CardContent>
          </Card>
        )
      case VerificationStep.CROP:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Adjust Your Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageCropper image={imageData} onCrop={handleImageCrop} />
            </CardContent>
          </Card>
        )
      case VerificationStep.PREVIEW:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ImagePreview
                image={verificationData.croppedImage || imageData}
                emoji={verificationData.emoji}
                location={verificationData.location}
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleShare} disabled={isVerifying}>
                {isVerifying ? 'Sharing...' : 'Share & Complete Verification'}
              </Button>
            </CardFooter>
          </Card>
        )
      case VerificationStep.SHARE:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Share Your Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <ShareOptions
                image={verificationData.croppedImage || imageData}
                verificationData={verificationData as EnhancedVerificationData}
              />
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {renderStep()}
      {step !== VerificationStep.FACIAL && (
        <Button
          variant="outline"
          onClick={() => setStep(prev => {
            switch (prev) {
              case VerificationStep.EMOJI:
                return VerificationStep.FACIAL
              case VerificationStep.LOCATION:
                return VerificationStep.EMOJI
              case VerificationStep.CROP:
                return VerificationStep.LOCATION
              case VerificationStep.PREVIEW:
                return VerificationStep.CROP
              case VerificationStep.SHARE:
                return VerificationStep.PREVIEW
              default:
                return VerificationStep.FACIAL
            }
          })}
        >
          Back
        </Button>
      )}
    </div>
  )
} 