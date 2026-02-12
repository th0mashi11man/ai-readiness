"use client";

/**
 * LogicSpectrum component
 * Visualizes the organizational logic as a position on a spectrum.
 * Labels: Separation (left), Hybrid (center), Integration (right)
 */
export default function LogicSpectrum({ scores, labels, t }) {
    // scores = { SEP: value, HYB: value, INT: value }
    // labels = { SEP: string, HYB: string, INT: string }

    const s = scores.SEP || 0;
    const h = scores.HYB || 0;
    const i = scores.INT || 0;

    const total = s + h + i;
    // Position 0-100
    const position = total > 0 ? ((h * 50 + i * 100) / total) : 50;

    return (
        <div className="logic-spectrum-wrapper">
            <div className="logic-spectrum-labels">
                <div className="logic-label left" title={t("organization.tooltipSeparation")}>
                    <span className="label-name">{labels.SEP}</span>
                </div>
                <div className="logic-label center" title={t("organization.tooltipHybrid")}>
                    <span className="label-name">{labels.HYB}</span>
                </div>
                <div className="logic-label right" title={t("organization.tooltipIntegration")}>
                    <span className="label-name">{labels.INT}</span>
                </div>
            </div>

            <div className="logic-spectrum-track">
                <div className="logic-track-line"></div>
                <div className="logic-track-ticks">
                    <span className="tick"></span>
                    <span className="tick center"></span>
                    <span className="tick"></span>
                </div>
                <div
                    className="logic-spectrum-marker"
                    style={{ left: `${position}%` }}
                >
                    <div className="marker-pin"></div>
                </div>
            </div>
        </div>
    );
}
