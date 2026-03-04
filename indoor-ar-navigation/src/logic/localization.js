/**
 * Localization Module
 * Inspired by ARIndoorNav's OCR marker detection
 * 
 * Instead of OCR from room plates, we use QR codes
 * QR Code carries JSON with location data
 */

/**
 * Parse QR data to get user location
 * QR Format: {"id":"location_id","name":"Location Name","x":0,"y":50}
 */
export function parseQRLocation(qrData) {
  try {
    const locationData = JSON.parse(qrData);
    
    // Validate required fields
    if (!locationData.id || locationData.x === undefined || locationData.y === undefined) {
      throw new Error('Invalid location data format');
    }

    return {
      id: locationData.id,
      name: locationData.name || 'Unknown Location',
      x: locationData.x,
      y: locationData.y,
      isExit: locationData.isExit || false,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('QR parsing error:', error);
    return null;
  }
}

/**
 * Verify location exists in building graph
 */
export function validateLocation(location, graph) {
  if (!location || !graph) return false;

  const graphLocation = graph.getNode(location.id);
  if (!graphLocation) {
    console.warn(`Location ${location.id} not found in building map`);
    return false;
  }

  return true;
}

/**
 * Get user's current pose (position + orientation)
 * In real implementation, this would come from device orientation/compass
 */
export function getUserPose(location) {
  return {
    position: {
      x: location.x,
      y: location.y
    },
    orientation: {
      heading: 0, // Would be from device compass
      accuracy: 20 // meters
    },
    confidence: 0.95,
    timestamp: Date.now()
  };
}

/**
 * Handle re-localization if user scans another QR code
 * This helps correct drift and improve accuracy
 */
export function updateLocalization(currentLocation, newLocation) {
  return {
    previous: currentLocation,
    current: newLocation,
    driftCorrection: {
      x: currentLocation.x - newLocation.x,
      y: currentLocation.y - newLocation.y
    },
    timestamp: Date.now()
  };
}

/**
 * Check if user is near a transition point (stairs, elevators)
 */
export function checkTransitionPoints(location, graph) {
  const node = graph.getNode(location.id);
  if (!node) return null;

  // Check if location is marked as transition
  return {
    isTransition: node.isTransition || false,
    type: node.transitionType || null, // 'stairs', 'elevator', etc.
    connectedFloor: node.connectedFloor || null
  };
}
