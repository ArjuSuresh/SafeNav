import Graph from '../logic/graph';
import { fetchLocations, fetchFloorMap } from '../services/api';

let indoorMap = null;
let cachedLocations = null;   // flat array from backend
let backendReady = false;     // tracks whether backend data has loaded

/**
 * Initialize the indoor map graph with SRI ABHINAVA VIDYATIRTHA BLOCK layout.
 * Tries the backend first; falls back to a hardcoded local graph if the
 * backend is unreachable (e.g. offline use).
 */
async function initializeMapFromBackend() {
  try {
    const floorData = await fetchFloorMap();
    const graph = new Graph();

    // Add all nodes (rooms + corridors)
    for (const loc of floorData.locations) {
      graph.addNode(loc.id, {
        name: loc.name,
        x: loc.x,
        y: loc.y,
        type: loc.type,
        isExit: loc.is_exit,
      });
    }

    // Add all edges — compute distance from coordinates
    for (const edge of floorData.edges) {
      const a = floorData.locations.find(l => l.id === edge.from);
      const b = floorData.locations.find(l => l.id === edge.to);
      if (a && b) {
        const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
        graph.addEdge(edge.from, edge.to, Math.round(dist * 100) / 100);
      }
    }

    indoorMap = graph;
    backendReady = true;
    console.log('✅ Indoor map loaded from backend');
    return graph;
  } catch (err) {
    console.warn('⚠️ Backend unreachable, using local map:', err.message);
    return initializeLocalMap();
  }
}

/**
 * Hardcoded fallback graph (original data from the repo).
 * Used when the backend is not available.
 */
function initializeLocalMap() {
  const graph = new Graph();

  const locations = [
    { id: 'left_stairs', name: 'Left Stairs', x: 20, y: 100, isExit: true },
    { id: 'right_stairs', name: 'Right Stairs', x: 80, y: 100, isExit: true },
    { id: 'stairs_right_side', name: 'Stairs (Right Side)', x: 160, y: 80, isExit: true },
    { id: 'thermal_lab', name: 'Thermal Engineering Lab II', x: 30, y: 20 },
    { id: 'machine_tools_lab', name: 'Machine Tools Lab II', x: 30, y: 50 },
    { id: 'mech_faculty', name: 'Mech Faculty Room', x: 30, y: 80 },
    { id: 'lecture_a', name: 'Lecture Hall A', x: 80, y: 20 },
    { id: 'lecture_b', name: 'Lecture Hall B', x: 80, y: 50 },
    { id: 'lecture_c', name: 'Lecture Hall C', x: 150, y: 20 },
    { id: 'lecture_d', name: 'Lecture Hall D', x: 150, y: 50 },
    { id: 'faculty_center', name: 'Faculty Center', x: 55, y: 70 },
    { id: 'faculty_room', name: 'Faculty Room', x: 150, y: 110 },
    { id: 'mech_hod', name: 'Mech HOD', x: 25, y: 140 },
    { id: 'ai_hod', name: 'AI HOD', x: 85, y: 140 },
    { id: 'main_hall', name: 'Main Hall', x: 15, y: 70 },
    { id: 'right_hall', name: 'Right Hall', x: 130, y: 70 },
    { id: 'girls_toilet', name: 'Girls Toilet', x: 5, y: 115 },
    { id: 'boys_toilet_center', name: 'Boys Toilet (Center)', x: 90, y: 115 },
    { id: 'boys_toilet_north', name: 'Boys Toilet (North)', x: 145, y: 15 },
  ];

  locations.forEach(loc => graph.addNode(loc.id, loc));

  // Topology only — which rooms are connected by walkable corridors.
  // Distances are computed from node coordinates (Euclidean), matching
  // the approach used by the backend and the A* heuristic.
  const connections = [
    ['left_stairs', 'thermal_lab'],
    ['left_stairs', 'machine_tools_lab'],
    ['thermal_lab', 'machine_tools_lab'],
    ['machine_tools_lab', 'mech_faculty'],
    ['mech_faculty', 'mech_hod'],
    ['machine_tools_lab', 'main_hall'],
    ['main_hall', 'faculty_center'],
    ['mech_faculty', 'left_stairs'],
    ['left_stairs', 'right_stairs'],
    ['faculty_center', 'lecture_a'],
    ['lecture_a', 'lecture_b'],
    ['lecture_b', 'faculty_center'],
    ['right_stairs', 'lecture_b'],
    ['left_stairs', 'mech_hod'],
    ['right_stairs', 'ai_hod'],
    ['lecture_b', 'right_hall'],
    ['right_hall', 'lecture_c'],
    ['lecture_c', 'lecture_d'],
    ['lecture_d', 'stairs_right_side'],
    ['stairs_right_side', 'faculty_room'],
    ['mech_hod', 'ai_hod'],
    ['ai_hod', 'right_stairs'],
    ['girls_toilet', 'main_hall'],
    ['girls_toilet', 'left_stairs'],
    ['boys_toilet_center', 'right_stairs'],
    ['boys_toilet_center', 'ai_hod'],
    ['boys_toilet_north', 'right_hall'],
    ['boys_toilet_north', 'lecture_c'],
  ];

  // Compute distance from coordinates — consistent with A* heuristic
  connections.forEach(([from, to]) => {
    const a = locations.find(l => l.id === from);
    const b = locations.find(l => l.id === to);
    if (a && b) {
      const dist = Math.round(Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) * 100) / 100;
      graph.addEdge(from, to, dist);
    }
  });

  indoorMap = graph;
  return graph;
}


// ═══════════════════════════════════════════════════════════════
//  Public API — consumed by the rest of the frontend
// ═══════════════════════════════════════════════════════════════

/**
 * Get the indoor map graph (sync for compatibility with existing code).
 * Call `loadMapFromBackend()` first on app startup to populate it from the API.
 */
export function getGraph() {
  if (!indoorMap) {
    // Synchronous fallback — local graph
    indoorMap = initializeLocalMap();
  }
  return indoorMap;
}

/**
 * Async loader — call this once on app startup (e.g. in App.js useEffect).
 * Populates the graph from the backend.
 */
export async function loadMapFromBackend() {
  return initializeMapFromBackend();
}

/**
 * Whether the backend graph is loaded.
 */
export function isBackendLoaded() {
  return backendReady;
}

/**
 * Get all locations for the destination dropdown.
 * If the backend has been loaded, fetches fresh data from the API.
 * Otherwise, falls back to the local graph.
 */
export async function getLocationNamesAsync() {
  try {
    const locs = await fetchLocations();
    cachedLocations = locs;
    return locs;
  } catch {
    return getLocationNamesLocal();
  }
}

/**
 * Sync version — returns cached backend locations or falls back to local graph.
 */
export function getLocationNames() {
  if (cachedLocations) return cachedLocations;
  return getLocationNamesLocal();
}

function getLocationNamesLocal() {
  const graph = getGraph();
  return graph.getAllNodes().filter(node =>
    !node.id.includes('corridor') && !node.id.startsWith('j_')
  );
}

/**
 * Get location by ID
 */
export function getLocationById(id) {
  const graph = getGraph();
  return graph.getNode(id);
}

/**
 * Add a new location to the map
 */
export function addLocation(id, name, x, y, isExit = false) {
  const graph = getGraph();
  graph.addNode(id, { name, x, y, isExit });
}

/**
 * Add a new connection between locations
 */
export function addConnection(fromId, toId, distance) {
  const graph = getGraph();
  graph.addEdge(fromId, toId, distance);
}
