'use client'; // This directive is necessary for client components

import Link from 'next/link';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="logo">
        <Link href="/">
          <span>Daycare Management</span>
        </Link>
      </div>
      
      <nav className={`nav ${isMenuOpen ? 'active' : ''}`}>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/location">Location</Link></li>
          <li><Link href="/program">Program</Link></li>
          <li><Link href="/contact">Contact</Link></li>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/faq">F&Q</Link></li>
        </ul>
        
        <div className="auth-buttons">
          <Link href="/auth/login">
            <button className="login-btn">Login</button>
          </Link>
          <Link href="/auth/signup">
            <button className="signup-btn">Sign Up</button>
          </Link>
        </div>
      </nav>
      
      <div className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </header>
  );
};

export default Header;