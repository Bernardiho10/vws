"use client";

import React from "react";
import Link from "next/link";
import { WalletConnection } from "@/components/scaffold/WalletConnection";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
import { Home, Share2, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

/**
 * Header component for the application
 */
export function Header(): React.ReactElement {
  const { authState, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/share">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSelector />
          <WalletConnection />
        </div>
      </div>
    </header>
  );
}
