// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalChildren: 0,
    todayAttendance: 0,
    pendingInvoices: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);

        // 1. Fetch total children
        const childrenSnapshot = await getDocs(collection(db, 'children'));
        const totalChildren = childrenSnapshot.size;

        // 2. Fetch today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Get all attendance records for today
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('date', '>=', todayStr + 'T00:00:00.000Z'),
          where('date', '<=', todayStr + 'T23:59:59.999Z')
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        let presentCount = 0;
        
        // Count present and late students (case insensitive)
        attendanceSnapshot.forEach(doc => {
          const status = doc.data().status?.toLowerCase();
          if (status === 'present' || status === 'late') {
            presentCount++;
          }
        });

        // 3. Fetch pending invoices
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('status', '==', 'pending')
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const pendingInvoices = invoicesSnapshot.size;

        // Update dashboard data
        setDashboardData({
          totalChildren,
          todayAttendance: presentCount,
          pendingInvoices
        });

        // 4. Fetch today's schedule
        const scheduleQuery = query(
          collection(db, 'events'),
          where('date', '>=', Timestamp.fromDate(today)),
          where('date', '<=', Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
        );
        
        const scheduleSnapshot = await getDocs(scheduleQuery);
        const scheduleEvents = [];
        
        if (scheduleSnapshot.empty) {
          // Use default schedule if no custom schedule is set
          setTodaySchedule([
            { time: '09:00 AM', activity: 'Morning Circle Time' },
            { time: '10:30 AM', activity: 'Outdoor Play' },
            { time: '12:00 PM', activity: 'Lunch Time' },
            { time: '01:00 PM', activity: 'Nap Time' },
            { time: '03:00 PM', activity: 'Afternoon Snack' },
            { time: '03:30 PM', activity: 'Structured Activities' },
            { time: '05:00 PM', activity: 'Free Play & Pick-up' }
          ]);
        } else {
          scheduleSnapshot.forEach(doc => {
            const data = doc.data();
            scheduleEvents.push({
              time: data.time,
              activity: data.title || data.description
            });
          });
          // Sort events by time
          scheduleEvents.sort((a, b) => {
            return new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time);
          });
          setTodaySchedule(scheduleEvents);
        }

        // 5. Fetch recent activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activities = [];
        
        activitiesSnapshot.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            time: new Date(data.createdAt || data.date || Date.now()).toLocaleTimeString(),
            activity: data.title || data.description || 'Activity recorded'
          });
        });

        setRecentActivities(activities);

        setLoading(false);
      } catch (error) {
        console.error('Error in fetchDashboardData:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every minute
    const intervalId = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <h1>Dashboard</h1>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Children</h3>
          <div className="card-value">{dashboardData.totalChildren}</div>
          <a href="/admin/children" className="card-link">View Details</a>
        </div>
        
        <div className="dashboard-card">
          <h3>Today's Attendance</h3>
          <div className="card-value">{dashboardData.todayAttendance}</div>
          <a href="/admin/attendance" className="card-link">Attendance Records</a>
        </div>
        
        <div className="dashboard-card">
          <h3>Pending Invoices</h3>
          <div className="card-value">{dashboardData.pendingInvoices}</div>
          <a href="/admin/invoices" className="card-link">Invoice Details</a>
        </div>
      </div>
      
      <div className="dashboard-widgets">
        <div className="widget">
          <h2>Recent Activities</h2>
          <div className="activity-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-time">{activity.time}</span>
                  <p>{activity.activity}</p>
                </div>
              ))
            ) : (
              <p>No recent activities</p>
            )}
          </div>
          <a href="/admin/activity-log" className="widget-link">View All Activities</a>
        </div>
        
        <div className="widget">
          <h2>Today's Schedule</h2>
          <div className="schedule-list">
            {todaySchedule.map((item, index) => (
              <div key={index} className="schedule-item">
                <span className="schedule-time">{item.time}</span>
                <p>{item.activity}</p>
              </div>
            ))}
          </div>
          <a href="/admin/schedules" className="widget-link">View Full Schedule</a>
        </div>
        
        <div className="widget">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <a href="/admin/attendance"><button className="action-btn">Mark Attendance</button></a>
            <a href="/admin/children"><button className="action-btn">Add New Child</button></a>
          </div>
        </div>
      </div>
    </div>
  );
}