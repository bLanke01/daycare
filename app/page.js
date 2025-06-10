// app/page.js
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero min-h-[70vh] bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse gap-8">
          <div className="lg:w-1/2">
            {/* Placeholder for hero image */}
            <div className="w-full h-[400px] bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary/50 text-xl">Image</span>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <h1 className="text-5xl font-bold text-primary">
              Spring Break Enrollment Time!
            </h1>
            <p className="py-6 text-lg">
              An enim nullam tempor sapien, gravida donec enim ipsum porta 
              justo congue magna at pretium purus pretium ligula
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/program">
                <button className="btn btn-primary">
                  Enroll Now
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </button>
              </Link>
              <Link href="/contact">
                <button className="btn btn-outline">
                  Book a Tour
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary">Quality Education</h2>
              <p>Providing exceptional early childhood education with experienced teachers.</p>
            </div>
          </div>
          
          {/* Feature Card 2 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary">Safe Environment</h2>
              <p>State-of-the-art facilities with modern security measures.</p>
            </div>
          </div>
          
          {/* Feature Card 3 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary">Engaging Activities</h2>
              <p>Fun and educational programs designed for all age groups.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}