"use client";

import React from "react";
import { Switch } from "./ui/switch";
import { Info, Zap } from "lucide-react";

interface DryRunToggleProps {
  isDryRun: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export const DryRunToggle: React.FC<DryRunToggleProps> = ({
  isDryRun,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-700 bg-gray-900 rounded-lg">
      <div className="flex items-center gap-3">
        {isDryRun ? (
          <Info className="w-5 h-5 text-blue-400" />
        ) : (
          <Zap className="w-5 h-5 text-purple-400" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {isDryRun ? "Simulation Mode" : "Live Execution"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isDryRun
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-purple-900/50 text-purple-300"
              }`}
            >
              {isDryRun ? "SAFE" : "LIVE"}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {isDryRun
              ? "Transactions will be simulated without execution"
              : "Transactions will be executed on Somnia Testnet"}
          </p>
        </div>
      </div>
      <Switch
        checked={!isDryRun}
        onCheckedChange={(checked) => onToggle(!checked)}
        disabled={disabled}
      />
    </div>
  );
};

export default DryRunToggle;
