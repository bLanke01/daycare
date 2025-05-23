// app/utils/with-auth.js (FIXED VERSION)
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../firebase/auth-context';

export function withAuth(Component, requiredRole) {
  return function AuthProtected(props) {
    const { user, userRole, loading, adminSetupComplete } = useAuth();

    useEffect(() => {
      if (!loading) {
        // Check if admin setup is complete ONLY when trying to access admin areas
        if (requiredRole === 'admin' && adminSetupComplete === false && !user) {
          // Only redirect to setup if no admin exists AND user is not logged in
          redirect('/admin-setup');
          return;
        }

        if (!user) {
          // Not logged in, redirect to login with the appropriate type
          if (requiredRole === 'admin') {
            redirect('/auth/login?type=admin');
          } else {
            redirect('/auth/login?type=parent');
          }
        } else if (requiredRole && userRole !== requiredRole) {
          // Wrong role, redirect to appropriate dashboard
          if (userRole === 'admin') {
            redirect('/admin');
          } else {
            redirect('/parent');
          }
        }
      }
    }, [user, userRole, loading, adminSetupComplete]);

    // Show loading state while checking authentication
    if (loading) {
      return <div className="loading-spinner">Loading...</div>;
    }

    // If user is authenticated and has the right role, render the component
    if (user && (!requiredRole || userRole === requiredRole)) {
      return <Component {...props} />;
    }

    // This should not be visible as we redirect, but just in case
    return <div className="loading-spinner">Checking authentication...</div>;
  };
}