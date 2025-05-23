// components/admin/MealPlanner.js
'use client';

import { useState } from 'react';

const MealPlanner = () => {
  // Current week date range
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = new Date(today);
    
    // Find the Monday of the current week
    startDate.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
    
    const weekDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };
  
  const weekDates = getWeekDates();
  
  // Mock data for meal plans
  const [mealPlans, setMealPlans] = useState({
    // Monday
    [weekDates[0].toISOString().split('T')[0]]: {
      breakfast: {
        main: 'Whole grain cereal',
        side: 'Fresh berries',
        drink: 'Milk'
      },
      snackAM: {
        main: 'Apple slices',
        side: 'Cheese cubes'
      },
      lunch: {
        main: 'Turkey and cheese sandwich on whole wheat',
        side: 'Vegetable soup',
        dessert: 'Orange slices'
      },
      snackPM: {
        main: 'Yogurt',
        side: 'Graham crackers'
      }
    },
    // Tuesday
    [weekDates[1].toISOString().split('T')[0]]: {
      breakfast: {
        main: 'Oatmeal with cinnamon',
        side: 'Sliced bananas',
        drink: 'Milk'
      },
      snackAM: {
        main: 'Carrot sticks',
        side: 'Hummus'
      },
      lunch: {
        main: 'Chicken quesadilla',
        side: 'Black beans and corn',
        dessert: 'Apple sauce'
      },
      snackPM: {
        main: 'Fruit smoothie',
        side: 'Whole grain crackers'
      }
    },
    // Wednesday
    [weekDates[2].toISOString().split('T')[0]]: {
      breakfast: {
        main: 'Scrambled eggs',
        side: 'Whole wheat toast',
        drink: 'Orange juice'
      },
      snackAM: {
        main: 'Banana',
        side: 'Peanut butter (sun butter for allergies)'
      },
      lunch: {
        main: 'Pasta with marinara sauce',
        side: 'Garden salad',
        dessert: 'Peach slices'
      },
      snackPM: {
        main: 'Trail mix',
        side: 'Yogurt'
      }
    },
    // Thursday
    [weekDates[3].toISOString().split('T')[0]]: {
      breakfast: {
        main: 'Whole grain pancakes',
        side: 'Sliced strawberries',
        drink: 'Milk'
      },
      snackAM: {
        main: 'Bell pepper strips',
        side: 'Ranch dip'
      },
      lunch: {
        main: 'Tuna salad sandwich',
        side: 'Cucumber slices',
        dessert: 'Grapes'
      },
      snackPM: {
        main: 'Cheese and crackers',
        side: 'Apple slices'
      }
    },
    // Friday
    [weekDates[4].toISOString().split('T')[0]]: {
      breakfast: {
        main: 'Yogurt parfait',
        side: 'Granola',
        drink: 'Milk'
      },
      snackAM: {
        main: 'Orange slices',
        side: 'String cheese'
      },
      lunch: {
        main: 'Bean and cheese burrito',
        side: 'Spanish rice',
        dessert: 'Watermelon'
      },
      snackPM: {
        main: 'Whole grain muffin',
        side: 'Milk'
      }
    }
  });
  
  // State for selected date and meal type being edited
  const [selectedDate, setSelectedDate] = useState(weekDates[0].toISOString().split('T')[0]);
  const [editingMeal, setEditingMeal] = useState(null);
  const [showAllergyInfo, setShowAllergyInfo] = useState(false);
  const [searchWeek, setSearchWeek] = useState(weekDates[0].toISOString().split('T')[0]);
  
  // State for meal being edited
  const [mealEdit, setMealEdit] = useState({
    main: '',
    side: '',
    drink: '',
    dessert: ''
  });
  
  // Mock data for food allergies
  const childrenAllergies = [
    { name: 'Noah Garcia', allergies: ['Peanuts', 'Tree nuts'] },
    { name: 'Olivia Martinez', allergies: ['Dairy'] },
    { name: 'Emma Thompson', allergies: ['None'] },
    { name: 'William Johnson', allergies: ['Eggs', 'Wheat'] },
    { name: 'Sophia Wilson', allergies: ['None'] }
  ];
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };
  
  // Navigate to previous week
  const goToPreviousWeek = () => {
    const date = new Date(searchWeek);
    date.setDate(date.getDate() - 7);
    setSearchWeek(date.toISOString().split('T')[0]);
  };
  
  // Navigate to next week
  const goToNextWeek = () => {
    const date = new Date(searchWeek);
    date.setDate(date.getDate() + 7);
    setSearchWeek(date.toISOString().split('T')[0]);
  };
  
  // Handle edit button click
  const handleEditClick = (date, mealType) => {
    setSelectedDate(date);
    setEditingMeal(mealType);
    
    // Initialize form with current meal data
    const currentMeal = mealPlans[date] && mealPlans[date][mealType] 
      ? mealPlans[date][mealType] 
      : { main: '', side: '', drink: '', dessert: '' };
      
    setMealEdit({ ...currentMeal });
  };
  
  // Handle input changes in the edit form
  const handleMealInputChange = (e) => {
    const { name, value } = e.target;
    setMealEdit({
      ...mealEdit,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update meal plan for the selected date and meal type
    const updatedMealPlans = { ...mealPlans };
    
    // Initialize date if it doesn't exist
    if (!updatedMealPlans[selectedDate]) {
      updatedMealPlans[selectedDate] = {};
    }
    
    // Update the meal
    updatedMealPlans[selectedDate][editingMeal] = { ...mealEdit };
    
    setMealPlans(updatedMealPlans);
    setEditingMeal(null);
  };
  
  // Check for allergies in a meal
  const checkForAllergies = (meal) => {
    const allergensInMeal = [];
    const allMealItems = [meal.main, meal.side, meal.drink, meal.dessert].filter(Boolean);
    
    // This is a simplified check - in a real app, you would have a more sophisticated allergen detection
    const allergenKeywords = {
      'Peanuts': ['peanut', 'peanuts', 'peanut butter'],
      'Tree nuts': ['almonds', 'walnuts', 'cashews', 'pecans', 'nuts'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'dairy'],
      'Eggs': ['egg', 'eggs'],
      'Wheat': ['wheat', 'bread', 'pasta', 'cereal']
    };
    
    // Check each allergen against meal items
    Object.entries(allergenKeywords).forEach(([allergen, keywords]) => {
      const found = allMealItems.some(item => 
        item && keywords.some(keyword => 
          item.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (found) {
        allergensInMeal.push(allergen);
      }
    });
    
    return allergensInMeal;
  };
  
  // Find affected children by allergens
  const findAffectedChildren = (allergens) => {
    if (allergens.length === 0) return [];
    
    return childrenAllergies.filter(child =>
      child.allergies.some(allergy => 
        allergy !== 'None' && allergens.includes(allergy)
      )
    );
  };
  
  return (
    <div className="meal-planner">
      <div className="page-header">
        <h1>Meal Planner</h1>
        <button 
          className="allergy-info-btn"
          onClick={() => setShowAllergyInfo(!showAllergyInfo)}
        >
          {showAllergyInfo ? 'Hide Allergy Info' : 'Show Allergy Info'}
        </button>
      </div>
      
      {showAllergyInfo && (
        <div className="allergy-info">
          <h2>Children with Food Allergies</h2>
          <table className="allergy-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Allergies</th>
              </tr>
            </thead>
            <tbody>
              {childrenAllergies.map((child, index) => (
                <tr key={index}>
                  <td>{child.name}</td>
                  <td>{child.allergies.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="week-navigation">
        <button className="nav-btn" onClick={goToPreviousWeek}>
          &lt; Previous Week
        </button>
        <h2>Weekly Meal Plan</h2>
        <button className="nav-btn" onClick={goToNextWeek}>
          Next Week &gt;
        </button>
      </div>
      
      <div className="meal-plan-grid">
        <div className="meal-header-row">
          <div className="meal-header empty-header"></div>
          {weekDates.map((date, index) => (
            <div key={index} className="day-header">
              <h3>{formatDate(date)}</h3>
            </div>
          ))}
        </div>
        
        <div className="meal-type-row">
          <div className="meal-type-header">
            <h3>Breakfast</h3>
            <span className="meal-time">8:00 AM</span>
          </div>
          
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const meal = mealPlans[dateStr] && mealPlans[dateStr].breakfast ? mealPlans[dateStr].breakfast : null;
            const allergensInMeal = meal ? checkForAllergies(meal) : [];
            const affectedChildren = findAffectedChildren(allergensInMeal);
            
            return (
              <div key={index} className="meal-cell">
                {meal ? (
                  <div className="meal-content">
                    <div className="meal-items">
                      <p className="meal-main">{meal.main}</p>
                      {meal.side && <p className="meal-side">{meal.side}</p>}
                      {meal.drink && <p className="meal-drink">{meal.drink}</p>}
                    </div>
                    
                    {allergensInMeal.length > 0 && (
                      <div className="allergen-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="allergen-details">
                          <p>Contains: {allergensInMeal.join(', ')}</p>
                          <p>Affects: {affectedChildren.map(child => child.name).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="edit-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'breakfast')}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="empty-meal">
                    <button 
                      className="add-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'breakfast')}
                    >
                      Add Meal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="meal-type-row">
          <div className="meal-type-header">
            <h3>Morning Snack</h3>
            <span className="meal-time">10:00 AM</span>
          </div>
          
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const meal = mealPlans[dateStr] && mealPlans[dateStr].snackAM ? mealPlans[dateStr].snackAM : null;
            const allergensInMeal = meal ? checkForAllergies(meal) : [];
            const affectedChildren = findAffectedChildren(allergensInMeal);
            
            return (
              <div key={index} className="meal-cell">
                {meal ? (
                  <div className="meal-content">
                    <div className="meal-items">
                      <p className="meal-main">{meal.main}</p>
                      {meal.side && <p className="meal-side">{meal.side}</p>}
                    </div>
                    
                    {allergensInMeal.length > 0 && (
                      <div className="allergen-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="allergen-details">
                          <p>Contains: {allergensInMeal.join(', ')}</p>
                          <p>Affects: {affectedChildren.map(child => child.name).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="edit-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'snackAM')}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="empty-meal">
                    <button 
                      className="add-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'snackAM')}
                    >
                      Add Meal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="meal-type-row">
          <div className="meal-type-header">
            <h3>Lunch</h3>
            <span className="meal-time">12:00 PM</span>
          </div>
          
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const meal = mealPlans[dateStr] && mealPlans[dateStr].lunch ? mealPlans[dateStr].lunch : null;
            const allergensInMeal = meal ? checkForAllergies(meal) : [];
            const affectedChildren = findAffectedChildren(allergensInMeal);
            
            return (
              <div key={index} className="meal-cell">
                {meal ? (
                  <div className="meal-content">
                    <div className="meal-items">
                      <p className="meal-main">{meal.main}</p>
                      {meal.side && <p className="meal-side">{meal.side}</p>}
                      {meal.dessert && <p className="meal-dessert">{meal.dessert}</p>}
                    </div>
                    
                    {allergensInMeal.length > 0 && (
                      <div className="allergen-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="allergen-details">
                          <p>Contains: {allergensInMeal.join(', ')}</p>
                          <p>Affects: {affectedChildren.map(child => child.name).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="edit-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'lunch')}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="empty-meal">
                    <button 
                      className="add-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'lunch')}
                    >
                      Add Meal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="meal-type-row">
          <div className="meal-type-header">
            <h3>Afternoon Snack</h3>
            <span className="meal-time">3:00 PM</span>
          </div>
          
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const meal = mealPlans[dateStr] && mealPlans[dateStr].snackPM ? mealPlans[dateStr].snackPM : null;
            const allergensInMeal = meal ? checkForAllergies(meal) : [];
            const affectedChildren = findAffectedChildren(allergensInMeal);
            
            return (
              <div key={index} className="meal-cell">
                {meal ? (
                  <div className="meal-content">
                    <div className="meal-items">
                      <p className="meal-main">{meal.main}</p>
                      {meal.side && <p className="meal-side">{meal.side}</p>}
                    </div>
                    
                    {allergensInMeal.length > 0 && (
                      <div className="allergen-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="allergen-details">
                          <p>Contains: {allergensInMeal.join(', ')}</p>
                          <p>Affects: {affectedChildren.map(child => child.name).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="edit-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'snackPM')}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="empty-meal">
                    <button 
                      className="add-meal-btn"
                      onClick={() => handleEditClick(dateStr, 'snackPM')}
                    >
                      Add Meal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="action-buttons">
        <button className="print-btn">Print Meal Plan</button>
        <button className="email-btn">Email to Parents</button>
      </div>
      
      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>
                {formatDate(selectedDate)} - {
                  editingMeal === 'breakfast' ? 'Breakfast' :
                  editingMeal === 'snackAM' ? 'Morning Snack' :
                  editingMeal === 'lunch' ? 'Lunch' : 'Afternoon Snack'
                }
              </h2>
              <button 
                className="close-btn"
                onClick={() => setEditingMeal(null)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="main">Main Item</label>
                <input
                  type="text"
                  id="main"
                  name="main"
                  value={mealEdit.main}
                  onChange={handleMealInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="side">Side Item</label>
                <input
                  type="text"
                  id="side"
                  name="side"
                  value={mealEdit.side || ''}
                  onChange={handleMealInputChange}
                />
              </div>
              
              {(editingMeal === 'breakfast') && (
                <div className="form-group">
                  <label htmlFor="drink">Drink</label>
                  <input
                    type="text"
                    id="drink"
                    name="drink"
                    value={mealEdit.drink || ''}
                    onChange={handleMealInputChange}
                  />
                </div>
              )}
              
              {(editingMeal === 'lunch') && (
                <div className="form-group">
                  <label htmlFor="dessert">Dessert</label>
                  <input
                    type="text"
                    id="dessert"
                    name="dessert"
                    value={mealEdit.dessert || ''}
                    onChange={handleMealInputChange}
                  />
                </div>
              )}
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">Save Meal</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setEditingMeal(null)}
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

export default MealPlanner;