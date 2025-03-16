"use client";

import React from "react";
import Link from "next/link";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Home, Info, Share2 } from "lucide-react";

/**
 * Header component for the application
 */
export function Header(): React.ReactElement {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">Vote With Sense</span>
          </Link>
        </div>
        
        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/" passHref>
            <Button variant="ghost" size="sm" className="gap-1">
              <Home size={16} />
              <span className="hidden md:inline">Home</span>
            </Button>
          </Link>
          
          <Link href="/about" passHref>
            <Button variant="ghost" size="sm" className="gap-1">
              <Info size={16} />
              <span className="hidden md:inline">About</span>
            </Button>
          </Link>
          
          <Link href="/share" passHref>
            <Button variant="ghost" size="sm" className="gap-1">
              <Share2 size={16} />
              <span className="hidden md:inline">Share</span>
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
            <WalletConnectButton size="sm" />
          </div>
        </nav>
      </div>
    </header>
  );
}
