// components/admin/AttendanceTracker.js
'use client';

import { useState } from 'react';

const AttendanceTracker = () => {
  // Get current date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Mock data for children grouped by class
  const [classes, setClasses] = useState([
    {
      name: 'Infant Room',
      children: [
        { id: 1, name: 'Sophia Wilson', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 2, name: 'Mason Brown', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 3, name: 'Isabella Davis', status: null, arrivalTime: null, departureTime: null, note: '' }
      ]
    },
    {
      name: 'Toddler Room',
      children: [
        { id: 4, name: 'Noah Garcia', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 5, name: 'Olivia Martinez', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 6, name: 'Liam Rodriguez', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 7, name: 'Ava Lopez', status: null, arrivalTime: null, departureTime: null, note: '' }
      ]
    },
    {
      name: 'Pre-K Room',
      children: [
        { id: 8, name: 'Emma Thompson', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 9, name: 'William Johnson', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 10, name: 'Charlotte Smith', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 11, name: 'James Williams', status: null, arrivalTime: null, departureTime: null, note: '' },
        { id: 12, name: 'Amelia Jones', status: null, arrivalTime: null, departureTime: null, note: '' }
      ]
    }
  ]);
  
  // State for selected date and filter
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Handle attendance status change
  const handleStatusChange = (classIndex, childIndex, status) => {
    const updatedClasses = [...classes];
    const child = updatedClasses[classIndex].children[childIndex];
    
    // Update status
    child.status = status;
    
    // Set arrival time if status is present or late
    if (status === 'present' || status === 'late') {
      child.arrivalTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      child.arrivalTime = null;
      child.departureTime = null;
    }
    
    setClasses(updatedClasses);
  };
  
  // Handle departure time update
  const handleDeparture = (classIndex, childIndex) => {
    const updatedClasses = [...classes];
    const child = updatedClasses[classIndex].children[childIndex];
    
    child.departureTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    setClasses(updatedClasses);
  };
  
  // Handle note update
  const handleNoteChange = (classIndex, childIndex, note) => {
    const updatedClasses = [...classes];
    updatedClasses[classIndex].children[childIndex].note = note;
    setClasses(updatedClasses);
  };
  
  return (
    <div className="attendance-tracker">
      <div className="page-header">
        <h1>Attendance Tracker</h1>
        <div className="date-selector">
          <label htmlFor="attendanceDate">Date:</label>
          <input
            type="date"
            id="attendanceDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="today-info">
        <h2>{dateString}</h2>
        <div className="attendance-summary">
          <div className="summary-item">
            <span className="status-label present">Present:</span>
            <span className="status-count">
              {classes.reduce((total, cls) => 
                total + cls.children.filter(child => child.status === 'present').length, 0
              )}
            </span>
          </div>
          <div className="summary-item">
            <span className="status-label absent">Absent:</span>
            <span className="status-count">
              {classes.reduce((total, cls) => 
                total + cls.children.filter(child => child.status === 'absent').length, 0
              )}
            </span>
          </div>
          <div className="summary-item">
            <span className="status-label late">Late:</span>
            <span className="status-count">
              {classes.reduce((total, cls) => 
                total + cls.children.filter(child => child.status === 'late').length, 0
              )}
            </span>
          </div>
        </div>
      </div>
      
      <div className="filters">
        <label htmlFor="statusFilter">Filter by Status:</label>
        <select
          id="statusFilter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="null">Not Marked</option>
        </select>
      </div>
      
      <div className="attendance-classes">
        {classes.map((cls, classIndex) => (
          <div key={classIndex} className="attendance-class">
            <h3>{cls.name}</h3>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Child Name</th>
                  <th>Status</th>
                  <th>Arrival Time</th>
                  <th>Departure Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {cls.children.filter(child => 
                  filterStatus === 'All' || 
                  (filterStatus === 'null' && child.status === null) ||
                  child.status === filterStatus
                ).map((child, childIndex) => (
                  <tr key={child.id}>
                    <td>{child.name}</td>
                    <td className="status-cell">
                      <div className="status-buttons">
                        <button 
                          className={`status-btn present ${child.status === 'present' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(classIndex, childIndex, 'present')}
                        >
                          Present
                        </button>
                        <button 
                          className={`status-btn absent ${child.status === 'absent' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(classIndex, childIndex, 'absent')}
                        >
                          Absent
                        </button>
                        <button 
                          className={`status-btn late ${child.status === 'late' ? 'active' : ''}`}
                          onClick={() => handleStatusChange(classIndex, childIndex, 'late')}
                        >
                          Late
                        </button>
                      </div>
                    </td>
                    <td>{child.arrivalTime || '-'}</td>
                    <td>
                      {child.status === 'present' || child.status === 'late' ? (
                        child.departureTime ? (
                          child.departureTime
                        ) : (
                          <button 
                            className="departure-btn"
                            onClick={() => handleDeparture(classIndex, childIndex)}
                          >
                            Mark Departure
                          </button>
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="note-input"
                        placeholder="Add note..."
                        value={child.note}
                        onChange={(e) => handleNoteChange(classIndex, childIndex, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      
      <div className="action-buttons">
        <button className="save-btn">Save Attendance</button>
        <button className="export-btn">Export Report</button>
      </div>
    </div>
  );
};

export default AttendanceTracker;