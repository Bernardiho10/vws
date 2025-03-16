"use client";

import { FC, useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { useAccount } from "wagmi";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenTransactionComponent } from "@/components/blockchain/token-transaction";
import { VoteVerificationComponent } from "@/components/blockchain/vote-verification";
import { ElectionManagementComponent } from "@/components/blockchain/election-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnection } from "@/components/blockchain/wallet-connection";

/**
 * Possible blockchain environment types
 */
type BlockchainEnvironment = "development" | "test" | "production";

/**
 * Tab identifiers for the blockchain dashboard
 */
type BlockchainTab = "overview" | "tokens" | "verification" | "elections";

/**
 * Props for the BlockchainDashboard page
 */
interface BlockchainDashboardProps {
  readonly initialTab?: BlockchainTab;
  readonly environment?: BlockchainEnvironment;
  readonly isAdmin?: boolean;
}

/**
 * Blockchain Dashboard page component
 */
const BlockchainDashboard: NextPage<BlockchainDashboardProps> = ({
  initialTab = "overview",
  environment = "development",
  isAdmin = false, // In production, this would be based on authenticated user role
}) => {
  const [activeTab, setActiveTab] = useState<BlockchainTab>(initialTab);
  const { isConnected } = useAccount();

  /**
   * Tab configuration mapping
   */
  const tabConfig: Readonly<Record<BlockchainTab, { title: string; description: string }>> = {
    overview: {
      title: "Blockchain Overview",
      description: "Overview of VoteRight blockchain features"
    },
    tokens: {
      title: "VoteRight Tokens",
      description: "Manage your VoteRight tokens and transactions"
    },
    verification: {
      title: "Vote Verification",
      description: "Verify your votes on the blockchain"
    },
    elections: {
      title: "Elections",
      description: "Manage and view blockchain-verified elections"
    }
  } as const;

  /**
   * Render the overview content
   */
  const renderOverview = (): JSX.Element => {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>VoteRight Blockchain</CardTitle>
            <CardDescription>
              Secure and transparent voting verification powered by blockchain technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                The VoteRight blockchain integration provides transparent and immutable verification
                of votes, ensuring the integrity of elections through cryptographic proofs.
              </p>
              <h3 className="text-lg font-semibold">Key Features:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cryptographic verification of vote participation</li>
                <li>Immutable record of verified votes</li>
                <li>Reward tokens for participation</li>
                <li>Transparent election management</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect to the VoteRight blockchain with your crypto wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnection showDetails />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to use the VoteRight blockchain features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">1. Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Ethereum wallet like MetaMask or WalletConnect to interact with
                    the VoteRight blockchain.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">2. Verify Votes</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the verification tab to validate your vote participation on the blockchain,
                    creating an immutable record.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">3. Manage Tokens</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive and manage VoteRight tokens as rewards for participating in elections
                    and verifying votes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Blockchain Dashboard | VoteRight</title>
        <meta
          name="description"
          content="VoteRight blockchain dashboard for vote verification and token management"
        />
      </Head>

      <Layout>
        <div className="container py-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Blockchain Dashboard</h1>
            <p className="text-muted-foreground">
              Manage blockchain-based vote verification and tokens
            </p>
          </div>

          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as BlockchainTab)}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="verification">Vote Verification</TabsTrigger>
              <TabsTrigger value="elections">Elections</TabsTrigger>
            </TabsList>

            <div className="border-t pt-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{tabConfig[activeTab].title}</h2>
                <p className="text-muted-foreground">{tabConfig[activeTab].description}</p>
              </div>

              <TabsContent value="overview" className="space-y-4">
                {renderOverview()}
              </TabsContent>

              <TabsContent value="tokens" className="space-y-4">
                <TokenTransactionComponent environment={environment} />
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                <VoteVerificationComponent environment={environment} />
              </TabsContent>

              <TabsContent value="elections" className="space-y-4">
                <ElectionManagementComponent environment={environment} isAdmin={isAdmin} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Layout>
    </>
  );
};

export default BlockchainDashboard;
