// components/admin/MealPlanner.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const MealPlanner = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'breakfast',
    mainDish: '',
    sideDish: '',
    fruit: '',
    vegetable: '',
    drink: '',
    snack: '',
    allergies: '',
    notes: ''
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      setError(null);

      const mealsRef = collection(db, 'meals');
      const querySnapshot = await getDocs(mealsRef);

      const mealsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMeals(mealsData);
    } catch (err) {
      console.error('Error loading meals:', err);
      setError('Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      if (editMode && selectedMeal) {
        const mealRef = doc(db, 'meals', selectedMeal.id);
        await updateDoc(mealRef, formData);
      } else {
        await addDoc(collection(db, 'meals'), formData);
      }

      await loadMeals();
      resetForm();
    } catch (err) {
      console.error('Error saving meal:', err);
      setError('Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meal) => {
    setSelectedMeal(meal);
    setFormData(meal);
    setEditMode(true);
  };

  const handleDelete = async (mealId) => {
    try {
      setLoading(true);
      setError(null);

      await deleteDoc(doc(db, 'meals', mealId));
      await loadMeals();
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'breakfast',
      mainDish: '',
      sideDish: '',
      fruit: '',
      vegetable: '',
      drink: '',
      snack: '',
      allergies: '',
      notes: ''
    });
    setSelectedMeal(null);
    setEditMode(false);
  };

  const filteredMeals = meals.filter(meal => meal.date === selectedDate);

  if (loading && meals.length === 0) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content">
          <span className="text-primary">Meal</span> Planner
        </h1>

        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Date Selector */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Meal Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              {editMode ? 'Edit Meal' : 'Add New Meal'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Meal Type</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Main Dish</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.mainDish}
                    onChange={(e) => handleInputChange('mainDish', e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Side Dish</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.sideDish}
                    onChange={(e) => handleInputChange('sideDish', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Fruit</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.fruit}
                    onChange={(e) => handleInputChange('fruit', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Vegetable</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.vegetable}
                    onChange={(e) => handleInputChange('vegetable', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Drink</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.drink}
                    onChange={(e) => handleInputChange('drink', e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Snack</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.snack}
                    onChange={(e) => handleInputChange('snack', e.target.value)}
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Allergy Information</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={formData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    placeholder="List any allergens..."
                  ></textarea>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Notes</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes..."
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {editMode && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className={`btn btn-primary ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {editMode ? 'Update Meal' : 'Add Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Meal List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              Meals for {new Date(selectedDate).toLocaleDateString()}
            </h2>

            {filteredMeals.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                No meals planned for this date
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMeals.map((meal) => (
                  <div key={meal.id} className="card bg-base-200">
                    <div className="card-body">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold capitalize">{meal.type}</h3>
                          <div className="mt-2 space-y-1">
                            {meal.mainDish && (
                              <p><span className="font-medium">Main:</span> {meal.mainDish}</p>
                            )}
                            {meal.sideDish && (
                              <p><span className="font-medium">Side:</span> {meal.sideDish}</p>
                            )}
                            {meal.fruit && (
                              <p><span className="font-medium">Fruit:</span> {meal.fruit}</p>
                            )}
                            {meal.vegetable && (
                              <p><span className="font-medium">Vegetable:</span> {meal.vegetable}</p>
                            )}
                            {meal.drink && (
                              <p><span className="font-medium">Drink:</span> {meal.drink}</p>
                            )}
                            {meal.snack && (
                              <p><span className="font-medium">Snack:</span> {meal.snack}</p>
                            )}
                          </div>
                          {meal.allergies && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-error">Allergens:</p>
                              <p className="text-sm">{meal.allergies}</p>
                            </div>
                          )}
                          {meal.notes && (
                            <div className="mt-4">
                              <p className="text-sm font-medium">Notes:</p>
                              <p className="text-sm">{meal.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="join join-vertical">
                          <button
                            className="btn btn-ghost btn-sm join-item"
                            onClick={() => handleEdit(meal)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-sm join-item text-error"
                            onClick={() => handleDelete(meal.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;