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

    // Structure: { EFF: { sum: 0, count: 0, sepSum: 0, sepCount: 0, intSum: 0, intCount: 0 }, ... }
    const rawData = {};
    ORIENTATION_IDS.forEach(id => {
        rawData[id] = {
            sum: 0, count: 0,
            sepSum: 0, sepCount: 0,
            intSum: 0, intCount: 0
        };
    });

    for (const item of items) {
        const resp = responsesByItemId[item.id];
        if (resp === undefined || resp === null) continue;

        const orientationId = item.orientationId;
        const logicId = item.logicId; // "SEP" or "INT"

        if (orientationId && rawData[orientationId]) {
            // Standard magnitude scoring (How much are they doing this?)
            // We treat both SEP and INT items as evidence of the orientation itself.
            const val = scoreLikert(resp, item.reverseScored);
            rawData[orientationId].sum += val;
            rawData[orientationId].count += 1;

            // Logic scoring
            if (logicId === "SEP") {
                rawData[orientationId].sepSum += val;
                rawData[orientationId].sepCount += 1;
            } else if (logicId === "INT") {
                rawData[orientationId].intSum += val;
                rawData[orientationId].intCount += 1;
            }
        }
    }

    const scores = {};
    const results = {}; // Map of ID -> { score, logicScore, color }

    ORIENTATION_IDS.forEach(id => {
        const d = rawData[id];

        // 1. Magnitude Score (0-100)
        let magnitude = 0;
        if (d.count > 0) {
            magnitude = normalizePct(d.sum / d.count);
        }
        scores[id] = magnitude; // Keep simple map for compatibility

        // 2. Logic Ratio
        // We want a score from -1 (Pure Sep) to +1 (Pure Int), or 0 (Sep) to 1 (Int).
        // Let's use 0 = SEP, 50 = Balanced, 100 = INT for easier mapping to colors.

        let logicVal = 50; // Default balanced

        const sepAvg = d.sepCount > 0 ? (d.sepSum / d.sepCount) : 0;
        const intAvg = d.intCount > 0 ? (d.intSum / d.intCount) : 0;

        // If we have data for both, we can compare.
        // Simple approach: ratio of Int contribution to total. 
        // But since they are Likert scales (1-5), we should compare the averages.
        // Difference approach: (IntAvg - SepAvg) 
        //   If Int=5, Sep=1 -> Diff = +4 -> Strong Integration
        //   If Int=1, Sep=5 -> Diff = -4 -> Strong Separation
        //   Range is -4 to +4. Map to 0-100.
        //   -4 -> 0
        //    0 -> 50
        //   +4 -> 100

        if (d.sepCount > 0 || d.intCount > 0) {
            const diff = intAvg - sepAvg; // Range -4 to +4
            // Map -4..+4 to 0..100
            // Slope = 100 / 8 = 12.5
            // Intercept (at diff 0) = 50
            logicVal = 50 + (diff * 12.5);

            // Clamp
            if (logicVal < 0) logicVal = 0;
            if (logicVal > 100) logicVal = 100;
        }

        results[id] = {
            id,
            score: magnitude,
            logicScore: logicVal, // 0=Strictly Sep, 100=Strictly Int
        };
    });

    return {
        scores, // { ID: val }
        results, // { ID: { score, logicScore } }
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

    // 2. Logic Narrative - Spectrum Based
    const score = integrationScore;
    let logicKey = "level_3_balanced";

    if (score < 20) logicKey = "level_1_strongly_separate";
    else if (score < 40) logicKey = "level_2_mildly_separate";
    else if (score < 60) logicKey = "level_3_balanced";
    else if (score < 80) logicKey = "level_4_mildly_integrated";
    else logicKey = "level_5_strongly_integrated";

    const logicText = narratives?.organization?.logic_spectrum?.[logicKey]?.[locale] || "";

    const logicItem = {
        id: "logic_spectrum",
        label: "", // Empty label as requested previously
        score: Math.round(score),
        text: logicText
    };

    return { narrativeItems, logicItem };
}
