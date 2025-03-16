"use client"

import React, { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { AuthProvider } from "@/context/auth-context"

/**
 * Dynamic import of BlockchainProviders with SSR disabled
 * This prevents WalletConnect from executing during server-side rendering
 */
const BlockchainProviders = dynamic(
  () => import("@/components/providers/blockchain-providers").then(mod => ({ default: mod.BlockchainProviders })),
  { ssr: false }
)

/**
 * Create a persistent query client
 */
const queryClient = new QueryClient()

/**
 * Props for the Providers component
 */
interface ProvidersProps {
  readonly children: ReactNode
}

/**
 * Unified providers component that manages all application contexts
 * Following the established pattern of clear separation of concerns
 */
export function Providers({ children }: ProvidersProps): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BlockchainProviders>
          {children}
        </BlockchainProviders>
      </AuthProvider>
    </QueryClientProvider>
  )
}
