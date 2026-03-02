// ── Scoring utilities ────────────────────────────────────────────

/** Score a Likert response, accounting for reverse scoring */
export function scoreLikert(response, reverseScored) {
    return reverseScored ? 6 - response : response;
}

/** Normalize a mean Likert score (1–5) to 0–100 percentage */
export function normalizePct(mean) {
    return ((mean - 1) / 4) * 100;
}

/**
 * Determine the gap level between a stated priority and current average score.
 * Both values are on a 1–5 scale.
 * Positive gap = under-performing relative to priority (needs more effort).
 * Negative gap = over-performing relative to priority (current exceeds target).
 * Returns: 'aligned' | 'minor' | 'moderate' | 'significant' | 'surplus'
 */
export function getGapLevel(priority, currentAverage) {
    const gap = priority - currentAverage;
    if (gap >= 1.5) return 'significant';
    if (gap >= 0.75) return 'moderate';
    if (gap >= 0.25) return 'minor';
    if (gap > -0.25) return 'aligned';
    return 'surplus'; // current meaningfully exceeds stated priority
}



// ── Organizational scoring ──────────────────────────────────────

const ORIENTATION_IDS = ['EFF', 'ANA', 'TEC', 'SUP', 'KNO'];
const LOGIC_IDS = ['SEP', 'INT', 'HYB'];

export function scoreOrganization(items, responsesByItemId) {
    const ORIENTATION_IDS = ["EFF", "ANA", "TEC", "SUP", "KNO"];

    // Structure: { EFF: { sum: 0, count: 0 }, ... }
    const rawData = {};
    ORIENTATION_IDS.forEach(id => {
        rawData[id] = { sum: 0, count: 0 };
    });

    for (const item of items) {
        const resp = responsesByItemId[item.id];
        if (resp === undefined || resp === null) continue;

        const orientationId = item.orientationId;

        if (orientationId && rawData[orientationId]) {
            // Standard magnitude scoring
            const val = scoreLikert(resp, item.reverseScored);
            rawData[orientationId].sum += val;
            rawData[orientationId].count += 1;
        }
    }

    const scores = {};
    const results = {}; // Map of ID -> { score }

    ORIENTATION_IDS.forEach(id => {
        const d = rawData[id];

        // 1. Magnitude Score (0-100) and Raw Average (1-5)
        let magnitude = 0;
        let average = 0;
        if (d.count > 0) {
            average = d.sum / d.count;
            magnitude = normalizePct(average);
        }
        scores[id] = magnitude;

        results[id] = {
            id,
            score: magnitude,
            average: Math.round(average * 10) / 10, // Keep 1 decimal, as number
        };
    });

    return {
        scores,
        results,
        ORIENTATION_IDS
    };
}

// ── Narrative Generation function was removed as it is entirely unused ────────────────────────
