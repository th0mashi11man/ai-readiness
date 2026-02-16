// ── Scoring utilities ────────────────────────────────────────────

/** Score a Likert response, accounting for reverse scoring */
export function scoreLikert(response, reverseScored) {
    return reverseScored ? 6 - response : response;
}

/** Normalize a mean Likert score (1–5) to 0–100 percentage */
export function normalizePct(mean) {
    return ((mean - 1) / 4) * 100;
}

// ── Individual MCQ scoring ──────────────────────────────────────

export function scoreIndividual(items, answersByItemId, domains) {
    let totalCorrect = 0;
    const domainScores = {};

    for (const d of domains) {
        domainScores[d.id] = { correct: 0, total: 0 };
    }

    for (const item of items) {
        const answer = answersByItemId[item.id];
        if (answer === undefined || answer === null) continue;
        const correct = answer === item.correctOptionIndex;
        if (correct) totalCorrect++;
        if (domainScores[item.domainId]) {
            domainScores[item.domainId].total++;
            if (correct) domainScores[item.domainId].correct++;
        }
    }

    return { totalCorrect, totalItems: items.length, domainScores };
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
 * Generate a structured narrative for individual results.
 * Returns { overview, domainItems } where domainItems is an array of per-domain feedback.
 */
export function generateIndividualNarrative(results, t, domains, narratives, locale) {
    const pct = (results.totalCorrect / results.totalItems) * 100;

    // Overall level text
    let levelKey = "emerging";
    if (pct < 40) levelKey = "emerging";
    else if (pct < 65) levelKey = "basic";
    else if (pct < 90) levelKey = "proficient";
    else levelKey = "advanced";

    const overview = narratives?.individual?.levels?.[levelKey]?.[locale] || t(`individual.narrative.${levelKey}`);

    // Per-domain items
    const domainItems = domains.map(d => {
        const score = results.domainScores[d.id] || { correct: 0, total: 3 };
        const isLow = score.correct < (score.total * 0.6);
        const text = narratives?.individual?.domains?.[d.id]?.[isLow ? "low" : "high"]?.[locale] || "";
        const label = (typeof t === 'function') ? t(d.label) : (d.label?.[locale] || d.id);

        return { id: d.id, label, correct: score.correct, total: score.total, text, isLow };
    });

    return { overview, domainItems };
}

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
