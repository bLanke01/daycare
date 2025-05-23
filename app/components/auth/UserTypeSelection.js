// components/auth/UserTypeSelection.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const UserTypeSelection = () => {
  const router = useRouter();

  const handleLoginAsCustomer = () => {
    router.push('/auth/login?type=parent');
  };

  const handleSignupAsCustomer = () => {
    router.push('/auth/signup?type=parent');
  };

  const handleLoginAsStaff = () => {
    router.push('/auth/login?type=admin');
  };

  // Admin signup is disabled - this would only show an information message
  const handleSignupAsStaff = () => {
    alert('Admin accounts can only be created by existing administrators. Please contact the daycare administrator for assistance.');
  };

  return (
    <div className="user-type-selection">
      <div className="auth-logo">
        <div className="logo-circle">D</div>
        <h1>Daycare Management</h1>
      </div>
      
      <div className="selection-container">
        <div className="selection-card">
          <h2>Login as Parent</h2>
          <button 
            className="auth-button login-btn"
            onClick={handleLoginAsCustomer}
          >
            Log in
          </button>
          <button 
            className="auth-button signup-btn"
            onClick={handleSignupAsCustomer}
          >
            Sign up
          </button>
        </div>
        
        <div className="selection-divider"></div>
        
        <div className="selection-card">
          <h2>Login as Admin</h2>
          <button 
            className="auth-button login-btn"
            onClick={handleLoginAsStaff}
          >
            Log in
          </button>
          <button 
            className="auth-button signup-btn disabled"
            onClick={handleSignupAsStaff}
            title="Admin accounts can only be created by existing administrators"
          >
            Sign up
          </button>
          <p className="admin-note">* Admin accounts are pre-created by system administrators</p>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;