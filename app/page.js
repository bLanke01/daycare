// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-page">
      <div className="content-wrapper">
        <div className="hero-content">
          <h1>Spring Break Enrollment Time!</h1>
          <p>
            An enim nullam tempor sapien, gravida donec enim ipsum porta 
            justo congue magna at pretium purus pretium ligula
          </p>
          <Link href="/program">
            <button className="cta-button">ENROLL</button>
          </Link>
        </div>
        
        <div className="hero-image">
          {/* Image would go here in a real implementation */}
          <div className="cta-button-container">
            <Link href="/contact">
              <button className="cta-button secondary">Book a tour</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}