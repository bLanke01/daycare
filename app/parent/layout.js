'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../firebase/auth-context';
import { withAuth } from '../utils/with-auth';

const ParentDashboardLayout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  
  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };
  
  const handleLogout = async () => {
    const { success, error } = await logOut();
    if (success) {
      router.push('/');
    } else if (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => pathname === path;
  
  return (
    <div className="min-h-screen bg-base-200">
      {/* Drawer for mobile */}
      <div className="drawer lg:drawer-open">
        <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
        
        {/* Drawer content */}
        <div className="drawer-content flex flex-col">
          {/* Navbar */}
          <div className="navbar bg-base-100 shadow-lg lg:hidden">
            <div className="flex-none">
              <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost drawer-button">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-5 h-5 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </label>
            </div>
            <div className="flex-1">
              <span className="text-xl font-bold">Parent Dashboard</span>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-6">
            {/* Top bar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
              <div className="form-control flex-1 max-w-xs">
                <form onSubmit={handleSearch} className="input-group">
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="input input-bordered w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-square">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-4">
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                    <div className="indicator">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="badge badge-sm badge-primary indicator-item">1</span>
                    </div>
                  </div>
                </div>
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                      <span>P</span>
                    </div>
                  </div>
                  <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                    <li><Link href="/parent/account">Profile</Link></li>
                    <li><Link href="/parent/settings">Settings</Link></li>
                    <li><button onClick={handleLogout}>Logout</button></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Page content */}
            <div className="bg-base-100 rounded-box p-6 min-h-[calc(100vh-12rem)]">
              {children}
            </div>
          </main>
        </div>

        {/* Drawer side */}
        <div className="drawer-side z-40">
          <label htmlFor="dashboard-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <div className="menu p-4 w-80 min-h-full bg-base-100 text-base-content">
            {/* Sidebar content */}
            <div className="flex items-center gap-2 mb-8 px-2">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-lg w-12">
                  <span className="text-xl">D</span>
                </div>
              </div>
              <span className="text-xl font-bold">Daycare Management</span>
            </div>

            <ul className="menu menu-lg">
              <li className="menu-title">Menu</li>
              <li>
                <Link 
                  href="/parent" 
                  className={isActive('/parent') ? 'active' : ''}
                >
                  <span className="text-xl">👶</span>Child Profile
                </Link>
              </li>
              <li>
                <Link 
                  href="/parent/schedules" 
                  className={isActive('/parent/schedules') ? 'active' : ''}
                >
                  <span className="text-xl">📅</span>Schedules & Calendar
                </Link>
              </li>
              <li>
                <Link 
                  href="/parent/invoices" 
                  className={isActive('/parent/invoices') ? 'active' : ''}
                >
                  <span className="text-xl">💰</span>Invoice
                </Link>
              </li>
              <li>
                <Link 
                  href="/parent/messages" 
                  className={isActive('/parent/messages') ? 'active' : ''}
                >
                  <span className="text-xl">💬</span>Message System
                </Link>
              </li>

              <li className="menu-title mt-4">Others</li>
              <li>
                <Link 
                  href="/parent/settings"
                  className={isActive('/parent/settings') ? 'active' : ''}
                >
                  <span className="text-xl">⚙️</span>Settings
                </Link>
              </li>
              <li>
                <Link 
                  href="/parent/account"
                  className={isActive('/parent/account') ? 'active' : ''}
                >
                  <span className="text-xl">👤</span>Account
                </Link>
              </li>
              <li>
                <Link 
                  href="/parent/help"
                  className={isActive('/parent/help') ? 'active' : ''}
                >
                  <span className="text-xl">❓</span>Help
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="text-error">
                  <span className="text-xl">🚪</span>Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the layout wrapped with authentication protection
export default withAuth(ParentDashboardLayout, 'parent');