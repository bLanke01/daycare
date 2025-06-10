// app/layout.js (FIXED VERSION)
'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Footer from './components/layout/Footer';
import { AuthProvider, useAuth } from './firebase/auth-context';

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
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
    if (pathname === '/admin-setup') {
      setRedirecting(false);
      return;
    }
    
    // Only redirect to admin-setup if:
    // 1. We're done loading auth state
    // 2. Admin setup is definitely not complete (false, not null)
    // 3. User is trying to access admin dashboard pages (not just login)
    // 4. User is NOT already logged in as an admin
    
    const checkAndRedirect = async () => {
      if (!loading && adminSetupComplete === false) {
        // Only redirect if user is trying to access admin dashboard, not just login
        const isAdminDashboard = pathname.startsWith('/admin') && pathname !== '/admin-setup';
        
        // Don't redirect if user is just trying to login or if they're already an admin
        const isJustTryingToLogin = pathname.startsWith('/auth');
        const isAlreadyAdmin = user && userRole === 'admin';
        
        if (isAdminDashboard && !isAlreadyAdmin) {
          console.log('Redirecting to admin setup - dashboard access without admin user');
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
  }, [loading, adminSetupComplete, router, pathname, user, userRole]);

  // If we're still loading auth or redirecting, show loading
  if (loading || redirecting) {
    return <div className="flex items-center justify-center min-h-screen">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>;
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
    <div className="min-h-screen flex flex-col">
      <header className="bg-base-100 shadow-md">
        <div className="navbar container mx-auto">
          <div className="navbar-start">
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/location">Location</Link></li>
                <li><Link href="/program">Program</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/about">About</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
              </ul>
            </div>
            <Link href="/" className="btn btn-ghost text-xl">Daycare Management</Link>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/location">Location</Link></li>
              <li><Link href="/program">Program</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div className="navbar-end gap-2">
            {user ? (
              <>
                <div className="text-sm">Welcome, {user.email}</div>
                <button onClick={() => useAuth().logOut()} className="btn btn-ghost">Logout</button>
                {userRole === 'admin' ? (
                  <Link href="/admin" className="btn btn-primary">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link href="/parent" className="btn btn-primary">
                    Parent Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth" className="btn btn-ghost">
                  Login
                </Link>
                <Link href="/auth" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}