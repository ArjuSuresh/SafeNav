import React from 'react';
import { Info, HelpCircle, Navigation, Users, Zap, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

function AboutPage({ onBack }) {
  // Use colors matching the home page / global.css
  const cardBg = 'rgba(72, 42, 65, 0.4)'; // translucent to blend with app background
  const cardBorder = '1px solid rgba(226, 210, 200, 0.1)';
  
  return (
    <div style={{ paddingBottom: '0', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="container" style={{ flex: 1, paddingTop: '100px', paddingBottom: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <button 
          onClick={onBack} 
          style={{ 
            background: 'transparent', 
            border: '1px solid rgba(226, 210, 200, 0.3)', 
            color: 'var(--text-main)', 
            padding: '8px 20px', 
            borderRadius: '25px', 
            cursor: 'pointer',
            marginBottom: '2rem',
            fontWeight: '500',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          ← Back to Home
        </button>

        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            About <span className="text-gradient">SafeNav</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Redefining indoor navigation with intelligent safety protocols and real-time guidance.
          </p>
        </div>

        {/* Top 2 Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '2rem' }}>
            <Info size={24} color="#3B82F6" style={{ marginBottom: '1.5rem' }} /> {/* Blue accent */}
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: '600' }}>About The Platform</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              SafeNav is an intelligent indoor navigation website designed to prioritize user safety. It integrates crowd awareness and emergency guidance to ensure secure movement within complex buildings.
            </p>
          </div>
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '2rem' }}>
            <HelpCircle size={24} color="#10B981" style={{ marginBottom: '1.5rem' }} /> {/* Green accent */}
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: '600' }}>Why This System Exists</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              Large indoor spaces can be confusing and unsafe, especially during emergencies. Our system solves this by offering clear, real-time navigation that adapts to changing conditions.
            </p>
          </div>
        </div>

        {/* What the system offers */}
        <h2 style={{ textAlign: 'center', fontSize: '1.6rem', marginBottom: '2rem', fontWeight: '600' }}>What The System Offers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '4rem' }}>
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
             <Navigation size={24} color="var(--text-main)" style={{ marginBottom: '1rem' }} />
             <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600' }}>Indoor Navigation</h4>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Seamless guidance through complex corridors and rooms.</p>
          </div>
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
             <Users size={24} color="var(--text-main)" style={{ marginBottom: '1rem' }} />
             <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600' }}>Crowd Awareness</h4>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Real-time density monitoring to avoid congestion.</p>
          </div>
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
             <Zap size={24} color="#F59E0B" style={{ marginBottom: '1rem' }} /> {/* Yellow accent */}
             <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600' }}>Smart Routing</h4>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Intelligent path selection based on efficiency and safety.</p>
          </div>
          <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
             <AlertTriangle size={24} color="#EF4444" style={{ marginBottom: '1rem' }} /> {/* Red accent */}
             <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: '600' }}>Emergency Guide</h4>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Immediate evacuation routes during hazard alerts.</p>
          </div>
        </div>

        {/* Bottom Split Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
           <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600' }}>How It Helps Users</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1.25rem' }}>
                  <CheckCircle size={20} color="var(--text-main)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Navigate efficiently without getting lost in large buildings.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '1.25rem' }}>
                  <CheckCircle size={20} color="var(--text-main)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Avoid crowded areas for a faster and safer journey.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle size={20} color="var(--text-main)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Receive instant, clear instructions during emergencies.</span>
                </li>
              </ul>
           </div>
           
           <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: '600' }}>Where It Can Be Used</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {['Hospitals', 'Universities', 'Shopping Malls', 'Airports', 'Corporate Offices'].map(tag => (
                  <span key={tag} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
           </div>
        </div>

        {/* Safety First Design */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '2rem', marginBottom: '4rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
             <Shield size={24} color="var(--text-main)" />
             <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: 0 }}>Safety-First Design</h3>
           </div>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
             Unlike traditional maps, SafeNav prioritizes your well-being. We analyze environmental data to recommend routes that are not just short, but safe. In emergencies, the system overrides standard paths to guide you away from hazards.
           </p>
        </div>

        {/* Disclaimer */}
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '2.5rem 0',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
           <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
             Disclaimer: This website is an academic prototype developed for demonstration and learning purposes.
           </span>
        </div>
      </div>

      {/* Exact Home Page Style Footer */}
      <footer style={{ 
        backgroundColor: '#482A41', 
        padding: '4rem 2rem 3rem 2rem', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: 'auto',
        borderRadius: '24px 24px 0 0'
      }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem', marginBottom: '4rem' }}>
          
          <div style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#E2D2C8' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>SafeNav</span>
            </div>
            <p style={{ color: '#E2D2C8', fontSize: '1rem', lineHeight: '1.7', margin: 0, opacity: 0.9 }}>
              Next-generation indoor navigation<br />
              ensuring safety through real-time crowd<br />
              analytics and hazard detection.
            </p>
          </div>

          <div style={{ minWidth: '200px' }}>
            <h4 style={{ color: '#E2D2C8', fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Project</h4>
            <p style={{ color: '#E2D2C8', fontSize: '0.95rem', margin: '0 0 0.5rem 0', opacity: 0.9 }}>Dept of AI (2023-2027)</p>
            <p style={{ color: '#E2D2C8', fontSize: '0.95rem', margin: 0, opacity: 0.9 }}>Spring 2026</p>
          </div>

        </div>

        <div style={{ textAlign: 'center', color: '#E2D2C8', fontSize: '0.85rem', opacity: 0.8 }}>
          © 2026 Smart Indoor Safety Navigation System. Academic Prototype.
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;
