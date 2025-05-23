'use client';

import { useSearchParams } from 'next/navigation';
import SignupForm from '../../components/auth/SignupForm';

export default function Signup() {
  const searchParams = useSearchParams();
  const userType = searchParams.get('type');
  
  // If no user type is specified, redirect to auth landing page
  if (!userType) {
    // In a server component, we'd use redirect()
    // But since this is a client component, we'll handle it differently
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    return null;
  }
  
  return (
    <div className="auth-page">
      <div className="auth-page-title">
        <h1>SignUp Page</h1>
      </div>
      <div className="auth-container">
        <SignupForm />
      </div>
    </div>
  );
}