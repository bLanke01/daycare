// components/admin/ChildrenManagement.js (Updated with improved access code generation)
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy, addDoc, setDoc, where } from 'firebase/firestore';
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
      setSuccessMessage('');
      
      // Generate unique access code
      let accessCode;
      let isUnique = false;
      
      // Ensure access code is unique
      while (!isUnique) {
        accessCode = generateAccessCode();
        
        // Check if this code already exists
        const existingCodes = await getDocs(
          query(collection(db, 'accessCodes'), where('code', '==', accessCode))
        );
        
        if (existingCodes.empty) {
          isUnique = true;
        }
      }
      
      console.log('Generated unique access code:', accessCode);
      
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
      console.log('Child added with ID:', childRef.id);
      
      // Create access code document for parent registration
      const accessCodeData = {
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
        parentId: null,
        note: `Registration code for ${newChildData.parentFirstName.trim()} ${newChildData.parentLastName.trim()} - child: ${newChildData.firstName.trim()} ${newChildData.lastName.trim()}`
      };
      
      await setDoc(doc(db, 'accessCodes', accessCode), accessCodeData);
      console.log('Access code document created:', accessCode);
      
      // Show success message with access code
      const successMsg = `🎉 SUCCESS! Child added to the system!

      👶 Child: ${newChildData.firstName} ${newChildData.lastName}
      📧 Parent: ${newChildData.parentFirstName} ${newChildData.parentLastName}
      📧 Email: ${newChildData.parentEmail}
      📱 Phone: ${newChildData.parentPhone}
      🏫 Group: ${childData.group}

      🔑 PARENT ACCESS CODE: ${accessCode}

      📋 IMPORTANT INSTRUCTIONS FOR PARENT:
      1. Give this access code to the parent
      2. Parent should visit your signup page
      3. Parent enters this code during registration
      4. Code will link their account to their child's profile
      5. Parent can then view daily updates, activities, meals, etc.

      ⏰ Code expires in 30 days
      💾 Code has been saved to the system
      🔗 Parent registration link: [Your website]/auth/signup?type=parent`;

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Manage Children</h2>
        <div className="flex items-center gap-4">
          <span className="badge badge-lg">{children.length} children</span>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddChildModal(true)}
          >
            Add New Child
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button className="btn btn-square btn-ghost btn-sm" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">🎉 Child Successfully Added!</h3>
            <div className="bg-base-200 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{successMessage}</pre>
            </div>
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  const codeMatch = successMessage.match(/ACCESS CODE: ([A-Z0-9]{8})/);
                  if (codeMatch) {
                    navigator.clipboard.writeText(codeMatch[1]);
                    alert('Access code copied to clipboard!');
                  }
                }}
              >
                Copy Access Code
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => window.print()}
              >
                Print Instructions
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSuccessMessage('');
                  setShowAddChildModal(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
        <div className="form-control w-full sm:w-auto">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search by child or parent name..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        <select 
          className="select select-bordered w-full sm:w-auto"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        >
          <option value="All">All Groups</option>
          <option value="Infant">Infant (0-18 months)</option>
          <option value="Toddler">Toddler (18 months-3 years)</option>
          <option value="Pre-K">Pre-K (3-5 years)</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && children.length === 0 ? (
          <div className="col-span-full flex justify-center items-center min-h-[400px]">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="col-span-full text-center py-8">
            {children.length === 0 ? (
              <div>
                <h3 className="font-bold mb-2">No children in the system yet</h3>
                <p className="text-base-content/70">Click "Add New Child" to register your first child.</p>
              </div>
            ) : (
              <div className="text-base-content/70">No children found matching your search criteria.</div>
            )}
          </div>
        ) : (
          filteredChildren.map(child => (
            <div key={child.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">
                    {child.gender === 'Female' ? '👧' : child.gender === 'Male' ? '👦' : '🧒'}
                  </div>
                  <div>
                    <h3 className="card-title">{child.firstName} {child.lastName}</h3>
                    <p className="text-sm opacity-75">Age: {calculateAge(child.dateOfBirth)}</p>
                    <div className="badge badge-outline">{child.group}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm">
                    Parent: {child.parentFirstName} {child.parentLastName}
                  </p>
                  <p className="text-sm opacity-75">{child.parentEmail}</p>
                  <div className={`badge ${child.parentRegistered ? 'badge-success' : 'badge-warning'}`}>
                    {child.parentRegistered ? 'Parent Registered' : 'Awaiting Registration'}
                  </div>
                  {!child.parentRegistered && (
                    <div className="text-sm bg-base-200 p-2 rounded">
                      Access Code: <span className="font-mono">{child.accessCode}</span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewChild(child)}
                  >
                    View Details
                  </button>
                  {!child.parentRegistered && (
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(child.accessCode);
                        alert(`Access code ${child.accessCode} copied to clipboard!`);
                      }}
                    >
                      Copy Code
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-6">Add New Child to Daycare</h3>
            
            <form onSubmit={handleAddChild} className="space-y-6">
              {/* Child Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">👶 Child Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">First Name *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="firstName"
                        value={newChildData.firstName}
                        onChange={handleNewChildChange}
                        required
                        placeholder="Enter child's first name"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Last Name *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="lastName"
                        value={newChildData.lastName}
                        onChange={handleNewChildChange}
                        required
                        placeholder="Enter child's last name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Date of Birth *</span>
                      </label>
                      <input
                        type="date"
                        className="input input-bordered"
                        name="dateOfBirth"
                        value={newChildData.dateOfBirth}
                        onChange={handleNewChildChange}
                        required
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Gender *</span>
                      </label>
                      <select
                        className="select select-bordered"
                        name="gender"
                        value={newChildData.gender}
                        onChange={handleNewChildChange}
                        required
                      >
                        <option value=""></option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Age Group</span>
                      </label>
                      <select
                        className="select select-bordered"
                        name="group"
                        value={newChildData.group}
                        onChange={handleNewChildChange}
                      >
                        <option value="">Auto-calculated</option>
                        <option value="Infant">Infant (0-18 months)</option>
                        <option value="Toddler">Toddler (18 months-3 years)</option>
                        <option value="Pre-K">Pre-K (3-5 years)</option>
                      </select>
                      <label className="label">
                        <span className="label-text-alt">Will be automatically determined based on date of birth</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">👨‍👩‍👧‍👦 Parent/Guardian Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Parent's First Name *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="parentFirstName"
                        value={newChildData.parentFirstName}
                        onChange={handleNewChildChange}
                        required
                        placeholder="Enter parent's first name"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Parent's Last Name *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="parentLastName"
                        value={newChildData.parentLastName}
                        onChange={handleNewChildChange}
                        required
                        placeholder="Enter parent's last name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email Address *</span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered"
                        name="parentEmail"
                        value={newChildData.parentEmail}
                        onChange={handleNewChildChange}
                        required
                        placeholder="parent@email.com"
                      />
                      <label className="label">
                        <span className="label-text-alt">This email will be used for the parent portal account</span>
                      </label>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Phone Number *</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered"
                        name="parentPhone"
                        value={newChildData.parentPhone}
                        onChange={handleNewChildChange}
                        required
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🏥 Medical Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Allergies</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="allergies"
                        value={newChildData.allergies}
                        onChange={handleNewChildChange}
                        placeholder="e.g., Peanuts, Dairy, None (separated by commas)"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Medical Conditions</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="medicalConditions"
                        value={newChildData.medicalConditions}
                        onChange={handleNewChildChange}
                        placeholder="e.g., Asthma, Diabetes, None (separated by commas)"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Current Medications</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="medications"
                        value={newChildData.medications}
                        onChange={handleNewChildChange}
                        placeholder="e.g., Inhaler, Insulin, None (separated by commas)"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Dietary Restrictions</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="dietaryRestrictions"
                        value={newChildData.dietaryRestrictions}
                        onChange={handleNewChildChange}
                        placeholder="e.g., Vegetarian, Gluten-free, None"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Doctor's Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="doctorName"
                        value={newChildData.doctorName}
                        onChange={handleNewChildChange}
                        placeholder="Dr. Smith"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Doctor's Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered"
                        name="doctorPhone"
                        value={newChildData.doctorPhone}
                        onChange={handleNewChildChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🚨 Emergency Contact</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Emergency Contact Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="emergencyContact"
                        value={newChildData.emergencyContact}
                        onChange={handleNewChildChange}
                        placeholder="Full name of emergency contact"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Relationship</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        name="emergencyRelationship"
                        value={newChildData.emergencyRelationship}
                        onChange={handleNewChildChange}
                        placeholder="e.g., Grandmother, Uncle"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Emergency Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered"
                        name="emergencyPhone"
                        value={newChildData.emergencyPhone}
                        onChange={handleNewChildChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">📝 Additional Information</h4>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Special Needs or Accommodations</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      name="specialNeeds"
                      value={newChildData.specialNeeds}
                      onChange={handleNewChildChange}
                      placeholder="Any special needs, accommodations, or important information about the child..."
                    />
                  </div>
                  
                  {/* <div className="form-control">
                    <label className="label">
                      <span className="label-text">Additional Notes</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      name="notes"
                      value={newChildData.notes}
                      onChange={handleNewChildChange}
                      placeholder="Any other important information, preferences, or notes about the child..."
                    />
                  </div> */}
                </div>
              </div>
              
              <div className="modal-action">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Add Child & Generate Access Code'
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn"
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