const pool = require('../db');
const monitoredUserRepo = require('../models/MonitoredUserRepo');

// Get all monitored users with their details
exports.getMonitoredUsers = async (req, res) => {
    try {
        const monitoredUsers = await monitoredUserRepo.getAllMonitoredUsers();
        res.status(200).json(monitoredUsers);
    } catch (error) {
        console.error('Error getting monitored users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get a specific monitored user
exports.getMonitoredUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const monitoredUser = await monitoredUserRepo.getMonitoredUser(userId);
        
        if (!monitoredUser) {
            return res.status(404).json({ message: 'Monitored user not found' });
        }
        
        res.status(200).json(monitoredUser);
    } catch (error) {
        console.error(`Error getting monitored user ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add a user to monitoring list
exports.addMonitoredUser = async (req, res) => {
    try {
        const { userId, reason, actionCount } = req.body;
        
        if (!userId || !reason) {
            return res.status(400).json({ message: 'User ID and reason are required' });
        }
        
        // Check if user exists
        const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const monitoredUser = await monitoredUserRepo.addMonitoredUser(userId, reason, actionCount || 0);
        res.status(201).json(monitoredUser);
    } catch (error) {
        console.error('Error adding monitored user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update a monitored user
exports.updateMonitoredUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, action_count, threshold_exceeded } = req.body;
        
        // Check if monitored user exists
        const exists = await monitoredUserRepo.isUserMonitored(userId);
        if (!exists) {
            return res.status(404).json({ message: 'Monitored user not found' });
        }
        
        const updatedUser = await monitoredUserRepo.updateMonitoredUser(userId, {
            reason,
            action_count,
            threshold_exceeded
        });
        
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(`Error updating monitored user ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Remove a user from monitoring
exports.removeMonitoredUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if monitored user exists
        const exists = await monitoredUserRepo.isUserMonitored(userId);
        if (!exists) {
            return res.status(404).json({ message: 'Monitored user not found' });
        }
        
        await monitoredUserRepo.removeMonitoredUser(userId);
        res.status(200).json({ message: 'User removed from monitoring' });
    } catch (error) {
        console.error(`Error removing monitored user ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all suspicious activities
exports.getSuspiciousActivities = async (req, res) => {
    try {
        const { threshold = 5, timeframe = '24 hours', limit = 50, offset = 0 } = req.query;
        
        // Query to find users with suspicious activity patterns
        const result = await pool.query(`
            WITH suspicious_users AS (
                SELECT 
                    user_id,
                    COUNT(*) as action_count,
                    COUNT(DISTINCT activity_type) as activity_types,
                    MAX(created_at) as last_activity
                FROM user_activity_logs
                WHERE created_at > NOW() - INTERVAL $1
                GROUP BY user_id
                HAVING COUNT(*) >= $2
            )
            SELECT 
                s.*,
                u.username,
                u.email,
                u.role,
                m.reason as monitoring_reason,
                m.threshold_exceeded
            FROM suspicious_users s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN monitored_users m ON s.user_id = m.user_id
            ORDER BY s.action_count DESC
            LIMIT $3 OFFSET $4
        `, [timeframe, threshold, limit, offset]);
        
        // Get total count for pagination
        const countResult = await pool.query(`
            SELECT COUNT(*) FROM (
                SELECT user_id
                FROM user_activity_logs
                WHERE created_at > NOW() - INTERVAL $1
                GROUP BY user_id
                HAVING COUNT(*) >= $2
            ) as suspicious_count
        `, [timeframe, threshold]);
        
        res.status(200).json({
            alerts: result.rows,
            total: parseInt(countResult.rows[0].count),
            threshold: parseInt(threshold),
            timeframe: timeframe,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error getting suspicious activities:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get monitoring system stats
exports.getMonitoringStats = async (req, res) => {
    try {
        // 1. Get total monitored users count
        const monitoredUsersCount = await pool.query('SELECT COUNT(*) FROM monitored_users');
        
        // 2. Get users with threshold exceeded
        const thresholdExceededCount = await pool.query(
            'SELECT COUNT(*) FROM monitored_users WHERE threshold_exceeded = true'
        );
        
        // 3. Get total alerts in the last 24 hours
        const recentAlertsCount = await pool.query(`
            SELECT COUNT(DISTINCT user_id) FROM user_activity_logs
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY user_id
            HAVING COUNT(*) >= 10
        `);
        
        // 4. Get most common activity types in alerts
        const activityTypesInAlerts = await pool.query(`
            WITH suspicious_users AS (
                SELECT user_id
                FROM user_activity_logs
                WHERE created_at > NOW() - INTERVAL '24 hours'
                GROUP BY user_id
                HAVING COUNT(*) >= 10
            )
            SELECT activity_type, COUNT(*) as count
            FROM user_activity_logs
            WHERE user_id IN (SELECT user_id FROM suspicious_users)
            GROUP BY activity_type
            ORDER BY count DESC
            LIMIT 5
        `);
        
        // 5. Get hourly alert distribution for the last 24 hours
        const hourlyDistribution = await pool.query(`
            WITH suspicious_users AS (
                SELECT user_id
                FROM user_activity_logs
                WHERE created_at > NOW() - INTERVAL '24 hours'
                GROUP BY user_id
                HAVING COUNT(*) >= 10
            )
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as count
            FROM user_activity_logs
            WHERE 
                user_id IN (SELECT user_id FROM suspicious_users)
                AND created_at > NOW() - INTERVAL '24 hours'
            GROUP BY hour
            ORDER BY hour
        `);
        
        res.status(200).json({
            monitoredUsers: parseInt(monitoredUsersCount.rows[0].count),
            thresholdExceeded: parseInt(thresholdExceededCount.rows[0].count),
            recentAlerts: recentAlertsCount.rows.length,
            activityTypes: activityTypesInAlerts.rows,
            hourlyDistribution: hourlyDistribution.rows
        });
    } catch (error) {
        console.error('Error getting monitoring stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset alert for a specific user
exports.resetUserAlert = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user is being monitored
        const isMonitored = await monitoredUserRepo.isUserMonitored(userId);
        
        if (isMonitored) {
            // Update the user to reset threshold_exceeded flag
            await monitoredUserRepo.updateMonitoredUser(userId, {
                threshold_exceeded: false,
                action_count: 0
            });
            
            res.status(200).json({ message: 'Alert reset successfully' });
        } else {
            res.status(404).json({ message: 'User is not being monitored' });
        }
    } catch (error) {
        console.error(`Error resetting alert for user ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 