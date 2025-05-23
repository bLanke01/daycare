// app/parent/page.js (Fixed Parent Dashboard)
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
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
  const [debugInfo, setDebugInfo] = useState('');

  // Enhanced children loading with better error handling and debugging
  useEffect(() => {
    if (!user) {
      console.log('❌ No user found, cannot load children');
      setLoading(false);
      return;
    }

    console.log('🔍 Loading children for user:', user.uid);
    setDebugInfo(`Looking for children linked to user: ${user.uid}`);

    const loadChildren = async () => {
      try {
        // Multiple strategies to find children
        const strategies = [
          // Strategy 1: Children linked by parentId
          {
            name: 'parentId',
            query: query(collection(db, 'children'), where('parentId', '==', user.uid))
          },
          // Strategy 2: Children linked by access code (for newly registered parents)
          {
            name: 'accessCode',
            query: query(collection(db, 'children'), where('parentEmail', '==', user.email))
          }
        ];

        let allChildren = [];
        const foundStrategies = [];

        for (const strategy of strategies) {
          try {
            console.log(`🔍 Trying strategy: ${strategy.name}`);
            const snapshot = await getDocs(strategy.query);
            
            if (!snapshot.empty) {
              console.log(`✅ Found ${snapshot.size} children using ${strategy.name} strategy`);
              foundStrategies.push(`${strategy.name}: ${snapshot.size} children`);
              
              snapshot.forEach(doc => {
                const childData = { id: doc.id, ...doc.data() };
                // Avoid duplicates
                if (!allChildren.find(c => c.id === childData.id)) {
                  allChildren.push(childData);
                  console.log('👶 Found child:', {
                    id: childData.id,
                    name: `${childData.firstName} ${childData.lastName}`,
                    parentId: childData.parentId,
                    parentRegistered: childData.parentRegistered
                  });
                }
              });
            } else {
              console.log(`❌ No children found using ${strategy.name} strategy`);
            }
          } catch (strategyError) {
            console.warn(`⚠️ Strategy ${strategy.name} failed:`, strategyError);
          }
        }

        // If no children found with specific queries, try broader search
        if (allChildren.length === 0) {
          console.log('🔍 No children found with specific queries, trying broader search...');
          
          try {
            // Search for children by parent email in access codes
            const accessCodesSnapshot = await getDocs(
              query(collection(db, 'accessCodes'), where('parentEmail', '==', user.email))
            );
            
            if (!accessCodesSnapshot.empty) {
              console.log(`🔑 Found ${accessCodesSnapshot.size} access codes for email: ${user.email}`);
              
              // Get children IDs from access codes
              const childIds = [];
              accessCodesSnapshot.forEach(doc => {
                const accessCodeData = doc.data();
                if (accessCodeData.childId) {
                  childIds.push(accessCodeData.childId);
                  console.log('🔗 Access code links to child:', accessCodeData.childId);
                }
              });
              
              // Fetch children by IDs
              for (const childId of childIds) {
                try {
                  const childSnapshot = await getDocs(
                    query(collection(db, 'children'), where('__name__', '==', childId))
                  );
                  
                  childSnapshot.forEach(doc => {
                    const childData = { id: doc.id, ...doc.data() };
                    if (!allChildren.find(c => c.id === childData.id)) {
                      allChildren.push(childData);
                      console.log('👶 Found child via access code:', {
                        id: childData.id,
                        name: `${childData.firstName} ${childData.lastName}`
                      });
                    }
                  });
                } catch (fetchError) {
                  console.warn(`⚠️ Could not fetch child ${childId}:`, fetchError);
                }
              }
            }
            
            // Last resort: search all children for this parent's email
            if (allChildren.length === 0) {
              console.log('🔍 Last resort: searching all children for parent email...');
              const allChildrenSnapshot = await getDocs(collection(db, 'children'));
              
              allChildrenSnapshot.forEach(doc => {
                const childData = doc.data();
                if (childData.parentEmail && childData.parentEmail.toLowerCase() === user.email.toLowerCase()) {
                  const child = { id: doc.id, ...childData };
                  allChildren.push(child);
                  console.log('👶 Found child by email match:', {
                    id: child.id,
                    name: `${child.firstName} ${child.lastName}`
                  });
                }
              });
            }
            
          } catch (broadSearchError) {
            console.warn('⚠️ Broader search failed:', broadSearchError);
          }
        }

        console.log(`📊 Total children found: ${allChildren.length}`);
        setChildren(allChildren);
        setDebugInfo(`Found ${allChildren.length} children using: ${foundStrategies.join(', ')}`);
        
        // Set first child as selected by default
        if (allChildren.length > 0 && !selectedChild) {
          setSelectedChild(allChildren[0]);
          console.log('✅ Selected first child:', allChildren[0].firstName);
        }
        
        if (allChildren.length === 0) {
          setError('No children found for your account. Please contact the daycare if you believe this is an error.');
        }
        
      } catch (loadError) {
        console.error('❌ Error loading children:', loadError);
        setError(`Failed to load children: ${loadError.message}`);
        setDebugInfo(`Error: ${loadError.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, [user, selectedChild]);

  // Real-time listeners for selected child's data
  useEffect(() => {
    if (!selectedChild) return;

    console.log('📡 Setting up real-time listeners for child:', selectedChild.id);
    const unsubscribes = [];

    // Listen to activities
    try {
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
            console.log(`📝 Loaded ${activitiesData.length} activities`);
          },
          (error) => {
            console.warn('⚠️ Activities listener error:', error);
          }
        )
      );
    } catch (activitiesError) {
      console.warn('⚠️ Could not set up activities listener:', activitiesError);
    }

    // Listen to attendance
    try {
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
            console.log(`📋 Loaded ${attendanceData.length} attendance records`);
          },
          (error) => {
            console.warn('⚠️ Attendance listener error:', error);
          }
        )
      );
    } catch (attendanceError) {
      console.warn('⚠️ Could not set up attendance listener:', attendanceError);
    }

    // Listen to meals
    try {
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
            console.log(`🍽️ Loaded ${mealsData.length} meal records`);
          },
          (error) => {
            console.warn('⚠️ Meals listener error:', error);
          }
        )
      );
    } catch (mealsError) {
      console.warn('⚠️ Could not set up meals listener:', mealsError);
    }

    // Listen to naps
    try {
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
            console.log(`😴 Loaded ${napsData.length} nap records`);
          },
          (error) => {
            console.warn('⚠️ Naps listener error:', error);
          }
        )
      );
    } catch (napsError) {
      console.warn('⚠️ Could not set up naps listener:', napsError);
    }

    return () => {
      console.log('🧹 Cleaning up real-time listeners');
      unsubscribes.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error cleaning up listener:', error);
        }
      });
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
        {debugInfo && (
          <div className="debug-info" style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            margin: '1rem 0', 
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            {debugInfo}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="child-profile-container">
        <div className="error-message">{error}</div>
        {debugInfo && (
          <div className="debug-info" style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            margin: '1rem 0', 
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            Debug Info: {debugInfo}
          </div>
        )}
        <div style={{ marginTop: '1rem' }}>
          <p>If you just registered, please try refreshing the page in a few moments.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="child-profile-container">
        <h1>Welcome to Your Parent Dashboard</h1>
        <div className="no-children">
          <p>No children found in your account.</p>
          <p>If you just completed registration, please wait a moment and refresh the page.</p>
          <p>If the issue persists, please contact the daycare administration.</p>
          {debugInfo && (
            <div className="debug-info" style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              margin: '1rem 0', 
              borderRadius: '4px',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              Debug Info: {debugInfo}
            </div>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            🔄 Refresh Page
          </button>
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