"""
Pydantic models for request/response schemas.
Smart Indoor AR Navigation - Sri Abhinava Vidyatirtha Block
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


# ──────────────────── Request Models ────────────────────

class NavigationRequest(BaseModel):
    """Request body for navigation pathfinding."""
    start: str = Field(..., description="Starting node ID (from marker scan)")
    destination: str = Field(..., description="Destination node ID")
    avoid_crowd: bool = Field(True, description="Whether to factor in crowd density penalties")


class EmergencyRequest(BaseModel):
    """Request body for emergency evacuation routing."""
    current_location: str = Field(..., description="User's current node ID")
    hazard_type: str = Field("fire", description="Type of hazard: fire, gas, earthquake, other")
    hazard_location: Optional[str] = Field(None, description="Node ID where hazard is located")
    blocked_paths: List[str] = Field(default_factory=list, description="List of node IDs that are blocked/unsafe")


# ──────────────────── Response Models ────────────────────

class PathNode(BaseModel):
    """A single node in a navigation path."""
    node_id: str
    name: str
    x: float
    y: float
    type: str
    instruction: Optional[str] = None


class NavigationResponse(BaseModel):
    """Response body for navigation pathfinding."""
    success: bool
    message: str
    path: List[PathNode] = []
    total_distance: float = 0.0
    estimated_time_seconds: float = 0.0
    instructions: List[str] = []


class EmergencyResponse(BaseModel):
    """Response body for emergency evacuation."""
    success: bool
    alert_message: str
    hazard_type: str
    nearest_exit: str = ""
    nearest_exit_name: str = ""
    path: List[PathNode] = []
    total_distance: float = 0.0
    estimated_time_seconds: float = 0.0
    instructions: List[str] = []


class CrowdZone(BaseModel):
    """Crowd density data for a single zone."""
    zone_id: str
    zone_name: str
    density: float = Field(..., ge=0.0, le=1.0, description="0.0 = empty, 1.0 = packed")
    level: str = Field(..., description="low, medium, high, critical")
    x: float
    y: float


class CrowdDensityResponse(BaseModel):
    """Response body for crowd density data."""
    timestamp: str
    zones: List[CrowdZone]
    heatmap_matrix: List[List[float]] = []


class LocationInfo(BaseModel):
    """Information about a navigable location."""
    id: str
    name: str
    x: float
    y: float
    type: str
    is_exit: bool = False


class MarkerInfo(BaseModel):
    """Mapping of a physical AR marker to a floor location."""
    marker_id: str
    location_id: str
    location_name: str
    x: float
    y: float


class FloorMapResponse(BaseModel):
    """Complete floor map data for the frontend."""
    building_name: str
    floor: int
    locations: List[LocationInfo]
    edges: List[Dict]
    markers: List[MarkerInfo]
    exits: List[str]
