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
 * Returns: 'aligned' | 'minor' | 'moderate' | 'significant'
 */
export function getGapLevel(priority, currentAverage) {
    const gap = priority - currentAverage;
    if (gap <= 0) return 'aligned';
    if (gap <= 1.0) return 'minor';
    if (gap <= 2.0) return 'moderate';
    return 'significant';
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
            average: average.toFixed(1), // Keep 1 decimal
        };
    });

    return {
        scores,
        results,
        ORIENTATION_IDS
    };
}

// ── Narrative Generation ──────────────────────────────────────


/**
 * Generate narrative for organizational results based on top orientations and logic.
 */
export function generateNarrative(results, t, orientations, narratives, locale) {
    const { scores, ORIENTATION_IDS, integrationScore } = results;

    // 1. Orientations Narrative
    const sorted = ORIENTATION_IDS.map(id => ({ id, score: scores[id] }))
        .sort((a, b) => b.score - a.score);

    const topOrientations = sorted.slice(0, 1);
    const narrativeItems = topOrientations.map(item => {
        const orientationDef = orientations.find(o => o.id === item.id);
        if (!orientationDef) return null;

        return {
            id: item.id,
            label: orientationDef.label[locale],
            score: Math.round(item.score),
            description: orientationDef.description[locale],
            details: orientationDef.feedback
        };
    }).filter(Boolean);

    return { narrativeItems, logicItem: null };
}
