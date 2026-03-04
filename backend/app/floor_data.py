"""
Floor map data for Sri Abhinava Vidyatirtha Block.
Defines all nodes (rooms, corridors, facilities) and edges (walkable connections).
Coordinates are in metres relative to the floor plan origin (top-left = 0,0).
"""

import math
from typing import Dict, List, Tuple

# ═══════════════════════════════════════════════════════════════
#  BUILDING METADATA
# ═══════════════════════════════════════════════════════════════

BUILDING_NAME = "Sri Abhinava Vidyatirtha Block"
FLOOR_NUMBER = 1
WALKING_SPEED_MPS = 1.4  # average indoor walking speed in m/s

# ═══════════════════════════════════════════════════════════════
#  NODES — every navigable point on the floor
# ═══════════════════════════════════════════════════════════════
#  Types: lab, lecture_hall, faculty, office, toilet, stairs,
#         entrance, corridor

NODES: Dict[str, Dict] = {
    # ─── West Wing (Rooms) ───────────────────────────────────
    "thermal_eng_lab": {
        "name": "Thermal Engineering Lab II",
        "x": 8, "y": 7,
        "type": "lab",
    },
    "machine_tools_lab": {
        "name": "Machine Tools Lab II",
        "x": 8, "y": 16,
        "type": "lab",
    },
    "mech_faculty_room": {
        "name": "Mech Faculty Room",
        "x": 9, "y": 26,
        "type": "faculty",
    },

    # ─── Centre Rooms ────────────────────────────────────────
    "lecture_hall_a": {
        "name": "Lecture Hall A",
        "x": 24, "y": 6,
        "type": "lecture_hall",
    },
    "lecture_hall_b": {
        "name": "Lecture Hall B",
        "x": 24, "y": 15,
        "type": "lecture_hall",
    },
    "faculty_center": {
        "name": "Faculty Center",
        "x": 26, "y": 28,
        "type": "faculty",
    },

    # ─── East Wing (Rooms) ───────────────────────────────────
    "lecture_hall_c": {
        "name": "Lecture Hall C",
        "x": 50, "y": 7,
        "type": "lecture_hall",
    },
    "lecture_hall_d": {
        "name": "Lecture Hall D",
        "x": 50, "y": 19,
        "type": "lecture_hall",
    },
    "stairs_east": {
        "name": "Stairs (East)",
        "x": 48, "y": 30,
        "type": "stairs",
    },
    "faculty_room_east": {
        "name": "Faculty Room",
        "x": 50, "y": 36,
        "type": "faculty",
    },

    # ─── South — Entrances & Offices ─────────────────────────
    "left_stairs": {
        "name": "Left Stairs (South Entrance)",
        "x": 12, "y": 37,
        "type": "entrance",
    },
    "right_stairs": {
        "name": "Right Stairs (South Entrance)",
        "x": 24, "y": 37,
        "type": "entrance",
    },
    "mech_hod": {
        "name": "Mech HOD Office",
        "x": 12, "y": 43,
        "type": "office",
    },
    "ai_hod": {
        "name": "AI HOD Office",
        "x": 24, "y": 43,
        "type": "office",
    },

    # ─── Facilities ──────────────────────────────────────────
    "girls_toilet": {
        "name": "Girls Toilet",
        "x": 2, "y": 29,
        "type": "toilet",
    },
    "boys_toilet_center": {
        "name": "Boys Toilet (Center)",
        "x": 34, "y": 28,
        "type": "toilet",
    },
    "boys_toilet_north": {
        "name": "Boys Toilet (North)",
        "x": 38, "y": 7,
        "type": "toilet",
    },

    # ─── Corridor Junctions ──────────────────────────────────
    #  These represent points where corridors meet / branch.
    #  They are not rooms — they exist for pathfinding purposes.
    "j_nw": {
        "name": "NW Corridor",
        "x": 16, "y": 7,
        "type": "corridor",
    },
    "j_nc": {
        "name": "North-Centre Corridor",
        "x": 30, "y": 7,
        "type": "corridor",
    },
    "j_ne": {
        "name": "NE Corridor",
        "x": 43, "y": 7,
        "type": "corridor",
    },
    "j_mw": {
        "name": "Mid-West Corridor",
        "x": 16, "y": 16,
        "type": "corridor",
    },
    "j_mc": {
        "name": "Mid-Centre Corridor",
        "x": 30, "y": 16,
        "type": "corridor",
    },
    "j_me": {
        "name": "Mid-East Corridor",
        "x": 43, "y": 19,
        "type": "corridor",
    },
    "j_sw": {
        "name": "SW Corridor",
        "x": 16, "y": 28,
        "type": "corridor",
    },
    "j_sc": {
        "name": "South-Centre Corridor",
        "x": 30, "y": 28,
        "type": "corridor",
    },
    "j_se": {
        "name": "SE Corridor",
        "x": 43, "y": 30,
        "type": "corridor",
    },
    "j_bw": {
        "name": "Bottom-West Corridor",
        "x": 16, "y": 37,
        "type": "corridor",
    },
    "j_bc": {
        "name": "Bottom-Centre Corridor",
        "x": 30, "y": 37,
        "type": "corridor",
    },
    "j_be": {
        "name": "Bottom-East Corridor",
        "x": 43, "y": 36,
        "type": "corridor",
    },
}

# ═══════════════════════════════════════════════════════════════
#  EDGES — walkable connections between nodes
#  Each tuple: (node_a, node_b)
#  Distances are computed automatically from coordinates.
# ═══════════════════════════════════════════════════════════════

