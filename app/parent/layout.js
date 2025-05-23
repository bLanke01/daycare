'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../firebase/auth-context';
import { withAuth } from '../utils/with-auth';

const ParentDashboardLayout = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user, logOut } = useAuth();
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality would be implemented here
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
  
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="dashboard-title">Parents Dashboard</div>
      </header>
      
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-logo">
            <div className="logo-circle">D</div>
            <span className="logo-text">Daycare Management</span>
          </div>
          
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="section-header">MENU</div>
              <ul className="nav-items">
                <li className="nav-item active">
                  <Link href="/parent">
                    <div className="nav-link">
                      <div className="nav-icon">👶</div>
                      <span>Child Profile</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/schedules">
                    <div className="nav-link">
                      <div className="nav-icon">📅</div>
                      <span>View Schedules & Calendar</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/payment">
                    <div className="nav-link">
                      <div className="nav-icon">💰</div>
                      <span>Make Payment</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/messages">
                    <div className="nav-link">
                      <div className="nav-icon">💬</div>
                      <span>Message system</span>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="nav-section">
              <div className="section-header">OTHERS</div>
              <ul className="nav-items">
                <li className="nav-item">
                  <Link href="/parent/settings">
                    <div className="nav-link">
                      <div className="nav-icon">⚙️</div>
                      <span>Settings</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/account">
                    <div className="nav-link">
                      <div className="nav-icon">👤</div>
                      <span>Accounts</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/help">
                    <div className="nav-link">
                      <div className="nav-icon">❓</div>
                      <span>Help</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <button 
                    onClick={handleLogout}
                    className="nav-link logout-link"
                  >
                    <div className="nav-icon">🚪</div>
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        <main className="dashboard-main">
          <div className="main-header">
            <div className="search-bar">
              <form onSubmit={handleSearch}>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  <span className="search-icon">🔍</span>
                </button>
              </form>
            </div>
            
            <div className="user-menu">
              <div className="notification-bell">
                <span className="notification-icon">🔔</span>
                <span className="notification-badge">1</span>
              </div>
              
              <div className="user-profile">
                <span className="user-name">{user?.email || 'Parent User'}</span>
                <div className="user-avatar">👨‍👩‍👧‍👦</div>
              </div>
            </div>
          </div>
          
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Export the layout wrapped with authentication protection
export default withAuth(ParentDashboardLayout, 'parent');