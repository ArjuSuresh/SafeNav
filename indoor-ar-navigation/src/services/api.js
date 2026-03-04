/**
 * API Service — connects the React frontend to the FastAPI backend.
 *
 * All backend calls go through this file so the rest of the app
 * never deals with raw fetch / axios directly.
 *
 * Default backend URL: http://127.0.0.1:8000  (development)
 * For production, set REACT_APP_API_URL in your .env file.
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});


// ──────────────────────────────────────────────────
//  Locations
// ──────────────────────────────────────────────────

/** Fetch all navigable locations (rooms, labs, toilets, etc.) */
export async function fetchLocations() {
    const { data } = await api.get('/locations');
    return data; // Array of { id, name, x, y, type, is_exit }
}


// ──────────────────────────────────────────────────
//  Navigation / Pathfinding
// ──────────────────────────────────────────────────

/**
 * Request the backend to compute an optimal A* route.
 * @param {string} startId   — starting node ID
 * @param {string} destId    — destination node ID
 * @param {boolean} avoidCrowd — factor in crowd density? (default true)
 * @returns {object} { success, message, path, total_distance, estimated_time_seconds, instructions }
 */
export async function fetchRoute(startId, destId, avoidCrowd = true) {
    const { data } = await api.post('/navigate', {
        start: startId,
        destination: destId,
        avoid_crowd: avoidCrowd,
    });
    return data;
}


// ──────────────────────────────────────────────────
//  Emergency
// ──────────────────────────────────────────────────

/**
 * Request emergency evacuation route from the backend.
 * @param {string} currentLocationId
 * @param {string} hazardType — 'fire' | 'gas' | 'earthquake' | 'other'
 * @param {string|null} hazardLocation — node ID where the hazard is
 * @param {string[]} blockedPaths — list of blocked node IDs
 */
export async function fetchEmergencyRoute(
    currentLocationId,
    hazardType = 'fire',
    hazardLocation = null,
    blockedPaths = [],
) {
    const { data } = await api.post('/emergency', {
        current_location: currentLocationId,
        hazard_type: hazardType,
        hazard_location: hazardLocation,
        blocked_paths: blockedPaths,
    });
    return data;
}


// ──────────────────────────────────────────────────
//  Crowd Density
// ──────────────────────────────────────────────────

/** Fetch real-time crowd density for all zones + heatmap matrix. */
export async function fetchCrowdDensity() {
    const { data } = await api.get('/crowd-density');
    return data; // { timestamp, zones: [...], heatmap_matrix: [[...], ...] }
}


// ──────────────────────────────────────────────────
//  Markers
// ──────────────────────────────────────────────────

/** Look up a single AR marker by its scanned ID. */
export async function lookupMarker(markerId) {
    const { data } = await api.get(`/markers/${markerId}`);
    return data; // { marker_id, location_id, location_name, x, y }
}


// ──────────────────────────────────────────────────
//  Floor Map (full graph for frontend rendering)
// ──────────────────────────────────────────────────

/** Fetch the complete floor graph (all nodes + edges + markers). */
export async function fetchFloorMap() {
    const { data } = await api.get('/floor-map');
    return data;
}

export default api;
