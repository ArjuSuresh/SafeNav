import React, { useEffect, useRef } from 'react';
import { getGraph, getLocationById } from '../data/indoorMap';
import './FloorPlan.css';

function FloorPlan({ currentLocation, destination, route }) {
  const canvasRef = useRef(null);

  // utility for multi-line text inside width
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = 600;

    canvas.width = width;
    canvas.height = height;

    // dark base
    ctx.fillStyle = 'var(--bg-main)';
    ctx.fillRect(0, 0, width, height);

    // header
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SRI ABHINAVA VIDYATIRTHA BLOCK', width / 2, 40);

    // live badge
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(width - 180, 10, 170, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '14px "Outfit", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Live Positioning', width - 15, 30);

    // Scale factors
    const scaleX = width / 180;
    const scaleY = height / 160;
    const graph = getGraph();
    const locations = graph.getAllNodes();

    // corridors
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 20;
    locations.forEach(loc => {
      const neighbors = graph.getNeighbors(loc.id);
      neighbors.forEach(neighbor => {
        const nloc = getLocationById(neighbor.to);
        if (nloc) {
          ctx.beginPath();
          ctx.moveTo(loc.x * scaleX, loc.y * scaleY);
          ctx.lineTo(nloc.x * scaleX, nloc.y * scaleY);
          ctx.stroke();
        }
      });
    });

    // helper for colors
    const getColor = (loc) => {
      const n = loc.name.toLowerCase();
      if (n.includes('lab')) return '#3b82f6';
      if (n.includes('lecture hall')) return '#facc15';
      if (n.includes('faculty')) return '#10b981';
      if (n.includes('stairs')) return '#8b5cf6';
      if (n.includes('hod')) return '#ef4444';
      if (n.includes('toilet')) return '#f97316';
      return '#6b7280';
    };

    // draw rooms
    locations.forEach(loc => {
      const x = loc.x * scaleX;
      const y = loc.y * scaleY;
      const w = 60;
      const h = 40;
      let color = getColor(loc);
      if (currentLocation && loc.id === currentLocation.id) color = '#00ff00';
      else if (destination && loc.id === destination.id) color = '#ffaa00';
      else if (loc.isExit) color = '#ff4444'; // Red for emergency exits
      ctx.fillStyle = color;
      ctx.fillRect(x - w/2, y - h/2, w, h);
      ctx.strokeStyle = '#00000022';
      ctx.strokeRect(x - w/2, y - h/2, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      wrapText(ctx, loc.name, x, y - h/2 + 12, w - 4, 12);
    });

    // helper to draw a star shape at a point
    const drawStar = (cx, cy, spikes, outerRadius, innerRadius, color) => {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    // route path and stars on each node
    if (route && route.path && route.path.length > 0) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 6;

      // draw path lines
      for (let i = 1; i < route.path.length; i++) {
        const p1 = getLocationById(route.path[i-1]);
        const p2 = getLocationById(route.path[i]);
        if (!p1 || !p2) continue;
        const x1 = p1.x * scaleX;
        const y1 = p1.y * scaleY;
        const x2 = p2.x * scaleX;
        const y2 = p2.y * scaleY;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // arrowhead
        const headlen = 12;
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(ang - Math.PI/6), y2 - headlen * Math.sin(ang - Math.PI/6));
        ctx.lineTo(x2 - headlen * Math.cos(ang + Math.PI/6), y2 - headlen * Math.sin(ang + Math.PI/6));
        ctx.closePath();
        ctx.fillStyle = '#00ff00';
        ctx.fill();
      }

      // draw star at each waypoint including start and end
      route.path.forEach((nodeId, idx) => {
        const loc = getLocationById(nodeId);
        if (!loc) return;
        const x = loc.x * scaleX;
        const y = loc.y * scaleY;
        drawStar(x, y, 5, 10, 5, '#ff0');
      });
    }
  }, [currentLocation, destination, route]);

  return (
    <div className="floor-plan-container">
      <h3>Floor Plan</h3>
      <canvas ref={canvasRef} className="floor-plan-canvas"></canvas>
    </div>
  );
}

export default FloorPlan;
