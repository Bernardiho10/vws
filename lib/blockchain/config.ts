'use client'

import { 
  createConfig,
  http,
} from 'wagmi'
import { type Chain, polygon, polygonMumbai } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

/**
 * Project ID for WalletConnect
 * In production, should be set in environment variables
 */
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default_project_id_for_development';

/**
 * Available chains for the application
 */
export const availableChains = [polygonMumbai, polygon] as const;

/**
 * Wagmi configuration for blockchain integration
 */
export const wagmiConfig = createConfig({
  chains: availableChains,
  transports: {
    [polygonMumbai.id]: http(),
    [polygon.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({ projectId: PROJECT_ID }),
  ],
});

/**
 * Default chain for application
 */
export const DEFAULT_CHAIN: Chain = polygonMumbai;
