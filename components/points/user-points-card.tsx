"use client"

import React from "react"
import { UserPoints } from "@/types/points"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatPoints, pointsToNextLevel } from "@/utils/points-calculator"
import { BadgeCheck, Calendar, Flame, Award } from "lucide-react"

/**
 * Props for UserPointsCard component
 */
interface UserPointsCardProps {
  readonly userData: UserPoints;
}

/**
 * Component to display user points and progress
 */
export function UserPointsCard({ userData }: UserPointsCardProps): React.ReactElement {
  const { nextLevel, pointsNeeded, progressPercentage } = pointsToNextLevel(userData);

  return (
    <Card className="w-full">
      <CardHeader className="bg-primary/5 border-b pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-primary" />
            <span>Your $VoteRight Progress</span>
          </div>
          <div className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1 rounded-full">
            Level {userData.level}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Total Points</div>
            <div className="text-2xl font-bold">{formatPoints(userData.totalPoints)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">$VoteRight Tokens</div>
            <div className="text-2xl font-bold text-primary">{formatPoints(userData.estimatedTokens)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="font-medium">Level Progress</div>
            {nextLevel ? (
              <div className="text-muted-foreground">{pointsNeeded} points to Level {nextLevel.level}</div>
            ) : (
              <div className="text-muted-foreground">Max Level Reached</div>
            )}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center">
            <Flame className="h-5 w-5 mr-2 text-amber-500" />
            <div>
              <div className="text-sm font-medium">Current Streak</div>
              <div className="text-lg font-bold">{userData.currentStreak} days</div>
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-500" />
            <div>
              <div className="text-sm font-medium">Best Streak</div>
              <div className="text-lg font-bold">{userData.longestStreak} days</div>
            </div>
          </div>
        </div>

        <div className="pt-1 border-t">
          <div className="flex items-center text-sm text-muted-foreground mt-3">
            <BadgeCheck className="h-4 w-4 mr-1 text-green-500" />
            Verify daily to increase your points and token rewards!
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
