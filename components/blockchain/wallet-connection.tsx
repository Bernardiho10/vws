"use client";

import { FC, ReactNode, useCallback, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useBlockchain } from "@/context/blockchain-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * Props for the WalletConnection component
 */
interface WalletConnectionProps {
  readonly children?: ReactNode;
  readonly showCard?: boolean;
  readonly showDetails?: boolean;
}

/**
 * Component for wallet connection and management
 */
export const WalletConnection: FC<WalletConnectionProps> = ({
  children,
  showCard = false,
  showDetails = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  const { connectWallet, disconnectWallet } = useBlockchain();
  const { address, isConnected } = useAccount();
  const { connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { chains, isPending: isNetworkSwitching, switchChain } = useSwitchChain();
  
  /**
   * Handle wallet connection
   */
  const handleConnect = useCallback(async () => {
    await connectWallet();
    setIsDialogOpen(false);
  }, [connectWallet, setIsDialogOpen]);
  
  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = useCallback(async () => {
    // Call both the context method and wagmi's disconnect
    await disconnectWallet();
    disconnect();
  }, [disconnectWallet, disconnect]);
  
  /**
   * Format address for display
   */
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  /**
   * Render content based on connection state
   */
  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to access blockchain features:
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                Connect Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Wallet</DialogTitle>
                <DialogDescription>
                  Choose a wallet to connect to the VoteRight platform.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                {connectors.map((connector) => (
                  <Button
                    key={connector.id}
                    onClick={() => handleConnect()}
                    disabled={!connector.ready}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <div className="flex items-center gap-2">
                      {connector.name === "MetaMask" ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21.9168 1L13.3212 7.89567L14.9435 3.91072L21.9168 1Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2.07898 1L10.6012 7.95844L9.0564 3.91072L2.07898 1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.721 17.1434L16.3696 21.0169L21.3516 22.491L22.8 17.1937L18.721 17.1434Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M1.20824 17.1937L2.64941 22.491L7.63139 21.0169L5.28007 17.1434L1.20824 17.1937Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7.33019 10.6432L5.93433 12.9193L10.8788 13.1641L10.6953 7.89564L7.33019 10.6432Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M16.6634 10.6432L13.2478 7.83289L13.3212 13.1641L18.2656 12.9193L16.6634 10.6432Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7.63135 21.0169L10.5575 19.4397L8.01642 17.2268L7.63135 21.0169Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13.4361 19.4397L16.3697 21.0169L15.9772 17.2268L13.4361 19.4397Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : connector.name === "WalletConnect" ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.42529 10.2958C10.1541 8.59612 12.9471 8.59612 14.6759 10.2958L15.0711 10.6834C15.193 10.8035 15.193 10.9975 15.0711 11.1176L14.054 12.1189C13.9931 12.179 13.8954 12.179 13.8344 12.1189L13.2934 11.5868C12.1725 10.4841 10.9287 10.4841 9.80778 11.5868L9.22203 12.1633C9.1611 12.2234 9.06339 12.2234 9.00246 12.1633L7.98539 11.162C7.86346 11.0419 7.86346 10.8479 7.98539 10.7278L8.42529 10.2958ZM17.2996 12.8809L18.2091 13.7752C18.331 13.8953 18.331 14.0893 18.2091 14.2094L14.2614 18.0981C14.1394 18.2182 13.9427 18.2182 13.8207 18.0981L11.0573 15.38C11.0269 15.3499 10.9775 15.3499 10.9471 15.38L8.18364 18.0981C8.06171 18.2182 7.86499 18.2182 7.74306 18.0981C7.74263 18.0977 7.74219 18.0973 7.74175 18.0969L3.79144 14.2094C3.66951 14.0893 3.66951 13.8953 3.79144 13.7752L4.70095 12.8809C4.82288 12.7608 5.0196 12.7608 5.14153 12.8809L7.9063 15.599C7.93671 15.6291 7.98605 15.6291 8.01645 15.599L10.7799 12.8809C10.9018 12.7608 11.0985 12.7608 11.2204 12.8809C11.2209 12.8813 11.2213 12.8817 11.2217 12.8821L13.9864 15.599C14.0168 15.6291 14.0662 15.6291 14.0966 15.599L16.8614 12.8809C16.9833 12.7608 17.18 12.7608 17.302 12.8809L17.2996 12.8809Z" fill="#3B99FC"/>
                        </svg>
                      ) : connector.name === "Coinbase Wallet" ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
                          <path d="M12.0002 5.40002C8.4002 5.40002 5.4002 8.40002 5.4002 12C5.4002 15.6 8.4002 18.6 12.0002 18.6C15.6002 18.6 18.6002 15.6 18.6002 12C18.6002 8.40002 15.6002 5.40002 12.0002 5.40002ZM9.6002 13.8C9.6002 14.04 9.36019 14.22 9.1802 14.22H8.4002C8.1602 14.22 8.1002 14.04 8.1002 13.8V10.2C8.1002 9.96002 8.28019 9.78002 8.4002 9.78002H9.24019C9.48019 9.78002 9.6002 9.96002 9.6002 10.2V13.8ZM15.9002 13.8C15.9002 14.04 15.6602 14.22 15.48 14.22H14.76C14.52 14.22 14.4 14.04 14.4 13.8V10.2C14.4 9.96002 14.58 9.78002 14.76 9.78002H15.54C15.78 9.78002 15.9 9.96002 15.9 10.2V13.8Z" fill="white"/>
                        </svg>
                      ) : (
                        <span className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"></span>
                      )}
                      <span>{connector.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-sm font-medium">Connected as</p>
            <p className="text-sm text-muted-foreground">{address ? formatAddress(address) : ""}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
        
        {showDetails && (
          <div className="mt-2">
            <p className="text-sm">Network: <span className="font-medium">{chainId}</span></p>
            {chains.length > 0 && (
              <div className="mt-2">
                <p className="text-sm mb-2">Switch Network:</p>
                <div className="flex flex-wrap gap-2">
                  {chains.map((c: { id: number; name: string }) => (
                    <Button
                      key={c.id}
                      variant={c.id === chainId ? "default" : "outline"}
                      size="sm"
                      disabled={isNetworkSwitching || c.id === chainId}
                      onClick={() => switchChain?.({ chainId: c.id })}
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {children}
      </div>
    );
  };
  
  // If showCard is true, wrap content in a Card component
  if (showCard) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>
            Connect your wallet to access blockchain features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        {isConnected && children && (
          <CardFooter className="flex flex-col items-start">
            {children}
          </CardFooter>
        )}
      </Card>
    );
  }
  
  // Otherwise, just render the content
  return renderContent();
};
