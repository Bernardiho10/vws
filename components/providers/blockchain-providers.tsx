"use client"

import React, { ReactNode } from "react"
import { WagmiConfig } from "wagmi"
import { wagmiConfig } from "@/lib/blockchain/config"
import { BlockchainProvider } from "@/context/blockchain-context"
import { useSafeBlockchain } from "@/hooks/use-safe-blockchain"

/**
 * Props for the BlockchainProviders component
 */
interface BlockchainProvidersProps {
  readonly children: ReactNode;
}

/**
 * Client-side wrapper for blockchain-related providers with SSR safety
 */
export function BlockchainProviders({ children }: BlockchainProvidersProps): React.ReactElement {
  const { isReady } = useSafeBlockchain()
  
  // Render a placeholder during SSR to prevent hydration mismatches
  if (!isReady) {
    return <>{children}</>;
  }
  
  return (
    <WagmiConfig config={wagmiConfig}>
      <BlockchainProvider>
        {children}
      </BlockchainProvider>
    </WagmiConfig>
  );
}
