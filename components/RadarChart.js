"use client";
import { useRef, useEffect } from "react";

export default function RadarChart({ labels, values, maxValue, hideValues = false }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const W = 800;
        const H = 500; // Increased height for better fit
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = "100%";
        canvas.style.height = "100%"; // Allow height to be controlled by container
        canvas.style.objectFit = "contain";

        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);

        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(cx, cy) - 110;
        const n = labels.length;
        const angleStep = (2 * Math.PI) / n;
        const startAngle = -Math.PI / 2;



        // Grid rings
        const rings = [0.25, 0.5, 0.75, 1.0];
        for (const frac of rings) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(60,60,60,0.12)";
            ctx.lineWidth = 1;
            for (let i = 0; i <= n; i++) {
                const angle = startAngle + (i % n) * angleStep;
                const x = cx + R * frac * Math.cos(angle);
                const y = cy + R * frac * Math.sin(angle);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Axis lines
        ctx.strokeStyle = "rgba(60,60,60,0.15)";
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
            ctx.stroke();
        }

        // Data polygon
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        gradient.addColorStop(0, "rgba(44, 82, 130, 0.30)");
        gradient.addColorStop(1, "rgba(44, 82, 130, 0.08)");

        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            const frac = (values[i] || 0) / maxValue;
            const x = cx + R * frac * Math.cos(angle);
            const y = cy + R * frac * Math.sin(angle);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(44, 82, 130, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Data points
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            const frac = (values[i] || 0) / maxValue;
            const x = cx + R * frac * Math.cos(angle);
            const y = cy + R * frac * Math.sin(angle);
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "#2c5282";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Labels
        ctx.fillStyle = "#3c3c3c";
        ctx.font = "600 12px 'Inter', sans-serif";
        ctx.textBaseline = "middle";
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Dynamic alignment based on side
            if (Math.abs(cos) < 0.1) ctx.textAlign = "center";
            else if (cos > 0) ctx.textAlign = "left";
            else ctx.textAlign = "right";

            const lx = cx + (R + 30) * cos;
            const ly = cy + (R + 30) * sin;

            const words = labels[i].split(" ");
            if (words.length >= 2) {
                const mid = Math.ceil(words.length / 2);
                ctx.fillText(words.slice(0, mid).join(" "), lx, ly - 7);
                ctx.fillText(words.slice(mid).join(" "), lx, ly + 7);
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
    }, [labels, values, maxValue, hideValues]);

    return (
        <canvas
            ref={canvasRef}
            className="radar-canvas"
            role="img"
            aria-label="Radar chart showing domain scores"
        />
    );
}
