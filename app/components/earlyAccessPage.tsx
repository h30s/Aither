"use client";

import React, { useCallback, useEffect, useState } from "react";
import { connectToWallet } from "@/wallet/walletConnection";
import { ToastContainer, toast } from "react-toastify";

import { Loader2, Wallet as WalletIcon } from "lucide-react";
import { crateInjectiveIfNotExists } from "../services/userMessage";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AddSomniaNetworkGuide } from "./AddSomniaNetworkGuide";

interface EarlyAccessPageProps {
  injectiveAddress: string | null;
  setInjectiveAddress: (address: string | null) => void;
  isWhitelisted: boolean;
  setIsWhitelisted: (isWL: boolean) => void;
}

const EarlyAccessPage = ({
  injectiveAddress: walletAddress,
  setInjectiveAddress: setWalletAddress,
  isWhitelisted,
  setIsWhitelisted,
}: EarlyAccessPageProps) => {
  const [referralCode, setReferralCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showNetworkGuide, setShowNetworkGuide] = useState<boolean>(false);

  const checkIsWhitelisted = useCallback(async () => {
    try {
      setIsLoading(true);
      // Check whitelist via API for Somnia
      const response = await fetch("/api/whitelist/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      });
      const data = await response.json();
      setIsWhitelisted(data.isWhitelisted || false);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setIsWhitelisted(false);
      console.error("Error checking whitelist:", error);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      checkIsWhitelisted();
    }
  }, [walletAddress, checkIsWhitelisted]);

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      const { address, token } = await connectToWallet();

      if (address) {
        setWalletAddress(address);
        setShowNetworkGuide(false);
        toast.success("Wallet Connected!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        // Show network guide if connection failed
        setShowNetworkGuide(true);
      }
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setShowNetworkGuide(true);
      toast.error("Connection issue. Please try adding the network manually.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const joinEAP = async (ref_code: string) => {
    try {
      setIsLoading(true);
      if (walletAddress) {
        // Join whitelist via API for Somnia
        const response = await fetch("/api/whitelist/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: walletAddress, ref_code }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.removeItem("token");
          await crateInjectiveIfNotExists(walletAddress);
          setWalletAddress(null);
          toast.success("Successfully joined! Please connect your wallet again.", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        } else {
          throw new Error(result.error || "Failed to join whitelist");
        }
      }
    } catch (error) {
      toast.error(`❌ ${error instanceof Error ? error.message : "Something went wrong!"}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      console.error("Error joining EAP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <ToastContainer />
      {showNetworkGuide ? (
        <div className="w-full max-w-2xl">
          <AddSomniaNetworkGuide onClose={() => setShowNetworkGuide(false)} />
        </div>
      ) : (
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 ">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-600 bg-clip-text text-transparent">
            Welcome to Aither
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Connect your wallet to get started
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="w-full border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 bg-transparent "
                onClick={handleConnectWallet}
              >
                <WalletIcon className="mr-2 h-4 w-4" />
                Connect with MetaMask
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default EarlyAccessPage;
