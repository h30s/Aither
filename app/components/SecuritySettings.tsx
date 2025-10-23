'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  DollarSign,
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

interface SecuritySettingsProps {
  userAddress: string;
  onSave: (settings: SecurityConfig) => Promise<void>;
}

export interface SecurityConfig {
  dailySpendLimit: number;
  perIntentLimit: number;
  auto2FA: boolean;
  auto2FAThreshold: number;
  allowedContracts: string[];
  allowedProtocols: string[];
  slippageLimit: number;
}

const DEFAULT_CONFIG: SecurityConfig = {
  dailySpendLimit: 10000,
  perIntentLimit: 1000,
  auto2FA: true,
  auto2FAThreshold: 1000,
  allowedContracts: [],
  allowedProtocols: [],
  slippageLimit: 5,
};

export function SecuritySettings({ userAddress, onSave }: SecuritySettingsProps) {
  const [config, setConfig] = useState<SecurityConfig>(DEFAULT_CONFIG);
  const [newContract, setNewContract] = useState('');
  const [newProtocol, setNewProtocol] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addContract = () => {
    if (newContract && /^0x[a-fA-F0-9]{40}$/.test(newContract)) {
      setConfig({
        ...config,
        allowedContracts: [...config.allowedContracts, newContract],
      });
      setNewContract('');
    }
  };

  const removeContract = (address: string) => {
    setConfig({
      ...config,
      allowedContracts: config.allowedContracts.filter(c => c !== address),
    });
  };

  const addProtocol = () => {
    if (newProtocol && !config.allowedProtocols.includes(newProtocol)) {
      setConfig({
        ...config,
        allowedProtocols: [...config.allowedProtocols, newProtocol],
      });
      setNewProtocol('');
    }
  };

  const removeProtocol = (protocol: string) => {
    setConfig({
      ...config,
      allowedProtocols: config.allowedProtocols.filter(p => p !== protocol),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold">Security Settings</h2>
          <p className="text-sm text-gray-600">Configure security and spending limits for {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Security settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Spending Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Spending Limits
          </CardTitle>
          <CardDescription>
            Set maximum amounts to protect your funds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Daily Spending Limit (STT)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={config.dailySpendLimit}
                onChange={(e) => setConfig({ ...config, dailySpendLimit: parseFloat(e.target.value) })}
                placeholder="10000"
              />
              <p className="text-xs text-gray-500">Maximum you can spend per day</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intentLimit">Per-Intent Limit (STT)</Label>
              <Input
                id="intentLimit"
                type="number"
                value={config.perIntentLimit}
                onChange={(e) => setConfig({ ...config, perIntentLimit: parseFloat(e.target.value) })}
                placeholder="1000"
              />
              <p className="text-xs text-gray-500">Maximum per transaction</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slippage">Maximum Slippage (%)</Label>
            <Input
              id="slippage"
              type="number"
              step="0.1"
              value={config.slippageLimit}
              onChange={(e) => setConfig({ ...config, slippageLimit: parseFloat(e.target.value) })}
              placeholder="5"
            />
            <p className="text-xs text-gray-500">Reject transactions with slippage above this</p>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Additional confirmation for sensitive operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="font-medium">Enable Auto-2FA</div>
              <p className="text-sm text-gray-600">
                Require confirmation for transactions above threshold
              </p>
            </div>
            <Switch
              checked={config.auto2FA}
              onCheckedChange={(checked) => setConfig({ ...config, auto2FA: checked })}
            />
          </div>

          {config.auto2FA && (
            <div className="space-y-2 pl-4 border-l-2 border-blue-200">
              <Label htmlFor="2faThreshold">2FA Threshold (STT)</Label>
              <Input
                id="2faThreshold"
                type="number"
                value={config.auto2FAThreshold}
                onChange={(e) => setConfig({ ...config, auto2FAThreshold: parseFloat(e.target.value) })}
                placeholder="1000"
              />
              <p className="text-xs text-gray-500">
                Transactions above this amount require 2FA confirmation
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Contract Allowlist
          </CardTitle>
          <CardDescription>
            Only interact with approved smart contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="0x... (contract address)"
              value={newContract}
              onChange={(e) => setNewContract(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addContract} disabled={!newContract}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {config.allowedContracts.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No contracts in allowlist. All verified contracts will be allowed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {config.allowedContracts.map((contract) => (
                <div
                  key={contract}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <span className="font-mono text-sm">{contract}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContract(contract)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protocol Allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Protocol Allowlist
          </CardTitle>
          <CardDescription>
            Whitelist specific DeFi protocols
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Protocol name (e.g., Uniswap, Aave)"
              value={newProtocol}
              onChange={(e) => setNewProtocol(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addProtocol} disabled={!newProtocol}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {config.allowedProtocols.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No protocols in allowlist. All known protocols will be allowed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-wrap gap-2">
              {config.allowedProtocols.map((protocol) => (
                <Badge
                  key={protocol}
                  variant="outline"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {protocol}
                  <button
                    onClick={() => removeProtocol(protocol)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setConfig(DEFAULT_CONFIG)}>
          Reset to Default
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Security Tips */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Security Tips:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>Start with conservative limits and increase gradually</li>
            <li>Enable 2FA for all transactions above 1000 STT</li>
            <li>Only add contracts you trust to the allowlist</li>
            <li>Review and update your settings regularly</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default SecuritySettings;
