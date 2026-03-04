// algorithms.js — no Graph import needed here

/**
 * Priority queue implementation for A* and Dijkstra algorithms
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(element, priority) {
    const queueElement = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(queueElement);
    }
  }

  dequeue() {
    return this.items.shift()?.element;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  clear() {
    this.items = [];
  }
}

/**
 * Dijkstra's shortest path algorithm
 */
export function dijkstra(graph, startId, endId) {
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();
  const queue = new PriorityQueue();

  // Initialize distances
  for (const node of graph.getAllNodes()) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }
  distances.set(startId, 0);

  queue.enqueue(startId, 0);

  while (!queue.isEmpty()) {
    const current = queue.dequeue();

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endId) break;

    const neighbors = graph.getNeighbors(current);
    for (const neighbor of neighbors) {
      const newDistance = distances.get(current) + neighbor.distance;

      if (newDistance < distances.get(neighbor.to)) {
        distances.set(neighbor.to, newDistance);
        previous.set(neighbor.to, current);
        queue.enqueue(neighbor.to, newDistance);
      }
    }
  }

  // Reconstruct path
  const path = [];
  let current = endId;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current);
  }

  return {
    path,
    distance: distances.get(endId)
  };
}

/**
 * A* pathfinding algorithm with heuristic
 */
export function aStar(graph, startId, endId, heuristic) {
  const openSet = new PriorityQueue();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  // Initialize scores
  for (const node of graph.getAllNodes()) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
  }

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startId, endId));
  openSet.enqueue(startId, fScore.get(startId));

  const closedSet = new Set();

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();

    if (current === endId) {
      // Reconstruct path
      const path = [];
      let node = endId;
      while (cameFrom.has(node)) {
        path.unshift(node);
        node = cameFrom.get(node);
      }
      path.unshift(startId);

      return {
        path,
        distance: gScore.get(endId)
      };
    }

    closedSet.add(current);

    const neighbors = graph.getNeighbors(current);
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.to)) continue;

      const tentativeGScore = gScore.get(current) + neighbor.distance;

      if (tentativeGScore < gScore.get(neighbor.to)) {
        cameFrom.set(neighbor.to, current);
        gScore.set(neighbor.to, tentativeGScore);
        const newFScore = tentativeGScore + heuristic(neighbor.to, endId);
        fScore.set(neighbor.to, newFScore);
        openSet.enqueue(neighbor.to, newFScore);
      }
    }
  }

  return { path: [], distance: Infinity };
}

const algorithms = { dijkstra, aStar };
export default algorithms;
