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

/**
 * Generate narrative insights from org scores.
 */
export function generateNarrative(archetypeMarginals, logicMarginals, diagnostics, t) {
    const narrative = { leadingArchetypes: [], dominantLogic: null, risks: [], reflectionPrompts: [] };

    // Leading archetypes (top 2)
    const archSorted = Object.entries(archetypeMarginals)
        .sort(([, a], [, b]) => b - a);
    narrative.leadingArchetypes = archSorted.slice(0, 2).map(([id]) => id);

    // Dominant logic
    const logicSorted = Object.entries(logicMarginals)
        .sort(([, a], [, b]) => b - a);
    narrative.dominantLogic = logicSorted[0][0];

    // Risks (unchanged for now, but part of the narrative)
    const HIGH = 60;
    const LOW = 50;

    if (logicMarginals.SEP >= HIGH && logicMarginals.HYB < LOW && (diagnostics.silo_risk || 0) >= HIGH) {
        narrative.risks.push(t('organization.riskSilo'));
    }
    if (logicMarginals.INT >= HIGH && logicMarginals.HYB < LOW && (diagnostics.fragmentation_risk || 0) >= HIGH) {
        narrative.risks.push(t('organization.riskFragmentation'));
    }

    // Reflection Prompts based on results
    // 1. Archetype prompts
    narrative.leadingArchetypes.forEach(archId => {
        narrative.reflectionPrompts.push(t(`organization.prompts.${archId}`));
    });

    // 2. Logic prompt
    narrative.reflectionPrompts.push(t(`organization.prompts.${narrative.dominantLogic}`));

    // 3. Optional diagnostic-triggered prompt
    if ((diagnostics.boundary_spanning || 0) < LOW) {
        narrative.reflectionPrompts.push(t('organization.diagnosticPrompts.boundary_spanning'));
    }
    if ((diagnostics.data_readiness || 0) < LOW) {
        narrative.reflectionPrompts.push(t('organization.diagnosticPrompts.data_readiness'));
    }
    if ((diagnostics.it_integration || 0) < LOW) {
        narrative.reflectionPrompts.push(t('organization.diagnosticPrompts.it_integration'));
    }
    if ((diagnostics.partnerships || 0) < LOW) {
        narrative.reflectionPrompts.push(t('organization.diagnosticPrompts.partnerships'));
    }

    return narrative;
}
