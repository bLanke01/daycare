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
    return (
      <div className="min-h-screen bg-base-200 p-6 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-base-content">
            <span className="text-primary">Admin</span> Dashboard
          </h1>
          <div className="flex gap-2">
            <button className="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              View Reports
            </button>
            <button className="btn btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              New Entry
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat bg-base-100 shadow-xl rounded-2xl">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
            </div>
            <div className="stat-title">Total Children</div>
            <div className="stat-value text-primary">{dashboardData.totalChildren}</div>
            <div className="stat-desc">Active Enrollments</div>
          </div>

          <div className="stat bg-base-100 shadow-xl rounded-2xl">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="stat-title">Today's Attendance</div>
            <div className="stat-value text-success">{dashboardData.todayAttendance}</div>
            <div className="stat-desc">Present Today</div>
          </div>

          <div className="stat bg-base-100 shadow-xl rounded-2xl">
            <div className="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="stat-title">Pending Invoices</div>
            <div className="stat-value text-warning">{dashboardData.pendingInvoices}</div>
            <div className="stat-desc">Awaiting Payment</div>
          </div>

          <div className="stat bg-base-100 shadow-xl rounded-2xl">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="stat-title">Today's Events</div>
            <div className="stat-value text-secondary">{todaySchedule.length}</div>
            <div className="stat-desc">Scheduled Activities</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                Recent Activities
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-all">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">
                          {activity.time.split(':')[0]}:{activity.time.split(':')[1]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="text-base-content">{activity.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-actions justify-end mt-4">
                <a href="/admin/activity-log" className="btn btn-primary btn-sm">View All Activities</a>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4 text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
                Today's Schedule
              </h2>
              <div className="space-y-4">
                {todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-all">
                    <div className="flex-shrink-0">
                      <div className="w-20 text-center py-1 bg-secondary/10 rounded">
                        <span className="text-secondary font-medium">{item.time}</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="text-base-content">{item.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-actions justify-end mt-4">
                <a href="/admin/schedules" className="btn btn-secondary btn-sm">View Full Schedule</a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/admin/children" className="btn btn-primary btn-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                </svg>
                Manage Children
              </a>
              <a href="/admin/attendance" className="btn btn-secondary btn-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Mark Attendance
              </a>
              <a href="/admin/messages" className="btn btn-accent btn-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                </svg>
                Send Message
              </a>
              <a href="/admin/invoices" className="btn btn-neutral btn-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                Manage Invoices
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}