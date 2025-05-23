// app/about/page.js

export default function About() {
    return (
      <div className="about-page">
        <div className="content-wrapper">
          <div className="about-text">
            <h1>Connect with your community!</h1>
            <p>
              We actively connect with local organizations, events, and resources to build strong 
              relationships and foster a sense of belonging. By working together, we create a network of 
              support that benefits everyone.
            </p>
          </div>
          <div className="about-image">
            {/* Image placeholder - in a real implementation this would be an actual image */}
          </div>
        </div>
        
        <div className="about-sections">
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              At our daycare, we are committed to providing a nurturing, educational environment 
              where children can explore, learn, and grow. We believe in developing the whole child 
              by focusing on social, emotional, physical, and cognitive development.
            </p>
          </section>
          
          <section className="about-section">
            <h2>Our Team</h2>
            <p>
              Our team consists of passionate, qualified early childhood educators who are dedicated 
              to making a positive impact in children's lives. Each staff member brings unique skills 
              and perspectives, creating a diverse and enriching environment for all children.
            </p>
          </section>
          
          <section className="about-section">
            <h2>Our Approach</h2>
            <p>
              We believe in a play-based approach to learning, where children are encouraged to explore 
              their interests and develop their abilities through meaningful activities. Our curriculum 
              is designed to inspire curiosity, creativity, and a love for learning that will last a lifetime.
            </p>
          </section>
          
          <section className="about-section">
            <h2>Community Involvement</h2>
            <p>
              We are proud to be an active part of our community. We regularly partner with local 
              organizations, invite community helpers to visit our center, and participate in community 
              events. We believe that these connections enrich our program and help children develop a 
              sense of belonging and citizenship.
            </p>
          </section>
        </div>
      </div>
    );
  }