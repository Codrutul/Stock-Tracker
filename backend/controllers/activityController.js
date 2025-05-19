const pool = require('../db');

// Get activity logs for a specific user
exports.getUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0, activityType } = req.query;
        
        let query = `
            SELECT * FROM user_activity_logs 
            WHERE user_id = $1
        `;
        
        const queryParams = [userId];
        
        // Add filter by activity type if provided
        if (activityType) {
            query += ` AND activity_type = $${queryParams.length + 1}`;
            queryParams.push(activityType);
        }
        
        // Add sorting and pagination
        query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        
        const result = await pool.query(query, queryParams);
        
        // Get total count for pagination
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM user_activity_logs WHERE user_id = $1 ${activityType ? 'AND activity_type = $2' : ''}`,
            activityType ? [userId, activityType] : [userId]
        );
        
        res.status(200).json({
            logs: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error getting user activity logs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all activity logs (admin only)
exports.getAllActivity = async (req, res) => {
    try {
        const { limit = 50, offset = 0, userId, activityType, startDate, endDate } = req.query;
        
        const queryParams = [];
        let conditions = [];
        
        // Build WHERE clause based on filters
        if (userId) {
            queryParams.push(userId);
            conditions.push(`user_id = $${queryParams.length}`);
        }
        
        if (activityType) {
            queryParams.push(activityType);
            conditions.push(`activity_type = $${queryParams.length}`);
        }
        
        if (startDate) {
            queryParams.push(startDate);
            conditions.push(`created_at >= $${queryParams.length}`);
        }
        
        if (endDate) {
            queryParams.push(endDate);
            conditions.push(`created_at <= $${queryParams.length}`);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Main query with pagination
        let query = `
            SELECT l.*, u.username 
            FROM user_activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(limit, offset);
        
        const result = await pool.query(query, queryParams);
        
        // Get total count for pagination
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const countQuery = `SELECT COUNT(*) FROM user_activity_logs ${whereClause}`;
        const countResult = await pool.query(countQuery, countParams);
        
        res.status(200).json({
            logs: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error getting all activity logs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get activity summary statistics
exports.getActivityStats = async (req, res) => {
    try {
        // Get activity counts by type
        const activityTypeResult = await pool.query(`
            SELECT activity_type, COUNT(*) as count
            FROM user_activity_logs
            GROUP BY activity_type
            ORDER BY count DESC
        `);
        
        // Get most active users
        const activeUsersResult = await pool.query(`
            SELECT u.id, u.username, COUNT(*) as activity_count
            FROM user_activity_logs l
            JOIN users u ON l.user_id = u.id
            GROUP BY u.id, u.username
            ORDER BY activity_count DESC
            LIMIT 10
        `);
        
        // Get activity counts by day for the last 30 days
        const dailyActivityResult = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM user_activity_logs
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `);
        
        // Get activity count by hour of day
        const hourlyActivityResult = await pool.query(`
            SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
            FROM user_activity_logs
            GROUP BY hour
            ORDER BY hour
        `);
        
        res.status(200).json({
            byType: activityTypeResult.rows,
            activeUsers: activeUsersResult.rows,
            dailyActivity: dailyActivityResult.rows,
            hourlyActivity: hourlyActivityResult.rows
        });
    } catch (error) {
        console.error('Error getting activity statistics:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get recent login attempts (success/failure)
exports.getLoginActivity = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
        const result = await pool.query(`
            SELECT l.*, u.username
            FROM user_activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.activity_type = 'authentication'
            ORDER BY l.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const countResult = await pool.query(`
            SELECT COUNT(*) FROM user_activity_logs 
            WHERE activity_type = 'authentication'
        `);
        
        res.status(200).json({
            logs: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error getting login activity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 