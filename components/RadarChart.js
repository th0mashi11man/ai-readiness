"use client";

// SVG radar chart. Rendered as SVG (not canvas) so it stays crisp in print /
// PDF export and exposes real DOM for accessibility.
export default function RadarChart({ labels, values, overlayValues, pointColors, maxValue = 100 }) {
    if (!labels || labels.length === 0) return null;

    const W = 800;
    const H = 550;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 60;

    const n = labels.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    const pointAt = (value, radiusFrac) => {
        const i = radiusFrac.index;
        const angle = startAngle + i * angleStep;
        const frac = Math.max(0, Math.min(1, (value || 0) / maxValue));
        return {
            x: cx + R * frac * Math.cos(angle),
            y: cy + R * frac * Math.sin(angle),
        };
    };

    const polygonPoints = (data) =>
        data
            .map((value, index) => {
                const pt = pointAt(value, { index });
                return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(" ");

    const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

    const axes = labels.map((_, i) => {
        const angle = startAngle + i * angleStep;
        return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
    });

    const labelPositions = labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const labelR = R + 25;
        return {
            label,
            x: cx + labelR * Math.cos(angle),
            y: cy + labelR * Math.sin(angle),
        };
    });

    const hasOverlay = Array.isArray(overlayValues) && overlayValues.length === n;
    const hasValues = Array.isArray(values) && values.length === n;

    const ariaSummary = labels
        .map((label, i) => `${label}: ${Math.round(values?.[i] ?? 0)}%`)
        .join(", ");

    return (
        <svg
            className="radar-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Radar chart showing organisation profile. ${ariaSummary}`}
            style={{ width: "100%", height: "auto", display: "block" }}
        >
            <title>Organisation profile</title>
            <defs>
                <radialGradient id="radar-fill" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
                    <stop offset="0%" stopColor="#468aac" stopOpacity="0.52" />
                    <stop offset="100%" stopColor="#a9cee0" stopOpacity="0.13" />
                </radialGradient>
            </defs>

            {/* Grid rings */}
            {rings.map((r) => (
                <circle key={r} cx={cx} cy={cy} r={R * r} fill="none" stroke="#e4e4e4" strokeWidth="1" />
            ))}

            {/* Axes */}
            {axes.map((a, i) => (
                <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="#e4e4e4" strokeWidth="1" />
            ))}

            {/* Target / priority polygon (dashed) */}
            {hasOverlay && (
                <polygon
                    points={polygonPoints(overlayValues)}
                    fill="none"
                    stroke="#00A29A"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                />
            )}

            {/* Current polygon (filled) */}
            {hasValues && (
                <>
                    <polygon points={polygonPoints(values)} fill="url(#radar-fill)" stroke="#3182ce" strokeWidth="2" />
                    {values.map((value, i) => {
                        const pt = pointAt(value, { index: i });
                        // Ignore non-literal colors (e.g. "var(--x)") — var() is not
                        // valid in SVG presentation attributes.
                        const raw = pointColors && pointColors[i];
                        const fill = typeof raw === "string" && !raw.includes("var(") ? raw : "#3182ce";
                        return (
                            <circle key={i} cx={pt.x} cy={pt.y} r="6" fill={fill} stroke="#fff" strokeWidth="1" />
                        );
                    })}
                </>
            )}

            {/* Axis labels */}
            {labelPositions.map((lp, i) => (
                <text
                    key={i}
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="radar-axis-label"
                >
                    {lp.label}
                </text>
            ))}
        </svg>
    );
}
