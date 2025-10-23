"use client";

import { useState, useEffect } from "react";
import MetricsDashboard from "../components/MetricsDashboard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MetricsPage() {
  // Mock metrics - in production, fetch from API
  const [metrics, setMetrics] = useState({
    successRate: 92.5,
    avgGasUsed: 185000,
    medianLatency: 1850,
    totalTransactions: 47,
    successfulTxs: 44,
    failedTxs: 3,
    avgResponseTime: 1650,
    peakLatency: 3200,
    gasEfficiency: 88.2,
  });

  // Simulate real-time updates (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 2),
        successfulTxs: prev.successfulTxs + Math.floor(Math.random() * 2),
        medianLatency: Math.max(500, prev.medianLatency + (Math.random() - 0.5) * 200),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Chat</span>
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-white">Performance Metrics</h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time performance and observability dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <MetricsDashboard
          metrics={metrics}
          showPerformanceOverlay={false}
        />

        {/* Additional Info */}
        <div className="mt-8 p-6 bg-gray-900 border border-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-4">About These Metrics</h2>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              <strong className="text-white">Success Rate:</strong> Percentage of transactions that executed successfully without errors.
            </p>
            <p>
              <strong className="text-white">Average Gas Used:</strong> Mean gas consumption across all transactions.
            </p>
            <p>
              <strong className="text-white">Median Latency:</strong> Median time from intent submission to transaction completion.
            </p>
            <p>
              <strong className="text-white">Gas Efficiency:</strong> How optimized the gas usage is compared to baseline estimates.
            </p>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-white">Somnia Network</span>
            </div>
            <p className="text-xs text-gray-400">Connected to Testnet (Shannon)</p>
          </div>

          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-white">AI Agents</span>
            </div>
            <p className="text-xs text-gray-400">5 agents active and healthy</p>
          </div>

          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-white">Smart Contracts</span>
            </div>
            <p className="text-xs text-gray-400">6 contracts deployed & verified</p>
          </div>
        </div>
      </div>
    </div>
  );
}
