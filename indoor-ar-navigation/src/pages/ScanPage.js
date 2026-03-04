import React from 'react';
import QRLocalization from '../components/QRLocalization';
import './ScanPage.css';

function ScanPage({ onLocalize, onBack }) {
  return (
    <div className="container scan-container" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ alignSelf: 'flex-start', marginTop: '60px', marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={onBack}>← Home</button>
      </div>
      <h1 className="page-title">Scan Room Sign</h1>
      <p className="page-subtitle">Position the room name sign inside the glowing frame below for automatic detection.</p>
      <QRLocalization onLocalize={onLocalize} />
    </div>
  );
}

export default ScanPage;
