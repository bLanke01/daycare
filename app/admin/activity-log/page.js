// components/admin/ActivityLog.js
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ActivityLog = () => {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterChild, setFilterChild] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [selectedChild, setSelectedChild] = useState(null);

  //  activity form state
  const [newActivity, setNewActivity] = useState({
    childId: '',
    activityType: 'Learning',
    activitySubType: '',
    title: '',
    description: '',
    duration: '',
    skillsObserved: [],
    developmentLevel: 'ageAppropriate',
    participationLevel: 'full',
    enjoymentLevel: 'enjoyed',
    notes: '',
    photos: [],
    learningObjectives: [],
    nextSteps: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });

  // Comprehensive activity types with subtypes
  const activityTypes = {
    'Learning': {
      icon: '📚',
      color: '#4CAF50',
      subtypes: [
        'Alphabet Recognition',
        'Number Concepts',
        'Reading/Story Time',
        'Writing Practice',
        'Science Exploration',
        'Shape Recognition',
        'Color Learning',
        'Problem Solving',
        'Memory Games',
        'Educational Apps'
      ]
    },
    'Physical': {
      icon: '🏃',
      color: '#FF9800',
      subtypes: [
        'Outdoor Play',
        'Obstacle Course',
        'Dancing/Movement',
        'Fine Motor Skills',
        'Gross Motor Development',
        'Sports Activities',
        'Balance & Coordination',
        'Playground Activities',
        'Yoga/Stretching',
        'Running/Walking'
      ]
    },
    'Creative': {
      icon: '🎨',
      color: '#E91E63',
      subtypes: [
        'Painting',
        'Drawing',
        'Arts & Crafts',
        'Music & Singing',
        'Dramatic Play',
        'Building Blocks',
        'Sensory Play',
        'Collage Making',
        'Clay/Play-Doh',
        'Musical Instruments'
      ]
    },
    'Social': {
      icon: '👥',
      color: '#2196F3',
      subtypes: [
        'Sharing & Cooperation',
        'Conflict Resolution',
        'Helping Others',
        'Group Activities',
        'Turn Taking',
        'Friendship Building',
        'Communication Skills',
        'Leadership',
        'Teamwork',
        'Cultural Activities'
      ]
    },
    'Emotional': {
      icon: '💝',
      color: '#9C27B0',
      subtypes: [
        'Emotional Expression',
        'Self-Regulation',
        'Empathy Development',
        'Confidence Building',
        'Mindfulness',
        'Coping Strategies',
        'Self-Awareness',
        'Gratitude Practice',
        'Celebrating Achievements',
        'Processing Feelings'
      ]
    },
    'Life Skills': {
      icon: '🏠',
      color: '#607D8B',
      subtypes: [
        'Potty Training',
        'Self-Help Skills',
        'Cleanup Activities',
        'Following Routines',
        'Independence',
        'Personal Hygiene',
        'Table Manners',
        'Responsibility',
        'Organization',
        'Safety Awareness'
      ]
    },
    'Special Events': {
      icon: '🎉',
      color: '#FF5722',
      subtypes: [
        'Field Trip',
        'Holiday Celebration',
        'Birthday Party',
        'Guest Visitor',
        'Cultural Event',
        'Community Helper Visit',
        'Special Project',
        'Achievement Celebration',
        'Family Event',
        'Seasonal Activity'
      ]
    }
  };

  const skillCategories = [
    'Communication', 'Problem Solving', 'Creativity', 'Social Skills',
    'Motor Skills', 'Cognitive Development', 'Emotional Intelligence',
    'Independence', 'Following Instructions', 'Attention Span'
  ];

  const developmentLevels = [
    { value: 'emerging', label: 'Emerging - Just starting to show this skill' },
    { value: 'developing', label: 'Developing - Working on this skill' },
    { value: 'ageAppropriate', label: 'Age Appropriate - Meets expected level' },
    { value: 'advanced', label: 'Advanced - Exceeds expectations' },
    { value: 'needsSupport', label: 'Needs Support - Requires additional help' }
  ];

  const participationLevels = [
    { value: 'full', label: 'Full Participation' },
    { value: 'partial', label: 'Partial Participation' },
    { value: 'observed', label: 'Observed Only' },
    { value: 'reluctant', label: 'Reluctant/Needed Encouragement' },
    { value: 'refused', label: 'Refused to Participate' }
  ];

  const enjoymentLevels = [
    { value: 'loved', label: 'Loved It! 😍' },
    { value: 'enjoyed', label: 'Enjoyed It 😊' },
    { value: 'neutral', label: 'Neutral 😐' },
    { value: 'disliked', label: 'Seemed to Dislike 😕' },
    { value: 'frustrated', label: 'Frustrated 😤' }
  ];

  // Load children and activities
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load children
        const childrenSnapshot = await getDocs(collection(db, 'children'));
        const childrenList = [];
        childrenSnapshot.forEach(doc => {
          childrenList.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenList);

        // Set up real-time listener for activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
          const activitiesData = [];
          snapshot.forEach(doc => {
            activitiesData.push({ id: doc.id, ...doc.data() });
          });
          setActivities(activitiesData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'skillsObserved') {
        setNewActivity(prev => ({
          ...prev,
          skillsObserved: checked 
            ? [...prev.skillsObserved, value]
            : prev.skillsObserved.filter(skill => skill !== value)
        }));
      } else if (name === 'learningObjectives') {
        setNewActivity(prev => ({
          ...prev,
          learningObjectives: checked 
            ? [...prev.learningObjectives, value]
            : prev.learningObjectives.filter(obj => obj !== value)
        }));
      }
    } else {
      setNewActivity(prev => ({
        ...prev,
        [name]: value,
        // Auto-clear subtype when main type changes
        ...(name === 'activityType' && { activitySubType: '' })
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const child = children.find(c => c.id === newActivity.childId);
      const activityData = {
        ...newActivity,
        childName: `${child.firstName} ${child.lastName}`,
        childGroup: child.group,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'admin' // In real app, would use current user
      };

      await addDoc(collection(db, 'activities'), activityData);
      
      // Reset form
      setNewActivity({
        childId: '',
        activityType: 'Learning',
        activitySubType: '',
        title: '',
        description: '',
        duration: '',
        skillsObserved: [],
        developmentLevel: 'ageAppropriate',
        participationLevel: 'full',
        enjoymentLevel: 'enjoyed',
        notes: '',
        photos: [],
        learningObjectives: [],
        nextSteps: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
      });
      
      setShowForm(false);
    } catch (error) {
      console.error('Error adding activity:', error);
      setError('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesChild = filterChild === 'All' || activity.childId === filterChild;
    const matchesType = filterType === 'All' || activity.activityType === filterType;
    
    let matchesDate = true;
    if (filterDate) {
      const activityDate = new Date(activity.date).toISOString().split('T')[0];
      matchesDate = activityDate === filterDate;
    }
    
    return matchesChild && matchesType && matchesDate;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.date).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity)
    return groups;
  }, {});

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="activity-log">
      <div className="page-header">
        <h1>📝  Activity Log</h1>
        <button 
          className="add-activity-btn"
          onClick={() => setShowForm(true)}
        >
          ➕ Record New Activity
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Child:</label>
          <select value={filterChild} onChange={(e) => setFilterChild(e.target.value)}>
            <option value="All">All Children</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Activity Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            {Object.keys(activityTypes).map(type => (
              <option key={type} value={type}>
                {activityTypes[type].icon} {type}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        
        <button 
          className="clear-filters"
          onClick={() => {
            setFilterChild('All');
            setFilterType('All');
            setFilterDate('');
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* Activities Display */}
      <div className="activities-container">
        {loading ? (
          <div className="loading">Loading activities...</div>
        ) : Object.keys(groupedActivities).length === 0 ? (
          <div className="no-activities">
            <p>No activities found matching your filters.</p>
          </div>
        ) : (
          Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, dayActivities]) => (
              <div key={date} className="day-group">
                <h2 className="day-header">{formatDate(date)}</h2>
                <div className="activities-grid">
                  {dayActivities.map(activity => (
                    <div 
                      key={activity.id} 
                      className="activity-card"
                      style={{ borderLeft: `4px solid ${activityTypes[activity.activityType]?.color || '#ccc'}` }}
                    >
                      <div className="activity-header">
                        <div className="activity-type-badge">
                          <span className="type-icon">
                            {activityTypes[activity.activityType]?.icon || '📝'}
                          </span>
                          <div className="type-info">
                            <span className="main-type">{activity.activityType}</span>
                            {activity.activitySubType && (
                              <span className="sub-type">{activity.activitySubType}</span>
                            )}
                          </div>
                        </div>
                        <div className="activity-meta">
                          <span className="child-name">{activity.childName}</span>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>

                      <div className="activity-content">
                        <h3 className="activity-title">{activity.title}</h3>
                        <p className="activity-description">{activity.description}</p>

                        {activity.skillsObserved.length > 0 && (
                          <div className="skills-observed">
                            <h4>Skills Observed:</h4>
                            <div className="skills-tags">
                              {activity.skillsObserved.map(skill => (
                                <span key={skill} className="skill-tag">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="activity-indicators">
                          <div className="indicator">
                            <span className="label">Development:</span>
                            <span className={`badge development-${activity.developmentLevel}`}>
                              {developmentLevels.find(l => l.value === activity.developmentLevel)?.label.split(' - ')[0]}
                            </span>
                          </div>
                          
                          <div className="indicator">
                            <span className="label">Participation:</span>
                            <span className={`badge participation-${activity.participationLevel}`}>
                              {participationLevels.find(l => l.value === activity.participationLevel)?.label}
                            </span>
                          </div>
                          
                          <div className="indicator">
                            <span className="label">Enjoyment:</span>
                            <span className={`badge enjoyment-${activity.enjoymentLevel}`}>
                              {enjoymentLevels.find(l => l.value === activity.enjoymentLevel)?.label}
                            </span>
                          </div>
                        </div>

                        {activity.duration && (
                          <div className="activity-duration">
                            <span className="label">Duration:</span>
                            <span className="value">{activity.duration}</span>
                          </div>
                        )}

                        {activity.nextSteps && (
                          <div className="next-steps">
                            <h4>Next Steps:</h4>
                            <p>{activity.nextSteps}</p>
                          </div>
                        )}

                        {activity.notes && (
                          <div className="activity-notes">
                            <h4>Additional Notes:</h4>
                            <p>{activity.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Activity Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h2>📝 Record New Activity</h2>
              <button 
                className="close-btn"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="activity-form">
              {/* Basic Information */}
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Child *</label>
                    <select
                      name="childId"
                      value={newActivity.childId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a child</option>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.firstName} {child.lastName} ({child.group})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={newActivity.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Time *</label>
                    <input
                      type="time"
                      name="time"
                      value={newActivity.time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Activity Type *</label>
                    <select
                      name="activityType"
                      value={newActivity.activityType}
                      onChange={handleInputChange}
                      required
                    >
                      {Object.entries(activityTypes).map(([type, info]) => (
                        <option key={type} value={type}>
                          {info.icon} {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Specific Activity</label>
                    <select
                      name="activitySubType"
                      value={newActivity.activitySubType}
                      onChange={handleInputChange}
                    >
                      <option value="">Select specific activity</option>
                      {newActivity.activityType && 
                        activityTypes[newActivity.activityType].subtypes.map(subtype => (
                          <option key={subtype} value={subtype}>{subtype}</option>
                        ))
                      }
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      name="duration"
                      value={newActivity.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 30 minutes, 1 hour"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="form-section">
                <h3>Activity Details</h3>
                
                <div className="form-group">
                  <label>Activity Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={newActivity.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Letter Recognition Game, Outdoor Nature Walk"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={newActivity.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe what the child did during this activity..."
                    required
                  />
                </div>
              </div>

              {/* Assessment */}
              <div className="form-section">
                <h3>Assessment & Observations</h3>
                
                <div className="form-group">
                  <label>Skills Observed</label>
                  <div className="checkbox-grid">
                    {skillCategories.map(skill => (
                      <label key={skill} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="skillsObserved"
                          value={skill}
                          checked={newActivity.skillsObserved.includes(skill)}
                          onChange={handleInputChange}
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Development Level *</label>
                    <select
                      name="developmentLevel"
                      value={newActivity.developmentLevel}
                      onChange={handleInputChange}
                      required
                    >
                      {developmentLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Participation Level *</label>
                    <select
                      name="participationLevel"
                      value={newActivity.participationLevel}
                      onChange={handleInputChange}
                      required
                    >
                      {participationLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Enjoyment Level *</label>
                    <select
                      name="enjoymentLevel"
                      value={newActivity.enjoymentLevel}
                      onChange={handleInputChange}
                      required
                    >
                      {enjoymentLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="form-section">
                <h3>Additional Information</h3>
                
                <div className="form-group">
                  <label>Next Steps/Recommendations</label>
                  <textarea
                    name="nextSteps"
                    value={newActivity.nextSteps}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="What should be done next to support this child's development?"
                  />
                </div>
                
                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    value={newActivity.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any other observations, behaviors, or important details..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Recording...' : '📝 Record Activity'}
                </button>
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
    </div>
  );
};

export default ActivityLog;