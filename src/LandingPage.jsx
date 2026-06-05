import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/LandingPage.css';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.15 }
    );

    // Wait for DOM to be ready before observing
    setTimeout(() => {
      document.querySelectorAll('section[id]').forEach((section) => {
        observer.observe(section);
      });
    }, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const smoothScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      icon: '🔒',
      title: 'Secure Data',
      description: 'Your medical records are protected with industry-leading encryption.'
    },
    {
      icon: '👨‍⚕️',
      title: 'Verified Doctors',
      description: 'Connect with certified healthcare professionals you can trust.'
    },
    {
      icon: '💊',
      title: 'Easy Record Sharing',
      description: 'Share your medical history instantly with healthcare providers.'
    },
    {
      icon: '🌐',
      title: 'Global Access',
      description: 'Access your health information anywhere, anytime.'
    },
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'Get instant answers to medical queries with our Gemini powered AI chatbot available 24/7.'
    },
    {
      icon: '⚡',
      title: 'All-in-One Platform',
      description: 'From secure file storage to AI assistance — MediTrail handles everything in one place so you never lose track of your health journey.'
    }
];

  const goToDoctorLogin = () => {
    navigate('/doctor/login');
  };

  const goToPatientLogin = () => {
    navigate('/patient/login');
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">MediTrail</div>
          <div className="nav-menu">
            <button onClick={() => smoothScrollTo('about')} className="nav-item">
              About
            </button>
            <button onClick={() => smoothScrollTo('features')} className="nav-item">
              Features
            </button>
            <button onClick={() => smoothScrollTo('footer')} className="nav-item">
              Contact
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-container">
          <h1 className="hero-title">Welcome to MediTrail.</h1>
          <p className="hero-subtitle">Stores and Tracks Your Medical Journey !</p>
          <div className="hero-actions">
            <button className="btn btn-secondary" onClick={goToDoctorLogin}>
              Doctor Portal
            </button>
            <button className="btn btn-secondary" onClick={goToPatientLogin}>
              Patient Portal
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section 
        className={`about-section ${visibleSections.about ? 'section-visible' : ''}`} 
        id="about"
      >
        <div className="about-container">
          <p className="about-text">
            MediTrail Stores your medical history on cloud and makes you burdenless.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section 
        className={`features-section ${visibleSections.features ? 'section-visible' : ''}`} 
        id="features"
      >
        <div className="features-container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="footer">
        <div className="footer-container">
          <p className="footer-text">
            © 2026 MediTrail | 
            <button className="footer-link">Terms</button> | 
            <button className="footer-link">Privacy</button> | 
            <button className="footer-link">Contact</button>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;