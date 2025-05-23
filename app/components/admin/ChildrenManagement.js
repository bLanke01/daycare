// components/admin/ChildrenManagement.js (Complete with Add Child Feature)
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ChildDetailsModal from './ChildDetailsModal';

const ChildrenManagement = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add child form state
  const [newChildData, setNewChildData] = useState({
    // Child information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    group: '',
    
    // Parent information
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    
    // Additional information
    allergies: '',
    medicalConditions: '',
    medications: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    doctorName: '',
    doctorPhone: '',
    
    // Special notes
    specialNeeds: '',
    dietaryRestrictions: '',
    notes: ''
  });

  // Real-time listener for children
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'children'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const childrenData = [];
        snapshot.forEach(doc => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching children:', error);
        setError('Failed to load children');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Generate random access code
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Auto-assign group based on age
  const calculateGroup = (dateOfBirth) => {
    if (!dateOfBirth) return 'Infant';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 18) {
      return 'Infant';
    } else if (ageInMonths < 36) {
      return 'Toddler';
    } else {
      return 'Pre-K';
    }
  };

  // Handle form input changes
  const handleNewChildChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...newChildData,
      [name]: value
    };

    // Auto-calculate group when date of birth changes
    if (name === 'dateOfBirth') {
      updatedData.group = calculateGroup(value);
    }

    setNewChildData(updatedData);
  };

  // Handle adding new child
  const handleAddChild = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    setError('');
    setSuccessMessage(''); // Clear any previous messages
    
    // Generate access code for parent
    const accessCode = generateAccessCode();
    
    // Prepare child data
    const childData = {
      // Child information
      firstName: newChildData.firstName.trim(),
      lastName: newChildData.lastName.trim(),
      dateOfBirth: newChildData.dateOfBirth,
      gender: newChildData.gender,
      group: newChildData.group || calculateGroup(newChildData.dateOfBirth),
      
      // Parent information
      parentFirstName: newChildData.parentFirstName.trim(),
      parentLastName: newChildData.parentLastName.trim(),
      parentEmail: newChildData.parentEmail.trim().toLowerCase(),
      parentPhone: newChildData.parentPhone.trim(),
      
      // Medical and emergency information
      allergies: newChildData.allergies ? 
        newChildData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
      medicalConditions: newChildData.medicalConditions ? 
        newChildData.medicalConditions.split(',').map(m => m.trim()).filter(m => m) : [],
      medications: newChildData.medications ? 
        newChildData.medications.split(',').map(m => m.trim()).filter(m => m) : [],
      emergencyContact: newChildData.emergencyContact.trim(),
      emergencyPhone: newChildData.emergencyPhone.trim(),
      emergencyRelationship: newChildData.emergencyRelationship.trim(),
      doctorName: newChildData.doctorName.trim(),
      doctorPhone: newChildData.doctorPhone.trim(),
      
      // Additional information
      specialNeeds: newChildData.specialNeeds.trim(),
      dietaryRestrictions: newChildData.dietaryRestrictions.trim(),
      notes: newChildData.notes.trim(),
      
      // System fields
      accessCode: accessCode,
      parentRegistered: false,
      parentId: null,
      enrollmentStatus: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedAt: new Date().toISOString()
    };
    
    // Add child to Firestore
    const childRef = await addDoc(collection(db, 'children'), childData);
    console.log('Child added with ID:', childRef.id); // Debug log
    
    // Create access code document for parent registration
    await setDoc(doc(db, 'accessCodes', accessCode), {
      code: accessCode,
      childId: childRef.id,
      parentEmail: newChildData.parentEmail.trim().toLowerCase(),
      parentName: `${newChildData.parentFirstName.trim()} ${newChildData.parentLastName.trim()}`,
      childName: `${newChildData.firstName.trim()} ${newChildData.lastName.trim()}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      maxUses: 1,
      usesLeft: 1,
      used: false,
      note: `Access code for ${newChildData.parentFirstName.trim()} ${newChildData.parentLastName.trim()} - child: ${newChildData.firstName.trim()} ${newChildData.lastName.trim()}`
    });
    
    console.log('Access code created:', accessCode); // Debug log
    
    // Show success message with access code
    const successMsg = `🎉 SUCCESS! Child added to the system!

👶 Child: ${newChildData.firstName} ${newChildData.lastName}
👨‍👩‍👧‍👦 Parent: ${newChildData.parentFirstName} ${newChildData.parentLastName}
📧 Email: ${newChildData.parentEmail}
📱 Phone: ${newChildData.parentPhone}

🔑 PARENT ACCESS CODE: ${accessCode}

📋 IMPORTANT: Give this code to the parent so they can:
- Sign up on the parent portal
- Access their child's daily updates
- View activities, meals, and attendance

⏰ Code expires in 30 days.
💾 Code has been saved to the system.`;

    setSuccessMessage(successMsg);
    
    // Reset form
    setNewChildData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      group: '',
      parentFirstName: '',
      parentLastName: '',
      parentEmail: '',
      parentPhone: '',
      allergies: '',
      medicalConditions: '',
      medications: '',
      emergencyContact: '',
      emergencyPhone: '',
      emergencyRelationship: '',
      doctorName: '',
      doctorPhone: '',
      specialNeeds: '',
      dietaryRestrictions: '',
      notes: ''
    });
    
    // Don't auto-close modal so admin can see the access code
    // setShowAddChildModal(false); // Comment this out
    
  } catch (error) {
    console.error('Error adding child:', error);
    setError(`Failed to add child: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  // Filter children
  const filteredChildren = children.filter(child => {
    const matchesSearch = 
      child.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parentFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parentLastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroup === 'All' || child.group === filterGroup;
    
    return matchesSearch && matchesGroup;
  });

  // Calculate age
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

  const handleViewChild = (child) => {
    setSelectedChild(child);
    setActiveTab('overview');
    setShowModal(true);
  };

  return (
    <div className="children-management">
      <div className="page-header">
        <h1>Manage Children</h1>
        <div className="header-actions">
          <span className="children-count">Total: {children.length} children</span>
          <button 
            className="add-child-btn" 
            onClick={() => setShowAddChildModal(true)}
          >
            ➕ Add New Child
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="close-error-btn"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="success-message-modal">
          <div className="success-modal-content">
            <h3>🎉 Child Successfully Added!</h3>
            <div className="access-code-display">
              <pre>{successMessage}</pre>
              <div className="success-actions">
                <button 
                  className="copy-code-btn"
                  onClick={() => {
                    // Extract just the access code for copying
                    const codeMatch = successMessage.match(/ACCESS CODE: ([A-Z0-9]{8})/);
                    if (codeMatch) {
                      navigator.clipboard.writeText(codeMatch[1]);
                      alert('Access code copied to clipboard!');
                    }
                  }}
                >
                  📋 Copy Access Code
                </button>
                <button 
                  className="close-success-btn"
                  onClick={() => {
                    setSuccessMessage('');
                    setShowAddChildModal(false);
                  }}
                >
                  ✅ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by child or parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="group-filter">
          <label htmlFor="groupFilter">Filter by Group:</label>
          <select 
            id="groupFilter"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="All">All Groups</option>
            <option value="Infant">Infant (0-18 months)</option>
            <option value="Toddler">Toddler (18 months-3 years)</option>
            <option value="Pre-K">Pre-K (3-5 years)</option>
          </select>
        </div>
      </div>
      
      <div className="children-grid">
        {loading && children.length === 0 ? (
          <div className="loading">Loading children...</div>
        ) : filteredChildren.length === 0 ? (
          <div className="no-children">
            {children.length === 0 ? (
              <div>
                <h3>No children in the system yet</h3>
                <p>Click "Add New Child" to register your first child.</p>
              </div>
            ) : (
              <div>No children found matching your search criteria.</div>
            )}
          </div>
        ) : (
          filteredChildren.map(child => (
            <div key={child.id} className="child-card-admin">
              <div className="child-avatar">
                {child.gender === 'Female' ? '👧' : child.gender === 'Male' ? '👦' : '🧒'}
              </div>
              
              <div className="child-basic-info">
                <h3>{child.firstName} {child.lastName}</h3>
                <p className="child-age">Age: {calculateAge(child.dateOfBirth)}</p>
                <p className="child-group">Group: {child.group}</p>
                
                <div className="parent-info">
                  <p className="parent-name">
                    Parent: {child.parentFirstName} {child.parentLastName}
                  </p>
                  <p className="parent-contact">{child.parentEmail}</p>
                  <span className={`registration-status ${child.parentRegistered ? 'registered' : 'pending'}`}>
                    {child.parentRegistered ? '✅ Registered' : '⏳ Pending Registration'}
                  </span>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  className="view-btn"
                  onClick={() => handleViewChild(child)}
                >
                  👁️ View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="modal-overlay">
          <div className="modal extra-large-modal">
            <div className="modal-header">
              <h2>➕ Add New Child to Daycare</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddChildModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddChild} className="add-child-form">
              {/* Child Information Section */}
              <div className="form-section">
                <h3>👶 Child Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={newChildData.firstName}
                      onChange={handleNewChildChange}
                      required
                      placeholder="Enter child's first name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={newChildData.lastName}
                      onChange={handleNewChildChange}
                      required
                      placeholder="Enter child's last name"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth *</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={newChildData.dateOfBirth}
                      onChange={handleNewChildChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select
                      id="gender"
                      name="gender"
                      value={newChildData.gender}
                      onChange={handleNewChildChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="group">Age Group</label>
                    <select
                      id="group"
                      name="group"
                      value={newChildData.group}
                      onChange={handleNewChildChange}
                    >
                      <option value="">Auto-calculated</option>
                      <option value="Infant">Infant (0-18 months)</option>
                      <option value="Toddler">Toddler (18 months-3 years)</option>
                      <option value="Pre-K">Pre-K (3-5 years)</option>
                    </select>
                    <small>Will be automatically determined based on date of birth</small>
                  </div>
                </div>
              </div>

              {/* Parent Information Section */}
              <div className="form-section">
                <h3>👨‍👩‍👧‍👦 Parent/Guardian Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="parentFirstName">Parent's First Name *</label>
                    <input
                      type="text"
                      id="parentFirstName"
                      name="parentFirstName"
                      value={newChildData.parentFirstName}
                      onChange={handleNewChildChange}
                      required
                      placeholder="Enter parent's first name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="parentLastName">Parent's Last Name *</label>
                    <input
                      type="text"
                      id="parentLastName"
                      name="parentLastName"
                      value={newChildData.parentLastName}
                      onChange={handleNewChildChange}
                      required
                      placeholder="Enter parent's last name"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="parentEmail">Email Address *</label>
                    <input
                      type="email"
                      id="parentEmail"
                      name="parentEmail"
                      value={newChildData.parentEmail}
                      onChange={handleNewChildChange}
                      required
                      placeholder="parent@email.com"
                    />
                    <small>This email will be used for the parent portal account</small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="parentPhone">Phone Number *</label>
                    <input
                      type="tel"
                      id="parentPhone"
                      name="parentPhone"
                      value={newChildData.parentPhone}
                      onChange={handleNewChildChange}
                      required
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="form-section">
                <h3>🏥 Medical Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="allergies">Allergies</label>
                    <input
                      type="text"
                      id="allergies"
                      name="allergies"
                      value={newChildData.allergies}
                      onChange={handleNewChildChange}
                      placeholder="e.g., Peanuts, Dairy, None (separated by commas)"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="medicalConditions">Medical Conditions</label>
                    <input
                      type="text"
                      id="medicalConditions"
                      name="medicalConditions"
                      value={newChildData.medicalConditions}
                      onChange={handleNewChildChange}
                      placeholder="e.g., Asthma, Diabetes, None (separated by commas)"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="medications">Current Medications</label>
                    <input
                      type="text"
                      id="medications"
                      name="medications"
                      value={newChildData.medications}
                      onChange={handleNewChildChange}
                      placeholder="e.g., Inhaler, Insulin, None (separated by commas)"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="dietaryRestrictions">Dietary Restrictions</label>
                    <input
                      type="text"
                      id="dietaryRestrictions"
                      name="dietaryRestrictions"
                      value={newChildData.dietaryRestrictions}
                      onChange={handleNewChildChange}
                      placeholder="e.g., Vegetarian, Gluten-free, None"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="doctorName">Doctor's Name</label>
                    <input
                      type="text"
                      id="doctorName"
                      name="doctorName"
                      value={newChildData.doctorName}
                      onChange={handleNewChildChange}
                      placeholder="Dr. Smith"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="doctorPhone">Doctor's Phone</label>
                    <input
                      type="tel"
                      id="doctorPhone"
                      name="doctorPhone"
                      value={newChildData.doctorPhone}
                      onChange={handleNewChildChange}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="form-section">
                <h3>🚨 Emergency Contact</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="emergencyContact">Emergency Contact Name</label>
                    <input
                      type="text"
                      id="emergencyContact"
                      name="emergencyContact"
                      value={newChildData.emergencyContact}
                      onChange={handleNewChildChange}
                      placeholder="Full name of emergency contact"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="emergencyRelationship">Relationship</label>
                    <input
                      type="text"
                      id="emergencyRelationship"
                      name="emergencyRelationship"
                      value={newChildData.emergencyRelationship}
                      onChange={handleNewChildChange}
                      placeholder="e.g., Grandmother, Uncle, Family Friend"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="emergencyPhone">Emergency Phone</label>
                    <input
                      type="tel"
                      id="emergencyPhone"
                      name="emergencyPhone"
                      value={newChildData.emergencyPhone}
                      onChange={handleNewChildChange}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="form-section">
                <h3>📝 Additional Information</h3>
                
                <div className="form-group">
                  <label htmlFor="specialNeeds">Special Needs or Accommodations</label>
                  <textarea
                    id="specialNeeds"
                    name="specialNeeds"
                    value={newChildData.specialNeeds}
                    onChange={handleNewChildChange}
                    rows="3"
                    placeholder="Any special needs, accommodations, or important information about the child..."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={newChildData.notes}
                    onChange={handleNewChildChange}
                    rows="3"
                    placeholder="Any other important information, preferences, or notes about the child..."
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? '⏳ Adding Child...' : '✅ Add Child & Generate Access Code'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddChildModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Child Details Modal */}
      {showModal && selectedChild && (
        <ChildDetailsModal 
          child={selectedChild}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default ChildrenManagement;