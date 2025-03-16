"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Facebook, Twitter, Instagram, Check, Copy, Share2, Award } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CANVAS_SIZE } from "@/utils/canvas-constants"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MintBadgeButton } from "@/components/mint-badge-button"
import { useBlockchain } from "@/context/blockchain-context"
import { VerificationBadge } from "@/components/verification-badge"
import { ContentVerification } from "@/utils/blockchain/types"

interface SocialPlatform {
  readonly id: string;
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly connected: boolean;
}

const STORAGE_KEYS = {
  finalImage: "finalImage",
  caption: "caption"
} as const;

const HASHTAG = "#VoteWithSense" as const;

export function SharePageContent(): React.ReactElement {
  const router = useRouter();
  const { walletState } = useBlockchain();
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatform[]>([
    { id: "facebook", name: "Facebook", icon: <Facebook className="h-5 w-5" />, color: "bg-blue-500", connected: false },
    { id: "twitter", name: "X / Twitter", icon: <Twitter className="h-5 w-5" />, color: "bg-black", connected: false },
    { id: "instagram", name: "Instagram", icon: <Instagram className="h-5 w-5" />, color: "bg-pink-500", connected: false },
  ]);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareComplete, setShareComplete] = useState<boolean>(false);
  const [shareProgress, setShareProgress] = useState<number>(0);
  const [hashedCaption, setHashedCaption] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("social");
  const [caption, setCaption] = useState<string>("");
  const [location] = useState<string>("Nigeria");
  const [verification, setVerification] = useState<ContentVerification | null>(null);

  useEffect(() => {
    // Get the stored data using the correct storage key
    const storedImage = localStorage.getItem(STORAGE_KEYS.finalImage);
    const storedCaption = localStorage.getItem(STORAGE_KEYS.caption);

    if (!storedImage) {
      router.push("/preview");
      return;
    }

    setFinalImage(storedImage);
    
    if (storedCaption) {
      // Create hashed version of caption
      setHashedCaption(`${storedCaption} ${HASHTAG}`);
      setCaption(storedCaption);
    } else {
      setHashedCaption(HASHTAG);
    }
  }, [router]);

  const handleConnect = (platformId: string): void => {
    // Simulate connecting to a social platform
    setSocialPlatforms((platforms) =>
      platforms.map((platform) =>
        platform.id === platformId ? { ...platform, connected: !platform.connected } : platform,
      ),
    );
  };

  const handleBack = (): void => {
    router.push("/preview");
  };

  const handleShare = (): void => {
    // Check if at least one platform is connected
    const hasConnectedPlatform = socialPlatforms.some((platform) => platform.connected);

    if (!hasConnectedPlatform) {
      alert("Please connect at least one social media platform");
      return;
    }

    // Simulate sharing process
    setIsSharing(true);

    const interval = setInterval(() => {
      setShareProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSharing(false);
          setShareComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleCopyCaption = (): void => {
    navigator.clipboard.writeText(hashedCaption).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDone = (): void => {
    // Clear localStorage and redirect to home
    localStorage.clear();
    router.push("/");
  };
  
  const handleMintSuccess = (): void => {
    // Create verification object after successful minting
    setVerification({
      verified: true,
      verificationMethod: 'on-chain',
      timestamp: Date.now(),
      verifier: walletState.address || "",
      transactionHash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    });
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col min-h-screen">
      <PageHeader title="Share" step={5} totalSteps={5} onBack={handleBack} />

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Share Your Support</CardTitle>
          <CardDescription>Share your support on social media or mint it as an NFT</CardDescription>
        </CardHeader>

        <Tabs defaultValue="social" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain NFT</TabsTrigger>
          </TabsList>
          
          <TabsContent value="social" className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col items-center justify-between gap-6">
              {!shareComplete ? (
                <>
                  <div className="w-full">
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-primary mb-4 shadow-lg">
                      {finalImage && (
                        <Image
                          src={finalImage}
                          alt="Your support image"
                          width={CANVAS_SIZE.width}
                          height={CANVAS_SIZE.height}
                          className="object-contain"
                          priority
                          unoptimized
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <Badge variant="secondary" className="font-bold text-xs mb-2">{HASHTAG}</Badge>
                        {verification && (
                          <div className="mt-2">
                            <VerificationBadge verification={verification} size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-3 mb-4 relative">
                      <p className="text-sm pr-8">{hashedCaption}</p>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={handleCopyCaption}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="w-full space-y-4">
                    <h3 className="font-medium text-center">Choose platforms to share</h3>

                    <div className="space-y-3">
                      {socialPlatforms.map((platform) => (
                        <div
                          key={platform.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-4 transition-all",
                            platform.connected ? "border-primary bg-primary/5" : "border-muted"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full text-white",
                              platform.color
                            )}>
                              {platform.icon}
                            </div>
                            <span className="font-medium">{platform.name}</span>
                          </div>

                          <Button
                            variant={platform.connected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleConnect(platform.id)}
                            className="gap-1"
                          >
                            {platform.connected && <Check className="h-4 w-4" />}
                            {platform.connected ? "Connected" : "Connect"}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {isSharing && (
                      <div className="space-y-2">
                        <p className="text-sm text-center">Sharing your support...</p>
                        <Progress value={shareProgress} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Thank You!</h3>
                  <p className="text-muted-foreground">
                    Your support has been shared successfully. Together we can make a difference!
                  </p>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Support Statistics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-2xl font-bold">1,234</p>
                        <p className="text-xs text-muted-foreground">Total Supporters</p>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-2xl font-bold">42</p>
                        <p className="text-xs text-muted-foreground">From Your Location</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              {!shareComplete ? (
                <>
                  <Button variant="outline" onClick={handleBack} disabled={isSharing} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleShare} disabled={isSharing} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    {isSharing ? "Sharing..." : "Share Now"}
                  </Button>
                </>
              ) : (
                <Button onClick={handleDone} className="w-full">
                  Done
                </Button>
              )}
            </CardFooter>
          </TabsContent>
          
          <TabsContent value="blockchain" className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col gap-6">
              <div className="w-full">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-primary mb-4 shadow-lg">
                  {finalImage && (
                    <Image
                      src={finalImage}
                      alt="Your support image"
                      width={CANVAS_SIZE.width}
                      height={CANVAS_SIZE.height}
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <Badge variant="secondary" className="font-bold text-xs mb-2">{HASHTAG}</Badge>
                    {verification && (
                      <div className="mt-2">
                        <VerificationBadge verification={verification} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-center">Create an NFT Support Badge</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Mint your support badge as an NFT on the blockchain to permanently record your support and receive a unique digital collectible.
                </p>
                
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Blockchain Benefits</h4>
                  </div>
                  <ul className="text-sm space-y-2 pl-8 list-disc">
                    <li>Permanent record of your support</li>
                    <li>Verifiable ownership on the blockchain</li>
                    <li>Support transparency and accountability</li>
                    <li>Participate in community governance</li>
                  </ul>
                </div>
                
                {verification ? (
                  <div className="bg-primary/10 p-4 rounded-lg text-center space-y-3">
                    <div className="mx-auto bg-primary/20 rounded-full p-2 w-12 h-12 flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-medium">Successfully Minted!</h4>
                    <p className="text-sm text-muted-foreground">
                      Your support badge has been minted as an NFT on the blockchain.
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    {finalImage && (
                      <MintBadgeButton 
                        imageData={finalImage} 
                        caption={caption}
                        location={location}
                        onMintSuccess={handleMintSuccess}
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setActiveTab("social")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Social
              </Button>
              <Button onClick={handleDone} className="gap-2">
                Done
              </Button>
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
