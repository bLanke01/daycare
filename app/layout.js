// app/layout.js (Updated with better redirect logic)
'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Footer from './components/layout/Footer';
import { AuthProvider, useAuth } from './firebase/auth-context';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <MainContent>{children}</MainContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function MainContent({ children }) {
  const { user, userRole, loading, adminSetupComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  // Check admin setup on load - but be more specific about when to redirect
  useEffect(() => {
    // Skip this check for admin-setup page to avoid infinite loops
    if (pathname === '/admin-setup') return;
    
    // Only redirect to admin-setup if:
    // 1. We're done loading auth state
    // 2. Admin setup is definitely not complete (false, not null)
    // 3. Someone is trying to access admin-specific pages OR trying to login as admin
    // 4. NOT if they're just trying to sign up as parent
    
    const checkAndRedirect = async () => {
      if (!loading && adminSetupComplete === false) {
        // Check if this is an admin-related action
        const isAdminPage = pathname.startsWith('/admin');
        const isAdminAuth = pathname.startsWith('/auth') && 
                           (pathname.includes('type=admin') || 
                            (typeof window !== 'undefined' && window.location.search.includes('type=admin')));
        
        // Only redirect if accessing admin areas or admin auth
        if (isAdminPage || isAdminAuth) {
          console.log('Redirecting to admin setup because:', { isAdminPage, isAdminAuth });
          setRedirecting(true);
          router.push('/admin-setup');
        } else {
          setRedirecting(false);
        }
      } else {
        setRedirecting(false);
      }
    };

    checkAndRedirect();
  }, [loading, adminSetupComplete, router, pathname]);

  // If we're still loading auth or redirecting, show loading
  if (loading || redirecting) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // If user is logged in, don't show the header/footer on dashboard pages
  if (user && (userRole === 'admin' || userRole === 'parent')) {
    const isAdminPage = pathname.startsWith('/admin');
    const isParentPage = pathname.startsWith('/parent');
    
    if (isAdminPage || isParentPage) {
      return <>{children}</>;
    }
  }

  // Otherwise, show the public layout with header and footer
  return (
    <div className="main-container">
      <header className="header">
        <nav className="nav-container">
          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/location">Location</Link></li>
            <li><Link href="/program">Program</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
          <div className="auth-buttons">
            {user ? (
              <>
                <div className="user-welcome">Welcome, {user.email}</div>
                <button onClick={() => useAuth().logOut()} className="logout-btn">Logout</button>
                {userRole === 'admin' ? (
                  <Link href="/admin" className="dashboard-btn">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link href="/parent" className="dashboard-btn">
                    Parent Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth" className="login-btn">
                  Login
                </Link>
                <Link href="/auth" className="signup-btn">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}