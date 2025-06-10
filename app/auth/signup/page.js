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
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}