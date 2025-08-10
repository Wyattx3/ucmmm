import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite.js';

class PresenceService {
    constructor() {
        this.heartbeatInterval = null;
        this.currentUserId = null;
        this.isActive = true;
        this.lastActivityTime = Date.now();
        
        // Track user activity
        this.setupActivityTrackers();
    }

    setupActivityTrackers() {
        // Track mouse movement, clicks, keyboard input
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivityTime = Date.now();
                if (!this.isActive) {
                    this.isActive = true;
                    this.updateOnlineStatus(true);
                }
            }, { passive: true });
        });

        // Detect when user becomes inactive (5 minutes of no activity)
        setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - this.lastActivityTime;
            const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

            if (this.isActive && timeSinceLastActivity > IDLE_THRESHOLD) {
                this.isActive = false;
                this.updateOnlineStatus(false);
            }
        }, 30000); // Check every 30 seconds

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isActive = false;
                this.updateOnlineStatus(false);
            } else {
                this.lastActivityTime = Date.now();
                this.isActive = true;
                this.updateOnlineStatus(true);
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.setOffline();
        });
    }

    async startPresence(userId) {
        try {
            this.currentUserId = userId;
            console.log(`🟢 Starting presence tracking for user: ${userId}`);

            // Set initial online status
            await this.updateOnlineStatus(true);

            // Start heartbeat to maintain online status
            this.heartbeatInterval = setInterval(() => {
                if (this.isActive) {
                    this.updateOnlineStatus(true);
                }
            }, 60000); // Update every minute when active

            console.log('✅ Presence tracking started successfully');
        } catch (error) {
            console.warn('❌ Failed to start presence tracking:', error.message);
        }
    }

    async stopPresence() {
        try {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }

            if (this.currentUserId) {
                await this.setOffline();
            }

            console.log('🔴 Presence tracking stopped');
        } catch (error) {
            console.warn('Failed to stop presence tracking:', error.message);
        }
    }

    async updateOnlineStatus(isOnline) {
        if (!this.currentUserId) return;

        try {
            const updateData = {
                isOnline: isOnline,
                lastSeen: new Date().toISOString()
            };

            if (isOnline) {
                updateData.lastActiveAt = new Date().toISOString();
            }

            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                this.currentUserId,
                updateData
            );

            // console.log(`👤 User status updated: ${isOnline ? 'Online' : 'Offline'}`);
        } catch (error) {
            // Suppress common errors during database setup
            if (error.message.includes('Unknown attribute') || 
                error.message.includes('Load failed') ||
                error.message.includes('network connection was lost')) {
                // Silent fail during attribute setup period
                return;
            }
            console.warn('Failed to update online status:', error.message);
        }
    }

    async setOffline() {
        if (!this.currentUserId) return;

        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                this.currentUserId,
                {
                    isOnline: false,
                    lastSeen: new Date().toISOString()
                }
            );
        } catch (error) {
            // Silent fail for offline status update
        }
    }

    async getUserStatus(userId) {
        try {
            const user = await databases.getDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                userId
            );

            // Handle case where presence attributes don't exist yet
            const lastSeen = user.lastSeen ? new Date(user.lastSeen) : null;
            const isOnline = user.isOnline || false;

            // Consider user offline if last seen was more than 3 minutes ago
            const ONLINE_THRESHOLD = 3 * 60 * 1000; // 3 minutes
            const isRecentlyActive = lastSeen && (Date.now() - lastSeen.getTime()) < ONLINE_THRESHOLD;

            return {
                isOnline: isOnline && isRecentlyActive,
                lastSeen: lastSeen,
                status: this.getStatusText(isOnline && isRecentlyActive, lastSeen)
            };
        } catch (error) {
            // During database attribute setup, provide graceful fallbacks
            if (error.message.includes('Unknown attribute') || 
                error.message.includes('Load failed') ||
                error.message.includes('network connection was lost')) {
                return {
                    isOnline: false,
                    lastSeen: null,
                    status: 'Setting up...'
                };
            }
            console.warn(`Failed to get user status for ${userId}:`, error.message);
            return {
                isOnline: false,
                lastSeen: null,
                status: 'Offline'
            };
        }
    }

    getStatusText(isOnline, lastSeen) {
        if (isOnline) {
            return 'Online';
        }

        if (!lastSeen) {
            return 'Last seen unknown';
        }

        const now = Date.now();
        const timeDiff = now - lastSeen.getTime();

        // Less than 1 minute
        if (timeDiff < 60 * 1000) {
            return 'Last seen just now';
        }

        // Less than 1 hour
        if (timeDiff < 60 * 60 * 1000) {
            const minutes = Math.floor(timeDiff / (60 * 1000));
            return `Last seen ${minutes}m ago`;
        }

        // Less than 24 hours
        if (timeDiff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(timeDiff / (60 * 60 * 1000));
            return `Last seen ${hours}h ago`;
        }

        // Less than 7 days
        if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
            const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
            return `Last seen ${days}d ago`;
        }

        // Format as date for older
        return `Last seen ${lastSeen.toLocaleDateString()}`;
    }

    // Simulate realistic online patterns for demo users
    simulateRealisticStatus(userId, userIndex) {
        const patterns = [
            // Always online (very active user)
            { online: true, probability: 0.9 },
            // Often online during day hours
            { online: this.isDayTime() ? true : Math.random() > 0.7, probability: 0.8 },
            // Random moderate activity
            { online: Math.random() > 0.6, probability: 0.5 },
            // Rarely online
            { online: Math.random() > 0.8, probability: 0.2 },
            // Completely offline
            { online: false, probability: 0.1 }
        ];

        const pattern = patterns[userIndex % patterns.length];
        return pattern.online;
    }

    isDayTime() {
        const hour = new Date().getHours();
        return hour >= 8 && hour <= 22; // 8 AM to 10 PM
    }

    // Get bulk status for multiple users (optimized)
    async getBulkUserStatus(userIds) {
        try {
            const results = await Promise.allSettled(
                userIds.map(userId => this.getUserStatus(userId))
            );

            const statusMap = {};
            results.forEach((result, index) => {
                const userId = userIds[index];
                if (result.status === 'fulfilled') {
                    statusMap[userId] = result.value;
                } else {
                    // Fallback to simulated status for demo
                    statusMap[userId] = {
                        isOnline: this.simulateRealisticStatus(userId, index),
                        lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                        status: 'Simulated'
                    };
                }
            });

            return statusMap;
        } catch (error) {
            console.warn('Failed to get bulk user status:', error.message);
            return {};
        }
    }
}

// Create singleton instance
const presenceService = new PresenceService();

export default presenceService;