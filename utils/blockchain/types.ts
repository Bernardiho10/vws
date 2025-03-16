/**
 * Core blockchain-related types and interfaces
 */

/**
 * Network configuration for blockchain connections
 */
export interface NetworkConfig {
  readonly chainId: number;
  readonly name: string;
  readonly rpcUrl: string;
  readonly blockExplorer: string;
  readonly currency: {
    readonly name: string;
    readonly symbol: string;
    readonly decimals: number;
  };
}

/**
 * User wallet connection state
 */
export interface WalletState {
  readonly isConnected: boolean;
  readonly address: string | null;
  readonly chainId: number | null;
  readonly isConnecting: boolean;
  readonly error: Error | null;
  readonly isReconnecting: boolean;
}

/**
 * Verification types for content
 */
export interface ContentVerification {
  readonly verified: boolean;
  readonly timestamp: number;
  readonly transactionHash: string | null;
  readonly verificationMethod: VerificationMethod;
  readonly verifier?: string;
}

/**
 * Methods used for content verification
 */
export type VerificationMethod = 'on-chain' | 'signature' | 'none';

/**
 * NFT Metadata for image minting
 */
export interface NFTMetadata {
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly attributes: readonly NFTAttribute[];
}

/**
 * NFT Attribute structure
 */
export interface NFTAttribute {
  readonly trait_type: string;
  readonly value: string | number;
}

/**
 * Support badge type
 */
export interface SupportBadge {
  readonly id: string;
  readonly tokenId: number | null;
  readonly imageUrl: string;
  readonly owner: string;
  readonly caption: string;
  readonly location: string;
  readonly createdAt: number;
  readonly mintStatus: MintStatus;
}

/**
 * Minting status for NFTs
 */
export type MintStatus = 'not_minted' | 'pending' | 'minted' | 'failed';

/**
 * Supported networks for the application
 */
export const SUPPORTED_NETWORKS = {
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    currency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  polygonMumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    currency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
} as const;

/**
 * Type for supported chain IDs
 */
export type SupportedChainId = typeof SUPPORTED_NETWORKS[keyof typeof SUPPORTED_NETWORKS]['chainId'];
