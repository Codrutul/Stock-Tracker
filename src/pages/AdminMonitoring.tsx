import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MonitoredUserTable from '../components/monitoring/MonitoredUserTable';
import AlertsList from '../components/monitoring/AlertsList';
import MonitoringStats from '../components/monitoring/MonitoringStats';
import { monitoringApi } from '../utils/monitoringApi';
import { websocketService, WebSocketEvent } from '../utils/websocket';

const AdminMonitoring: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'alerts' | 'stats'>('overview');
  const [monitoredUsers, setMonitoredUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Check for admin access
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'admin') {
      window.location.href = '/'; // Redirect non-admin users
    }
  }, [isAuthenticated, user]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadMonitoredUsers();
      loadAlerts();
      loadStats();
      
      // Listen for security alerts via WebSocket
      const handleWebSocketEvent = (event: WebSocketEvent) => {
        if (event.type === 'security_alert' && event.payload) {
          const alert = event.payload.alert;
          showNotification(`New alert: ${alert.type} for user ${alert.username}`, 'warning');
          
          // Refresh data when new alerts come in
          loadAlerts();
          loadMonitoredUsers();
          loadStats();
        }
      };
      
      websocketService.addEventListener(handleWebSocketEvent);
      
      return () => {
        websocketService.removeEventListener(handleWebSocketEvent);
      };
    }
  }, [isAuthenticated, user]);

  const loadMonitoredUsers = async () => {
    try {
      setIsLoading(true);
      const users = await monitoringApi.getMonitoredUsers();
      setMonitoredUsers(users);
    } catch (error) {
      console.error('Error loading monitored users:', error);
      showNotification('Failed to load monitored users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const result = await monitoringApi.getSuspiciousActivities();
      console.log('Alerts API response:', result); // Add debugging
      setAlerts(result.alerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
      showNotification('Failed to load alerts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await monitoringApi.getMonitoringStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading monitoring stats:', error);
      showNotification('Failed to load monitoring statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAlert = async (userId: number) => {
    try {
      setIsLoading(true);
      await monitoringApi.resetUserAlert(userId);
      showNotification('Alert reset successfully', 'success');
      
      // Refresh data
      loadMonitoredUsers();
      loadAlerts();
    } catch (error) {
      console.error('Error resetting alert:', error);
      showNotification('Failed to reset alert', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromMonitoring = async (userId: number) => {
    try {
      setIsLoading(true);
      await monitoringApi.removeMonitoredUser(userId);
      showNotification('User removed from monitoring', 'success');
      
      // Refresh data
      loadMonitoredUsers();
      loadAlerts();
    } catch (error) {
      console.error('Error removing user from monitoring:', error);
      showNotification('Failed to remove user from monitoring', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  // If not authenticated or not admin, show loading or unauthorized
  if (!isAuthenticated || !user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (user.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen">Unauthorized: Admin access required</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {notification.message && (
        <div 
          className={`mb-4 p-4 rounded ${
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Monitoring Dashboard</h1>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              loadMonitoredUsers();
              loadAlerts();
              loadStats();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('users')}
          >
            Monitored Users
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'alerts' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('alerts')}
          >
            Suspicious Activity
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>

        <div className="p-4">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {!isLoading && activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-semibold mb-2">Monitored Users</h3>
                <p className="text-3xl font-bold">{stats?.monitoredUsers || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats?.thresholdExceeded || 0} users exceeding threshold
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-semibold mb-2">Recent Alerts</h3>
                <p className="text-3xl font-bold">{stats?.recentAlerts || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  In the last 24 hours
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-semibold mb-2">System Status</h3>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="font-medium">Monitoring Active</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && activeTab === 'users' && (
            <MonitoredUserTable 
              users={monitoredUsers} 
              onResetAlert={handleResetAlert}
              onRemoveUser={handleRemoveFromMonitoring}
            />
          )}

          {!isLoading && activeTab === 'alerts' && (
            <AlertsList 
              alerts={alerts} 
              onAddToMonitoring={(userId, reason) => {
                monitoringApi.addMonitoredUser(userId, reason)
                  .then(() => {
                    showNotification('User added to monitoring', 'success');
                    loadMonitoredUsers();
                  })
                  .catch(err => {
                    console.error('Error adding user to monitoring:', err);
                    showNotification('Failed to add user to monitoring', 'error');
                  });
              }}
            />
          )}

          {!isLoading && activeTab === 'stats' && stats && (
            <MonitoringStats stats={stats} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMonitoring; 