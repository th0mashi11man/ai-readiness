"use client";
import { useRef, useEffect } from "react";

export default function RadarChart({ labels, values, overlayValues, pointColors, maxValue, hideValues = false }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        // Use container dimensions if possible, but for canvas drawing we need explicit size.
        // We'll assume a coordinate space of 800x500 for drawing logic, scaled by DPR.
        const W = 800;
        const H = 550;

        canvas.width = W * dpr;
        canvas.height = H * dpr;

        // CSS size (responsiveness handled by CSS "width: 100%")
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.aspectRatio = `${W}/${H}`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.scale(dpr, dpr);

        const w = W;
        const h = H;
        const cx = w / 2;
        const cy = h / 2;
        // Radius: fit within the canvas with padding for labels
        const R = Math.min(w, h) / 2 - 60;

        if (!labels || labels.length === 0) return;

        const n = labels.length;
        const angleStep = (2 * Math.PI) / n;
        const startAngle = -Math.PI / 2; // Up

        ctx.clearRect(0, 0, w, h);

        // Draw background circles
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1;
        for (let r = 0.2; r <= 1.0; r += 0.2) {
            ctx.beginPath();
            ctx.arc(cx, cy, R * r, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = "#cbd5e0";
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
            ctx.stroke();
        }

        // Draw Overlay (Priorities) first
        if (overlayValues && overlayValues.length === n) {
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const val = overlayValues[i] || 0;
                const frac = val / maxValue;
                const x = cx + R * frac * Math.cos(angle);
                const y = cy + R * frac * Math.sin(angle);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.save();
            ctx.strokeStyle = "#00A29A"; // Orange
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            // Optional fill
            // ctx.fillStyle = "rgba(237, 137, 54, 0.05)";
            // ctx.fill();
            ctx.restore();

            // Draw overlay points (small orange dots)
            /*
            ctx.fillStyle = "#00A29A";
            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const val = overlayValues[i] || 0;
                const frac = val / maxValue;
                const x = cx + R * frac * Math.cos(angle);
                const y = cy + R * frac * Math.sin(angle);
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
            */
        }

        // Draw Main Data Polygon (Blue fill)
        if (values && values.length === n) {
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const val = values[i] || 0;
                const frac = val / maxValue;
                const x = cx + R * frac * Math.cos(angle);
                const y = cy + R * frac * Math.sin(angle);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();

            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            gradient.addColorStop(0, "rgba(49, 130, 206, 0.4)");
            gradient.addColorStop(1, "rgba(49, 130, 206, 0.1)");
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = "#3182ce";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Points (Colored by Logic if provided)
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#fff";

            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const val = values[i] || 0;
                const frac = val / maxValue;
                const x = cx + R * frac * Math.cos(angle);
                const y = cy + R * frac * Math.sin(angle);

                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2 * Math.PI);
                // Color from props or default blue
                ctx.fillStyle = (pointColors && pointColors[i]) ? pointColors[i] : "#3182ce";
                ctx.fill();
                ctx.stroke();
            }
        }

        // Labels
        ctx.fillStyle = "#2d3748";
        ctx.font = "600 13px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";

        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            const labelR = R + 25;
            const x = cx + labelR * Math.cos(angle);
            const y = cy + labelR * Math.sin(angle);

            // Adjust alignment slightly based on position
            /*
            if (angle > -Math.PI/2 && angle < Math.PI/2) ctx.textAlign = "left";
            else if (angle === -Math.PI/2 || angle === Math.PI/2) ctx.textAlign = "center";
            else ctx.textAlign = "right";
            */

            ctx.fillText(labels[i], x, y);

            ctx.fillText(labels[i], x, y);

            // Draw values if not hidden
            // User requested removal of numerical scores from the chart
            /*
            if (!hideValues && values && values[i] !== undefined) {
                ctx.fillStyle = "#4a5568";
                ctx.font = "normal 11px Inter, system-ui, sans-serif";
                ctx.fillText(`${Math.round(values[i])}%`, x, y + 15);
                ctx.fillStyle = "#2d3748"; // Reset for next label
                ctx.font = "600 13px Inter, system-ui, sans-serif";
            }
            */
        }

    }, [labels, values, overlayValues, pointColors, maxValue, hideValues]);

    return (
        <canvas
            ref={canvasRef}
            className="radar-canvas"
            role="img"
            aria-label="Radar chart showing organization profile"
            style={{ width: "100%", height: "auto", display: "block" }}
        />
    );
}
