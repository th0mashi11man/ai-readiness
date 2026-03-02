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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("organization_state") || "{}");
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

    // Generate labels and values for Radar Chart
    // (Ensure fresh build)
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

    return (
        <section className="page page-results fade-in">
            <div className="card">
                <PrintHeader title={t("organization.resultsTitle")} />
                <h1>{t("organization.resultsTitle")}</h1>

                <div style={{ margin: "0 auto 3rem", maxWidth: "800px" }}>

                    {/* Legend for Current vs Target */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "16px", height: "16px", background: "rgba(49, 130, 206, 0.4)", border: "2px solid #3182ce", borderRadius: "4px" }}></div>
                            <span style={{ fontWeight: 500 }}>{locale === 'sv' ? "Nuvarande prioriteringar" : "Current Priorities"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "16px", height: "0px", borderTop: "2px dashed #ed8936" }}></div>
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
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3182ce" }}>
                                            {Math.round(item.average)} / 5
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: "0.9rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            {locale === 'sv' ? "Målbild" : "Target"}
                                        </div>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--secondary-color, #f59e0b)" }}>
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
                                        aligned: { color: '#22c55e', bg: '#f0fdf4', border: '#86efac', badge: locale === 'sv' ? '✓ I linje med prioritering' : '✓ Aligned with priority' },
                                        minor: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', badge: locale === 'sv' ? 'Litet glapp' : 'Minor gap' },
                                        moderate: { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', badge: locale === 'sv' ? 'Måttligt glapp' : 'Moderate gap' },
                                        significant: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', badge: locale === 'sv' ? 'Betydande glapp' : 'Significant gap' },
                                        surplus: { color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd', badge: locale === 'sv' ? 'Överstiger prioritering' : 'Exceeds priority' },
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
                    {/* Restart button removed as requested */}
                </div>
            </div>
        </section>
    );
}
