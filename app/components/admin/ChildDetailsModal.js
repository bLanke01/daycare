// components/admin/ChildDetailsModal.js
'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ChildDetailsModal = ({ child, activeTab, setActiveTab, onClose }) => {
  const [childData, setChildData] = useState(child);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [meals, setMeals] = useState([]);
  const [naps, setNaps] = useState([]);

  // Real-time listeners for child's data
  useEffect(() => {
    if (!child.id) return;

    const unsubscribes = [];

    // Listen to activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('childId', '==', child.id),
      orderBy('date', 'desc')
    );
    
    unsubscribes.push(
      onSnapshot(activitiesQuery, (snapshot) => {
        const activitiesData = [];
        snapshot.forEach(doc => {
          activitiesData.push({ id: doc.id, ...doc.data() });
        });
        setActivities(activitiesData);
      })
    );

    // Listen to attendance
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('childId', '==', child.id),
      orderBy('date', 'desc')
    );
    
    unsubscribes.push(
      onSnapshot(attendanceQuery, (snapshot) => {
        const attendanceData = [];
        snapshot.forEach(doc => {
          attendanceData.push({ id: doc.id, ...doc.data() });
        });
        setAttendance(attendanceData);
      })
    );

    // Listen to meals
    const mealsQuery = query(
      collection(db, 'childMeals'),
      where('childId', '==', child.id),
      orderBy('date', 'desc')
    );
    
    unsubscribes.push(
      onSnapshot(mealsQuery, (snapshot) => {
        const mealsData = [];
        snapshot.forEach(doc => {
          mealsData.push({ id: doc.id, ...doc.data() });
        });
        setMeals(mealsData);
      })
    );

    // Listen to naps
    const napsQuery = query(
      collection(db, 'naps'),
      where('childId', '==', child.id),
      orderBy('date', 'desc')
    );
    
    unsubscribes.push(
      onSnapshot(napsQuery, (snapshot) => {
        const napsData = [];
        snapshot.forEach(doc => {
          napsData.push({ id: doc.id, ...doc.data() });
        });
        setNaps(napsData);
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [child.id]);

  // Update child basic information
  const handleUpdateChild = async (updatedData) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'children', child.id), {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });
      setChildData({ ...childData, ...updatedData });
    } catch (error) {
      console.error('Error updating child:', error);
      setError('Failed to update child information');
    } finally {
      setLoading(false);
    }
  };

  // Add new activity
  const handleAddActivity = async (activityData) => {
    try {
      setLoading(true);
      await addDoc(collection(db, 'activities'), {
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        ...activityData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      setError('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance
  const handleMarkAttendance = async (attendanceData) => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Check if attendance already exists for today
      const existingAttendance = attendance.find(att => 
        att.date.split('T')[0] === today
      );

      if (existingAttendance) {
        await updateDoc(doc(db, 'attendance', existingAttendance.id), {
          ...attendanceData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'attendance'), {
          childId: child.id,
          childName: `${child.firstName} ${child.lastName}`,
          date: new Date().toISOString(),
          ...attendanceData,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  // Record meal
  const handleRecordMeal = async (mealData) => {
    try {
      setLoading(true);
      await addDoc(collection(db, 'childMeals'), {
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        date: new Date().toISOString(),
        ...mealData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error recording meal:', error);
      setError('Failed to record meal');
    } finally {
      setLoading(false);
    }
  };

  // Record nap
  const handleRecordNap = async (napData) => {
    try {
      setLoading(true);
      await addDoc(collection(db, 'naps'), {
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        date: new Date().toISOString(),
        ...napData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error recording nap:', error);
      setError('Failed to record nap');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="modal-overlay">
      <div className="modal extra-large-modal">
        <div className="modal-header">
          <h2>{childData.firstName} {childData.lastName} - Details</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`modal-tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities
          </button>
          <button 
            className={`modal-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button 
            className={`modal-tab ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            Meals
          </button>
          <button 
            className={`modal-tab ${activeTab === 'naps' ? 'active' : ''}`}
            onClick={() => setActiveTab('naps')}
          >
            Nap Tracking
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <OverviewTab 
              child={childData} 
              onUpdate={handleUpdateChild}
              loading={loading}
              calculateAge={calculateAge}
            />
          )}
          
          {activeTab === 'activities' && (
            <ActivitiesTab 
              activities={activities}
              onAddActivity={handleAddActivity}
              loading={loading}
            />
          )}
          
          {activeTab === 'attendance' && (
            <AttendanceTab 
              attendance={attendance}
              onMarkAttendance={handleMarkAttendance}
              loading={loading}
            />
          )}
          
          {activeTab === 'meals' && (
            <MealsTab 
              meals={meals}
              onRecordMeal={handleRecordMeal}
              loading={loading}
            />
          )}
          
          {activeTab === 'naps' && (
            <NapsTab 
              naps={naps}
              onRecordNap={handleRecordNap}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ child, onUpdate, loading, calculateAge }) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(child);

  const handleSave = async () => {
    await onUpdate(editData);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditData(child);
    setEditing(false);
  };

  return (
    <div className="overview-tab">
      <div className="child-overview-header">
        <div className="child-avatar-large">
          {child.gender === 'Female' ? '👧' : '👦'}
        </div>
        <div className="child-basic-details">
          <h3>{child.firstName} {child.lastName}</h3>
          <p>Age: {calculateAge(child.dateOfBirth)}</p>
          <p>Group: {child.group}</p>
          <p>Date of Birth: {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="overview-actions">
          {!editing ? (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              Edit Information
            </button>
          ) : (
            <div className="edit-actions">
              <button className="save-btn" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overview-details">
        <div className="detail-section">
          <h4>Basic Information</h4>
          {editing ? (
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editData.firstName || ''}
                    onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editData.lastName || ''}
                    onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={editData.dateOfBirth || ''}
                    onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editData.gender || ''}
                    onChange={(e) => setEditData({...editData, gender: e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Full Name:</span>
                <span className="value">{child.firstName} {child.lastName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Date of Birth:</span>
                <span className="value">{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Gender:</span>
                <span className="value">{child.gender || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Age:</span>
                <span className="value">{calculateAge(child.dateOfBirth)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="detail-section">
          <h4>Parent Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Parent Name:</span>
              <span className="value">{child.parentFirstName} {child.parentLastName}</span>
            </div>
            <div className="detail-item">
              <span className="label">Email:</span>
              <span className="value">{child.parentEmail}</span>
            </div>
            <div className="detail-item">
              <span className="label">Phone:</span>
              <span className="value">{child.parentPhone}</span>
            </div>
            <div className="detail-item">
              <span className="label">Registration Status:</span>
              <span className={`value status ${child.parentRegistered ? 'registered' : 'pending'}`}>
                {child.parentRegistered ? 'Registered' : 'Pending Registration'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Medical & Dietary Information</h4>
          {editing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Allergies (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editData.allergies) ? editData.allergies.join(', ') : editData.allergies || ''}
                  onChange={(e) => setEditData({
                    ...editData, 
                    allergies: e.target.value.split(',').map(a => a.trim()).filter(a => a)
                  })}
                />
              </div>
              <div className="form-group">
                <label>Medical Conditions (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editData.medicalConditions) ? editData.medicalConditions.join(', ') : editData.medicalConditions || ''}
                  onChange={(e) => setEditData({
                    ...editData, 
                    medicalConditions: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                  })}
                />
              </div>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Allergies:</span>
                <span className="value">
                  {Array.isArray(child.allergies) && child.allergies.length > 0 
                    ? child.allergies.join(', ') 
                    : 'None'}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Medical Conditions:</span>
                <span className="value">
                  {Array.isArray(child.medicalConditions) && child.medicalConditions.length > 0 
                    ? child.medicalConditions.join(', ') 
                    : 'None'}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Emergency Contact:</span>
                <span className="value">{child.emergencyContact || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="label">Emergency Phone:</span>
                <span className="value">{child.emergencyPhone || 'Not specified'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Activities Tab Component
const ActivitiesTab = ({ activities, onAddActivity, loading }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'Learning',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const activityTypes = [
    'Learning', 'Art', 'Music', 'Physical', 'Social', 'Reading', 'Science', 'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onAddActivity(newActivity);
    setNewActivity({
      type: 'Learning',
      description: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
  };

  return (
    <div className="activities-tab">
      <div className="tab-header">
        <h3>Activity Log</h3>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Activity'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Activity Type</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                  required
                >
                  {activityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newActivity.date}
                  onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                placeholder="Describe the activity..."
                required
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={newActivity.notes}
                onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Activity'}
            </button>
          </form>
        </div>
      )}

      <div className="activities-list">
        {activities.length === 0 ? (
          <div className="no-data">No activities recorded yet.</div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <span className={`activity-type ${activity.type?.toLowerCase() || 'other'}`}>
                  {activity.type || 'Other'}
                </span>
                <span className="activity-date">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
              </div>
              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                {activity.notes && (
                  <p className="activity-notes">Notes: {activity.notes}</p>
                )}
              </div>
              <div className="activity-footer">
                <span className="activity-time">
                  Added: {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Attendance Tab Component
const AttendanceTab = ({ attendance, onMarkAttendance, loading }) => {
  const [todayAttendance, setTodayAttendance] = useState({
    status: 'present',
    arrivalTime: '',
    departureTime: '',
    notes: ''
  });

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(att => att.date.split('T')[0] === today);

  useEffect(() => {
    if (todayRecord) {
      setTodayAttendance({
        status: todayRecord.status || 'present',
        arrivalTime: todayRecord.arrivalTime || '',
        departureTime: todayRecord.departureTime || '',
        notes: todayRecord.notes || ''
      });
    }
  }, [todayRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onMarkAttendance(todayAttendance);
  };

  return (
    <div className="attendance-tab">
      <div className="tab-header">
        <h3>Attendance Tracking</h3>
      </div>

      <div className="today-attendance">
        <h4>Today's Attendance - {new Date().toLocaleDateString()}</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                value={todayAttendance.status}
                onChange={(e) => setTodayAttendance({...todayAttendance, status: e.target.value})}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
            <div className="form-group">
              <label>Arrival Time</label>
              <input
                type="time"
                value={todayAttendance.arrivalTime}
                onChange={(e) => setTodayAttendance({...todayAttendance, arrivalTime: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Departure Time</label>
              <input
                type="time"
                value={todayAttendance.departureTime}
                onChange={(e) => setTodayAttendance({...todayAttendance, departureTime: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={todayAttendance.notes}
              onChange={(e) => setTodayAttendance({...todayAttendance, notes: e.target.value})}
              placeholder="Any additional notes..."
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Attendance'}
          </button>
        </form>
      </div>

      <div className="attendance-history">
        <h4>Attendance History</h4>
        {attendance.length === 0 ? (
          <div className="no-data">No attendance records yet.</div>
        ) : (
          <div className="attendance-list">
            {attendance.map(record => (
              <div key={record.id} className="attendance-record">
                <div className="record-date">
                  {new Date(record.date).toLocaleDateString()}
                </div>
                <div className="record-details">
                  <span className={`status-badge ${record.status}`}>
                    {record.status}
                  </span>
                  {record.arrivalTime && (
                    <span className="time-info">
                      Arrived: {record.arrivalTime}
                    </span>
                  )}
                  {record.departureTime && (
                    <span className="time-info">
                      Departed: {record.departureTime}
                    </span>
                  )}
                </div>
                {record.notes && (
                  <div className="record-notes">
                    Notes: {record.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Meals Tab Component
const MealsTab = ({ meals, onRecordMeal, loading }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealType: 'breakfast',
    foodItems: '',
    amountEaten: 'all',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const amountOptions = ['all', 'most', 'some', 'little', 'none'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onRecordMeal({
      ...newMeal,
      foodItems: newMeal.foodItems.split(',').map(item => item.trim()).filter(item => item)
    });
    setNewMeal({
      mealType: 'breakfast',
      foodItems: '',
      amountEaten: 'all',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    });
    setShowAddForm(false);
  };

  return (
    <div className="meals-tab">
      <div className="tab-header">
        <h3>Meal Tracking</h3>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Record Meal'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Meal Type</label>
                <select
                  value={newMeal.mealType}
                  onChange={(e) => setNewMeal({...newMeal, mealType: e.target.value})}
                  required
                >
                  {mealTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newMeal.date}
                  onChange={(e) => setNewMeal({...newMeal, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={newMeal.time}
                  onChange={(e) => setNewMeal({...newMeal, time: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Food Items (comma separated)</label>
              <textarea
                value={newMeal.foodItems}
                onChange={(e) => setNewMeal({...newMeal, foodItems: e.target.value})}
                placeholder="e.g., Chicken nuggets, Apple slices, Milk"
                required
              />
            </div>
            <div className="form-group">
              <label>Amount Eaten</label>
              <select
                value={newMeal.amountEaten}
                onChange={(e) => setNewMeal({...newMeal, amountEaten: e.target.value})}
                required
              >
                {amountOptions.map(amount => (
                  <option key={amount} value={amount}>
                    {amount.charAt(0).toUpperCase() + amount.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={newMeal.notes}
                onChange={(e) => setNewMeal({...newMeal, notes: e.target.value})}
                placeholder="Any observations or notes..."
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Meal'}
            </button>
          </form>
        </div>
      )}

      <div className="meals-list">
        {meals.length === 0 ? (
          <div className="no-data">No meal records yet.</div>
        ) : (
          meals.map(meal => (
            <div key={meal.id} className="meal-card">
              <div className="meal-header">
                <span className={`meal-type ${meal.mealType}`}>
                  {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                </span>
                <span className="meal-datetime">
                  {new Date(meal.date).toLocaleDateString()} at {meal.time}
                </span>
              </div>
              <div className="meal-content">
                <div className="food-items">
                  <strong>Food Items:</strong>
                  <ul>
                    {Array.isArray(meal.foodItems) ? 
                      meal.foodItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      )) : 
                      <li>{meal.foodItems}</li>
                    }
                  </ul>
                </div>
                <div className="amount-eaten">
                  <strong>Amount Eaten:</strong> 
                  <span className={`amount ${meal.amountEaten}`}>
                    {meal.amountEaten.charAt(0).toUpperCase() + meal.amountEaten.slice(1)}
                  </span>
                </div>
                {meal.notes && (
                  <div className="meal-notes">
                    <strong>Notes:</strong> {meal.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Naps Tab Component
const NapsTab = ({ naps, onRecordNap, loading }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNap, setNewNap] = useState({
    startTime: '',
    endTime: '',
    quality: 'good',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const qualityOptions = ['excellent', 'good', 'fair', 'poor', 'restless'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate duration
    const start = new Date(`${newNap.date}T${newNap.startTime}`);
    const end = new Date(`${newNap.date}T${newNap.endTime}`);
    const durationMinutes = Math.round((end - start) / (1000 * 60));
    
    await onRecordNap({
      ...newNap,
      duration: durationMinutes
    });
    
    setNewNap({
      startTime: '',
      endTime: '',
      quality: 'good',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
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

  return (
    <div className="naps-tab">
      <div className="tab-header">
        <h3>Nap Tracking</h3>
        <button 
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Record Nap'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newNap.date}
                  onChange={(e) => setNewNap({...newNap, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={newNap.startTime}
                  onChange={(e) => setNewNap({...newNap, startTime: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={newNap.endTime}
                  onChange={(e) => setNewNap({...newNap, endTime: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Sleep Quality</label>
              <select
                value={newNap.quality}
                onChange={(e) => setNewNap({...newNap, quality: e.target.value})}
                required
              >
                {qualityOptions.map(quality => (
                  <option key={quality} value={quality}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={newNap.notes}
                onChange={(e) => setNewNap({...newNap, notes: e.target.value})}
                placeholder="How did the child sleep? Any observations..."
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Nap'}
            </button>
          </form>
        </div>
      )}

      <div className="naps-list">
        {naps.length === 0 ? (
          <div className="no-data">No nap records yet.</div>
        ) : (
          naps.map(nap => (
            <div key={nap.id} className="nap-card">
              <div className="nap-header">
                <span className="nap-date">
                  {new Date(nap.date).toLocaleDateString()}
                </span>
                <span className={`nap-quality ${nap.quality}`}>
                  {nap.quality.charAt(0).toUpperCase() + nap.quality.slice(1)} Sleep
                </span>
              </div>
              <div className="nap-content">
                <div className="nap-time-info">
                  <div className="time-detail">
                    <strong>Start:</strong> {nap.startTime}
                  </div>
                  <div className="time-detail">
                    <strong>End:</strong> {nap.endTime}
                  </div>
                  <div className="time-detail">
                    <strong>Duration:</strong> {formatDuration(nap.duration)}
                  </div>
                </div>
                {nap.notes && (
                  <div className="nap-notes">
                    <strong>Notes:</strong> {nap.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChildDetailsModal;