"use client";

import { NextPage } from "next";
import Head from "next/head";
import { useAccount } from "wagmi";
import { useBlockchain } from "@/context/blockchain-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEther } from "viem";

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

const BlockchainDashboard: NextPage<BlockchainDashboardProps> = ({
  initialTab = "overview",
  environment = "development",
  isAdmin = false
}) => {
  const { address, isConnected } = useAccount();
  const { walletState, connectWallet, disconnectWallet, formatAddress } = useBlockchain();

  // Format the address for display
  const displayAddress = formatAddress(address);

  // Format balance for display
  const formatBalance = (balance: bigint | null): string => {
    if (!balance) return "0.00";
    return formatEther(balance);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Blockchain Dashboard - VoteRight</title>
        <meta name="description" content="Blockchain dashboard for VoteRight platform" />
      </Head>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Blockchain Dashboard</h1>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Wallet Status</h2>
            <div className="flex gap-2">
              {isConnected ? (
                <Button variant="outline" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              ) : (
                <Button onClick={connectWallet}>Connect Wallet</Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{displayAddress}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {walletState.chainId ? `Chain ID: ${walletState.chainId}` : "Not connected"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>VoteRight Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">This section will show your VRG token balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">This section will show your recent blockchain transactions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDashboard;