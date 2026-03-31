const User = require('../models/User');

// In-memory notification store (in production, use Redis or database)
const notifications = new Map();

class NotificationService {
  constructor() {
    this.notifications = notifications;
  }

  // Send notification to a specific user
  async sendNotification(userId, message, type = 'info', data = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User ${userId} not found for notification`);
        return false;
      }

      const notification = {
        id: Date.now().toString(),
        userId: userId.toString(),
        message,
        type, // 'info', 'success', 'warning', 'error'
        data,
        timestamp: new Date(),
        read: false
      };

      // Store notification
      if (!this.notifications.has(userId.toString())) {
        this.notifications.set(userId.toString(), []);
      }
      
      const userNotifications = this.notifications.get(userId.toString());
      userNotifications.push(notification);

      // Keep only last 100 notifications per user
      if (userNotifications.length > 100) {
        userNotifications.splice(0, userNotifications.length - 100);
      }

      console.log(`Notification sent to user ${userId}: ${message}`);
      
      // In production, you would integrate with:
      // - Email service (SendGrid, AWS SES)
      // - SMS service (Twilio)
      // - Push notifications (Firebase)
      // - WebSocket for real-time updates
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Get notifications for a user
  getNotifications(userId, limit = 20) {
    const userNotifications = this.notifications.get(userId.toString()) || [];
    return userNotifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  // Mark notification as read
  markAsRead(userId, notificationId) {
    const userNotifications = this.notifications.get(userId.toString()) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  // Mark all notifications as read for a user
  markAllAsRead(userId) {
    const userNotifications = this.notifications.get(userId.toString()) || [];
    userNotifications.forEach(notification => {
      notification.read = true;
    });
    return true;
  }

  // Get unread notification count
  getUnreadCount(userId) {
    const userNotifications = this.notifications.get(userId.toString()) || [];
    return userNotifications.filter(n => !n.read).length;
  }

  // Send bulk notifications
  async sendBulkNotification(userIds, message, type = 'info', data = {}) {
    const results = [];
    for (const userId of userIds) {
      const result = await this.sendNotification(userId, message, type, data);
      results.push({ userId, success: result });
    }
    return results;
  }

  // Send notification to all users with a specific role
  async sendNotificationToRole(role, message, type = 'info', data = {}) {
    try {
      const users = await User.find({ role, isActive: true }).select('_id');
      const userIds = users.map(user => user._id.toString());
      return await this.sendBulkNotification(userIds, message, type, data);
    } catch (error) {
      console.error('Error sending notification to role:', error);
      return [];
    }
  }

  // Send subscription-related notifications
  async sendSubscriptionNotification(userId, event, subscriptionData) {
    const notifications = {
      created: {
        message: 'Your subscription has been created successfully!',
        type: 'success'
      },
      renewed: {
        message: 'Your subscription has been renewed successfully!',
        type: 'success'
      },
      cancelled: {
        message: 'Your subscription has been cancelled.',
        type: 'warning'
      },
      expiring: {
        message: 'Your subscription is expiring soon. Please renew to continue service.',
        type: 'warning'
      },
      expired: {
        message: 'Your subscription has expired. Please renew to restore service.',
        type: 'error'
      },
      upgraded: {
        message: 'Your subscription has been upgraded successfully!',
        type: 'success'
      },
      downgraded: {
        message: 'Your subscription has been downgraded.',
        type: 'info'
      }
    };

    const notification = notifications[event];
    if (notification) {
      return await this.sendNotification(
        userId, 
        notification.message, 
        notification.type, 
        { subscription: subscriptionData }
      );
    }
  }
}

// Create singleton instance
const notifier = new NotificationService();

// Export both the instance and the class
module.exports = notifier;
module.exports.NotificationService = NotificationService;
