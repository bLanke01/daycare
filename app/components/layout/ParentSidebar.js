// components/layout/ParentSidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ParentSidebar = () => {
  const pathname = usePathname();
  
  // Define menu items
  const menuItems = [
    { icon: '👶', label: 'Child Profile', path: '/parent' },
    { icon: '📝', label: 'Manage Children', path: '/parent/manage-children' },
    { icon: '📅', label: 'View Schedules', path: '/parent/schedules' },
    { icon: '🍽️', label: 'View Meals', path: '/parent/meals' },
    { icon: '✓', label: 'View Attendance', path: '/parent/attendance' },
    { icon: '💰', label: 'Make Payment', path: '/parent/payment' },
    { icon: '📄', label: 'Invoice', path: '/parent/invoice' },
    { icon: '💬', label: 'Message system', path: '/parent/messages' },
  ];
  
  const otherItems = [
    { icon: '⚙️', label: 'Settings', path: '/parent/settings' },
    { icon: '👤', label: 'Accounts', path: '/parent/accounts' },
    { icon: '❓', label: 'Help', path: '/parent/help' },
  ];
  
  // Check if a menu item is active
  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div className="parent-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">D</div>
          <div className="logo-text">Daycare Management</div>
        </div>
      </div>
      
      <div className="sidebar-menu">
        <div className="menu-label">MENU</div>
        
        <ul className="menu-items">
          {menuItems.map((item, index) => (
            <li 
              key={index} 
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Link href={item.path}>
                <div className="menu-link">
                  <div className="menu-icon">{item.icon}</div>
                  <div className="menu-text">{item.label}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="menu-label">OTHERS</div>
        
        <ul className="menu-items">
          {otherItems.map((item, index) => (
            <li 
              key={index} 
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Link href={item.path}>
                <div className="menu-link">
                  <div className="menu-icon">{item.icon}</div>
                  <div className="menu-text">{item.label}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ParentSidebar;