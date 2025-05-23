// components/admin/ActivityLog.js
'use client';

import { useState } from 'react';

const ActivityLog = () => {
  // Mock data for activities
  const [activities, setActivities] = useState([
    {
      id: 1,
      childName: 'Emma Thompson',
      activityType: 'Learning',
      description: 'Participated in alphabet recognition activity. Identified 18 out of 26 letters correctly.',
      date: '2025-05-05T10:30:00Z',
      staff: 'Lisa Johnson',
      photos: []
    },
    {
      id: 2,
      childName: 'Noah Garcia',
      activityType: 'Art',
      description: 'Created a finger painting depicting his family. Used multiple colors and showed attention to detail.',
      date: '2025-05-05T11:15:00Z',
      staff: 'Michael Brown',
      photos: ['noah_painting.jpg']
    },
    {
      id: 3,
      childName: 'Olivia Martinez',
      activityType: 'Social',
      description: 'Shared toys with other children during free play. Showed improved socialization skills.',
      date: '2025-05-05T09:45:00Z',
      staff: 'Lisa Johnson',
      photos: []
    },
    {
      id: 4,
      childName: 'William Johnson',
      activityType: 'Physical',
      description: 'Participated in outdoor obstacle course. Showed good coordination and balance.',
      date: '2025-05-04T14:20:00Z',
      staff: 'David Wilson',
      photos: ['william_obstacle.jpg']
    },
    {
      id: 5,
      childName: 'Sophia Wilson',
      activityType: 'Music',
      description: 'Engaged with rhythm instruments during music time. Showed interest in different sounds.',
      date: '2025-05-04T10:00:00Z',
      staff: 'Rachel Adams',
      photos: []
    },
    {
      id: 6,
      childName: 'Emma Thompson',
      activityType: 'Reading',
      description: 'Listened attentively during story time. Answered questions about the story "The Very Hungry Caterpillar".',
      date: '2025-05-04T11:30:00Z',
      staff: 'Lisa Johnson',
      photos: []
    },
    {
      id: 7,
      childName: 'Noah Garcia',
      activityType: 'Science',
      description: 'Participated in seed planting activity. Asked thoughtful questions about plant growth.',
      date: '2025-05-03T10:15:00Z',
      staff: 'Michael Brown',
      photos: ['noah_planting.jpg']
    }
  ]);
  
  // State for form and filters
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [filterChild, setFilterChild] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [newActivity, setNewActivity] = useState({
    childName: '',
    activityType: 'Learning',
    description: '',
    staff: '',
    photos: []
  });
  
  // List of unique children and activity types for filtering
  const uniqueChildren = ['All', ...new Set(activities.map(activity => activity.childName))];
  const activityTypes = [
    'All',
    'Learning',
    'Art',
    'Social',
    'Physical',
    'Music',
    'Reading',
    'Science',
    'Other'
  ];
  
  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesChild = filterChild === 'All' || activity.childName === filterChild;
    const matchesType = filterType === 'All' || activity.activityType === filterType;
    
    let matchesDate = true;
    if (filterDate) {
      const activityDate = new Date(activity.date).toISOString().split('T')[0];
      matchesDate = activityDate === filterDate;
    }
    
    return matchesChild && matchesType && matchesDate;
  });
  
  // Sort activities by date (most recent first)
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  // Group activities by date
  const groupActivitiesByDate = () => {
    const grouped = {};
    
    sortedActivities.forEach(activity => {
      const date = new Date(activity.date).toISOString().split('T')[0];
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(activity);
    });
    
    return grouped;
  };
  
  const groupedActivities = groupActivitiesByDate();
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewActivity({
      ...newActivity,
      [name]: value
    });
  };
  
  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileNames = files.map(file => file.name);
    
    setNewActivity({
      ...newActivity,
      photos: [...newActivity.photos, ...fileNames]
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newActivityObj = {
      id: activities.length + 1,
      ...newActivity,
      date: new Date().toISOString()
    };
    
    setActivities([...activities, newActivityObj]);
    setShowForm(false);
    setNewActivity({
      childName: '',
      activityType: 'Learning',
      description: '',
      staff: '',
      photos: []
    });
  };
  
  // View activity details
  const viewActivityDetails = (activity) => {
    setSelectedActivity(activity);
  };
  
  return (
    <div className="activity-log">
      <div className="page-header">
        <h1>Activity Log</h1>
        <button 
          className="add-activity-btn"
          onClick={() => setShowForm(true)}
        >
          Record New Activity
        </button>
      </div>
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="childFilter">Child:</label>
          <select
            id="childFilter"
            value={filterChild}
            onChange={(e) => setFilterChild(e.target.value)}
          >
            {uniqueChildren.map((child, index) => (
              <option key={index} value={child}>{child}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="typeFilter">Activity Type:</label>
          <select
            id="typeFilter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {activityTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="dateFilter">Date:</label>
          <input
            type="date"
            id="dateFilter"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        
        <button 
          className="clear-filter-btn"
          onClick={() => {
            setFilterChild('All');
            setFilterType('All');
            setFilterDate('');
          }}
        >
          Clear Filters
        </button>
      </div>
      
      <div className="activities-container">
        {Object.entries(groupedActivities).length > 0 ? (
          Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <div key={date} className="activity-day">
              <h2 className="day-header">{formatDate(date)}</h2>
              
              <div className="activity-list">
                {dayActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className="activity-item"
                    onClick={() => viewActivityDetails(activity)}
                  >
                    <div className="activity-time">{formatTime(activity.date)}</div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="child-name">{activity.childName}</span>
                        <span className={`activity-type ${activity.activityType.toLowerCase()}`}>
                          {activity.activityType}
                        </span>
                      </div>
                      <p className="activity-description">{activity.description}</p>
                      <div className="activity-footer">
                        <span className="staff-name">Recorded by: {activity.staff}</span>
                        {activity.photos.length > 0 && (
                          <span className="photo-indicator">📷 {activity.photos.length} photo(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            <p>No activities match your filters.</p>
          </div>
        )}
      </div>
      
      {/* Record Activity Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Record New Activity</h2>
              <button 
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="childName">Child</label>
                <select
                  id="childName"
                  name="childName"
                  value={newActivity.childName}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a child</option>
                  {uniqueChildren.filter(child => child !== 'All').map((child, index) => (
                    <option key={index} value={child}>{child}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="activityType">Activity Type</label>
                <select
                  id="activityType"
                  name="activityType"
                  value={newActivity.activityType}
                  onChange={handleInputChange}
                  required
                >
                  {activityTypes.filter(type => type !== 'All').map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newActivity.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="staff">Recorded By</label>
                <input
                  type="text"
                  id="staff"
                  name="staff"
                  value={newActivity.staff}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="photos">Upload Photos</label>
                <input
                  type="file"
                  id="photos"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                />
              </div>
              
              {newActivity.photos.length > 0 && (
                <div className="selected-photos">
                  <h4>Selected Photos:</h4>
                  <ul>
                    {newActivity.photos.map((photo, index) => (
                      <li key={index}>{photo}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">Record Activity</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Activity Details</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedActivity(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="activity-details">
              <div className="detail-item">
                <span className="detail-label">Child:</span>
                <span className="detail-value">{selectedActivity.childName}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Date & Time:</span>
                <span className="detail-value">
                  {formatDate(selectedActivity.date)} at {formatTime(selectedActivity.date)}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Activity Type:</span>
                <span className={`detail-value activity-type ${selectedActivity.activityType.toLowerCase()}`}>
                  {selectedActivity.activityType}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <p className="detail-value description">{selectedActivity.description}</p>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Recorded By:</span>
                <span className="detail-value">{selectedActivity.staff}</span>
              </div>
              
              {selectedActivity.photos.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Photos:</span>
                  <div className="photo-gallery">
                    {selectedActivity.photos.map((photo, index) => (
                      <div key={index} className="photo-thumbnail">
                        {/* In a real app, you would display actual images here */}
                        <div className="photo-placeholder">
                          📷 {photo}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="edit-btn"
                onClick={() => {
                  // Would implement edit functionality here
                  setSelectedActivity(null);
                }}
              >
                Edit Activity
              </button>
              <button 
                className="print-btn"
                onClick={() => {
                  // Would implement print functionality here
                  console.log('Print activity:', selectedActivity);
                }}
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;