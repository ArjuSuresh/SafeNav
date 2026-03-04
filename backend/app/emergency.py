"""
Emergency evacuation routing module.
Finds the shortest safe path to the nearest exit,
optionally avoiding hazard zones and blocked corridors.
"""

from typing import Dict, List, Optional, Tuple

from app.floor_data import NODES, EXIT_NODES, get_graph
from app.pathfinding import dijkstra, generate_instructions


# ───────────────────────────────────────────────────
#  Alert messages per hazard type
# ───────────────────────────────────────────────────

HAZARD_ALERTS = {
    "fire":       "🔥 FIRE EMERGENCY — Evacuate immediately! Stay low to avoid smoke.",
    "gas":        "☁️ GAS LEAK DETECTED — Cover your nose and mouth. Move to open air.",
    "earthquake": "🌍 EARTHQUAKE — Drop, cover, and hold on. Then evacuate when safe.",
    "other":      "⚠️ EMERGENCY — Please evacuate the building calmly and quickly.",
}


# ───────────────────────────────────────────────────
#  Public API
# ───────────────────────────────────────────────────

def compute_evacuation(
    current_location: str,
    hazard_type: str = "fire",
    hazard_location: Optional[str] = None,
    blocked_paths: Optional[List[str]] = None,
) -> Dict:
    """
    Compute the safest evacuation route from *current_location*
    to the nearest available exit.

    Returns a dict ready to be wrapped in an EmergencyResponse.
    """
    graph = get_graph()
    blocked = list(blocked_paths or [])

    # Block the hazard location itself (and its immediate neighbours)
    if hazard_location and hazard_location in NODES:
        blocked.append(hazard_location)
        # Also block adjacent nodes within 5m of hazard (danger radius)
        for nb, dist in graph["adjacency"].get(hazard_location, []):
            if dist < 5.0:
                blocked.append(nb)

    # Never block the start node
    blocked = [b for b in blocked if b != current_location]

    # Try every exit and pick the shortest reachable one
    best_path: Optional[List[str]] = None
    best_dist = float("inf")
    best_exit = ""

    for exit_id in EXIT_NODES:
        if exit_id in blocked:
            continue
        path, dist = dijkstra(graph, current_location, exit_id, blocked_nodes=blocked)
        if path and dist < best_dist:
            best_path = path
            best_dist = dist
            best_exit = exit_id

    if best_path is None:
        return {
            "success": False,
            "alert_message": HAZARD_ALERTS.get(hazard_type, HAZARD_ALERTS["other"]),
            "hazard_type": hazard_type,
            "nearest_exit": "",
            "nearest_exit_name": "",
            "path": [],
            "total_distance": 0.0,
            "estimated_time_seconds": 0.0,
            "instructions": ["❌ No safe evacuation route found! Stay in place and call emergency services."],
        }

    from app.floor_data import WALKING_SPEED_MPS

    path_nodes = [
        {
            "node_id": nid,
            "name": NODES[nid]["name"],
            "x": NODES[nid]["x"],
            "y": NODES[nid]["y"],
            "type": NODES[nid]["type"],
        }
        for nid in best_path
    ]

    instructions = generate_instructions(best_path, NODES)
    # Prepend the emergency alert
    instructions.insert(0, HAZARD_ALERTS.get(hazard_type, HAZARD_ALERTS["other"]))

    return {
        "success": True,
        "alert_message": HAZARD_ALERTS.get(hazard_type, HAZARD_ALERTS["other"]),
        "hazard_type": hazard_type,
        "nearest_exit": best_exit,
        "nearest_exit_name": NODES[best_exit]["name"],
        "path": path_nodes,
        "total_distance": round(best_dist, 2),
        "estimated_time_seconds": round(best_dist / WALKING_SPEED_MPS, 1),
        "instructions": instructions,
    }
