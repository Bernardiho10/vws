"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"
import Link from "next/link"

/**
 * Email verification notification page
 * This page is shown to users who need to verify their email
 */
export default function VerifyEmail() {
  const [resendLoading, setResendLoading] = useState<boolean>(false)
  const [resendStatus, setResendStatus] = useState<string>("")

  const handleResendEmail = async (): Promise<void> => {
    setResendLoading(true)
    try {
      // Implementation for resending verification email would go here
      // This is a placeholder for now
      setTimeout(() => {
        setResendLoading(false)
        setResendStatus("Verification email sent! Please check your inbox.")
      }, 2000)
    } catch (error: unknown) {
      setResendLoading(false)
      setResendStatus(error instanceof Error ? error.message : "Failed to resend email")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl mb-2">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link to your email address. Please click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            If you don&apos;t see the email in your inbox, check your spam folder.
          </p>
          {resendStatus && (
            <p className="text-sm font-medium text-green-600 mt-2">{resendStatus}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleResendEmail}
            disabled={resendLoading}
          >
            {resendLoading ? "Sending..." : "Resend verification email"}
          </Button>
          <div className="text-center text-sm mt-4">
            <Link href="/login" className="text-primary hover:underline">
              Return to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
