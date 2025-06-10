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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <div className="grid gap-6">
        {/* Profile Information */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Profile Information</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">First Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Last Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Address</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <h3 className="font-bold mt-6 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
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

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Relationship</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
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

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered"
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
              </div>

              <div className="card-actions justify-end mt-6">
                {!isEditing ? (
                  <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Children Information */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Children Information</h2>
            <div className="space-y-6">
              {children.map((child, index) => (
                <div key={child.id} className="card bg-base-200">
                  <div className="card-body">
                    <h3 className="font-bold">Child {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Name</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered"
                          value={child.name}
                          onChange={(e) => handleChildUpdate(index, 'name', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Date of Birth</span>
                        </label>
                        <input
                          type="date"
                          className="input input-bordered"
                          value={child.dateOfBirth}
                          onChange={(e) => handleChildUpdate(index, 'dateOfBirth', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Group</span>
                        </label>
                        <select
                          className="select select-bordered"
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

                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text">Allergies</span>
                        </label>
                        <textarea
                          className="textarea textarea-bordered h-24"
                          value={child.allergies}
                          onChange={(e) => handleChildUpdate(index, 'allergies', e.target.value)}
                          placeholder="List any allergies..."
                        />
                      </div>

                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text">Medications</span>
                        </label>
                        <textarea
                          className="textarea textarea-bordered h-24"
                          value={child.medications}
                          onChange={(e) => handleChildUpdate(index, 'medications', e.target.value)}
                          placeholder="List any medications..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-actions justify-end mt-4">
              <button type="button" onClick={addChild} className="btn btn-secondary">
                Add Another Child
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="grid gap-4 max-w-md">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Current Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control mt-2">
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 