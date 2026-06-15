"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useQuizStore } from "@/lib/store";
import { scoreOrganization, getGapLevel } from "@/lib/scoring";
import BarChart from "@/components/BarChart";
import RadarChart from "@/components/RadarChart";
import PrintHeader from "@/components/PrintHeader";

import { Suspense } from "react";

const SHARE_COPY = {
    sv: {
        promptTitle: "Kan du tänka dig att dela dina svar som forskningsdata?",
        promptBody: "Genom att svara på några korta frågor så kan vi använda dina svar för att förbättra vår förståelse av AI-beredskap inom skolorganisationer och utveckla bättre sätt att mäta och följa sådan beredskap över tid. Deltagandet är frivilligt och du kan senare begära att dina uppgifter dras tillbaka. Om du inte vill dela så raderas dina svar så fort du stänger ner hemsidan.",
        openForm: "Dela svar som forskningsdata",
        formTitle: "Information om att dela dina svar som forskningsdata",
        formBody: [
            "Du tillfrågas om du vill dela dina svar från AI Readiness Self-Assessment Tool som forskningsdata. Syftet är att bidra till forskning om AI-beredskap, digitalisering och ansvarsfull användning av cloud- och AI-relaterad teknik i skolorganisationer. Genom att dela dina svar hjälper du oss att förbättra förståelsen av hur organisationer arbetar med AI-frågor och hur AI-beredskap kan mätas och följas över tid.",
            "Datan kommer att användas för att studera de områden som frågorna i verktyget handlar om: organisationens strategier, arbetssätt, kompetenser, tekniska förutsättningar, styrning, ansvarsfördelning och behov av stöd i relation till AI och digital infrastruktur.",
            "Att dela dina svar är frivilligt. Du kan använda verktyget även om du inte vill dela dina svar för forskning. Om du samtycker kan du senare kontakta oss för att begära att dina uppgifter tas bort eller inte längre används. Om datan har anonymiserats eller sammanställts på ett sätt som gör att enskilda svar inte längre kan identifieras kan det däremot vara omöjligt att ta bort just dina uppgifter från sådana analyser.",
            "Vi kommer att hantera materialet i enlighet med god forskningssed och forskningsetiska principer. Resultat från forskningen kommer att presenteras på en övergripande nivå, i rapporter, vetenskapliga publikationer eller presentationer.",
        ],
        contact: "Vid frågor om forskningen eller om du vill dra tillbaka ditt samtycke kan du kontakta:",
        questionsTitle: "Korta kontextfrågor",
        schoolOrg: "Jag arbetar inom en skolorganisation",
        role: "Min roll inom denna organisation",
        principal: "Huvudmannen är",
        municipalitySize: "Kommunens storlek",
        privateSchoolSize: "Privat skolas storlek",
        other: "Annat",
        otherPlaceholder: "Beskriv kort",
        yes: "Ja",
        no: "Nej",
        private: "Privat",
        municipal: "Kommunal",
        choose: "Välj...",
        consent: "Jag samtycker till att mina svar och uppgifterna ovan delas som forskningsdata.",
        submit: "Skicka forskningsdata",
        submitting: "Skickar...",
        cancel: "Avbryt",
        success: "Tack för att du bidrar till forskningen. Dina svar har delats.",
        error: "Det gick inte att skicka svaren. Försök igen eller exportera resultatet som PDF.",
        required: "Fyll i de obligatoriska fälten och samtyckesrutan.",
    },
    en: {
        promptTitle: "Would you consider sharing your answers as research data?",
        promptBody: "By answering a few short contextual questions, you can help us improve our understanding of AI readiness in school organisations and develop better ways to measure and follow such readiness over time. Participation is voluntary and you can later ask for your data to be withdrawn. If you do not want to share, your answers are deleted as soon as you close the website.",
        openForm: "Share answers as research data",
        formTitle: "Information about sharing your answers as research data",
        formBody: [
            "You are being asked whether you want to share your answers from the AI Readiness Self-Assessment Tool as research data. The purpose is to contribute to research on AI readiness, digitalisation, and responsible use of cloud- and AI-related technology in school organisations.",
            "The data will be used to study the areas covered by the tool: organisational strategies, practices, competencies, technical conditions, governance, responsibilities, and support needs in relation to AI and digital infrastructure.",
            "Sharing your answers is voluntary. You can use the tool even if you do not want to share your answers for research. If you consent, you can later contact us to request that your data be removed or no longer used. If data has been anonymised or aggregated in a way that means individual answers can no longer be identified, it may not be possible to remove your specific answers from those analyses.",
            "We will handle the material in accordance with good research practice and research ethics principles. Research results will be presented at an aggregated level in reports, scientific publications, or presentations.",
        ],
        contact: "For questions about the research or to withdraw your consent, contact:",
        questionsTitle: "Short contextual questions",
        schoolOrg: "I work within a school organisation",
        role: "My role in this organisation",
        principal: "The responsible authority is",
        municipalitySize: "Municipality size",
        privateSchoolSize: "Private school size",
        other: "Other",
        otherPlaceholder: "Briefly describe",
        yes: "Yes",
        no: "No",
        private: "Private",
        municipal: "Municipal",
        choose: "Choose...",
        consent: "I consent to my answers and the information above being shared as research data.",
        submit: "Send research data",
        submitting: "Sending...",
        cancel: "Cancel",
        success: "Thank you for contributing to the research. Your answers have been shared.",
        error: "The answers could not be sent. Please try again or export the result as PDF.",
        required: "Complete the required fields and consent checkbox.",
    },
};

