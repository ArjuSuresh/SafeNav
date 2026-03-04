"""
Crowd density simulation module.
In production, this would pull from real sensors / IoT feeds.
For now it generates realistic simulated data.
"""

import random
import time
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, List

from app.floor_data import NODES

# ───────────────────────────────────────────────────
#  Configuration
# ───────────────────────────────────────────────────

# Only rooms / facilities get crowd density values
# (corridor junctions don't have "crowd" in the usual sense)
CROWD_ZONES = {
    nid: n for nid, n in NODES.items() if n["type"] != "corridor"
}

# Base density profiles (simulate different typical crowdedness)
_BASE_DENSITY = {
    "lecture_hall":  0.6,
    "lab":          0.4,
    "faculty":      0.3,
    "office":       0.2,
    "toilet":       0.15,
    "entrance":     0.35,
    "stairs":       0.25,
}

# IST timezone offset (+05:30)
IST = timezone(timedelta(hours=5, minutes=30))


# ───────────────────────────────────────────────────
#  Density helpers
# ───────────────────────────────────────────────────

def _density_level(d: float) -> str:
    if d < 0.25:
        return "low"
    if d < 0.50:
        return "medium"
    if d < 0.75:
        return "high"
    return "critical"


def _time_factor() -> float:
    """
    Multiplier based on time of day.
    Peak hours (9-11 AM, 2-4 PM) => higher,  early/late => lower.
    """
    hour = datetime.now(IST).hour
    if 9 <= hour <= 11 or 14 <= hour <= 16:
        return 1.3
    if 7 <= hour <= 18:
        return 1.0
    return 0.4


# ───────────────────────────────────────────────────
#  Public API
# ───────────────────────────────────────────────────

def get_crowd_density() -> Dict:
    """
    Return current crowd density for every zone.
    Each call produces slightly different numbers to simulate
    real-time fluctuation.
    """
    tf = _time_factor()
    zones: List[Dict] = []

    for nid, node in CROWD_ZONES.items():
        base = _BASE_DENSITY.get(node["type"], 0.3)
        noise = random.uniform(-0.12, 0.12)
        density = max(0.0, min(1.0, base * tf + noise))
        density = round(density, 2)

        zones.append({
            "zone_id": nid,
            "zone_name": node["name"],
            "density": density,
            "level": _density_level(density),
            "x": node["x"],
            "y": node["y"],
        })

    # Build a simple 2-D heatmap matrix (10×10 grid)
    heatmap = _build_heatmap(zones)

    return {
        "timestamp": datetime.now(IST).isoformat(),
        "zones": zones,
        "heatmap_matrix": heatmap,
    }


def get_crowd_penalties() -> Dict[str, float]:
    """
    Return a dict used by pathfinding:  node_id -> penalty  (0.0–1.0)
    Corridors inherit the average density of their neighbouring rooms.
    """
    data = get_crowd_density()["zones"]
    penalties: Dict[str, float] = {}

    for z in data:
        penalties[z["zone_id"]] = z["density"]

    # Propagate to corridor junctions (average of adjacent room densities)
    from app.floor_data import build_adjacency
    adj = build_adjacency()
    for nid, node in NODES.items():
        if node["type"] == "corridor":
            neighbour_densities = [
                penalties[nb] for nb, _ in adj[nid] if nb in penalties
            ]
            if neighbour_densities:
                penalties[nid] = round(
                    sum(neighbour_densities) / len(neighbour_densities), 2
                )
            else:
                penalties[nid] = 0.1

    return penalties


# ───────────────────────────────────────────────────
#  Heatmap matrix builder
# ───────────────────────────────────────────────────

def _build_heatmap(zones: List[Dict], grid_size: int = 10) -> List[List[float]]:
    """
    Create a grid_size × grid_size heatmap matrix.
    Each cell's value is an inverse-distance-weighted average
    of nearby zone densities.
    """
    # Determine floor bounds
    max_x = max(z["x"] for z in zones) + 5
    max_y = max(z["y"] for z in zones) + 5

    matrix = []
    for row in range(grid_size):
        row_vals = []
        cy = (row + 0.5) * max_y / grid_size
        for col in range(grid_size):
            cx = (col + 0.5) * max_x / grid_size
            total_w = 0.0
            total_v = 0.0
            for z in zones:
                d = math.sqrt((cx - z["x"]) ** 2 + (cy - z["y"]) ** 2) + 1.0
                w = 1.0 / (d ** 2)
                total_w += w
                total_v += w * z["density"]
            val = round(total_v / total_w, 2) if total_w > 0 else 0.0
            row_vals.append(val)
        matrix.append(row_vals)

    return matrix
