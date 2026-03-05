import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import NavigatePage from './pages/NavigatePage';
import MapPage from './pages/MapPage';
import AboutPage from './pages/AboutPage';
import GuidePage from './pages/GuidePage';
import { loadMapFromBackend } from './data/indoorMap';
import './global.css';
import './App.css';

function App() {
  const [page, setPage] = useState('home'); // 'home', 'scan', 'navigate', 'map', 'about'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [globalEmergency, setGlobalEmergency] = useState(false);

  // Load the floor map graph from the backend on startup
  useEffect(() => {
    loadMapFromBackend().catch(err =>
      console.warn('Backend map load failed, using local fallback:', err.message)
    );
  }, []);

  const goToHome = () => setPage('home');
  const goToNavigation = () => setPage('navigate');
  const goToNavigate = () => setPage('navigate');
  const goToMap = () => setPage('map');
  const goToAbout = () => setPage('about');
  const goToGuide = () => setPage('guide');

  // Emergency Siren Sound Effect
  useEffect(() => {
    let audioCtx;
    let oscillator;
    let gainNode;
    let interval;

    if (globalEmergency) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.value = 400; // Start freq

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Keep volume reasonable (0.1 is usually good for a piercing square wave)
      gainNode.gain.value = 0.05;

      oscillator.start();

      let up = true;
      interval = setInterval(() => {
        if (audioCtx.state === 'running') {
          oscillator.frequency.setValueAtTime(up ? 800 : 400, audioCtx.currentTime);
          up = !up;
        }
      }, 500); // toggle every 500ms
    }

    return () => {
      if (interval) clearInterval(interval);
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      if (gainNode) gainNode.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [globalEmergency]);

  return (
    <div className="App">
      {/* Global navbar — hidden on navigate page so AR can use full screen */}
      {page !== 'navigate' && (
        <header className="navbar glass-panel">
          <div className="container nav-content">

            <div className="nav-logo">
              <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>SafeNav</span>
            </div>

            <div className="nav-links">
              <span className={`nav-link ${page === 'home' ? 'active' : ''}`} onClick={goToHome}>Home</span>
              <span className={`nav-link ${(page === 'navigate' || page === 'map') ? 'active' : ''}`} onClick={goToMap}>Navigation</span>
              <span className={`nav-link ${page === 'guide' ? 'active' : ''}`} onClick={goToGuide}>How to Use</span>
              <span className={`nav-link ${page === 'about' ? 'active' : ''}`} onClick={goToAbout}>About</span>
            </div>

            <div className="nav-actions">
              <button
                className={`btn ${globalEmergency ? "btn-secondary" : "btn-danger"} nav-simulate-btn`}
                onClick={() => {
                  if (globalEmergency) {
                    setGlobalEmergency(false);
                  } else {
                    setGlobalEmergency(true);
                    if (page !== 'navigate') setPage('navigate');
                  }
                }}
              >
                {globalEmergency ? "Cancel Alert" : "Simulate Alert"}
              </button>
            </div>
          </div>
        </header>
      )}

      {page === 'home' && (
        <HomePage onScan={goToNavigation} onMap={goToMap} onNavigate={goToNavigate} onAbout={goToAbout} onHome={goToHome} />
      )}
      {page === 'navigate' && (
        <NavigatePage
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
          destination={destination}
          setDestination={setDestination}
          onBack={goToHome}
          onMapView={goToMap}
          globalEmergency={globalEmergency}
          setGlobalEmergency={setGlobalEmergency}
        />
      )}
      {page === 'map' && (
        <MapPage
          key={`map-${currentLocation?.name || 'none'}-${destination?.name || 'none'}`}
          onBack={goToNavigate}
          onNavigate={() => goToNavigation()}
          hasLocation={!!currentLocation}
          currentLocation={currentLocation}
          destination={destination}
        />
      )}
      {page === 'guide' && <GuidePage onBack={goToHome} />}
      {page === 'about' && <AboutPage onBack={goToHome} />}
    </div>
  );
}

export default App;
