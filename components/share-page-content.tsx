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
import { MintBadgeButton } from "@/components/scaffold/MintBadgeButton"
import { useWeb3 } from "@/context/web3-context"
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
  const { account } = useWeb3();
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
  const [imageHash, setImageHash] = useState<string>("");

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
      verifier: account || "",
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
                    <div className="space-y-2">
                      {socialPlatforms.map((platform) => (
                        <Button
                          key={platform.id}
                          variant={platform.connected ? "default" : "outline"}
                          className={cn("w-full justify-start gap-2", {
                            [platform.color]: platform.connected,
                          })}
                          onClick={() => handleConnect(platform.id)}
                        >
                          {platform.icon}
                          <span>{platform.name}</span>
                          {platform.connected && <Check className="h-4 w-4 ml-auto" />}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium">Share Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your support has been shared successfully
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2">
              {!shareComplete ? (
                <>
                  <Button
                    className="w-full gap-2"
                    onClick={handleShare}
                    disabled={isSharing || !socialPlatforms.some((p) => p.connected)}
                  >
                    {isSharing ? (
                      <>
                        <Progress value={shareProgress} className="w-full" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        Share Now
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={handleDone}>
                  Done
                </Button>
              )}
            </CardFooter>
          </TabsContent>

          <TabsContent value="blockchain" className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col items-center justify-between gap-6">
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
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h3 className="font-medium mb-2">NFT Badge Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Location:</strong> {location}</p>
                      <p><strong>Caption:</strong> {caption || 'No caption'}</p>
                      {verification && (
                        <div className="mt-4">
                          <VerificationBadge verification={verification} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <MintBadgeButton
                onSuccess={handleMintSuccess}
                imageHash={imageHash || undefined}
                disabled={!!verification}
              />
            </CardFooter>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
