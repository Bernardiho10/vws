"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { getContractAddresses } from "@/lib/blockchain/contract-addresses";
import { verificationAbi } from "@/lib/blockchain/abis/verification-abi";
import { 
  BlockchainError, 
  BlockchainErrorType, 
  Election,
  ElectionArray,
  TransactionReceipt, 
  TransactionStatus,
  VerificationProof,
  VoteRecord,
  VoteRecordArray
} from "@/types/blockchain";
import { keccak256, toBytes } from "viem";

/**
 * Result type for verification contract operations
 */
interface VerificationContractResult {
  readonly loading: boolean;
  readonly error: BlockchainError | null;
  readonly activeElections: ElectionArray;
  readonly userVotes: VoteRecordArray;
  readonly verifyVote: (proof: VerificationProof) => Promise<TransactionReceipt | null>;
  readonly createElection: (name: string, startTime: number, endTime: number, dataHash: string) => Promise<TransactionReceipt | null>;
  readonly endElection: (electionId: number) => Promise<TransactionReceipt | null>;
  readonly getUserVotes: (userAddress: string) => Promise<VoteRecordArray>;
  readonly getElections: (includeInactive?: boolean) => Promise<ElectionArray>;
  readonly hasVoted: (userAddress: string, electionId: number) => Promise<boolean>;
  readonly createProofHash: (data: string) => string;
}

/**
 * Config options for verification contract hook
 */
interface VerificationContractConfig {
  readonly address?: string;
  readonly environment?: "development" | "test" | "production";
  readonly autoRefresh?: boolean;
  readonly refreshInterval?: number;
}

/**
 * Hook for interacting with the VoteVerification contract
 */
