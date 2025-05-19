const pool = require('../db');
const monitoredUserRepo = require('../models/MonitoredUserRepo');

class SuspiciousActivityMonitor {
    constructor() {
        this.isRunning = false;
        this.monitoringInterval = 60000; // 1 minute
        this.activityThreshold = 10; // Number of actions to trigger an alert
        this.timeWindow = '15 minutes'; // Time window to look for suspicious activity
        this.activityTypes = ['authentication', 'authorization', 'view', 'update', 'delete', 'transaction'];
    }

    // Start the background monitoring process
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Suspicious activity monitor is already running');
            return;
        }

        this.isRunning = true;
        console.log('🔍 Starting suspicious activity monitoring system');
        
        // Initialize MonitoredUserRepo
        await monitoredUserRepo.initialize();
        
        // Run the monitoring loop
        this.runMonitoringLoop();
    }

    // Stop the monitoring process
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Suspicious activity monitor is not running');
            return;
        }

        this.isRunning = false;
        console.log('🛑 Stopping suspicious activity monitoring system');
        
        if (this.monitoringTimer) {
            clearTimeout(this.monitoringTimer);
            this.monitoringTimer = null;
        }
    }

    // Main monitoring loop that runs periodically
    async runMonitoringLoop() {
        while (this.isRunning) {
            try {
                console.log(`🔍 Running suspicious activity detection (${new Date().toISOString()})`);
                
                await this.detectSuspiciousActivity();
                await this.updateMonitoredUsers();
                
                // Wait for the next interval
                await new Promise(resolve => {
                    this.monitoringTimer = setTimeout(resolve, this.monitoringInterval);
                });
            } catch (error) {
                console.error('Error in monitoring loop:', error);
                
                // Wait a shorter time before retrying after an error
                await new Promise(resolve => {
                    this.monitoringTimer = setTimeout(resolve, 10000);
                });
            }
        }
    }

    // Detect suspicious activity patterns
    async detectSuspiciousActivity() {
        try {
            // Find users with high activity counts in the recent time window
            const result = await pool.query(`
                SELECT 
                    user_id, 
                    COUNT(*) as action_count,
                    COUNT(DISTINCT activity_type) as distinct_activities,
                    ARRAY_AGG(DISTINCT activity_type) as activity_types,
                    MAX(created_at) as latest_activity
                FROM user_activity_logs
                WHERE created_at > NOW() - $1::interval
                GROUP BY user_id
                HAVING COUNT(*) >= $2
            `, [this.timeWindow, this.activityThreshold]);
            
            if (result.rows.length > 0) {
                console.log(`🚨 Detected ${result.rows.length} users with suspicious activity patterns`);
                
                // Process each user with suspicious activity
                for (const suspicious of result.rows) {
                    const { user_id, action_count, distinct_activities, activity_types } = suspicious;
                    
                    // Get user details
                    const userResult = await pool.query(
                        'SELECT username, email, role FROM users WHERE id = $1', 
                        [user_id]
                    );
                    
                    if (userResult.rows.length === 0) {
                        console.warn(`User with ID ${user_id} not found, skipping`);
                        continue;
                    }
                    
                    const user = userResult.rows[0];
                    
                    // Calculate suspicion score based on activity pattern
                    const suspicionScore = this.calculateSuspicionScore(action_count, distinct_activities, activity_types);
                    
                    // If score is high enough, add or update user in monitored list
                    if (suspicionScore >= 0.7) {
                        const reason = `High activity rate: ${action_count} actions (${activity_types.join(', ')}) in ${this.timeWindow}`;
                        const isMonitored = await monitoredUserRepo.isUserMonitored(user_id);
                        
                        if (isMonitored) {
                            // Update existing monitored user
                            const currentUser = await monitoredUserRepo.getMonitoredUser(user_id);
                            
                            await monitoredUserRepo.updateMonitoredUser(user_id, {
                                reason: reason,
                                action_count: currentUser.action_count + action_count,
                                threshold_exceeded: true
                            });
                            
                            console.log(`👁️ Updated monitored user ${user.username} (ID: ${user_id})`);
                        } else {
                            // Add new user to monitored list
                            await monitoredUserRepo.addMonitoredUser(user_id, reason, action_count);
                            
                            console.log(`👁️ Added new user ${user.username} (ID: ${user_id}) to monitored list`);
                            
                            // Create a system-wide alert for new monitored users
                            this.broadcastAlert({
                                type: 'new_monitored_user',
                                userId: user_id,
                                username: user.username,
                                reason: reason,
                                activityCount: action_count,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            } else {
                console.log('✅ No suspicious activity detected in this interval');
            }
        } catch (error) {
            console.error('Error detecting suspicious activity:', error);
            throw error;
        }
    }

    // Update existing monitored users based on their recent activity
    async updateMonitoredUsers() {
        try {
            // Get all currently monitored users
            const monitoredUsers = await monitoredUserRepo.getAllMonitoredUsers();
            
            if (monitoredUsers.length === 0) {
                return;
            }
            
            console.log(`Updating status for ${monitoredUsers.length} monitored users`);
            
            for (const user of monitoredUsers) {
                // Get recent activity count for this user
                const activityResult = await pool.query(`
                    SELECT COUNT(*) as count 
                    FROM user_activity_logs 
                    WHERE user_id = $1 AND created_at > NOW() - $2::interval
                `, [user.user_id, this.timeWindow]);
                
                const recentActivityCount = parseInt(activityResult.rows[0].count);
                
                // If still high activity, maintain or escalate monitoring
                if (recentActivityCount >= this.activityThreshold) {
                    // If not already marked as threshold exceeded, update it
                    if (!user.threshold_exceeded) {
                        await monitoredUserRepo.updateMonitoredUser(user.user_id, {
                            action_count: user.action_count + recentActivityCount,
                            threshold_exceeded: true
                        });
                        
                        console.log(`🚨 User ${user.username} (ID: ${user.user_id}) exceeded threshold`);
                        
                        // Broadcast alert for threshold exceeded
                        this.broadcastAlert({
                            type: 'threshold_exceeded',
                            userId: user.user_id,
                            username: user.username,
                            actionCount: user.action_count + recentActivityCount,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                // If activity has reduced, could potentially remove from monitoring in the future
                // but for now we keep them monitored, just update the action count
                else {
                    await monitoredUserRepo.updateMonitoredUser(user.user_id, {
                        action_count: user.action_count + recentActivityCount
                    });
                }
            }
        } catch (error) {
            console.error('Error updating monitored users:', error);
            throw error;
        }
    }

    // Calculate a suspicion score based on activity patterns
    calculateSuspicionScore(actionCount, distinctActivities, activityTypes) {
        // Base score from activity count (0.5 means right at threshold)
        let score = actionCount / (this.activityThreshold * 2);
        
        // Increase score if many distinct activity types (more suspicious)
        const activityTypeRatio = distinctActivities / this.activityTypes.length;
        score += activityTypeRatio * 0.3;
        
        // Higher score if includes high-risk activities
        const highRiskActivities = ['delete', 'transaction', 'authorization'];
        const hasHighRiskActivity = activityTypes.some(type => highRiskActivities.includes(type));
        
        if (hasHighRiskActivity) {
            score += 0.2;
        }
        
        // Cap score at 1.0
        return Math.min(score, 1.0);
    }

    // Broadcast an alert to connected clients
    broadcastAlert(alert) {
        // If global broadcast function is available, use it
        if (global.broadcastData) {
            global.broadcastData({
                type: 'security_alert',
                alert: alert
            });
        }
        
        // Log the alert
        console.log(`🚨 SECURITY ALERT: ${alert.type} for user ${alert.username} (${alert.userId})`);
    }
}

// Export a singleton instance
module.exports = new SuspiciousActivityMonitor(); 