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
    <div className="min-h-screen p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🍽️ Meal Tracking & Planning</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            className="input input-bordered"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${activeView === 'planning' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('planning')}
            >
              📋 Meal Planning
            </button>
            <button 
              className={`tab ${activeView === 'recording' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('recording')}
            >
              📝 Record Meals
            </button>
            <button 
              className={`tab ${activeView === 'reports' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('reports')}
            >
              📊 Reports
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Meal Planning View */}
      {activeView === 'planning' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📅 Daily Meal Plan - {new Date(selectedDate).toLocaleDateString()}</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowMealForm(true)}
            >
              ➕ Add Meal Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealTypes.map(mealType => {
              const plan = mealPlans[mealType];
              const conflictedChildren = plan ? checkAllergenConflicts(plan.allergens) : [];
              
              return (
                <div key={mealType} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-center">
                      <h3 className="card-title">
                        {getMealIcon(mealType)} {formatMealType(mealType)}
                      </h3>
                      {plan && (
                        <button 
                          className="btn btn-ghost btn-sm"
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
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {plan.mainDish && <p><strong>Main:</strong> {plan.mainDish}</p>}
                          {plan.sideDish && <p><strong>Side:</strong> {plan.sideDish}</p>}
                          {plan.drink && <p><strong>Drink:</strong> {plan.drink}</p>}
                          {plan.dessert && <p><strong>Dessert:</strong> {plan.dessert}</p>}
                        </div>
                        
                        {plan.allergens && plan.allergens.length > 0 && (
                          <div className="alert alert-warning">
                            <h4 className="font-bold">⚠️ Contains Allergens:</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {plan.allergens.map(allergen => (
                                <span key={allergen} className="badge badge-warning">
                                  {allergen}
                                </span>
                              ))}
                            </div>
                            {conflictedChildren.length > 0 && (
                              <div className="mt-2">
                                <p className="font-bold">Affected Children:</p>
                                <ul className="list-disc list-inside">
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
                          <div className="alert alert-info">
                            <p><strong>Notes:</strong> {plan.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="mb-4">No meal planned yet</p>
                        <button 
                          className="btn btn-outline btn-primary"
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Meal Recording View */}
      {activeView === 'recording' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Record Child's Meal</h3>
              <form onSubmit={handleRecordMeal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">Child</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Meal Type</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Time</label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={mealRecording.time}
                      onChange={(e) => setMealRecording({...mealRecording, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">Food Items (comma separated)</label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={mealRecording.foodItems}
                    onChange={(e) => setMealRecording({...mealRecording, foodItems: e.target.value})}
                    placeholder="e.g., Chicken nuggets, Apple slices, Milk"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">Amount Eaten</label>
                    <select
                      className="select select-bordered w-full"
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
                  
                  <div className="form-control">
                    <label className="label">Enjoyment Level</label>
                    <select
                      className="select select-bordered w-full"
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
                
                <div className="form-control">
                  <label className="label">Notes</label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={mealRecording.notes}
                    onChange={(e) => setMealRecording({...mealRecording, notes: e.target.value})}
                    placeholder="Any observations or special notes..."
                  />
                </div>
                
                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                  {loading ? 'Recording...' : 'Record Meal'}
                </button>
              </form>
            </div>
          </div>

          {/* Today's Meal Records */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">📋 Today's Meal Records</h3>
            {childMealRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg">No meals recorded today yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {childMealRecords.map(record => (
                  <div key={record.id} className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex justify-between items-center">
                        <h4 className="card-title">{record.childName}</h4>
                        <span className="badge badge-lg">
                          {getMealIcon(record.mealType)} {formatMealType(record.mealType)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p><strong>Time:</strong> {record.time}</p>
                        <p><strong>Food:</strong> {Array.isArray(record.foodItems) ? record.foodItems.join(', ') : record.foodItems}</p>
                        <div className="flex gap-2">
                          <span 
                            className="badge"
                            style={{backgroundColor: getAmountColor(record.amountEaten)}}
                          >
                            Ate: {record.amountEaten}
                          </span>
                          <span className="badge badge-outline">
                            {record.enjoymentLevel === 'loved' ? '😍' : 
                             record.enjoymentLevel === 'liked' ? '😊' : 
                             record.enjoymentLevel === 'good' ? '🙂' : 
                             record.enjoymentLevel === 'okay' ? '😐' : '😔'}
                            {record.enjoymentLevel}
                          </span>
                        </div>
                        {record.notes && (
                          <p className="text-sm italic">{record.notes}</p>
                        )}
                      </div>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">🎯 Today's Eating Summary</h3>
                <div className="stats stats-vertical shadow">
                  <div className="stat">
                    <div className="stat-title">Meals Recorded</div>
                    <div className="stat-value">{childMealRecords.length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Good Eaters</div>
                    <div className="stat-value">
                      {childMealRecords.filter(r => r.amountEaten === 'all' || r.amountEaten === 'most').length}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Enjoyed Meals</div>
                    <div className="stat-value">
                      {childMealRecords.filter(r => r.enjoymentLevel === 'loved' || r.enjoymentLevel === 'liked').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">⚠️ Allergen Alerts</h3>
                {Object.values(mealPlans).some(plan => plan.allergens && plan.allergens.length > 0) ? (
                  <div className="space-y-4">
                    {Object.values(mealPlans)
                      .filter(plan => plan.allergens && plan.allergens.length > 0)
                      .map(plan => {
                        const conflicted = checkAllergenConflicts(plan.allergens);
                        return conflicted.length > 0 ? (
                          <div key={plan.mealType} className="alert alert-warning">
                            <div>
                              <strong>{formatMealType(plan.mealType)}:</strong>
                              <span className="block">{plan.allergens.join(', ')}</span>
                              <div className="mt-2">
                                {conflicted.length} child(ren) affected
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })
                    }
                  </div>
                ) : (
                  <div className="alert alert-success">
                    <p>No allergen conflicts today! ✅</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">📈 Eating Patterns</h3>
                <div className="space-y-2">
                  {amountOptions.map(amount => {
                    const count = childMealRecords.filter(r => r.amountEaten === amount).length;
                    const percentage = childMealRecords.length > 0 ? 
                      Math.round((count / childMealRecords.length) * 100) : 0;
                    
                    return (
                      <div key={amount} className="flex items-center gap-2">
                        <span className="w-20">{amount}</span>
                        <progress 
                          className="progress"
                          value={percentage} 
                          max="100"
                          style={{
                            '--value-percent': `${percentage}%`,
                            backgroundColor: getAmountColor(amount)
                          }}
                        ></progress>
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <button className="btn btn-outline">📄 Generate Daily Report</button>
            <button className="btn btn-outline">📧 Email to Parents</button>
            <button className="btn btn-outline">📊 Weekly Summary</button>
          </div>
        </div>
      )}

      {/* Meal Plan Form Modal */}
      {showMealForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                🍽️ {newMealPlan.id ? 'Edit' : 'Create'} Meal Plan
              </h2>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowMealForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateMealPlan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">Date</label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={newMealPlan.date}
                    onChange={(e) => setNewMealPlan({...newMealPlan, date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">Meal Type</label>
                  <select
                    className="select select-bordered w-full"
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
              
              <div className="form-control">
                <label className="label">Main Dish</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newMealPlan.mainDish}
                  onChange={(e) => setNewMealPlan({...newMealPlan, mainDish: e.target.value})}
                  placeholder="e.g., Grilled chicken"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">Side Dish</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={newMealPlan.sideDish}
                    onChange={(e) => setNewMealPlan({...newMealPlan, sideDish: e.target.value})}
                    placeholder="e.g., Steamed vegetables"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">Drink</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={newMealPlan.drink}
                    onChange={(e) => setNewMealPlan({...newMealPlan, drink: e.target.value})}
                    placeholder="e.g., Milk"
                  />
                </div>
              </div>
              
              {(newMealPlan.mealType === 'lunch' || newMealPlan.mealType === 'dinner') && (
                <div className="form-control">
                  <label className="label">Dessert</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={newMealPlan.dessert}
                    onChange={(e) => setNewMealPlan({...newMealPlan, dessert: e.target.value})}
                    placeholder="e.g., Fresh fruit"
                  />
                </div>
              )}
              
              <div className="form-control">
                <label className="label">Allergens (select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {commonAllergens.map(allergen => (
                    <label key={allergen} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox"
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
                      <span>{allergen}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-control">
                <label className="label">Notes</label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={newMealPlan.notes}
                  onChange={(e) => setNewMealPlan({...newMealPlan, notes: e.target.value})}
                  placeholder="Any special preparation notes or instructions..."
                />
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Meal Plan'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost"
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