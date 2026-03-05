/**
 * ARThreeScene.js — Google-Maps-style AR navigation overlay.
 *
 * This module renders a transparent Three.js canvas on top of the live
 * camera feed. Key features:
 *
 *  1. FLOOR-PLANE ARROW — A flat directional chevron rendered at ground
 *     level that always points toward the next waypoint, rotating as
 *     the user turns their phone (like Google Maps Live View).
 *
 *  2. SMOOTH COMPASS — Low-pass filter on the compass heading to
 *     eliminate jitter and give buttery-smooth rotation.
 *
 *  3. PATH TRAIL — Dashed line from current position through all
 *     remaining waypoints, rendered on the floor plane.
 *
 *  4. WAYPOINT MARKERS — Glowing orbs at each waypoint along the path.
 *
 *  5. DESTINATION LABEL — Floating text sprite showing destination name.
 *
 * Inspired by FireDragonGameStudio/ARIndoorNavigation-Threejs.
 */

import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Module state
// ─────────────────────────────────────────────────────────────────────────────
let renderer = null;
let camera = null;
let scene = null;
let arGroup = null;
let animId = null;

// Path line
let pathLine = null;
let pathLineMaterial = null;

// Waypoint orb pool
const MAX_ORBS = 20;
const orbPool = [];

// Floor-plane arrow (chevron shape)
let floorArrow = null;
let floorArrowGlow = null;

// Distance ring (pulsing circle at user's feet)
let distanceRing = null;

// Destination label sprite
let labelCanvas = null;
let labelTexture = null;
let labelSprite = null;

// Smooth heading state
let _smoothedHeading = 0;
const HEADING_ALPHA = 0.15; // low-pass filter strength (lower = smoother)

let _isEmergency = false;
let _initialized = false;

// ─────────────────────────────────────────────────────────────────────────────
// init — create renderer, camera, scene, and all AR objects
// ─────────────────────────────────────────────────────────────────────────────
export function initARThreeScene(container) {
    if (_initialized) return;

    // ── Renderer ────────────────────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
        container.clientWidth || window.innerWidth,
        container.clientHeight || window.innerHeight,
    );
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false;

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '5';
    container.appendChild(canvas);

    // ── Camera ──────────────────────────────────────────────────────────────
    camera = new THREE.PerspectiveCamera(
        60,
        (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
        0.01,
        200,
    );
    camera.position.set(0, 1.6, 0); // eye height
    camera.lookAt(0, 0, -5);

    // ── Scene & lighting ───────────────────────────────────────────────────
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 8, 4);
    scene.add(dirLight);

    // ── AR Group (rotated by heading each frame) ────────────────────────────
    arGroup = new THREE.Group();
    scene.add(arGroup);

    // ── Floor-plane arrow (chevron shape — flat on the ground) ──────────────
    // This is the main Google-Maps-style directional indicator
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0.6);      // tip
    arrowShape.lineTo(-0.35, -0.2);
    arrowShape.lineTo(-0.15, -0.05);
    arrowShape.lineTo(0, -0.2);
    arrowShape.lineTo(0.15, -0.05);
    arrowShape.lineTo(0.35, -0.2);
    arrowShape.lineTo(0, 0.6);

    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    const arrowMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x2563eb,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
    });
    floorArrow = new THREE.Mesh(arrowGeo, arrowMat);
    floorArrow.rotation.x = -Math.PI / 2; // lay flat on ground
    floorArrow.position.set(0, 0.02, -2);
    floorArrow.renderOrder = 4;
    arGroup.add(floorArrow);

    // Glow ring under the arrow
    const glowGeo = new THREE.ShapeGeometry(arrowShape);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
    });
    floorArrowGlow = new THREE.Mesh(glowGeo, glowMat);
    floorArrowGlow.rotation.x = -Math.PI / 2;
    floorArrowGlow.position.set(0, 0.01, -2);
    floorArrowGlow.scale.set(1.4, 1.4, 1.4);
    floorArrowGlow.renderOrder = 3;
    arGroup.add(floorArrowGlow);

    // ── Distance ring (pulsing circle at user position) ─────────────────────
    const ringGeo = new THREE.RingGeometry(0.25, 0.35, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
    });
    distanceRing = new THREE.Mesh(ringGeo, ringMat);
    distanceRing.rotation.x = -Math.PI / 2;
    distanceRing.position.set(0, 0.01, 0);
    distanceRing.renderOrder = 2;
    arGroup.add(distanceRing);

    // ── Path line ──────────────────────────────────────────────────────────
    pathLineMaterial = new THREE.LineDashedMaterial({
        color: 0x3b82f6,
        linewidth: 2,
        dashSize: 0.3,
        gapSize: 0.15,
        transparent: true,
        opacity: 0.8,
    });
    const pathGeo = new THREE.BufferGeometry();
    pathLine = new THREE.Line(pathGeo, pathLineMaterial);
    pathLine.renderOrder = 2;
    arGroup.add(pathLine);

    // ── Waypoint orb pool ──────────────────────────────────────────────────
    const orbGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const orbMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.8,
    });
    for (let i = 0; i < MAX_ORBS; i++) {
        const orb = new THREE.Mesh(orbGeo, orbMat.clone());
        orb.visible = false;
        orb.renderOrder = 3;
        orbPool.push(orb);
        arGroup.add(orb);
    }

    // ── Destination label ──────────────────────────────────────────────────
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
    labelSprite.scale.set(2.0, 0.5, 1);
    labelSprite.position.set(0, 1.2, -2.5);
    labelSprite.renderOrder = 5;
    arGroup.add(labelSprite);

    _initialized = true;

    // Handle resize
    const onResize = () => {
        if (!renderer || !camera) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
}

