// app/admin/meals/page.js - Comprehensive Meal Tracking System
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
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function MealTrackingPage() {
  const [children, setChildren] = useState([]);
  const [mealPlans, setMealPlans] = useState({});
  const [childMealRecords, setChildMealRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState('planning'); // 'planning', 'recording', 'reports'
  const [showMealForm, setShowMealForm] = useState(false);
  const [error, setError] = useState('');

  // Meal planning state
  const [newMealPlan, setNewMealPlan] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'breakfast',
    mainDish: '',
    sideDish: '',
    drink: '',
    dessert: '',
    allergens: [],
    notes: ''
  });

  // Individual meal recording state
  const [mealRecording, setMealRecording] = useState({
    childId: '',
    mealType: 'breakfast',
    foodItems: '',
    amountEaten: 'all',
    enjoymentLevel: 'good',
    notes: '',
    time: new Date().toTimeString().slice(0, 5)
  });

  const mealTypes = ['breakfast', 'morning-snack', 'lunch', 'afternoon-snack', 'dinner'];
  const amountOptions = ['all', 'most', 'some', 'little', 'none'];
  const enjoymentLevels = ['loved', 'liked', 'good', 'okay', 'disliked'];
  const commonAllergens = ['dairy', 'eggs', 'nuts', 'peanuts', 'wheat', 'soy', 'fish', 'shellfish'];

  // Load children and meal data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load children
        const childrenSnapshot = await getDocs(
          query(collection(db, 'children'), orderBy('firstName'))
        );
        
        const childrenList = [];
        childrenSnapshot.forEach(doc => {
          childrenList.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenList);

        // Load meal plans for selected date
        const mealPlansSnapshot = await getDocs(
          query(
            collection(db, 'mealPlans'),
            where('date', '==', selectedDate)
          )
        );
        
        const plansData = {};
        mealPlansSnapshot.forEach(doc => {
          const data = doc.data();
          plansData[data.mealType] = data;
        });
        setMealPlans(plansData);

        // Load individual meal records
        const mealRecordsSnapshot = await getDocs(
          query(
            collection(db, 'childMeals'),
            where('date', '>=', selectedDate + 'T00:00:00.000Z'),
            where('date', '<=', selectedDate + 'T23:59:59.999Z'),
            orderBy('date', 'desc')
          )
        );
        
        const recordsData = [];
        mealRecordsSnapshot.forEach(doc => {
          recordsData.push({ id: doc.id, ...doc.data() });
        });
        setChildMealRecords(recordsData);

      } catch (error) {
        console.error('Error loading meal data:', error);
        setError('Failed to load meal data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Handle meal plan creation
  const handleCreateMealPlan = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const mealPlanId = `${newMealPlan.date}_${newMealPlan.mealType}`;
      
      const mealPlanData = {
        ...newMealPlan,
        id: mealPlanId,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };
      
      await setDoc(doc(db, 'mealPlans', mealPlanId), mealPlanData);
      
      // Update local state
      setMealPlans(prev => ({
        ...prev,
        [newMealPlan.mealType]: mealPlanData
      }));
      
      // Reset form
      setNewMealPlan({
        date: selectedDate,
        mealType: 'breakfast',
        mainDish: '',
        sideDish: '',
        drink: '',
        dessert: '',
        allergens: [],
        notes: ''
      });
      
      setShowMealForm(false);
      
    } catch (error) {
      console.error('Error creating meal plan:', error);
      setError('Failed to create meal plan');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual meal recording
  const handleRecordMeal = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const child = children.find(c => c.id === mealRecording.childId);
      const mealRecordId = `${mealRecording.childId}_${selectedDate}_${mealRecording.mealType}_${Date.now()}`;
      
      const mealRecordData = {
        id: mealRecordId,
        childId: mealRecording.childId,
        childName: `${child.firstName} ${child.lastName}`,
        date: new Date().toISOString(),
        mealType: mealRecording.mealType,
        foodItems: mealRecording.foodItems.split(',').map(item => item.trim()).filter(item => item),
        amountEaten: mealRecording.amountEaten,
        enjoymentLevel: mealRecording.enjoymentLevel,
        time: mealRecording.time,
        notes: mealRecording.notes,
        recordedBy: 'admin',
        recordedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'childMeals', mealRecordId), mealRecordData);
      
      // Update local state
      setChildMealRecords(prev => [mealRecordData, ...prev]);
      
      // Reset form
      setMealRecording({
        childId: '',
        mealType: 'breakfast',
        foodItems: '',
        amountEaten: 'all',
        enjoymentLevel: 'good',
        notes: '',
        time: new Date().toTimeString().slice(0, 5)
      });
      
    } catch (error) {
      console.error('Error recording meal:', error);
      setError('Failed to record meal');
    } finally {
      setLoading(false);
    }
  };

  // Check for allergen conflicts
  const checkAllergenConflicts = (allergens) => {
    if (!allergens || allergens.length === 0) return [];
    
    return children.filter(child => 
      child.allergies && 
      child.allergies.some(allergy => 
        allergens.some(planAllergen => 
          allergy.toLowerCase().includes(planAllergen.toLowerCase())
        )
      )
    );
  };

  // Format meal time display
  const formatMealType = (mealType) => {
    return mealType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get meal icon
  const getMealIcon = (mealType) => {
    const icons = {
      'breakfast': '🌅',
      'morning-snack': '🍎',
      'lunch': '🍽️',
      'afternoon-snack': '🥨',
      'dinner': '🌙'
    };
    return icons[mealType] || '🍽️';
  };

  // Get color for amount eaten
  const getAmountColor = (amount) => {
    const colors = {
      'all': '#28a745',
      'most': '#6c757d',
      'some': '#ffc107',
      'little': '#fd7e14',
      'none': '#dc3545'
    };
    return colors[amount] || '#6c757d';
  };

  if (loading && children.length === 0) {
    return <div className="loading">Loading meal tracking system...</div>;
  }

  return (
    <div className="meal-tracking-container">
      <div className="page-header">
        <h1>🍽️ Meal Tracking & Planning</h1>
        <div className="header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <div className="view-tabs">
            <button 
              className={`tab-btn ${activeView === 'planning' ? 'active' : ''}`}
              onClick={() => setActiveView('planning')}
            >
              📋 Meal Planning
            </button>
            <button 
              className={`tab-btn ${activeView === 'recording' ? 'active' : ''}`}
              onClick={() => setActiveView('recording')}
            >
              📝 Record Meals
            </button>
            <button 
              className={`tab-btn ${activeView === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveView('reports')}
            >
              📊 Reports
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Meal Planning View */}
      {activeView === 'planning' && (
        <div className="planning-view">
          <div className="planning-header">
            <h2>📅 Daily Meal Plan - {new Date(selectedDate).toLocaleDateString()}</h2>
            <button 
              className="add-meal-btn"
              onClick={() => setShowMealForm(true)}
            >
              ➕ Add Meal Plan
            </button>
          </div>

          <div className="meal-plans-grid">
            {mealTypes.map(mealType => {
              const plan = mealPlans[mealType];
              const conflictedChildren = plan ? checkAllergenConflicts(plan.allergens) : [];
              
              return (
                <div key={mealType} className="meal-plan-card">
                  <div className="meal-header">
                    <h3>{getMealIcon(mealType)} {formatMealType(mealType)}</h3>
                    {plan && (
                      <button 
                        className="edit-plan-btn"
                        onClick={() => {
                          setNewMealPlan(plan);
                          setShowMealForm(true);
                        }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                  
                  {plan ? (
                    <div className="meal-content">
                      <div className="meal-items">
                        {plan.mainDish && <p><strong>Main:</strong> {plan.mainDish}</p>}
                        {plan.sideDish && <p><strong>Side:</strong> {plan.sideDish}</p>}
                        {plan.drink && <p><strong>Drink:</strong> {plan.drink}</p>}
                        {plan.dessert && <p><strong>Dessert:</strong> {plan.dessert}</p>}
                      </div>
                      
                      {plan.allergens && plan.allergens.length > 0 && (
                        <div className="allergen-warning">
                          <h4>⚠️ Contains Allergens:</h4>
                          <div className="allergen-tags">
                            {plan.allergens.map(allergen => (
                              <span key={allergen} className="allergen-tag">
                                {allergen}
                              </span>
                            ))}
                          </div>
                          {conflictedChildren.length > 0 && (
                            <div className="affected-children">
                              <p><strong>Affected Children:</strong></p>
                              <ul>
                                {conflictedChildren.map(child => (
                                  <li key={child.id}>
                                    {child.firstName} {child.lastName}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {plan.notes && (
                        <div className="meal-notes">
                          <p><strong>Notes:</strong> {plan.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-plan">
                      <p>No meal planned yet</p>
                      <button 
                        className="plan-meal-btn"
                        onClick={() => {
                          setNewMealPlan({
                            ...newMealPlan,
                            date: selectedDate,
                            mealType: mealType
                          });
                          setShowMealForm(true);
                        }}
                      >
                        Plan Meal
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Meal Recording View */}
      {activeView === 'recording' && (
        <div className="recording-view">
          <div className="recording-header">
            <h2>📝 Record Individual Meals</h2>
          </div>

          <div className="recording-form-card">
            <h3>Record Child's Meal</h3>
            <form onSubmit={handleRecordMeal} className="meal-recording-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Child</label>
                  <select
                    value={mealRecording.childId}
                    onChange={(e) => setMealRecording({...mealRecording, childId: e.target.value})}
                    required
                  >
                    <option value="">Select a child</option>
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Meal Type</label>
                  <select
                    value={mealRecording.mealType}
                    onChange={(e) => setMealRecording({...mealRecording, mealType: e.target.value})}
                    required
                  >
                    {mealTypes.map(type => (
                      <option key={type} value={type}>
                        {formatMealType(type)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={mealRecording.time}
                    onChange={(e) => setMealRecording({...mealRecording, time: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Food Items (comma separated)</label>
                <textarea
                  value={mealRecording.foodItems}
                  onChange={(e) => setMealRecording({...mealRecording, foodItems: e.target.value})}
                  placeholder="e.g., Chicken nuggets, Apple slices, Milk"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount Eaten</label>
                  <select
                    value={mealRecording.amountEaten}
                    onChange={(e) => setMealRecording({...mealRecording, amountEaten: e.target.value})}
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
                  <label>Enjoyment Level</label>
                  <select
                    value={mealRecording.enjoymentLevel}
                    onChange={(e) => setMealRecording({...mealRecording, enjoymentLevel: e.target.value})}
                    required
                  >
                    {enjoymentLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={mealRecording.notes}
                  onChange={(e) => setMealRecording({...mealRecording, notes: e.target.value})}
                  placeholder="Any observations or special notes..."
                />
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Recording...' : 'Record Meal'}
              </button>
            </form>
          </div>

          {/* Today's Meal Records */}
          <div className="todays-records">
            <h3>📋 Today's Meal Records</h3>
            {childMealRecords.length === 0 ? (
              <p className="no-records">No meals recorded today yet.</p>
            ) : (
              <div className="records-grid">
                {childMealRecords.map(record => (
                  <div key={record.id} className="meal-record-card">
                    <div className="record-header">
                      <h4>{record.childName}</h4>
                      <span className="meal-type-badge">
                        {getMealIcon(record.mealType)} {formatMealType(record.mealType)}
                      </span>
                    </div>
                    <div className="record-content">
                      <p><strong>Time:</strong> {record.time}</p>
                      <p><strong>Food:</strong> {Array.isArray(record.foodItems) ? record.foodItems.join(', ') : record.foodItems}</p>
                      <div className="eating-info">
                        <span 
                          className="amount-badge"
                          style={{backgroundColor: getAmountColor(record.amountEaten)}}
                        >
                          Ate: {record.amountEaten}
                        </span>
                        <span className="enjoyment-badge">
                          {record.enjoymentLevel === 'loved' ? '😍' : 
                           record.enjoymentLevel === 'liked' ? '😊' : 
                           record.enjoymentLevel === 'good' ? '🙂' : 
                           record.enjoymentLevel === 'okay' ? '😐' : '😔'}
                          {record.enjoymentLevel}
                        </span>
                      </div>
                      {record.notes && (
                        <p className="record-notes"><em>{record.notes}</em></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports View */}
      {activeView === 'reports' && (
        <div className="reports-view">
          <div className="reports-header">
            <h2>📊 Meal Reports & Analytics</h2>
          </div>
          
          <div className="reports-grid">
            <div className="report-card">
              <h3>🎯 Today's Eating Summary</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-number">{childMealRecords.length}</span>
                  <span className="stat-label">Meals Recorded</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {childMealRecords.filter(r => r.amountEaten === 'all' || r.amountEaten === 'most').length}
                  </span>
                  <span className="stat-label">Good Eaters</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">
                    {childMealRecords.filter(r => r.enjoymentLevel === 'loved' || r.enjoymentLevel === 'liked').length}
                  </span>
                  <span className="stat-label">Enjoyed Meals</span>
                </div>
              </div>
            </div>
            
            <div className="report-card">
              <h3>⚠️ Allergen Alerts</h3>
              <div className="allergen-alerts">
                {Object.values(mealPlans).some(plan => plan.allergens && plan.allergens.length > 0) ? (
                  Object.values(mealPlans)
                    .filter(plan => plan.allergens && plan.allergens.length > 0)
                    .map(plan => {
                      const conflicted = checkAllergenConflicts(plan.allergens);
                      return conflicted.length > 0 ? (
                        <div key={plan.mealType} className="alert-item">
                          <strong>{formatMealType(plan.mealType)}:</strong>
                          <span className="allergen-list">{plan.allergens.join(', ')}</span>
                          <div className="affected-count">
                            {conflicted.length} child(ren) affected
                          </div>
                        </div>
                      ) : null;
                    })
                ) : (
                  <p className="no-alerts">No allergen conflicts today! ✅</p>
                )}
              </div>
            </div>
            
            <div className="report-card">
              <h3>📈 Eating Patterns</h3>
              <div className="patterns-chart">
                {amountOptions.map(amount => {
                  const count = childMealRecords.filter(r => r.amountEaten === amount).length;
                  const percentage = childMealRecords.length > 0 ? 
                    Math.round((count / childMealRecords.length) * 100) : 0;
                  
                  return (
                    <div key={amount} className="pattern-bar">
                      <span className="pattern-label">{amount}</span>
                      <div className="pattern-progress">
                        <div 
                          className="pattern-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getAmountColor(amount)
                          }}
                        ></div>
                      </div>
                      <span className="pattern-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="export-actions">
            <button className="export-btn">📄 Generate Daily Report</button>
            <button className="export-btn">📧 Email to Parents</button>
            <button className="export-btn">📊 Weekly Summary</button>
          </div>
        </div>
      )}

      {/* Meal Plan Form Modal */}
      {showMealForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>🍽️ {newMealPlan.id ? 'Edit' : 'Create'} Meal Plan</h2>
              <button 
                className="close-btn"
                onClick={() => setShowMealForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateMealPlan} className="meal-plan-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newMealPlan.date}
                    onChange={(e) => setNewMealPlan({...newMealPlan, date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Meal Type</label>
                  <select
                    value={newMealPlan.mealType}
                    onChange={(e) => setNewMealPlan({...newMealPlan, mealType: e.target.value})}
                    required
                  >
                    {mealTypes.map(type => (
                      <option key={type} value={type}>
                        {formatMealType(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Main Dish</label>
                <input
                  type="text"
                  value={newMealPlan.mainDish}
                  onChange={(e) => setNewMealPlan({...newMealPlan, mainDish: e.target.value})}
                  placeholder="e.g., Grilled chicken"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Side Dish</label>
                  <input
                    type="text"
                    value={newMealPlan.sideDish}
                    onChange={(e) => setNewMealPlan({...newMealPlan, sideDish: e.target.value})}
                    placeholder="e.g., Steamed vegetables"
                  />
                </div>
                
                <div className="form-group">
                  <label>Drink</label>
                  <input
                    type="text"
                    value={newMealPlan.drink}
                    onChange={(e) => setNewMealPlan({...newMealPlan, drink: e.target.value})}
                    placeholder="e.g., Milk"
                  />
                </div>
              </div>
              
              {(newMealPlan.mealType === 'lunch' || newMealPlan.mealType === 'dinner') && (
                <div className="form-group">
                  <label>Dessert</label>
                  <input
                    type="text"
                    value={newMealPlan.dessert}
                    onChange={(e) => setNewMealPlan({...newMealPlan, dessert: e.target.value})}
                    placeholder="e.g., Fresh fruit"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Allergens (select all that apply)</label>
                <div className="allergen-checkboxes">
                  {commonAllergens.map(allergen => (
                    <label key={allergen} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newMealPlan.allergens.includes(allergen)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewMealPlan({
                              ...newMealPlan,
                              allergens: [...newMealPlan.allergens, allergen]
                            });
                          } else {
                            setNewMealPlan({
                              ...newMealPlan,
                              allergens: newMealPlan.allergens.filter(a => a !== allergen)
                            });
                          }
                        }}
                      />
                      {allergen}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newMealPlan.notes}
                  onChange={(e) => setNewMealPlan({...newMealPlan, notes: e.target.value})}
                  placeholder="Any special preparation notes or instructions..."
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Meal Plan'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowMealForm(false)}
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
}