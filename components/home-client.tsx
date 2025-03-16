"use client"

import React, { useEffect, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { FeedbackVerificationTable } from "@/components/feedback-verification-table"
import { generateMockFeedback } from "@/utils/mock-data"
import { FeedbackDataArray } from "@/types/feedback"
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3,
  Users,
  CheckCircle,
  Shield,
  ActivitySquare,
  ArrowUpRight
} from "lucide-react"

/**
 * Dashboard statistics type
 */
interface DashboardStat {
  readonly title: string;
  readonly value: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly change?: {
    readonly value: string;
    readonly trend: 'up' | 'down' | 'neutral';
  };
}

/**
 * Dashboard statistics array type
 */
type DashboardStatsArray = readonly DashboardStat[];

/**
 * Client-side dashboard component
 */
export function Dashboard(): React.ReactElement | null {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Generate mock feedback data
  const feedbackData: FeedbackDataArray = useMemo(() => 
    generateMockFeedback(10), 
  []);

  // Mock statistics data
  const dashboardStats: DashboardStatsArray = useMemo(() => [
    {
      title: "Total Votes",
      value: "3,842",
      description: "Total votes submitted",
      icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      change: {
        value: "+12.5%",
        trend: "up",
      },
    },
    {
      title: "Verified Users",
      value: "1,240",
      description: "Users with verified feedback",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      change: {
        value: "+4.3%",
        trend: "up",
      },
    },
    {
      title: "Active Campaigns",
      value: "12",
      description: "Currently running campaigns",
      icon: <ActivitySquare className="h-4 w-4 text-muted-foreground" />,
      change: {
        value: "0%",
        trend: "neutral",
      },
    },
    {
      title: "Security Score",
      value: "87/100",
      description: "Overall system security rating",
      icon: <Shield className="h-4 w-4 text-muted-foreground" />,
      change: {
        value: "+2.4%",
        trend: "up",
      },
    },
  ] as const, []);

  // Display loading or redirect if no user
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user}</h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your Vote With Sense dashboard
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Live System
        </Badge>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              {stat.change && (
                <div className={`flex items-center text-xs mt-1 ${
                  stat.change.trend === 'up' 
                    ? 'text-green-500' 
                    : stat.change.trend === 'down'
                      ? 'text-red-500'
                      : 'text-gray-500'
                }`}>
                  {stat.change.trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                  {stat.change.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed interface */}
      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="verification">Verification Feed</TabsTrigger>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="verification">
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Feedback Verification</h2>
              <p className="text-sm text-muted-foreground">
                Review and verify user feedback from all channels
              </p>
            </div>
            <FeedbackVerificationTable data={feedbackData} />
          </div>
        </TabsContent>
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>
                Manage your current voting campaigns and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Campaign data will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Track performance metrics and voting patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Analytics data will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
