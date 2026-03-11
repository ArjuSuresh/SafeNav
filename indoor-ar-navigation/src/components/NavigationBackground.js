import React, { useRef, useEffect } from 'react';

/**
 * NavigationBackground — Subtle animated canvas background for the homepage.
 *
 * Renders faint navigation paths with location markers and a glowing arrow
 * that travels between them, matching the purple (#8E7692) color palette.
 * Low opacity so it doesn't interfere with foreground content.
 */
function NavigationBackground({ variant = 'home' }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animId;
        let t = 0;

        // Resize canvas to fill the viewport exactly
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        // Re-check size periodically since scrollHeight can change after render
        const resizeInterval = setInterval(resize, 1000);
        window.addEventListener('resize', resize);

        // ── Define multiple navigation routes ────────────────────────────
        // Each route has waypoints (x%, y%) relative to canvas size
        const routes = [
            {
                label: ['Library', 'Lecture Hall'],
                points: [
                    { x: 0.08, y: 0.15 },
                    { x: 0.22, y: 0.18 },
                    { x: 0.35, y: 0.12 },
                    { x: 0.48, y: 0.20 },
                ],
                speed: 0.003,
                offset: 0,
            },
            {
                label: ['Lab A', 'Exit'],
                points: [
                    { x: 0.55, y: 0.75 },
                    { x: 0.65, y: 0.65 },
                    { x: 0.78, y: 0.70 },
                    { x: 0.92, y: 0.60 },
                ],
                speed: 0.0025,
                offset: 0.33,
            },
            {
                label: ['Office', 'Cafeteria'],
                points: [
                    { x: 0.70, y: 0.20 },
                    { x: 0.80, y: 0.30 },
                    { x: 0.85, y: 0.42 },
                    { x: 0.92, y: 0.35 },
                ],
                speed: 0.0035,
                offset: 0.66,
            },
            {
                label: ['Entrance', 'Room 201'],
                points: [
                    { x: 0.05, y: 0.60 },
                    { x: 0.15, y: 0.50 },
                    { x: 0.25, y: 0.55 },
                    { x: 0.38, y: 0.48 },
                ],
                speed: 0.002,
                offset: 0.5,
            },
            {
                label: ['Block C', 'Seminar Hall'],
                points: [
                    { x: 0.30, y: 0.82 },
                    { x: 0.42, y: 0.78 },
                    { x: 0.50, y: 0.85 },
                    { x: 0.60, y: 0.90 },
                ],
                speed: 0.0028,
                offset: 0.15,
            },
        ];

        // If on the guide page, significantly shift the positions so it doesn't match the home page
        let activeRoutes = routes;
        if (variant === 'guide') {
            activeRoutes = [
                {
                    label: ['Stairs', 'Room 302'],
                    points: [
                        { x: 0.10, y: 0.85 },
                        { x: 0.15, y: 0.80 },
                        { x: 0.20, y: 0.88 },
                        { x: 0.28, y: 0.80 },
                    ],
                    speed: 0.002,
                    offset: 0.2,
                },
                {
                    label: ['Admin', 'Cafeteria'],
                    points: [
                        { x: 0.85, y: 0.25 },
                        { x: 0.78, y: 0.35 },
                        { x: 0.90, y: 0.40 },
                        { x: 0.80, y: 0.50 },
                    ],
                    speed: 0.0018,
                    offset: 0.6,
                },
                {
                    label: ['Exit A', 'Lobby'],
                    points: [
                        { x: 0.10, y: 0.25 },
                        { x: 0.18, y: 0.35 },
                        { x: 0.12, y: 0.45 },
                        { x: 0.25, y: 0.50 },
                    ],
                    speed: 0.0025,
                    offset: 0.4,
                },
                {
                    label: ['Hall B', 'Lab 2'],
                    points: [
                        { x: 0.85, y: 0.85 },
                        { x: 0.75, y: 0.90 },
                        { x: 0.65, y: 0.80 },
                        { x: 0.60, y: 0.90 },
                    ],
                    speed: 0.0015,
                    offset: 0.8,
                },
                {
                    label: ['Library', 'Archive'],
                    points: [
                        { x: 0.40, y: 0.15 },
                        { x: 0.50, y: 0.25 },
                        { x: 0.60, y: 0.12 },
                        { x: 0.65, y: 0.20 },
                    ],
                    speed: 0.0028,
                    offset: 0.1,
                },
            ];
        } else if (variant === 'about') {
            activeRoutes = [
                {
                    label: ['Main Gate', 'Security'],
                    points: [
                        { x: 0.85, y: 0.70 },
                        { x: 0.90, y: 0.60 },
                        { x: 0.95, y: 0.50 },
                        { x: 0.88, y: 0.40 },
                    ],
                    speed: 0.002,
                    offset: 0.3,
                },
                {
                    label: ['Restroom', 'Lounge'],
                    points: [
                        { x: 0.15, y: 0.20 },
                        { x: 0.25, y: 0.15 },
                        { x: 0.35, y: 0.25 },
                        { x: 0.45, y: 0.15 },
                    ],
                    speed: 0.0018,
                    offset: 0.7,
                },
                {
                    label: ['Emergency', 'Muster Point'],
                    points: [
                        { x: 0.10, y: 0.60 },
                        { x: 0.05, y: 0.70 },
                        { x: 0.15, y: 0.75 },
                        { x: 0.25, y: 0.70 },
                    ],
                    speed: 0.0025,
                    offset: 0.5,
                },
                {
                    label: ['Elevator', 'Store'],
                    points: [
                        { x: 0.55, y: 0.90 },
                        { x: 0.65, y: 0.95 },
                        { x: 0.75, y: 0.85 },
                        { x: 0.85, y: 0.95 },
                    ],
                    speed: 0.0015,
                    offset: 0.9,
                },
                {
                    label: ['IT Dept', 'Server Room'],
                    points: [
                        { x: 0.75, y: 0.15 },
                        { x: 0.85, y: 0.10 },
                        { x: 0.95, y: 0.20 },
                        { x: 0.88, y: 0.30 },
                    ],
                    speed: 0.0028,
                    offset: 0.2,
                },
            ];
        }

        // ── Helper: get point along a route at progress [0..1] ──────────
        function getPointOnRoute(route, progress, W, H) {
            const pts = route.points;
            const segCount = pts.length - 1;
            const rawIdx = progress * segCount;
            const idx = Math.min(Math.floor(rawIdx), segCount - 1);
            const frac = rawIdx - idx;

            const a = pts[idx];
            const b = pts[idx + 1];
            return {
                x: (a.x + (b.x - a.x) * frac) * W,
                y: (a.y + (b.y - a.y) * frac) * H,
            };
        }

        // ── Helper: draw a map pin marker (teardrop shape) ─────────────
        function drawMarker(ctx, x, y, size, isStart, pulse) {
            const s = size + pulse * 2;
            const pinColor = isStart
                ? 'rgba(72, 42, 65, 0.35)'
                : 'rgba(206, 178, 189, 0.30)';
            const innerColor = isStart
                ? 'rgba(87, 46, 84, 0.5)'
                : 'rgba(226, 210, 200, 0.45)';
            const dotColor = isStart
                ? 'rgba(142, 118, 146, 0.6)'
                : 'rgba(226, 210, 200, 0.6)';

            ctx.save();
            ctx.translate(x, y);

            // Shadow/glow under pin
            ctx.beginPath();
            ctx.ellipse(0, s * 0.3, s * 0.4, s * 0.15, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(42, 17, 40, 0.12)';
            ctx.fill();

            // Pin body (teardrop: circle on top + pointed bottom)
            ctx.beginPath();
            // Start at the bottom point
            ctx.moveTo(0, s * 0.2);
            // Left curve up to the circle
            ctx.bezierCurveTo(
                -s * 0.7, -s * 0.3,
                -s * 0.7, -s * 1.2,
                0, -s * 1.2
            );
            // Right curve back down to the point
            ctx.bezierCurveTo(
                s * 0.7, -s * 1.2,
                s * 0.7, -s * 0.3,
                0, s * 0.2
            );
            ctx.closePath();
            ctx.fillStyle = pinColor;
            ctx.fill();

            // Outline
            ctx.strokeStyle = isStart
                ? 'rgba(42, 17, 40, 0.25)'
                : 'rgba(142, 118, 146, 0.20)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Inner circle (hole in the pin)
            ctx.beginPath();
            ctx.arc(0, -s * 0.55, s * 0.28, 0, Math.PI * 2);
            ctx.fillStyle = innerColor;
            ctx.fill();

            // Center dot
            ctx.beginPath();
            ctx.arc(0, -s * 0.55, s * 0.12, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.fill();

            ctx.restore();
        }

        // ── Helper: draw navigation arrow ───────────────────────────────
        function drawArrow(ctx, x, y, angle, size) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Arrow body (chevron)
            ctx.beginPath();
            ctx.moveTo(size, 0);
            ctx.lineTo(-size * 0.6, -size * 0.5);
            ctx.lineTo(-size * 0.3, 0);
            ctx.lineTo(-size * 0.6, size * 0.5);
            ctx.closePath();
            ctx.fillStyle = 'rgba(226, 210, 200, 0.3)';
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(206, 178, 189, 0.06)';
            ctx.fill();

            ctx.restore();
        }

        // ── Main draw loop ──────────────────────────────────────────────
        function draw() {
            animId = requestAnimationFrame(draw);
            t += 0.016;

            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            for (const route of activeRoutes) {
                const pts = route.points;

                // Draw dashed path line
                ctx.setLineDash([6, 8]);
                ctx.strokeStyle = 'rgba(72, 42, 65, 0.30)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < pts.length; i++) {
                    const px = pts[i].x * W;
                    const py = pts[i].y * H;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw waypoint dots (small)
                for (let i = 1; i < pts.length - 1; i++) {
                    const px = pts[i].x * W;
                    const py = pts[i].y * H;
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(87, 46, 84, 0.15)';
                    ctx.fill();
                }

                // Draw start and end markers
                const pulse = Math.sin(t * 1.5 + route.offset * 10) * 0.5 + 0.5;
                const startX = pts[0].x * W;
                const startY = pts[0].y * H;
                const endX = pts[pts.length - 1].x * W;
                const endY = pts[pts.length - 1].y * H;

                drawMarker(ctx, startX, startY, 8, true, pulse);
                drawMarker(ctx, endX, endY, 8, false, pulse);

                // Draw labels (very faint)
                ctx.font = '10px Outfit, sans-serif';
                ctx.fillStyle = 'rgba(87, 46, 84, 0.18)';
                ctx.textAlign = 'center';
                ctx.fillText(route.label[0], startX, startY - 14);
                ctx.fillText(route.label[1], endX, endY - 14);

                // Animate arrow along path
                const progress = ((t * route.speed * 60 + route.offset) % 1);
                const arrowPos = getPointOnRoute(route, progress, W, H);

                // Calculate angle from direction of travel
                const nextProgress = Math.min(progress + 0.02, 0.99);
                const nextPos = getPointOnRoute(route, nextProgress, W, H);
                const angle = Math.atan2(nextPos.y - arrowPos.y, nextPos.x - arrowPos.x);

                drawArrow(ctx, arrowPos.x, arrowPos.y, angle, 10);

                // Trail behind arrow (fading dots)
                for (let i = 1; i <= 5; i++) {
                    const trailProgress = Math.max(0, progress - i * 0.03);
                    const trailPos = getPointOnRoute(route, trailProgress, W, H);
                    const alpha = 0.12 - i * 0.02;
                    ctx.beginPath();
                    ctx.arc(trailPos.x, trailPos.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(206, 178, 189, ${Math.max(0, alpha)})`;
                    ctx.fill();
                }
            }

            // ── Floating grid dots (subtle texture) ─────────────────────────
            const spacing = 60;
            for (let gx = spacing; gx < W; gx += spacing) {
                for (let gy = spacing; gy < H; gy += spacing) {
                    const drift = Math.sin(t * 0.5 + gx * 0.01 + gy * 0.01) * 1;
                    ctx.beginPath();
                    ctx.arc(gx + drift, gy + drift, 1, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(87, 46, 84, 0.06)';
                    ctx.fill();
                }
            }
        }

        draw();

        return () => {
            cancelAnimationFrame(animId);
            clearInterval(resizeInterval);
            window.removeEventListener('resize', resize);
        };
    }, [variant]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}

export default NavigationBackground;
