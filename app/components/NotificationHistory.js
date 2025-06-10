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
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content">
          <span className="text-primary">Notification</span> History
        </h1>

        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">Search</span>
                </label>
                <input
                  type="text"
                  placeholder="Search by message or recipient..."
                  className="input input-bordered"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Type</span>
                </label>
                <select
                  className="select select-bordered"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
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
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                No notifications found
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="card bg-base-200">
                    <div className="card-body">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">
                          {getNotificationIcon(notification.metadata?.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold">
                                {notification.subject}
                              </h3>
                              <p className="text-sm text-base-content/70">
                                {formatDate(notification.sentAt)}
                              </p>
                            </div>
                            <div className={`badge ${getStatusColor(notification.status) === '#4caf50' ? 'badge-success' : getStatusColor(notification.status) === '#2196f3' ? 'badge-info' : getStatusColor(notification.status) === '#f44336' ? 'badge-error' : getStatusColor(notification.status) === '#ff9800' ? 'badge-warning' : 'badge-ghost'}`}>
                              {notification.status}
                            </div>
                          </div>
                          <p className="text-base-content whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          {notification.error && (
                            <div className="mt-2 text-sm text-error">
                              Error: {notification.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Notifications</div>
            <div className="stat-value">{notifications.length}</div>
            <div className="stat-desc">In selected filter</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Sent</div>
            <div className="stat-value text-success">
              {notifications.filter(n => n.status === 'sent').length}
            </div>
            <div className="stat-desc text-success">Delivered successfully</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Failed</div>
            <div className="stat-value text-error">
              {notifications.filter(n => n.status === 'failed').length}
            </div>
            <div className="stat-desc text-error">Delivery failed</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Pending</div>
            <div className="stat-value text-warning">
              {notifications.filter(n => n.status === 'pending').length}
            </div>
            <div className="stat-desc text-warning">Awaiting delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
}