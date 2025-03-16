'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'

export function LoginForm() {
  const { login } = useAuth()
  const [username, setUsername] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (!username) {
      setError('Username cannot be empty')
      return
    }
    login(username)
    setUsername('')
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="login-form" aria-label="Login Form">
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your username"
        className="input"
        aria-required="true"
      />
      {error && <p className="text-red-500 text-sm mt-2" role="alert">{error}</p>}
      <button type="submit" className="submit-button">Login</button>
    </form>
  )
}
