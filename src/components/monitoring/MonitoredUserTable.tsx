import React from 'react';

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

interface MonitoredUserTableProps {
  users: MonitoredUser[];
  onResetAlert: (userId: number) => void;
  onRemoveUser: (userId: number) => void;
}

const MonitoredUserTable: React.FC<MonitoredUserTableProps> = ({ users, onResetAlert, onRemoveUser }) => {
  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Monitored Users ({users.length})</h2>
      
      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No users are currently being monitored
        </div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 border-b text-left">User</th>
              <th className="py-2 px-4 border-b text-left">Reason</th>
              <th className="py-2 px-4 border-b text-center">Actions</th>
              <th className="py-2 px-4 border-b text-center">Status</th>
              <th className="py-2 px-4 border-b text-center">First Detected</th>
              <th className="py-2 px-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">Role: {user.role}</div>
                </td>
                <td className="py-3 px-4 border-b">
                  <div className="max-w-sm">{user.reason}</div>
                </td>
                <td className="py-3 px-4 border-b text-center">
                  <div className="font-bold">{user.action_count}</div>
                </td>
                <td className="py-3 px-4 border-b text-center">
                  {user.threshold_exceeded ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Alert
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Monitoring
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 border-b text-center">
                  <div>{new Date(user.detected_at).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(user.updated_at).toLocaleString()}
                  </div>
                </td>
                <td className="py-3 px-4 border-b text-right">
                  <div className="flex justify-center space-x-2">
                    {user.threshold_exceeded && (
                      <button
                        onClick={() => onResetAlert(user.user_id)}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                      >
                        Reset Alert
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveUser(user.user_id)}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MonitoredUserTable; 