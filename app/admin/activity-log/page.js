// app/admin/activity-log/page.js
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
    <div className="min-h-screen p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📝 Activity Log</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Record New Activity
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="card bg-base-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label">Child:</label>
            <select 
              className="select select-bordered w-full"
              value={filterChild} 
              onChange={(e) => setFilterChild(e.target.value)}
            >
              <option value="All">All Children</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-control">
            <label className="label">Activity Type:</label>
            <select 
              className="select select-bordered w-full"
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              {Object.keys(activityTypes).map(type => (
                <option key={type} value={type}>
                  {activityTypes[type].icon} {type}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-control">
            <label className="label">Date:</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            className="btn btn-ghost"
            onClick={() => {
              setFilterChild('All');
              setFilterType('All');
              setFilterDate('');
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activities Display */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : Object.keys(groupedActivities).length === 0 ? (
          <div className="text-center py-8">
            <div className="card bg-base-200 p-8">
              <p className="text-lg">No activities found matching your filters.</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, dayActivities]) => (
              <div key={date} className="space-y-4">
                <h2 className="text-2xl font-bold divider">{formatDate(date)}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayActivities.map(activity => (
                    <div 
                      key={activity.id} 
                      className="card bg-base-100 shadow-xl"
                      style={{ borderLeft: `4px solid ${activityTypes[activity.activityType]?.color || '#ccc'}` }}
                    >
                      <div className="card-body">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">
                            {activityTypes[activity.activityType]?.icon || '📝'}
                          </span>
                          <div>
                            <h3 className="font-bold">{activity.activityType}</h3>
                            {activity.activitySubType && (
                              <p className="text-sm opacity-70">{activity.activitySubType}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                          <span className="badge badge-lg">{activity.childName}</span>
                          <span className="text-sm opacity-70">{activity.time}</span>
                        </div>

                        <h4 className="font-semibold text-lg mb-2">{activity.title}</h4>
                        <p className="text-sm mb-4">{activity.description}</p>

                        {activity.skillsObserved.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold mb-2">Skills Observed:</h5>
                            <div className="flex flex-wrap gap-2">
                              {activity.skillsObserved.map(skill => (
                                <span key={skill} className="badge badge-primary">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                          <div className="indicator">
                            <span className="text-sm">Development:</span>
                            <span className="badge badge-ghost">
                              {developmentLevels.find(l => l.value === activity.developmentLevel)?.label.split(' - ')[0]}
                            </span>
                          </div>
                          
                          <div className="indicator">
                            <span className="text-sm">Participation:</span>
                            <span className="badge badge-ghost">
                              {participationLevels.find(l => l.value === activity.participationLevel)?.label}
                            </span>
                          </div>
                          
                          <div className="indicator">
                            <span className="text-sm">Enjoyment:</span>
                            <span className="badge badge-ghost">
                              {enjoymentLevels.find(l => l.value === activity.enjoymentLevel)?.label}
                            </span>
                          </div>
                        </div>

                        {activity.duration && (
                          <div className="text-sm opacity-70">
                            Duration: {activity.duration}
                          </div>
                        )}

                        {activity.nextSteps && (
                          <div className="mt-4">
                            <h5 className="font-semibold">Next Steps:</h5>
                            <p className="text-sm">{activity.nextSteps}</p>
                          </div>
                        )}

                        {activity.notes && (
                          <div className="mt-4">
                            <h5 className="font-semibold">Additional Notes:</h5>
                            <p className="text-sm">{activity.notes}</p>
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
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📝 Record New Activity</h2>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">Child *</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Date *</label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      name="date"
                      value={newActivity.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Time *</label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      name="time"
                      value={newActivity.time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="form-control">
                    <label className="label">Activity Type *</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Specific Activity</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Duration</label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      name="duration"
                      value={newActivity.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 30 minutes, 1 hour"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Activity Details</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Activity Title *</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    name="title"
                    value={newActivity.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Letter Recognition Game, Outdoor Nature Walk"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">Description *</label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    name="description"
                    value={newActivity.description}
                    onChange={handleInputChange}
                    placeholder="Describe what the child did during this activity..."
                    required
                  />
                </div>
              </div>

              {/* Assessment */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Assessment & Observations</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Skills Observed</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {skillCategories.map(skill => (
                      <label key={skill} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="checkbox"
                          name="skillsObserved"
                          value={skill}
                          checked={newActivity.skillsObserved.includes(skill)}
                          onChange={handleInputChange}
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">Development Level *</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Participation Level *</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Enjoyment Level *</label>
                    <select
                      className="select select-bordered w-full"
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
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Additional Information</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Next Steps/Recommendations</label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    name="nextSteps"
                    value={newActivity.nextSteps}
                    onChange={handleInputChange}
                    placeholder="What should be done next to support this child's development?"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">Additional Notes</label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    name="notes"
                    value={newActivity.notes}
                    onChange={handleInputChange}
                    placeholder="Any other observations, behaviors, or important details..."
                  />
                </div>
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Recording...' : '📝 Record Activity'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost"
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