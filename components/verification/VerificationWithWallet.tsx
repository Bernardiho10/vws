import React, { useState } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { ConnectWalletButton } from '@/components/blockchain/connect-wallet-button'
import { EnhancedVerification, EnhancedVerificationData } from './EnhancedVerification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface VerificationWithWalletProps {
  pollId: string
  onVerificationComplete?: (data: EnhancedVerificationData) => void
}

export function VerificationWithWallet({ pollId, onVerificationComplete }: VerificationWithWalletProps) {
  const { isConnected, address } = useWallet()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerification = async (data: EnhancedVerificationData) => {
    if (!address) return

    setIsVerifying(true)
    setError(null)

    try {
      // Here you would typically:
      // 1. Upload the verification data to IPFS
      // 2. Create a transaction to store the IPFS hash on-chain
      // 3. Wait for transaction confirmation
      
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))

      onVerificationComplete?.(data)
    } catch (err) {
      setError('Failed to complete verification. Please try again.')
      console.error('Verification error:', err)
    } finally {
      setIsVerifying(false)
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to verify your vote for poll #{pollId}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ConnectWalletButton />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isVerifying && (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Processing your verification...</p>
          </CardContent>
        </Card>
      )}

      <EnhancedVerification
        onVerificationComplete={handleVerification}
        isVerifying={isVerifying}
      />
    </div>
  )
} 