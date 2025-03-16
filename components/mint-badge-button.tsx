"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBlockchain } from "@/context/blockchain-context";
import { 
  SupportBadge 
} from "@/utils/blockchain/types";
import { 
  createSupportBadge, 
  mintNFT 
} from "@/utils/blockchain/nft-utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { Check, CheckCircle, Medal, Loader2 } from "lucide-react";

/**
 * Props for MintBadgeButton component
 */
interface MintBadgeButtonProps {
  readonly imageData: string;
  readonly variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  readonly size?: "default" | "sm" | "lg" | "icon";
  readonly onMintSuccess?: () => void;
}

/**
 * Button component for minting an NFT badge
 */
export function MintBadgeButton({
  imageData,
  variant = "default",
  size = "default",
  onMintSuccess,
}: MintBadgeButtonProps): React.ReactElement {
  const { walletState, connectWallet } = useBlockchain();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [mintingStep, setMintingStep] = useState<number>(0);
  const [badge, setBadge] = useState<SupportBadge | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  /**
   * Start the minting process
   */
  const handleStartMint = async (): Promise<void> => {
    if (!walletState.isConnected) {
      await connectWallet();
      return;
    }

    setIsDialogOpen(true);
    setMintingStep(1);
    setIsProcessing(true);

    try {
      // Create a new badge
      const newBadge = createSupportBadge(imageData, walletState.address || "");
      
      setBadge(newBadge);

      // Simulate preparing metadata
      await simulateProgress(0, 40);
      setMintingStep(2);

      // Simulate uploading to IPFS
      await simulateProgress(40, 70);
      setMintingStep(3);

      // Mint the NFT
      if (walletState.address) {
        const mintedBadge = await mintNFT(newBadge, walletState.address);
        setBadge(mintedBadge);
        await simulateProgress(70, 100);
        setMintingStep(4);
        
        // Call onMintSuccess callback if provided
        if (onMintSuccess) {
          onMintSuccess();
        }
      }
    } catch (error) {
      console.error("Minting error:", error);
      setMintingStep(-1); // Error state
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Helper to simulate progress
   */
  const simulateProgress = async (from: number, to: number): Promise<void> => {
    return new Promise((resolve) => {
      const duration = 1500;
      const steps = 20;
      const increment = (to - from) / steps;
      const stepTime = duration / steps;
      
      let current = from;
      const interval = setInterval(() => {
        current += increment;
        if (current >= to) {
          setProgress(to);
          clearInterval(interval);
          resolve();
        } else {
          setProgress(current);
        }
      }, stepTime);
    });
  };

  /**
   * Reset the dialog state
   */
  const handleClose = (): void => {
    if (!isProcessing) {
      setIsDialogOpen(false);
      // Only reset progress and step if not in success state
      if (mintingStep !== 4) {
        setProgress(0);
        setMintingStep(0);
      }
    }
  };

  /**
   * Render the appropriate step content
   */
  const renderStepContent = (): React.ReactElement => {
    // Error state
    if (mintingStep === -1) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="bg-red-100 text-red-600 rounded-full p-4 mb-4">
            <Medal className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-lg mb-2">Minting Failed</h3>
          <p className="text-muted-foreground mb-4">
            There was an error while minting your support badge. Please try again later.
          </p>
          <Button onClick={handleClose}>Close</Button>
        </div>
      );
    }

    // Success state
    if (mintingStep === 4 && badge?.mintStatus === "minted") {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="bg-green-100 text-green-600 rounded-full p-4 mb-4">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-lg mb-2">Minting Successful!</h3>
          <p className="text-muted-foreground mb-4">
            Your support badge has been minted as an NFT on the blockchain.
          </p>
          <div className="bg-muted rounded-lg p-3 mb-4 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Token ID</span>
              <Badge variant="outline">{badge.tokenId}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network</span>
              <Badge variant="outline">Polygon Mumbai</Badge>
            </div>
          </div>
          <Button onClick={handleClose} className="w-full">Close</Button>
        </div>
      );
    }

    // Processing state
    return (
      <div className="flex flex-col">
        <div className="relative rounded-lg overflow-hidden mb-6 border">
          {imageData && (
            <Image
              src={imageData}
              alt="Your support badge"
              width={300}
              height={300}
              className="w-full h-auto"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge className="bg-primary/80 backdrop-blur-sm text-white px-4 py-2">
              Support Badge NFT
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          <Progress value={progress} className="h-2" />

          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 
                ${mintingStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {mintingStep > 1 ? <Check className="h-5 w-5" /> : "1"}
              </div>
              <div className="flex-1">
                <p className="font-medium">Preparing Support Badge</p>
                <p className="text-sm text-muted-foreground">Creating your badge metadata</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 
                ${mintingStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {mintingStep > 2 ? <Check className="h-5 w-5" /> : "2"}
              </div>
              <div className="flex-1">
                <p className="font-medium">Uploading to IPFS</p>
                <p className="text-sm text-muted-foreground">Storing your badge permanently</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 
                ${mintingStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {mintingStep > 3 ? <Check className="h-5 w-5" /> : "3"}
              </div>
              <div className="flex-1">
                <p className="font-medium">Minting NFT</p>
                <p className="text-sm text-muted-foreground">Recording on blockchain</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleStartMint}
        className="gap-2"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Medal className="h-4 w-4" />
        )}
        Mint Support Badge
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mintingStep === 4 ? "Support Badge Minted!" : "Minting Support Badge"}
            </DialogTitle>
            <DialogDescription>
              {mintingStep === 4 
                ? "Your support has been permanently recorded on the blockchain." 
                : "Creating a permanent record of your support on the blockchain."}
            </DialogDescription>
          </DialogHeader>
          
          {renderStepContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
