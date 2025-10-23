'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  ExternalLink,
  ChevronDown,
  ChevronRight 
} from 'lucide-react';
import { getExplorerUrl } from '@/wallet/somniaConfig';

interface AgentStep {
  agentName: string;
  agentId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime?: number;
  endTime?: number;
  description: string;
  gasUsed?: number;
  transactionHash?: string;
  error?: string;
}

interface AgentTimelineProps {
  steps: AgentStep[];
  traceId: string;
  totalGas?: number;
  isComplete?: boolean;
}

export function AgentTimeline({ 
  steps, 
  traceId, 
  totalGas,
  isComplete = false 
}: AgentTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleExpand = (agentId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId);
    } else {
      newExpanded.add(agentId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'failed': return 'border-red-200 bg-red-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      case 'pending': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDuration = (start?: number, end?: number) => {
    if (!start) return 'N/A';
    const duration = (end || Date.now()) - start;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const successCount = steps.filter(s => s.status === 'success').length;
  const failedCount = steps.filter(s => s.status === 'failed').length;
  const runningCount = steps.filter(s => s.status === 'running').length;

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-purple-600" />
            <div>
              <CardTitle className="text-lg">Agent Execution Timeline</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Trace ID: {traceId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {runningCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {runningCount} Running
              </Badge>
            )}
            {successCount > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {successCount} Success
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                {failedCount} Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isExpanded = expandedSteps.has(step.agentId);
            const isLast = index === steps.length - 1;

            return (
              <div key={step.agentId} className="relative">
                {/* Connecting Line */}
                {!isLast && (
                  <div 
                    className="absolute left-6 top-12 w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent" 
                    style={{ height: 'calc(100% + 12px)' }}
                  />
                )}

                {/* Step Card */}
                <div 
                  className={`
                    relative border rounded-lg p-4 transition-all
                    ${getStatusColor(step.status)}
                    ${isExpanded ? 'shadow-md' : 'shadow-sm'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(step.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{step.agentName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {step.status}
                          </Badge>
                        </div>
                        <button
                          onClick={() => toggleExpand(step.agentId)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{step.description}</p>

                      {/* Compact Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        {step.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(step.startTime, step.endTime)}
                          </span>
                        )}
                        {step.gasUsed && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {step.gasUsed.toLocaleString()} gas
                          </span>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          {step.transactionHash && (
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                              <span className="text-xs text-gray-600">Transaction Hash:</span>
                              <a
                                href={getExplorerUrl(step.transactionHash, 'tx')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-mono"
                              >
                                {step.transactionHash.slice(0, 10)}...{step.transactionHash.slice(-8)}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {step.error && (
                            <div className="p-2 bg-red-50 rounded border border-red-200">
                              <p className="text-xs text-red-700 font-medium mb-1">Error:</p>
                              <p className="text-xs text-red-600">{step.error}</p>
                            </div>
                          )}

                          {step.startTime && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 bg-white rounded border">
                                <span className="text-gray-600">Started:</span>
                                <p className="font-mono mt-1">
                                  {new Date(step.startTime).toLocaleTimeString()}
                                </p>
                              </div>
                              {step.endTime && (
                                <div className="p-2 bg-white rounded border">
                                  <span className="text-gray-600">Completed:</span>
                                  <p className="font-mono mt-1">
                                    {new Date(step.endTime).toLocaleTimeString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        {isComplete && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Execution Complete</span>
              </div>
              {totalGas && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">
                    Total Gas: {totalGas.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">
                    (≈ {(totalGas * 0.00000002).toFixed(6)} STT)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentTimeline;
