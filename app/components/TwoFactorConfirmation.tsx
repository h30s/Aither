"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { AlertTriangle, Shield, X } from "lucide-react";

interface TwoFactorConfirmationProps {
  title: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  amount: number;
  token: string;
  operation: string;
  onConfirm: (signature: string) => void;
  onCancel: () => void;
}

export const TwoFactorConfirmation: React.FC<TwoFactorConfirmationProps> = ({
  title,
  description,
  riskLevel,
  amount,
  token,
  operation,
  onConfirm,
  onCancel,
}) => {
  const [confirmationText, setConfirmationText] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState("");

  const expectedConfirmation = "I UNDERSTAND THE RISKS";

  const handleConfirm = async () => {
    if (confirmationText !== expectedConfirmation) {
      setError("Please type the confirmation text exactly as shown");
      return;
    }

    setIsSigning(true);
    setError("");

    try {
      // Request signature from wallet
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet connected");
      }

      const message = `Confirm ${operation}\nAmount: ${amount} ${token}\nRisk: ${riskLevel.toUpperCase()}\n\nI authorize this transaction.`;

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, accounts[0]],
      });

      onConfirm(signature);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign message");
      setIsSigning(false);
    }
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case "low":
        return "text-green-500 border-green-500";
      case "medium":
        return "text-yellow-500 border-yellow-500";
      case "high":
        return "text-orange-500 border-orange-500";
      case "critical":
        return "text-red-500 border-red-500";
      default:
        return "text-gray-500 border-gray-500";
    }
  };

  const isConfirmEnabled = confirmationText === expectedConfirmation && !isSigning;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full bg-gray-900 border-gray-700 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={isSigning}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-full bg-gray-800 ${getRiskColor()}`}>
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
        </div>

        {/* Risk Warning */}
        <div className={`border-2 rounded-lg p-4 mb-6 ${getRiskColor()}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">
                {riskLevel.toUpperCase()} RISK OPERATION
              </h3>
              <p className="text-sm opacity-90">
                You are about to perform a {riskLevel} risk operation involving{" "}
                <strong>
                  {amount} {token}
                </strong>
                . This action requires additional confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Operation Details */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">
            Operation Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Operation:</span>
              <span className="text-white font-medium">{operation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white font-medium">
                {amount} {token}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Level:</span>
              <span className={`font-medium uppercase ${getRiskColor()}`}>
                {riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Type the following to confirm:
          </label>
          <p className="text-sm text-purple-400 font-mono mb-3">
            {expectedConfirmation}
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type here..."
            disabled={isSigning}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Safety Notice */}
        <div className="bg-blue-900/20 border border-blue-600/50 p-3 rounded-lg mb-6">
          <p className="text-sm text-blue-400">
            <Shield className="w-4 h-4 inline mr-2" />
            You will be asked to sign a message with your wallet to verify your
            identity.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isSigning}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            className={`flex-1 ${
              isConfirmEnabled
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                : "bg-gray-700 cursor-not-allowed"
            }`}
          >
            {isSigning ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing...
              </div>
            ) : (
              "Confirm & Sign"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TwoFactorConfirmation;
