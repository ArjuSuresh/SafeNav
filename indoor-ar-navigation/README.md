# AR-Based Smart Indoor Navigation System

A web-based augmented reality indoor navigation and emergency guidance system for complex indoor environments.

## Features

- **QR-Based Localization**: Uses QR codes to determine user's starting position
- **Graph-Based Pathfinding**: Implements Dijkstra and A* algorithms for optimal route calculation
- **AR Visualization**: Real-time directional guidance overlay
- **Emergency Evacuation**: Dynamic safe exit routing
- **React Frontend**: Modern, responsive UI suitable for mobile devices
- **Capacitor Support**: Ready for mobile deployment (iOS/Android)

## Project Structure

```
src/
├── components/
│   ├── QRLocalization.js      # QR code scanning and localization
│   ├── NavigationView.js      # Navigation UI panel
│   └── ARVisualization.js     # AR overlay visualization
├── logic/
│   ├── graph.js               # Graph data structure
│   ├── algorithms.js          # Dijkstra and A* algorithms
│   └── pathfinding.js         # High-level pathfinding API
├── data/
│   └── indoorMap.js           # Indoor map graph and location data
├── ar/                        # AR-specific modules (Three.js integration)
├── App.js                     # Main application component
└── index.js                   # React entry point
```

## Tech Stack

- **Frontend**: React 18
- **AR Visualization**: Three.js (planned)
- **QR Scanning**: jsQR
- **Mobile Deployment**: Capacitor
- **Pathfinding**: Custom A* and Dijkstra implementations

## Getting Started

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

## Usage

1. **Localization**: App starts by prompting user to scan a QR code with their location
2. **Navigation**: User selects a destination and AR overlay provides directions
3. **Emergency Mode**: Press Emergency button to get evacuation route to nearest exit

## QR Code Format

QR codes should contain JSON with location data:
```json
{
  "id": "location_id",
  "name": "Location Name",
  "x": 50,
  "y": 50
}
```

## Algorithms

- **Dijkstra's Algorithm**: Guaranteed shortest path, no heuristic
- **A* Algorithm**: Faster pathfinding using Euclidean distance heuristic

## Indoor Map

The system uses a graph-based indoor map where:
- **Nodes** represent locations (rooms, corridors, etc.)
- **Edges** represent connections with distances
- Each location has 2D coordinates for AR calculations

## Future Enhancements

- [ ] Three.js 3D visualization
- [ ] Real-time multiplayer navigation
- [ ] Integration with building HVAC for emergency assistance
- [ ] Advanced sensor fusion (WiFi, BLE beacons)
- [ ] Offline map support
- [ ] Accessibility features (audio guidance)

## License

MIT License

## Contact

For questions or suggestions, please reach out to the development team.
