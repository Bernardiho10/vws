'use client'

import React, { useState } from 'react'

interface FeedbackFormProps {
  onSubmit: (feedback: string) => void
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!feedback) {
      setError('Feedback cannot be empty')
      return
    }
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      onSubmit(feedback)
      setFeedback('')
      setError('')
    } catch {
      setError('Failed to submit feedback')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="feedback-form" aria-label="Feedback Form">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Enter your feedback"
        className="textarea"
        aria-required="true"
      />
      {error && <p className="text-red-500 text-sm mt-2" role="alert">{error}</p>}
      <button type="submit" className="submit-button">Submit Feedback</button>
    </form>
  )
}
