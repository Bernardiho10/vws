"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, LogOut, Copy } from "lucide-react";
import { useBlockchain } from "@/context/blockchain-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Props for the WalletConnectButton component
 */
interface WalletConnectButtonProps {
  readonly variant?: "default" | "outline" | "secondary";
  readonly size?: "default" | "sm" | "lg";
}

/**
 * Button component for connecting to a blockchain wallet
 */
export function WalletConnectButton({
  variant = "default",
  size = "default",
}: WalletConnectButtonProps): React.ReactElement {
  const { walletState, connectWallet, disconnectWallet, formatAddress } = useBlockchain();
  const { isConnected, address, isConnecting } = walletState;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Copy wallet address to clipboard
   */
  const copyAddress = (): void => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className="gap-2">
            <Wallet size={16} /> Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect your wallet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={() => { connectWallet(); setOpen(false); }} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect with MetaMask"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Wallet size={16} /> {formatAddress(address)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wallet Connected</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between gap-4 rounded-md border p-4">
            <div className="truncate font-medium">{address}</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={copyAddress}
                  >
                    <Copy size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? "Copied!" : "Copy Address"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={disconnectWallet}
          >
            <LogOut size={16} /> Disconnect Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
