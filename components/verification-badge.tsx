"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContentVerification } from "@/utils/blockchain/types";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

/**
 * Props for the VerificationBadge component
 */
interface VerificationBadgeProps {
  readonly verification: ContentVerification | null;
  readonly showTooltip?: boolean;
  readonly size?: "sm" | "default" | "lg";
}

/**
 * A badge component that displays the verification status of content
 */
export function VerificationBadge({
  verification,
  showTooltip = true,
  size = "default",
}: VerificationBadgeProps): React.ReactElement {
  if (!verification) {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Clock className="h-3 w-3" />
        Not Verified
      </Badge>
    );
  }

  const sizeClasses = {
    sm: "text-[10px] py-0 px-2",
    default: "text-xs py-1 px-2",
    lg: "text-sm py-1 px-3",
  };

  const iconSize = {
    sm: 2,
    default: 3,
    lg: 4,
  };

  const getDateString = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (verification.verified) {
    const badge = (
      <Badge 
        variant="secondary" 
        className={`gap-1 bg-green-500 hover:bg-green-600 ${sizeClasses[size]}`}
      >
        <CheckCircle2 className={`h-${iconSize[size]} w-${iconSize[size]}`} />
        Verified on VoteChain
      </Badge>
    );

    if (!showTooltip) return badge;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-semibold">Blockchain Verified</p>
              <p>Verified on {verification.verificationMethod === 'on-chain' ? 'Polygon' : 'Signature'}</p>
              <p>Date: {getDateString(verification.timestamp)}</p>
              {verification.transactionHash && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  TX: {verification.transactionHash.slice(0, 6)}...{verification.transactionHash.slice(-4)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="outline" className={`gap-1 ${sizeClasses[size]}`}>
      <AlertCircle className={`h-${iconSize[size]} w-${iconSize[size]}`} />
      Unverified
    </Badge>
  );
}