export function useVerificationContract(config?: VerificationContractConfig): VerificationContractResult {
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
  const verificationAddress = contractAddresses.voteVerification;

  // State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<BlockchainError | null>(null);
  const [activeElections, setActiveElections] = useState<ElectionArray>([]);
  const [userVotes, setUserVotes] = useState<VoteRecordArray>([]);

  /**
   * Create a hash for vote verification proof
   * @param data - Verification data to hash
   */
  const createProofHash = (data: string): string => {
    return keccak256(toBytes(data));
  };

  /**
   * Get all elections from the contract
   */
  const getElections = async (includeInactive = false): Promise<ElectionArray> => {
    if (!publicClient) return [];
    
    try {
      setLoading(true);
      
      // Get election count
      const electionCounter = await publicClient.readContract({
        address: verificationAddress as `0x${string}`,
        abi: verificationAbi,
        functionName: "electionCounter",
      }) as bigint;
      
      const count = Number(electionCounter);
      const elections: ElectionArray = [];
      
      // Fetch each election
      for (let i = 0; i < count; i++) {
        const election = await publicClient.readContract({
          address: verificationAddress as `0x${string}`,
          abi: verificationAbi,
          functionName: "elections",
          args: [i],
        }) as any;
        
        // Skip inactive elections if specified
        if (!includeInactive && !election.active) continue;
        
        elections.push({
          id: i,
          name: election.name,
          startTime: Number(election.startTime),
          endTime: Number(election.endTime),
          active: election.active,
          verifiedVotes: Number(election.verifiedVotes),
          dataHash: election.dataHash,
        });
      }
      
      // Update state if needed
      if (includeInactive) {
        const activeOnly = elections.filter(e => e.active);
        setActiveElections(activeOnly);
      } else {
        setActiveElections(elections);
      }
      
      return elections;
    } catch (err) {
      setError({
        type: BlockchainErrorType.ContractError,
        message: "Failed to get elections",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if a user has voted in an election
   */
  const hasVoted = async (userAddress: string, electionId: number): Promise<boolean> => {
    if (!publicClient) return false;
    
    try {
      const voted = await publicClient.readContract({
        address: verificationAddress as `0x${string}`,
        abi: verificationAbi,
        functionName: "hasVoted",
        args: [userAddress as `0x${string}`, electionId],
      }) as boolean;
      
      return voted;
    } catch (err) {
      setError({
        type: BlockchainErrorType.ContractError,
        message: "Failed to check voting status",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      return false;
    }
  };

  /**
   * Get user's vote records
   */
  const getUserVotes = async (userAddress: string): Promise<VoteRecordArray> => {
    if (!publicClient) return [];
    
    try {
      setLoading(true);
      
      // In a real implementation, you'd need to query VoteVerified events
      // This is a simplified approach
      const blockNumber = await publicClient.getBlockNumber();
      const fromBlock = blockNumber - BigInt(10000); // Last 10000 blocks
      
      const voteEvents = await publicClient.getContractEvents({
        address: verificationAddress as `0x${string}`,
        abi: verificationAbi,
        eventName: "VoteVerified",
        fromBlock,
        toBlock: blockNumber,
      });
      
      const userVoteEvents = voteEvents.filter(
        event => event.args.voter === userAddress
      );
      
      const votes: VoteRecordArray = await Promise.all(
        userVoteEvents.map(async event => {
          // Get vote record details using the voteId
          const voteRecord = await publicClient.readContract({
            address: verificationAddress as `0x${string}`,
            abi: verificationAbi,
            functionName: "voteRecords",
            args: [event.args.voteId as string],
          }) as any;
          
          return {
            voteId: event.args.voteId as string,
            voter: voteRecord.voter,
            electionId: Number(event.args.electionId),
            timestamp: Number(voteRecord.timestamp),
            proofHash: voteRecord.proofHash,
          };
        })
      );
      
      if (userAddress === address) {
        setUserVotes(votes);
      }
      
      return votes;
    } catch (err) {
      setError({
        type: BlockchainErrorType.ContractError,
        message: "Failed to get user votes",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify a vote on the blockchain
   */
  const verifyVote = async (proof: VerificationProof): Promise<TransactionReceipt | null> => {
    if (!walletClient || !publicClient || !address) {
      setError({
        type: BlockchainErrorType.WalletNotConnected,
        message: "Wallet not connected",
      });
      return null;
    }
    
    if (!proof.signature) {
      setError({
        type: BlockchainErrorType.ContractError,
        message: "Missing signature for verification",
      });
      return null;
    }
    
    try {
      setLoading(true);
      
      // Send transaction
      const hash = await walletClient.writeContract({
        address: verificationAddress as `0x${string}`,
        abi: verificationAbi,
        functionName: "verifyVote",
        args: [
          proof.voter as `0x${string}`,
          proof.electionId,
          proof.proofHash as `0x${string}`,
          proof.signature as `0x${string}`,
        ],
      });
      
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Refresh user votes
      if (address) {
        await getUserVotes(address);
      }
      
      return {
        txHash: hash,
        status: receipt.status === "success" ? TransactionStatus.Success : TransactionStatus.Failed,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Math.floor(Date.now() / 1000),
      };
    } catch (err) {
      console.error("Verification error:", err);
      
      // Determine error type
      let errorType = BlockchainErrorType.TransactionFailed;
      if ((err as any)?.code === "ACTION_REJECTED") {
        errorType = BlockchainErrorType.UserRejected;
      }
      
      setError({
        type: errorType,
        message: "Failed to verify vote",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new election
   */
  const createElection = async (
    name: string,
    startTime: number,
    endTime: number,
    dataHash: string
  ): Promise<TransactionReceipt | null> => {
    if (!walletClient || !publicClient) {
      setError({
        type: BlockchainErrorType.WalletNotConnected,
        message: "Wallet not connected",
      });
      return null;
    }
    
    try {
      setLoading(true);
      
      // Send transaction
      const hash = await walletClient.writeContract({
        address: verificationAddress as `0x${string}`,
        abi: verificationAbi,
        functionName: "createElection",
        args: [
          name,
          BigInt(startTime),
          BigInt(endTime),
          dataHash as `0x${string}`,
        ],
      });
      
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Refresh elections
      await getElections();
      
      return {
        txHash: hash,
        status: receipt.status === "success" ? TransactionStatus.Success : TransactionStatus.Failed,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Math.floor(Date.now() / 1000),
      };
    } catch (err) {
      console.error("Create election error:", err);
      
      // Determine error type
      let errorType = BlockchainErrorType.TransactionFailed;
      if ((err as any)?.code === "ACTION_REJECTED") {
        errorType = BlockchainErrorType.UserRejected;
      }
      
      setError({
        type: errorType,
        message: "Failed to create election",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * End an active election
   */
  const endElection = async (electionId: number): Promise<TransactionReceipt | null> => {
    if (!walletClient || !publicClient) {
      setError({
        type: BlockchainErrorType.WalletNotConnected,
        message: "Wallet not connected",
      });
      return null;
    }
    
    try {
      setLoading(true);
      
      // Send transaction
      const hash = await walletClient.writeContract({
        address: verificationAddress as `0x${string}`,
        abi: verificationAbi,
        functionName: "endElection",
        args: [electionId],
      });
      
      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Refresh elections
      await getElections();
      
      return {
        txHash: hash,
        status: receipt.status === "success" ? TransactionStatus.Success : TransactionStatus.Failed,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Math.floor(Date.now() / 1000),
      };
    } catch (err) {
      console.error("End election error:", err);
      
      // Determine error type
      let errorType = BlockchainErrorType.TransactionFailed;
      if ((err as any)?.code === "ACTION_REJECTED") {
        errorType = BlockchainErrorType.UserRejected;
      }
      
      setError({
        type: errorType,
        message: "Failed to end election",
        details: err instanceof Error ? err.message : "Unknown error",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    getElections();
    
    if (address) {
      getUserVotes(address);
      
      if (autoRefresh) {
        const intervalId = setInterval(() => {
          getElections();
          getUserVotes(address);
        }, refreshInterval);
        
        return () => clearInterval(intervalId);
      }
    }
  }, [address, verificationAddress, publicClient]);

  return {
    loading,
    error,
    activeElections,
    userVotes,
    verifyVote,
    createElection,
    endElection,
    getUserVotes,
    getElections,
    hasVoted,
    createProofHash,
  };
}
