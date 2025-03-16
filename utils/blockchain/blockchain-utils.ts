/**
 * Utilities for blockchain interactions
 */
import { formatUnits, parseUnits } from "viem";
import { BlockchainError, BlockchainErrorType } from "@/types/blockchain";

/**
 * Options for blockchain transaction operations
 */
interface TransactionOptions {
  readonly gasLimit?: bigint;
  readonly maxFeePerGas?: bigint;
  readonly maxPriorityFeePerGas?: bigint;
  readonly nonce?: number;
}

/**
 * Result from a blockchain operation
 */
interface BlockchainResult<T> {
  readonly data: T | null;
  readonly error: BlockchainError | null;
  readonly success: boolean;
}

/**
 * Ethereum unit conversion types
 */
type EthereumUnit = "wei" | "gwei" | "eth";

/**
 * Supported chain IDs
 */
export type SupportedChainId = 1 | 5 | 11155111 | 137 | 80001;

/**
 * Network types with their chain IDs
 */
const NETWORKS = {
  ethereum: {
    mainnet: 1 as const,
    goerli: 5 as const,
    sepolia: 11155111 as const
  },
  polygon: {
    mainnet: 137 as const,
    mumbai: 80001 as const
  }
} as const;

/**
 * Format an amount from wei to a more readable unit
 * @param amount - Amount in wei
 * @param targetUnit - Target unit for formatting
 * @returns Formatted amount string
 */
export function formatTokenAmount(
  amount: bigint | string, 
  targetUnit: EthereumUnit = "eth"
): string {
  const decimals = targetUnit === "wei" ? 0 : targetUnit === "gwei" ? 9 : 18;
  
  try {
    const amountBigInt = typeof amount === "string" ? BigInt(amount) : amount;
    return formatUnits(amountBigInt, decimals);
  } catch (error) {
    console.error("Error formatting token amount:", error);
    return "0";
  }
}

/**
 * Parse an amount from a readable unit to wei
 * @param amount - Amount in readable format
 * @param sourceUnit - Source unit of the amount
 * @returns Amount in wei as bigint
 */
export function parseTokenAmount(
  amount: string, 
  sourceUnit: EthereumUnit = "eth"
): bigint {
  const decimals = sourceUnit === "wei" ? 0 : sourceUnit === "gwei" ? 9 : 18;
  
  try {
    return parseUnits(amount, decimals);
  } catch (error) {
    console.error("Error parsing token amount:", error);
    return BigInt(0);
  }
}

/**
 * Create a blockchain error object
 * @param type - Type of blockchain error
 * @param message - Error message
 * @param details - Additional error details
 * @returns BlockchainError object
 */
export function createBlockchainError(
  type: BlockchainErrorType,
  message: string,
  details?: string
): BlockchainError {
  return {
    type,
    message,
    details: details || null
  };
}

/**
 * Safely execute a blockchain operation with error handling
 * @param operation - Async operation to execute
 * @returns BlockchainResult with data or error
 */
export async function executeBlockchainOperation<T>(
  operation: () => Promise<T>
): Promise<BlockchainResult<T>> {
  try {
    const data = await operation();
    return {
      data,
      error: null,
      success: true
    };
  } catch (error) {
    let errorType = BlockchainErrorType.UnknownError;
    let errorMessage = "An unknown error occurred";
    let errorDetails = error instanceof Error ? error.message : String(error);
    
    // Determine error type from error message or code
    if (errorDetails.includes("user rejected")) {
      errorType = BlockchainErrorType.UserRejected;
      errorMessage = "Transaction was rejected by the user";
    } else if (errorDetails.includes("insufficient funds")) {
      errorType = BlockchainErrorType.InsufficientFunds;
      errorMessage = "Insufficient funds for transaction";
    } else if (errorDetails.includes("nonce too low")) {
      errorType = BlockchainErrorType.InvalidNonce;
      errorMessage = "Invalid nonce for transaction";
    } else if (errorDetails.includes("gas price too low")) {
      errorType = BlockchainErrorType.LowGasPrice;
      errorMessage = "Gas price too low for transaction";
    }
    
    return {
      data: null,
      error: createBlockchainError(errorType, errorMessage, errorDetails),
      success: false
    };
  }
}

/**
 * Format an Ethereum address for display
 * @param address - Ethereum address to format
 * @param prefixLength - Number of characters to show at the beginning
 * @param suffixLength - Number of characters to show at the end
 * @returns Formatted address string
 */
export function formatAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!address || address.length < (prefixLength + suffixLength)) {
    return address;
  }
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Get the network name from a chain ID
 * @param chainId - Chain ID to look up
 * @returns Network name or "Unknown Network"
 */
export function getNetworkName(chainId: SupportedChainId | number): string {
  // Check if chainId is one of our supported chains
  const supportedChainIds: readonly number[] = [
    NETWORKS.ethereum.mainnet,
    NETWORKS.ethereum.goerli,
    NETWORKS.ethereum.sepolia,
    NETWORKS.polygon.mainnet,
    NETWORKS.polygon.mumbai
  ];
  
  if (!supportedChainIds.includes(chainId)) {
    return "Unknown Network";
  }
  
  // Search through NETWORKS object to find matching chain ID
  for (const [network, chains] of Object.entries(NETWORKS)) {
    for (const [chain, id] of Object.entries(chains)) {
      if (id === chainId) {
        return `${network.charAt(0).toUpperCase() + network.slice(1)} ${chain}`;
      }
    }
  }
  
  return "Unknown Network";
}

/**
 * Check if a chain ID belongs to a testnet
 * @param chainId - Chain ID to check
 * @returns True if testnet, false otherwise
 */
export function isTestnet(chainId: SupportedChainId | number): boolean {
  const testnets: readonly number[] = [
    NETWORKS.ethereum.goerli,
    NETWORKS.ethereum.sepolia,
    NETWORKS.polygon.mumbai
  ];
  
  return testnets.includes(chainId);
}

/**
 * Generate a hash from election data
 * @param data - Election data object
 * @returns SHA-256 hash of the data
 */
export async function hashElectionData(data: unknown): Promise<string> {
  try {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error("Error hashing election data:", error);
    throw new Error("Failed to hash election data");
  }
}
