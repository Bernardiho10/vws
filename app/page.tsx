"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const { authState } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set isClient to true when component mounts (client-side only)
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only redirect after confirming we're on the client side
    if (isClient) {
      if (authState.user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [authState.user, router, isClient])

  // Return loading state while determining redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">Vote With Sense</h2>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
