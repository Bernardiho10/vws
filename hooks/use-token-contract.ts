"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { getContractAddresses } from "@/lib/blockchain/contract-addresses";
import { tokenAbi } from "@/lib/blockchain/abis/token-abi";
import { 
  BlockchainError, 
  BlockchainErrorType, 
  TokenBalance, 
  TokenTransaction, 
  TokenTransactionArray, 
  TransactionReceipt, 
  TransactionStatus 
} from "@/types/blockchain";
import { formatUnits, parseUnits } from "viem";

/**
 * Result type for token contract operations
 */
interface TokenContractResult {
  readonly loading: boolean;
  readonly error: BlockchainError | null;
  readonly balance: TokenBalance | null;
  readonly transactions: TokenTransactionArray;
  readonly transferToken: (toAddress: string, amount: string) => Promise<TransactionReceipt | null>;
  readonly getTransactionHistory: (address: string, limit?: number) => Promise<TokenTransactionArray>;
  readonly refreshBalance: () => Promise<void>;
}

/**
 * Config options for token contract hook
 */
interface TokenContractConfig {
  readonly address?: string;
  readonly environment?: "development" | "test" | "production";
  readonly autoRefresh?: boolean;
  readonly refreshInterval?: number;
}

/**
 * Hook for interacting with the VoteRight token contract
 */
export function useTokenContract(config?: TokenContractConfig): TokenContractResult {
  // Default config values
  const {
    address,
    environment = "development",
    autoRefresh = true,
    refreshInterval = 30000,
  } = config || {};

  // Blockchain clients
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Contract address
  const contractAddresses = getContractAddresses(environment);
  const tokenAddress = contractAddresses.voteToken;

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<BlockchainError | null>(null);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransactionArray>([]);

  /**
   * Format balance with proper decimals
   */
  const formatBalance = (rawBalance: bigint): string => {
    return formatUnits(rawBalance, 18); // Assuming 18 decimals for ERC20
  };

  /**
   * Get token balance for address
   */
  const getBalance = async (ownerAddress: string): Promise<TokenBalance | null> => {
    if (!ownerAddress || !publicClient) return null;
    
    try {
      const rawBalance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: "balanceOf",
        args: [ownerAddress as `0x${string}`],
      });
      
      const formattedBalance = formatBalance(rawBalance as bigint);
      
      return {
        address: ownerAddress,
        balance: rawBalance.toString(),
        formattedBalance,
      };
    } catch (err) {
      setError({
        type: BlockchainErrorType.ContractError,
        message: "Failed to get token balance",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      return null;
    }
  };

  /**
   * Refresh balance data
   */
  const refreshBalance = async (): Promise<void> => {
    if (!address) return;
    
    setLoading(true);
    try {
      const newBalance = await getBalance(address);
      if (newBalance) {
        setBalance(newBalance);
      }
    } catch (err) {
      setError({
        type: BlockchainErrorType.ContractError,
        message: "Failed to refresh balance",
        details: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Transfer tokens to another address
   */
  const transferToken = async (toAddress: string, amount: string): Promise<TransactionReceipt | null> => {
    if (!walletClient || !publicClient || !address) {
      setError({
        type: BlockchainErrorType.WalletNotConnected,
        message: "Wallet not connected",
      });
      return null;
    }
    
    try {
      setLoading(true);
      
      // Convert amount to wei (tokens have 18 decimals)
      const amountInWei = parseUnits(amount, 18);
      
      // Send transaction
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, amountInWei],
      });
      
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Refresh balance after transfer
      await refreshBalance();
      
      return {
        txHash: hash,
        status: receipt.status === "success" ? TransactionStatus.Success : TransactionStatus.Failed,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Math.floor(Date.now() / 1000),
      };
    } catch (err) {
      console.error("Transfer error:", err);
      
      // Determine error type
      let errorType = BlockchainErrorType.TransactionFailed;
      if ((err as any)?.code === "ACTION_REJECTED") {
        errorType = BlockchainErrorType.UserRejected;
      } else if ((err as any)?.code === "INSUFFICIENT_FUNDS") {
        errorType = BlockchainErrorType.InsufficientFunds;
      }
      
      setError({
        type: errorType,
        message: "Failed to transfer tokens",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get transaction history for address
   */
  const getTransactionHistory = async (userAddress: string, limit = 10): Promise<TokenTransactionArray> => {
    if (!publicClient) return [];
    
    try {
      setLoading(true);
      
      // In a real implementation, you'd query the blockchain for Transfer events
      // Here's a simplified version
      const blockNumber = await publicClient.getBlockNumber();
      const fromBlock = blockNumber - BigInt(10000); // Last 10000 blocks
      
      const transferEvents = await publicClient.getContractEvents({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        eventName: "Transfer",
        fromBlock,
        toBlock: blockNumber,
      });
      
      const relevantEvents = transferEvents
        .filter((event) => 
          (event.args.from === userAddress || event.args.to === userAddress)
        )
        .slice(0, limit);
      
      const txHistory: TokenTransactionArray = await Promise.all(
        relevantEvents.map(async (event) => {
          const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
          return {
            txHash: event.transactionHash,
            from: event.args.from as string,
            to: event.args.to as string,
            amount: event.args.value.toString(),
            timestamp: Number(block.timestamp),
            reason: "Token Transfer", // Default reason
          };
        })
      );
      
      setTransactions(txHistory);
      return txHistory;
    } catch (err) {
      setError({
        type: BlockchainErrorType.ContractError,
        message: "Failed to get transaction history",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    if (address) {
      refreshBalance();
      getTransactionHistory(address);
      
      if (autoRefresh) {
        const intervalId = setInterval(() => {
          refreshBalance();
        }, refreshInterval);
        
        return () => clearInterval(intervalId);
      }
    }
  }, [address, tokenAddress, publicClient]);

  return {
    loading,
    error,
    balance,
    transactions,
    transferToken,
    getTransactionHistory,
    refreshBalance,
  };
}
