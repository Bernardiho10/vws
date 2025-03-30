import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Share2, Twitter, Facebook, Link } from 'lucide-react'
import { EnhancedVerificationData } from '../verification/EnhancedVerification'

interface ShareOptionsProps {
  verificationData: EnhancedVerificationData
}

export function ShareOptions({ verificationData }: ShareOptionsProps) {
  const shareUrl = window.location.href
  const shareText = `I just verified my vote with Vote With Sense! 🗳️ ${verificationData.emoji || ''}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vote With Sense Verification',
          text: shareText,
          url: shareUrl
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    }
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank')
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`
    window.open(facebookUrl, '_blank')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleShare}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleTwitterShare}
        >
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleFacebookShare}
        >
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleCopyLink}
        >
          <Link className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Share your verification to encourage others to vote responsibly!
      </div>
    </Card>
  )
} 