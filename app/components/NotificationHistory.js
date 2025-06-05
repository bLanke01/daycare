// components/NotificationHistory.js
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function NotificationHistory({ userId, userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      loadNotificationHistory();
    }
  }, [userId, filter, timeRange]);

  const loadNotificationHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Query notifications from Firestore
      let q = query(
        collection(db, 'emailNotifications'),
        where('sentAt', '>=', startDate.toISOString()),
        where('sentAt', '<=', endDate.toISOString()),
        orderBy('sentAt', 'desc'),
        limit(50)
      );

      // For parents, filter by their email
      // For admins, show all notifications or filter by admin emails
      const snapshot = await getDocs(q);
      
      let notificationList = [];
      const userEmail = getUserEmail(); // We'll need to get this from user context

      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Filter based on user role and email
        if (userRole === 'parent') {
          if (data.to === userEmail) {
            notificationList.push({ id: doc.id, ...data });
          }
        } else if (userRole === 'admin') {
          // For admins, show notifications sent to admin emails or system notifications
          if (data.metadata?.type?.includes('admin') || isAdminEmail(data.to)) {
            notificationList.push({ id: doc.id, ...data });
          }
        }
      });

      // Apply type filter
      if (filter !== 'all') {
        notificationList = notificationList.filter(notification => 
          notification.metadata?.type?.includes(filter)
        );
      }

      setNotifications(notificationList);
    } catch (error) {
      console.error('Error loading notification history:', error);
      setError('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  const getUserEmail = () => {
    // This should get the current user's email from auth context
    // For now, return a placeholder
    return 'user@example.com';
  };

  const isAdminEmail = (email) => {
    // This should check if the email belongs to an admin
    // For now, return a simple check
    return email && email.includes('admin');
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'new_event': '📅',
      'admin_new_event': '📅',
      'parent_new_event': '📅',
      'new_invoice': '💰',
      'invoice_paid': '✅',
      'payment_confirmation': '✅',
      'system_alert': '🚨',
      'general': '📧'
    };
    
    return iconMap[type] || '📧';
  };

  const getNotificationTypeLabel = (type) => {
    const labelMap = {
      'new_event': 'Calendar Event',
      'admin_new_event': 'Admin: New Event',
      'parent_new_event': 'New Event',
      'new_invoice': 'New Invoice',
      'invoice_paid': 'Payment Confirmed',
      'payment_confirmation': 'Payment Confirmed',
      'system_alert': 'System Alert',
      'general': 'General'
    };
    
    return labelMap[type] || 'Notification';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return '#4caf50';
      case 'delivered': return '#2196f3';
      case 'failed': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div className="notification-history">
        <div className="loading">Loading notification history...</div>
      </div>
    );
  }

  return (
    <div className="notification-history">
      <div className="history-header">
        <h2>📜 Notification History</h2>
        <p className="history-description">
          {userRole === 'admin' 
            ? 'View all notifications sent by the system and track their delivery status.'
            : 'View all email notifications you\'ve received from the daycare.'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <div className="filter-group">
          <label>Notification Type:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Notifications</option>
            <option value="event">📅 Calendar Events</option>
            {userRole === 'parent' && (
              <>
                <option value="invoice">💰 Invoices</option>
                <option value="payment">✅ Payments</option>
              </>
            )}
            {userRole === 'admin' && (
              <>
                <option value="admin">🔧 Admin Notifications</option>
                <option value="system">🚨 System Alerts</option>
              </>
            )}
          </select>
        </div>

        <div className="filter-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        <button 
          className="refresh-btn"
          onClick={loadNotificationHistory}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-number">{notifications.length}</div>
          <div className="stat-label">Total Notifications</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {notifications.filter(n => n.status === 'sent').length}
          </div>
          <div className="stat-label">Successfully Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {notifications.filter(n => 
              new Date(n.sentAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length}
          </div>
          <div className="stat-label">This Week</div>
        </div>
      </div>

      {/* Notification List */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">📭</div>
            <h3>No Notifications Found</h3>
            <p>
              {filter === 'all' 
                ? 'No notifications have been sent in the selected time range.'
                : `No ${getNotificationTypeLabel(filter).toLowerCase()} notifications found.`
              }
            </p>
          </div>
        ) : (
          notifications.map(notification => (
            <div key={notification.id} className="notification-item">
              <div className="notification-header">
                <div className="notification-type">
                  <span className="type-icon">
                    {getNotificationIcon(notification.metadata?.type)}
                  </span>
                  <span className="type-label">
                    {getNotificationTypeLabel(notification.metadata?.type)}
                  </span>
                </div>
                <div className="notification-time">
                  {formatDate(notification.sentAt)}
                </div>
              </div>

              <div className="notification-content">
                <h4 className="notification-subject">{notification.subject}</h4>
                <div className="notification-recipient">
                  <strong>To:</strong> {notification.to}
                </div>
                
                {notification.metadata && (
                  <div className="notification-metadata">
                    {notification.metadata.eventId && (
                      <span className="metadata-item">Event ID: {notification.metadata.eventId}</span>
                    )}
                    {notification.metadata.invoiceId && (
                      <span className="metadata-item">Invoice ID: {notification.metadata.invoiceId}</span>
                    )}
                    {notification.metadata.amount && (
                      <span className="metadata-item">Amount: ${notification.metadata.amount}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="notification-status">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(notification.status) }}
                >
                  {notification.status?.toUpperCase() || 'SENT'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="history-footer">
        <p>
          <strong>📧 Email Delivery:</strong> Notifications are typically delivered within 1-2 minutes. 
          If you're not receiving emails, please check your spam folder and contact support.
        </p>
        {userRole === 'admin' && (
          <p>
            <strong>🔧 Admin Note:</strong> This shows notifications sent by the system. 
            Parent notification preferences can affect delivery. Users can manage their 
            settings in their account preferences.
          </p>
        )}
      </div>
    </div>
  );
}