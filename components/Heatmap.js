"use client";
import { Fragment } from "react";

export default function Heatmap({ matrix, rowLabels, colLabels }) {
    return (
        <div className="heatmap-wrapper">
            <div
                className="heatmap-grid"
                style={{ gridTemplateColumns: `180px repeat(${colLabels.length}, 1fr)` }}
            >
                {/* Corner */}
                <div className="heatmap-corner" />

                {/* Column headers */}
                {colLabels.map((cl, i) => (
                    <div key={i} className="heatmap-col-header">{cl}</div>
                ))}

                {/* Rows */}
                {matrix.map((row, r) => (
                    <Fragment key={`row-${r}`}>
                        <div className="heatmap-row-header">{rowLabels[r]}</div>
                        {row.map((val, c) => {
                            const v = Math.round(val);
                            return (
                                <div
                                    key={`c-${r}-${c}`}
                                    className="heatmap-cell"
                                    style={{
                                        backgroundColor: heatColor(v),
                                        color: v > 55 ? "#fff" : "#1a202c",
                                    }}
                                    role="cell"
                                    aria-label={`${rowLabels[r]}, ${colLabels[c]}: ${v}%`}
                                >
                                    {v}%
                                </div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

function heatColor(pct) {
    const h = 215;
    const s = 55 + pct * 0.3;
    const l = 90 - pct * 0.55;
    return `hsl(${h}, ${s}%, ${l}%)`;
}
