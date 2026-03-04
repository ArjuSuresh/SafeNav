/**
 * ARThreeScene.js
 *
 * Inspired by:
 *   FireDragonGameStudio/ARIndoorNavigation-Threejs
 *   https://github.com/FireDragonGameStudio/ARIndoorNavigation-Threejs
 *
 * Key patterns adopted from the reference repo:
 *  - THREE.WebGLRenderer with alpha:true overlaid on camera feed (transparent background)
 *  - THREE.Line with BufferGeometry for the navigation path (from PathFindingWebXR.js)
 *  - Small sphere markers at each waypoint (inspired by navCubes in PathFindingWebXR.js)
 *  - Scene group rotated by compass heading so "forward" always aligns with device orientation
 *
 * Adapted for:
 *  - React CRA (no Vite / WebXR image-tracking / NavMesh — incompatible with this stack)
 *  - Custom graph-based indoor map (not a GLTF NavMesh)
 *  - getUserMedia camera (not WebXR session camera)
 */

import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Module-level Three.js objects (created once, reused every frame)
// ─────────────────────────────────────────────────────────────────────────────
let renderer = null;
let camera = null;
let scene = null;
let arGroup = null;       // rotated by compass heading each frame
let animId = null;

// Path line (ref-repo pattern: THREE.Line with setFromPoints)
let pathLine = null;
let pathLineMaterial = null;

// Waypoint orb pool (ref-repo pattern: pool of navCubes, hide unused ones)
const MAX_ORBS = 20;
const orbPool = [];

// 3D Navigation arrow (cone + cylinder shaft)
let arrowGroup = null;
let arrowConeGlow = null;  // outer pulsing shell

// Destination label sprite
let labelCanvas = null;
let labelTexture = null;
let labelSprite = null;

// Helper: current state
let _isEmergency = false;
let _initialized = false;

