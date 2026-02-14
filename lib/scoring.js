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

const ARCHETYPE_IDS = ['TA', 'PT', 'DDL', 'SB'];
const LOGIC_IDS = ['SEP', 'INT', 'HYB'];

export function scoreOrganization(items, responsesByItemId) {
    // 1. Separate matrix items from diagnostic items
    const matrixItems = items.filter(
        it => ARCHETYPE_IDS.includes(it.archetypeId) && LOGIC_IDS.includes(it.logicId)
    );
    const diagItems = items.filter(
        it => it.archetypeId === 'X' && it.logicId === 'X'
    );

    // 2. 12-cell matrix
    const cellScores = {}; // key: "TA_SEP" -> [scores]
    for (const a of ARCHETYPE_IDS) {
        for (const l of LOGIC_IDS) {
            cellScores[`${a}_${l}`] = [];
        }
    }

    for (const item of matrixItems) {
        const resp = responsesByItemId[item.id];
        if (resp === undefined || resp === null) continue;
        const key = `${item.archetypeId}_${item.logicId}`;
        cellScores[key].push(scoreLikert(resp, item.reverseScored));
    }

    const cellMeans = {};
    const cellPcts = {};
    for (const key of Object.keys(cellScores)) {
        const arr = cellScores[key];
        const mean = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        cellMeans[key] = mean;
        cellPcts[key] = normalizePct(mean);
    }

    // 3. Archetype marginals
    const archetypeMarginals = {};
    for (const a of ARCHETYPE_IDS) {
        const means = LOGIC_IDS.map(l => cellMeans[`${a}_${l}`]);
        const avg = means.reduce((s, v) => s + v, 0) / means.length;
        archetypeMarginals[a] = normalizePct(avg);
    }

    // 4. Logic marginals
    const logicMarginals = {};
    for (const l of LOGIC_IDS) {
        const means = ARCHETYPE_IDS.map(a => cellMeans[`${a}_${l}`]);
        const avg = means.reduce((s, v) => s + v, 0) / means.length;
        logicMarginals[l] = normalizePct(avg);
    }

    // 5. Diagnostics
    const diagnostics = {};
    for (const item of diagItems) {
        const resp = responsesByItemId[item.id];
        if (resp === undefined || resp === null) continue;
        const score = scoreLikert(resp, item.reverseScored);
        diagnostics[item.diagnosticTag] = normalizePct(score);
    }

    // 6. Build matrix as 2D array [archetype][logic]
    const matrix = ARCHETYPE_IDS.map(a =>
        LOGIC_IDS.map(l => cellPcts[`${a}_${l}`])
    );

    // 7. Calculate Integration Score (0-100) based on weighted logic marginals
    // SEP weight = 0, HYB weight = 50, INT weight = 100
    const s = logicMarginals.SEP || 0;
    const h = logicMarginals.HYB || 0;
    const i = logicMarginals.INT || 0;
    const totalLogic = s + h + i;
    // Default to 50 (middle) if no data, otherwise calculate weighted average
    const integrationScore = totalLogic === 0 ? 50 : ((s * 0) + (h * 50) + (i * 100)) / totalLogic;

    return {
        matrix,
        cellPcts,
        archetypeMarginals,
        logicMarginals,
        integrationScore,
        diagnostics,
        ARCHETYPE_IDS,
        LOGIC_IDS,
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
    let overview = "";
    if (pct < 40) overview = narratives?.individual?.emerging?.[locale] || t('individual.narrative.emerging');
    else if (pct < 65) overview = narratives?.individual?.basic?.[locale] || t('individual.narrative.basic');
    else if (pct < 90) overview = narratives?.individual?.proficient?.[locale] || t('individual.narrative.proficient');
    else overview = narratives?.individual?.advanced?.[locale] || t('individual.narrative.advanced');

    // Per-domain items
    const domainItems = domains.map(d => {
        const score = results.domainScores[d.id] || { correct: 0, total: 3 };
        const isLow = score.correct < (score.total * 0.6);
        const narrativeKey = isLow ? `${d.id}_low` : d.id;
        const text = narratives?.individual?.[narrativeKey]?.[locale] || "";
        const label = (typeof t === 'function') ? t(d.label) : (d.label?.[locale] || d.id);

        return { id: d.id, label, correct: score.correct, total: score.total, text, isLow };
    });

    return { overview, domainItems };
}

/**
 * Generate a fluid narrative for organizational results.
 */
export function generateNarrative(results, t, archetypeLabels, logicLabels, narratives, locale) {
    const { archetypeMarginals = {}, logicMarginals = {}, diagnostics = {}, LOGIC_IDS = [], ARCHETYPE_IDS = [] } = results;

    // 2. Logic Narrative - Spectrum Based
    // Thresholds:
    // 0-20: Strongly Separate
    // 20-40: Mildly Separate
    // 40-60: Balanced (Hybrid)
    // 60-80: Mildly Integrated
    // 80-100: Strongly Integrated
    const score = results.integrationScore;
    let logicKey = "logic_spectrum_balanced";

    if (score < 20) logicKey = "logic_spectrum_strongly_separate";
    else if (score < 40) logicKey = "logic_spectrum_mildly_separate";
    else if (score < 60) logicKey = "logic_spectrum_balanced";
    else if (score < 80) logicKey = "logic_spectrum_mildly_integrated";
    else logicKey = "logic_spectrum_strongly_integrated";

    const logicText = narratives?.organization?.[logicKey]?.[locale] || "";

    // Label for the logic bullet (empty as requested)
    const logicLabel = "";

    // Return a single logic item for the bullet
    const logicItems = [{
        id: "logic_spectrum",
        label: logicLabel,
        score: Math.round(score),
        text: logicText
    }];

    // 2. Archetype — per-archetype items
    const archSorted = Object.entries(archetypeMarginals).sort(([, a], [, b]) => b - a);
    const topArchIds = archSorted.slice(0, 2).map(([id]) => id);
    const topArchLabels = topArchIds.map(id => {
        const idx = ARCHETYPE_IDS.indexOf(id);
        return archetypeLabels[idx];
    });

    // Calculate spread to determine if balanced or focused
    const values = Object.values(archetypeMarginals);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const spread = maxVal - minVal;

    // Intro text about overall archetype profile shape
    let archetypeIntro = "";
    if (spread < 15) {
        archetypeIntro = narratives?.organization?.arch_balanced?.[locale] || "";
    } else if ((archSorted[0][1] - archSorted[1][1]) > 15) {
        const base = narratives?.organization?.arch_focus_1?.[locale] || "";
        archetypeIntro = base.replace('{arch1}', topArchLabels[0]);
    } else {
        const base = narratives?.organization?.arch_focus?.[locale] || "";
        archetypeIntro = base
            .replace('{arch1}', topArchLabels[0])
            .replace('{arch2}', topArchLabels[1]);
    }

    // Per-archetype bullet items: dominant archetypes get their description,
    // underrepresented ones get supportive gap narrative
    const GAP_THRESHOLD = 20;
    const topScore = archSorted.length > 0 ? archSorted[0][1] : 0;

    const archetypeItems = ARCHETYPE_IDS.map((archId, i) => {
        const label = archetypeLabels[i];
        const score = archetypeMarginals[archId] || 0;
        const isUnderrepresented = spread >= 15 && (topScore - score) >= GAP_THRESHOLD;

        const narrativeKey = isUnderrepresented ? `arch_${archId}_low` : `arch_${archId}`;
        const text = narratives?.organization?.[narrativeKey]?.[locale] || "";

        return { id: archId, label, score: Math.round(score), text, isUnderrepresented };
    });

    // 3. Risks / Diagnostics
    const HIGH = 60;
    const LOW = 50;
    let riskText = "";

    if (logicMarginals.SEP >= HIGH && logicMarginals.HYB < LOW && (diagnostics.silo_risk || 0) >= HIGH) {
        const baseRisk = narratives?.organization?.risk_note?.[locale] || "";
        riskText = baseRisk.replace('{risk}', t('organization.riskSilo').toLowerCase());
    } else if (logicMarginals.INT >= HIGH && logicMarginals.HYB < LOW && (diagnostics.fragmentation_risk || 0) >= HIGH) {
        const baseRisk = narratives?.organization?.risk_note?.[locale] || "";
        riskText = baseRisk.replace('{risk}', t('organization.riskFragmentation').toLowerCase());
    }

    // 4. Diagnostic Highlight
    const diagEntries = Object.entries(diagnostics).filter(([k]) => !k.includes('risk'));
    const lowestDiag = diagEntries.sort(([, a], [, b]) => a - b)[0];
    let diagText = "";

    if (lowestDiag && lowestDiag[1] < LOW) {
        diagText = narratives?.organization?.diagnosticPrompts?.[lowestDiag[0]]?.[locale] || "";
    }

    return { logicItems, archetypeIntro, archetypeItems, riskText, diagText };
}
