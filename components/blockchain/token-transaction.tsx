"use client";

import React, { FC, useState } from "react";
import { useTokenContract } from "@/hooks/use-token-contract";
import { useAccount } from "wagmi";
import { WalletConnection } from "./wallet-connection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { BlockchainErrorType, TokenTransaction } from "@/types/blockchain";

/**
 * Props for TokenTransactionComponent
 */
interface TokenTransactionProps {
  readonly environment?: "development" | "test" | "production";
}

/**
 * Component for viewing token balance and making transactions
 */
export const TokenTransactionComponent: FC<TokenTransactionProps> = ({
  environment = "development"
}) => {
  // State for transfer form
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { address } = useAccount();
  
  // Initialize the token contract hook
  const { 
    loading, 
    error, 
    balance, 
    transactions, 
    transferToken,
    refreshBalance
  } = useTokenContract({
    address,
    environment,
    autoRefresh: true,
    refreshInterval: 15000 // Refresh every 15 seconds
  });

  /**
   * Handle token transfer
   */
  const handleTransfer = async (): Promise<void> => {
    if (!address || !recipientAddress || !amount) {
      toast.error("Invalid Input", {
        description: "Please fill in all required fields"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const receipt = await transferToken(recipientAddress, amount);
      
      if (receipt) {
        toast.success("Transfer Successful", {
          description: `Successfully transferred ${amount} VRT to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
        });
        
        // Reset form
        setRecipientAddress("");
        setAmount("");
        
        // Refresh balance
        await refreshBalance();
      }
    } catch (err) {
      console.error("Transfer error:", err);
      toast.error("Transfer Failed", {
        description: "Failed to transfer tokens. Please try again.",
        action: {
          label: "Try again",
          onClick: () => {}
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  /**
   * Check if an address is the current user
   */
  const isCurrentUser = (checkAddress: string): boolean => {
    return address?.toLowerCase() === checkAddress.toLowerCase();
  };

  /**
   * Format address for display
   */
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  /**
   * Render transaction type with appropriate styling
   */
  const renderTransactionType = (tx: TokenTransaction): React.ReactElement => {
    if (isCurrentUser(tx.from)) {
      return <span className="text-red-500">Sent</span>;
    } else {
      return <span className="text-green-500">Received</span>;
    }
  };

  /**
   * Render balance section
   */
  const renderBalance = (): React.ReactElement => {
    if (loading && !balance) {
      return (
        <div className="flex flex-col gap-2 pb-4">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-6 w-[200px]" />
        </div>
      );
    }

    if (error) {
      let errorMessage = "Failed to load balance";
      if (error.type === BlockchainErrorType.WalletNotConnected) {
        errorMessage = "Please connect your wallet";
      } else if (error.details) {
        errorMessage = error.details;
      }

      return (
        <div className="text-destructive py-2">
          <p>{errorMessage}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={refreshBalance}
          >
            Retry
          </Button>
        </div>
      );
    }

    return (
      <div className="py-2">
        <h3 className="text-2xl font-bold">
          {balance?.formattedBalance || "0"} <span className="text-base font-normal">VRT</span>
        </h3>
        <p className="text-sm text-muted-foreground">VoteRight Token Balance</p>
      </div>
    );
  };

  /**
   * Render transaction form
   */
  const renderTransferForm = (): React.ReactElement => {
    return (
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button 
          onClick={handleTransfer} 
          disabled={isSubmitting || !amount || !recipientAddress}
        >
          {isSubmitting ? "Processing..." : "Transfer Tokens"}
        </Button>
      </div>
    );
  };

  /**
   * Render transaction history
   */
  const renderTransactionHistory = (): React.ReactElement => {
    if (loading && transactions.length === 0) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="py-4 text-center text-muted-foreground">
          No transactions found
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.txHash}>
              <TableCell>{renderTransactionType(tx)}</TableCell>
              <TableCell>
                {isCurrentUser(tx.from) 
                  ? formatAddress(tx.to) 
                  : formatAddress(tx.from)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {tx.amount} VRT
              </TableCell>
              <TableCell className="text-right">
                {formatDate(tx.timestamp)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-8">
      <WalletConnection showCard>
        <div className="w-full">
          <div className="border-t pt-4 mt-4">
            {renderBalance()}
          </div>
        </div>
      </WalletConnection>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Tokens</CardTitle>
          <CardDescription>
            Send VoteRight tokens to another address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderTransferForm()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent token transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderTransactionHistory()}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={refreshBalance} 
            disabled={loading}
          >
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