// ─────────────────────────────────────────────────────────────────────────────
// startARLoop — main animation loop
// ─────────────────────────────────────────────────────────────────────────────
export function startARLoop(getHeading, getRoute, getDestination, isEmergencyFn) {
    if (!_initialized) return;
    let t = 0;

    function loop() {
        animId = requestAnimationFrame(loop);
        t += 0.016;
        _isEmergency = isEmergencyFn();

        const rawHeading = getHeading();
        const route = getRoute();
        const destination = getDestination();

        // ── Smooth compass heading (low-pass filter) ──────────────────────────
        // This eliminates compass jitter for a Google-Maps-smooth experience
        let delta = rawHeading - _smoothedHeading;
        // Handle wraparound (e.g., 359° → 1°)
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        _smoothedHeading = (_smoothedHeading + delta * HEADING_ALPHA + 360) % 360;

        // Rotate the entire AR scene by the smoothed heading
        arGroup.rotation.y = -_smoothedHeading * (Math.PI / 180);

        // Colours
        const primaryColor = _isEmergency ? 0xef4444 : 0x3b82f6;
        const emissiveColor = _isEmergency ? 0xb91c1c : 0x2563eb;
        const glowColor = _isEmergency ? 0xfca5a5 : 0x60a5fa;

        // ── Pulse the distance ring ──────────────────────────────────────────
        if (distanceRing) {
            const pulse = 1.0 + Math.sin(t * 2.0) * 0.15;
            distanceRing.scale.set(pulse, pulse, 1);
            distanceRing.material.opacity = 0.4 + Math.sin(t * 2.0) * 0.2;
            distanceRing.material.color.setHex(_isEmergency ? 0xef4444 : 0x10b981);
        }

        // ── Update path and arrow ────────────────────────────────────────────
        if (route?.waypoints && route.waypoints.length > 1) {
            const points = waypointsToFloor(route.waypoints);

            // Path line on the ground
            pathLine.geometry.dispose();
            pathLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
            pathLine.computeLineDistances(); // required for dashed lines
            pathLine.visible = true;
            pathLineMaterial.color.setHex(primaryColor);

            // Waypoint orbs (on the floor)
            for (let i = 0; i < MAX_ORBS; i++) {
                if (i < points.length) {
                    orbPool[i].position.copy(points[i]);
                    orbPool[i].position.y = 0.08 + Math.sin(t * 2.5 + i * 0.6) * 0.04;
                    orbPool[i].visible = true;
                    orbPool[i].material.color.setHex(primaryColor);
                    orbPool[i].material.emissive.setHex(emissiveColor);
                } else {
                    orbPool[i].visible = false;
                }
            }

            // ── Floor arrow — points toward next waypoint ───────────────────────
            if (points.length >= 2) {
                const nextPt = points[1];

                // Position arrow between user and next waypoint
                const arrowDist = Math.min(
                    Math.sqrt(nextPt.x * nextPt.x + nextPt.z * nextPt.z),
                    3.0 // max 3m in front
                );
                const dirToNext = new THREE.Vector3(nextPt.x, 0, nextPt.z).normalize();

                // Place the arrow on the ground plane
                floorArrow.position.set(
                    dirToNext.x * arrowDist,
                    0.03 + Math.sin(t * 1.2) * 0.02, // tiny hover above ground
                    dirToNext.z * arrowDist,
                );
                floorArrowGlow.position.copy(floorArrow.position);
                floorArrowGlow.position.y = 0.01;

                // Rotate arrow to face the direction of travel
                const angle = Math.atan2(dirToNext.x, dirToNext.z);
                floorArrow.rotation.set(-Math.PI / 2, 0, -angle);
                floorArrowGlow.rotation.set(-Math.PI / 2, 0, -angle);

                // Update colours
                floorArrow.material.color.setHex(primaryColor);
                floorArrow.material.emissive.setHex(emissiveColor);
                floorArrowGlow.material.color.setHex(glowColor);
                floorArrowGlow.material.opacity = 0.2 + Math.sin(t * 3) * 0.1;

                // Scale pulse
                const arrowPulse = 1.0 + Math.sin(t * 2.0) * 0.08;
                floorArrow.scale.set(arrowPulse, arrowPulse, 1);
            }

            floorArrow.visible = true;
            floorArrowGlow.visible = true;
            labelSprite.visible = !!destination;

        } else {
            // No route — hide everything
            pathLine.visible = false;
            orbPool.forEach(o => { o.visible = false; });
            floorArrow.visible = false;
            floorArrowGlow.visible = false;
            labelSprite.visible = false;
        }

        // ── Destination label ────────────────────────────────────────────────
        if (destination && labelSprite.visible) {
            updateLabel(destination.name, _isEmergency);
            if (route?.waypoints?.length >= 2) {
                const pts = waypointsToFloor(route.waypoints);
                const next = pts[1];
                const dist = Math.min(
                    Math.sqrt(next.x * next.x + next.z * next.z),
                    3.5
                );
                const dir = new THREE.Vector3(next.x, 0, next.z).normalize();
                labelSprite.position.set(
                    dir.x * dist,
                    1.0 + Math.sin(t * 1.5) * 0.06,
                    dir.z * dist,
                );
            }
        }

        renderer.render(scene, camera);
    }

    loop();
}

