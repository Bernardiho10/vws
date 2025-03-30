'use client'

import React from 'react'
import * as Slider from '@radix-ui/react-slider'
import { useCallback, useMemo } from 'react'

interface VoteSliderProps {
  value: number
  maxVotes: number
  credits: number
  onChange: (value: number) => void
  className?: string
}

export const VoteSlider: React.FC<VoteSliderProps> = ({
  value,
  maxVotes,
  credits,
  onChange,
  className,
}) => {
  const cost = useMemo(() => value * value, [value])
  const canVote = useMemo(() => cost <= credits, [cost, credits])
  
  const handleChange = useCallback(
    (newValue: number[]) => {
      const votes = Math.floor(newValue[0])
      if (votes * votes <= credits) {
        onChange(votes)
      }
    },
    [credits, onChange]
  )

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Voting Power</span>
        <span className="text-sm text-muted-foreground">
          Cost: {cost} credits
        </span>
      </div>
      
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        max={maxVotes}
        step={1}
        onValueChange={handleChange}
        aria-label="Voting power"
      >
        <Slider.Track className="bg-secondary relative grow rounded-full h-2">
          <Slider.Range className={`absolute bg-primary rounded-full h-full ${!canVote ? 'bg-red-500' : ''}`} />
        </Slider.Track>
        <Slider.Thumb
          className={`block w-5 h-5 bg-background shadow-lg rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            canVote ? 'border-primary' : 'border-red-500'
          }`}
        />
      </Slider.Root>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>{maxVotes}</span>
      </div>
    </div>
  )
} 