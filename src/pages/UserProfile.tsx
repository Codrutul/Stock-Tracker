import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button_new from '../components/Button_new';
import Notification from '../components/Notification';

const UserProfile: React.FC = () => {
  const { user, logout, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'error' | 'success' | 'info'>('error');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  if (!user || !token) {
    window.location.href = '/login';
    return null;
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (newPassword !== confirmPassword) {
      setNotificationMessage("New passwords don't match");
      setNotificationType('error');
      setShowNotification(true);
      return;
    }
    
    if (newPassword.length < 8) {
      setNotificationMessage("New password must be at least 8 characters long");
      setNotificationType('error');
      setShowNotification(true);
      return;
    }
    
    try {
      setLoading(true);
      // Ensure VITE_API_URL is defined, or provide a fallback for local dev if necessary
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'; 
      const response = await fetch(`${baseUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }
      
      // Show success notification and reset form
      setNotificationMessage('Password changed successfully');
      setNotificationType('success');
      setShowNotification(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      setNotificationType('error');
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <Notification
        message={notificationMessage}
        isVisible={showNotification}
        onClose={handleNotificationClose}
        type={notificationType}
      />
      
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
            <Button_new name="Logout" onClick={handleLogout} darkMode={false} />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Username</p>
              <p className="text-lg font-semibold">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-lg font-semibold capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Account ID</p>
              <p className="text-lg font-semibold">{user.id}</p>
            </div>
          </div>
          
          <div className="mt-8">
            {!showPasswordChange ? (
              <div className="flex justify-center">
                <Button_new
                  name="Change Password"
                  onClick={() => setShowPasswordChange(true)}
                  darkMode={false}
                />
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-between">
                  <Button_new name="Save Changes" onClick={() => {}} darkMode={false} />
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 