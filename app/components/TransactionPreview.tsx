'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, TrendingUp, Zap, Shield, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { SimulationResult } from '@/ai/agents/base';

interface TransactionPreviewProps {
  operation: string;
  description: string;
  simulation: SimulationResult;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isExecuting?: boolean;
}

export function TransactionPreview({
  operation,
  description,
  simulation,
  onConfirm,
  onCancel,
  isExecuting = false,
}: TransactionPreviewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-500 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return <CheckCircle2 className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'high':
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold">{operation}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={`${getRiskColor(simulation.risk)} border flex items-center gap-1`}
          >
            {getRiskIcon(simulation.risk)}
            {simulation.risk.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Confidence Score */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Confidence Score</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {(simulation.confidence * 100).toFixed(0)}%
          </span>
        </div>

        {/* Gas & Value Estimates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Estimated Gas</span>
            </div>
            <p className="text-lg font-semibold">
              {simulation.gasEstimate.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ≈ {(simulation.gasEstimate * 0.00000002).toFixed(6)} STT
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Value at Risk</span>
            </div>
            <p className="text-lg font-semibold">
              {simulation.valueEstimate.toLocaleString()} STT
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ≈ ${(simulation.valueEstimate * 1).toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* Justification */}
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            What will happen?
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {simulation.justification}
          </p>
        </div>

        {/* Warnings */}
        {simulation.warnings && simulation.warnings.length > 0 && (
          <Alert variant="destructive" className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <ul className="list-disc list-inside space-y-1">
                {simulation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction Details (Collapsible) */}
        {simulation.calls && simulation.calls.length > 0 && (
          <div className="border rounded-lg">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full p-3 text-left font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <span>Transaction Details ({simulation.calls.length} calls)</span>
              <span className="text-xs text-gray-500">
                {showDetails ? '▼' : '▶'}
              </span>
            </button>
            
            {showDetails && (
              <div className="p-3 border-t bg-gray-50 space-y-2">
                {simulation.calls.map((call, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-gray-600">Call #{idx + 1}</span>
                      <span className="text-gray-500">
                        Gas: {call.gasLimit?.toLocaleString() || 'Auto'}
                      </span>
                    </div>
                    <p className="text-gray-700">{call.description}</p>
                    <p className="text-gray-500 mt-1 truncate">
                      To: {call.target}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-3 border-t pt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isExecuting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isExecuting || !simulation.success}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isExecuting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Executing...
            </span>
          ) : (
            'Confirm & Execute'
          )}
        </Button>
      </CardFooter>

      {/* Footer Info */}
      <div className="px-6 pb-4 text-xs text-gray-500 text-center">
        By confirming, you agree to execute this transaction on Somnia Testnet
      </div>
    </Card>
  );
}

export default TransactionPreview;
