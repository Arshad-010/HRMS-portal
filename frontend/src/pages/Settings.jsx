import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';

export const Settings = () => {
  const { changePassword } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, message: '', error: '' });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ loading: true, message: '', error: '' });

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordStatus({ loading: false, message: result.message, error: '' });
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setPasswordStatus({ loading: false, message: '', error: result.error });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-500" />
          Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your account preferences and security settings.
        </p>
      </div>

      <div className="space-y-8">
        {/* Security Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Security
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Update your account password and security preferences.
            </p>
          </div>

          <div className="max-w-md">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Change Password</h3>
            
            {passwordStatus.message && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs">
                {passwordStatus.message}
              </div>
            )}
            {passwordStatus.error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{passwordStatus.error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordStatus.loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-50 cursor-pointer transition-colors shadow-sm shadow-indigo-500/20"
                >
                  {passwordStatus.loading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
