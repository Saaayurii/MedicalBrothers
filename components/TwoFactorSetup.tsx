'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TwoFactorSetupProps {
  userType: 'patient' | 'admin';
  isEnabled?: boolean;
  onSuccess?: () => void;
}

export default function TwoFactorSetup({
  userType,
  isEnabled = false,
  onSuccess,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'complete'>('initial');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [disableToken, setDisableToken] = useState<string>('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup 2FA');
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA');
      }

      setBackupCodes(data.backupCodes);
      setStep('complete');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableToken || disableToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      alert('2FA disabled successfully');
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    alert('Backup codes copied to clipboard!');
  };

  if (isEnabled && step === 'initial') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
        <p className="text-green-600 mb-4">✓ 2FA is currently enabled</p>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Disable 2FA</h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter your authenticator code to disable two-factor authentication.
          </p>

          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={disableToken}
            onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="border rounded px-3 py-2 w-full mb-2"
          />

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          <button
            onClick={handleDisable}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'initial') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
        <p className="text-gray-600 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <button
          onClick={handleSetup}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Enable 2FA'}
        </button>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Setup Authenticator</h2>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Step 1: Scan QR Code</h3>
          <p className="text-sm text-gray-600 mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>

          {qrCode && (
            <div className="flex justify-center mb-4">
              <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
            </div>
          )}

          <p className="text-xs text-gray-500 mb-2">Or enter this code manually:</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{secret}</code>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Step 2: Enter Verification Code</h3>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="border rounded px-3 py-2 w-full mb-2"
          />
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setStep('initial')}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleEnable}
            disabled={loading || token.length !== 6}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-green-600">✓ 2FA Enabled Successfully!</h2>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Backup Codes</h3>
          <p className="text-sm text-gray-600 mb-4">
            Save these backup codes in a safe place. You can use them to access your account if you
            lose your authenticator device.
          </p>

          <div className="bg-gray-100 p-4 rounded mb-4">
            {backupCodes.map((code, index) => (
              <div key={index} className="font-mono text-sm">
                {code}
              </div>
            ))}
          </div>

          <button
            onClick={copyBackupCodes}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mb-4"
          >
            Copy Backup Codes
          </button>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}
