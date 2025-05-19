import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button_new from '../components/Button_new';
import Notification from '../components/Notification';

const LoginPage: React.FC = () => {
  const { login, error, isAuthenticated, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'info'>('error');

  useEffect(() => {
    if (error) {
      setNotificationMessage(error);
      setNotificationType('error');
      setShowNotification(true);
    }
  }, [error]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
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
            />
          </div>
          <div className="flex items-center justify-between">
            <Button_new
              name="Sign In"
              onClick={() => {}} // Placeholder, form onSubmit handles the login
              darkMode={false}
            />
            <div
              onClick={() => window.location.href = '/register'}
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 cursor-pointer"
            >
              Don't have an account? Register
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 