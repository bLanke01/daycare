// app/location/page.js
import Link from 'next/link';

export default function Location() {
  return (
    <div className="location-page">
      <div className="content-wrapper">
        <div className="location-text">
          <h1>Our Location</h1>
          <p>
            Our daycare center is conveniently located in Calgary, Alberta. We're easily accessible
            by public transportation and have ample parking for parents dropping off and picking up their children.
          </p>
          
          <div className="address-box">
            <h2>Visit Us</h2>
            <p>123 Daycare Street</p>
            <p>Calgary, Alberta, CA T2P 1J9</p>
            <p>Phone: (403) 555-1234</p>
            <p>Email: info@daycaremanagement.com</p>
          </div>
          
          <div className="hours-box">
            <h2>Hours of Operation</h2>
            <p>Monday - Friday: 7:00 AM - 6:00 PM</p>
            <p>Saturday - Sunday: Closed</p>
          </div>
          
          <Link href="/contact">
            <button className="cta-button">Book a tour</button>
          </Link>
        </div>
        
        <div className="location-map">
          {/* Map placeholder - in a real implementation this would be an embedded map */}
          <div className="map-placeholder">
            <p>Map would appear here</p>
          </div>
        </div>
      </div>
      
      <div className="directions-section">
        <h2>Getting Here</h2>
        <div className="directions-content">
          <div className="direction-card">
            <h3>By Car</h3>
            <p>
              From Downtown Calgary: Head north on Centre Street for 2.5 km, turn right onto Daycare Street.
              Ample parking is available in our dedicated lot.
            </p>
          </div>
          
          <div className="direction-card">
            <h3>Public Transit</h3>
            <p>
              Bus routes 15 and 23 stop within a 5-minute walk from our facility.
              The nearest C-Train station is a 10-minute walk away.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}