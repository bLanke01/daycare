'use client';

import { useState } from 'react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

export default function AdminAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const displayName = e.target.displayName.value;
      await updateProfile(auth.currentUser, { displayName });
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newPassword = e.target.newPassword.value;
      await updatePassword(auth.currentUser, newPassword);
      setSuccess('Password changed successfully!');
      e.target.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content mb-8">Account Settings</h1>

        {error && (
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Profile Settings
              </h2>
              
              <form onSubmit={handleProfileUpdate}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Display Name</span>
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    defaultValue={auth.currentUser?.displayName || ''}
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    value={auth.currentUser?.email || ''}
                    className="input input-bordered w-full"
                    disabled
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">Email cannot be changed</span>
                  </label>
                </div>

                <div className="card-actions justify-end mt-6">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Password Change */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Change Password
              </h2>
              
              <form onSubmit={handlePasswordChange}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    className="input input-bordered w-full"
                    required
                    minLength={6}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">Minimum 6 characters</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="input input-bordered w-full"
                    required
                    minLength={6}
                  />
                </div>

                <div className="card-actions justify-end mt-6">
                  <button 
                    type="submit" 
                    className="btn btn-secondary" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-warning" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Security Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-base-content/70">Add an extra layer of security to your account</p>
                </div>
                <button className="btn btn-warning btn-sm">Enable 2FA</button>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <h3 className="font-medium">Login History</h3>
                  <p className="text-sm text-base-content/70">View your recent login activity</p>
                </div>
                <button className="btn btn-ghost btn-sm">View History</button>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <h3 className="font-medium">Active Sessions</h3>
                  <p className="text-sm text-base-content/70">Manage your active login sessions</p>
                </div>
                <button className="btn btn-ghost btn-sm">Manage Sessions</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 