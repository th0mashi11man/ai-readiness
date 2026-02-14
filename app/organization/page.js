"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useQuizStore } from "@/lib/store";
import { scoreOrganization, generateNarrative } from "@/lib/scoring";
import BarChart from "@/components/BarChart";
import RadarChart from "@/components/RadarChart";
import LogicSpectrum from "@/components/LogicSpectrum";

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

    useEffect(() => {
        fetch("/org_itembank.json")
            .then((r) => r.json())
            .then(setBank);
    }, []);

    if (!bank) return <div className="loading">{t("common.loading")}</div>;

    return (
        <>
            {phase === "intro" && (
                <IntroScreen bank={bank} t={t} onStart={() => setPhase("survey")} />
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
                <button className="btn btn-primary" onClick={onStart}>
                    {t("organization.startButton")}
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

    const [narratives, setNarratives] = useState(null);

    useEffect(() => {
        fetch("/narratives.json")
            .then(r => r.json())
            .then(setNarratives)
            .catch(err => console.error("Failed to load narratives", err));
    }, []);

    const results = scoreOrganization(bank.items, responses);
    const archetypeLabels = results.ARCHETYPE_IDS.map(
        (id) => t(bank.archetypes.find((a) => a.id === id)?.label)
    );
    const logicLabels = results.LOGIC_IDS.map(
        (id) => t(bank.logics.find((l) => l.id === id)?.label)
    );

    const narrative = narratives ? generateNarrative(
        results,
        t,
        archetypeLabels,
        logicLabels,
        narratives,
        locale
    ) : { logicText: "Laddar...", archetypeText: "Laddar..." };

    const archetypeValues = results.ARCHETYPE_IDS.map(
        (id) => Math.round(results.archetypeMarginals[id])
    );
    const logicValues = results.LOGIC_IDS.map(
        (id) => Math.round(results.logicMarginals[id])
    );

    return (
        <section className="page page-results fade-in">
            <div className="card">
                <h1>{t("organization.resultsTitle")}</h1>

                {/* Archetype Profile */}
                <h2>{t("organization.archetypeTotalsTitle")}</h2>
                {/* Archetype Visualization - Made Bigger */}
                <div className="radar-container org-radar" style={{ height: '500px', margin: '0 auto 2rem', maxWidth: '1000px', width: '100%' }}>
                    <RadarChart labels={archetypeLabels} values={archetypeValues} maxValue={100} hideValues={true} />
                </div>
                <div className="fluid-narrative mt-4 mb-8 text-secondary">
                    <p>{narrative.archetypeText}</p>
                </div>

                {/* Logic Profile */}
                <h2>{t("organization.logicSpectrumTitle")}</h2>
                <LogicSpectrum
                    scores={results.logicMarginals}
                    labels={{
                        SEP: t(bank.logics.find(l => l.id === "SEP")?.label),
                        HYB: t(bank.logics.find(l => l.id === "HYB")?.label),
                        INT: t(bank.logics.find(l => l.id === "INT")?.label),
                    }}
                    t={t}
                />

                {/* Logic Narrative - Continuous Flow */}
                {narrative && (
                    <div className="fluid-narrative mt-4 mb-8 text-secondary">
                        <p>
                            {narrative.logicText} {narrative.riskText} {narrative.diagText}
                        </p>
                    </div>
                )}

                <div className="results-actions">
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        {t("common.exportPdf")}
                    </button>
                </div>
            </div>
        </section>
    );
}
