import { dijkstra, aStar } from './algorithms';
import { getGraph } from '../data/indoorMap';
import { fetchRoute, fetchEmergencyRoute } from '../services/api';

/**
 * Augment a route result with a `waypoints` array — full node objects (id, name, x, y)
 * for each node in the path. Used by ARThreeScene.js for 3D waypoint rendering.
 * Pattern inspired by FireDragonGameStudio/ARIndoorNavigation-Threejs: path points
 * are converted to Vector3 positions for THREE.Line / navCube markers.
 */
function addWaypoints(route, graph) {
  if (!route || !route.path) return route;
  route.waypoints = route.path.map(id => graph.getNode(id)).filter(Boolean);
  return route;
}

/**
 * Convert backend response into the format the frontend expects:
 *   { path: [nodeId, ...], distance, waypoints: [nodeObj, ...], instructions: [...] }
 */
function backendResponseToRoute(data) {
  if (!data || !data.success) return { path: [], distance: Infinity };

  const path = data.path.map(p => p.node_id);
  const waypoints = data.path.map(p => ({
    id: p.node_id,
    name: p.name,
    x: p.x,
    y: p.y,
    type: p.type,
  }));

  return {
    path,
    distance: data.total_distance,
    estimatedTime: data.estimated_time_seconds,
    instructions: data.instructions || [],
    waypoints,
  };
}

/**
 * Get the optimal route between two locations.
 * Tries the backend API first; falls back to local A-star or Dijkstra if offline.
 */
export async function getRouteAsync(startLocationId, endLocationId, avoidCrowd = true) {
  try {
    const data = await fetchRoute(startLocationId, endLocationId, avoidCrowd);
    return backendResponseToRoute(data);
  } catch (err) {
    console.warn('⚠️ Backend route failed, using local pathfinding:', err.message);
    return getRouteLocal(startLocationId, endLocationId);
  }
}

/**
 * Synchronous local-only route (original behavior, no crowd penalties).
 */
export function getRoute(startLocationId, endLocationId, useAstar = true) {
  return getRouteLocal(startLocationId, endLocationId, useAstar);
}

function getRouteLocal(startLocationId, endLocationId, useAstar = true) {
  const graph = getGraph();

  const heuristic = (nodeId, targetId) => {
    const node1 = graph.getNode(nodeId);
    const node2 = graph.getNode(targetId);
    if (!node1 || !node2) return 0;
    const dx = node1.x - node2.x;
    const dy = node1.y - node2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const result = useAstar
    ? aStar(graph, startLocationId, endLocationId, heuristic)
    : dijkstra(graph, startLocationId, endLocationId);

  return addWaypoints(result, graph);
}

/**
 * Get emergency evacuation route (shortest path to nearest exit).
 * Tries the backend API first; falls back to local Dijkstra.
 */
export async function getEvacuationRouteAsync(
  currentLocationId,
  hazardType = 'fire',
  hazardLocation = null,
) {
  try {
    const data = await fetchEmergencyRoute(
      currentLocationId,
      hazardType,
      hazardLocation,
    );
    return backendResponseToRoute(data);
  } catch (err) {
    console.warn('⚠️ Backend emergency route failed, using local:', err.message);
    return getEvacuationRouteLocal(currentLocationId);
  }
}

/**
 * Synchronous local-only evacuation route (original behavior).
 */
export function getEvacuationRoute(currentLocationId) {
  return getEvacuationRouteLocal(currentLocationId);
}

function getEvacuationRouteLocal(currentLocationId) {
  const graph = getGraph();
  const allNodes = graph.getAllNodes();
  const exits = allNodes.filter(node => node.isExit);

  if (exits.length === 0) return { path: [], distance: Infinity };

  let shortestDistance = Infinity;
  let shortestRoute = { path: [], distance: Infinity };

  for (const exit of exits) {
    const route = dijkstra(graph, currentLocationId, exit.id);
    if (route.distance < shortestDistance) {
      shortestDistance = route.distance;
      shortestRoute = route;
    }
  }

  return addWaypoints(shortestRoute, graph);
}

/**
 * Get alternative routes
 */
export function getAlternativeRoutes(startLocationId, endLocationId, count = 3) {
  const graph = getGraph();
  const routes = [];
  const mainRoute = dijkstra(graph, startLocationId, endLocationId);
  routes.push(mainRoute);
  return routes;
}
