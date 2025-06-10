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
    { icon: '👤', label: 'Account', path: '/parent/account' },
    { icon: '❓', label: 'Help', path: '/parent/help' },
  ];
  
  // Check if a menu item is active
  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div className="drawer-side">
      <label htmlFor="parent-drawer" className="drawer-overlay"></label>
      <aside className="bg-base-200 w-80 min-h-screen">
        {/* Logo */}
        <div className="p-4 bg-base-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center text-xl font-bold">
              D
            </div>
            <span className="text-lg font-semibold">Daycare Management</span>
          </div>
        </div>
        
        {/* Menu */}
        <div className="px-4 py-6">
          <div className="mb-4">
            <h3 className="px-4 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
              Menu
            </h3>
            
            <ul className="menu menu-sm">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.path}
                    className={`flex items-center gap-3 py-2 ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="px-4 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
              Others
            </h3>
            
            <ul className="menu menu-sm">
              {otherItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.path}
                    className={`flex items-center gap-3 py-2 ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ParentSidebar;