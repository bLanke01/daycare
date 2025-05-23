// components/parent/ChildProfileManagement.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/auth-context';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const ChildProfileManagement = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // basic, medical, contacts
  
  const [formData, setFormData] = useState({
    // Basic info
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    group: 'Infant',
    
    // Medical info
    allergies: [],
    medicalConditions: [],
    medications: [],
    doctorName: '',
    doctorPhone: '',
    
    // Emergency contacts
    emergencyContacts: []
  });
  
  // Load parent's children
  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      
      try {
        const childrenQuery = query(collection(db, 'children'), where('parentId', '==', user.uid));
        const snapshot = await getDocs(childrenQuery);
        
        const childrenData = [];
        snapshot.forEach(doc => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        
        setChildren(childrenData);
      } catch (error) {
        console.error('Error fetching children:', error);
        setError('Failed to load children profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user]);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      group: 'Infant',
      allergies: [],
      medicalConditions: [],
      medications: [],
      doctorName: '',
      doctorPhone: '',
      emergencyContacts: []
    });
    setActiveTab('basic');
  };

  const handleAddChild = () => {
    setSelectedChild(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditChild = (child) => {
    setSelectedChild(child);
    
    // Format date to YYYY-MM-DD for input element
    const dob = child.dateOfBirth ? new Date(child.dateOfBirth) : null;
    const formattedDob = dob ? dob.toISOString().split('T')[0] : '';
    
    setFormData({
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      dateOfBirth: formattedDob,
      gender: child.gender || '',
      group: child.group || 'Infant',
      allergies: child.allergies || [],
      medicalConditions: child.medicalConditions || [],
      medications: child.medications || [],
      doctorName: child.doctorName || '',
      doctorPhone: child.doctorPhone || '',
      emergencyContacts: child.emergencyContacts || []
    });
    
    setShowModal(true);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle allergies as comma-separated string
  const handleAllergiesChange = (e) => {
    const allergiesText = e.target.value;
    const allergiesArray = allergiesText.split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    setFormData({
      ...formData,
      allergies: allergiesArray
    });
  };
  
  // Handle medical conditions as comma-separated string
  const handleMedicalConditionsChange = (e) => {
    const conditionsText = e.target.value;
    const conditionsArray = conditionsText.split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    setFormData({
      ...formData,
      medicalConditions: conditionsArray
    });
  };
  
  // Handle medications as comma-separated string
  const handleMedicationsChange = (e) => {
    const medicationsText = e.target.value;
    const medicationsArray = medicationsText.split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
    
    setFormData({
      ...formData,
      medications: medicationsArray
    });
  };
  
  // Add emergency contact
  const handleAddContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [
        ...formData.emergencyContacts,
        { name: '', relationship: '', phone: '', email: '', isAuthorized: false }
      ]
    });
  };
  
  // Update emergency contact field
  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergencyContacts];
    
    if (field === 'isAuthorized') {
      updatedContacts[index][field] = !updatedContacts[index][field];
    } else {
      updatedContacts[index][field] = value;
    }
    
    setFormData({
      ...formData,
      emergencyContacts: updatedContacts
    });
  };
  
  // Remove emergency contact
  const handleRemoveContact = (index) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts.splice(index, 1);
    
    setFormData({
      ...formData,
      emergencyContacts: updatedContacts
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (activeTab !== 'contacts') {
      // If not on the last tab, move to the next tab
      if (activeTab === 'basic') {
        setActiveTab('medical');
      } else if (activeTab === 'medical') {
        setActiveTab('contacts');
      }
      return;
    }
    
    try {
      setLoading(true);
      
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        group: formData.group,
        allergies: formData.allergies,
        medicalConditions: formData.medicalConditions,
        medications: formData.medications,
        doctorName: formData.doctorName,
        doctorPhone: formData.doctorPhone,
        emergencyContacts: formData.emergencyContacts,
        parentId: user.uid,
        updatedAt: new Date().toISOString()
      };
      
      if (selectedChild) {
        // Update existing child
        await updateDoc(doc(db, 'children', selectedChild.id), childData);
        
        // Update local state
        setChildren(children.map(child => 
          child.id === selectedChild.id ? { id: child.id, ...childData } : child
        ));
      } else {
        // Add new child
        childData.createdAt = new Date().toISOString();
        const docRef = await setDoc(doc(collection(db, 'children')), childData);
        
        // Add to local state
        setChildren([...children, { id: docRef.id, ...childData }]);
      }
      
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving child profile:', error);
      setError('Failed to save child profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteChild = async (childId) => {
    if (!confirm('Are you sure you want to delete this child profile?')) return;
    
    try {
      setLoading(true);
      
      // Delete child document
      await deleteDoc(doc(db, 'children', childId));
      
      // Update local state
      setChildren(children.filter(child => child.id !== childId));
    } catch (error) {
      console.error('Error deleting child profile:', error);
      setError('Failed to delete child profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
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
      // Calculate months for infants
      const ageMonths = (today.getMonth() + 12 - birthDate.getMonth()) % 12;
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  return (
    <div className="child-profile-management">
      <div className="page-header">
        <h1>Manage Children</h1>
        <button 
          className="add-child-btn"
          onClick={handleAddChild}
        >
          Add New Child
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="children-list">
        {loading && children.length === 0 ? (
          <div className="loading">Loading children profiles...</div>
        ) : children.length === 0 ? (
          <div className="no-children">
            <p>No children profiles found. Add your child's information to get started.</p>
          </div>
        ) : (
          <div className="children-cards">
            {children.map(child => (
              <div key={child.id} className="child-card">
                <div className="child-photo">
                  {/* Placeholder for child photo */}
                  <div className="photo-placeholder">
                    {child.gender === 'Female' ? '👧' : '👦'}
                  </div>
                </div>
                
                <div className="child-info">
                  <h2>{child.firstName} {child.lastName}</h2>
                  <p>Age: {calculateAge(child.dateOfBirth)}</p>
                  <p>Group: {child.group}</p>
                  
                  <div className="child-card-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditChild(child)}
                    >
                      Edit Profile
                    </button>
                    
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteChild(child.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Child Profile Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h2>{selectedChild ? 'Edit Child Profile' : 'Add New Child'}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="form-tabs">
              <div 
                className={`form-tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </div>
              <div 
                className={`form-tab ${activeTab === 'medical' ? 'active' : ''}`}
                onClick={() => setActiveTab('medical')}
              >
                Medical Info
              </div>
              <div 
                className={`form-tab ${activeTab === 'contacts' ? 'active' : ''}`}
                onClick={() => setActiveTab('contacts')}
              >
                Emergency Contacts
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Basic Info Tab */}
              <div className={`form-tab-content ${activeTab === 'basic' ? 'active' : ''}`}>
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="group">Group</label>
                  <select
                    id="group"
                    name="group"
                    value={formData.group}
                    onChange={handleChange}
                    required
                  >
                    <option value="Infant">Infant (0-18 months)</option>
                    <option value="Toddler">Toddler (18 months-3 years)</option>
                    <option value="Pre-K">Pre-K (3-5 years)</option>
                  </select>
                </div>
              </div>
              
              {/* Medical Info Tab */}
              <div className={`form-tab-content ${activeTab === 'medical' ? 'active' : ''}`}>
                <div className="form-group">
                  <label htmlFor="allergies">Allergies</label>
                  <input
                    type="text"
                    id="allergies"
                    value={formData.allergies.join(', ')}
                    onChange={handleAllergiesChange}
                    placeholder="Separate allergies with commas (e.g., Peanuts, Dairy)"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="medicalConditions">Medical Conditions</label>
                  <input
                    type="text"
                    id="medicalConditions"
                    value={formData.medicalConditions.join(', ')}
                    onChange={handleMedicalConditionsChange}
                    placeholder="Separate conditions with commas"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="medications">Medications</label>
                  <input
                    type="text"
                    id="medications"
                    value={formData.medications.join(', ')}
                    onChange={handleMedicationsChange}
                    placeholder="Separate medications with commas"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="doctorName">Doctor's Name</label>
                  <input
                    type="text"
                    id="doctorName"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="doctorPhone">Doctor's Phone</label>
                  <input
                    type="tel"
                    id="doctorPhone"
                    name="doctorPhone"
                    value={formData.doctorPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {/* Emergency Contacts Tab */}
              <div className={`form-tab-content ${activeTab === 'contacts' ? 'active' : ''}`}>
                <div className="emergency-contacts">
                  {formData.emergencyContacts.length === 0 ? (
                    <div className="no-contacts">
                      <p>No emergency contacts added yet. Add at least one emergency contact.</p>
                    </div>
                  ) : (
                    formData.emergencyContacts.map((contact, index) => (
                      <div key={index} className="contact-card">
                        <div className="contact-header">
                          <h3>Contact #{index + 1}</h3>
                          <button 
                            type="button"
                            className="remove-contact-btn"
                            onClick={() => handleRemoveContact(index)}
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="contact-form">
                          <div className="form-group">
                            <label>Name</label>
                            <input
                              type="text"
                              value={contact.name}
                              onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Relationship</label>
                            <input
                              type="text"
                              value={contact.relationship}
                              onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Phone</label>
                            <input
                              type="tel"
                              value={contact.phone}
                              onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Email</label>
                            <input
                              type="email"
                              value={contact.email}
                              onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            />
                          </div>
                          
                          <div className="form-group checkbox-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={contact.isAuthorized}
                                onChange={() => handleContactChange(index, 'isAuthorized')}
                              />
                              Authorized for pickup
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <button 
                    type="button"
                    className="add-contact-btn"
                    onClick={handleAddContact}
                  >
                    Add Emergency Contact
                  </button>
                </div>
              </div>
              
              <div className="form-actions">
                {activeTab === 'basic' || activeTab === 'medical' ? (
                  <button type="submit" className="next-btn">
                    Next
                  </button>
                ) : (
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Child Profile'}
                  </button>
                )}
                
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
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

export default ChildProfileManagement;