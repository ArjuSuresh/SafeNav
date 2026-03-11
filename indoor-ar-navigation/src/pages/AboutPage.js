import React from 'react';

function AboutPage({ onBack }) {
  const sections = [
    {
      icon: '🎯',
      title: 'Our Purpose',
      content: 'To provide a next-generation indoor navigation experience that prioritizes safety, speed, and real-time awareness for every user.'
    },
    {
      icon: '✨',
      title: 'Key Features',
      content: 'Experience seamless AR navigation, live crowd density avoidance, and instant emergency evacuation routing right from your phone.'
    },
    {
      icon: '💡',
      title: 'User Benefits',
      content: 'Save time by avoiding congested hallways, easily find complex room locations, and navigate with confidence during critical situations.'
    },
    {
      icon: '🏢',
      title: 'Use Cases',
      content: 'Designed for universities, large corporate offices, and hospitals where complex indoor layouts often confuse guests and students.'
    },
    {
      icon: '🎨',
      title: 'Design Philosophy',
      content: 'A clean, modern, and accessible interface built on a user-first philosophy. We prioritize clarity and performance above all.'
    },
    {
      icon: '⚠️',
      title: 'Disclaimer',
      content: 'This platform is an academic prototype. While functional, it should not be solely relied upon for real-life life-or-death emergencies.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f5f5f5' }}>
      <div className="container" style={{ flex: 1, paddingTop: '100px', paddingBottom: '60px', maxWidth: '900px', margin: '0 auto' }}>
        <button 
          onClick={onBack} 
          style={{ 
            background: 'transparent', 
            border: '2px solid #FFC107', 
            color: '#FFC107', 
            padding: '8px 20px', 
            borderRadius: '25px', 
            cursor: 'pointer',
            marginBottom: '2.5rem',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          ← Back to Home
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ color: '#FFC107', fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '-0.02em' }}>SafeNav</h1>
          <p style={{ fontSize: '1.25rem', color: '#a3a3a3', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
            Welcome to the Smart Indoor Safety Navigation System. We blend augmented reality and dynamic pathfinding to revolutionize how you move indoors.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {sections.map((sec, idx) => (
            <div key={idx} style={{ 
              background: '#141414', 
              border: '1px solid #262626', 
              borderRadius: '16px', 
              padding: '2rem',
              borderTop: '4px solid #FFC107',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{sec.icon}</div>
              <h3 style={{ color: '#FFC107', fontSize: '1.4rem', marginBottom: '1rem', fontWeight: '600' }}>{sec.title}</h3>
              <p style={{ color: '#d4d4d4', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>{sec.content}</p>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ 
        backgroundColor: '#482A41', /* Matches global.css header/navbar color */
        padding: '2.5rem 20px', 
        textAlign: 'center',
        marginTop: 'auto',
        borderTop: '2px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ color: '#E2D2C8', maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '1.1rem', letterSpacing: '0.05em' }}>PROJECT: DEPT OF AI</p>
          <p style={{ margin: '0 0 16px 0', fontSize: '1rem', opacity: 0.9 }}>Spring 2026 Indoor Navigation Prototype</p>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>© 2026 Smart Indoor Safety Navigation System. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;
