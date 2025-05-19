import React, { useState, useEffect } from 'react';
import Button_new from './Button_new';

interface TwoFactorAuthSetupProps {
  token: string;
  onSetupComplete: (recoveryCodes: string[]) => void;
  onCancel: () => void;
  setNotification: (message: string, type: 'error' | 'success' | 'info') => void;
}

const TwoFactorAuthSetup: React.FC<TwoFactorAuthSetupProps> = ({ token, onSetupComplete, onCancel, setNotification }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpToken, setOtpToken] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

  useEffect(() => {
    const fetch2FASetupData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/2fa/setup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to initiate 2FA setup');
        }
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      } catch (error) {
        setNotification(error instanceof Error ? error.message : 'Unknown error during 2FA setup initiation', 'error');
        onCancel(); // Optionally close on error, or let user see message
      } finally {
        setIsLoading(false);
      }
    };
    fetch2FASetupData();
  }, [token, API_BASE_URL, setNotification, onCancel]);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || !otpToken) {
      setNotification('Secret or OTP token is missing.', 'error');
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ secret, token: otpToken })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify 2FA token');
      }
      setRecoveryCodes(data.recoveryCodes || []);
      // Don't call onSetupComplete immediately, show recovery codes first
      setNotification('2FA enabled! Please save your recovery codes.', 'success');
    } catch (error) {
      setNotification(error instanceof Error ? error.message : 'Unknown error during 2FA verification', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading 2FA setup...</div>;
  }

  if (recoveryCodes) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md mt-4">
        <h3 className="text-xl font-semibold text-green-700 mb-4">Two-Factor Authentication Enabled!</h3>
        <p className="mb-3">Please save these recovery codes in a safe place. They can be used to access your account if you lose access to your authenticator app.</p>
        <div className="bg-gray-100 p-3 rounded mb-4">
          {recoveryCodes.map((code, index) => (
            <div key={index} className="font-mono p-1">{code}</div>
          ))}
        </div>
        <Button_new name="Done - I have saved my codes" onClick={() => onSetupComplete(recoveryCodes)} darkMode={false} />
      </div>
    );
  }

  if (!qrCodeUrl || !secret) {
    return <div className="text-center p-4">Could not load 2FA setup information. Please try again.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Two-Factor Authentication</h3>
      <p className="text-sm text-gray-600 mb-4">
        Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy). <br />
        If you cannot scan the QR code, you can manually enter the secret key.
      </p>

      <div className="flex flex-col items-center mb-4">
        <img src={qrCodeUrl} alt="2FA QR Code" className="mb-3 border p-1" />
        <p className="text-sm text-gray-500">Or manually enter this secret:</p>
        <p className="font-mono bg-gray-100 p-2 rounded my-1 text-center break-all">{secret}</p>
      </div>

      <form onSubmit={handleVerifyToken} className="space-y-4">
        <div>
          <label htmlFor="otpToken" className="block text-sm font-medium text-gray-700">Verification Code</label>
          <input
            id="otpToken"
            type="text"
            value={otpToken}
            onChange={(e) => setOtpToken(e.target.value)}
            placeholder="Enter code from app"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={6}
            minLength={6}
          />
        </div>
        <div className="flex justify-between items-center">
          <Button_new name="Verify & Enable 2FA" onClick={() => {}} darkMode={false} disabled={isVerifying} />
          <button 
            type="button"
            onClick={onCancel}
            disabled={isVerifying}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TwoFactorAuthSetup; 