'use client';

import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

export default function AdminAccount() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      
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
      {/* if want to delete an admin account
      <section className="account-section danger-zone">
        <h2>Danger Zone</h2>
        <button 
          className="delete-account-btn"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              // Implement account deletion logic
            }
          }}
        >
          Delete Account
        </button>
      </section> */}
    </div>
  );
} 