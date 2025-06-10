'use client'; // This directive is necessary for client components

import Link from 'next/link';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="navbar bg-base-100 shadow-md sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className={`menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 ${isMenuOpen ? 'block' : 'hidden'}`}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/location">Location</Link></li>
            <li><Link href="/program">Program</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost normal-case text-xl">
          Daycare Management
        </Link>
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
      
      <div className="navbar-end">
        <Link href="/auth/login">
          <button className="btn btn-ghost">Login</button>
        </Link>
        <Link href="/auth/signup">
          <button className="btn btn-primary">Sign Up</button>
        </Link>
      </div>
    </div>
  );
};

export default Header;