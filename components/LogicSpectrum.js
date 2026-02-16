"use client";

/**
 * LogicSpectrum component
 * Visualizes the organizational logic as a position on a spectrum.
 * Labels: Separation (left), Hybrid (center), Integration (right)
 */
export default function LogicSpectrum({ scores, score, labels, t }) {
    // score = 0-100 integration score (0=Sep, 100=Int)
    // Fallback if score not provided: calculate from scores object
    let position = 50;
    if (typeof score === 'number') {
        position = score;
    } else if (scores) {
        const s = scores.SEP || 0;
        const h = scores.HYB || 0;
        const i = scores.INT || 0;
        const total = s + h + i;
        position = total > 0 ? ((h * 50 + i * 100) / total) : 50;
    }

    return (
        <div className="logic-spectrum-wrapper">
            <div className="logic-spectrum-labels">
                <div className="logic-label left" title={t("organization.tooltipSeparation")}>
                    <span className="label-name">{labels.SEP}</span>
                </div>
                {/* Center label removed for spectrum view */}
                <div className="logic-label right" title={t("organization.tooltipIntegration")}>
                    <span className="label-name">{labels.INT}</span>
                </div>
            </div>

            <div className="logic-spectrum-track spectrum-gradient">
                <div className="logic-track-line"></div>
                <div className="logic-track-ticks">
                    <span className="tick start"></span>
                    <span className="tick center"></span>
                    <span className="tick end"></span>
                </div>
                <div
                    className="logic-spectrum-marker"
                    style={{ left: `${position}%` }}
                >
                    <div className="marker-pin"></div>
                    {/* Numerical value removed as per request */}
                </div>
            </div>
            <style jsx>{`
                .spectrum-gradient {
                    background: linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%);
                    /* Or meaningful colors if desired, e.g. blue to green */
                }
            `}</style>
        </div>
    );
}
