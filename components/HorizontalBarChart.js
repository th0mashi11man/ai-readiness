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
                    <div key={idx} className="bar-wrapper" style={{ display: 'contents' }}>
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
                                {!hideValues && <span className="bar-value">{val} / {maxValue}</span>}
                            </div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
