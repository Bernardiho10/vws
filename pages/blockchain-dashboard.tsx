"use client";

import React from "react";
import { useWeb3 } from "@/context/web3-context";
import { ContractInteraction } from "@/components/scaffold/ContractInteraction";
import { TransactionManager } from "@/components/scaffold/TransactionManager";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";

// Example ABI - replace with your contract's ABI
const EXAMPLE_ABI = [
  {
    "inputs": [],
    "name": "getValue",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_value", "type": "uint256"}],
    "name": "setValue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function BlockchainDashboard() {
  const { account } = useWeb3();
  const { logout } = useAuth();

  // Example contract address - replace with your contract's address
  const contractAddress = "0x1234567890123456789012345678901234567890";

  if (!account) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Blockchain Dashboard</h1>
        <p>Please connect your wallet to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Blockchain Dashboard</h1>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Contract Interaction</h2>
          <ContractInteraction 
            contractAddress={contractAddress}
            contractABI={EXAMPLE_ABI}
          />
        </div>
        <div className="p-4 border rounded-lg">
          <TransactionManager />
        </div>
      </div>
    </div>
  );
}