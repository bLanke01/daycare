// components/admin/NapTracker.js
'use client';

import { useState } from 'react';

const NapTracker = () => {
  // Get current date
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  
  // Mock data for children grouped by class
  const [classes, setClasses] = useState([
    {
      name: 'Infant Room',
      children: [
        { 
          id: 1, 
          name: 'Sophia Wilson', 
          age: '10 months',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 2, 
          name: 'Mason Brown', 
          age: '8 months',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 3, 
          name: 'Isabella Davis', 
          age: '11 months',
          napStatus: null,
          napTimes: [],
          notes: ''
        }
      ]
    },
    {
      name: 'Toddler Room',
      children: [
        { 
          id: 4, 
          name: 'Noah Garcia', 
          age: '2 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 5, 
          name: 'Olivia Martinez', 
          age: '2.5 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 6, 
          name: 'Liam Rodriguez', 
          age: '2 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 7, 
          name: 'Ava Lopez', 
          age: '1.5 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        }
      ]
    },
    {
      name: 'Pre-K Room',
      children: [
        { 
          id: 8, 
          name: 'Emma Thompson', 
          age: '4 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 9, 
          name: 'William Johnson', 
          age: '3.5 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 10, 
          name: 'Charlotte Smith', 
          age: '4 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 11, 
          name: 'James Williams', 
          age: '3 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        },
        { 
          id: 12, 
          name: 'Amelia Jones', 
          age: '3.5 years',
          napStatus: null,
          napTimes: [],
          notes: ''
        }
      ]
    }
  ]);
  
  // State for selected date, filters, and nap details
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // State for nap history modal
  const [showNapHistory, setShowNapHistory] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // Mock nap history data
  const [napHistory, setNapHistory] = useState({
    1: [
      { date: '2025-05-05', times: [{ start: '09:30', end: '10:45' }, { start: '13:15', end: '14:30' }], notes: 'Slept well during both naps.' },
      { date: '2025-05-04', times: [{ start: '09:45', end: '11:00' }, { start: '13:30', end: '14:15' }], notes: 'Fussy before first nap, but settled quickly.' },
      { date: '2025-05-03', times: [{ start: '10:00', end: '11:15' }, { start: '13:00', end: '14:45' }], notes: 'Longer afternoon nap than usual.' }
    ],
    4: [
      { date: '2025-05-05', times: [{ start: '12:30', end: '14:00' }], notes: 'Needed extra comfort to fall asleep.' },
      { date: '2025-05-04', times: [{ start: '12:45', end: '14:15' }], notes: 'Slept well.' },
      { date: '2025-05-03', times: [{ start: '12:30', end: '13:45' }], notes: 'Short nap today.' }
    ],
    8: [
      { date: '2025-05-05', times: [{ start: '12:30', end: '13:45' }], notes: 'Did not want to nap at first, but eventually fell asleep.' },
      { date: '2025-05-04', times: [{ start: '12:30', end: '14:00' }], notes: 'Good nap.' },
      { date: '2025-05-03', times: [{ start: '12:45', end: '13:30' }], notes: 'Woke up early from nap.' }
    ]
  });
  
  // Handle start nap
  const handleStartNap = (classIndex, childIndex) => {
    const updatedClasses = [...classes];
    const child = updatedClasses[classIndex].children[childIndex];
    
    // Set nap status to 'sleeping'
    child.napStatus = 'sleeping';
    
    // Add new nap time entry
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    child.napTimes.push({
      start: currentTime,
      end: null
    });
    
    setClasses(updatedClasses);
  };
  
  // Handle end nap
  const handleEndNap = (classIndex, childIndex) => {
    const updatedClasses = [...classes];
    const child = updatedClasses[classIndex].children[childIndex];
    
    // Set nap status to 'awake'
    child.napStatus = 'awake';
    
    // Update the end time of the latest nap
    if (child.napTimes.length > 0) {
      const latestNapIndex = child.napTimes.length - 1;
      
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      child.napTimes[latestNapIndex].end = currentTime;
    }
    
    setClasses(updatedClasses);
    
    // Update nap history
    updateNapHistory(child.id);
  };
  
  // Handle skip nap
  const handleSkipNap = (classIndex, childIndex) => {
    const updatedClasses = [...classes];
    const child = updatedClasses[classIndex].children[childIndex];
    
    // Set nap status to 'skipped'
    child.napStatus = 'skipped';
    
    setClasses(updatedClasses);
  };
  
  // Handle note change
  const handleNoteChange = (classIndex, childIndex, note) => {
    const updatedClasses = [...classes];
    updatedClasses[classIndex].children[childIndex].notes = note;
    setClasses(updatedClasses);
  };
  
  // Update nap history
  const updateNapHistory = (childId) => {
    // In a real app, this would save to a database
    // For this demo, we're just logging
    console.log('Updating nap history for child ID:', childId);
  };
  
  // View nap history
  const viewNapHistory = (child) => {
    setSelectedChild(child);
    setShowNapHistory(true);
  };
  
  // Filter children based on class and status
  const getFilteredChildren = () => {
    return classes.filter(cls => 
      filterClass === 'All' || cls.name === filterClass
    ).map(cls => {
      return {
        ...cls,
        children: cls.children.filter(child => 
          filterStatus === 'All' || 
          child.napStatus === filterStatus
        )
      };
    }).filter(cls => cls.children.length > 0);
  };
  
  const filteredClasses = getFilteredChildren();
  
  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  // Calculate nap duration
  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    
    const startParts = start.split(':');
    const endParts = end.split(':');
    
    const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
    const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
    
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes <= 0) return '';
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  return (
    <div className="nap-tracker">
      <div className="page-header">
        <h1>Nap Tracker</h1>
        <div className="date-selector">
          <label htmlFor="napDate">Date:</label>
          <input
            type="date"
            id="napDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="classFilter">Class:</label>
          <select
            id="classFilter"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="All">All Classes</option>
            {classes.map((cls, index) => (
              <option key={index} value={cls.name}>{cls.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="sleeping">Sleeping</option>
            <option value="awake">Awake</option>
            <option value="skipped">Skipped Nap</option>
            <option value={null}>Not Tracked</option>
          </select>
        </div>
      </div>
      
      <div className="nap-classes">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((cls, classIndex) => (
            <div key={classIndex} className="nap-class">
              <h2>{cls.name}</h2>
              <table className="nap-table">
                <thead>
                  <tr>
                    <th>Child</th>
                    <th>Age</th>
                    <th>Status</th>
                    <th>Nap Times</th>
                    <th>Duration</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.children.map((child, childIndex) => {
                    // Get the real index in the original array
                    const originalClassIndex = classes.findIndex(c => c.name === cls.name);
                    const originalChildIndex = classes[originalClassIndex].children.findIndex(c => c.id === child.id);
                    
                    // Calculate total nap duration
                    const totalDuration = child.napTimes.reduce((total, nap) => {
                      if (!nap.start || !nap.end) return total;
                      
                      const startParts = nap.start.split(':');
                      const endParts = nap.end.split(':');
                      
                      const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
                      const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
                      
                      return total + (endMinutes - startMinutes);
                    }, 0);
                    
                    const formattedTotalDuration = totalDuration > 0 
                      ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` 
                      : '';
                    
                    return (
                      <tr key={child.id}>
                        <td>{child.name}</td>
                        <td>{child.age}</td>
                        <td className="status-cell">
                          <span className={`status-badge ${child.napStatus || 'not-tracked'}`}>
                            {child.napStatus === 'sleeping' ? 'Sleeping' :
                             child.napStatus === 'awake' ? 'Awake' :
                             child.napStatus === 'skipped' ? 'Skipped' : 'Not Tracked'}
                          </span>
                        </td>
                        <td className="nap-times">
                          {child.napTimes.length > 0 ? (
                            <ul>
                              {child.napTimes.map((nap, napIndex) => (
                                <li key={napIndex}>
                                  {formatTime(nap.start)} - {nap.end ? formatTime(nap.end) : 'In Progress'}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="no-naps">No naps recorded</span>
                          )}
                        </td>
                        <td>{formattedTotalDuration}</td>
                        <td>
                          <input
                            type="text"
                            className="note-input"
                            placeholder="Add notes..."
                            value={child.notes}
                            onChange={(e) => handleNoteChange(originalClassIndex, originalChildIndex, e.target.value)}
                          />
                        </td>
                        <td className="action-cell">
                          {child.napStatus === 'sleeping' ? (
                            <button 
                              className="end-nap-btn"
                              onClick={() => handleEndNap(originalClassIndex, originalChildIndex)}
                            >
                              End Nap
                            </button>
                          ) : child.napStatus !== 'skipped' ? (
                            <>
                              <button 
                                className="start-nap-btn"
                                onClick={() => handleStartNap(originalClassIndex, originalChildIndex)}
                                disabled={child.napStatus === 'sleeping'}
                              >
                                Start Nap
                              </button>
                              <button 
                                className="skip-nap-btn"
                                onClick={() => handleSkipNap(originalClassIndex, originalChildIndex)}
                              >
                                Skip
                              </button>
                            </>
                          ) : null}
                          <button 
                            className="history-btn"
                            onClick={() => viewNapHistory(child)}
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No children match the selected filters.</p>
          </div>
        )}
      </div>
      
      <div className="action-buttons">
        <button className="save-btn">Save Nap Records</button>
        <button className="export-btn">Export Report</button>
      </div>
      
      {/* Nap History Modal */}
      {showNapHistory && selectedChild && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Nap History: {selectedChild.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowNapHistory(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="nap-history">
              {napHistory[selectedChild.id] ? (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Nap Times</th>
                      <th>Duration</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {napHistory[selectedChild.id].map((record, index) => {
                      // Calculate total duration for the day
                      const totalDuration = record.times.reduce((total, nap) => {
                        if (!nap.start || !nap.end) return total;
                        
                        const startParts = nap.start.split(':');
                        const endParts = nap.end.split(':');
                        
                        const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
                        const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
                        
                        return total + (endMinutes - startMinutes);
                      }, 0);
                      
                      const formattedTotalDuration = totalDuration > 0 
                        ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` 
                        : '';
                      
                      return (
                        <tr key={index}>
                          <td>{new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}</td>
                          <td>
                            <ul>
                              {record.times.map((nap, napIndex) => (
                                <li key={napIndex}>
                                  {formatTime(nap.start)} - {formatTime(nap.end)}
                                  {nap.start && nap.end && (
                                    <span className="duration">
                                      ({calculateDuration(nap.start, nap.end)})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>{formattedTotalDuration}</td>
                          <td>{record.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>No nap history available for this child.</p>
              )}
              
              <div className="nap-summary">
                <h3>Nap Patterns</h3>
                <p>Average nap duration over the past week: 1h 45m</p>
                <p>Typical nap time: 12:30 PM - 2:15 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NapTracker;