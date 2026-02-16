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
    const [responses, setResponses] = useState({});
    const [storedPriorities, setStoredPriorities] = useState({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("organization_state") || "{}");
        setResponses(stored.answers || {});

        const priorities = JSON.parse(localStorage.getItem("org_priorities") || "{}");
        setStoredPriorities(priorities);

        setMounted(true);
    }, []);

    const [narratives, setNarratives] = useState(null);

    useEffect(() => {
        fetch("/narratives.json")
            .then(r => r.json())
            .then(setNarratives)
            .catch(err => console.error("Failed to load narratives", err));
    }, []);

    if (!mounted) return <div className="loading text-center p-8">{t("common.loading")}</div>;

    const results = scoreOrganization(bank.items, responses);

    // Generate labels and values for Radar Chart
    const labels = results.ORIENTATION_IDS.map(id => {
        const o = bank.orientations.find(opt => opt.id === id);
        return o?.label?.[locale] || id;
    });

    const values = results.ORIENTATION_IDS.map(id => Math.round(results.scores[id]));

    // Calculate point colors based on logic score (0=Sep, 100=Int)
    // Sep (0) -> Blue (#3182ce) -> rgb(49, 130, 206)
    // Int (100) -> Green (#38a169) -> rgb(56, 161, 105)

    const interpolateColor = (score) => {
        const t = Math.max(0, Math.min(1, score / 100)); // Clamp 0-1

        const r1 = 49, g1 = 130, b1 = 206; // Blue
        const r2 = 56, g2 = 161, b2 = 105; // Green

        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return `rgb(${r}, ${g}, ${b})`;
    };

    const pointColors = results.ORIENTATION_IDS.map(id => {
        const logic = results[id]?.logicScore || 50;
        return interpolateColor(logic);
    });

    const priorityValues = results.ORIENTATION_IDS.map(id => {
        const raw = storedPriorities[id] || 0;
        return ((raw - 1) / 4) * 100; // Normalize 1-5 to 0-100
    });

    // Generate narrative (feedback) for the top result + logic
    const narrative = narratives ? generateNarrative(results, t, bank.orientations, narratives, locale) : { narrativeItems: [], logicItem: null };

    return (
        <section className="page page-results fade-in">
            <div className="card">
                <PrintHeader title={t("organization.resultsTitle")} />
                <h1>{t("organization.resultsTitle")}</h1>

                <div style={{ margin: "0 auto 3rem", maxWidth: "800px" }}>
                    <p className="lead" style={{ marginBottom: "2rem", textAlign: "center" }}>
                        {t("organization.resultsIntro")}
                    </p>

                    {/* Legend for Colors (Gradient) */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem", fontSize: "0.9rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#3182ce" }}></span>
                            <span>Separering (Centralt)</span>
                        </div>
                        <div style={{
                            height: "6px",
                            width: "80px",
                            background: "linear-gradient(90deg, #3182ce 0%, #38a169 100%)",
                            borderRadius: "3px",
                            alignSelf: "center",
                            margin: "0 0.5rem"
                        }}></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#38a169" }}></span>
                            <span>Integrering (Lokalt)</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "2rem", fontSize: "0.9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: "20px", borderTop: "2px dashed #ed8936" }}></span>
                            <span>Prioritering</span>
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

                <div className="results-narrative">
                    <h2>Framträdande orienteringar</h2>
                    {narrative.narrativeItems.map(item => (
                        <div key={item.id} className="narrative-block" style={{
                            background: "var(--surface-color)",
                            padding: "2rem",
                            borderRadius: "var(--radius-lg)",
                            border: "1px solid var(--border-color)",
                            marginBottom: "2rem"
                        }}>
                            <h2 style={{ marginTop: 0, color: "var(--primary-color)" }}>
                                {item.label} ({item.score}%)
                            </h2>
                            <p className="large-text">{item.description}</p>

                            <hr style={{ margin: "1.5rem 0", borderColor: "var(--border-color)" }} />

                            {item.details && (
                                <div className="feedback-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
                                    <div>
                                        <h3 style={{ fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
                                            Kärnfråga
                                        </h3>
                                        <p style={{ fontStyle: "italic", fontSize: "1.1rem" }}>
                                            "{item.details.core_question[locale]}"
                                        </p>
                                    </div>

                                    <div className="grid-cols-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
                                        <div>
                                            <h3 style={{ fontSize: "1rem", color: "var(--success-color, green)" }}>
                                                Vad räknas som framgång
                                            </h3>
                                            <p>{item.details.success_criteria[locale]}</p>
                                        </div>

                                        <div>
                                            <h3 style={{ fontSize: "1rem", color: "var(--foreground)" }}>
                                                Typiska drivkrafter
                                            </h3>
                                            <p>{item.details.drivers[locale]}</p>
                                        </div>
                                    </div>

                                    <div style={{ background: "#fff0f0", padding: "1rem", borderRadius: "8px", border: "1px solid #ffcccc" }}>
                                        <h3 style={{ fontSize: "1rem", color: "#cc0000", marginTop: 0 }}>
                                            ⚠️ Möjlig blind fläck
                                        </h3>
                                        <p style={{ margin: 0 }}>
                                            {item.details.blind_spots[locale]}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
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
