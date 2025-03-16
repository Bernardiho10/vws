/**
 * Points system type definitions
 */

/**
 * Point activity definition
 */
export interface PointsActivity {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly basePoints: number;
  readonly category: 'daily' | 'streak' | 'verification' | 'referral';
  readonly maxPerDay: number;
  readonly icon?: string;
}

/**
 * Array of points activities
 */
export type PointsActivityArray = readonly PointsActivity[];

/**
 * Single point transaction record
 */
export interface PointTransaction {
  readonly id: string;
  readonly timestamp: string;
  readonly activityId: string;
  readonly pointsEarned: number;
  readonly notes: string;
  readonly verificationImageUrl?: string;
}

/**
 * Transaction history array
 */
export type PointTransactionArray = readonly PointTransaction[];

/**
 * User points data
 */
export interface UserPoints {
  readonly userId: string;
  readonly username: string;
  readonly totalPoints: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly lastVerificationDate: string;
  readonly pointsHistory: PointTransactionArray;
  readonly tokenConversionRate: number; // points to $voteright token rate
  readonly estimatedTokens: number;
  readonly level: number;
}

/**
 * Array of user points data
 */
export type UserPointsArray = readonly UserPoints[];

/**
 * Level requirements definition
 */
export interface LevelRequirement {
  readonly level: number;
  readonly pointsRequired: number;
  readonly benefits: readonly string[];
}

/**
 * Level requirements array
 */
export type LevelRequirementArray = readonly LevelRequirement[];
