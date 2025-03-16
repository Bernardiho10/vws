"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { ImageCropper } from "@/components/image-cropper"
import { PageHeader } from "@/components/page-header"

export default function CropPage() {
  const router = useRouter()
  const [userImage, setUserImage] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)

  useEffect(() => {
    // Get the image from localStorage
    const storedImage = localStorage.getItem("userImage")
    if (!storedImage) {
      router.push("/")
      return
    }

    setUserImage(storedImage)
  }, [router])

  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl)
  }

  const handleSave = () => {
    if (croppedImage) {
      localStorage.setItem("croppedImage", croppedImage)
      router.push("/emoji")
    }
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <PageHeader title="Crop Image" step={2} totalSteps={7} onBack={handleBack} />

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Adjust Your Image</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col items-center justify-center">
          {userImage && <ImageCropper image={userImage} onCropComplete={handleCropComplete} />}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={!croppedImage}>
            <Save className="mr-2 h-4 w-4" />
            Save & Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