const SIZE_OPTIONS = [
    "Färre än 10 000 invånare / Fewer than 10,000 inhabitants",
    "10 000-24 999 invånare / 10,000-24,999 inhabitants",
    "25 000-49 999 invånare / 25,000-49,999 inhabitants",
    "50 000-99 999 invånare / 50,000-99,999 inhabitants",
    "100 000 invånare eller fler / 100,000 inhabitants or more",
];

const SCHOOL_SIZE_OPTIONS = [
    "Färre än 100 elever / Fewer than 100 students",
    "100-249 elever / 100-249 students",
    "250-499 elever / 250-499 students",
    "500-999 elever / 500-999 students",
    "1 000 elever eller fler / 1,000 students or more",
];

export default function OrganizationPage() {
    return (
        <Suspense fallback={<div className="loading">Laddar...</div>}>
            <OrganizationContent />
        </Suspense>
    );
}

function OrganizationContent() {
    const { t, locale } = useI18n();
    const searchParams = useSearchParams();
    const [bank, setBank] = useState(null);
    const [phase, setPhase] = useState(searchParams.get("phase") || "priority");

    useEffect(() => {
        fetch("/org_itembank.json")
            .then((r) => r.json())
            .then(setBank);
    }, []);

    if (!bank) return <div className="loading">{t("common.loading")}</div>;

    const handlePriorityComplete = (priorities) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("org_priorities", JSON.stringify(priorities));
        }
        setPhase("survey");
    };

    return (
        <div className="org-container">
            {phase === "priority" && (
                <PriorityStep
                    bank={bank}
                    t={t}
                    locale={locale}
                    onComplete={handlePriorityComplete}
                />
            )}
            {phase === "survey" && (
                <SurveyFlow
                    bank={bank}
                    onComplete={() => setPhase("results")}
                    t={t}
                    locale={locale}
                />
            )}
            {phase === "results" && (
                <OrgResults
                    bank={bank}
                    t={t}
                    locale={locale}
                    onRestart={() => setPhase("priority")}
                />
            )}
        </div>
    );
}

