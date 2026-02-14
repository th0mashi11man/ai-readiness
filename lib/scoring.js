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

    return {
        matrix,
        cellPcts,
        archetypeMarginals,
        logicMarginals,
        diagnostics,
        ARCHETYPE_IDS,
        LOGIC_IDS,
    };
}

// ── Narrative Generation ──────────────────────────────────────

/**
 * Generate a fluid narrative for individual results.
 */
export function generateIndividualNarrative(results, t, domainLabels) {
    const pct = (results.totalCorrect / results.totalItems) * 100;
    let overview = "";
    if (pct < 40) overview = t('individual.narrative.emerging');
    else if (pct < 65) overview = t('individual.narrative.basic');
    else if (pct < 90) overview = t('individual.narrative.proficient');
    else overview = t('individual.narrative.advanced');

    const feedbackParts = [overview];

    // Find domains that need attention (score < 2/3)
    const lowDomains = Object.entries(results.domainScores)
        .filter(([, s]) => s.correct < (s.total * 0.7))
        .map(([id]) => id);

    if (lowDomains.length > 0) {
        lowDomains.forEach(id => {
            feedbackParts.push(t(`individual.narrative.${id}_low`));
        });
    }

    return feedbackParts.join(" ");
}

/**
 * Generate a fluid narrative for organizational results.
 */
export function generateNarrative(results, t, archetypeLabels, logicLabels, narratives, locale) {
    const { archetypeMarginals = {}, logicMarginals = {}, diagnostics = {}, LOGIC_IDS = [], ARCHETYPE_IDS = [] } = results;

    // 1. Logic Sentence
    const logicSorted = Object.entries(logicMarginals).sort(([, a], [, b]) => b - a);
    const dominantLogic = logicSorted.length > 0 ? logicSorted[0][0] : "SEP"; // Fallback

    const logicKey = `logic_${dominantLogic}`;
    const logicText = narratives?.organization?.[logicKey]?.[locale] || "";

    // 2. Archetype Sentence
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

    let archetypeText = "";

    // Condition 1: Balanced (Low spread)
    if (spread < 15) {
        archetypeText = narratives?.organization?.arch_balanced?.[locale] || "";
    }
    // Condition 2: Single Dominant (Top 1 is significantly higher than #2)
    else if ((archSorted[0][1] - archSorted[1][1]) > 10) {
        const base = narratives?.organization?.arch_focus_1?.[locale] || "";
        archetypeText = base.replace('{arch1}', topArchLabels[0]);
        // Add description for the single dominant archetype
        const descKey = `arch_${topArchIds[0]}`;
        const desc = narratives?.organization?.[descKey]?.[locale] || "";
        if (desc) archetypeText += " " + desc;
    }
    // Condition 3: Dual/Multi Focus (Default)
    else {
        const base = narratives?.organization?.arch_focus?.[locale] || "";
        archetypeText = base
            .replace('{arch1}', topArchLabels[0])
            .replace('{arch2}', topArchLabels[1]);
        // Add descriptions for both
        const desc1 = narratives?.organization?.[`arch_${topArchIds[0]}`]?.[locale] || "";
        const desc2 = narratives?.organization?.[`arch_${topArchIds[1]}`]?.[locale] || "";
        if (desc1) archetypeText += " " + desc1;
        if (desc2) archetypeText += " " + desc2;
    }

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
        // Use the prompt directly as a statement/recommendation from narratives.json
        diagText = narratives?.organization?.diagnosticPrompts?.[lowestDiag[0]]?.[locale] || "";
    }


    return { logicText, archetypeText, riskText, diagText };
}
