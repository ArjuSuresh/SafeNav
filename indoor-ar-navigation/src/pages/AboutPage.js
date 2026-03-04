import React from 'react';

function AboutPage({ onBack }) {
  return (
    <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
      <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '2rem' }}>
        ← Home
      </button>
      <h1 className="text-gradient">SafeNav</h1>
      <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
        Next-generation indoor navigation ensuring safety through real-time crowd analytics and hazard detection.
      </p>
      <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>Project: Dept of AI (2023-2027)</p>
        <p>Spring 2026</p>
        <p>© 2026 Smart Indoor Safety Navigation System. Academic Prototype.</p>
      </div>
    </div>
  );
}

export default AboutPage;
