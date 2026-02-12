"use client";
import { useEffect, useRef, useState } from "react";

export default function BarChart({ labels, values, colorClass = "" }) {
    const [animated, setAnimated] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            requestAnimationFrame(() => setAnimated(true));
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    return (
        <div className="bar-chart" ref={ref}>
            {labels.map((label, i) => {
                const v = Math.round(values[i]);
                return (
                    <div key={i} className="bar-row">
                        <div className="bar-label">{label}</div>
                        <div className="bar-track">
                            <div
                                className={`bar-fill ${colorClass}`}
                                style={{ width: animated ? `${v}%` : "0%" }}
                                role="progressbar"
                                aria-valuenow={v}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                            <span className="bar-value">{v}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
