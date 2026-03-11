/**
 * ARThreeScene.js — Google Maps Live View-style AR navigation overlay.
 *
 * Renders a transparent Three.js canvas on top of the live camera feed:
 *
 *  1. BLUE PATH RIBBON  — Wide semi-transparent ground carpet following the route
 *  2. WHITE CHEVRONS    — Bold V-arrows on the path pointing direction of travel
 *  3. SMOOTH COMPASS    — Low-pass filtered heading for buttery rotation
 *  4. DISTANCE RING     — Pulsing blue dot at the user's feet
 *  5. DESTINATION LABEL  — Floating name sprite ahead of the user
 *
 * Inspired by Google Maps AR Live View navigation.
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

// Path ribbon (wide blue ground carpet)
let pathRibbon = null;
let pathRibbonMaterial = null;

// Path edge lines
let pathEdgeLeft = null;
let pathEdgeRight = null;
let edgeLineMaterial = null;

// Chevron arrow pool
const MAX_CHEVRONS = 15;
const chevronPool = [];
let chevronBaseGeo = null;

// User position indicator
let distanceRing = null;
let innerDot = null;

// Destination label sprite
let labelCanvas = null;
let labelTexture = null;
let labelSprite = null;

// Main navigation directional arrow (Debug Task additions)
let mainArrowGroup = null;
let mainArrowMesh = null;

// Smooth heading
let _smoothedHeading = 0;
const HEADING_ALPHA = 0.12;

let _isEmergency = false;
let _initialized = false;

// Route cache — only rebuild geometry when path actually changes
let _cachedRouteKey = '';

// ─────────────────────────────────────────────────────────────────────────────
// init
// ─────────────────────────────────────────────────────────────────────────────
export function initARThreeScene(container) {
    if (_initialized) return;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(
        container.clientWidth || window.innerWidth,
        container.clientHeight || window.innerHeight,
    );
    renderer.setClearColor(0x000000, 0);

    const cvs = renderer.domElement;
    cvs.style.position = 'absolute';
    cvs.style.top = '0';
    cvs.style.left = '0';
    cvs.style.width = '100%';
    cvs.style.height = '100%';
    cvs.style.pointerEvents = 'none';
    cvs.style.zIndex = '5';
    container.appendChild(cvs);

    // Camera (eye-height)
    camera = new THREE.PerspectiveCamera(
        60,
        (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
        0.01, 200,
    );
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 0, -5);

    // Scene
    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 8, 4);
    scene.add(dir);

    arGroup = new THREE.Group();
    scene.add(arGroup);

    // ── Materials (reused) ──────────────────────────────────────────────────
    pathRibbonMaterial = new THREE.MeshBasicMaterial({
        color: 0x4285f4, transparent: true, opacity: 0.72,
        side: THREE.DoubleSide, depthWrite: false,
    });

    edgeLineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.35,
    });

    // ── Chevron pool ────────────────────────────────────────────────────────
    // Bold V-chevron shape matching the Google Maps reference
    const s = new THREE.Shape();
    s.moveTo(0, 0.25);     // tip
    s.lineTo(0.32, -0.12);     // right outer
    s.lineTo(0.19, -0.12);     // right inner
    s.lineTo(0, 0.06);     // inner notch
    s.lineTo(-0.19, -0.12);     // left inner
    s.lineTo(-0.32, -0.12);     // left outer
    s.closePath();

    chevronBaseGeo = new THREE.ShapeGeometry(s);

    for (let i = 0; i < MAX_CHEVRONS; i++) {
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0.92,
            side: THREE.DoubleSide, depthWrite: false,
        });
        const mesh = new THREE.Mesh(chevronBaseGeo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.visible = false;
        mesh.renderOrder = 5;
        chevronPool.push(mesh);
        arGroup.add(mesh);
    }

    // ── User position ring + dot ────────────────────────────────────────────
    const ringGeo = new THREE.RingGeometry(0.30, 0.44, 32);
    distanceRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: 0x4285f4, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
    }));
    distanceRing.rotation.x = -Math.PI / 2;
    distanceRing.position.y = 0.008;
    distanceRing.renderOrder = 2;
    arGroup.add(distanceRing);

    const dotGeo = new THREE.CircleGeometry(0.14, 24);
    innerDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({
        color: 0x4285f4, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
    }));
    innerDot.rotation.x = -Math.PI / 2;
    innerDot.position.y = 0.009;
    innerDot.renderOrder = 3;
    arGroup.add(innerDot);

    // ── Destination label ───────────────────────────────────────────────────
    labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTexture, transparent: true, depthTest: false,
    }));
    labelSprite.scale.set(2.0, 0.5, 1);
    labelSprite.renderOrder = 6;
    arGroup.add(labelSprite);

    // ── Main Directional Navigation Arrow (Debug Tasks Fix) ───────────────
    mainArrowGroup = new THREE.Group();
    
    // Use ConeGeometry for visible debugging and clear directionality
    const coneGeo = new THREE.ConeGeometry(0.2, 0.6, 16);
    coneGeo.rotateX(-Math.PI / 2); // align tip towards -Z

    mainArrowMesh = new THREE.Mesh(
        coneGeo,
        new THREE.MeshBasicMaterial({ color: 0x3b82f6, depthTest: false, transparent: true, opacity: 0.95 })
    );
    mainArrowMesh.renderOrder = 20;

    mainArrowGroup.add(mainArrowMesh);
    arGroup.add(mainArrowGroup); // IMPORTANT: Add to arGroup so it rotates with compass

    console.log("[AR Debug] Main directional arrow added to arGroup.");

    _initialized = true;

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
// Animation loop
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

        // ── Smooth heading ────────────────────────────────────────────────────
        let delta = rawHeading - _smoothedHeading;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        _smoothedHeading = (_smoothedHeading + delta * HEADING_ALPHA + 360) % 360;
        arGroup.rotation.y = -_smoothedHeading * (Math.PI / 180);

        const col = _isEmergency ? 0xef4444 : 0x4285f4;

        // ── User dot pulse ────────────────────────────────────────────────────
        if (distanceRing) {
            const p = 1.0 + Math.sin(t * 2) * 0.18;
            distanceRing.scale.set(p, p, 1);
            distanceRing.material.opacity = 0.3 + Math.sin(t * 2) * 0.2;
            distanceRing.material.color.setHex(col);
        }
        if (innerDot) innerDot.material.color.setHex(col);

        // ── Route visuals ─────────────────────────────────────────────────────
        if (route?.waypoints && route.waypoints.length > 1) {
            const pts = waypointsToFloor(route.waypoints);
            const routeKey = route.waypoints.map(w => w.id).join(',');

            // Rebuild geometry only when route changes
            if (routeKey !== _cachedRouteKey) {
                _cachedRouteKey = routeKey;
                rebuildPath(pts);
            }

            // Live colour updates (emergency toggle)
            if (pathRibbon) {
                pathRibbonMaterial.color.setHex(col);
                pathRibbon.visible = true;
            }
            if (pathEdgeLeft) pathEdgeLeft.visible = true;
            if (pathEdgeRight) pathEdgeRight.visible = true;

            placeChevrons(pts, t);
            labelSprite.visible = !!destination;
        } else {
            hideAll();
        }

        // ── Label position ────────────────────────────────────────────────────
        if (destination && labelSprite.visible) {
            updateLabel(destination.name, _isEmergency);
            if (route?.waypoints?.length >= 2) {
                const pts = waypointsToFloor(route.waypoints);
                // Find the first waypoint that is physically far enough ahead to point at
                let targetIdx = 1;
                let next = pts[Math.min(targetIdx, pts.length - 1)];
                while (targetIdx < pts.length - 1 && new THREE.Vector3().subVectors(next, pts[0]).length() < 0.5) {
                    targetIdx++;
                    next = pts[targetIdx];
                }
                
                const d = Math.min(Math.sqrt(next.x ** 2 + next.z ** 2), 3.5);
                const dv_label = new THREE.Vector3(next.x, 0, next.z);
                if (dv_label.length() > 0.001) dv_label.normalize(); else dv_label.set(0, 0, -1);
                labelSprite.position.set(dv_label.x * d, 1.0 + Math.sin(t * 1.5) * 0.06, dv_label.z * d);
                
                // ── Main Arrow Logic (Debug Tasks - Navigation update) ────────
                if (mainArrowGroup) {
                    mainArrowGroup.visible = true;
                    mainArrowMesh.material.color.setHex(col);
                    
                    // Calculate direction from user (0,0,0 in arGroup) to next waypoint
                    const origin = pts[0];
                    const dv = new THREE.Vector3().subVectors(next, origin);
                    dv.y = 0;
                    if (dv.length() > 0.001) {
                        dv.normalize();
                    } else {
                        dv.set(0, 0, -1);
                    }
                    
                    // Position arrow slightly in front of user (0.8 units) and above ground
                    mainArrowGroup.position.set(
                        origin.x + dv.x * 0.8,
                        0.3, // Y = 0.3 above floor
                        origin.z + dv.z * 0.8
                    );
                    
                    // Align direction using angle calculation (since lookAt can behave weirdly in nested groups)
                    // The arrow geometry points towards -Z, so we rotate Y axis to align -Z with dv
                    mainArrowGroup.rotation.y = Math.atan2(dv.x, dv.z) + Math.PI;
                    mainArrowGroup.rotation.x = 0; // Ensure it stays flat relative to floor
                    mainArrowGroup.rotation.z = 0;
                    
                    // Normalize scale to make it clearly visible relative to path
                    const s = 1.5 + Math.sin(t * 4) * 0.2;
                    mainArrowGroup.scale.set(s, s, s);
                    
                    // Periodic log vector calculations
                    if (Math.floor(t * 60) % 120 === 0) {
                        console.log(`[AR Debug] Main Arrow Loop:`);
                        console.log(`  Pos: x=${mainArrowGroup.position.x.toFixed(2)}, y=${mainArrowGroup.position.y.toFixed(2)}, z=${mainArrowGroup.position.z.toFixed(2)}`);
                        console.log(`  Rot: y=${(mainArrowGroup.rotation.y * 180 / Math.PI).toFixed(1)}°`);
                        console.log(`  Scale: ${s.toFixed(2)}`);
                        console.log(`  Target: x=${next.x.toFixed(2)}, z=${next.z.toFixed(2)}`);
                    }
                }
            }
        }

        renderer.render(scene, camera);
    }
    loop();
}

// ─────────────────────────────────────────────────────────────────────────────
// rebuildPath — blue ribbon + white edge lines (only called on route change)
// ─────────────────────────────────────────────────────────────────────────────
function rebuildPath(points) {
    // Remove old
    [pathRibbon, pathEdgeLeft, pathEdgeRight].forEach(o => {
        if (o) { arGroup.remove(o); o.geometry.dispose(); }
    });
    pathRibbon = pathEdgeLeft = pathEdgeRight = null;
    if (points.length < 2) return;

    const W = 0.9;          // path width in world units (~0.9 m)
    const hw = W / 2;
    const leftPts = [];
    const rightPts = [];
    const verts = [];
    const idxs = [];

    for (let i = 0; i < points.length; i++) {
        const c = points[i];
        let d;
        if (i === 0) d = new THREE.Vector3().subVectors(points[1], points[0]);
        else if (i === points.length - 1) d = new THREE.Vector3().subVectors(points[i], points[i - 1]);
        else {
            const a = new THREE.Vector3().subVectors(points[i], points[i - 1]).normalize();
            const b = new THREE.Vector3().subVectors(points[i + 1], points[i]).normalize();
            d = new THREE.Vector3().addVectors(a, b);
        }
        d.y = 0;
        if (d.length() < 0.001) d.set(0, 0, -1);
        d.normalize();
        const perp = new THREE.Vector3(-d.z, 0, d.x);

        const L = new THREE.Vector3(c.x + perp.x * hw, 0.012, c.z + perp.z * hw);
        const R = new THREE.Vector3(c.x - perp.x * hw, 0.012, c.z - perp.z * hw);
        leftPts.push(L);
        rightPts.push(R);

        verts.push(L.x, L.y, L.z, R.x, R.y, R.z);
        if (i < points.length - 1) {
            const vi = i * 2;
            idxs.push(vi, vi + 2, vi + 1, vi + 1, vi + 2, vi + 3);
        }
    }

    // Ribbon mesh
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    pathRibbon = new THREE.Mesh(geo, pathRibbonMaterial);
    pathRibbon.renderOrder = 2;
    arGroup.add(pathRibbon);

    // Edge lines (thin white borders)
    const raise = p => new THREE.Vector3(p.x, 0.016, p.z);
    pathEdgeLeft = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(leftPts.map(raise)), edgeLineMaterial,
    );
    pathEdgeRight = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rightPts.map(raise)), edgeLineMaterial,
    );
    pathEdgeLeft.renderOrder = 3;
    pathEdgeRight.renderOrder = 3;
    arGroup.add(pathEdgeLeft);
    arGroup.add(pathEdgeRight);
}

// ─────────────────────────────────────────────────────────────────────────────
// placeChevrons — position white V-arrows along the path with wave animation
// ─────────────────────────────────────────────────────────────────────────────
function placeChevrons(points, t) {
    if (points.length < 2) { chevronPool.forEach(c => { c.visible = false; }); return; }

    // Build segment list
    const segs = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const len = points[i].distanceTo(points[i + 1]);
        segs.push({ s: points[i], e: points[i + 1], len, cum: total });
        total += len;
    }

    const spacing = Math.max(0.70, total / MAX_CHEVRONS);
    let ci = 0;

    for (let dist = 0.35; dist < total && ci < MAX_CHEVRONS; dist += spacing) {
        // Find segment
        let seg = segs[segs.length - 1];
        for (const ss of segs) {
            if (dist >= ss.cum && dist < ss.cum + ss.len) { seg = ss; break; }
        }
        const frac = (dist - seg.cum) / seg.len;
        const pos = new THREE.Vector3().lerpVectors(seg.s, seg.e, frac);
        const dv = new THREE.Vector3().subVectors(seg.e, seg.s).normalize();
        const ang = Math.atan2(dv.x, dv.z);

        const chev = chevronPool[ci];
        chev.position.set(pos.x, 0.022, pos.z);
        chev.rotation.set(-Math.PI / 2, 0, -ang);

        // Flowing wave animation — brightness travels along the path
        const wave = Math.sin(t * 2.5 - (dist / total) * Math.PI * 4);
        const scale = 1.0 + wave * 0.06;
        chev.scale.set(scale, scale, 1);
        chev.material.opacity = 0.65 + wave * 0.30;
        chev.visible = true;
        ci++;
    }

    for (let i = ci; i < MAX_CHEVRONS; i++) chevronPool[i].visible = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// hideAll
// ─────────────────────────────────────────────────────────────────────────────
function hideAll() {
    if (pathRibbon) pathRibbon.visible = false;
    if (pathEdgeLeft) pathEdgeLeft.visible = false;
    if (pathEdgeRight) pathEdgeRight.visible = false;
    chevronPool.forEach(c => { c.visible = false; });
    labelSprite.visible = false;
    if (mainArrowGroup) mainArrowGroup.visible = false;
    _cachedRouteKey = '';
}

// ─────────────────────────────────────────────────────────────────────────────
// stop / destroy
// ─────────────────────────────────────────────────────────────────────────────
export function stopARLoop() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
}

export function destroyARThreeScene() {
    stopARLoop();
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement?.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer = null;
    }
    // Dispose rebuild-able geometry
    [pathRibbon, pathEdgeLeft, pathEdgeRight].forEach(o => {
        if (o) o.geometry.dispose();
    });
    scene = camera = arGroup = null;
    pathRibbon = pathEdgeLeft = pathEdgeRight = null;
    distanceRing = innerDot = null;
    labelSprite = null;
    
    if (mainArrowMesh) mainArrowMesh.geometry.dispose();
    mainArrowGroup = mainArrowMesh = null;
    
    chevronPool.length = 0;
    _smoothedHeading = 0;
    _cachedRouteKey = '';
    _initialized = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// waypointsToFloor — convert 2D map coords → 3D floor-plane positions
// ─────────────────────────────────────────────────────────────────────────────
function waypointsToFloor(waypoints) {
    if (!waypoints || waypoints.length === 0) return [];

    const MAP_SCALE = 0.08;        // 1 map-unit ≈ 0.08 m in 3D
    const origin = waypoints[0];

    return waypoints.map(wp => {
        const rx = (wp.x - origin.x) * MAP_SCALE;
        const rz = (wp.y - origin.y) * -MAP_SCALE;   // -Z = forward
        return new THREE.Vector3(rx, 0.012, rz);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// updateLabel — draw destination name onto canvas texture
// ─────────────────────────────────────────────────────────────────────────────
function updateLabel(name, emergency) {
    if (!labelCanvas) return;
    const ctx = labelCanvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);

    ctx.fillStyle = emergency ? 'rgba(127,29,29,0.92)' : 'rgba(15,23,42,0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 108, 20);
    ctx.fill();

    ctx.strokeStyle = emergency ? '#ef4444' : '#4285f4';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = emergency ? '#fca5a5' : '#e0f2fe';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = emergency ? '🚨 EXIT: ' : '📍 ';
    ctx.fillText((icon + (name || '')).substring(0, 28), 256, 64);
    labelTexture.needsUpdate = true;
}
