"use client";

import React, { FC, useState } from "react";
import { useVerificationContract } from "@/hooks/use-verification-contract";
import { useAccount } from "wagmi";
import { WalletConnection } from "./wallet-connection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle2, Clock, InfoIcon, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BlockchainErrorType, Election } from "@/types/blockchain";

/**
 * Props for ElectionManagementComponent
 */
interface ElectionManagementProps {
  readonly environment?: "development" | "test" | "production";
  readonly isAdmin?: boolean;
}

/**
 * Component for creating and managing elections
 */
export const ElectionManagementComponent: FC<ElectionManagementProps> = ({
  environment = "development",
  isAdmin = false, // In a real app, this would be determined by the user's role
}) => {
  // State for create election form
  const [electionName, setElectionName] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to one week from now
  );
  const [electionData, setElectionData] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("active");
  
  const { address } = useAccount();
  
  // Initialize the verification contract hook
  const {
    loading,
    error,
    activeElections,
    createElection,
    endElection,
    getElections,
    createProofHash,
  } = useVerificationContract({
    address,
    environment,
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });
  
  /**
   * Handle election creation
   */
  const handleCreateElection = async (): Promise<void> => {
    if (!address || !electionName || !startDate || !endDate || !electionData) {
      toast.error("Invalid Input", {
        description: "Please fill in all required fields"
      });
      return;
    }
    
    // Validate dates
    if (startDate >= endDate) {
      toast.error("Invalid Dates", {
        description: "End date must be after start date"
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Create a hash of the election data
      const electionDataObj = {
        voterAddress: address,
        electionId: 0, // Temporary ID, will be assigned by contract
        voteTimestamp: Math.floor(Date.now() / 1000),
        verificationImageHash: electionData,
      };
      
      // Convert object to JSON string for createProofHash
      const dataHash = createProofHash(JSON.stringify(electionDataObj));
      
      // Create the election
      const receipt = await createElection(
        electionName,
        Math.floor(startDate.getTime() / 1000),
        Math.floor(endDate.getTime() / 1000),
        dataHash
      );
      
      if (receipt) {
        toast.success("Election Created", {
          description: `Successfully created election: ${electionName}`
        });
        
        // Reset form
        setElectionName("");
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setElectionData("");
        
        // Refresh elections
        await getElections(true);
        
        // Switch to active elections tab
        setActiveTab("active");
      }
    } catch (err) {
      console.error("Election creation error:", err);
      
      let errorMessage = "Failed to create election";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast.error("Election Creation Failed", {
        description: errorMessage
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  /**
   * Handle ending an election
   */
  const handleEndElection = async (electionId: number): Promise<void> => {
    if (!address) {
      return;
    }
    
    try {
      setIsEnding(true);
      
      // End the election
      const receipt = await endElection(electionId);
      
      if (receipt) {
        toast.success("Election Ended", {
          description: "Successfully ended the election"
        });
        
        // Refresh elections
        await getElections(true);
      }
    } catch (err) {
      console.error("End election error:", err);
      
      let errorMessage = "Failed to end election";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast.error("Failed to End Election", {
        description: errorMessage
      });
    } finally {
      setIsEnding(false);
    }
  };
  
  /**
   * Format date for display
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  /**
   * Determine if an election can be ended
   */
  const canEndElection = (election: Election): boolean => {
    if (!election.active) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return now >= election.startTime;
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
   * Get all elections, including inactive ones
   */
  const getAllElections = async (): Promise<void> => {
    await getElections(true);
  };
  
  /**
   * Render elections list
   */
  const renderElectionsList = (showInactive: boolean): React.ReactElement => {
    // Filter elections based on active status
    const filteredElections = activeElections.filter(
      (election) => showInactive || election.active
    );
    
    if (loading && filteredElections.length === 0) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }
    
    if (filteredElections.length === 0) {
      return (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>No Elections Found</AlertTitle>
          <AlertDescription>
            {showInactive
              ? "There are no inactive elections in the system."
              : "There are no active elections at the moment."}
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Verified Votes</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredElections.map((election) => (
            <TableRow key={election.id}>
              <TableCell>{election.id}</TableCell>
              <TableCell>{election.name}</TableCell>
              <TableCell>{renderElectionStatus(election)}</TableCell>
              <TableCell>{formatDate(election.startTime)}</TableCell>
              <TableCell>{formatDate(election.endTime)}</TableCell>
              <TableCell className="text-right">{election.verifiedVotes}</TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  {election.active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!canEndElection(election) || isEnding}
                      onClick={() => handleEndElection(election.id)}
                    >
                      End Election
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  /**
   * Render create election form
   */
  const renderCreateElectionForm = (): React.ReactElement => {
    if (!isAdmin) {
      return (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Administrator Access Required</AlertTitle>
          <AlertDescription>
            You need administrator permissions to create new elections.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (error && error.type === BlockchainErrorType.WalletNotConnected) {
      return (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to create elections.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="electionName">Election Name</Label>
          <Input
            id="electionName"
            placeholder="Enter election name"
            value={electionName}
            onChange={(e) => setElectionName(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="electionData">Election Data (JSON)</Label>
          <textarea
            id="electionData"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter election data as JSON"
            value={electionData}
            onChange={(e) => setElectionData(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter election details in JSON format. This data will be hashed and stored on the blockchain.
          </p>
        </div>
        
        <Button 
          onClick={handleCreateElection} 
          disabled={isCreating || !electionName || !startDate || !endDate || !electionData}
        >
          {isCreating ? "Creating..." : "Create Election"}
        </Button>
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <WalletConnection showCard />
      
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Election</CardTitle>
            <CardDescription>
              Create a new election for voters to participate in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCreateElectionForm()}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Elections</CardTitle>
          <CardDescription>
            View and manage all elections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Elections</TabsTrigger>
              <TabsTrigger value="inactive">Inactive Elections</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="pt-4">
              {renderElectionsList(false)}
            </TabsContent>
            <TabsContent value="inactive" className="pt-4">
              {renderElectionsList(true)}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={getAllElections} 
            disabled={loading}
          >
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
