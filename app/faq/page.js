// app/faq/page.js

export default function FAQ() {
    // FAQ data
    const faqItems = [
      {
        question: "What is the caregiver-to-child ratio?",
        id: "ratio"
      },
      {
        question: "Are the staff members trained in first aid and CPR?",
        id: "training"
      },
      {
        question: "What can the qualifications and experience of the caregivers?",
        id: "qualifications"
      },
      {
        question: "How do you handle children with dietary restrictions?",
        id: "dietary"
      },
      {
        question: "What types of activities do the children engage in?",
        id: "activities"
      },
      {
        question: "Do you accommodate food allergies or special diets?",
        id: "allergies"
      },
      {
        question: "Do you provide progress reports for children?",
        id: "reports"
      },
      {
        question: "What is the nap and payment structure?",
        id: "payment"
      }
    ];
  
    return (
      <div className="faq-page">
        <h1>Frequent Questions and Answers</h1>
        
        <div className="faq-content">
          <div className="faq-questions">
            <div className="faq-container">
              {faqItems.map((item, index) => (
                <div key={index} className="faq-item">
                  <a href={`#${item.id}`}>{item.question}</a>
                </div>
              ))}
            </div>
          </div>
          
          <div className="faq-answers">
            <h2>Answers</h2>
            <div className="answer-content">
              <p>
                Our caregivers are fully qualified with valid Early 
                Childhood Education (ECE) certification and current
                Standard First Aid and CPR certification, including Infant 
                and Child CPR. They undergo thorough background
                checks, including vulnerable sector screening, to
                ensure a safe environment.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }