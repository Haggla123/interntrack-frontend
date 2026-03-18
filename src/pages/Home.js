import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Shield, Zap, Activity, Bell, BarChart, ChevronRight 
} from 'lucide-react';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    { title: "Student Daily Reports", desc: "Maintain a comprehensive log of learning activities and daily progress updates.", color: "#2563eb", icon: <Globe size={24}/> },
    { title: "Placement Management", desc: "Streamline the matching process between students and verified industry partners.", color: "#059669", icon: <Shield size={24}/> },
    { title: "Supervisor Evaluations", desc: "Digital assessment tools for both industrial and academic mentors to track growth.", color: "#d97706", icon: <Zap size={24}/> },
    { title: "Progress Tracking", desc: "Visual analytics and milestone monitoring throughout the internship duration.", color: "#dc2626", icon: <Activity size={24}/> },
    { title: "Notifications & Deadlines", desc: "Automated reminders for report submissions, approvals, and system tasks.", color: "#7c3aed", icon: <Bell size={24}/> },
    { title: "Analytics & Reports", desc: "Generate data-driven insights for institutional decision-making and performance.", color: "#4b5563", icon: <BarChart size={24}/> }
  ];

  // List for the infinite slider
  const partners = ["MTN Ghana", "Vodafone", "ECG", "Bank of Ghana", "GCB Bank", "Newmont Gold", "VRA", "Tullow Oil"];

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="container nav-content">
          <div className='logo-details' onClick={() => navigate('/')}>
            <div className='logo'><img src="./its.png" alt="UENR Logo" /></div>
            <div className="logo-text">UENR InternTrack</div>
          </div>
          
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#companies">Companies</a></li>
          </ul>

          <div className="nav-auth">
            <button onClick={() => navigate('/login')} className="btn-outline">Login</button>
          </div>
        </div>
      </nav>

      <header id="home" className="hero">
        <div className="container hero-container">
          <div className="hero-content fade-in">
            <h1>Simplifying Internship Management for UENR</h1>
            <p>A centralized platform to manage placements, track student activities, and facilitate seamless evaluations.</p>
            <div className="hero-actions">
              <button onClick={() => navigate('/login')} className="btn-primary-lg">Get Started <ChevronRight size={20}/></button>
              <button className="btn-outline-lg">Learn More</button>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="section-padding">
        <div className="container">
          <h2 className="section-title">System Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="card feature-card">
                <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNER COMPANIES LOGO SLIDER  */}
      <section id="companies" className="section-padding bg-light">
        <div className="container">
          <h2 className="section-title">Our Industry Partners</h2>
          <div className="logo-slider">
            <div className="logo-track">
              {[...partners, ...partners].map((partner, index) => (
                <div className="slide" key={index}>
                  <div className="partner-logo-box">
                    <span>{partner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="logo-white">UENR InternTrack</div>
              <p>Comprehensive Internship Tracker for UENR.</p>
            </div>
            
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} UENR InternTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;