function PriorityStep({ bank, t, locale, onComplete }) {
    const [priorities, setPriorities] = useState({});

    // Initialize with 3 (middle) if not set. Total for 5 orientations = 15.
    useEffect(() => {
        const initial = {};
        bank.orientations.forEach(o => initial[o.id] = 3);
        setPriorities(initial);
    }, [bank]);

    const totalPoints = Object.values(priorities).reduce((a, b) => a + b, 0);

    const handleChange = (id, val) => {
        const newVal = parseInt(val);
        const currentVal = priorities[id] || 0;
        const otherTotal = totalPoints - currentVal;

        // If the new total would exceed 20, clamp it to the remaining budget
        const allowedVal = Math.min(newVal, 20 - otherTotal);

        // Don't go below the slider's minimum (1) if it's already there
        const finalVal = Math.max(allowedVal, 1);

        setPriorities(prev => ({ ...prev, [id]: finalVal }));
    };

    return (
        <section className="page fade-in">
            <div className="card">
                <h1 style={{ marginBottom: "0.5rem" }}>{t("organization.prioritiesTitle")}</h1>
                <p className="lead" style={{ marginBottom: "1rem" }}>
                    {t("organization.prioritiesIntro")}
                </p>
                <p className="lead" style={{ marginBottom: "2rem", fontWeight: 600 }}>
                    {t("organization.prioritiesDescription")}
                </p>

                <div className="point-tracker" style={{
                    marginBottom: "2rem",
                    padding: "1rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <span style={{ fontSize: "0.95rem", color: "var(--color-text-secondary)" }}>
                        {t("organization.priorityBudget")}
                    </span>
                    <span style={{ fontWeight: "600", color: "var(--color-text)" }}>
                        {t("organization.priorityPointsTotal").replace("{total}", totalPoints)}
                    </span>
                </div>

                <div className="priority-list" style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
                    {bank.orientations.map(orient => (
                        <div key={orient.id} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <h3 style={{ margin: 0 }}>{orient.label[locale]}</h3>
                                <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "var(--color-primary)" }}>
                                    {priorities[orient.id]} / 5
                                </div>
                            </div>
                            <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                                {orient.description[locale]}
                            </p>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={priorities[orient.id] || 3}
                                onChange={(e) => handleChange(orient.id, e.target.value)}
                                style={{ width: "100%", accentColor: "var(--color-primary)" }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                                <span>{t("organization.notImportant")}</span>
                                <span>{t("organization.veryImportant")}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <p style={{ marginTop: "1.5rem", marginBottom: "1.5rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
                    {t("organization.prioritiesOutro")}
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => onComplete(priorities)}
                    >
                        {t("organization.proceedToQuestions")}
                    </button>
                </div>
            </div>
        </section>
    );
}

function SurveyFlow({ bank, onComplete, t, locale }) {
    const {
        state,
        initialized,
        setAnswer,
        goNext,
        goBack,
        complete,
        reset,
    } = useQuizStore(
        "organization_state",
        bank.items,
        bank.settings.randomizeStatements
    );

    const [showWarning, setShowWarning] = useState(false);

    if (!initialized || !state)
        return <div className="loading">{t("common.loading")}</div>;

    const currentItemId = state.itemOrder[state.currentIndex];
    const currentItem = bank.items.find((it) => it.id === currentItemId);
    const selectedAnswer = state.answers[currentItemId];
    const isLast = state.currentIndex === state.itemOrder.length - 1;
    const scaleLabels = bank.settings.likertScale.labels[locale] || bank.settings.likertScale.labels.sv;

    const handleNext = () => {
        if (selectedAnswer === undefined || selectedAnswer === null) {
            setShowWarning(true);
            return;
        }
        setShowWarning(false);
        if (isLast) {
            complete();
            onComplete();
        } else {
            goNext();
        }
    };

    return (
        <section className="page page-quiz fade-in">
            <div className="card card-quiz">
                <div className="quiz-header">
                    <div className="progress-info">
                        {t("common.progress", {
                            current: state.currentIndex + 1,
                            total: state.itemOrder.length,
                        })}
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${((state.currentIndex + 1) / state.itemOrder.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                <h2 className="quiz-question">{t(currentItem.text)}</h2>

                <div className="likert-scale" role="radiogroup" aria-label="Likert scale">
                    {scaleLabels.map((label, idx) => {
                        const value = idx + 1;
                        return (
                            <label
                                key={idx}
                                className={`likert-option ${selectedAnswer === value ? "selected" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name={`q_${currentItemId}`}
                                    value={value}
                                    checked={selectedAnswer === value}
                                    onChange={() => {
                                        setAnswer(currentItemId, value);
                                        setShowWarning(false);
                                    }}
                                    aria-label={label}
                                />
                                <span className="likert-value">{value}</span>
                                <span className="likert-label">{label}</span>
                            </label>
                        );
                    })}
                </div>

                {showWarning && (
                    <p className="warning" role="alert">
                        {t("organization.answerRequired")}
                    </p>
                )}

                <div className="quiz-nav">
                    {state.currentIndex > 0 && (
                        <button className="btn btn-ghost" onClick={() => { setShowWarning(false); goBack(); }}>
                            {t("common.back")}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={handleNext}>
                        {isLast ? t("common.finish") : t("common.next")}
                    </button>
                </div>


            </div>
        </section>
    );
}


function OrgResults({ bank, t, locale, onRestart }) {
    const [responses, setResponses] = useState({});
    const [storedPriorities, setStoredPriorities] = useState({});
    const [storedSession, setStoredSession] = useState({});
    const [mounted, setMounted] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [shareForm, setShareForm] = useState({
        schoolOrg: "",
        schoolOrgOther: "",
        role: "",
        principal: "",
        municipalitySize: "",
        privateSchoolSize: "",
        consent: false,
    });
    const [shareStatus, setShareStatus] = useState({ type: "", message: "" });
    const [isSubmittingShare, setIsSubmittingShare] = useState(false);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("organization_state") || "{}");
        setStoredSession(stored);
        setResponses(stored.answers || {});

        const priorities = JSON.parse(localStorage.getItem("org_priorities") || "{}");
        setStoredPriorities(priorities);

        setMounted(true);
    }, []);

    const [gapSuggestions, setGapSuggestions] = useState(null);

    useEffect(() => {
        fetch("/gap_suggestions.json")
            .then(r => r.json())
            .then(setGapSuggestions)
            .catch(err => console.error("Failed to load gap suggestions", err));
    }, []);

    if (!mounted) return <div className="loading text-center p-8">{t("common.loading")}</div>;

    const results = scoreOrganization(bank.items, responses);

    const labels = results.ORIENTATION_IDS.map(id => {
        const o = bank.orientations.find(opt => opt.id === id);
        return o?.label?.[locale] || id;
    });

    const values = results.ORIENTATION_IDS.map(id => Math.round(results.scores[id]));

    // Use a single brand color for all points
    const pointColors = results.ORIENTATION_IDS.map(() => "var(--primary-color)");

    const priorityValues = results.ORIENTATION_IDS.map(id => {
        const raw = storedPriorities[id] || 0;
        return ((raw - 1) / 4) * 100; // Normalize 1-5 to 0-100
    });

    const copy = SHARE_COPY[locale] || SHARE_COPY.sv;

    const updateShareForm = (field, value) => {
        setShareForm(prev => ({ ...prev, [field]: value }));
        if (shareStatus.type === "error") {
            setShareStatus({ type: "", message: "" });
        }
    };

    const buildResearchPayload = () => {
        const submittedAt = new Date().toISOString();
        const sessionId = storedSession.sessionId || "unknown-session";
        const filename = `ai-readiness-${submittedAt.replace(/[:.]/g, "-")}-${sessionId}.json`;
        const orientationResults = results.ORIENTATION_IDS.map(id => {
            const orientation = bank.orientations.find(o => o.id === id);
            return {
                id,
                label: orientation?.label || {},
                description: orientation?.description || {},
                scorePct: Math.round(results.results[id].score),
                averageLikert: results.results[id].average,
                priorityLikert: storedPriorities[id] || null,
            };
        });

        const answers = bank.items.map(item => ({
            itemId: item.id,
            orientationId: item.orientationId,
            text: item.text,
            response: responses[item.id] ?? null,
            reverseScored: Boolean(item.reverseScored),
        }));

        // Flat, fixed-key representation so each submission maps 1:1 to columns
        // in a tabular store (e.g. a SharePoint List via Power Automate) with no
        // array iteration. Keys are stable: score_/avg_/priority_<ORIENTATION>
        // and one key per question id.
        // consentGiven is intentionally omitted: data is only ever collected
        // when consent is true, so the column would be constant. Consent is
        // still recorded in `context` and enforced server-side.
        const flat = {
            submittedAt,
            sessionId: storedSession.sessionId || null,
            locale,
            schoolOrg: shareForm.schoolOrg,
            schoolOrgOther: shareForm.schoolOrgOther,
            role: shareForm.role,
            principal: shareForm.principal,
            municipalitySize: shareForm.municipalitySize,
            privateSchoolSize: shareForm.privateSchoolSize,
        };
        orientationResults.forEach(orientation => {
            flat[`score_${orientation.id}`] = orientation.scorePct;
            flat[`avg_${orientation.id}`] = orientation.averageLikert;
            flat[`priority_${orientation.id}`] = orientation.priorityLikert;
        });
        answers.forEach(answer => {
            flat[answer.itemId] = answer.response;
        });

        return {
            schemaVersion: "1.1.0",
            source: "AI Readiness Self-Assessment Tool",
            submittedAt,
            filename,
            locale,
            session: {
                sessionId: storedSession.sessionId || null,
                startedAt: storedSession.startedAt || null,
                completedAt: storedSession.completedAt || null,
            },
            context: {
                schoolOrg: shareForm.schoolOrg,
                schoolOrgOther: shareForm.schoolOrgOther,
                role: shareForm.role,
                principal: shareForm.principal,
                municipalitySize: shareForm.municipalitySize,
                privateSchoolSize: shareForm.privateSchoolSize,
                consentGiven: shareForm.consent,
            },
            priorities: storedPriorities,
            results: orientationResults,
            answers,
            flat,
        };
    };

    const handleShareSubmit = async (event) => {
        event.preventDefault();
        const needsSchoolOther = shareForm.schoolOrg === "other" && !shareForm.schoolOrgOther.trim();
        const requiredMissing = !shareForm.schoolOrg || needsSchoolOther || !shareForm.role.trim() || !shareForm.principal || !shareForm.consent;

        if (requiredMissing) {
            setShareStatus({ type: "error", message: copy.required });
            return;
        }

        setIsSubmittingShare(true);
        setShareStatus({ type: "", message: "" });

        try {
            const payload = buildResearchPayload();
            const response = await fetch("/api/share-results", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const details = await response.json().catch(() => null);
                if (details?.error) {
                    throw new Error(details.error);
                }
                throw new Error("Share request failed");
            }

            setShareStatus({ type: "success", message: copy.success });
            setShareOpen(false);
        } catch (error) {
            setShareStatus({ type: "error", message: error instanceof Error && error.message ? error.message : copy.error });
        } finally {
            setIsSubmittingShare(false);
        }
    };

    return (
        <section className="page page-results fade-in">
            <div className="card">
                <PrintHeader title={t("organization.resultsTitle")} />
                <h1>{t("organization.resultsTitle")}</h1>

                <div style={{ margin: "0 auto 3rem", maxWidth: "800px" }}>

                    {/* Legend for Current vs Target */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "16px", height: "16px", background: "#a9cee07a", border: "2px solid #2779a1", borderRadius: "4px" }}></div>
                            <span style={{ fontWeight: 500 }}>{locale === 'sv' ? "Nuvarande prioriteringar" : "Current Priorities"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "16px", height: "0px", borderTop: "2px dashed #00A29A" }}></div>
                            <span style={{ fontWeight: 500 }}>{locale === 'sv' ? "Målbild" : "Target"}</span>
                        </div>
                    </div>

                    <div className="radar-container org-radar" style={{ height: '450px', width: '100%' }}>
                        <RadarChart
                            labels={labels}
                            values={values}
                            overlayValues={priorityValues}
                            pointColors={pointColors}
                            maxValue={100}
                        />
                    </div>
                </div>

                {/* Narrative / Feedback using Accardeon or Cards */}

                {/* Narrative / Feedback using Accardeon or Cards */}

                <div className="results-narrative">
                    {/* Removed 'Prominent Orientations' heading as requested */}

                    {/* Sort results by score descending */}
                    {results.ORIENTATION_IDS
                        .map(id => ({
                            id,
                            score: results.results[id].score,
                            average: results.results[id].average,
                            ...bank.orientations.find(o => o.id === id)
                        }))
                        .sort((a, b) => b.score - a.score)
                        .map(item => (
                            <div key={item.id} className="narrative-block" style={{
                                background: "var(--surface-color)",
                                padding: "1rem",
                                borderRadius: "var(--radius-lg)",
                                border: "1px solid var(--border-color)",
                                marginBottom: "0.5rem"
                            }}>
                                <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>
                                    {item.label[locale]}
                                </h2>

                                {/* Score Display: Current vs Priority */}
                                <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                                    <div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            {locale === 'sv' ? "Nuvarande" : "Current"}
                                        </div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2779a1" }}>
                                            {Math.round(item.average)} / 5
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            {locale === 'sv' ? "Målbild" : "Target"}
                                        </div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--secondary-color, #00A29A)" }}>
                                            {storedPriorities[item.id] || 3} / 5
                                        </div>
                                    </div>
                                </div>

                                <p className="large-text">{item.description[locale]}</p>

                                {/* Gap Analysis Suggestion */}
                                {gapSuggestions && (() => {
                                    const priority = storedPriorities[item.id] || 3;
                                    const currentAvg = parseFloat(item.average);
                                    const level = getGapLevel(priority, currentAvg);
                                    const suggestion = gapSuggestions[item.id]?.[level]?.[locale];

                                    const levelConfig = {
                                        aligned: { color: '#00A29A', bg: '#00a29a15', border: '#00A29A', badge: locale === 'sv' ? '✓ I linje med prioritering' : '✓ Aligned with priority' },
                                        minor: { color: '#5292b3', bg: '#a9cee01e', border: '#a9cee0', badge: locale === 'sv' ? 'Litet glapp' : 'Minor gap' },
                                        moderate: { color: '#d4b54c', bg: '#ecd89621', border: '#ecd896', badge: locale === 'sv' ? 'Måttligt glapp' : 'Moderate gap' },
                                        significant: { color: '#cf6339', bg: '#f5ad901a', border: '#f5ac90', badge: locale === 'sv' ? 'Betydande glapp' : 'Significant gap' },
                                        surplus: { color: '#8e0826', bg: '#ebd1d03b', border: '#ebd1d0d2', badge: locale === 'sv' ? 'Överstiger prioritering' : 'Exceeds priority' },
                                    };
                                    const cfg = levelConfig[level];

                                    return suggestion ? (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            backgroundColor: cfg.bg,
                                            borderLeft: `4px solid ${cfg.color}`,
                                            border: `1px solid ${cfg.border}`,
                                            borderLeftWidth: '4px',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    color: cfg.color,
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '999px',
                                                    backgroundColor: 'white',
                                                    border: `1px solid ${cfg.border}`,
                                                }}>
                                                    {cfg.badge}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: '1.6' }}
                                                dangerouslySetInnerHTML={{ __html: suggestion }} />
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        ))}
                </div>

                <div className="results-actions" style={{ marginTop: "3rem" }}>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        {t("common.exportPdf")}
                    </button>
                </div>

                <div className="research-share">
                    <div className="research-share-prompt">
                        <h2>{copy.promptTitle}</h2>
                        <p>{copy.promptBody}</p>
                        <button
                            type="button"
                            className="research-share-link"
                            onClick={() => setShareOpen(true)}
                        >
                            {copy.openForm}
                        </button>
                    </div>

                    {shareStatus.message && (
                        <p className={`share-status share-status-${shareStatus.type}`} role="status">
                            {shareStatus.message}
                        </p>
                    )}

                    {shareOpen && (
                        <form className="share-form" onSubmit={handleShareSubmit}>
                            <h2>{copy.formTitle}</h2>
                            <div className="share-info">
                                {copy.formBody.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                                <p>
                                    {copy.contact}<br />
                                    Johan Lundin, Göteborgs universitet: <a href="mailto:johan.lundin@ait.gu.se">johan.lundin@ait.gu.se</a><br />
                                    Thomas Hillman, Göteborgs universitet: <a href="mailto:thomas.hillman@ait.gu.se">thomas.hillman@ait.gu.se</a>
                                </p>
                            </div>

                            <h3>{copy.questionsTitle}</h3>
                            <div className="share-form-grid">
                                <label className="field">
                                    <span>{copy.schoolOrg} *</span>
                                    <select value={shareForm.schoolOrg} onChange={(event) => updateShareForm("schoolOrg", event.target.value)} required>
                                        <option value="">{copy.choose}</option>
                                        <option value="yes">{copy.yes}</option>
                                        <option value="no">{copy.no}</option>
                                        <option value="other">{copy.other}</option>
                                    </select>
                                </label>

                                {shareForm.schoolOrg === "other" && (
                                    <label className="field">
                                        <span>{copy.other}</span>
                                        <input
                                            value={shareForm.schoolOrgOther}
                                            onChange={(event) => updateShareForm("schoolOrgOther", event.target.value)}
                                            placeholder={copy.otherPlaceholder}
                                            required
                                        />
                                    </label>
                                )}

                                <label className="field">
                                    <span>{copy.role} *</span>
                                    <input
                                        value={shareForm.role}
                                        onChange={(event) => updateShareForm("role", event.target.value)}
                                        required
                                    />
                                </label>

                                <label className="field">
                                    <span>{copy.principal} *</span>
                                    <select value={shareForm.principal} onChange={(event) => updateShareForm("principal", event.target.value)} required>
                                        <option value="">{copy.choose}</option>
                                        <option value="municipal">{copy.municipal}</option>
                                        <option value="private">{copy.private}</option>
                                    </select>
                                </label>

                                {shareForm.principal === "municipal" && (
                                    <label className="field">
                                        <span>{copy.municipalitySize}</span>
                                        <select value={shareForm.municipalitySize} onChange={(event) => updateShareForm("municipalitySize", event.target.value)}>
                                            <option value="">{copy.choose}</option>
                                            {SIZE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </label>
                                )}

                                {shareForm.principal === "private" && (
                                    <label className="field">
                                        <span>{copy.privateSchoolSize}</span>
                                        <select value={shareForm.privateSchoolSize} onChange={(event) => updateShareForm("privateSchoolSize", event.target.value)}>
                                            <option value="">{copy.choose}</option>
                                            {SCHOOL_SIZE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </label>
                                )}

                            </div>

                            <label className="checkbox-label share-consent">
                                <input
                                    type="checkbox"
                                    checked={shareForm.consent}
                                    onChange={(event) => updateShareForm("consent", event.target.checked)}
                                    required
                                />
                                <span>{copy.consent}</span>
                            </label>

                            <div className="share-form-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShareOpen(false)}>
                                    {copy.cancel}
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmittingShare}>
                                    {isSubmittingShare ? copy.submitting : copy.submit}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
