import React from 'react';

interface ActivityType {
  activity_type: string;
  count: number;
}

interface HourlyDistribution {
  hour: number;
  count: number;
}

interface MonitoringStatsProps {
  stats: {
    monitoredUsers: number;
    thresholdExceeded: number;
    recentAlerts: number;
    activityTypes: ActivityType[];
    hourlyDistribution: HourlyDistribution[];
  };
}

const MonitoringStats: React.FC<MonitoringStatsProps> = ({ stats }) => {
  // Find the maximum count for scaling
  const maxActivityCount = Math.max(...stats.activityTypes.map(at => at.count), 1);
  const maxHourlyCount = Math.max(...stats.hourlyDistribution.map(h => h.count), 1);
  
  // Activity type colors
  const activityTypeColors = {
    authentication: 'bg-blue-500',
    authorization: 'bg-purple-500',
    transaction: 'bg-green-500',
    view: 'bg-yellow-500',
    update: 'bg-orange-500',
    delete: 'bg-red-500',
    default: 'bg-gray-500'
  };
  
  // Helper to get color for activity type
  const getActivityColor = (type: string): string => {
    const key = type.toLowerCase() as keyof typeof activityTypeColors;
    return activityTypeColors[key] || activityTypeColors.default;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Monitoring Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Types Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Suspicious Activity by Type</h3>
          
          <div className="space-y-3">
            {stats.activityTypes.map((activity) => (
              <div key={activity.activity_type} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{activity.activity_type}</span>
                  <span className="text-gray-500">{activity.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`${getActivityColor(activity.activity_type)} h-2.5 rounded-full`} 
                    style={{ width: `${(activity.count / maxActivityCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            
            {stats.activityTypes.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No activity data available
              </div>
            )}
          </div>
        </div>
        
        {/* Hourly Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Suspicious Activity by Hour</h3>
          
          <div className="flex items-end h-40 space-x-2">
            {Array.from({ length: 24 }).map((_, hourIndex) => {
              const hourData = stats.hourlyDistribution.find(h => h.hour === hourIndex);
              const count = hourData ? hourData.count : 0;
              const height = count ? Math.max((count / maxHourlyCount) * 100, 4) : 4; // Min 4% height for visibility
              
              return (
                <div key={hourIndex} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-full ${count ? 'bg-blue-500' : 'bg-gray-200'} rounded-t`}
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="text-xs mt-1">{hourIndex}</div>
                </div>
              );
            })}
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">Hour of Day (24h)</div>
        </div>
      </div>
      
      {/* Additional Stats */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium mb-4">System Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-500">Monitored Users</div>
            <div className="text-2xl font-bold text-blue-700">{stats.monitoredUsers}</div>
          </div>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-gray-500">Alert Threshold Exceeded</div>
            <div className="text-2xl font-bold text-red-700">{stats.thresholdExceeded}</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-500">Monitoring Status</div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <div className="font-medium text-green-700">Active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringStats; 