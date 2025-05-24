// app/admin/nap-track/page.js - Fixed Nap Tracking System
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function NapTrackingPage() {
  const [children, setChildren] = useState([]);
  const [napSessions, setNapSessions] = useState({});
  const [napHistory, setNapHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState('live');
  const [error, setError] = useState('');

  // Live nap tracking state
  const [activeNaps, setActiveNaps] = useState(new Map());
  const [napTimers, setNapTimers] = useState(new Map());

  // Schedule state
  const [napSchedules] = useState({
    'Infant': [
      { name: 'Morning Nap', startTime: '09:30', endTime: '11:00' },
      { name: 'Afternoon Nap', startTime: '13:30', endTime: '15:00' }
    ],
    'Toddler': [
      { name: 'Afternoon Nap', startTime: '12:30', endTime: '14:30' }
    ],
    'Pre-K': [
      { name: 'Quiet Time', startTime: '13:00', endTime: '14:00' }
    ]
  });

  const sleepQualityOptions = ['excellent', 'good', 'fair', 'restless', 'difficult'];

  // Load children and nap data with improved error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        setError('');
        console.log('Loading nap tracking data...');

        // Load children
        const childrenSnapshot = await getDocs(collection(db, 'children'));
        const childrenList = [];
        childrenSnapshot.forEach(doc => {
          childrenList.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Loaded ${childrenList.length} children`);
        setChildren(childrenList);

        // Load today's nap sessions - using simpler query
        try {
          const today = new Date().toISOString().split('T')[0];
          const napSessionsSnapshot = await getDocs(collection(db, 'napSessions'));
          
          const sessionsData = {};
          const activeNapsMap = new Map();
          
          napSessionsSnapshot.forEach(doc => {
            const data = doc.data();
            // Filter by today's date in memory since Firestore queries might be causing issues
            if (data.date && data.date.includes(today)) {
              sessionsData[data.childId] = data;
              if (data.status === 'sleeping') {
                activeNapsMap.set(data.childId, data);
              }
            }
          });
          
          console.log(`Loaded ${Object.keys(sessionsData).length} nap sessions`);
          setNapSessions(sessionsData);
          setActiveNaps(activeNapsMap);
        } catch (sessionError) {
          console.warn('Could not load nap sessions:', sessionError);
          // Continue without nap sessions
        }

        // Load nap history - using simpler approach
        try {
          const historySnapshot = await getDocs(collection(db, 'naps'));
          const historyData = [];
          
          historySnapshot.forEach(doc => {
            const data = doc.data();
            // Filter by selected date in memory
            if (data.date && data.date.includes(selectedDate)) {
              historyData.push({ id: doc.id, ...data });
            }
          });
          
          // Sort by date
          historyData.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          console.log(`Loaded ${historyData.length} nap history records`);
          setNapHistory(historyData);
        } catch (historyError) {
          console.warn('Could not load nap history:', historyError);
          // Continue without history
        }

      } catch (error) {
        console.error('Error loading nap data:', error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Timer effect for active naps
  useEffect(() => {
    const interval = setInterval(() => {
      setNapTimers(prev => {
        const newTimers = new Map(prev);
        activeNaps.forEach((napData, childId) => {
          if (napData.status === 'sleeping') {
            const startTime = new Date(napData.startTime);
            const now = new Date();
            const duration = Math.floor((now - startTime) / 1000 / 60);
            newTimers.set(childId, duration);
          }
        });
        return newTimers;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [activeNaps]);

  // Start nap session
  const startNap = async (child, napType = 'regular') => {
    try {
      const napSessionId = `${child.id}_${Date.now()}`;
      const startTime = new Date().toISOString();
      
      const napSessionData = {
        id: napSessionId,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        date: startTime,
        startTime: startTime,
        napType: napType,
        status: 'sleeping',
        group: child.group || 'Unknown',
        createdBy: 'admin',
        environment: 'quiet',
        notes: ''
      };
      
      await setDoc(doc(db, 'napSessions', napSessionId), napSessionData);
      
      // Update local state
      setActiveNaps(prev => new Map(prev.set(child.id, napSessionData)));
      setNapSessions(prev => ({
        ...prev,
        [child.id]: napSessionData
      }));
      
    } catch (error) {
      console.error('Error starting nap:', error);
      setError('Failed to start nap session');
    }
  };

  // End nap session
  const endNap = async (child, quality = 'good', notes = '') => {
    try {
      const activeNap = activeNaps.get(child.id) || napSessions[child.id];
      if (!activeNap) return;
      
      const endTime = new Date().toISOString();
      const startTime = new Date(activeNap.startTime);
      const duration = Math.floor((new Date(endTime) - startTime) / 1000 / 60);
      
      // Update nap session
      await updateDoc(doc(db, 'napSessions', activeNap.id), {
        endTime: endTime,
        duration: duration,
        quality: quality,
        status: 'completed',
        notes: notes,
        completedAt: endTime
      });
      
      // Create nap history record
      const napHistoryId = `${child.id}_${Date.now()}`;
      const napHistoryData = {
        id: napHistoryId,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        date: endTime,
        startTime: new Date(activeNap.startTime).toTimeString().slice(0, 5),
        endTime: new Date(endTime).toTimeString().slice(0, 5),
        duration: duration,
        quality: quality,
        napType: activeNap.napType || 'regular',
        environment: activeNap.environment || 'quiet',
        notes: notes,
        recordedBy: 'admin',
        recordedAt: endTime
      };
      
      await setDoc(doc(db, 'naps', napHistoryId), napHistoryData);
      
      // Update local state
      setActiveNaps(prev => {
        const newMap = new Map(prev);
        newMap.delete(child.id);
        return newMap;
      });
      
      setNapSessions(prev => {
        const updated = { ...prev };
        delete updated[child.id];
        return updated;
      });
      
      setNapHistory(prev => [napHistoryData, ...prev]);
      
    } catch (error) {
      console.error('Error ending nap:', error);
      setError('Failed to end nap session');
    }
  };

  // Wake child
  const wakeChild = async (child, reason = 'scheduled') => {
    await endNap(child, 'interrupted', `Woken up: ${reason}`);
  };

  // Calculate total nap time for a child today
  const getTodayNapTime = (childId) => {
    const today = new Date().toISOString().split('T')[0];
    const todayNaps = napHistory.filter(nap => 
      nap.childId === childId && 
      nap.date.includes(today)
    );
    
    const totalMinutes = todayNaps.reduce((sum, nap) => sum + (nap.duration || 0), 0);
    return formatDuration(totalMinutes);
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  // Get nap status for child
  const getNapStatus = (child) => {
    const activeNap = activeNaps.get(child.id) || napSessions[child.id];
    if (activeNap && activeNap.status === 'sleeping') {
      return 'sleeping';
    }
    return 'awake';
  };

  // Get sleep quality color
  const getQualityColor = (quality) => {
    const colors = {
      'excellent': '#28a745',
      'good': '#6c757d',
      'fair': '#ffc107',
      'restless': '#fd7e14',
      'difficult': '#dc3545'
    };
    return colors[quality] || '#6c757d';
  };

  // Group children by age group
  const groupedChildren = children.reduce((groups, child) => {
    const group = child.group || 'Unknown';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(child);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="nap-tracking-container">
        <div className="loading">Loading nap tracking system...</div>
      </div>
    );
  }

  return (
    <div className="nap-tracking-container">
      <div className="page-header">
        <h1>😴 Nap Tracking & Sleep Management</h1>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <div className="view-tabs">
            <button 
              className={`tab-btn ${activeView === 'live' ? 'active' : ''}`}
              onClick={() => setActiveView('live')}
            >
              🔴 Live Tracking
            </button>
            <button 
              className={`tab-btn ${activeView === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveView('schedule')}
            >
              📅 Nap Schedule
            </button>
            <button 
              className={`tab-btn ${activeView === 'history' ? 'active' : ''}`}
              onClick={() => setActiveView('history')}
            >
              📊 Sleep History
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Live Tracking View */}
      {activeView === 'live' && (
        <div className="live-tracking-view">
          <div className="tracking-stats">
            <div className="stat-card">
              <span className="stat-number">{activeNaps.size}</span>
              <span className="stat-label">Currently Sleeping</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{children.length - activeNaps.size}</span>
              <span className="stat-label">Awake</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {napHistory.filter(nap => 
                  nap.date.includes(new Date().toISOString().split('T')[0])
                ).length}
              </span>
              <span className="stat-label">Naps Completed Today</span>
            </div>
          </div>

          {children.length === 0 ? (
            <div className="no-children">
              <p>No children found. Please add children to the system first.</p>
            </div>
          ) : (
            Object.entries(groupedChildren).map(([group, groupChildren]) => (
              <div key={group} className="group-section">
                <h2>👶 {group} Room</h2>
                <div className="children-nap-grid">
                  {groupChildren.map(child => {
                    const napStatus = getNapStatus(child);
                    const activeNap = activeNaps.get(child.id) || napSessions[child.id];
                    const napDuration = napTimers.get(child.id) || 0;
                    const todayTotal = getTodayNapTime(child.id);
                    
                    return (
                      <div key={child.id} className={`child-nap-card ${napStatus}`}>
                        <div className="child-header">
                          <div className="child-avatar">
                            {child.gender === 'Female' ? '👧' : '👦'}
                          </div>
                          <div className="child-info">
                            <h3>{child.firstName} {child.lastName}</h3>
                            <p className="nap-status">
                              {napStatus === 'sleeping' ? '😴 Sleeping' : '😊 Awake'}
                            </p>
                          </div>
                          <div className="status-indicator">
                            <div className={`status-dot ${napStatus}`}></div>
                          </div>
                        </div>
                        
                        <div className="nap-info">
                          {napStatus === 'sleeping' && activeNap ? (
                            <div className="active-nap-info">
                              <p className="nap-timer">
                                <strong>Sleeping for:</strong> {formatDuration(napDuration)}
                              </p>
                              <p className="start-time">
                                <strong>Started:</strong> {new Date(activeNap.startTime).toLocaleTimeString()}
                              </p>
                              <div className="nap-actions">
                                <button 
                                  className="wake-btn"
                                  onClick={() => wakeChild(child, 'manual')}
                                >
                                  👋 Wake Up
                                </button>
                                <button 
                                  className="end-nap-btn"
                                  onClick={() => endNap(child, 'good')}
                                >
                                  ✅ End Nap
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="awake-info">
                              <p className="total-sleep">
                                <strong>Today's Sleep:</strong> {todayTotal}
                              </p>
                              <div className="nap-actions">
                                <button 
                                  className="start-nap-btn"
                                  onClick={() => startNap(child, 'regular')}
                                >
                                  😴 Start Nap
                                </button>
                                <button 
                                  className="quiet-time-btn"
                                  onClick={() => startNap(child, 'quiet-time')}
                                >
                                  🤫 Quiet Time
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule View */}
      {activeView === 'schedule' && (
        <div className="schedule-view">
          <div className="schedule-header">
            <h2>📅 Daily Nap Schedule</h2>
            <p>Recommended nap times by age group</p>
          </div>

          <div className="schedule-groups">
            {Object.entries(napSchedules).map(([group, schedules]) => (
              <div key={group} className="schedule-group">
                <h3>👶 {group} Room</h3>
                <div className="schedule-timeline">
                  {schedules.map((schedule, index) => (
                    <div key={index} className="schedule-item">
                      <div className="schedule-time">
                        <span className="start-time">{schedule.startTime}</span>
                        <span className="time-separator">-</span>
                        <span className="end-time">{schedule.endTime}</span>
                      </div>
                      <div className="schedule-details">
                        <h4>{schedule.name}</h4>
                        <p className="duration">
                          Duration: {formatDuration(
                            (new Date(`2024-01-01T${schedule.endTime}`) - 
                             new Date(`2024-01-01T${schedule.startTime}`)) / 1000 / 60
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="group-children">
                  <h4>Children in this group:</h4>
                  <div className="children-list">
                    {(groupedChildren[group] || []).map(child => (
                      <span key={child.id} className="child-tag">
                        {child.firstName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="schedule-tips">
            <h3>💡 Sleep Tips</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <h4>🌙 Environment</h4>
                <p>Keep rooms dim, quiet, and at comfortable temperature (68-72°F)</p>
              </div>
              <div className="tip-card">
                <h4>⏰ Consistency</h4>
                <p>Try to maintain consistent nap times to help establish sleep patterns</p>
              </div>
              <div className="tip-card">
                <h4>🎵 Calming</h4>
                <p>Soft music or white noise can help children fall asleep faster</p>
              </div>
              <div className="tip-card">
                <h4>👶 Individual Needs</h4>
                <p>Some children may need longer or shorter naps - adjust as needed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="history-view">
          <div className="history-header">
            <h2>📊 Sleep History - {new Date(selectedDate).toLocaleDateString()}</h2>
          </div>

          {napHistory.length === 0 ? (
            <div className="no-history">
              <p>No nap records found for this date.</p>
              <button 
                className="create-sample-btn"
                onClick={() => {
                  // Could add sample data creation here
                  console.log('Create sample nap data');
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📊 View Different Date
              </button>
            </div>
          ) : (
            <div className="history-content">
              <div className="daily-summary">
                <h3>📈 Daily Summary</h3>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="stat-label">Total Naps:</span>
                    <span className="stat-value">{napHistory.length}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Average Duration:</span>
                    <span className="stat-value">
                      {formatDuration(
                        Math.round(
                          napHistory.reduce((sum, nap) => sum + (nap.duration || 0), 0) / 
                          napHistory.length
                        )
                      )}
                    </span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-label">Quality Sleep:</span>
                    <span className="stat-value">
                      {napHistory.filter(nap => 
                        nap.quality === 'excellent' || nap.quality === 'good'
                      ).length} / {napHistory.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="nap-records">
                <h3>📋 Individual Records</h3>
                <div className="records-grid">
                  {napHistory.map(nap => (
                    <div key={nap.id} className="nap-record-card">
                      <div className="record-header">
                        <h4>{nap.childName}</h4>
                        <span 
                          className="quality-badge"
                          style={{backgroundColor: getQualityColor(nap.quality)}}
                        >
                          {nap.quality}
                        </span>
                      </div>
                      <div className="record-details">
                        <div className="time-info">
                          <span className="nap-time">
                            {nap.startTime} - {nap.endTime}
                          </span>
                          <span className="duration">
                            ({formatDuration(nap.duration)})
                          </span>
                        </div>
                        {nap.napType && nap.napType !== 'regular' && (
                          <span className="nap-type">Type: {nap.napType}</span>
                        )}
                        {nap.environment && (
                          <span className="environment">Environment: {nap.environment}</span>
                        )}
                        {nap.notes && (
                          <p className="nap-notes">{nap.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="export-actions">
            <button className="export-btn">📄 Generate Sleep Report</button>
            <button className="export-btn">📧 Email to Parents</button>
            <button className="export-btn">📊 Weekly Analysis</button>
          </div>
        </div>
      )}
    </div>
  );
}