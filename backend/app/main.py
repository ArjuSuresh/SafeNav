"""
FastAPI application — Smart Indoor AR Navigation
Sri Abhinava Vidyatirtha Block
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from app.models import (
    NavigationRequest, NavigationResponse, PathNode,
    EmergencyRequest, EmergencyResponse,
    CrowdDensityResponse, CrowdZone,
    LocationInfo, MarkerInfo, FloorMapResponse,
)
from app.floor_data import (
    BUILDING_NAME, FLOOR_NUMBER, WALKING_SPEED_MPS,
    NODES, EDGES_RAW, EXIT_NODES, MARKERS,
    get_graph, get_navigable_locations,
)
from app.pathfinding import a_star, generate_instructions
from app.crowd import get_crowd_density, get_crowd_penalties
from app.emergency import compute_evacuation


# ═══════════════════════════════════════════════════════════════
#  App Initialisation
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Smart Indoor AR Navigation API",
    description=(
        "Backend API for AR-based indoor navigation, crowd density tracking, "
        "and emergency evacuation — Sri Abhinava Vidyatirtha Block."
    ),
    version="1.0.0",
)

# Allow all origins during development (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
#  Health Check
# ═══════════════════════════════════════════════════════════════

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "building": BUILDING_NAME,
        "floor": FLOOR_NUMBER,
        "total_nodes": len(NODES),
    }


# ═══════════════════════════════════════════════════════════════
#  Locations
# ═══════════════════════════════════════════════════════════════

@app.get("/locations", response_model=List[LocationInfo], tags=["Navigation"])
def list_locations():
    """Return all navigable locations (rooms, labs, offices, etc.)."""
    locations = get_navigable_locations()
    return [
        LocationInfo(
            id=loc["id"],
            name=loc["name"],
            x=loc["x"],
            y=loc["y"],
            type=loc["type"],
            is_exit=loc["id"] in EXIT_NODES,
        )
        for loc in locations
    ]


# ═══════════════════════════════════════════════════════════════
#  Navigation (Pathfinding)
# ═══════════════════════════════════════════════════════════════

@app.post("/navigate", response_model=NavigationResponse, tags=["Navigation"])
def navigate(req: NavigationRequest):
    """
    Compute the optimal route from `start` to `destination`.
    Uses A* with optional crowd-density penalties.
    """
    graph = get_graph()

    if req.start not in NODES:
        raise HTTPException(404, f"Start location '{req.start}' not found.")
    if req.destination not in NODES:
        raise HTTPException(404, f"Destination '{req.destination}' not found.")
    if req.start == req.destination:
        return NavigationResponse(
            success=True,
            message="You are already at your destination!",
            path=[],
            total_distance=0.0,
            estimated_time_seconds=0.0,
            instructions=["You are already at your destination!"],
        )

    crowd_penalties = get_crowd_penalties() if req.avoid_crowd else None
    path, total_dist = a_star(graph, req.start, req.destination, crowd_penalties)

    if path is None:
        raise HTTPException(
            404,
            f"No route found from '{req.start}' to '{req.destination}'.",
        )

    path_nodes = [
        PathNode(
            node_id=nid,
            name=NODES[nid]["name"],
            x=NODES[nid]["x"],
            y=NODES[nid]["y"],
            type=NODES[nid]["type"],
        )
        for nid in path
    ]

    instructions = generate_instructions(path, NODES)
    est_time = round(total_dist / WALKING_SPEED_MPS, 1)

    return NavigationResponse(
        success=True,
        message=f"Route found: {NODES[req.start]['name']} → {NODES[req.destination]['name']}",
        path=path_nodes,
        total_distance=total_dist,
        estimated_time_seconds=est_time,
        instructions=instructions,
    )


# ═══════════════════════════════════════════════════════════════
#  Crowd Density
# ═══════════════════════════════════════════════════════════════

@app.get("/crowd-density", response_model=CrowdDensityResponse, tags=["Crowd"])
def crowd_density():
    """Return real-time crowd density for every zone + heatmap matrix."""
    data = get_crowd_density()
    return CrowdDensityResponse(
        timestamp=data["timestamp"],
        zones=[CrowdZone(**z) for z in data["zones"]],
        heatmap_matrix=data["heatmap_matrix"],
    )


# ═══════════════════════════════════════════════════════════════
#  Emergency Evacuation
# ═══════════════════════════════════════════════════════════════

@app.post("/emergency", response_model=EmergencyResponse, tags=["Emergency"])
def emergency(req: EmergencyRequest):
    """
    Compute the fastest evacuation route to the nearest safe exit.
    Automatically routes around hazard zones and blocked paths.
    """
    if req.current_location not in NODES:
        raise HTTPException(404, f"Location '{req.current_location}' not found.")

    result = compute_evacuation(
        current_location=req.current_location,
        hazard_type=req.hazard_type,
        hazard_location=req.hazard_location,
        blocked_paths=req.blocked_paths,
    )

    return EmergencyResponse(
        success=result["success"],
        alert_message=result["alert_message"],
        hazard_type=result["hazard_type"],
        nearest_exit=result["nearest_exit"],
        nearest_exit_name=result["nearest_exit_name"],
        path=[PathNode(**n) for n in result["path"]],
        total_distance=result["total_distance"],
        estimated_time_seconds=result["estimated_time_seconds"],
        instructions=result["instructions"],
    )


# ═══════════════════════════════════════════════════════════════
#  Marker Mapping
# ═══════════════════════════════════════════════════════════════

@app.get("/markers", response_model=List[MarkerInfo], tags=["Markers"])
def list_markers():
    """Return all AR marker → location mappings."""
    return [
        MarkerInfo(
            marker_id=mid,
            location_id=lid,
            location_name=NODES[lid]["name"],
            x=NODES[lid]["x"],
            y=NODES[lid]["y"],
        )
        for mid, lid in MARKERS.items()
        if lid in NODES
    ]


@app.get("/markers/{marker_id}", response_model=MarkerInfo, tags=["Markers"])
def get_marker(marker_id: str):
    """Look up a single marker by its ID (scanned from a physical marker)."""
    marker_id_upper = marker_id.upper()
    if marker_id_upper not in MARKERS:
        raise HTTPException(404, f"Marker '{marker_id}' not recognised.")
    lid = MARKERS[marker_id_upper]
    return MarkerInfo(
        marker_id=marker_id_upper,
        location_id=lid,
        location_name=NODES[lid]["name"],
        x=NODES[lid]["x"],
        y=NODES[lid]["y"],
    )


# ═══════════════════════════════════════════════════════════════
#  Floor Map (complete graph for frontend rendering)
# ═══════════════════════════════════════════════════════════════

@app.get("/floor-map", response_model=FloorMapResponse, tags=["Map"])
def floor_map():
    """Return the entire floor graph so the frontend can render the map."""
    locations = [
        LocationInfo(
            id=nid,
            name=n["name"],
            x=n["x"],
            y=n["y"],
            type=n["type"],
            is_exit=nid in EXIT_NODES,
        )
        for nid, n in NODES.items()
    ]

    edges = [
        {"from": a, "to": b, "from_name": NODES[a]["name"], "to_name": NODES[b]["name"]}
        for a, b in EDGES_RAW
    ]

    markers = [
        MarkerInfo(
            marker_id=mid,
            location_id=lid,
            location_name=NODES[lid]["name"],
            x=NODES[lid]["x"],
            y=NODES[lid]["y"],
        )
        for mid, lid in MARKERS.items()
        if lid in NODES
    ]

    return FloorMapResponse(
        building_name=BUILDING_NAME,
        floor=FLOOR_NUMBER,
        locations=locations,
        edges=edges,
        markers=markers,
        exits=EXIT_NODES,
    )
