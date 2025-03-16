'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'

export function RegistrationForm() {
  const { login } = useAuth()
  const [username, setUsername] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!username) {
      setError('Username cannot be empty')
      return
    }
    // Implement registration logic here
    // After successful registration, log the user in
    login(username)
    setUsername('')
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="registration-form" aria-label="Registration Form">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
        className="input"
        aria-required="true"
      />
      {error && <p className="text-red-500 text-sm mt-2" role="alert">{error}</p>}
      <button type="submit" className="submit-button">Register</button>
    </form>
  )
}
