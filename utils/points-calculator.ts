import { 
  POINTS_ACTIVITIES, 
  DEFAULT_TOKEN_CONVERSION_RATE, 
  LEVEL_REQUIREMENTS,
  STREAK_BREAK_THRESHOLD_MS
} from "@/constants/points";
import { 
  UserPoints, 
  PointTransaction,
  LevelRequirement
} from "@/types/points";

/**
 * Calculate streak bonus points based on streak length
 */
export function calculateStreakBonus(currentStreak: number): number {
  const streakActivity = POINTS_ACTIVITIES.find(activity => activity.id === 'streak-bonus');
  
  if (!streakActivity) {
    return 0;
  }
  
  return Math.min(
    currentStreak * streakActivity.basePoints,
    streakActivity.maxPerDay
  );
}

/**
 * Parameters for creating a point transaction
 */
interface CreateTransactionParams {
  readonly userId: string;
  readonly activityId: string;
  readonly notes?: string;
  readonly verificationImageUrl?: string;
  readonly pointsOverride?: number;
}

/**
 * Create a new point transaction
 */
export function createPointTransaction({
  userId,
  activityId,
  notes = '',
  verificationImageUrl,
  pointsOverride
}: CreateTransactionParams): PointTransaction {
  const activity = POINTS_ACTIVITIES.find(activity => activity.id === activityId);
  
  if (!activity) {
    throw new Error(`Activity with ID ${activityId} not found`);
  }
  
  return {
    id: `${userId}-${activityId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    activityId,
    pointsEarned: pointsOverride !== undefined ? pointsOverride : activity.basePoints,
    notes,
    verificationImageUrl
  };
}

/**
 * Check if a user's streak is still active
 */
export function isStreakActive(lastVerificationDate: string): boolean {
  const lastVerification = new Date(lastVerificationDate).getTime();
  const now = Date.now();
  
  return (now - lastVerification) < STREAK_BREAK_THRESHOLD_MS;
}

/**
 * Calculate level based on total points
 */
export function calculateUserLevel(totalPoints: number): LevelRequirement {
  // Sort in descending order to find the highest level the user qualifies for
  const sortedLevels = [...LEVEL_REQUIREMENTS].sort((a, b) => b.level - a.level);
  
  for (const level of sortedLevels) {
    if (totalPoints >= level.pointsRequired) {
      return level;
    }
  }
  
  // Default to level 1 if no match (should never happen with proper level requirements)
  return LEVEL_REQUIREMENTS[0];
}

/**
 * Points to tokens conversion
 */
export function pointsToTokens(points: number, conversionRate: number = DEFAULT_TOKEN_CONVERSION_RATE): number {
  return parseFloat((points / conversionRate).toFixed(3));
}

/**
 * Format points and tokens for display
 */
export function formatPoints(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Calculate points needed for next level
 */
export function pointsToNextLevel(userPoints: UserPoints): {
  readonly nextLevel: LevelRequirement | null;
  readonly pointsNeeded: number;
  readonly progressPercentage: number;
} {
  const currentLevel = calculateUserLevel(userPoints.totalPoints);
  const nextLevelIndex = LEVEL_REQUIREMENTS.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= LEVEL_REQUIREMENTS.length) {
    return { nextLevel: null, pointsNeeded: 0, progressPercentage: 100 };
  }
  
  const nextLevel = LEVEL_REQUIREMENTS[nextLevelIndex];
  const pointsNeeded = nextLevel.pointsRequired - userPoints.totalPoints;
  const totalPointsForLevel = nextLevel.pointsRequired - currentLevel.pointsRequired;
  const earnedPointsForLevel = userPoints.totalPoints - currentLevel.pointsRequired;
  const progressPercentage = Math.min(100, Math.floor((earnedPointsForLevel / totalPointsForLevel) * 100));
  
  return { nextLevel, pointsNeeded, progressPercentage };
}
