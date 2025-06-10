'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NotificationBell = ({ userId, userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // TODO: Implement real-time notification fetching
    // This is just a placeholder
    setNotifications([
      {
        id: 1,
        title: 'New Calendar Event',
        message: 'A new event has been added to the calendar',
        time: '5 min ago',
        read: false,
        type: 'event'
      },
      {
        id: 2,
        title: 'Payment Received',
        message: 'Payment for invoice #INV-001 has been received',
        time: '1 hour ago',
        read: true,
        type: 'payment'
      }
    ]);
    setUnreadCount(1);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event': return '📅';
      case 'payment': return '💰';
      case 'message': return '💬';
      default: return '📢';
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <label 
        tabIndex={0} 
        className="btn btn-ghost btn-circle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="badge badge-primary badge-sm indicator-item">
              {unreadCount}
            </span>
          )}
        </div>
      </label>
      
      <div 
        tabIndex={0} 
        className={`dropdown-content z-[1] card card-compact w-80 shadow bg-base-100 ${isOpen ? 'block' : 'hidden'}`}
      >
        <div className="card-body">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <button className="btn btn-ghost btn-xs">
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="divider my-0"></div>
          
          {notifications.length === 0 ? (
            <div className="py-4 text-center text-base-content/70">
              No notifications
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`flex items-start gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors ${
                    notification.read ? 'opacity-70' : ''
                  }`}
                >
                  <div className="text-xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>
                    <p className="text-xs text-base-content/70 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-base-content/50 mt-1">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {notifications.length > 0 && (
            <>
              <div className="divider my-0"></div>
              <div className="card-actions">
                <Link 
                  href={`/${userRole}/notifications`} 
                  className="btn btn-primary btn-sm w-full"
                >
                  View All Notifications
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBell; 