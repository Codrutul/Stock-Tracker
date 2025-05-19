import { authHeaders } from './api';

// API base URL (should match your backend)
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// Define interfaces for the monitoring API
interface MonitoredUser {
  id: number;
  user_id: number;
  username: string;
  email: string;
  role: string;
  reason: string;
  action_count: number;
  threshold_exceeded: boolean;
  detected_at: string;
  updated_at: string;
}

interface Alert {
  user_id: number;
  username: string;
  email: string;
  role: string;
  action_count: number;
  activity_types: number;
  last_activity: string;
  monitoring_reason?: string;
  threshold_exceeded?: boolean;
}

interface ActivityType {
  activity_type: string;
  count: number;
}

interface HourlyDistribution {
  hour: number;
  count: number;
}

interface MonitoringStats {
  monitoredUsers: number;
  thresholdExceeded: number;
  recentAlerts: number;
  activityTypes: ActivityType[];
  hourlyDistribution: HourlyDistribution[];
}

interface AlertsResponse {
  alerts: Alert[];
  total: number;
  threshold: number;
  timeframe: string;
  limit: number;
  offset: number;
}

// Monitoring API client
class MonitoringApiClient {
  
  // Get all monitored users
  async getMonitoredUsers(): Promise<MonitoredUser[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/users`, {
        method: 'GET',
        headers: authHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch monitored users');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching monitored users:', error);
      throw error;
    }
  }
  
  // Get a specific monitored user
  async getMonitoredUser(userId: number): Promise<MonitoredUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/users/${userId}`, {
        method: 'GET',
        headers: authHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch monitored user');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching monitored user ${userId}:`, error);
      throw error;
    }
  }
  
  // Add a user to the monitoring list
  async addMonitoredUser(userId: number, reason: string, actionCount?: number): Promise<MonitoredUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/users`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          reason,
          actionCount: actionCount || 0
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add user to monitoring');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding user to monitoring:', error);
      throw error;
    }
  }
  
  // Update a monitored user
  async updateMonitoredUser(userId: number, data: { reason?: string; action_count?: number; threshold_exceeded?: boolean }): Promise<MonitoredUser> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/users/${userId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update monitored user');
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating monitored user ${userId}:`, error);
      throw error;
    }
  }
  
  // Remove a user from monitoring
  async removeMonitoredUser(userId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove user from monitoring');
      }
    } catch (error) {
      console.error(`Error removing user ${userId} from monitoring:`, error);
      throw error;
    }
  }
  
  // Get suspicious activities
  async getSuspiciousActivities(threshold?: number, timeframe?: string, limit?: number, offset?: number): Promise<AlertsResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (threshold) params.append('threshold', threshold.toString());
      if (timeframe) params.append('timeframe', timeframe);
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const url = `${API_BASE_URL}/monitoring/alerts${queryString}`;
      
      console.log('Fetching alerts from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: authHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || `Failed to fetch suspicious activities: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Alerts data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching suspicious activities:', error);
      throw error;
    }
  }
  
  // Get monitoring system stats
  async getMonitoringStats(): Promise<MonitoringStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/stats`, {
        method: 'GET',
        headers: authHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch monitoring stats');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching monitoring stats:', error);
      throw error;
    }
  }
  
  // Reset alert for a user
  async resetUserAlert(userId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/alerts/${userId}/reset`, {
        method: 'POST',
        headers: authHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset user alert');
      }
    } catch (error) {
      console.error(`Error resetting alert for user ${userId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const monitoringApi = new MonitoringApiClient(); 