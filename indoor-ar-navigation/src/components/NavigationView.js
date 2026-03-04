import React, { useState, useEffect } from 'react';
import { getRoute } from '../logic/pathfinding';
import { getLocationNames } from '../data/indoorMap';
import FloorPlan from './FloorPlan';
import './NavigationView.css';

function NavigationView({ currentLocation, destination, setDestination, onEmergency }) {
  const [route, setRoute] = useState(null);
  const [locations, setLocations] = useState([]);
  const [showDestinations, setShowDestinations] = useState(false);

  useEffect(() => {
    const locs = getLocationNames();
    setLocations(locs);
  }, []);

  useEffect(() => {
    if (currentLocation && destination) {
      const calculatedRoute = getRoute(currentLocation.id, destination.id);
      setRoute(calculatedRoute);
    }
  }, [currentLocation, destination]);

  const handleSelectDestination = (loc) => {
    setDestination(loc);
    setShowDestinations(false);
  };

  return (
    <div className="navigation-panel">
      <div className="nav-header">
        <button className="emergency-btn" onClick={onEmergency}>
          🚨 Emergency
        </button>
      </div>

      <div className="nav-info">
        <div className="location-item">
          <span className="label">Current:</span>
          <span className="value">{currentLocation?.name || 'Unknown'}</span>
        </div>
        {destination && (
          <div className="location-item">
            <span className="label">Destination:</span>
            <span className="value">{destination.name}</span>
          </div>
        )}
      </div>

      <div className="destination-selector">
        <button 
          className="select-destination-btn"
          onClick={() => setShowDestinations(!showDestinations)}
        >
          {destination ? 'Change Destination' : 'Select Destination'} ▼
        </button>

        {showDestinations && (
          <div className="destination-list">
            {locations.map((loc) => (
              <button
                key={loc.id}
                className="destination-option"
                onClick={() => handleSelectDestination(loc)}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {route && (
        <div className="route-info">
          <h3>Route</h3>
          <div className="distance">Distance: {route.distance.toFixed(1)}m</div>
          <div className="steps">
            <h4>Directions:</h4>
            <ol>
              {route.path.map((nodeId, idx) => (
                <li key={idx}>{nodeId}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <FloorPlan currentLocation={currentLocation} destination={destination} route={route} />
    </div>
  );
}

export default NavigationView;
