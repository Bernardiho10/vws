"use client"

import React, { useMemo } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { UserPointsArray, UserPoints } from "@/types/points"
import { formatPoints } from "@/utils/points-calculator"
import { Badge } from "@/components/ui/badge"
import { Award, Flame, Trophy } from "lucide-react"

/**
 * Props for PointsLeaderboard component
 */
interface PointsLeaderboardProps {
  readonly usersData: UserPointsArray;
  readonly currentUsername: string;
}

/**
 * Points leaderboard component
 */
export function PointsLeaderboard({ 
  usersData, 
  currentUsername 
}: PointsLeaderboardProps): React.ReactElement {
  // Sort users by total points (highest first)
  const sortedUsers = useMemo(() => {
    const sorted = [...usersData].sort((a: UserPoints, b: UserPoints) => b.totalPoints - a.totalPoints);
    
    // Move current user to top if they exist in the data
    const currentUserIndex = sorted.findIndex(user => user.username === currentUsername);
    
    if (currentUserIndex > 0) {
      const currentUser = sorted[currentUserIndex];
      sorted.splice(currentUserIndex, 1);
      sorted.unshift(currentUser);
    }
    
    return sorted;
  }, [usersData, currentUsername]);
  
  // Get original rank for a user in the leaderboard
  const getUserRank = (username: string): number => {
    return [...usersData]
      .sort((a: UserPoints, b: UserPoints) => b.totalPoints - a.totalPoints)
      .findIndex(user => user.username === username) + 1;
  };
  
  // Trophy colors for top 3 positions
  const trophyColors: readonly string[] = ["text-yellow-500", "text-gray-400", "text-amber-600"] as const;
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="w-[100px]">Points</TableHead>
            <TableHead className="w-[100px]">Tokens</TableHead>
            <TableHead className="w-[80px]">Streak</TableHead>
            <TableHead className="w-[80px]">Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => {
            const isCurrentUser = user.username === currentUsername;
            const originalRank = getUserRank(user.username);
            
            return (
              <TableRow 
                key={user.userId}
                className={isCurrentUser ? "bg-primary/5 font-medium" : ""}
              >
                <TableCell className="font-medium">
                  {isCurrentUser && originalRank > 3 ? (
                    <Badge variant="outline" className="ml-1">
                      {originalRank}
                    </Badge>
                  ) : originalRank <= 3 ? (
                    <Trophy className={`h-4 w-4 ${trophyColors[originalRank - 1]}`} />
                  ) : (
                    originalRank
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {isCurrentUser && (
                      <Badge variant="secondary" className="mr-2 px-1.5">You</Badge>
                    )}
                    {user.username}
                  </div>
                </TableCell>
                <TableCell>{formatPoints(user.totalPoints)}</TableCell>
                <TableCell className="text-primary font-medium">
                  {formatPoints(user.estimatedTokens)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Flame className={`h-3.5 w-3.5 mr-1 ${
                      user.currentStreak > 7 ? "text-red-500" : 
                      user.currentStreak > 3 ? "text-amber-500" : 
                      "text-gray-400"
                    }`} />
                    {user.currentStreak}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Award className="h-3.5 w-3.5 mr-1 text-primary" />
                    {user.level}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
