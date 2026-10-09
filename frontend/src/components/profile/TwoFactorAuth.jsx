import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Key, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export const TwoFactorAuth = () => {
  const { user } = useAuth();
  
  // States: 'idle', 'enrolling', 'enabled'
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  
  // Setup data
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [setupCode, setSetupCode] = useState('');
  
  // Disable / Regenerate Auth
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);

  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Fetch initial 2FA status from User profile (we need to know if it's enabled)
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data?.twoFactorEnabled) {
        setStatus('enabled');
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error('Error fetching 2FA status', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleStartSetup = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/2fa/setup');
      if (res.data?.success) {
        setQrCodeUrl(res.data.data.qrCode);
        setManualKey(res.data.data.secret);
        setStatus('enrolling');
        showMessage('success', 'Setup initialized. Scan the QR code with your authenticator app.');
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (setupCode.length !== 6) {
      return showMessage('error', 'Please enter a 6-digit code');
    }
    
    try {
      setLoading(true);
      const res = await api.post('/auth/2fa/verify-setup', { code: setupCode });
      if (res.data?.success) {
        setStatus('enabled');
        setRecoveryCodes(res.data.data.recoveryCodes);
        showMessage('success', '2FA successfully enabled!');
        setSetupCode('');
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!confirmPassword || confirmCode.length !== 6) {
      return showMessage('error', 'Password and 6-digit code are required');
    }
    
    try {
      setLoading(true);
      const res = await api.post('/auth/2fa/disable', { password: confirmPassword, code: confirmCode });
      if (res.data?.success) {
        setStatus('idle');
        setConfirmPassword('');
        setConfirmCode('');
        showMessage('success', '2FA has been disabled.');
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async (e) => {
    e.preventDefault();
    if (!confirmPassword || confirmCode.length !== 6) {
      return showMessage('error', 'Password and 6-digit code are required');
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/2fa/recovery-codes', { password: confirmPassword, code: confirmCode });
      if (res.data?.success) {
        setRecoveryCodes(res.data.data.recoveryCodes);
        setConfirmPassword('');
        setConfirmCode('');
        showMessage('success', 'New recovery codes generated.');
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to regenerate recovery codes.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && status === 'idle' && !message.text) {
    return <div className="p-4 text-sm text-slate-500">Checking security status...</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm mt-8">
      <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          Two-Factor Authentication (2FA)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Add an extra layer of security to your account.
        </p>
      </div>

      {message.text && (
        <div className={\`mb-6 p-3 rounded-xl border text-xs flex items-start gap-2 \${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300'
        }\`}>
          {message.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* STATE: IDLE */}
      {status === 'idle' && (
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication is <span className="text-rose-500">Disabled</span></p>
              <p className="text-xs text-slate-500 mt-0.5">We highly recommend enabling 2FA to secure your HRMS Portal access.</p>
            </div>
          </div>
          <button
            onClick={handleStartSetup}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-500 transition shadow-sm shadow-indigo-500/20"
          >
            {loading ? 'Initializing...' : 'Enable 2FA'}
          </button>
        </div>
      )}

      {/* STATE: ENROLLING */}
      {status === 'enrolling' && (
        <div className="space-y-6">
          <div className="flex gap-6 items-start flex-col md:flex-row">
            {qrCodeUrl && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40" />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">1. Scan QR Code</h4>
                <p className="text-xs text-slate-500 mt-1">Open your authenticator app (e.g. Google Authenticator, Authy) and scan the QR code.</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Or enter setup key manually:</h4>
                <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-xs mt-1 block select-all">
                  {manualKey}
                </code>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 max-w-sm">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">2. Verify Setup</h4>
            <form onSubmit={handleVerifySetup} className="flex gap-2">
              <input 
                type="text" 
                placeholder="6-digit code" 
                maxLength={6}
                value={setupCode}
                onChange={e => setSetupCode(e.target.value.replace(/\\D/g, ''))}
                required
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors"
              />
              <button 
                type="submit"
                disabled={loading || setupCode.length !== 6}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition shadow-sm shadow-indigo-500/20"
              >
                Confirm & Enable
              </button>
            </form>
            <button 
              type="button" 
              onClick={() => { setStatus('idle'); setQrCodeUrl(''); setManualKey(''); setSetupCode(''); }}
              className="mt-3 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              Cancel enrollment
            </button>
          </div>
        </div>
      )}

      {/* STATE: ENABLED */}
      {status === 'enabled' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication is <span className="text-emerald-500">Enabled</span></p>
              <p className="text-xs text-slate-500 mt-0.5">Your account is secured with an additional verification step.</p>
            </div>
          </div>

          {recoveryCodes.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-2">
                <Key className="w-4 h-4" /> Save your recovery codes
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                Store these codes in a safe place (like a password manager). These are shown ONLY ONCE. You can use them to access your account if you lose your device.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-xs">
                {recoveryCodes.map(code => (
                  <div key={code} className="bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-800 px-2 py-1.5 rounded text-slate-800 dark:text-slate-200 select-all text-center">
                    {code}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setRecoveryCodes([])}
                className="mt-4 px-3 py-1.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-medium rounded-lg hover:bg-amber-300 dark:hover:bg-amber-700 transition"
              >
                I have saved them
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Manage 2FA Settings</h4>
            
            <form className="max-w-md space-y-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 pb-2">Verify your identity to disable 2FA or generate new recovery codes.</p>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">6-Digit Authenticator Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\\D/g, ''))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  disabled={loading || !confirmPassword || confirmCode.length !== 6}
                  className="px-4 py-2 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-medium rounded-xl hover:bg-rose-200 dark:hover:bg-rose-900/50 disabled:opacity-50 transition"
                >
                  Disable 2FA
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateCodes}
                  disabled={loading || !confirmPassword || confirmCode.length !== 6}
                  className="px-4 py-2 flex items-center gap-1.5 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate Recovery Codes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
