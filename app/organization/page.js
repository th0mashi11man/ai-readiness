"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useQuizStore } from "@/lib/store";
import { scoreOrganization, generateNarrative } from "@/lib/scoring";
import BarChart from "@/components/BarChart";
import RadarChart from "@/components/RadarChart";
import LogicSpectrum from "@/components/LogicSpectrum";
import PrintHeader from "@/components/PrintHeader";

import { Suspense } from "react";

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
    const [phase, setPhase] = useState(searchParams.get("phase") || "intro");

    // Check for stored priorities
    useEffect(() => {
        const stored = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("org_priorities") || "{}") : {};
        if (Object.keys(stored).length > 0 && phase === "intro") {
            // Optional: could skip priority step if already done? 
            // For now, simpler to always let them review/start fresh or relying on flow.
        }
    }, []);

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
        <>
            {phase === "intro" && (
                <IntroScreen bank={bank} t={t} onStart={() => setPhase("priority")} />
            )}
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
                    onRestart={() => setPhase("intro")}
                />
            )}
        </>
    );
}

function IntroScreen({ bank, t, onStart }) {
    return (
        <section className="page fade-in">
            <div className="card">
                <h1>{t("organization.title")}</h1>
                <p>{t("organization.description")}</p>

                <button className="btn btn-primary" onClick={onStart} style={{ marginTop: "2rem" }}>
                    {t("organization.startButton")}
                </button>
            </div>
        </section>
    );
}

function PriorityStep({ bank, t, locale, onComplete }) {
    const [priorities, setPriorities] = useState({});

    // Initialize with 3 (middle) if not set
    useEffect(() => {
        const initial = {};
        bank.orientations.forEach(o => initial[o.id] = 3);
        setPriorities(initial);
    }, [bank]);

    const handleChange = (id, val) => {
        setPriorities(prev => ({ ...prev, [id]: parseInt(val) }));
    };

    return (
        <section className="page fade-in">
            <div className="card">
                <h1 style={{ marginBottom: "0.5rem" }}>Prioritering</h1>
                <p className="lead" style={{ marginBottom: "2rem" }}>
                    Hur viktig är respektive orientering för er organisation? (1 = Inte viktig, 5 = Mycket viktig)
                </p>

                <div className="priority-list" style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
                    {bank.orientations.map(orient => (
                        <div key={orient.id} style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <h3 style={{ margin: 0 }}>{orient.label[locale]}</h3>
                                <div style={{ fontWeight: "bold", fontSize: "1.2rem", color: "var(--primary-color)" }}>
                                    {priorities[orient.id]} / 5
                                </div>
                            </div>
                            <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "var(--muted-foreground)" }}>
                                {orient.description[locale]}
                            </p>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                value={priorities[orient.id] || 3}
                                onChange={(e) => handleChange(orient.id, e.target.value)}
                                style={{ width: "100%", accentColor: "var(--primary-color)" }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--muted-foreground)", marginTop: "0.2rem" }}>
                                <span>Inte viktig</span>
                                <span>Mycket viktig</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="btn btn-primary" onClick={() => onComplete(priorities)}>
                    Gå vidare till frågorna
                </button>
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

                <h2 className="quiz-question">{t(currentItem.prompt)}</h2>

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

                <div className="quiz-actions">
                    <button className="btn btn-text btn-sm" onClick={reset}>
                        {t("common.restart")}
                    </button>
                </div>
            </div>
        </section>
    );
}


function OrgResults({ bank, t, locale, onRestart }) {
    const stored =
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("organization_state") || "{}")
            : {};
    const responses = stored.answers || {};

    const storedPriorities =
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("org_priorities") || "{}")
            : {};

    const [narratives, setNarratives] = useState(null);

    useEffect(() => {
        fetch("/narratives.json")
            .then(r => r.json())
            .then(setNarratives)
            .catch(err => console.error("Failed to load narratives", err));
    }, []);

    const results = scoreOrganization(bank.items, responses);

    // Generate labels and values for Radar Chart
    const labels = results.ORIENTATION_IDS.map(id => {
        const o = bank.orientations.find(opt => opt.id === id);
        return o?.label?.[locale] || id;
    });

    const values = results.ORIENTATION_IDS.map(id => Math.round(results.scores[id]));

    // Convert 1-5 priority to 0-100 for comparison overlay
    const priorityValues = results.ORIENTATION_IDS.map(id => {
        const raw = storedPriorities[id] || 0;
        return ((raw - 1) / 4) * 100; // Normalize 1-5 to 0-100 same as scoring
    });

    // Generate narrative (feedback) for the top result + logic
    const narrative = narratives ? generateNarrative(results, t, bank.orientations, narratives, locale) : { narrativeItems: [], logicItem: null };

    return (
        <section className="page page-results fade-in">
            <div className="card">
                <PrintHeader title={t("organization.resultsTitle")} />
                <h1>{t("organization.resultsTitle")}</h1>

                {/* Radar Chart */}
                <div style={{ margin: "0 auto 3rem", maxWidth: "800px" }}>
                    <p className="lead" style={{ marginBottom: "2rem", textAlign: "center" }}>
                        {t("organization.resultsIntro", "Här är er organisations profil baserat på svaren. Blått fält visar utfallet av frågorna, medan den orangea streckade linjen visar er angivna prioritering.")}
                    </p>
                    <div className="radar-container org-radar" style={{ height: '400px', width: '100%' }}>
                        <RadarChart
                            labels={labels}
                            values={values}
                            overlayValues={priorityValues}
                            maxValue={100}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", fontSize: "0.9rem", color: "var(--muted-foreground)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: 12, height: 12, backgroundColor: "rgba(44, 82, 130, 0.4)", borderRadius: "2px" }}></span>
                            <span>Resultat (Nuläge)</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: 12, height: 12, border: "2px dashed #ed8936", borderRadius: "2px" }}></span>
                            <span>Prioritering (Önskat läge)</span>
                        </div>
                    </div>
                </div>

                {/* Narrative / Feedback using Accardeon or Cards */}
                <div className="results-narrative">
                    <h2>Framträdande orienteringar</h2>
                    {narrative.narrativeItems.map(item => (
                        <div key={item.id} className="narrative-block" style={{
                            background: "var(--surface-color)",
                            padding: "2rem",
                            borderRadius: "var(--radius-lg)",
                            border: "1px solid var(--border-color)",
                    {topOrientations.map(item => {
                                const def = bank.orientations.find(o => o.id === item.id);
                                if (!def) return null;
                                const feedback = def.feedback;
                                return (
                                    <div key={item.id} className="narrative-block">
                                        <h3>{def.label[locale]} ({Math.round(item.score)}%)</h3>
                                        <p>{def.description[locale]}</p>

                                        <div className="feedback-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                                            <div className="feedback-item">
                                                <strong>Frågeställning:</strong> {feedback.core_question[locale]}
                                            </div>
                                            <div className="feedback-item">
                                                <strong>Framgångsfaktor:</strong> {feedback.success_criteria[locale]}
                                            </div>
                                            <div className="feedback-item">
                                                <strong>Drivkraft:</strong> {feedback.drivers[locale]}
                                            </div>
                                            <div className="feedback-item">
                                                <strong>Blind fläck:</strong> {feedback.blind_spots[locale]}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                </div>

                <div className="results-actions" style={{ marginTop: "3rem" }}>
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        {t("common.exportPdf")}
                    </button>
                    <button className="btn btn-outline" onClick={onRestart}>
                        {t("common.restart")}
                    </button>
                </div>
            </div>
        </section>
    );
}
