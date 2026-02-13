"use client";

export default function HorizontalBarChart({ labels, values, maxValue, hideValues = false, tooltips = [], ids = [], crossCuttingLabel = "Cross-cutting" }) {
    return (
        <div className="horizontal-bar-chart">
            {labels.map((label, idx) => {
                const val = values[idx] || 0;
                const percentage = (val / maxValue) * 100;
                const tooltipText = tooltips[idx] || "";

                const id = ids[idx];
                const isGenAi = id === 'gen_ai';

                // Numbering for Bloom-like progression (1-5)
                // For GenAI, use the cross-cutting label as prefix
                const prefix = !isGenAi ? `${idx + 1}. ` : `${crossCuttingLabel} `;

                return (
                    <div key={idx} className="bar-wrapper">
                        {isGenAi && (
                            <div className="chart-separator" style={{
                                height: '1px',
                                background: '#e2e8f0',
                                margin: '20px 0 10px',
                                width: '100%'
                            }}></div>
                        )}
                        <div className="bar-item">
                            <div className="bar-label-top">
                                <span
                                    className="bar-title"
                                    title={tooltipText}
                                    style={{ cursor: tooltipText ? "help" : "default" }}
                                >
                                    <span style={{ opacity: 0.5, marginRight: '6px', fontWeight: 400 }}>{prefix}</span>
                                    {label}
                                </span>
                            </div>
                            <div className="bar-track" style={{ position: 'relative', height: '24px', background: '#edf2f7', borderRadius: '6px', overflow: 'hidden' }}>
                                <div
                                    className="bar-fill"
                                    style={{
                                        width: `${percentage}%`,
                                        height: '100%',
                                        backgroundColor: 'var(--color-primary)',
                                        transition: 'width 0.8s ease',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0
                                    }}
                                ></div>
                                {!hideValues && (
                                    <span className="bar-value-overlay" style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: percentage > 50 ? 'white' : 'var(--color-text)',
                                        zIndex: 2,
                                        textShadow: percentage > 50 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                    }}>
                                        {Math.round(val)} / {maxValue}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
