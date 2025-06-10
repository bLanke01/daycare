// components/layout/AdminSidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AdminSidebar = () => {
  const pathname = usePathname();
  
  // Define menu items
  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/admin' },
    { icon: '🔑', label: 'Access Codes', path: '/admin/access-codes' },
    { icon: '📅', label: 'View Schedules & Calendar', path: '/admin/schedules' },
    { icon: '💰', label: 'Payment', path: '/admin/payment' },
    { icon: '💬', label: 'Message system', path: '/admin/messages' },
    { icon: '👶', label: 'Manage Children', path: '/admin/children' },
    { icon: '✓', label: 'Attendance', path: '/admin/attendance' },
    { icon: '📝', label: 'Activity Log', path: '/admin/activity-log' },
    { icon: '🍽️', label: 'Meals', path: '/admin/meals' },
    { icon: '😴', label: 'Nap Track', path: '/admin/nap-track' },
  ];
  
  const otherItems = [
    { icon: '⚙️', label: 'Settings', path: '/admin/settings' },
    { icon: '👤', label: 'Account', path: '/admin/account' },
    { icon: '❓', label: 'Help', path: '/admin/help' },
  ];
  
  // Check if a menu item is active
  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <div className="drawer-side">
      <label htmlFor="admin-drawer" className="drawer-overlay"></label>
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

export default AdminSidebar;