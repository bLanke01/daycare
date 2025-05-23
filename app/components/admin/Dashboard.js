// components/admin/Dashboard.js
'use client';

import Link from 'next/link';
import { useState } from 'react';

const Dashboard = () => {
  // Mock data for dashboard
  const dashboardData = {
    totalChildren: 45,
    totalStaff: 12,
    todayAttendance: 38,
    pendingPayments: 8,
    recentAnnouncements: 3
  };

  // Mock data for recent activities
  const recentActivities = [
    { time: '10:15 AM', activity: 'New child registration: Emma Thompson' },
    { time: '09:30 AM', activity: 'Payment received: $250 from John Davis' },
    { time: 'Yesterday', activity: 'Staff absence: Sarah Johnson (Medical Leave)' },
    { time: 'Yesterday', activity: 'Announcement posted: "Summer Camp Registration"' }
  ];

  return (
    <div className="admin-dashboard">
      <h1>Staff Dashboard</h1>
      
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Children</h3>
          <p className="summary-number">{dashboardData.totalChildren}</p>
          <Link href="/admin/children">View Details</Link>
        </div>
        
        <div className="summary-card">
          <h3>Total Staff</h3>
          <p className="summary-number">{dashboardData.totalStaff}</p>
          <Link href="/admin/staff">Manage Staff</Link>
        </div>
        
        <div className="summary-card">
          <h3>Today's Attendance</h3>
          <p className="summary-number">{dashboardData.todayAttendance}</p>
          <Link href="/admin/attendance">Attendance Records</Link>
        </div>
        
        <div className="summary-card">
          <h3>Pending Payments</h3>
          <p className="summary-number">{dashboardData.pendingPayments}</p>
          <Link href="/admin/payments">Payment Details</Link>
        </div>
      </div>
      
      <div className="dashboard-widgets">
        <div className="widget">
          <h2>Recent Activities</h2>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-time">{activity.time}</span>
                <p>{activity.activity}</p>
              </div>
            ))}
          </div>
          <Link href="/admin/activity-log">View All Activities</Link>
        </div>
        
        <div className="widget">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link href="/admin/attendance">
              <button className="action-btn">Mark Attendance</button>
            </Link>
            <Link href="/admin/messages">
              <button className="action-btn">Send Announcement</button>
            </Link>
            <Link href="/admin/children">
              <button className="action-btn">Add New Child</button>
            </Link>
            <Link href="/admin/meals">
              <button className="action-btn">Update Meal Plan</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;