// app/admin/page.js (updated with navigation links)
export default function AdminDashboard() {
    // Mock data for dashboard cards
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
    
    // Mock data for today's schedule
    const todaySchedule = [
      { time: '09:00 AM', activity: 'Morning Circle Time' },
      { time: '10:30 AM', activity: 'Outdoor Play' },
      { time: '12:00 PM', activity: 'Lunch Time' },
      { time: '01:00 PM', activity: 'Nap Time' },
      { time: '03:00 PM', activity: 'Afternoon Snack' },
      { time: '03:30 PM', activity: 'Structured Activities' },
      { time: '05:00 PM', activity: 'Free Play & Pick-up' }
    ];
  
    return (
      <div className="admin-dashboard-container">
        <h1>Dashboard</h1>
        
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Total Children</h3>
            <div className="card-value">{dashboardData.totalChildren}</div>
            <a href="/admin/children" className="card-link">View Details</a>
          </div>
          
          <div className="dashboard-card">
            <h3>Total Staff</h3>
            <div className="card-value">{dashboardData.totalStaff}</div>
            <a href="/admin/staff" className="card-link">Manage Staff</a>
          </div>
          
          <div className="dashboard-card">
            <h3>Today's Attendance</h3>
            <div className="card-value">{dashboardData.todayAttendance}</div>
            <a href="/admin/attendance" className="card-link">Attendance Records</a>
          </div>
          
          <div className="dashboard-card">
            <h3>Pending Payments</h3>
            <div className="card-value">{dashboardData.pendingPayments}</div>
            <a href="/admin/payment" className="card-link">Payment Details</a>
          </div>
          
          <div className="dashboard-card">
            <h3>Access Codes</h3>
            <div className="card-value">3</div>
            <a href="/admin/access-codes" className="card-link">Manage Access Codes</a>
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
              <a href="/admin/staff"><button className="action-btn">Manage Staff</button></a>
              <a href="/admin/access-codes"><button className="action-btn">Generate Access Code</button></a>
            </div>
          </div>
        </div>
      </div>
    );
  }