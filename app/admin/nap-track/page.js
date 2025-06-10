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
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">😴 Nap Tracking & Sleep Management</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            className="input input-bordered"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${activeView === 'live' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('live')}
            >
              🔴 Live Tracking
            </button>
            <button 
              className={`tab ${activeView === 'schedule' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('schedule')}
            >
              📅 Nap Schedule
            </button>
            <button 
              className={`tab ${activeView === 'history' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('history')}
            >
              📊 Sleep History
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button 
            className="btn btn-error btn-sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Live Tracking View */}
      {activeView === 'live' && (
        <div className="space-y-6">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Currently Sleeping</div>
              <div className="stat-value">{activeNaps.size}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Awake</div>
              <div className="stat-value">{children.length - activeNaps.size}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Naps Today</div>
              <div className="stat-value">
                {napHistory.filter(nap => 
                  nap.date.includes(new Date().toISOString().split('T')[0])
                ).length}
              </div>
            </div>
          </div>

          {children.length === 0 ? (
            <div className="card bg-base-200 p-8 text-center">
              <p className="text-lg">No children found. Please add children to the system first.</p>
            </div>
          ) : (
            Object.entries(groupedChildren).map(([group, groupChildren]) => (
              <div key={group} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title">👶 {group} Room</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupChildren.map(child => {
                      const napStatus = getNapStatus(child);
                      const activeNap = activeNaps.get(child.id) || napSessions[child.id];
                      const napDuration = napTimers.get(child.id) || 0;
                      const todayTotal = getTodayNapTime(child.id);
                      
                      return (
                        <div key={child.id} className={`card bg-base-200 ${napStatus === 'sleeping' ? 'border-primary border-2' : ''}`}>
                          <div className="card-body">
                            <div className="flex items-center gap-4">
                              <div className="text-2xl">
                                {child.gender === 'Female' ? '👧' : '👦'}
                              </div>
                              <div>
                                <h3 className="font-bold">{child.firstName} {child.lastName}</h3>
                                <p className={`text-sm ${napStatus === 'sleeping' ? 'text-primary' : ''}`}>
                                  {napStatus === 'sleeping' ? '😴 Sleeping' : '😊 Awake'}
                                </p>
                              </div>
                              <div className={`badge badge-${napStatus === 'sleeping' ? 'primary' : 'ghost'} ml-auto`}>
                                {napStatus}
                              </div>
                            </div>
                            
                            <div className="divider"></div>
                            
                            {napStatus === 'sleeping' && activeNap ? (
                              <div className="space-y-2">
                                <p>
                                  <strong>Sleeping for:</strong> {formatDuration(napDuration)}
                                </p>
                                <p>
                                  <strong>Started:</strong> {new Date(activeNap.startTime).toLocaleTimeString()}
                                </p>
                                <div className="card-actions justify-end">
                                  <button 
                                    className="btn btn-warning btn-sm"
                                    onClick={() => wakeChild(child, 'manual')}
                                  >
                                    👋 Wake Up
                                  </button>
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => endNap(child, 'good')}
                                  >
                                    ✅ End Nap
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p>
                                  <strong>Today's Sleep:</strong> {todayTotal}
                                </p>
                                <div className="card-actions justify-end">
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => startNap(child, 'regular')}
                                  >
                                    😴 Start Nap
                                  </button>
                                  <button 
                                    className="btn btn-ghost btn-sm"
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
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule View */}
      {activeView === 'schedule' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">📅 Daily Nap Schedule</h2>
              <p className="text-sm opacity-70">Recommended nap times by age group</p>

              <div className="space-y-8 mt-4">
                {Object.entries(napSchedules).map(([group, schedules]) => (
                  <div key={group} className="card bg-base-200">
                    <div className="card-body">
                      <h3 className="card-title">👶 {group} Room</h3>
                      <div className="space-y-4">
                        {schedules.map((schedule, index) => (
                          <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-base-100 rounded-lg">
                            <div className="flex-1">
                              <div className="font-bold">{schedule.name}</div>
                              <div className="text-sm opacity-70">
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                            </div>
                            <div className="badge badge-primary">
                              Duration: {formatDuration(
                                (new Date(`2024-01-01T${schedule.endTime}`) - 
                                 new Date(`2024-01-01T${schedule.startTime}`)) / 1000 / 60
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-bold mb-2">Children in this group:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(groupedChildren[group] || []).map(child => (
                            <span key={child.id} className="badge badge-ghost">
                              {child.firstName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">🌙 Environment</h4>
                <p>Keep rooms dim, quiet, and at comfortable temperature (68-72°F)</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">⏰ Consistency</h4>
                <p>Try to maintain consistent nap times to help establish sleep patterns</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">🎵 Calming</h4>
                <p>Soft music or white noise can help children fall asleep faster</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">👶 Individual Needs</h4>
                <p>Some children may need longer or shorter naps - adjust as needed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">📊 Sleep History - {new Date(selectedDate).toLocaleDateString()}</h2>

              {napHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg mb-4">No nap records found for this date.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      // Could add sample data creation here
                      console.log('Create sample nap data');
                    }}
                  >
                    📊 View Different Date
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">Total Naps</div>
                      <div className="stat-value">{napHistory.length}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Average Duration</div>
                      <div className="stat-value">
                        {formatDuration(
                          Math.round(
                            napHistory.reduce((sum, nap) => sum + (nap.duration || 0), 0) / 
                            napHistory.length
                          )
                        )}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Quality Sleep</div>
                      <div className="stat-value">
                        {napHistory.filter(nap => 
                          nap.quality === 'excellent' || nap.quality === 'good'
                        ).length} / {napHistory.length}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {napHistory.map(nap => (
                      <div key={nap.id} className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                          <div className="flex justify-between items-center">
                            <h4 className="card-title">{nap.childName}</h4>
                            <span 
                              className={`badge badge-${nap.quality === 'excellent' ? 'success' : 
                                nap.quality === 'good' ? 'info' : 
                                nap.quality === 'fair' ? 'warning' : 'error'}`}
                            >
                              {nap.quality}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm opacity-70">
                                {nap.startTime} - {nap.endTime}
                              </span>
                              <span className="badge badge-ghost">
                                {formatDuration(nap.duration)}
                              </span>
                            </div>
                            {nap.napType && nap.napType !== 'regular' && (
                              <span className="badge badge-outline">{nap.napType}</span>
                            )}
                            {nap.environment && (
                              <span className="badge badge-ghost">{nap.environment}</span>
                            )}
                            {nap.notes && (
                              <p className="text-sm italic">{nap.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button className="btn btn-outline">📄 Generate Sleep Report</button>
            <button className="btn btn-outline">📧 Email to Parents</button>
            <button className="btn btn-outline">📊 Weekly Analysis</button>
          </div>
        </div>
      )}
    </div>
  );
}