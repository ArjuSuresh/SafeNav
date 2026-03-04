/**
 * Graph data structure for indoor navigation
 * Represents locations as nodes and corridors/passages as edges
 */
class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  /**
   * Add a location (node) to the graph
   */
  addNode(id, data) {
    this.nodes.set(id, {
      id,
      ...data
    });
  }

  /**
   * Add a connection (edge) between two locations with distance
   */
  addEdge(fromId, toId, distance) {
    if (!this.edges.has(fromId)) {
      this.edges.set(fromId, []);
    }
    if (!this.edges.has(toId)) {
      this.edges.set(toId, []);
    }

    this.edges.get(fromId).push({ to: toId, distance });
    this.edges.get(toId).push({ to: fromId, distance });
  }

  /**
   * Get all neighbors of a node
   */
  getNeighbors(nodeId) {
    return this.edges.get(nodeId) || [];
  }

  /**
   * Get node data
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }
}

export default Graph;
