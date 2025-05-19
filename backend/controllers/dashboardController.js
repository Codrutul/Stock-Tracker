const pool = require('../db');

// Get system overview statistics for admin dashboard
exports.getSystemOverview = async (req, res) => {
    try {
        // Get user statistics
        const userStatsQuery = `
            SELECT 
                COUNT(*) AS total_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) AS admin_count,
                COUNT(CASE WHEN role = 'regular' THEN 1 END) AS regular_count,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS new_users_last_week
            FROM users
        `;
        const userStats = await pool.query(userStatsQuery);
        
        // Get activity statistics
        const activityStatsQuery = `
            SELECT 
                COUNT(*) AS total_activities,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) AS activities_last_24h,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS activities_last_week
            FROM user_activity_logs
        `;
        const activityStats = await pool.query(activityStatsQuery);
        
        // Get activity breakdown by type
        const activityTypesQuery = `
            SELECT activity_type, COUNT(*) as count
            FROM user_activity_logs
            GROUP BY activity_type
            ORDER BY count DESC
        `;
        const activityTypes = await pool.query(activityTypesQuery);
        
        // Get stock statistics
        const stockStatsQuery = `
            SELECT 
                COUNT(*) AS total_stocks,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS new_stocks_last_week,
                AVG(price) AS avg_price,
                MIN(price) AS min_price,
                MAX(price) AS max_price
            FROM stocks
        `;
        const stockStats = await pool.query(stockStatsQuery);
        
        // Get portfolio statistics
        const portfolioStatsQuery = `
            SELECT 
                COUNT(*) AS total_entries,
                COUNT(DISTINCT "userId") AS users_with_portfolios,
                SUM(quantity) AS total_shares,
                AVG(quantity) AS avg_shares_per_entry
            FROM portfolios
        `;
        const portfolioStats = await pool.query(portfolioStatsQuery);
        
        // Return combined dashboard data
        res.status(200).json({
            users: userStats.rows[0],
            activity: activityStats.rows[0],
            activityTypes: activityTypes.rows,
            stocks: stockStats.rows[0],
            portfolios: portfolioStats.rows[0]
        });
    } catch (error) {
        console.error('Error getting system overview:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get recent user registrations for admin dashboard
exports.getRecentRegistrations = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const query = `
            SELECT id, username, email, role, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error getting recent registrations:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user activity trends over time
exports.getActivityTrends = async (req, res) => {
    try {
        const { timeframe = 'daily', days = 30 } = req.query;
        
        let interval;
        let extractFormat;
        
        // Set SQL interval and format based on timeframe
        if (timeframe === 'hourly') {
            interval = 'hour';
            extractFormat = 'HOUR';
        } else if (timeframe === 'weekly') {
            interval = 'week';
            extractFormat = 'WEEK';
        } else if (timeframe === 'monthly') {
            interval = 'month';
            extractFormat = 'MONTH';
        } else {
            // Default to daily
            interval = 'day';
            extractFormat = 'DAY';
        }
        
        const query = `
            SELECT 
                DATE_TRUNC('${interval}', created_at) AS time_period,
                COUNT(*) AS activity_count
            FROM user_activity_logs
            WHERE created_at > NOW() - INTERVAL '${days} days'
            GROUP BY time_period
            ORDER BY time_period
        `;
        
        const result = await pool.query(query);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error getting activity trends:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get most active users for admin dashboard
exports.getMostActiveUsers = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const query = `
            SELECT 
                u.id, 
                u.username,
                u.email,
                u.role,
                COUNT(l.id) AS activity_count,
                MAX(l.created_at) AS last_activity
            FROM users u
            JOIN user_activity_logs l ON u.id = l.user_id
            GROUP BY u.id, u.username, u.email, u.role
            ORDER BY activity_count DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error getting most active users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 