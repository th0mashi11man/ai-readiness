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
    // 1. Calculate scores per orientation
    const scores = {};
    const rawScores = {};

    for (const id of ORIENTATION_IDS) {
        scores[id] = 0;
        rawScores[id] = { sum: 0, count: 0 };
    }

    // 2. Calculate scores per logic
    const logicScores = {};
    const rawLogic = {};
    for (const id of LOGIC_IDS) {
        logicScores[id] = 0;
        rawLogic[id] = { sum: 0, count: 0 };
    }

    for (const item of items) {
        const resp = responsesByItemId[item.id];
        if (resp === undefined || resp === null) continue;

        // Orientation Items
        const orientId = item.orientationId;
        if (orientId && ORIENTATION_IDS.includes(orientId)) {
            const val = scoreLikert(resp, item.reverseScored);
            rawScores[orientId].sum += val;
            rawScores[orientId].count += 1;
        }

        // Logic Items
        const logicId = item.logicId;
        if (logicId && LOGIC_IDS.includes(logicId)) {
            const val = scoreLikert(resp, item.reverseScored);
            rawLogic[logicId].sum += val;
            rawLogic[logicId].count += 1;
        }
    }

    // Process Orientation Scores (0-100)
    for (const id of ORIENTATION_IDS) {
        if (rawScores[id].count > 0) {
            const mean = rawScores[id].sum / rawScores[id].count;
            scores[id] = normalizePct(mean);
        } else {
            scores[id] = 0;
        }
    }

    // Process Logic Scores (0-100)
    for (const id of LOGIC_IDS) {
        if (rawLogic[id].count > 0) {
            const mean = rawLogic[id].sum / rawLogic[id].count;
            logicScores[id] = normalizePct(mean);
        } else {
            logicScores[id] = 0;
        }
    }

    // Calculate Integration Score (0-100)
    // SEP weight = 0, HYB weight = 50, INT weight = 100
    const s = logicScores.SEP || 0;
    const h = logicScores.HYB || 0;
    const i = logicScores.INT || 0;
    const totalLogic = s + h + i;
    // Default to 50 if no data
    const integrationScore = totalLogic === 0 ? 50 : ((s * 0) + (h * 50) + (i * 100)) / totalLogic;

    return {
        scores,
        ORIENTATION_IDS,
        logicScores,
        integrationScore,
        LOGIC_IDS
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
