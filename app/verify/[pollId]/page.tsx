'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VerificationWithWallet } from '@/components/verification/VerificationWithWallet'
import { EnhancedVerificationData } from '@/components/verification/EnhancedVerification'

export default function VerifyPage() {
  const params = useParams()
  const router = useRouter()
  const pollId = params?.pollId as string

  if (!pollId) {
    router.push('/404')
    return null
  }

  const handleVerificationComplete = (data: EnhancedVerificationData) => {
    // Here you would typically:
    // 1. Store the verification result
    // 2. Update the UI
    // 3. Navigate to a success page or back to the poll
    
    console.log('Verification completed:', data)
    router.push(`/poll/${pollId}?verified=true`)
  }

  return (
    <div className="container max-w-2xl py-8">
      <VerificationWithWallet
        pollId={pollId}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  )
} 