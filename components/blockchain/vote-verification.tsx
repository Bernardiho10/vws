"use client";

import React, { FC, useState } from "react";
import { useVerificationContract } from "@/hooks/use-verification-contract";
import { useAccount } from "wagmi";
import { WalletConnection } from "./wallet-connection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { signatureService } from "@/utils/blockchain/signature-service";
import { VerificationProof, Election } from "@/types/blockchain";

/**
 * Props for VoteVerificationComponent
 */
interface VoteVerificationProps {
  readonly environment?: "development" | "test" | "production";
}

/**
 * Component for verifying votes and viewing elections
 */
export const VoteVerificationComponent: FC<VoteVerificationProps> = ({
  environment = "development",
}) => {
  const [activeTab, setActiveTab] = useState<string>("elections");
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [proofData, setProofData] = useState<string | null>(null);

  const { address } = useAccount();

  // Initialize the verification contract hook
  const {
    loading,
    activeElections,
    userVotes,
    verifyVote,
    getElections,
    hasVoted,
  } = useVerificationContract({
    address,
    environment,
    autoRefresh: true,
    refreshInterval: 15000, // Refresh every 15 seconds
  });

  /**
   * Handle vote verification
   */
  const handleVerifyVote = async (proof: VerificationProof): Promise<void> => {
    if (!address) {
      toast.error("Wallet Not Connected", {
        description: "Please connect your wallet to verify your vote"
      });
      return;
    }

    try {
      setIsVerifying(true);
      
      // Submit verification to the blockchain
      const receipt = await verifyVote(proof);
      
      if (receipt) {
        toast.success("Vote Verified", {
          description: "Your vote has been successfully verified on the blockchain"
        });
        
        // Reset selected election
        setSelectedElection(null);
        setProofData(null);
        
        // Switch to the "My Votes" tab
        setActiveTab("votes");
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Verification Failed", {
        description: "Failed to verify your vote. Please try again."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Process proof data from a QR code or verification link
   */
  const processProofData = async (data: string): Promise<void> => {
    try {
      // For demonstration, we'll assume the data is in the format:
      // election-id:voter-address:signature
      const parts = data.split(":");
      if (parts.length < 3) {
        throw new Error("Invalid verification data format");
      }
      
      const electionId = parseInt(parts[0], 10);
      const voter = parts[1];
      const signature = parts[2];
      
      // Find the election
      const election = activeElections.find(e => e.id === electionId);
      if (!election) {
        throw new Error("Election not found");
      }
      
      // Check if user has already voted
      const alreadyVoted = await hasVoted(voter, electionId);
      if (alreadyVoted) {
        throw new Error("You have already verified a vote for this election");
      }
      
      // Create proof hash
      const timestamp = Math.floor(Date.now() / 1000);
      const message = signatureService.createSignatureMessage({
        voterAddress: voter,
        electionId: electionId,
        voteTimestamp: timestamp
      });
      
      const proofHash = signatureService.createProofHash({
        voterAddress: voter,
        electionId: electionId,
        voteTimestamp: timestamp
      });
      
      // Verify signature
      const isValidSignature = await signatureService.verifySignature({
        message,
        signature,
        expectedSigner: address || ""
      });
      
      if (!isValidSignature) {
        throw new Error("Invalid signature");
      }
      
      // Create and submit proof
      const proof: VerificationProof = {
        voter: voter,
        electionId: electionId,
        proofHash,
        signature
      };
      
      await handleVerifyVote(proof);
      
    } catch (err) {
      console.error("Processing proof error:", err);
      toast.error("Verification Failed", {
        description: err instanceof Error ? err.message : "Failed to process verification data"
      });
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  /**
   * Determine if an election is active based on time
   */
  const isElectionActive = (election: Election): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return election.active && now >= election.startTime && now <= election.endTime;
  };

  /**
   * Render election status with appropriate styling
   */
  const renderElectionStatus = (election: Election): React.ReactElement => {
    if (!election.active) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Clock className="h-4 w-4" /> Ended
        </span>
      );
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    if (now < election.startTime) {
      return (
        <span className="inline-flex items-center gap-1 text-yellow-500">
          <Clock className="h-4 w-4" /> Scheduled
        </span>
      );
    }
    
    if (now > election.endTime) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Clock className="h-4 w-4" /> Ended
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 text-green-500">
        <CheckCircle2 className="h-4 w-4" /> Active
      </span>
    );
  };

  /**
   * Render elections tab content
   */
  const renderElectionsTab = (): React.ReactElement => {
    if (loading && activeElections.length === 0) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (activeElections.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Elections</AlertTitle>
          <AlertDescription>
            There are no active elections at the moment.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Verified Votes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeElections.map((election) => (
            <TableRow key={election.id}>
              <TableCell>{election.name}</TableCell>
              <TableCell>{renderElectionStatus(election)}</TableCell>
              <TableCell>{formatDate(election.startTime)}</TableCell>
              <TableCell>{formatDate(election.endTime)}</TableCell>
              <TableCell className="text-right">{election.verifiedVotes}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isElectionActive(election)}
                  onClick={() => setSelectedElection(election)}
                >
                  Verify Vote
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  /**
   * Render my votes tab content
   */
  const renderMyVotesTab = (): React.ReactElement => {
    if (loading && userVotes.length === 0) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (userVotes.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Verified Votes</AlertTitle>
          <AlertDescription>
            You have not verified any votes yet. Participate in an election and verify your vote to see it here.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Election ID</TableHead>
            <TableHead>Vote ID</TableHead>
            <TableHead>Date Verified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userVotes.map((vote) => (
            <TableRow key={vote.voteId}>
              <TableCell>{vote.electionId}</TableCell>
              <TableCell className="font-mono text-sm">
                {vote.voteId.slice(0, 10)}...{vote.voteId.slice(-6)}
              </TableCell>
              <TableCell>{formatDate(vote.timestamp)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  /**
   * Render verification form
   */
  const renderVerificationForm = (): React.ReactElement => {
    if (!selectedElection) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Election Selected</AlertTitle>
          <AlertDescription>
            Please select an election from the active elections list to verify your vote.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Election: {selectedElection.name}</AlertTitle>
          <AlertDescription>
            To verify your vote, please scan the QR code from your voting receipt or enter the verification code.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="proofInput" className="text-sm font-medium">
              Enter Verification Code
            </label>
            <div className="flex gap-2">
              <input
                id="proofInput"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter verification code"
                value={proofData || ""}
                onChange={(e) => setProofData(e.target.value)}
              />
              <Button
                disabled={!proofData || isVerifying}
                onClick={() => proofData && processProofData(proofData)}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setSelectedElection(null)}>
            Back to Elections
          </Button>
        </div>
      </div>
    );
  };

  const handleRefresh = () => {
    getElections();
  };

  return (
    <div className="space-y-8">
      <WalletConnection showCard />

      <Card>
        <CardHeader>
          <CardTitle>Vote Verification</CardTitle>
          <CardDescription>
            Verify your vote on the blockchain and view election details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedElection ? (
            renderVerificationForm()
          ) : (
            <Tabs defaultValue="elections" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="elections">Active Elections</TabsTrigger>
                <TabsTrigger value="votes">My Verified Votes</TabsTrigger>
              </TabsList>
              <TabsContent value="elections" className="pt-4">
                {renderElectionsTab()}
              </TabsContent>
              <TabsContent value="votes" className="pt-4">
                {renderMyVotesTab()}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loading || !!selectedElection}
          >
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
