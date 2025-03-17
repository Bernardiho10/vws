/**
 * Defines the verification level for user feedback
 */
export type VerificationLevel = 'pending' | 'low' | 'medium' | 'high' | 'verified';

/**
 * Defines the structure for user feedback data
 */
export interface FeedbackData {
  readonly id: string;
  readonly username: string;
  readonly timestamp: string;
  readonly content: string;
  readonly verificationLevel: VerificationLevel;
  readonly blockchainTxId?: string;
  readonly socialScore: number;
}

/**
 * Defines the column structure for feedback table
 */
export interface FeedbackColumn {
  readonly id: string;
  readonly header: string;
  readonly accessorKey: keyof FeedbackData;
  readonly cell?: (info: { getValue: () => React.ReactNode }) => React.ReactNode;
}

/**
 * Type for feedback table sorting
 */
export interface SortingState {
  readonly id: string;
  readonly desc: boolean;
}

/**
 * Type for the feedback data set
 */
export type FeedbackDataArray = readonly FeedbackData[];
