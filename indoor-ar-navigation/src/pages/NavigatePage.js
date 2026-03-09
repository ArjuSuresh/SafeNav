import React, { useState, useEffect, useCallback } from 'react';
import ARVisualization from '../components/ARVisualization';
import { getRouteAsync, getEvacuationRouteAsync, getRoute, getEvacuationRoute } from '../logic/pathfinding';
import { getLocationNames, getLocationNamesAsync, getLocationById } from '../data/indoorMap';
import { MapPin, Target, ShieldAlert, Map, Home, CheckCircle, X, Check, TriangleAlert, RefreshCw, ScanSearch } from 'lucide-react';

const PHASE = {
  START: 'start',        // Intro screen with "Start Navigation" button
  SCANNING: 'scanning',  // Back camera live, scanning room markers
  DESTINATION: 'destination', // Location detected, pick destination
  AR: 'ar',              // Full AR navigation mode
};

function NavigatePage({
  currentLocation, setCurrentLocation,
  destination, setDestination,
  onBack, onMapView,
  globalEmergency, setGlobalEmergency,
}) {
  const [locations, setLocations] = useState([]);
  const [route, setRoute] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [instructions, setInstructions] = useState([]);
  // waypointIndex = index in route.path of the NEXT room to head toward
  // 0 = current location, 1 = first stop, path.length-1 = destination
  const [waypointIndex, setWaypointIndex] = useState(1);
  // Restore correct phase when returning from 2D Map
  const [phase, setPhase] = useState(() => {
    if (currentLocation && destination) return PHASE.AR;
    if (currentLocation) return PHASE.DESTINATION;
    return PHASE.SCANNING; // skip intro, go straight to camera
  });


  useEffect(() => { setIsEmergency(globalEmergency || false); }, [globalEmergency]);

  // Load locations from backend (async), fallback to local
  useEffect(() => {
    let cancelled = false;
    getLocationNamesAsync().then(locs => {
      if (!cancelled) setLocations(locs);
    }).catch(() => {
      if (!cancelled) setLocations(getLocationNames());
    });
    return () => { cancelled = true; };
  }, []);

  // When emergency triggers from global, jump to AR mode
  useEffect(() => {
    if (globalEmergency && phase !== PHASE.AR) setPhase(PHASE.AR);
  }, [globalEmergency, phase]);

  // Advance from scanning → destination once location is found
  useEffect(() => {
    if (currentLocation && phase === PHASE.SCANNING) {
      setPhase(PHASE.DESTINATION);
    }
  }, [currentLocation, phase]);

  // Calculate route whenever source / dest / emergency changes
  useEffect(() => {
    let cancelled = false;

    async function computeRoute() {
      if (isEmergency && currentLocation) {
        try {
          const r = await getEvacuationRouteAsync(currentLocation.id, 'fire');
          if (!cancelled) {
            setRoute(r);
            setInstructions(r.instructions || []);
            setWaypointIndex(1);
          }
        } catch {
          const r = getEvacuationRoute(currentLocation.id);
          if (!cancelled) { setRoute(r); setWaypointIndex(1); }
        }
      } else if (currentLocation && destination) {
        try {
          const r = await getRouteAsync(currentLocation.id, destination.id);
          if (!cancelled) {
            setRoute(r);
            setInstructions(r.instructions || []);
            setWaypointIndex(1);
          }
        } catch {
          const r = getRoute(currentLocation.id, destination.id);
          if (!cancelled) { setRoute(r); setWaypointIndex(1); }
        }
      }
    }

    computeRoute();
    return () => { cancelled = true; };
  }, [currentLocation, destination, isEmergency]);


  const handleLocationFound = (loc) => {
    if (!loc) return;
    if (phase === PHASE.SCANNING) {
      setCurrentLocation(loc);
      return;
    }
    // During AR navigation — if camera sees a room that's in the route path,
    // auto-advance the waypoint to the NEXT step after that room
    if (phase === PHASE.AR && route?.path) {
      const idxInPath = route.path.indexOf(loc.id);
      if (idxInPath >= 0) {
        const newIdx = Math.min(idxInPath + 1, route.path.length - 1);
        setWaypointIndex(newIdx);
        setCurrentLocation(loc);
      }
    }
  };

  // Auto-advance callback from step detector (accelerometer)
  const handleWaypointAdvance = useCallback(() => {
    setWaypointIndex(v => {
      const maxIdx = (route?.path?.length || 1) - 1;
      return Math.min(v + 1, maxIdx);
    });
  }, [route]);

  const handleSelectDestination = async (loc) => {
    setDestination(loc);
    const startId = currentLocation?.id || 'left_stairs';
    try {
      const r = await getRouteAsync(startId, loc.id);
      setRoute(r);
      setInstructions(r.instructions || []);
    } catch {
      setRoute(getRoute(startId, loc.id));
    }
    setPhase(PHASE.AR);
  };

  const handleEmergency = () => {
    if (setGlobalEmergency) setGlobalEmergency(true);
    setIsEmergency(true);
    if (phase !== PHASE.AR) setPhase(PHASE.AR);
  };

  const handleCancelEmergency = async () => {
    if (setGlobalEmergency) setGlobalEmergency(false);
    setIsEmergency(false);
    if (currentLocation && destination) {
      try {
        const r = await getRouteAsync(currentLocation.id, destination.id);
        setRoute(r);
        setInstructions(r.instructions || []);
      } catch {
        setRoute(getRoute(currentLocation.id, destination.id));
      }
    } else {
      setRoute(null);
      setInstructions([]);
    }
  };


  // ────────────────────────────────────────────────────────
  // PHASE: SCANNING — camera live, reading markers
  // ────────────────────────────────────────────────────────
  if (phase === PHASE.SCANNING) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <ARVisualization
          currentLocation={null}
          destination={null}
          route={null}
          onLocationFound={handleLocationFound}
          isEmergency={false}
          active={true}
          scanningOnly={true}
          viewMode="ar"
        />

        {/* Scanning status banner */}
        <div style={{
          position: 'absolute', top: '1.25rem', left: '50%',
          transform: 'translateX(-50%)', zIndex: 30, whiteSpace: 'nowrap',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
          borderRadius: '24px', padding: '0.6rem 1.5rem',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%',
            background: '#10b981', display: 'inline-block',
            animation: 'pulse-danger 1.5s infinite',
          }} />
          <ScanSearch size={16} /> Scanning room marker...
        </div>

        {/* Hint text */}
        <div style={{
          position: 'absolute', top: '5rem', left: '50%',
          transform: 'translateX(-50%)', zIndex: 30,
          color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem',
          textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          Point camera at a room name / door sign
        </div>

        {/* Cancel */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute', bottom: '2.5rem', left: '50%',
            transform: 'translateX(-50%)', zIndex: 30,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '24px', padding: '0.75rem 2.5rem',
            cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <X size={18} /> Cancel
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // PHASE: DESTINATION — location found, pick where to go
  // ────────────────────────────────────────────────────────
  if (phase === PHASE.DESTINATION) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
        {/* Live AR camera background */}
        <ARVisualization
          currentLocation={currentLocation}
          destination={null}
          route={null}
          onLocationFound={handleLocationFound}
          isEmergency={false}
          active={true}
          scanningOnly={false}
          viewMode="ar"
        />

        {/* Bottom sheet */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
          background: 'rgba(11, 15, 25, 0.97)', backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px 24px 0 0',
          padding: '1.75rem 1.5rem 2.25rem',
        }}>
          {/* Current location pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1.25rem', padding: '0.875rem 1rem',
            background: 'rgba(16,185,129,0.08)', borderRadius: '14px',
            border: '1px solid rgba(16,185,129,0.25)',
          }}>
            <MapPin size={24} color="#10b981" />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>You are here</div>
              <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1rem' }}>{currentLocation.name}</div>
            </div>
            <button
              onClick={() => { setCurrentLocation(null); setPhase(PHASE.SCANNING); }}
              style={{
                background: 'none', color: '#64748b',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                padding: '5px 12px', cursor: 'pointer', fontSize: '12px',
              }}
            >
              Rescan
            </button>
          </div>

          <label style={{
            color: '#94a3b8', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem', fontWeight: '500',
          }}>
            <Target size={16} /> Where do you want to go?
          </label>

          <select
            style={{
              width: '100%', padding: '0.9rem 1rem', borderRadius: '14px',
              background: '#1e293b', color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '1rem', marginBottom: '1rem', cursor: 'pointer',
              appearance: 'none', WebkitAppearance: 'none',
            }}
            value=""
            onChange={(e) => {
              const loc = locations.find(l => l.id === e.target.value);
              if (loc) handleSelectDestination(loc);
            }}
          >
            <option value="">— Select a destination —</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          <button
            className="btn btn-danger"
            style={{ width: '100%', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={handleEmergency}
          >
            <ShieldAlert size={18} /> Emergency Exit
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // PHASE: AR — full navigation view
  // ────────────────────────────────────────────────────────
  const path = route?.path || [];
  const totalSteps = Math.max(path.length - 1, 1);
  const safeWpIdx = Math.min(waypointIndex, path.length - 1);
  const nextWaypointId = path[safeWpIdx];
  const nextWaypoint = nextWaypointId ? getLocationById(nextWaypointId) : null;
  const isLastStep = safeWpIdx >= path.length - 1;
  const hasArrived = isLastStep && path.length > 1;

  // Arrow points to NEXT WAYPOINT in path, not straight to final destination
  const arrowTarget = isEmergency
    ? { name: 'EMERGENCY EXIT', id: path[path.length - 1], x: 0, y: 0 }
    : (nextWaypoint || destination);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <ARVisualization
        currentLocation={currentLocation}
        destination={arrowTarget}
        route={route}
        onLocationFound={handleLocationFound}
        onWaypointAdvance={handleWaypointAdvance}
        isEmergency={isEmergency}
        active={true}
        scanningOnly={false}
        viewMode="ar"
      />

      {/* ── Top HUD bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '12px', padding: '8px 16px',
            cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <Home size={16} /> Home
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Open the existing 2D map page */}
          <button
            onClick={onMapView}
            style={{
              background: 'rgba(59,130,246,0.85)', backdropFilter: 'blur(12px)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px', padding: '8px 14px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Map size={16} /> 2D Map
          </button>
        </div>
      </div>

      {/* ── Emergency banner ── */}
      {isEmergency && (
        <div style={{
          position: 'absolute', top: '4rem', left: '1rem', right: '1rem', zIndex: 30,
          background: '#ef4444', color: 'white', padding: '12px', borderRadius: '12px',
          textAlign: 'center', fontWeight: 'bold', animation: 'pulse-danger 1.5s infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <TriangleAlert size={20} /> EMERGENCY — Follow AR arrow to nearest Exit
        </div>
      )}

      {/* ── Turn-by-turn instructions panel ── */}
      {instructions.length > 0 && !hasArrived && (
        <div style={{
          position: 'absolute', top: isEmergency ? '7.5rem' : '4rem',
          left: '1rem', right: '1rem', zIndex: 25,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
          borderRadius: '14px', padding: '0.75rem 1rem',
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '120px', overflowY: 'auto',
        }}>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>
            Navigation Steps
          </div>
          {instructions.slice(0, 4).map((inst, idx) => (
            <div key={idx} style={{
              color: idx === 0 ? '#10b981' : '#cbd5e1',
              fontSize: '0.78rem',
              padding: '2px 0',
              opacity: idx === 0 ? 1 : 0.7,
            }}>
              {inst}
            </div>
          ))}
          {instructions.length > 4 && (
            <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '2px' }}>
              +{instructions.length - 4} more steps...
            </div>
          )}
        </div>
      )}

      {/* ── Bottom info / action bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent 100%)',
        padding: '1.5rem 1.5rem 2rem',
      }}>

        {/* Arrived banner */}
        {hasArrived && (
          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '14px', padding: '0.875rem 1rem',
            marginBottom: '0.875rem', textAlign: 'center',
          }}>
            <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <CheckCircle size={20} /> You have arrived!
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>{destination?.name}</div>
          </div>
        )}

        {/* Step counter + next room */}
        {!hasArrived && nextWaypoint && (
          <div style={{
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '14px', padding: '0.75rem 1rem',
            marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step {safeWpIdx} of {totalSteps}
              </div>
              <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '1rem', marginTop: '2px' }}>
                → Head to: {nextWaypoint.name}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 }}>
                {route?.distance ? route.distance.toFixed(0) : '—'}m
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                {route?.estimatedTime ? `~${Math.round(route.estimatedTime)}s` : 'total'}
              </div>
            </div>
          </div>
        )}

        {/* Final destination label */}
        <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Target size={14} /> Destination: <span style={{ color: '#fff' }}>{destination?.name || arrowTarget?.name}</span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {isEmergency ? (
            <button className="btn btn-secondary" onClick={handleCancelEmergency} style={{ flex: 1 }}>
              Cancel Emergency
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleEmergency} style={{ flex: 1, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <ShieldAlert size={16} /> Emergency
            </button>
          )}

          {/* Manual advance button — tap when you physically reach the waypoint */}
          {!hasArrived && !isEmergency && (
            <button
              onClick={() => setWaypointIndex(v => Math.min(v + 1, path.length - 1))}
              style={{
                background: 'rgba(16,185,129,0.2)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px',
                padding: '0.75rem 0.875rem', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <Check size={16} /> Skip
            </button>
          )}

          <button
            onClick={() => setPhase(PHASE.DESTINATION)}
            style={{
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px',
              padding: '0.75rem 0.875rem', cursor: 'pointer',
              fontSize: '0.8rem', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <RefreshCw size={14} /> Change
          </button>
        </div>
      </div>
    </div>
  );
}

export default NavigatePage;
