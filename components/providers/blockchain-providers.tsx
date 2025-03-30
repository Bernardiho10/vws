"use client"

import { Web3Provider } from '@/context/web3-context'

/**
 * Client-side wrapper for blockchain-related providers with SSR safety
 */
export function BlockchainProviders({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      {children}
    </Web3Provider>
  )
}
