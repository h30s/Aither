"use client";

import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, CheckCircle, Info, TrendingUp, Zap } from "lucide-react";
import { SimulationResult } from "@/ai/agents/base";

interface TransactionPreviewCardProps {
  title: string;
  description: string;
  simulation: SimulationResult;
  isDryRun: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export const TransactionPreviewCard: React.FC<TransactionPreviewCardProps> = ({
  title,
  description,
  simulation,
  isDryRun,
  onConfirm,
  onCancel,
  isExecuting = false,
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-orange-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getRiskIcon = (risk: string) => {
    if (risk === "low") return <CheckCircle className="w-5 h-5" />;
    if (risk === "critical" || risk === "high") return <AlertTriangle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const formatGas = (gas: number) => {
    if (gas > 1000000) return `${(gas / 1000000).toFixed(2)}M`;
    if (gas > 1000) return `${(gas / 1000).toFixed(1)}K`;
    return gas.toString();
  };

  const formatValue = (value: number) => {
    if (value > 1000) return `${(value / 1000).toFixed(2)}K STT`;
    return `${value.toFixed(4)} STT`;
  };

  return (
    <Card className="p-6 border border-gray-700 bg-gray-900 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <div className={`flex items-center gap-2 ${getRiskColor(simulation.risk)}`}>
          {getRiskIcon(simulation.risk)}
          <span className="text-sm font-semibold uppercase">{simulation.risk} Risk</span>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="space-y-4 mb-6">
        {/* What */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            What will happen
          </h4>
          <p className="text-white">{simulation.justification}</p>
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-300">Gas Estimate</span>
            </div>
            <p className="text-xl font-bold text-white">{formatGas(simulation.gasEstimate)}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-gray-300">Value</span>
            </div>
            <p className="text-xl font-bold text-white">{formatValue(simulation.valueEstimate)}</p>
          </div>
        </div>

        {/* Warnings */}
        {simulation.warnings && simulation.warnings.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-500 mb-2">Warnings</h4>
                <ul className="space-y-1">
                  {simulation.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-yellow-400">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Calls */}
        {simulation.calls && simulation.calls.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Operations ({simulation.calls.length})</h4>
            <div className="space-y-2">
              {simulation.calls.map((call, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-500 flex-shrink-0">{idx + 1}.</span>
                  <div className="flex-1">
                    <p className="text-white">{call.description}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      To: {call.target.slice(0, 10)}...{call.target.slice(-8)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Score */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-300">Confidence Score</span>
            <span className="text-white font-bold">{(simulation.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                simulation.confidence >= 0.8
                  ? "bg-green-500"
                  : simulation.confidence >= 0.6
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${simulation.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isExecuting}
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isExecuting || !simulation.success}
          className={`flex-1 ${
            isDryRun
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          }`}
        >
          {isExecuting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Executing...
            </div>
          ) : (
            <>{isDryRun ? "Simulate" : "Confirm & Execute"}</>
          )}
        </Button>
      </div>

      {/* Dry Run Notice */}
      {isDryRun && (
        <div className="mt-4 text-center text-sm text-blue-400">
          <Info className="w-4 h-4 inline mr-2" />
          Dry run mode: Transaction will be simulated without execution
        </div>
      )}
    </Card>
  );
};

export default TransactionPreviewCard;
