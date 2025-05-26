'use client';

import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

export default function ParentAccount() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  const [children, setChildren] = useState([
    {
      id: 1,
      name: '',
      dateOfBirth: '',
      group: '',
      allergies: '',
      medications: ''
    }
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // Update profile in Firestore (implement with your user system)
      // const userRef = doc(db, 'users', userId);
      // await updateDoc(userRef, profile);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    try {
      // Get current user from Firebase Auth
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update password in Firebase Auth
      await updatePassword(user, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      // Provide more specific error messages
      if (error.code === 'auth/requires-recent-login') {
        alert('For security reasons, please log out and log in again before changing your password.');
      } else {
        alert(`Failed to update password: ${error.message}`);
      }
    }
  };

  const handleChildUpdate = (index, field, value) => {
    const updatedChildren = [...children];
    updatedChildren[index] = {
      ...updatedChildren[index],
      [field]: value
    };
    setChildren(updatedChildren);
  };

  const addChild = () => {
    setChildren([
      ...children,
      {
        id: children.length + 1,
        name: '',
        dateOfBirth: '',
        group: '',
        allergies: '',
        medications: ''
      }
    ]);
  };

  return (
    <div className="account-container">
      <h1>Account Settings</h1>

      <section className="account-section">
        <h2>Profile Information</h2>
        <form onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              disabled={!isEditing}
              required
            />
          </div>

          <h3>Emergency Contact</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={profile.emergencyContact.name}
              onChange={(e) => setProfile({
                ...profile,
                emergencyContact: {
                  ...profile.emergencyContact,
                  name: e.target.value
                }
              })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Relationship</label>
            <input
              type="text"
              value={profile.emergencyContact.relationship}
              onChange={(e) => setProfile({
                ...profile,
                emergencyContact: {
                  ...profile.emergencyContact,
                  relationship: e.target.value
                }
              })}
              disabled={!isEditing}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={profile.emergencyContact.phone}
              onChange={(e) => setProfile({
                ...profile,
                emergencyContact: {
                  ...profile.emergencyContact,
                  phone: e.target.value
                }
              })}
              disabled={!isEditing}
              required
            />
          </div>

          {!isEditing ? (
            <button type="button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <div className="button-group">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="account-section">
        <h2>Children Information</h2>
        {children.map((child, index) => (
          <div key={child.id} className="child-form">
            <h3>Child {index + 1}</h3>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={child.name}
                onChange={(e) => handleChildUpdate(index, 'name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={child.dateOfBirth}
                onChange={(e) => handleChildUpdate(index, 'dateOfBirth', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Group</label>
              <select
                value={child.group}
                onChange={(e) => handleChildUpdate(index, 'group', e.target.value)}
                required
              >
                <option value="">Select a group</option>
                <option value="Infant">Infant</option>
                <option value="Toddler">Toddler</option>
                <option value="Pre-K">Pre-K</option>
              </select>
            </div>

            <div className="form-group">
              <label>Allergies</label>
              <textarea
                value={child.allergies}
                onChange={(e) => handleChildUpdate(index, 'allergies', e.target.value)}
                placeholder="List any allergies..."
              />
            </div>

            <div className="form-group">
              <label>Medications</label>
              <textarea
                value={child.medications}
                onChange={(e) => handleChildUpdate(index, 'medications', e.target.value)}
                placeholder="List any medications..."
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addChild} className="add-child-btn">
          Add Another Child
        </button>
      </section>

      <section className="account-section">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">Update Password</button>
        </form>
      </section>
    </div>
  );
} 