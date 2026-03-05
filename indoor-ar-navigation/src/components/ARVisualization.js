import React, { useEffect, useRef, useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { getLocationNames, getGraph } from '../data/indoorMap';
import {
  initARThreeScene,
  startARLoop,
  destroyARThreeScene,
} from './ARThreeScene';
import StepDetector from '../logic/stepDetector';
import './ARVisualization.css';

/**
 * ARVisualization — Google-Maps-style AR overlay component.
 *
 * Features:
 *  - Live camera feed as background
 *  - Three.js floor-plane arrow + path trail (ARThreeScene.js)
 *  - Smooth compass heading (low-pass filter applied in ARThreeScene)
 *  - Accelerometer step detection → auto-advance waypoints
 *  - Smart heading estimation from sign detection
 *  - Tesseract.js OCR for room sign scanning
 *  - 2D canvas map fallback (viewMode='2d')
 */
function ARVisualization({
  currentLocation,
  destination,
  route,
  onLocationFound,
  onWaypointAdvance,   // NEW: callback when step detection auto-advances
  isEmergency,
  active = false,
  scanningOnly = false,
  viewMode = 'ar',
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const threeInitRef = useRef(false);
  const stepDetectorRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [heading, setHeading] = useState(0);
  const [detectedText, setDetectedText] = useState('');
  const [stepInfo, setStepInfo] = useState({ steps: 0, distance: 0 });

  // Stable refs for Three.js loop callbacks
  const headingRef = useRef(0);
  const routeRef = useRef(null);
  const destinationRef = useRef(null);
  const isEmergencyRef = useRef(false);

  useEffect(() => { headingRef.current = heading; }, [heading]);
  useEffect(() => { routeRef.current = route; }, [route]);
  useEffect(() => { destinationRef.current = destination; }, [destination]);
  useEffect(() => { isEmergencyRef.current = isEmergency; }, [isEmergency]);

  // Track distance walked since last waypoint advance
  const distanceSinceAdvanceRef = useRef(0);
  const lastStepDistRef = useRef(0);

  // ─── Step Detection — auto-advance waypoints ──────────────────────────────
  useEffect(() => {
    if (!active || !route?.waypoints || route.waypoints.length < 2) return;

    const detector = new StepDetector();
    stepDetectorRef.current = detector;
    distanceSinceAdvanceRef.current = 0;
    lastStepDistRef.current = 0;

    detector.start(({ totalDistance }) => {
      const stepDelta = totalDistance - lastStepDistRef.current;
      lastStepDistRef.current = totalDistance;
      distanceSinceAdvanceRef.current += stepDelta;

      setStepInfo({ steps: detector.stepCount, distance: totalDistance });

      // Calculate distance to next waypoint from current position
      if (route?.waypoints?.length >= 2) {
        const wp0 = route.waypoints[0];
        const wp1 = route.waypoints[1];
        const waypointDist = Math.sqrt(
          (wp1.x - wp0.x) ** 2 + (wp1.y - wp0.y) ** 2
        );

        // Auto-advance when walked ~80% of the distance to the next waypoint
        // (Using 80% because step detection isn't perfectly accurate)
        if (distanceSinceAdvanceRef.current >= waypointDist * 0.8) {
          distanceSinceAdvanceRef.current = 0;
          if (onWaypointAdvance) {
            onWaypointAdvance();
          }
        }
      }
    });

    return () => {
      detector.stop();
      stepDetectorRef.current = null;
    };
  }, [active, route, onWaypointAdvance]);

  // ─── Smart heading from sign detection ─────────────────────────────────────
  // When OCR detects a sign, we know the user is FACING the wall with the sign.
  // Using the sign's position on the floor plan, we estimate which cardinal
  // direction the user is facing (perpendicular to the wall).
  const estimateHeadingFromSign = useCallback((location) => {
    if (!location) return null;
    // Signs are typically on walls. Based on the floor plan layout,
    // rooms on the west side have signs facing east (toward corridor),
    // rooms on the east side face west, etc.
    // This gives us a rough heading when compass data is unreliable.
    const { x, y } = location;
    if (x < 20) return 90;    // West wing rooms — user faces east
    if (x > 40) return 270;   // East wing rooms — user faces west
    if (y < 15) return 180;   // North rooms — user faces south (toward corridor)
    if (y > 35) return 0;     // South rooms — user faces north
    return null;
  }, []);

  // ─── Camera startup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    let stream = null;
    const videoEl = videoRef.current;

    const startCamera = async () => {
      const attempts = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'environment' } },
        { video: true },
      ];

      let lastErr = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastErr = err;
          console.warn('Camera attempt failed:', err.name, err.message);
          stream = null;
        }
      }

      if (stream && videoEl) {
        videoEl.srcObject = stream;
        try { await videoEl.play(); } catch (e) { console.warn('video.play() failed:', e.message); }
        setCameraActive(true);
        setCameraError('');
      } else {
        const msg = lastErr ? `${lastErr.name}: ${lastErr.message}` : 'Camera unavailable';
        console.error('All camera attempts failed:', msg);
        setCameraActive(false);
        setCameraError(msg);
      }
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('getUserMedia not supported — use HTTPS and Chrome/Firefox');
      return;
    }

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoEl) { videoEl.pause(); videoEl.srcObject = null; }
      setCameraActive(false);
    };
  }, [active]);

  // ─── Device orientation / compass ─────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    let fallback;

    const handleOrientation = (e) => {
      if (e.alpha !== null && typeof e.alpha === 'number') {
        const h = (360 - e.alpha + 360) % 360;
        setHeading(h);
        headingRef.current = h;
        if (fallback) { clearInterval(fallback); fallback = null; }
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);

    // Slow rotation fallback for desktop testing
    fallback = setInterval(() => {
      setHeading(h => {
        const next = (h + 0.5) % 360;
        headingRef.current = next;
        return next;
      });
    }, 50);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (fallback) clearInterval(fallback);
    };
  }, [active]);

  // ─── Three.js AR scene ────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || viewMode !== 'ar' || scanningOnly) {
      if (threeInitRef.current) {
        destroyARThreeScene();
        threeInitRef.current = false;
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    initARThreeScene(container);
    threeInitRef.current = true;

    startARLoop(
      () => headingRef.current,
      () => routeRef.current,
      () => destinationRef.current,
      () => isEmergencyRef.current,
    );

    return () => {
      destroyARThreeScene();
      threeInitRef.current = false;
    };
  }, [active, viewMode, scanningOnly]);

  // ─── OCR scanning loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || !cameraActive || currentLocation) return;

    let isScanning = false;
    const locations = getLocationNames();
    const allKeywords = locations.map(l => l.name.toLowerCase().split(' ')).flat().filter(w => w.length > 2);
    allKeywords.push('hod');

    const scanInterval = setInterval(async () => {
      if (isScanning || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;
      isScanning = true;

      try {
        const video = videoRef.current;
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        const cropW = Math.floor(vw * 0.60);
        const cropH = Math.floor(vh * 0.55);
        const cropX = Math.floor((vw - cropW) / 2);
        const cropY = Math.floor((vh - cropH) / 2);

        const targetW = 600;
        const targetH = Math.floor(cropH * (targetW / cropW));

        const tc = document.createElement('canvas');
        tc.width = targetW;
        tc.height = targetH;
        const tCtx = tc.getContext('2d');

        tCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

        const imgData = tCtx.getImageData(0, 0, targetW, targetH);
        const d = imgData.data;
        const contrastFactor = 2.2;
        const brightnessBump = 15;

        for (let i = 0; i < d.length; i += 4) {
          let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          gray = Math.min(255, gray + brightnessBump);
          let contrast = ((gray - 128) * contrastFactor) + 128;
          contrast = Math.max(0, Math.min(255, contrast));
          d[i] = d[i + 1] = d[i + 2] = contrast;
        }
        tCtx.putImageData(imgData, 0, 0);

        const { data: { text } } = await Tesseract.recognize(tc, 'eng', {
          logger: () => { },
          tessedit_pageseg_mode: '6',
          tessedit_char_whitelist:
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ()-.',
        });

        const rawText = text.toLowerCase().trim();
        const rawTextClean = rawText.replace(/[^a-z0-9]/gi, '');
        const displaySafe = rawText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/gi, '').trim();

        const hasValidKeyword = allKeywords.some(kw => rawTextClean.includes(kw));
        if (rawTextClean.length > 4 && displaySafe.length > 4 && hasValidKeyword) {
          setDetectedText(displaySafe.substring(0, 30));
        } else {
          setDetectedText('');
        }

        let bestMatch = null;
        let highestScore = 0;
        for (const loc of locations) {
          let score = 0;
          if (rawText.includes(loc.id.replace(/_/g, ' '))) score += 100;
          const nameKws = loc.name.toLowerCase().split(' ').filter(w => w.length > 4);
          for (const kw of nameKws) {
            if (rawText.includes(kw)) score += 10;
            else if (kw.length > 4 && rawTextClean.includes(kw.substring(0, 4))) score += 5;
          }
          if (loc.id === 'mech_hod' && (rawTextClean.includes('mechhod') || rawTextClean.includes('hod')) && !rawTextClean.includes('ai')) score += 50;
          if (loc.id === 'ai_hod' && (rawTextClean.includes('aihod') || (rawTextClean.includes('ai') && rawTextClean.includes('hod')))) score += 50;
          if (score > highestScore) { highestScore = score; bestMatch = loc; }
        }

        if (bestMatch && highestScore >= 5 && onLocationFound) {
          // Estimate initial heading from which wall the sign is on
          const estimatedHeading = estimateHeadingFromSign(bestMatch);
          if (estimatedHeading !== null) {
            setHeading(estimatedHeading);
            headingRef.current = estimatedHeading;
          }
          onLocationFound(bestMatch);
        }

      } catch (e) {
        console.error(e);
      } finally {
        isScanning = false;
      }
    }, 700);

    return () => clearInterval(scanInterval);
  }, [active, cameraActive, currentLocation, onLocationFound, estimateHeadingFromSign]);

  // ─── 2D canvas draw loop ──────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (viewMode === '2d') {
      draw2DMap(ctx, W, H, currentLocation, destination, route, isEmergency);
    } else if (!scanningOnly && currentLocation && !destination) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      roundRect(ctx, W / 2 - 150, H / 2 - 40, 300, 80, 12);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📍 ' + currentLocation.name, W / 2, H / 2 - 8);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Arial';
      ctx.fillText('Select a destination to navigate', W / 2, H / 2 + 18);
    }

    // Compass HUD
    if (viewMode === 'ar' && !scanningOnly) {
      drawCompassHUD(ctx, W, H, heading, cameraActive);
    }

    animRef.current = requestAnimationFrame(drawLoop);
  }, [currentLocation, destination, route, heading, isEmergency, viewMode, scanningOnly, cameraActive]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawLoop]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="ar-visualization" ref={containerRef}>
      {/* Live camera feed */}
      <video
        ref={videoRef}
        className="ar-video"
        autoPlay
        playsInline
        muted
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        onCanPlay={(e) => { e.target.play().catch(() => { }); }}
        style={{ display: cameraActive ? 'block' : 'none' }}
      />

      {/* Dark background when no camera */}
      {!cameraActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, #0d1b2a 0%, #050a10 100%)',
        }} />
      )}

      {/* 2D canvas overlay */}
      <canvas ref={canvasRef} className="ar-canvas" />

      {/* Camera error message */}
      {cameraError && !cameraActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 10,
          background: 'rgba(0,0,0,0.92)', borderRadius: '16px',
          padding: '1.25rem 1.5rem', textAlign: 'center',
          border: '1px solid rgba(245,158,11,0.4)',
          maxWidth: '85vw',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
          <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
            Camera blocked
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '12px', wordBreak: 'break-word' }}>
            {cameraError}
          </div>
          <div style={{ color: '#64748b', fontSize: '10px', lineHeight: 1.6 }}>
            Make sure you:<br />
            1. Opened <b style={{ color: '#38bdf8' }}>https://</b> (not http://)<br />
            2. Tapped &quot;Allow&quot; for camera<br />
            3. Accepted the SSL warning
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '12px', background: '#f59e0b', color: '#000',
              border: 'none', borderRadius: '8px', padding: '8px 20px',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
            }}
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* Scanning frame overlay */}
      {!currentLocation && cameraActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -55%)',
          width: 'min(75vw, 280px)', height: 'min(45vw, 160px)',
          border: '2px solid rgba(16,185,129,0.5)',
          borderRadius: '16px',
          boxShadow: '0 0 30px rgba(16,185,129,0.2), inset 0 0 20px rgba(16,185,129,0.1)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: '14px', pointerEvents: 'none', zIndex: 10,
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.88)', padding: '8px 18px',
            borderRadius: '12px', border: '1px solid rgba(16,185,129,0.5)',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scan Room Sign
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>
              {detectedText ? `"${detectedText}"` : 'Scanning...'}
            </p>
          </div>
        </div>
      )}

      {/* AR mode badge + step counter */}
      {viewMode === 'ar' && !scanningOnly && currentLocation && destination && (
        <div style={{
          position: 'absolute', top: '16px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          border: `1px solid ${isEmergency ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.4)'}`,
          borderRadius: '20px',
          padding: '6px 16px',
          color: isEmergency ? '#fca5a5' : '#38bdf8',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          zIndex: 20,
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isEmergency ? '#ef4444' : '#38bdf8',
            boxShadow: `0 0 8px ${isEmergency ? '#ef4444' : '#38bdf8'}`,
            display: 'inline-block',
            animation: 'pulse 1.5s infinite',
          }} />
          AR Navigation
          {stepInfo.steps > 0 && (
            <span style={{
              color: '#94a3b8', fontSize: '10px', fontWeight: '400',
              borderLeft: '1px solid rgba(255,255,255,0.2)',
              paddingLeft: '8px',
            }}>
              🚶 {stepInfo.steps} steps • {stepInfo.distance.toFixed(1)}m
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: 2D top-down minimap
// ──────────────────────────────────────────────────────────────────────────────
function draw2DMap(ctx, W, H, currentLocation, destination, route, isEmergency) {
  const graph = getGraph();
  const nodes = graph.getAllNodes();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const padding = 40;
  const scaleX = (W - padding * 2) / (maxX - minX || 1);
  const scaleY = (H - padding * 2) / (maxY - minY || 1);
  const scale = Math.min(scaleX, scaleY);

  const toScreen = (x, y) => ({
    sx: padding + (x - minX) * scale,
    sy: padding + (y - minY) * scale,
  });

  ctx.fillStyle = 'rgba(11,15,25,0.95)';
  ctx.fillRect(0, 0, W, H);

  for (const node of nodes) {
    const neighbors = graph.getNeighbors(node.id);
    if (!neighbors || neighbors.length === 0) continue;
    for (const { to } of neighbors) {
      const nb = nodes.find(n => n.id === to);
      if (!nb) continue;
      const a = toScreen(node.x, node.y);
      const b = toScreen(nb.x, nb.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  }

  if (route?.path && route.path.length > 1) {
    const pathColor = isEmergency ? '#ef4444' : '#3b82f6';
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 5;
    ctx.shadowColor = pathColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    let started = false;
    for (const id of route.path) {
      const n = nodes.find(x => x.id === id);
      if (!n) continue;
      const { sx, sy } = toScreen(n.x, n.y);
      if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  for (const node of nodes) {
    const { sx, sy } = toScreen(node.x, node.y);
    const isExit = node.isExit;

    ctx.fillStyle = isExit ? '#f59e0b' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(sx, sy, isExit ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(node.name.split(' ')[0], sx, sy - 8);
  }

  if (currentLocation) {
    const { sx, sy } = toScreen(currentLocation.x, currentLocation.y);
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', sx, sy + 4);
  }

  if (destination) {
    const { sx, sy } = toScreen(destination.x ?? 0, destination.y ?? 0);
    const destColor = isEmergency ? '#ef4444' : '#f59e0b';
    ctx.fillStyle = destColor;
    ctx.shadowColor = destColor;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DEST', sx, sy + 4);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('2D Map View', 12, 20);
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: compass HUD
// ──────────────────────────────────────────────────────────────────────────────
function drawCompassHUD(ctx, W, H, heading, cameraActive) {
  const cx = W - 55;
  const cy = H - 160;
  const r = 32;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, W - 100, H - 200, 90, 90, 10);
  ctx.fill();

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-heading * (Math.PI / 180));
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -(r - 8));
  ctx.fillStyle = '#fff';
  ctx.fillText('S', 0, r - 8);
  ctx.restore();

  ctx.fillStyle = cameraActive ? '#00ff00' : '#f59e0b';
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cameraActive ? '● CAM' : '● SIM', cx, H - 118);
  ctx.textBaseline = 'alphabetic';
}

// ──────────────────────────────────────────────────────────────────────────────
// Utility: rounded rectangle path
// ──────────────────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default ARVisualization;
