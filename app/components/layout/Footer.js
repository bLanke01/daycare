// app/components/layout/Footer.js
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-logo">
          <div className="logo-circle">D</div>
          <span>Daycare Management</span>
        </div>
        
        <div className="footer-sections">
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/program">Our Programs</Link></li>
              <li><Link href="/location">Location</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Programs</h3>
            <ul className="footer-links">
              <li><Link href="/program#infant">Infant Care</Link></li>
              <li><Link href="/program#toddler">Toddler Program</Link></li>
              <li><Link href="/program#preschool">Preschool</Link></li>
              <li><Link href="/program#afterschool">After-School Care</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact Info</h3>
            <address className="footer-contact">
              <p>123 Daycare Street</p>
              <p>Calgary, Alberta, CA T2P 1J9</p>
              <p>Phone: (403) 555-1234</p>
              <p>Email: info@daycaremanagement.com</p>
            </address>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} Daycare Management. All Rights Reserved.</p>
          <div className="footer-legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;