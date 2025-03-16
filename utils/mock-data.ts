import { FeedbackDataArray, VerificationLevel } from "@/types/feedback";
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a random social score between min and max
 */
const generateSocialScore = (min: number = 10, max: number = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a random blockchain transaction ID
 */
const generateBlockchainTxId = (): string => {
  return `0x${Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)).join('')}`;
};

/**
 * Generate a random verification level
 */
const generateVerificationLevel = (): VerificationLevel => {
  const levels: readonly VerificationLevel[] = ['pending', 'low', 'medium', 'high', 'verified'] as const;
  const index = Math.floor(Math.random() * levels.length);
  return levels[index];
};

/**
 * Generate a random timestamp within the past 30 days
 */
const generateTimestamp = (): string => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime = new Date(
    thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())
  );
  return randomTime.toISOString();
};

/**
 * Generate mock user feedback data
 */
export const generateMockFeedback = (count: number = 15): FeedbackDataArray => {
  const mockUsernames: readonly string[] = [
    'alice_blockchain',
    'bob_crypto',
    'charlie_validator',
    'dana_consensus',
    'evan_defi',
    'fiona_token',
    'george_ledger',
    'hannah_hash',
    'ian_voting',
    'julia_node'
  ] as const;
  
  const mockFeedback: readonly string[] = [
    'The voting process was transparent and secure.',
    'I love how my vote was verified on the blockchain!',
    'The UI made voting intuitive and fast.',
    'Impressed by the security features and audit trail.',
    'Being able to verify my vote afterward gave me confidence.',
    'This platform revolutionizes democratic processes.',
    'The mobile experience was seamless.',
    'Verifiable voting is the future of elections.',
    'Much more transparent than traditional voting systems.',
    'The instant verification was impressive!'
  ] as const;

  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    username: mockUsernames[Math.floor(Math.random() * mockUsernames.length)],
    timestamp: generateTimestamp(),
    content: mockFeedback[Math.floor(Math.random() * mockFeedback.length)],
    verificationLevel: generateVerificationLevel(),
    blockchainTxId: Math.random() > 0.3 ? generateBlockchainTxId() : undefined,
    socialScore: generateSocialScore()
  }));
};
