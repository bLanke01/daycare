// app/parent/page.js (Enhanced with real-time updates)
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../firebase/auth-context';
import { db } from '../firebase/config';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivities, setChildActivities] = useState([]);
  const [childAttendance, setChildAttendance] = useState([]);
  const [childMeals, setChildMeals] = useState([]);
  const [childNaps, setChildNaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time listener for children
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'children'), where('parentId', '==', user.uid)),
      (snapshot) => {
        const childrenData = [];
        snapshot.forEach(doc => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenData);
        
        // Set first child as selected by default
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0]);
        }
        
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching children:', error);
        setError('Failed to load children information');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedChild]);

  // Real-time listeners for selected child's data
  useEffect(() => {
    if (!selectedChild) return;

    const unsubscribes = [];

    // Listen to activities
    unsubscribes.push(
      onSnapshot(
        query(
          collection(db, 'activities'),
          where('childId', '==', selectedChild.id),
          orderBy('date', 'desc')
        ),
        (snapshot) => {
          const activitiesData = [];
          snapshot.forEach(doc => {
            activitiesData.push({ id: doc.id, ...doc.data() });
          });
          setChildActivities(activitiesData.slice(0, 5)); // Show latest 5
        }
      )
    );

    // Listen to attendance
    unsubscribes.push(
      onSnapshot(
        query(
          collection(db, 'attendance'),
          where('childId', '==', selectedChild.id),
          orderBy('date', 'desc')
        ),
        (snapshot) => {
          const attendanceData = [];
          snapshot.forEach(doc => {
            attendanceData.push({ id: doc.id, ...doc.data() });
          });
          setChildAttendance(attendanceData.slice(0, 7)); // Show latest week
        }
      )
    );

    // Listen to meals
    unsubscribes.push(
      onSnapshot(
        query(
          collection(db, 'childMeals'),
          where('childId', '==', selectedChild.id),
          orderBy('date', 'desc')
        ),
        (snapshot) => {
          const mealsData = [];
          snapshot.forEach(doc => {
            mealsData.push({ id: doc.id, ...doc.data() });
          });
          setChildMeals(mealsData.slice(0, 10)); // Show latest 10
        }
      )
    );

    // Listen to naps
    unsubscribes.push(
      onSnapshot(
        query(
          collection(db, 'naps'),
          where('childId', '==', selectedChild.id),
          orderBy('date', 'desc')
        ),
        (snapshot) => {
          const napsData = [];
          snapshot.forEach(doc => {
            napsData.push({ id: doc.id, ...doc.data() });
          });
          setChildNaps(napsData.slice(0, 7)); // Show latest week
        }
      )
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [selectedChild]);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 1) {
      const ageMonths = (today.getMonth() + 12 - birthDate.getMonth()) % 12;
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  if (loading) {
    return (
      <div className="child-profile-container">
        <div className="loading">Loading your children's information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="child-profile-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="child-profile-container">
        <h1>Welcome to Your Parent Dashboard</h1>
        <div className="no-children">
          <p>No children found in your account.</p>
          <p>If you believe this is an error, please contact the daycare administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      <div className="dashboard-header">
        <h1>Your Children's Dashboard</h1>
        {children.length > 1 && (
          <div className="child-selector">
            <label>Viewing: </label>
            <select 
              value={selectedChild?.id || ''} 
              onChange={(e) => {
                const child = children.find(c => c.id === e.target.value);
                setSelectedChild(child);
              }}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedChild && (
        <div className="child-dashboard">
          {/* Child Profile Section */}
          <div className="profile-section">
            <div className="child-card">
              <div className="child-photo">
                <div className="photo-placeholder">
                  {selectedChild.gender === 'Female' ? '👧' : '👦'}
                </div>
              </div>
              <div className="child-info">
                <h2>{selectedChild.firstName} {selectedChild.lastName}</h2>
                <p>Age: {calculateAge(selectedChild.dateOfBirth)}</p>
                <p>Group: {selectedChild.group}</p>
                <p>Status: Active</p>
              </div>
            </div>

            {/* Today's Summary */}
            <div className="today-summary">
              <h3>Today's Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Attendance</span>
                  <span className="summary-value">
                    {childAttendance.length > 0 && 
                     childAttendance[0].date.split('T')[0] === new Date().toISOString().split('T')[0] 
                      ? childAttendance[0].status 
                      : 'Not marked'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Meals Today</span>
                  <span className="summary-value">
                    {childMeals.filter(meal => 
                      meal.date.split('T')[0] === new Date().toISOString().split('T')[0]
                    ).length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Naps Today</span>
                  <span className="summary-value">
                    {childNaps.filter(nap => 
                      nap.date.split('T')[0] === new Date().toISOString().split('T')[0]
                    ).length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Activities Today</span>
                  <span className="summary-value">
                    {childActivities.filter(activity => 
                      activity.date.split('T')[0] === new Date().toISOString().split('T')[0]
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Sections */}
          <div className="dashboard-sections">
            {/* Recent Activities */}
            <div className="dashboard-section">
              <h3>Recent Activities</h3>
              <div className="section-content">
                {childActivities.length === 0 ? (
                  <p className="no-data">No activities recorded yet.</p>
                ) : (
                  <div className="activities-list">
                    {childActivities.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-header">
                          <span className={`activity-type ${activity.type.toLowerCase()}`}>
                            {activity.type}
                          </span>
                          <span className="activity-date">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="activity-description">{activity.description}</p>
                        {activity.notes && (
                          <p className="activity-notes">Notes: {activity.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="dashboard-section">
              <h3>Recent Attendance</h3>
              <div className="section-content">
                {childAttendance.length === 0 ? (
                  <p className="no-data">No attendance records yet.</p>
                ) : (
                  <div className="attendance-list">
                    {childAttendance.map(record => (
                      <div key={record.id} className="attendance-item">
                        <div className="attendance-date">
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                        <div className="attendance-details">
                          <span className={`status-badge ${record.status}`}>
                            {record.status}
                          </span>
                          {record.arrivalTime && (
                            <span className="time-info">
                              In: {record.arrivalTime}
                            </span>
                          )}
                          {record.departureTime && (
                            <span className="time-info">
                              Out: {record.departureTime}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Meals Summary */}
            <div className="dashboard-section">
              <h3>Recent Meals</h3>
              <div className="section-content">
                {childMeals.length === 0 ? (
                  <p className="no-data">No meal records yet.</p>
                ) : (
                  <div className="meals-list">
                    {childMeals.map(meal => (
                      <div key={meal.id} className="meal-item">
                        <div className="meal-header">
                          <span className={`meal-type ${meal.mealType}`}>
                            {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                          </span>
                          <span className="meal-date">
                            {new Date(meal.date).toLocaleDateString()} at {meal.time}
                          </span>
                        </div>
                        <div className="meal-details">
                          <div className="food-items">
                            {Array.isArray(meal.foodItems) ? 
                              meal.foodItems.join(', ') : 
                              meal.foodItems}
                          </div>
                          <span className={`amount-eaten ${meal.amountEaten}`}>
                            Ate: {meal.amountEaten}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Naps Summary */}
            <div className="dashboard-section">
              <h3>Recent Naps</h3>
              <div className="section-content">
                {childNaps.length === 0 ? (
                  <p className="no-data">No nap records yet.</p>
                ) : (
                  <div className="naps-list">
                    {childNaps.map(nap => (
                      <div key={nap.id} className="nap-item">
                        <div className="nap-header">
                          <span className="nap-date">
                            {new Date(nap.date).toLocaleDateString()}
                          </span>
                          <span className={`nap-quality ${nap.quality}`}>
                            {nap.quality} sleep
                          </span>
                        </div>
                        <div className="nap-details">
                          <span className="nap-time">
                            {nap.startTime} - {nap.endTime}
                          </span>
                          <span className="nap-duration">
                            ({formatDuration(nap.duration)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}