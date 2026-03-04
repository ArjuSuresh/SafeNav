"""
A* and Dijkstra pathfinding with crowd-density penalties.
Also generates turn-by-turn navigation instructions.
"""

import heapq
import math
from typing import Dict, List, Optional, Tuple


# ───────────────────────────────────────────────────
#  Core Utilities
# ───────────────────────────────────────────────────

def _euclidean(x1: float, y1: float, x2: float, y2: float) -> float:
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


# ───────────────────────────────────────────────────
#  A* Pathfinding (with crowd penalty support)
# ───────────────────────────────────────────────────

def a_star(
    graph: Dict,
    start: str,
    goal: str,
    crowd_penalties: Optional[Dict[str, float]] = None,
) -> Tuple[Optional[List[str]], float]:
    """
    A* search from *start* to *goal*.

    Parameters
    ----------
    graph : dict with keys 'nodes' and 'adjacency'
    start, goal : node IDs
    crowd_penalties : optional dict  node_id -> penalty (0.0–1.0).
        A higher penalty makes the algorithm prefer avoiding that node.

    Returns
    -------
    (path, cost) where path is a list of node IDs or None if unreachable.
    """
    nodes = graph["nodes"]
    adjacency = graph["adjacency"]

    if start not in nodes or goal not in nodes:
        return None, float("inf")

    goal_x, goal_y = nodes[goal]["x"], nodes[goal]["y"]

    def h(nid: str) -> float:
        n = nodes[nid]
        return _euclidean(n["x"], n["y"], goal_x, goal_y)

    open_set: List[Tuple[float, str]] = [(h(start), start)]
    came_from: Dict[str, str] = {}
    g_score: Dict[str, float] = {start: 0.0}
    visited = set()

    while open_set:
        _, current = heapq.heappop(open_set)

        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            path = _reconstruct(came_from, current)
            return path, round(g_score[goal], 2)

        for neighbour, edge_dist in adjacency.get(current, []):
            if neighbour in visited:
                continue

            # Crowd penalty: makes crowded corridors "longer"
            penalty = 0.0
            if crowd_penalties and neighbour in crowd_penalties:
                penalty = crowd_penalties[neighbour] * edge_dist * 2.0

            tentative_g = g_score[current] + edge_dist + penalty

            if tentative_g < g_score.get(neighbour, float("inf")):
                came_from[neighbour] = current
                g_score[neighbour] = tentative_g
                f = tentative_g + h(neighbour)
                heapq.heappush(open_set, (f, neighbour))

    return None, float("inf")


# ───────────────────────────────────────────────────
#  Dijkstra (for emergency — no heuristic, supports blocked nodes)
# ───────────────────────────────────────────────────

def dijkstra(
    graph: Dict,
    start: str,
    goal: str,
    blocked_nodes: Optional[List[str]] = None,
) -> Tuple[Optional[List[str]], float]:
    """
    Dijkstra's shortest path, optionally avoiding *blocked_nodes*.
    Used for emergency evacuation where we must ignore crowd penalties
    but respect physically blocked areas (fire, debris, etc.).
    """
    nodes = graph["nodes"]
    adjacency = graph["adjacency"]

    if start not in nodes or goal not in nodes:
        return None, float("inf")

    blocked = set(blocked_nodes or [])

    open_set: List[Tuple[float, str]] = [(0.0, start)]
    came_from: Dict[str, str] = {}
    dist: Dict[str, float] = {start: 0.0}
    visited = set()

    while open_set:
        d, current = heapq.heappop(open_set)

        if current in visited:
            continue
        visited.add(current)

        if current == goal:
            path = _reconstruct(came_from, current)
            return path, round(dist[goal], 2)

        for neighbour, edge_dist in adjacency.get(current, []):
            if neighbour in visited or neighbour in blocked:
                continue

            tentative = dist[current] + edge_dist
            if tentative < dist.get(neighbour, float("inf")):
                came_from[neighbour] = current
                dist[neighbour] = tentative
                heapq.heappush(open_set, (tentative, neighbour))

    return None, float("inf")


# ───────────────────────────────────────────────────
#  Path reconstruction
# ───────────────────────────────────────────────────

def _reconstruct(came_from: Dict[str, str], current: str) -> List[str]:
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path


# ───────────────────────────────────────────────────
#  Turn-by-turn instruction generation
# ───────────────────────────────────────────────────

def generate_instructions(path: List[str], nodes: Dict) -> List[str]:
    """
    Produce human-readable, step-by-step navigation instructions
    from a list of node IDs.
    """
    if not path:
        return ["No path available."]
    if len(path) == 1:
        return ["You are already at your destination!"]

    instructions: List[str] = []
    start_node = nodes[path[0]]
    end_node = nodes[path[-1]]

    instructions.append(f"🚩 Start at {start_node['name']}")

    for i in range(1, len(path)):
        prev = nodes[path[i - 1]]
        curr = nodes[path[i]]
        dist = _euclidean(prev["x"], prev["y"], curr["x"], curr["y"])

        # Determine direction relative to previous segment
        if i >= 2:
            pprev = nodes[path[i - 2]]
            dx1 = prev["x"] - pprev["x"]
            dy1 = prev["y"] - pprev["y"]
            dx2 = curr["x"] - prev["x"]
            dy2 = curr["y"] - prev["y"]
            cross = dx1 * dy2 - dy1 * dx2

            if abs(cross) > 1.0:
                turn = "↪️ Turn right" if cross > 0 else "↩️ Turn left"
                instructions.append(f"{turn} and walk {dist:.0f}m")
            else:
                instructions.append(f"⬆️ Continue straight for {dist:.0f}m")
        else:
            instructions.append(f"⬆️ Walk {dist:.0f}m ahead")

        # Mention landmark if this node is a room (not a corridor junction)
        if curr["type"] != "corridor" and i < len(path) - 1:
            instructions.append(f"   📍 Pass {curr['name']}")

    instructions.append(f"🏁 You have arrived at {end_node['name']}!")
    return instructions
