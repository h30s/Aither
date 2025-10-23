"use client";

import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Timer
} from "lucide-react";

interface MetricsData {
  successRate: number;
  avgGasUsed: number;
  medianLatency: number;
  totalTransactions: number;
  successfulTxs: number;
  failedTxs: number;
  avgResponseTime: number;
  peakLatency: number;
  gasEfficiency: number;
}

interface MetricsDashboardProps {
  metrics?: MetricsData;
  showPerformanceOverlay?: boolean;
  traceId?: string;
}

const DEFAULT_METRICS: MetricsData = {
  successRate: 0,
  avgGasUsed: 0,
  medianLatency: 0,
  totalTransactions: 0,
  successfulTxs: 0,
  failedTxs: 0,
  avgResponseTime: 0,
  peakLatency: 0,
  gasEfficiency: 0,
};

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics = DEFAULT_METRICS,
  showPerformanceOverlay = false,
  traceId,
}) => {
  const [currentLatency, setCurrentLatency] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (showPerformanceOverlay) {
      setStartTime(Date.now());
      const interval = setInterval(() => {
        if (startTime) {
          setCurrentLatency(Date.now() - startTime);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showPerformanceOverlay, startTime]);

  const formatGas = (gas: number) => {
    if (gas > 1000000) return `${(gas / 1000000).toFixed(2)}M`;
    if (gas > 1000) return `${(gas / 1000).toFixed(1)}K`;
    return gas.toLocaleString();
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-500";
    if (rate >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Performance Overlay */}
      {showPerformanceOverlay && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-purple-500/50 rounded-lg p-4 min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">Performance Monitor</span>
          </div>
          <div className="space-y-2 text-sm">
            {currentLatency !== null && (
              <div className="flex justify-between">
                <span className="text-gray-400">Current Latency:</span>
                <span className="text-white font-mono">{formatTime(currentLatency)}</span>
              </div>
            )}
            {traceId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Trace ID:</span>
                <span className="text-purple-300 font-mono text-xs">
                  {traceId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Success Rate */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className={`text-2xl font-bold ${getSuccessRateColor(metrics.successRate)}`}>
              {metrics.successRate.toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300">Success Rate</h3>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.successfulTxs} / {metrics.totalTransactions} transactions
          </p>
        </Card>

        {/* Average Gas */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-900/20 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {formatGas(metrics.avgGasUsed)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300">Avg Gas Used</h3>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.gasEfficiency.toFixed(1)}% efficiency
          </p>
        </Card>

        {/* Median Latency */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {formatTime(metrics.medianLatency)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300">Median Latency</h3>
          <p className="text-xs text-gray-500 mt-1">
            Peak: {formatTime(metrics.peakLatency)}
          </p>
        </Card>

        {/* Total Transactions */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-900/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white">
              {metrics.totalTransactions}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300">Total Transactions</h3>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.failedTxs} failed
          </p>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Performance Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Avg Response Time</span>
            </div>
            <p className="text-xl font-semibold text-white">
              {formatTime(metrics.avgResponseTime)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Successful Txs</span>
            </div>
            <p className="text-xl font-semibold text-green-400">
              {metrics.successfulTxs}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Failed Txs</span>
            </div>
            <p className="text-xl font-semibold text-red-400">
              {metrics.failedTxs}
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Progress Bar */}
      <Card className="p-6 bg-gray-900 border-gray-700">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-white font-semibold">{metrics.successRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  metrics.successRate >= 90
                    ? "bg-green-500"
                    : metrics.successRate >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${metrics.successRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Gas Efficiency</span>
              <span className="text-white font-semibold">{metrics.gasEfficiency.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${metrics.gasEfficiency}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MetricsDashboard;
