import { PointsActivityArray, LevelRequirementArray } from "@/types/points";

/**
 * Points activities with their base values
 */
export const POINTS_ACTIVITIES: PointsActivityArray = [
  {
    id: 'daily-verification',
    name: 'Daily Vote Verification',
    description: 'Verify your vote with a screenshot',
    basePoints: 10,
    category: 'daily',
    maxPerDay: 1,
    icon: 'camera'
  },
  {
    id: 'streak-bonus',
    name: 'Consistency Streak',
    description: 'Bonus for consecutive days of verification',
    basePoints: 2, // per day of streak
    category: 'streak',
    maxPerDay: 100, // maximum streak multiplier
    icon: 'flame'
  },
  {
    id: 'feedback-quality',
    name: 'Quality Feedback',
    description: 'Providing detailed feedback with your vote',
    basePoints: 5,
    category: 'verification',
    maxPerDay: 1,
    icon: 'message-square'
  },
  {
    id: 'referral-bonus',
    name: 'Referral',
    description: 'When someone joins using your referral code',
    basePoints: 25,
    category: 'referral',
    maxPerDay: 10,
    icon: 'users'
  }
] as const;

/**
 * Default token conversion rate (points to $voteright)
 */
export const DEFAULT_TOKEN_CONVERSION_RATE = 100; // 100 points = 1 $voteright token

/**
 * Level requirements and benefits
 */
export const LEVEL_REQUIREMENTS: LevelRequirementArray = [
  {
    level: 1,
    pointsRequired: 0,
    benefits: ['Basic voting rights']
  },
  {
    level: 2,
    pointsRequired: 500,
    benefits: ['5% bonus on daily points', 'Access to community forums']
  },
  {
    level: 3,
    pointsRequired: 2000,
    benefits: ['10% bonus on daily points', 'Early access to new features']
  },
  {
    level: 4,
    pointsRequired: 5000,
    benefits: ['15% bonus on daily points', 'Priority customer support']
  },
  {
    level: 5,
    pointsRequired: 10000,
    benefits: ['20% bonus on daily points', 'Exclusive governance voting rights']
  }
] as const;

/**
 * Maximum days for streak calculation
 */
export const MAX_STREAK_DAYS = 30;

/**
 * Streak bonus multiplier (base points * streak days * this value)
 */
export const STREAK_BONUS_MULTIPLIER = 0.1; // 10% per streak day

/**
 * Days that constitute a broken streak (ms)
 */
export const STREAK_BREAK_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
