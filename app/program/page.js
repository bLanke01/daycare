// app/program/page.js

export default function Program() {
    return (
      <div className="program-page">
        <div className="program-sections">
          <section className="program-section">
            <h1>What we believe</h1>
            
            <div className="program-content">
              <div className="program-text">
                <h2>We value their smiles</h2>
                <p>
                  We believe that a child's smile is a reflection of 
                  their happiness and well-being. We are dedicated to 
                  creating a safe, nurturing environment where every child 
                  feels valued and supported.
                </p>
              </div>
              <div className="program-image">
                {/* Image placeholder - in a real implementation this would be an actual image */}
              </div>
            </div>
          </section>
          
          <section className="program-section">
            <div className="program-content">
              <div className="program-text">
                <h2>Playing is fun!</h2>
                <p>
                  Through fun and engaging activities, children learn 
                  important skills like creativity, problem-solving, and 
                  teamwork. Playtime fosters social connections and helps 
                  children express themselves in a relaxed, joyful 
                  environment.
                </p>
              </div>
              <div className="program-image">
                {/* Image placeholder - in a real implementation this would be an actual image */}
              </div>
            </div>
          </section>
          
          <section className="program-section">
            <div className="program-content">
              <div className="program-text">
                <h2>Learning through exploration</h2>
                <p>
                  Children are natural explorers, and we encourage their 
                  curiosity through hands-on learning experiences. Our 
                  curriculum is designed to engage all senses and promote 
                  cognitive development through discovery and exploration.
                </p>
              </div>
              <div className="program-image">
                {/* Image placeholder - in a real implementation this would be an actual image */}
              </div>
            </div>
          </section>
          
          <section className="program-section">
            <div className="program-content">
              <div className="program-text">
                <h2>Building strong foundations</h2>
                <p>
                  Early childhood is a critical time for development, and 
                  we focus on building strong foundations for future learning. 
                  Our programs emphasize language development, early literacy, 
                  mathematical thinking, and social-emotional skills.
                </p>
              </div>
              <div className="program-image">
                {/* Image placeholder - in a real implementation this would be an actual image */}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }