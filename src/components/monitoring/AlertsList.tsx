import React, { useState } from 'react';

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

interface AlertsListProps {
  alerts: Alert[];
  onAddToMonitoring: (userId: number, reason: string) => void;
}

const AlertsList: React.FC<AlertsListProps> = ({ alerts, onAddToMonitoring }) => {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [monitoringReason, setMonitoringReason] = useState<string>('');

  const handleAddToMonitoring = (userId: number) => {
    if (monitoringReason.trim()) {
      onAddToMonitoring(userId, monitoringReason);
      setMonitoringReason('');
      setExpandedUserId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Suspicious Activity Alerts ({alerts.length})</h2>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No suspicious activity detected
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div 
              key={alert.user_id} 
              className="border rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <div className="p-4 flex items-start justify-between bg-gray-50">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium mr-2">{alert.username}</h3>
                    {alert.threshold_exceeded ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Alert Triggered
                      </span>
                    ) : alert.monitoring_reason ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Monitored
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Suspicious
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{alert.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">
                    {alert.action_count} actions
                  </div>
                  <div className="text-xs text-gray-500">
                    Last active: {new Date(alert.last_activity).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {alert.monitoring_reason ? (
                <div className="p-4 bg-blue-50">
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">Monitoring reason:</span> {alert.monitoring_reason}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {expandedUserId === alert.user_id ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        rows={2}
                        placeholder="Enter reason for monitoring this user..."
                        value={monitoringReason}
                        onChange={(e) => setMonitoringReason(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                          onClick={() => setExpandedUserId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => handleAddToMonitoring(alert.user_id)}
                          disabled={!monitoringReason.trim()}
                        >
                          Add to Monitoring
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => {
                        setExpandedUserId(alert.user_id);
                        setMonitoringReason(`Suspicious activity: ${alert.action_count} actions in a short time period`);
                      }}
                    >
                      Add to Monitoring
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsList; 