"use client";
import { useRef, useEffect } from "react";

export default function RadarChart({ labels, values, overlayValues, pointColors, maxValue, hideValues = false }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w, h) / 2 - 40; // Reduced margin slightly

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
            ctx.strokeStyle = "#ed8936"; // Orange
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();

            // Subtle fill for priority
            // ctx.fillStyle = "rgba(237, 137, 54, 0.05)";
            // ctx.fill();
            ctx.restore();
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

            ctx.fillStyle = "rgba(49, 130, 206, 0.4)"; // Blue translucent
            ctx.fill();

            ctx.strokeStyle = "#3182ce";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw Points (Colored by Logic if provided)
            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const val = values[i] || 0;
                const frac = val / maxValue;
                const x = cx + R * frac * Math.cos(angle);
                const y = cy + R * frac * Math.sin(angle);

                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2 * Math.PI); // Slightly larger
                // Default blue if no color provided
                ctx.fillStyle = (pointColors && pointColors[i]) ? pointColors[i] : "#3182ce";
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Labels
        ctx.fillStyle = "#2d3748";
        ctx.font = "12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    } else {
        ctx.fillText(labels[i], lx, ly);
    }
        }

// Score values
if (!hideValues) {
    ctx.fillStyle = "#2c5282";
    ctx.font = "700 11px 'Inter', sans-serif";
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const frac = (values[i] || 0) / maxValue;
        const x = cx + R * frac * Math.cos(angle);
        const y = cy + R * frac * Math.sin(angle);
        ctx.fillText(`${values[i]}/${maxValue}`, x, y - 14);
    }
}
    }, [labels, values, overlayValues, maxValue, hideValues]);

return (
    <canvas
        ref={canvasRef}
        className="radar-canvas"
        role="img"
        aria-label="Radar chart showing organization profile"
    />
);
}
