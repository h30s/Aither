"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface NetworkDetails {
  name: string;
  rpcUrl: string;
  chainId: string;
  currencySymbol: string;
  explorerUrl: string;
}

export const AddSomniaNetworkGuide = ({ onClose }: { onClose?: () => void }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const networkDetails: NetworkDetails = {
    name: "Somnia Testnet (Shannon)",
    rpcUrl: "https://testnet.somnia.network",
    chainId: "2323",
    currencySymbol: "STT",
    explorerUrl: "https://explorer.testnet.somnia.network",
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
      <div className="flex-1 mr-3">
        <p className="text-xs text-zinc-400 mb-1">{label}</p>
        <p className="text-sm text-zinc-200 font-mono break-all">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(value, label)}
        className="flex-shrink-0"
      >
        <Copy className="h-4 w-4" />
        {copied === label && <span className="ml-2 text-xs">Copied!</span>}
      </Button>
    </div>
  );

  return (
    <Card className="w-full bg-zinc-900 border-zinc-800 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-xl">Add Somnia Testnet Manually</CardTitle>
        <CardDescription className="text-zinc-400">
          Follow these steps to add Somnia network to MetaMask
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <DetailRow label="Network Name" value={networkDetails.name} />
          <DetailRow label="RPC URL" value={networkDetails.rpcUrl} />
          <DetailRow label="Chain ID" value={networkDetails.chainId} />
          <DetailRow label="Currency Symbol" value={networkDetails.currencySymbol} />
          <DetailRow label="Block Explorer URL" value={networkDetails.explorerUrl} />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-blue-400">Manual Steps:</h4>
          <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
            <li>Open MetaMask and click the network dropdown at the top</li>
            <li>Click "Add Network" or "Add a network manually"</li>
            <li>Copy and paste the values above into the respective fields</li>
            <li>Click "Save" to add the network</li>
            <li>MetaMask will automatically switch to Somnia Testnet</li>
          </ol>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
          <p className="text-xs text-red-200">
            ⚠️ <strong>Important:</strong> The current RPC URL may not be correct. 
            The URL <code>https://testnet.somnia.network</code> appears to be the website, not the RPC endpoint.
          </p>
          <p className="text-xs text-red-200">
            Please check the official Somnia documentation or Discord for the correct RPC URL.
            Common patterns are: <code>https://rpc.testnet.somnia.network</code> or <code>https://testnet-rpc.somnia.network</code>
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-xs text-yellow-200">
            ⚠️ <strong>Note:</strong> The warnings you see are normal for custom networks. 
            MetaMask doesn't have Somnia in its default list yet, so it shows security warnings.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open("https://testnet.somnia.network", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Somnia Testnet
          </Button>
          {onClose && (
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
