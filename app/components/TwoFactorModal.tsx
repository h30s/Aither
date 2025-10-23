'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<boolean>;
  operation: string;
  amount: string;
  recipient?: string;
}

export function TwoFactorModal({
  isOpen,
  onClose,
  onConfirm,
  operation,
  amount,
  recipient,
}: TwoFactorModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '', '', '']);
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`2fa-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`2fa-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await onConfirm(fullCode);
      if (isValid) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError('Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('2fa-0')?.focus();
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    document.getElementById(`2fa-${lastIndex}`)?.focus();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl">Two-Factor Authentication</DialogTitle>
          </div>
          <DialogDescription>
            This operation requires additional confirmation for your security.
          </DialogDescription>
        </DialogHeader>

        {/* Operation Details */}
        <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Operation:</span>
            <span className="font-semibold">{operation}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-blue-600">{amount} STT</span>
          </div>
          {recipient && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">To:</span>
              <span className="font-mono text-xs">{recipient}</span>
            </div>
          )}
        </div>

        {/* 2FA Code Input */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Enter 6-digit verification code</p>
            <p className="text-xs text-gray-500">
              Check your authenticator app
            </p>
          </div>

          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`2fa-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold"
                disabled={isVerifying || success}
              />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Verification successful! Proceeding...
            </AlertDescription>
          </Alert>
        )}

        {/* Security Note */}
        <Alert className="border-blue-200 bg-blue-50">
          <Lock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-xs">
            <strong>Security Note:</strong> Never share your 2FA code with anyone. 
            Aither will never ask for your code via email or chat.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isVerifying || success}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={code.join('').length !== 6 || isVerifying || success}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Verifying...
              </span>
            ) : success ? (
              'Verified ✓'
            ) : (
              'Verify & Confirm'
            )}
          </Button>
        </DialogFooter>

        {/* Help Text */}
        <div className="text-center">
          <button
            onClick={() => {/* TODO: Implement resend/help logic */}}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
            disabled={isVerifying}
          >
            Having trouble? Get help
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TwoFactorModal;
