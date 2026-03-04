import React, { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { getLocationNames } from '../data/indoorMap';
import './QRLocalization.css';

function QRLocalization({ onLocalize }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('Initializing Scanner...');
  const [detectedText, setDetectedText] = useState('');

  useEffect(() => {
    let isMounted = true;
    let scanInterval;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });

        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          setStatusText('Scanning for Location Text...');
        }

        // Start scanning loop every 1.5 seconds to avoid overwhelming the browser
        scanInterval = setInterval(scanTextMarker, 1500);
      } catch (err) {
        if (isMounted) {
          setError('Unable to access camera: ' + err.message);
          setScanning(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scanInterval) clearInterval(scanInterval);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanning]);

  const handleDefaultLocation = (locId) => {
    const locs = getLocationNames();
    const loc = locs.find(l => l.id === locId);
    if (loc) {
      onLocalize(loc);
      setScanning(false);
    }
  };

  const scanTextMarker = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA || !scanning) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        logger: () => { } // suppress logs
      });

      const detectedRaw = text.toLowerCase().trim();

      // Update ui to show what it is picking up
      if (detectedRaw.length > 2) {
        setDetectedText(detectedRaw.substring(0, 40));
      }

      const locations = getLocationNames();

      for (const loc of locations) {
        // Create an array of keywords to match from the location name
        const nameKeywords = loc.name.toLowerCase().split(' ').filter(w => w.length > 2);

        // Let's do a simple fuzzy match: if multiple keywords of a room match the text, it's a hit.
        let matchCount = 0;
        for (const kw of nameKeywords) {
          if (detectedRaw.includes(kw)) matchCount++;
        }

        // if we match at least 60% of the keywords or an exact match of the ID
        const matchThreshold = Math.max(1, Math.floor(nameKeywords.length * 0.6));
        if (matchCount >= matchThreshold || detectedRaw.includes(loc.id)) {
          console.log(`Matched location: ${loc.name}`);
          onLocalize(loc);
          setScanning(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="qr-container">
      <video
        ref={videoRef}
        className="qr-video"
        autoPlay
        playsInline
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="qr-overlay">
        <div className="qr-frame"></div>
      </div>

      {error && <div className="qr-error">{error}</div>}
      {scanning && <div className="qr-scanning">{statusText}</div>}

      <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.8)' }}>
        <p style={{ marginBottom: '10px', fontSize: '12px', color: '#94a3b8' }}>Point camera at a room name sign (e.g. "Thermal Lab", "Lecture A")</p>

        <div style={{ padding: '8px', marginBottom: '15px', background: '#1e293b', borderRadius: '4px', border: '1px solid #334155' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#10b981', textTransform: 'uppercase' }}>Scanner Output Log:</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0', minHeight: '18px', wordBreak: 'break-all' }}>
            {detectedText ? `"${detectedText}"` : "Waiting for text..."}
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => handleDefaultLocation('left_stairs')}
        >
          Use Left Stairs (Default)
        </button>
      </div>
    </div>
  );
}

export default QRLocalization;
