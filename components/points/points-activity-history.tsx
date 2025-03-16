"use client"

import React from "react"
import { PointTransactionArray } from "@/types/points"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { POINTS_ACTIVITIES } from "@/constants/points"
import { 
  Check, 
  MessageSquare, 
  Users, 
  Camera, 
  Flame,
  Calendar
} from "lucide-react"

/**
 * Props for PointsActivityHistory component
 */
interface PointsActivityHistoryProps {
  readonly pointsHistory: PointTransactionArray;
  readonly limit?: number;
}

/**
 * Component to display user points activity history
 */
export function PointsActivityHistory({ 
  pointsHistory,
  limit = 10
}: PointsActivityHistoryProps): React.ReactElement {
  const limitedHistory = pointsHistory.slice(0, limit);

  /**
   * Get the appropriate icon for an activity
   */
  const getActivityIcon = (activityId: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      'daily-verification': <Camera className="h-4 w-4 text-primary" />,
      'streak-bonus': <Flame className="h-4 w-4 text-amber-500" />,
      'feedback-quality': <MessageSquare className="h-4 w-4 text-green-500" />,
      'referral-bonus': <Users className="h-4 w-4 text-blue-500" />
    };

    return iconMap[activityId] || <Check className="h-4 w-4" />;
  };

  /**
   * Get activity name from ID
   */
  const getActivityName = (activityId: string): string => {
    const activity = POINTS_ACTIVITIES.find(a => a.id === activityId);
    return activity ? activity.name : activityId;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limitedHistory.length > 0 ? (
            limitedHistory.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    {formatDate(transaction.timestamp)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getActivityIcon(transaction.activityId)}
                    <span className="ml-2">{getActivityName(transaction.activityId)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  +{transaction.pointsEarned}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                No activity history found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
