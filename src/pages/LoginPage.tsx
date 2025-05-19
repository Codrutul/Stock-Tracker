import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button_new from '../components/Button_new';
import Notification from '../components/Notification';

const LoginPage: React.FC = () => {
  const { login, error, isAuthenticated, clearError, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'info'>('error');

  // --- 2FA State ---
  const [awaiting2FAToken, setAwaiting2FAToken] = useState(false);
  const [twoFactorTokenInput, setTwoFactorTokenInput] = useState('');
  const [tempUsername, setTempUsername] = useState(''); // To store username for 2FA step
  const [tempPassword, setTempPassword] = useState(''); // To store password for 2FA step

  useEffect(() => {
    if (error) {
      if (error === '2FA_REQUIRED') {
        setNotificationMessage('Please enter your Two-Factor Authentication code.');
        setNotificationType('info');
        setShowNotification(true);
        setAwaiting2FAToken(true);
        // Store username and password for the 2FA step
        setTempUsername(username); 
        setTempPassword(password);
      } else {
        setNotificationMessage(error);
        setNotificationType('error');
        setShowNotification(true);
        setAwaiting2FAToken(false); // Reset 2FA state on other errors
      }
    }
  }, [error, username, password]); // Added username and password to dependency array

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear previous errors

    if (awaiting2FAToken) {
      // Attempting login with 2FA token
      await login(tempUsername, tempPassword, twoFactorTokenInput);
      // AuthContext will handle success (redirect) or further errors.
      // If login fails again (e.g. wrong 2FA code), the useEffect for error will show it.
      // If successful, isAuthenticated will become true, triggering redirect.
    } else {
      // Initial login attempt (username + password)
      await login(username, password);
      // If login needs 2FA, the useEffect for 'error' will set awaiting2FAToken = true
    }
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
    clearError();
  };

  if (isAuthenticated) {
    // Redirect to portfolio page if already authenticated
    window.location.href = '/';
    return null;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-blue-600">
      <Notification
        message={notificationMessage}
        isVisible={showNotification}
        onClose={handleNotificationClose}
        type={notificationType}
      />
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Stock Tracker Login</h2>
        <form onSubmit={handleLogin}>
          {!awaiting2FAToken ? (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type="password"
                  placeholder="******************"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            // --- 2FA Token Input ---
            <div className="mb-6">
              <p className="text-center text-gray-700 mb-2">Enter your 2FA code to complete login.</p>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="twoFactorToken">
                Authentication Code
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="twoFactorToken"
                type="text"
                placeholder="6-digit code"
                value={twoFactorTokenInput}
                onChange={(e) => setTwoFactorTokenInput(e.target.value)}
                required
                disabled={isLoading}
                maxLength={8} // Allow for recovery codes which might be longer
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button_new
              name={awaiting2FAToken ? "Verify Code" : "Sign In"}
              onClick={() => {}} // Placeholder, form onSubmit handles it
              darkMode={false}
              disabled={isLoading} // Disable button while loading
            />
            {!awaiting2FAToken && (
              <div
                onClick={() => { if (!isLoading) window.location.href = '/register'; }}
                className={`inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                Don't have an account? Register
              </div>
            )}
          </div>
          {awaiting2FAToken && (
             <button 
                type="button" 
                onClick={() => { 
                    setAwaiting2FAToken(false); 
                    setTwoFactorTokenInput(''); 
                    clearError(); 
                    setUsername(tempUsername); // Restore original username input
                    setPassword(tempPassword); // Restore original password input (optional, or clear)
                }}
                disabled={isLoading}
                className="mt-4 w-full text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
            >
                Back to password login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 