// app/parent/page.js (Fixed - No Indexes Required)
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
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

  // FIXED: Real-time listeners for selected child's data (No orderBy to avoid index requirements)
  useEffect(() => {
    if (!selectedChild) return;

    console.log('📡 Setting up real-time listeners for child:', selectedChild.id);
    const unsubscribes = [];

    // Listen to activities (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'activities'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const activitiesData = [];
            snapshot.forEach(doc => {
              activitiesData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            activitiesData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
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

    // Listen to attendance (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'attendance'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const attendanceData = [];
            snapshot.forEach(doc => {
              attendanceData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
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

    // Listen to meals (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'childMeals'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const mealsData = [];
            snapshot.forEach(doc => {
              mealsData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            mealsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
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

    // Listen to naps (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'naps'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const napsData = [];
            snapshot.forEach(doc => {
              napsData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            napsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
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
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">{error}</div>
          </div>
        </div>
        {debugInfo && (
          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            <p className="text-sm opacity-70">Debug Info: {debugInfo}</p>
          </div>
        )}
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary mt-4"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Welcome to Your Parent Dashboard</h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-warning">No Children Found</h2>
            <p>No children are currently linked to your account.</p>
            <p>If you just completed registration, please wait a moment and refresh the page.</p>
            <p>If the issue persists, please contact the daycare administration.</p>
            {debugInfo && (
              <div className="bg-base-200 p-4 rounded-lg mt-4">
                <p className="text-sm opacity-70">Debug Info: {debugInfo}</p>
              </div>
            )}
            <div className="card-actions justify-end mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Children's Dashboard</h1>
        {children.length > 1 && (
          <div className="form-control w-full md:w-auto mt-4 md:mt-0">
            <select 
              className="select select-bordered w-full md:w-auto"
              value={selectedChild?.id || ''} 
              onChange={(e) => {
                const child = children.find(c => c.id === e.target.value);
                setSelectedChild(child);
              }}
            >
              <option value="">Select a child</option>
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
        <div className="grid gap-6">
          {/* Child Profile Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-none w-32 h-32 rounded-full bg-base-200 flex items-center justify-center text-4xl">
                  {selectedChild.gender === 'Female' ? '👧' : '👦'}
                </div>
                <div>
                  <h2 className="card-title text-2xl">{selectedChild.firstName} {selectedChild.lastName}</h2>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm opacity-70">Age</p>
                      <p className="font-semibold">{calculateAge(selectedChild.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Group</p>
                      <p className="font-semibold">{selectedChild.group || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Status</p>
                      <div className="badge badge-success">Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Today's Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="stat">
                  <div className="stat-title">Attendance</div>
                  <div className="stat-value text-lg">
                    {childAttendance.length > 0 && 
                     childAttendance[0].date.split('T')[0] === new Date().toISOString().split('T')[0] 
                      ? childAttendance[0].status 
                      : 'Not marked'}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Meals Today</div>
                  <div className="stat-value text-lg">
                    {childMeals.filter(meal => 
                      meal.date.split('T')[0] === new Date().toISOString().split('T')[0]
                    ).length}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Naps Today</div>
                  <div className="stat-value text-lg">
                    {childNaps.filter(nap => 
                      nap.date.split('T')[0] === new Date().toISOString().split('T')[0]
                    ).length}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Activities Today</div>
                  <div className="stat-value text-lg">
                    {childActivities.filter(activity => 
                      activity.date.split('T')[0] === new Date().toISOString().split('T')[0]
                    ).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Recent Activities</h3>
              {childActivities.length === 0 ? (
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No activities recorded yet.</span>
                </div>
              ) : (
                <div className="grid gap-4">
                  {childActivities.map(activity => (
                    <div key={activity.id} className="card bg-base-200">
                      <div className="card-body">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold">{activity.title}</h4>
                            <p className="text-sm opacity-70">{new Date(activity.date).toLocaleDateString()}</p>
                          </div>
                          <div className="badge" data-type={activity.activityType || activity.type || 'other'}>
                            {activity.activityType || activity.type || 'Activity'}
                          </div>
                        </div>
                        <p>{activity.description}</p>
                        {activity.notes && (
                          <p className="text-sm opacity-70 mt-2">Notes: {activity.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Recent Attendance</h3>
              {childAttendance.length === 0 ? (
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No attendance records yet.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Arrival</th>
                        <th>Departure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {childAttendance.map(record => (
                        <tr key={record.id}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>
                            <div className="badge" data-status={record.status}>
                              {record.status}
                            </div>
                          </td>
                          <td>{record.arrivalTime || '-'}</td>
                          <td>{record.departureTime || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Meals */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Recent Meals</h3>
              {childMeals.length === 0 ? (
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No meal records yet.</span>
                </div>
              ) : (
                <div className="grid gap-4">
                  {childMeals.map(meal => (
                    <div key={meal.id} className="card bg-base-200">
                      <div className="card-body">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold capitalize">{meal.mealType}</h4>
                            <p className="text-sm opacity-70">
                              {new Date(meal.date).toLocaleDateString()} at {meal.time}
                            </p>
                          </div>
                          <div className="badge" data-amount={meal.amountEaten}>
                            {meal.amountEaten}
                          </div>
                        </div>
                        <p className="mt-2">
                          {Array.isArray(meal.foodItems) ? 
                            meal.foodItems.join(', ') : 
                            meal.foodItems}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Naps */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Recent Naps</h3>
              {childNaps.length === 0 ? (
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No nap records yet.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Quality</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {childNaps.map(nap => (
                        <tr key={nap.id}>
                          <td>{new Date(nap.date).toLocaleDateString()}</td>
                          <td>{formatDuration(nap.duration)}</td>
                          <td>
                            <div className="badge" data-quality={nap.quality}>
                              {nap.quality}
                            </div>
                          </td>
                          <td>{nap.startTime} - {nap.endTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}