// ─────────────────────────────────────────────────────────────────────────────
// init — create renderer canvas and attach to container
// ─────────────────────────────────────────────────────────────────────────────
export function initARThreeScene(container) {
    if (_initialized) return;

    // ── Renderer (alpha:true = transparent, shows camera video behind it) ──────
    // Pattern from reference repo: renderer.js → new WebGLRenderer({ alpha: true })
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth || window.innerWidth,
        container.clientHeight || window.innerHeight);
    renderer.setClearColor(0x000000, 0); // fully transparent background
    renderer.shadowMap.enabled = false;

    // Overlay canvas (pointer-events:none so touches pass through to buttons)
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '5';
    container.appendChild(canvas);

    // ── Camera ────────────────────────────────────────────────────────────────
    camera = new THREE.PerspectiveCamera(
        60,
        (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
        0.01,
        100
    );
    camera.position.set(0, 1.5, 0); // eye height ~1.5 m

    // ── Scene & lighting ──────────────────────────────────────────────────────
    scene = new THREE.Scene();
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(0, 5, 5);
    scene.add(ambient, directional);

    // ── Navigation group (rotated by heading each frame) ──────────────────────
    // Pattern from reference: navigationAreaParent that gets repositioned via marker
    // Here we rotate by compass heading instead (no physical marker available)
    arGroup = new THREE.Group();
    arGroup.position.set(0, 0, 0);
    scene.add(arGroup);

    // ── Path Line ─────────────────────────────────────────────────────────────
    // Directly from reference repo PathFindingWebXR.js:
    //   const lineGeometry = new BufferGeometry();
    //   const lineMaterial = new LineBasicMaterial({ color: 0xff0000, linewidth: 12 });
    //   line = new Line(lineGeometry, lineMaterial);
    pathLineMaterial = new THREE.LineBasicMaterial({
        color: 0x3b82f6,
        linewidth: 3,
        transparent: true,
        opacity: 0.9,
    });
    const pathGeometry = new THREE.BufferGeometry();
    pathLine = new THREE.Line(pathGeometry, pathLineMaterial);
    pathLine.renderOrder = 3;
    arGroup.add(pathLine);

    // ── Waypoint orb pool ─────────────────────────────────────────────────────
    // Pattern from reference repo: pool of small navCubes, show/hide as needed
    const orbGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const orbMaterial = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
    });
    for (let i = 0; i < MAX_ORBS; i++) {
        const orb = new THREE.Mesh(orbGeometry, orbMaterial.clone());
        orb.visible = false;
        orb.renderOrder = 3;
        orbPool.push(orb);
        arGroup.add(orb);
    }

    // ── 3D Arrow (cone + shaft) ───────────────────────────────────────────────
    arrowGroup = new THREE.Group();

    // Shaft (cylinder)
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12);
    const arrowMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.8,
    });
    const shaft = new THREE.Mesh(shaftGeo, arrowMat);
    shaft.position.y = 0.3;

    // Head (cone)
    const headGeo = new THREE.ConeGeometry(0.18, 0.4, 12);
    const head = new THREE.Mesh(headGeo, arrowMat);
    head.position.y = 0.8;

    // Outer glow shell (slightly larger, additive blend)
    const glowGeo = new THREE.ConeGeometry(0.26, 0.5, 12);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
    });
    arrowConeGlow = new THREE.Mesh(glowGeo, glowMat);
    arrowConeGlow.position.y = 0.82;

    arrowGroup.add(shaft, head, arrowConeGlow);
    arrowGroup.position.set(0, 0, -2.5); // 2.5 m in front of the camera by default
    arrowGroup.renderOrder = 4;
    arGroup.add(arrowGroup);

    // ── Destination label (canvas texture sprite) ─────────────────────────────
    labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.SpriteMaterial({
        map: labelTexture,
        transparent: true,
        depthTest: false,
    });
    labelSprite = new THREE.Sprite(labelMat);
    labelSprite.scale.set(2.5, 0.6, 1);
    labelSprite.position.set(0, 1.5, -2.5);
    labelSprite.renderOrder = 5;
    arGroup.add(labelSprite);

    _initialized = true;

    // Handle resize
    window.addEventListener('resize', () => {
        if (!renderer || !camera) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// startARLoop — begin the animation loop
// ─────────────────────────────────────────────────────────────────────────────
export function startARLoop(getHeading, getRoute, getDestination, isEmergencyFn) {
    if (!_initialized) return;
    let t = 0;

    function loop() {
        animId = requestAnimationFrame(loop);
        t += 0.016;
        _isEmergency = isEmergencyFn();

        const heading = getHeading();
        const route = getRoute();
        const destination = getDestination();

        // ── Rotate scene group by compass heading ───────────────────────────────
        // Adapted from reference: navigationAreaParent rotated to match marker pose
        // Here we rotate by -heading so the arrow always faces "forward"
        arGroup.rotation.y = -heading * (Math.PI / 180);

        // ── Colour scheme based on emergency flag ───────────────────────────────
        const primaryColor = _isEmergency ? 0xef4444 : 0x38bdf8;
        const emissiveColor = _isEmergency ? 0xb91c1c : 0x0ea5e9;

        // ── Update path line ────────────────────────────────────────────────────
        if (route?.waypoints && route.waypoints.length > 1) {
            // Convert 2D map coords → 3D world positions
            const points = waypointsToWorld(route.waypoints);
            pathLine.geometry.setFromPoints(points);   // ref-repo pattern
            pathLine.visible = true;
            pathLineMaterial.color.setHex(primaryColor);

            // Waypoint orbs (ref-repo pattern: show/hide pool objects)
            for (let i = 0; i < MAX_ORBS; i++) {
                if (i < points.length) {
                    orbPool[i].position.copy(points[i]);
                    orbPool[i].position.y = 0.05 + Math.sin(t * 2 + i * 0.8) * 0.04;
                    orbPool[i].visible = true;
                    orbPool[i].material.color.setHex(primaryColor);
                    orbPool[i].material.emissive.setHex(emissiveColor);
                } else {
                    orbPool[i].visible = false;
                }
            }

            // ── Position arrow at first waypoint ahead ──────────────────────────
            if (points.length >= 2) {
                const nextPt = points[1]; // first waypoint after current
                arrowGroup.position.set(nextPt.x, 0.6 + Math.sin(t * 1.5) * 0.12, nextPt.z);

                // Point arrow toward next waypoint direction
                const dir = new THREE.Vector3(nextPt.x, 0, nextPt.z).normalize();
                const angle = Math.atan2(dir.x, dir.z);
                arrowGroup.rotation.y = angle;
                arrowGroup.rotation.z = 0; // keep upright

                // Pulse glow opacity
                arrowConeGlow.material.opacity = 0.15 + Math.sin(t * 3) * 0.12;
                arrowConeGlow.material.color.setHex(primaryColor);
            }

            arrowGroup.visible = true;
            labelSprite.visible = !!destination;
        } else {
            // No route — hide everything
            pathLine.visible = false;
            orbPool.forEach(o => { o.visible = false; });
            arrowGroup.visible = false;
            labelSprite.visible = false;
        }

        // ── Update destination label ────────────────────────────────────────────
        if (destination && labelSprite.visible) {
            updateLabel(destination.name, _isEmergency);
            if (route?.waypoints?.length >= 2) {
                const pts = waypointsToWorld(route.waypoints);
                const next = pts[1];
                labelSprite.position.set(next.x, 1.6 + Math.sin(t * 1.5) * 0.12, next.z);
            }
        }

        renderer.render(scene, camera);
    }

    loop();
}

// ─────────────────────────────────────────────────────────────────────────────
// stopARLoop — cancel animation
// ─────────────────────────────────────────────────────────────────────────────
export function stopARLoop() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// destroyARThreeScene — full teardown
// ─────────────────────────────────────────────────────────────────────────────
export function destroyARThreeScene() {
    stopARLoop();
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
    }
    scene = null;
    camera = null;
    arGroup = null;
    pathLine = null;
    arrowGroup = null;
    labelSprite = null;
    orbPool.length = 0;
    _initialized = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert 2D map waypoints (in indoorMap.js coordinate space) to 3D world
 * positions as seen from the phone camera directly in front.
 *
 * The reference repo uses camera.position directly (WebXR gives real 6DOF pose).
 * We don't have that, so we project the waypoints onto a forward-facing plane
 * at fixed distances from the camera, scaled to feel natural in AR.
 */
function waypointsToWorld(waypoints) {
    if (!waypoints || waypoints.length === 0) return [];

    // Map coordinate scale → meters in front of camera
    // The map uses 0-160 X, 0-150 Y; we compress this to 1-8 m in front
    const MAP_SCALE = 0.05;  // 1 map unit ≈ 0.05 m in 3D
    const BASE_Z = -1.5;     // start 1.5 m in front of camera

    // The first waypoint is "current location"; anchor it at origin
    const origin = waypoints[0];

    return waypoints.map((wp, i) => {
        const relX = (wp.x - origin.x) * MAP_SCALE;
        const relY = (wp.y - origin.y) * MAP_SCALE;
        // Spread waypoints progressively further from camera
        const z = BASE_Z - i * 0.8;
        return new THREE.Vector3(relX, 0, z + relY * 0.3);
    });
}

/**
 * Draw destination label text onto the label canvas texture (canvas→THREE.Sprite).
 */
function updateLabel(name, isEmergency) {
    if (!labelCanvas) return;
    const ctx = labelCanvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);

    // Background pill
    ctx.fillStyle = isEmergency ? 'rgba(127,29,29,0.9)' : 'rgba(0,20,60,0.85)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 108, 20);
    ctx.fill();

    // Border
    ctx.strokeStyle = isEmergency ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Icon + Name
    ctx.fillStyle = isEmergency ? '#fca5a5' : '#e0f2fe';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((isEmergency ? '🚨 ' : '📍 ') + name, 256, 64);

    labelTexture.needsUpdate = true;
}
