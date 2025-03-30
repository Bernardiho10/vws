"use client"

import { useVoting } from '@/hooks/useVoting'
import dynamic from 'next/dynamic'
import { FacialVerification } from '@/components/verification/FacialVerification'

const VoteCard = dynamic(() => import('@/components/voting/VoteCard'))

const MOCK_POLLS = [
  {
    id: '1',
    title: 'Community Development Fund',
    description:
      'Should we allocate 10% of treasury funds to community development initiatives?',
    maxVotes: 10,
  },
  {
    id: '2',
    title: 'Protocol Upgrade',
    description:
      'Do you support implementing the proposed protocol upgrade for improved scalability?',
    maxVotes: 10,
  },
  {
    id: '3',
    title: 'Governance Structure',
    description:
      'Should we transition to a more decentralized governance model?',
    maxVotes: 10,
  },
]

/**
 * Voting process entry point page
 * This page displays the landing page component directly for the voting process
 */
export default function VotingPage() {
  const {
    remainingCredits,
    isSubmitting,
    isVerified,
    isVerifying,
    getVotes,
    submitVote,
    canVote,
    calculateCost,
    handleVerification,
  } = useVoting()

  return (
    <div className="container mx-auto px-4 py-8">
      {!isVerified ? (
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Verify Your Identity</h1>
          <p className="text-gray-600 mb-6">
            Before voting, we need to verify your identity using facial recognition.
            This helps ensure the integrity of our voting system.
          </p>
          <FacialVerification
            onVerificationComplete={handleVerification}
            isVerifying={isVerifying}
          />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Active Polls</h1>
            <div className="bg-blue-100 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">How Quadratic Voting Works</h2>
              <p className="text-gray-700">
                Quadratic voting gives you voting credits to allocate across different
                proposals. The cost of votes increases quadratically - 1 vote costs 1
                credit, 2 votes cost 4 credits, 3 votes cost 9 credits, and so on. This
                helps prevent vote concentration and promotes more democratic outcomes.
              </p>
              <p className="text-blue-700 font-medium mt-2">
                You have {remainingCredits} credits remaining
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_POLLS.map((poll) => (
              <VoteCard
                key={poll.id}
                pollId={poll.id}
                title={poll.title}
                description={poll.description}
                maxVotes={poll.maxVotes}
                currentVotes={getVotes(poll.id)}
                voteCost={calculateCost(getVotes(poll.id))}
                onVoteSubmit={(votes) => submitVote(poll.id, votes)}
                canVote={(votes) => canVote(poll.id, votes)}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
