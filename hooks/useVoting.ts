import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { VerificationData } from '@/components/verification/FacialVerification'
import { verifyUserIdentity } from '@/services/blockchain'

interface VotingState {
  userCredits: number
  votes: Record<string, number>
  isSubmitting: boolean
  isVerified: boolean
  isVerifying: boolean
  verificationData?: VerificationData
  ipfsHash?: string
  transactionHash?: string
}

interface UseVotingOptions {
  initialCredits?: number
}

export function useVoting({ initialCredits = 100 }: UseVotingOptions = {}) {
  const [state, setState] = useState<VotingState>({
    userCredits: initialCredits,
    votes: {},
    isSubmitting: false,
    isVerified: false,
    isVerifying: false,
  })

  const calculateCost = useCallback((votes: number) => {
    return votes * votes
  }, [])

  const canVote = useCallback(
    (pollId: string, votes: number) => {
      if (!state.isVerified) return false
      
      const cost = calculateCost(votes)
      const currentVoteCost = calculateCost(state.votes[pollId] || 0)
      const otherVotesCost = Object.entries(state.votes)
        .filter(([id]) => id !== pollId)
        .reduce((total, [, votes]) => total + calculateCost(votes), 0)

      return cost - currentVoteCost + otherVotesCost <= state.userCredits
    },
    [state.userCredits, state.votes, calculateCost, state.isVerified]
  )

  const handleVerification = useCallback(async (imageData: string, verificationData: VerificationData) => {
    try {
      setState(prev => ({ ...prev, isVerifying: true }))

      // Store image and verification data on blockchain
      const { ipfsHash, transactionHash } = await verifyUserIdentity(
        imageData,
        verificationData
      )

      setState(prev => ({
        ...prev,
        isVerified: true,
        isVerifying: false,
        verificationData,
        ipfsHash,
        transactionHash
      }))

      toast.success('Verification successful')
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Verification failed')
      setState(prev => ({ ...prev, isVerifying: false }))
    }
  }, [])

  const submitVote = useCallback(
    async (pollId: string, votes: number) => {
      if (!state.isVerified) {
        toast.error('Please complete verification first')
        return
      }

      if (!canVote(pollId, votes)) {
        toast.error('Insufficient credits')
        return
      }

      try {
        setState((prev) => ({ ...prev, isSubmitting: true }))

        // This would be replaced with actual blockchain transaction
        // Include verification data in the transaction
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setState((prev) => ({
          ...prev,
          votes: {
            ...prev.votes,
            [pollId]: votes,
          },
          userCredits:
            prev.userCredits -
            (calculateCost(votes) - calculateCost(prev.votes[pollId] || 0)),
          isSubmitting: false,
        }))

        toast.success('Vote submitted successfully')
      } catch (error) {
        console.error('Vote submission error:', error)
        toast.error('Failed to submit vote')
        setState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [canVote, calculateCost, state.isVerified]
  )

  const getVotes = useCallback(
    (pollId: string) => {
      return state.votes[pollId] || 0
    },
    [state.votes]
  )

  const getRemainingCredits = useCallback(() => {
    const usedCredits = Object.values(state.votes).reduce(
      (total, votes) => total + calculateCost(votes),
      0
    )
    return state.userCredits - usedCredits
  }, [state.userCredits, state.votes, calculateCost])

  return {
    userCredits: state.userCredits,
    remainingCredits: getRemainingCredits(),
    isSubmitting: state.isSubmitting,
    isVerified: state.isVerified,
    isVerifying: state.isVerifying,
    verificationData: state.verificationData,
    getVotes,
    submitVote,
    canVote,
    calculateCost,
    handleVerification,
  }
} 