// ─────────────────────────────────────────────────────────────────────────────
// stopARLoop / destroyARThreeScene
// ─────────────────────────────────────────────────────────────────────────────
export function stopARLoop() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
}

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
    floorArrow = null;
    floorArrowGlow = null;
    distanceRing = null;
    labelSprite = null;
    orbPool.length = 0;
    _smoothedHeading = 0;
    _initialized = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert 2D map waypoints to 3D floor-plane positions.
 * Unlike the previous version, these positions are placed ON the ground
 * (y ≈ 0) spreading outward from the camera, mimicking how Google Maps
 * renders the path on the actual street.
 */
function waypointsToFloor(waypoints) {
    if (!waypoints || waypoints.length === 0) return [];

    const MAP_SCALE = 0.06;   // 1 map unit ≈ 0.06m in 3D
    const origin = waypoints[0];

    return waypoints.map((wp, i) => {
        const relX = (wp.x - origin.x) * MAP_SCALE;
        const relZ = -(wp.y - origin.y) * MAP_SCALE; // negative Z = forward
        // Spread waypoints progressively further to give depth perception
        const depthBias = -i * 0.6;
        return new THREE.Vector3(relX, 0.02, relZ + depthBias);
    });
}

/**
 * Draw destination label onto canvas texture.
 */
function updateLabel(name, isEmergency) {
    if (!labelCanvas) return;
    const ctx = labelCanvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);

    // Background pill
    ctx.fillStyle = isEmergency ? 'rgba(127,29,29,0.92)' : 'rgba(15,23,42,0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 108, 20);
    ctx.fill();

    // Border
    ctx.strokeStyle = isEmergency ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text
    ctx.fillStyle = isEmergency ? '#fca5a5' : '#e0f2fe';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icon = isEmergency ? '🚨 EXIT: ' : '📍 ';
    const text = icon + (name || '');
    ctx.fillText(text.substring(0, 28), 256, 64);

    labelTexture.needsUpdate = true;
}
