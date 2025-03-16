/**
 * Blockchain type definitions for VoteRight
 */

/**
 * Blockchain environment
 */
export type BlockchainEnvironment = "development" | "test" | "production";

/**
 * Blockchain error types
 */
export enum BlockchainErrorType {
  WalletNotConnected = "WALLET_NOT_CONNECTED",
  UserRejected = "USER_REJECTED",
  TransactionFailed = "TRANSACTION_FAILED",
  InsufficientFunds = "INSUFFICIENT_FUNDS",
  ContractError = "CONTRACT_ERROR",
  InvalidNonce = "INVALID_NONCE",
  LowGasPrice = "LOW_GAS_PRICE",
  NetworkError = "NETWORK_ERROR",
  UnknownError = "UNKNOWN_ERROR"
}

/**
 * Blockchain error interface
 */
export interface BlockchainError {
  readonly type: BlockchainErrorType;
  readonly message: string;
  readonly details: string | null;
}

/**
 * Smart contract transaction statuses
 */
export enum TransactionStatus {
  Pending = "PENDING",
  Success = "SUCCESS",
  Failed = "FAILED"
}

/**
 * Transaction receipt with status
 */
export interface TransactionReceipt {
  readonly txHash: string;
  readonly status: TransactionStatus;
  readonly blockNumber: bigint;
  readonly gasUsed: string;
  readonly timestamp: number;
}

/**
 * Vote verification record structure
 */
export interface VoteRecord {
  readonly voteId: string;
  readonly voter: string;
  readonly electionId: number;
  readonly timestamp: number;
  readonly proofHash: string;
}

/**
 * Array type for vote records
 */
export type VoteRecordArray = readonly VoteRecord[];

/**
 * Election structure from smart contract
 */
export interface Election {
  readonly id: number;
  readonly name: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly active: boolean;
  readonly verifiedVotes: number;
  readonly dataHash: string;
}

/**
 * Array type for elections
 */
export type ElectionArray = readonly Election[];

/**
 * Token transaction data
 */
export interface TokenTransaction {
  readonly txHash: string;
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly timestamp: number;
  readonly reason?: string;
}

/**
 * Array type for token transactions
 */
export type TokenTransactionArray = readonly TokenTransaction[];

/**
 * Token balance data
 */
export interface TokenBalance {
  readonly address: string;
  readonly balance: string;
  readonly formattedBalance: string;
}

/**
 * Vote verification proof for signing
 */
export interface VerificationProof {
  readonly voter: string;
  readonly electionId: number;
  readonly proofHash: string;
  readonly signature: string;
}

/**
 * Contract addresses for different environments
 */
export interface ContractAddresses {
  readonly voteToken: string;
  readonly voteVerification: string;
}

/**
 * Wallet connection state
 */
export interface WalletState {
  readonly address: string | null;
  readonly isConnected: boolean;
  readonly isConnecting: boolean;
  readonly chainId: number | null;
  readonly error: BlockchainError | null;
}

/**
 * Blockchain connection options
 */
export interface BlockchainConnectionOptions {
  readonly autoConnect?: boolean;
  readonly preferredChainId?: number;
}
