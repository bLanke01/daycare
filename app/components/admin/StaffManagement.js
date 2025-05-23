// components/admin/StaffManagement.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff', // Default role
    position: ''
  });

  // Load staff members
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffQuery = query(collection(db, 'users'), where('role', '==', 'admin'), where('isOwner', '!=', true));
        const snapshot = await getDocs(staffQuery);
        
        const staff = [];
        snapshot.forEach(doc => {
          staff.push({ id: doc.id, ...doc.data() });
        });
        
        setStaffMembers(staff);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setError('Error loading staff members');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Create new user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'admin', // All staff members get admin role
        position: formData.position,
        isOwner: false,
        createdAt: new Date().toISOString()
      });
      
      // Add to local state
      setStaffMembers([...staffMembers, {
        id: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'admin',
        position: formData.position,
        isOwner: false
      }]);
      
      // Reset form and close modal
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'staff',
        position: ''
      });
      setShowModal(false);
    } catch (error) {
      setError(`Error creating staff account: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      setLoading(true);
      
      // Delete the user document
      await deleteDoc(doc(db, 'users', staffId));
      
      // Update local state
      setStaffMembers(staffMembers.filter(staff => staff.id !== staffId));
    } catch (error) {
      setError(`Error deleting staff member: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-management">
      <div className="page-header">
        <h1>Staff Management</h1>
        <button className="add-staff-btn" onClick={() => setShowModal(true)}>
          Add Staff Member
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="staff-list">
        {loading && staffMembers.length === 0 ? (
          <div className="loading">Loading staff members...</div>
        ) : staffMembers.length === 0 ? (
          <div className="no-staff">No staff members found. Add your first staff member!</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map(staff => (
                <tr key={staff.id}>
                  <td>{`${staff.firstName} ${staff.lastName}`}</td>
                  <td>{staff.email}</td>
                  <td>{staff.position}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDeleteStaff(staff.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Staff Member</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
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
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g. Teacher, Administrator"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Staff Member'}
                </button>
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

export default StaffManagement;