EDGES_RAW: List[Tuple[str, str]] = [
    # ── Horizontal corridors — North row ─────────────────────
    ("j_nw",  "j_nc"),
    ("j_nc",  "j_ne"),

    # ── Horizontal corridors — Middle row ────────────────────
    ("j_mw",  "j_mc"),
    ("j_mc",  "j_me"),

    # ── Horizontal corridors — South row ─────────────────────
    ("j_sw",  "j_sc"),
    ("j_sc",  "j_se"),

    # ── Horizontal corridors — Bottom row ────────────────────
    ("j_bw",  "j_bc"),
    ("j_bc",  "j_be"),

    # ── Vertical corridors — West column ─────────────────────
    ("j_nw",  "j_mw"),
    ("j_mw",  "j_sw"),
    ("j_sw",  "j_bw"),

    # ── Vertical corridors — Centre column ───────────────────
    ("j_nc",  "j_mc"),
    ("j_mc",  "j_sc"),
    ("j_sc",  "j_bc"),

    # ── Vertical corridors — East column ─────────────────────
    ("j_ne",  "j_me"),
    ("j_me",  "j_se"),
    ("j_se",  "j_be"),

    # ── Room connections to nearest corridor junction ─────────
    # West Wing
    ("thermal_eng_lab",   "j_nw"),
    ("machine_tools_lab", "j_mw"),
    ("mech_faculty_room", "j_sw"),

    # Centre
    ("lecture_hall_a",  "j_nw"),    # door faces west corridor
    ("lecture_hall_a",  "j_nc"),    # or from north corridor
    ("lecture_hall_b",  "j_mc"),
    ("faculty_center",  "j_sc"),

    # East Wing
    ("lecture_hall_c",    "j_ne"),
    ("lecture_hall_d",    "j_me"),
    ("stairs_east",      "j_se"),
    ("faculty_room_east", "j_be"),

    # East wing internal corridor (allows alternative routing)
    ("lecture_hall_c",    "lecture_hall_d"),   # walkable along east wall
    ("stairs_east",      "faculty_room_east"),  # east vertical corridor
    ("j_be",             "stairs_east"),       # bottom-east horizontal link

    # South entrances
    ("left_stairs",  "j_bw"),
    ("right_stairs", "j_bc"),

    # Offices (south, below entrances)
    ("mech_hod",  "left_stairs"),
    ("ai_hod",    "right_stairs"),

    # Facilities
    ("girls_toilet",        "j_sw"),
    ("boys_toilet_center",  "j_sc"),
    ("boys_toilet_north",   "j_nc"),
    ("boys_toilet_north",   "j_ne"),
]

# ═══════════════════════════════════════════════════════════════
#  EXIT NODES — used for emergency evacuation
# ═══════════════════════════════════════════════════════════════

EXIT_NODES = ["left_stairs", "right_stairs", "stairs_east"]

# ═══════════════════════════════════════════════════════════════
#  MARKER → LOCATION MAPPING
#  Each physical AR marker placed on the floor maps to a node.
# ═══════════════════════════════════════════════════════════════

MARKERS: Dict[str, str] = {
    "MARKER_001": "left_stairs",
    "MARKER_002": "right_stairs",
    "MARKER_003": "j_nw",
    "MARKER_004": "j_nc",
    "MARKER_005": "j_ne",
    "MARKER_006": "j_mw",
    "MARKER_007": "j_mc",
    "MARKER_008": "j_me",
    "MARKER_009": "j_sw",
    "MARKER_010": "j_sc",
    "MARKER_011": "j_se",
    "MARKER_012": "thermal_eng_lab",
    "MARKER_013": "machine_tools_lab",
    "MARKER_014": "mech_faculty_room",
    "MARKER_015": "lecture_hall_a",
    "MARKER_016": "lecture_hall_b",
    "MARKER_017": "lecture_hall_c",
    "MARKER_018": "lecture_hall_d",
    "MARKER_019": "faculty_center",
    "MARKER_020": "stairs_east",
    "MARKER_021": "faculty_room_east",
    "MARKER_022": "mech_hod",
    "MARKER_023": "ai_hod",
    "MARKER_024": "girls_toilet",
    "MARKER_025": "boys_toilet_center",
    "MARKER_026": "boys_toilet_north",
    "MARKER_027": "j_bw",
    "MARKER_028": "j_bc",
    "MARKER_029": "j_be",
}


# ═══════════════════════════════════════════════════════════════
#  HELPER — build adjacency list with auto-computed distances
# ═══════════════════════════════════════════════════════════════

def _distance(a: str, b: str) -> float:
    """Euclidean distance between two nodes (metres)."""
    na, nb = NODES[a], NODES[b]
    return round(math.sqrt((nb["x"] - na["x"]) ** 2 + (nb["y"] - na["y"]) ** 2), 2)


def build_adjacency() -> Dict[str, List[Tuple[str, float]]]:
    """Return adjacency list: { node_id: [(neighbour_id, distance), ...] }"""
    adj: Dict[str, List[Tuple[str, float]]] = {nid: [] for nid in NODES}
    for a, b in EDGES_RAW:
        d = _distance(a, b)
        adj[a].append((b, d))
        adj[b].append((a, d))
    return adj


def get_graph() -> Dict:
    """Return the complete graph dict used by pathfinding functions."""
    return {
        "nodes": NODES,
        "adjacency": build_adjacency(),
    }


def get_navigable_locations() -> List[Dict]:
    """Return only the rooms/facilities (not corridor junctions) for the UI dropdown."""
    return [
        {"id": nid, "name": n["name"], "x": n["x"], "y": n["y"], "type": n["type"]}
        for nid, n in NODES.items()
        if n["type"] != "corridor"
    ]
