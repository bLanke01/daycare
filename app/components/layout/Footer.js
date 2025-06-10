// app/components/layout/Footer.js
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer p-10 bg-base-200 text-base-content">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold">D</div>
          <span className="text-xl font-semibold">Daycare Management</span>
        </div>
        <p className="max-w-xs text-base-content/70">
          Providing quality childcare and early education services in Calgary since 2020.
        </p>
      </div>
      
      <div>
        <span className="footer-title">Quick Links</span>
        <Link href="/" className="link link-hover">Home</Link>
        <Link href="/about" className="link link-hover">About Us</Link>
        <Link href="/program" className="link link-hover">Our Programs</Link>
        <Link href="/location" className="link link-hover">Location</Link>
        <Link href="/contact" className="link link-hover">Contact Us</Link>
        <Link href="/faq" className="link link-hover">FAQ</Link>
      </div>
      
      <div>
        <span className="footer-title">Programs</span>
        <Link href="/program#infant" className="link link-hover">Infant Care</Link>
        <Link href="/program#toddler" className="link link-hover">Toddler Program</Link>
        <Link href="/program#preschool" className="link link-hover">Preschool</Link>
        <Link href="/program#afterschool" className="link link-hover">After-School Care</Link>
      </div>
      
      <div>
        <span className="footer-title">Contact Info</span>
        <address className="not-italic">
          <p>123 Daycare Street</p>
          <p>Calgary, Alberta, CA T2P 1J9</p>
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
            </svg>
            (403) 555-1234
          </p>
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
              <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
            </svg>
            info@daycaremanagement.com
          </p>
        </address>
      </div>
      
      <div className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-4xl">
          <p>&copy; {currentYear} Daycare Management. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/privacy" className="link link-hover">Privacy Policy</Link>
            <Link href="/terms" className="link link-hover">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;