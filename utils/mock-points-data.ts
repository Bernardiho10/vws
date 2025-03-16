import { 
  UserPoints, 
  UserPointsArray, 
  PointTransaction, 
  PointTransactionArray 
} from "@/types/points";
import { DEFAULT_TOKEN_CONVERSION_RATE } from "@/constants/points";
import { POINTS_ACTIVITIES } from "@/constants/points";
import { calculateUserLevel, pointsToTokens } from "@/utils/points-calculator";

/**
 * Generate a single mock transaction
 */
function generateMockTransaction(
  userId: string, 
  daysAgo: number = 0, 
  activityId?: string
): PointTransaction {
  // Select a random activity if none provided
  const activity = activityId 
    ? POINTS_ACTIVITIES.find(a => a.id === activityId) 
    : POINTS_ACTIVITIES[Math.floor(Math.random() * POINTS_ACTIVITIES.length)];
  
  if (!activity) {
    throw new Error(`Activity not found: ${activityId}`);
  }
  
  // Calculate date with offset
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  return {
    id: `${userId}-${activity.id}-${date.getTime()}`,
    timestamp: date.toISOString(),
    activityId: activity.id,
    pointsEarned: activity.basePoints,
    notes: `${activity.name} completed`,
    verificationImageUrl: activity.category === 'daily' ? `/mock-images/verification-${Math.floor(Math.random() * 3) + 1}.jpg` : undefined
  };
}

/**
 * Generate mock transaction history for a user
 */
function generateMockTransactionHistory(
  userId: string, 
  days: number = 30, 
  streakDays: number = 0
): PointTransactionArray {
  const transactions: PointTransaction[] = [];
  
  // Generate daily verification and streak for the specified streak days
  for (let i = 0; i < streakDays; i++) {
    // Daily verification
    transactions.push(generateMockTransaction(userId, i, 'daily-verification'));
    
    // Streak bonus
    if (i > 0) {
      const streakBonus: PointTransaction = {
        id: `${userId}-streak-bonus-${i}`,
        timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        activityId: 'streak-bonus',
        pointsEarned: (i + 1) * 2, // Increasing streak bonus
        notes: `${i + 1} day streak bonus`,
        verificationImageUrl: undefined
      };
      transactions.push(streakBonus);
    }
    
    // Add some random other activities
    if (Math.random() > 0.7) {
      transactions.push(generateMockTransaction(userId, i, 'feedback-quality'));
    }
    
    if (Math.random() > 0.9) {
      transactions.push(generateMockTransaction(userId, i, 'referral-bonus'));
    }
  }
  
  // Fill remaining days with random transactions
  for (let i = streakDays; i < days; i++) {
    // Skip some days to break streak
    if (Math.random() > 0.7) {
      continue;
    }
    
    // Add random transactions
    const transactionCount = Math.floor(Math.random() * 2) + 1;
    for (let j = 0; j < transactionCount; j++) {
      transactions.push(generateMockTransaction(userId, i));
    }
  }
  
  return transactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) as PointTransactionArray;
}

/**
 * Calculate total points from transaction history
 */
function calculateTotalPoints(transactions: PointTransactionArray): number {
  return transactions.reduce((sum, transaction) => sum + transaction.pointsEarned, 0);
}

/**
 * Calculate streak information from transaction history
 */
function calculateStreakInfo(
  transactions: PointTransactionArray
): { readonly currentStreak: number; readonly longestStreak: number; readonly lastVerificationDate: string } {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Find daily verifications
  const dailyVerifications = sortedTransactions.filter(
    t => t.activityId === 'daily-verification'
  );
  
  if (dailyVerifications.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastVerificationDate: new Date().toISOString()
    };
  }
  
  const lastVerificationDate = dailyVerifications[0].timestamp;
  
  // Calculate current streak
  let currentStreak = 1;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  for (let i = 1; i < dailyVerifications.length; i++) {
    const current = new Date(dailyVerifications[i-1].timestamp).getTime();
    const previous = new Date(dailyVerifications[i].timestamp).getTime();
    const dayDifference = Math.round((current - previous) / ONE_DAY_MS);
    
    if (dayDifference <= 1) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate longest streak (simple version for mock data)
  const longestStreak = Math.max(currentStreak, Math.floor(dailyVerifications.length * 0.7));
  
  return {
    currentStreak,
    longestStreak,
    lastVerificationDate
  };
}

/**
 * Generate a single mock user points record
 */
export function generateMockUserPoints(
  userId: string,
  username: string,
  streakDays: number = 0
): UserPoints {
  const transactions = generateMockTransactionHistory(userId, 30, streakDays);
  const totalPoints = calculateTotalPoints(transactions);
  const { currentStreak, longestStreak, lastVerificationDate } = calculateStreakInfo(transactions);
  const level = calculateUserLevel(totalPoints).level;
  
  return {
    userId,
    username,
    totalPoints,
    currentStreak,
    longestStreak,
    lastVerificationDate,
    pointsHistory: transactions,
    tokenConversionRate: DEFAULT_TOKEN_CONVERSION_RATE,
    estimatedTokens: pointsToTokens(totalPoints),
    level
  };
}

/**
 * Generate mock user points array
 */
export function generateMockUsersPoints(count: number = 10): UserPointsArray {
  const users: UserPoints[] = [];
  
  // Current user with good streak
  users.push(generateMockUserPoints("current-user", "CurrentUser", 14));
  
  // Other users with random streaks
  for (let i = 1; i < count; i++) {
    const userId = `user-${i}`;
    const username = `User${i}`;
    const streakDays = Math.floor(Math.random() * 20);
    
    users.push(generateMockUserPoints(userId, username, streakDays));
  }
  
  return users.sort((a, b) => b.totalPoints - a.totalPoints) as UserPointsArray;
}

/**
 * Get a specific user's points data
 */
export function getMockUserPoints(username: string, usersArray?: UserPointsArray): UserPoints | null {
  const users = usersArray || generateMockUsersPoints();
  return users.find(u => u.username === username) || null;
}
