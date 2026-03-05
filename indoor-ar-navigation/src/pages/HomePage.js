import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import NavigationBackground from '../components/NavigationBackground';
import './HomePage.css';

function HomePage({ onScan, onMap, onNavigate, onAbout, onHome }) {
  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page" style={{ position: 'relative', overflow: 'hidden' }}>
      <NavigationBackground />
      <section className="hero" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container hero-content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center', marginTop: '2rem' }}>
          <div className="hero-content" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <div className="hero-badge purple-shimmer" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(87, 46, 84, 0.2)',
              padding: '6px 16px',
              borderRadius: '99px',
              color: '#CEB2BD',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '1.5rem',
              border: '1px solid rgba(87, 46, 84, 0.4)'
            }}>
              <Sparkles size={16} />
              <span>Next Gen Indoor Safety</span>
            </div>

            <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '3.5rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E2D2C8' }}>
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>SafeNav</span>
            </h1>

            <p className="hero-subtitle" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
              Real-time pathfinding optimized for crowd density and emergency hazards. Get where you need to go, safely.
            </p>

            <div className="hero-actions" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <button className="btn purple-shimmer btn-start-nav" onClick={onScan} style={{ padding: '0.875rem 1.75rem', fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center', background: '#572E54', color: '#E2D2C8', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Start Navigation
                <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={scrollToFeatures} style={{ padding: '0.875rem 1.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container grid-3" style={{ position: 'relative', zIndex: 1 }}>
        {/* ... features remain hidden/styled below fold for now ... */}
        <div className="card animate-enter stagger-1">
          <h3 className="purple-gradient-text">AI Route Optimization</h3>
          <p>Advanced A* algorithms calculate the fastest path.</p>
        </div>
        <div className="card animate-enter stagger-2">
          <h3 className="purple-gradient-text">Crowd-Aware</h3>
          <p>Real-time density monitoring via BLE beacons.</p>
        </div>
        <div className="card animate-enter stagger-3">
          <h3 className="purple-gradient-text">Emergency Protocol</h3>
          <p>Instant hazard detection triggers automated evacuation.</p>
        </div>
      </section>
      <footer className="container" style={{ position: 'relative', zIndex: 1, padding: '6rem 0 3rem 0', marginTop: '4rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#482A41', borderRadius: '24px 24px 0 0', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem', marginBottom: '4rem' }}>

          <div style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#E2D2C8' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>SafeNav</span>
            </div>
            <p style={{ color: '#E2D2C8', fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
              Next-generation indoor navigation<br />
              ensuring safety through real-time crowd<br />
              analytics and hazard detection.
            </p>
          </div>

          <div style={{ minWidth: '200px' }}>
            <h4 style={{ color: '#E2D2C8', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Project</h4>
            <p style={{ color: '#E2D2C8', fontSize: '0.95rem', marginBottom: '0.75rem', margin: '0 0 0.5rem 0' }}>Dept of AI (2023-2027)</p>
            <p style={{ color: '#E2D2C8', fontSize: '0.95rem', margin: 0 }}>Spring 2026</p>
          </div>

        </div>

        <div style={{ textAlign: 'center', color: '#E2D2C8', fontSize: '0.85rem' }}>
          © 2026 Smart Indoor Safety Navigation System. Academic Prototype.
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
