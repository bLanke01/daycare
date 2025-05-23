// app/utils/with-auth.js (updated)
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../firebase/auth-context';

export function withAuth(Component, requiredRole) {
  return function AuthProtected(props) {
    const { user, userRole, loading, adminSetupComplete } = useAuth();

    useEffect(() => {
      if (!loading) {
        // Check if admin setup is complete
        if (adminSetupComplete === false) {
          redirect('/admin-setup');
          return;
        }

        if (!user) {
          // Not logged in, redirect to login
          redirect('/auth');
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