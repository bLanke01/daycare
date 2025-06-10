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

  const handleSignupAsStaff = () => {
    alert('Admin accounts can only be created by existing administrators. Please contact the daycare administrator for assistance.');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-3xl bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-16">
                <span className="text-2xl">D</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center">Daycare Management</h1>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Parent Card */}
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <h2 className="card-title mb-4">Parent Access</h2>
                <div className="flex flex-col gap-3 w-full">
                  <button 
                    className="btn btn-primary"
                    onClick={handleLoginAsCustomer}
                  >
                    Log in as Parent
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleSignupAsCustomer}
                  >
                    Sign up as Parent
                  </button>
                </div>
              </div>
            </div>
            
            {/* Admin Card */}
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <h2 className="card-title mb-4">Staff/Admin Access</h2>
                <div className="flex flex-col gap-3 w-full">
                  <button 
                    className="btn btn-primary"
                    onClick={handleLoginAsStaff}
                  >
                    Log in as Staff
                  </button>
                  <button 
                    className="btn btn-disabled"
                    onClick={handleSignupAsStaff}
                    title="Admin accounts can only be created by existing administrators"
                  >
                    Sign up as Staff
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-base-content/70">* Admin accounts are pre-created by system administrators</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;