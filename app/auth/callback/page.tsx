"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { checkVerificationStatus } from "@/utils/supabase/auth-service"
import { Loader2 } from "lucide-react"

/**
 * Auth callback page for handling OAuth redirects and email verification
 * This component checks the user's verification status and redirects accordingly
 */
export default function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState<string>("Verifying your account...")

  useEffect(() => {
    const verifyUser = async (): Promise<void> => {
      try {
        const isVerified = await checkVerificationStatus()
        
        if (isVerified) {
          setMessage("Verification successful! Redirecting to dashboard...")
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        } else {
          setMessage("Please verify your email before continuing...")
          setTimeout(() => {
            router.push("/verify-email")
          }, 1500)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Verification failed"
        setMessage(`${errorMessage}. Please try again.`)
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      }
    }

    verifyUser()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center p-8 rounded-lg max-w-md">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Authentication in progress</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
