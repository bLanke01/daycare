// components/parent/ParentActivityView.js
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { useAuth } from '../../firebase/auth-context';
import { db } from '../../firebase/config';

const ParentActivityView = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [dateRange, setDateRange] = useState('week'); // week, month, all
  const [viewMode, setViewMode] = useState('timeline'); // timeline, summary

  // Activity type configurations (same as admin)
  const activityTypes = {
    'Learning': { icon: '📚', color: '#4CAF50' },
    'Physical': { icon: '🏃', color: '#FF9800' },
    'Creative': { icon: '🎨', color: '#E91E63' },
    'Social': { icon: '👥', color: '#2196F3' },
    'Emotional': { icon: '💝', color: '#9C27B0' },
    'Life Skills': { icon: '🏠', color: '#607D8B' },
    'Special Events': { icon: '🎉', color: '#FF5722' }
  };

  // Load parent's children
  useEffect(() => {
    const loadChildren = async () => {
      if (!user) return;
      
      try {
        const childrenQuery = query(
          collection(db, 'children'), 
          where('parentId', '==', user.uid)
        );
        const snapshot = await getDocs(childrenQuery);
        
        const childrenData = [];
        snapshot.forEach(doc => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        
        setChildren(childrenData);
        
        // Set first child as selected
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0]);
        }
      } catch (error) {
        console.error('Error loading children:', error);
        setError('Failed to load children data');
      }
    };

    loadChildren();
  }, [user, selectedChild]);

  // Load activities for selected child
  useEffect(() => {
    if (!selectedChild) {
      setLoading(false);
      return;
    }

    console.log('Setting up activities listener for child:', selectedChild.id);
    
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('childId', '==', selectedChild.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activitiesData = [];
        snapshot.forEach(doc => {
          activitiesData.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Loaded ${activitiesData.length} activities for ${selectedChild.firstName}`);
        setActivities(activitiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading activities:', error);
        setError('Failed to load activities');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedChild]);

  // Filter activities based on date range and type
  const getFilteredActivities = () => {
    let filtered = activities;

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(activity => activity.activityType === filterType);
    }

    // Filter by date range
    const now = new Date();
    if (dateRange === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(activity => new Date(activity.date) >= oneWeekAgo);
    } else if (dateRange === 'month') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter(activity => new Date(activity.date) >= oneMonthAgo);
    }

    return filtered;
  };

  // Group activities for summary view
  const getActivitySummary = () => {
    const filtered = getFilteredActivities();
    const summary = {};

    filtered.forEach(activity => {
      const type = activity.activityType;
      if (!summary[type]) {
        summary[type] = {
          count: 0,
          skills: new Set(),
          recentActivities: [],
          averageEnjoyment: 0,
          developmentProgress: []
        };
      }
      
      summary[type].count++;
      activity.skillsObserved?.forEach(skill => summary[type].skills.add(skill));
      summary[type].recentActivities.push(activity);
      
      // Calculate average enjoyment
      const enjoymentScore = {
        'loved': 5, 'enjoyed': 4, 'neutral': 3, 'disliked': 2, 'frustrated': 1
      };
      summary[type].averageEnjoyment += enjoymentScore[activity.enjoymentLevel] || 3;
      
      summary[type].developmentProgress.push(activity.developmentLevel);
    });

    // Calculate averages
    Object.keys(summary).forEach(type => {
      summary[type].averageEnjoyment = 
        summary[type].averageEnjoyment / summary[type].count;
      summary[type].skills = Array.from(summary[type].skills);
      summary[type].recentActivities = summary[type].recentActivities.slice(0, 3);
    });

    return summary;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Get enjoyment emoji
  const getEnjoymentEmoji = (level) => {
    const emojis = {
      'loved': '😍',
      'enjoyed': '😊',
      'neutral': '😐',
      'disliked': '😕',
      'frustrated': '😤'
    };
    return emojis[level] || '😊';
  };

  // Get development level color
  const getDevelopmentColor = (level) => {
    const colors = {
      'emerging': '#fbbf24',
      'developing': '#3b82f6',
      'ageAppropriate': '#10b981',
      'advanced': '#8b5cf6',
      'needsSupport': '#ef4444'
    };
    return colors[level] || '#6b7280';
  };

  const filteredActivities = getFilteredActivities();
  const activitySummary = getActivitySummary();

  if (loading) {
    return (
      <div className="parent-activity-view">
        <div className="loading">Loading your child's activities...</div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="parent-activity-view">
        <div className="no-children">
          <h2>No Children Found</h2>
          <p>Please contact the daycare if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-activity-view">
      <div className="activity-header">
        <div className="header-content">
          <h1>📚 {selectedChild?.firstName}'s Learning Journey</h1>
          <p>Track your child's daily activities, development, and achievements</p>
        </div>
        
        {children.length > 1 && (
          <div className="child-selector">
            <label>Viewing activities for:</label>
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

      {/* Controls */}
      <div className="activity-controls">
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            📅 Timeline View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'summary' ? 'active' : ''}`}
            onClick={() => setViewMode('summary')}
          >
            📊 Summary View
          </button>
        </div>

        <div className="filters">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Activities</option>
            {Object.keys(activityTypes).map(type => (
              <option key={type} value={type}>
                {activityTypes[type].icon} {type}
              </option>
            ))}
          </select>

          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="activity-stats">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-number">{filteredActivities.length}</span>
            <span className="stat-label">Total Activities</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <span className="stat-number">
              {[...new Set(filteredActivities.flatMap(a => a.skillsObserved || []))].length}
            </span>
            <span className="stat-label">Skills Observed</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <span className="stat-number">
              {filteredActivities.filter(a => a.developmentLevel === 'advanced').length}
            </span>
            <span className="stat-label">Advanced Skills</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">😊</div>
          <div className="stat-info">
            <span className="stat-number">
              {Math.round(
                filteredActivities.filter(a => 
                  a.enjoymentLevel === 'loved' || a.enjoymentLevel === 'enjoyed'
                ).length / filteredActivities.length * 100
              ) || 0}%
            </span>
            <span className="stat-label">Enjoyed</span>
          </div>
        </div>
      </div>

      {/* Content Based on View Mode */}
      {viewMode === 'timeline' ? (
        <div className="timeline-view">
          {filteredActivities.length === 0 ? (
            <div className="no-activities">
              <div className="no-activities-icon">📚</div>
              <h3>No Activities Yet</h3>
              <p>Your child's activities will appear here once teachers start recording them.</p>
            </div>
          ) : (
            <div className="activities-timeline">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="timeline-item">
                  <div className="timeline-marker">
                    <div 
                      className="marker-dot"
                      style={{ backgroundColor: activityTypes[activity.activityType]?.color }}
                    >
                      {activityTypes[activity.activityType]?.icon}
                    </div>
                  </div>
                  
                  <div className="timeline-content">
                    <div className="activity-card-parent">
                      <div className="activity-header-parent">
                        <div className="activity-type-info">
                          <span className="activity-type">{activity.activityType}</span>
                          {activity.activitySubType && (
                            <span className="activity-subtype">{activity.activitySubType}</span>
                          )}
                        </div>
                        <div className="activity-meta-parent">
                          <span className="activity-date">{formatDate(activity.date)}</span>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                      </div>
                      
                      <h3 className="activity-title-parent">{activity.title}</h3>
                      <p className="activity-description-parent">{activity.description}</p>
                      
                      {activity.skillsObserved && activity.skillsObserved.length > 0 && (
                        <div className="skills-section">
                          <h4>Skills Observed:</h4>
                          <div className="skills-list">
                            {activity.skillsObserved.map(skill => (
                              <span key={skill} className="skill-badge">{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="activity-assessment">
                        <div className="assessment-item">
                          <span className="assessment-label">Development:</span>
                          <span 
                            className="assessment-badge"
                            style={{ backgroundColor: getDevelopmentColor(activity.developmentLevel) }}
                          >
                            {activity.developmentLevel?.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        
                        <div className="assessment-item">
                          <span className="assessment-label">Enjoyment:</span>
                          <span className="enjoyment-indicator">
                            {getEnjoymentEmoji(activity.enjoymentLevel)}
                            <span className="enjoyment-text">
                              {activity.enjoymentLevel?.charAt(0).toUpperCase() + activity.enjoymentLevel?.slice(1)}
                            </span>
                          </span>
                        </div>
                        
                        <div className="assessment-item">
                          <span className="assessment-label">Participation:</span>
                          <span className="participation-level">
                            {activity.participationLevel?.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      </div>
                      
                      {activity.nextSteps && (
                        <div className="next-steps-parent">
                          <h4>💡 Next Steps:</h4>
                          <p>{activity.nextSteps}</p>
                        </div>
                      )}
                      
                      {activity.notes && (
                        <div className="teacher-notes">
                          <h4>👩‍🏫 Teacher's Notes:</h4>
                          <p>{activity.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="summary-view">
          {Object.keys(activitySummary).length === 0 ? (
            <div className="no-summary">
              <p>No activities to summarize for the selected period.</p>
            </div>
          ) : (
            <div className="summary-grid">
              {Object.entries(activitySummary).map(([type, data]) => (
                <div key={type} className="summary-card">
                  <div className="summary-header">
                    <div className="summary-type">
                      <span className="type-icon-large">
                        {activityTypes[type]?.icon}
                      </span>
                      <h3>{type} Activities</h3>
                    </div>
                    <div className="activity-count">
                      {data.count} activities
                    </div>
                  </div>
                  
                  <div className="summary-content">
                    <div className="enjoyment-meter">
                      <span className="meter-label">Enjoyment Level:</span>
                      <div className="meter-bar">
                        <div 
                          className="meter-fill"
                          style={{ 
                            width: `${(data.averageEnjoyment / 5) * 100}%`,
                            backgroundColor: activityTypes[type]?.color 
                          }}
                        ></div>
                      </div>
                      <span className="meter-value">
                        {getEnjoymentEmoji(
                          data.averageEnjoyment >= 4.5 ? 'loved' :
                          data.averageEnjoyment >= 3.5 ? 'enjoyed' :
                          data.averageEnjoyment >= 2.5 ? 'neutral' :
                          data.averageEnjoyment >= 1.5 ? 'disliked' : 'frustrated'
                        )}
                      </span>
                    </div>
                    
                    {data.skills.length > 0 && (
                      <div className="skills-summary">
                        <h4>Skills Developed:</h4>
                        <div className="skills-list">
                          {data.skills.slice(0, 4).map(skill => (
                            <span key={skill} className="skill-badge-summary">{skill}</span>
                          ))}
                          {data.skills.length > 4 && (
                            <span className="skills-more">+{data.skills.length - 4} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="recent-activities">
                      <h4>Recent Activities:</h4>
                      <ul>
                        {data.recentActivities.map(activity => (
                          <li key={activity.id}>{activity.title}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentActivityView;