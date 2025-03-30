'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface VoteCardProps {
  pollId: string
  title: string
  description: string
  maxVotes: number
  currentVotes: number
  voteCost: number
  onVoteSubmit: (votes: number) => Promise<void>
  canVote: (votes: number) => boolean
  isSubmitting: boolean
}

function VoteCard({
  pollId,
  title,
  description,
  maxVotes,
  currentVotes,
  voteCost,
  onVoteSubmit,
  canVote,
  isSubmitting,
}: VoteCardProps) {
  const [votes, setVotes] = useState(currentVotes)

  const handleVoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVotes = Math.min(Math.max(0, parseInt(event.target.value) || 0), maxVotes)
    setVotes(newVotes)
  }

  const handleSubmit = async () => {
    if (canVote(votes)) {
      await onVoteSubmit(votes)
    }
  }

  return (
    <Card data-poll-id={pollId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="votes" className="block text-sm font-medium text-gray-700">
              Votes (0-{maxVotes})
            </label>
            <Input
              id="votes"
              type="number"
              min={0}
              max={maxVotes}
              value={votes}
              onChange={handleVoteChange}
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>
          <div className="text-sm">
            <p>Current votes: {currentVotes}</p>
            <p>Cost: {voteCost} credits</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!canVote(votes) || isSubmitting || votes === currentVotes}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Vote'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default VoteCard 