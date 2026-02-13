"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useQuizStore } from "@/lib/store";
import { scoreIndividual } from "@/lib/scoring";
import RadarChart from "@/components/RadarChart";
import HorizontalBarChart from "@/components/HorizontalBarChart";

import { Suspense } from "react";

export default function IndividualPage() {
    return (
        <Suspense fallback={<div className="loading">Laddar...</div>}>
            <IndividualContent />
        </Suspense>
    );
}

function IndividualContent() {
    const { t, locale } = useI18n();
    const searchParams = useSearchParams();
    const [bank, setBank] = useState(null);
    const [phase, setPhase] = useState(searchParams.get("phase") || "intro");

    useEffect(() => {
        fetch("/mcq_itembank.json")
            .then((r) => r.json())
            .then(setBank);
    }, []);

    if (!bank) return <div className="loading">{t("common.loading")}</div>;

    return (
        <>
            {phase === "intro" && (
                <IntroScreen bank={bank} t={t} onStart={() => setPhase("quiz")} />
            )}
            {phase === "quiz" && (
                <QuizFlow
                    bank={bank}
                    onComplete={() => setPhase("results")}
                    t={t}
                    locale={locale}
                />
            )}
            {phase === "results" && (
                <ResultsScreen
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
                <h1>{t("individual.title")}</h1>
                <p>{t("individual.description")}</p>
                <button className="btn btn-primary" onClick={onStart}>
                    {t("individual.startButton")}
                </button>
            </div>
        </section>
    );
}

function QuizFlow({ bank, onComplete, t, locale }) {
    const {
        state,
        initialized,
        setAnswer,
        goNext,
        goBack,
        complete,
        reset,
    } = useQuizStore("individual_state", bank.items, bank.settings.randomizeQuestions);

    const [showWarning, setShowWarning] = useState(false);

    if (!initialized || !state) return <div className="loading">{t("common.loading")}</div>;

    const currentItemId = state.itemOrder[state.currentIndex];
    const currentItem = bank.items.find((it) => it.id === currentItemId);
    const selectedAnswer = state.answers[currentItemId];
    const isLast = state.currentIndex === state.itemOrder.length - 1;

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

    const handleBack = () => {
        setShowWarning(false);
        goBack();
    };

    const handleRestart = () => {
        reset();
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

                <div className="options-list" role="radiogroup" aria-label="Answer options">
                    {currentItem.options.map((opt, idx) => (
                        <label
                            key={idx}
                            className={`option-card ${selectedAnswer === idx ? "selected" : ""}`}
                        >
                            <input
                                type="radio"
                                name={`q_${currentItemId}`}
                                value={idx}
                                checked={selectedAnswer === idx}
                                onChange={() => {
                                    setAnswer(currentItemId, idx);
                                    setShowWarning(false);
                                }}
                                aria-label={t(opt)}
                            />
                            <span className="option-marker">{String.fromCharCode(65 + idx)}</span>
                            <span className="option-text">{t(opt)}</span>
                        </label>
                    ))}
                </div>

                {showWarning && (
                    <p className="warning" role="alert">{t("individual.answerRequired")}</p>
                )}

                <div className="quiz-nav">
                    {state.currentIndex > 0 && (
                        <button className="btn btn-ghost" onClick={handleBack}>
                            {t("common.back")}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={handleNext}>
                        {isLast ? t("common.finish") : t("common.next")}
                    </button>
                </div>

                <div className="quiz-actions">
                    <button className="btn btn-text btn-sm" onClick={handleRestart}>
                        {t("common.restart")}
                    </button>
                </div>
            </div>
        </section>
    );
}

function ResultsScreen({ bank, t, locale, onRestart }) {
    const stored = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("individual_state") || "{}")
        : {};
    const answers = stored.answers || {};

    const results = scoreIndividual(bank.items, answers, bank.domains);

    const domainLabels = bank.domains.map((d) => t(d.label));
    const domainValues = bank.domains.map((d) => results.domainScores[d.id]?.correct || 0);
    const maxPerDomain = 3;

    const [expandedItems, setExpandedItems] = useState({});
    const toggleItem = (id) => {
        setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const orderedItems = (stored.itemOrder || bank.items.map(i => i.id))
        .map(id => bank.items.find(it => it.id === id))
        .filter(Boolean);

    const domainTooltips = bank.domains.map((d) => t(`individual.tooltip_${d.id}`));

    return (
        <section className="page page-results fade-in">
            <div className="card">
                <h1>{t("individual.resultsTitle")}</h1>
                <p style={{ marginBottom: "2rem", fontSize: "1.1rem" }}>
                    <strong>{results.totalCorrect} / {results.totalItems}</strong> {t("individual.totalScore")}
                </p>

                <h2>{t("individual.domainScoresTitle")}</h2>
                <div className="bar-chart-container">
                    <HorizontalBarChart
                        labels={domainLabels}
                        values={domainValues}
                        maxValue={maxPerDomain}
                        hideValues={true}
                        tooltips={domainTooltips}
                        ids={bank.domains.map(d => d.id)}
                        crossCuttingLabel={t("individual.crossCutting")}
                    />
                </div>

                <div className="results-actions">
                    <button className="btn btn-primary" onClick={() => window.print()}>
                        {t("common.exportPdf")}
                    </button>
                </div>

                {/* Reflection section for Individual */}
                <div className="reflection-section-box card-highlight" style={{ marginTop: '2rem' }}>
                    <h2 className="text-accent">{t("individual.reflectionsTitle")}</h2>
                    <ul className="narrative-list">
                        {bank.domains.map(domain => {
                            const score = results.domainScores[domain.id]?.correct || 0;
                            const total = results.domainScores[domain.id]?.total || 1;
                            // Show prompt if user missed at least one question in this domain
                            if (score < total) {
                                return (
                                    <li key={domain.id} style={{ marginBottom: '1rem' }}>
                                        <strong>{t(domain.label)}:</strong><br />
                                        <span className="text-secondary">{t(`individual.prompts.${domain.id}`)}</span>
                                    </li>
                                );
                            }
                            return null;
                        })}
                    </ul>
                </div>

                <h2>{t("individual.reviewAnswersTitle")}</h2>
                <div className="review-list">
                    {orderedItems.map((item, i) => {
                        const userAnswer = answers[item.id];
                        const isCorrect = userAnswer === item.correctOptionIndex;

                        return (
                            <div
                                key={item.id}
                                className={`review-item ${isCorrect ? "correct" : "incorrect"}`}
                            >
                                <div className="review-header">
                                    <span className={`review-badge ${isCorrect ? "correct" : "incorrect"}`}>
                                        {isCorrect ? "✓" : "✗"}
                                    </span>
                                    <span className="review-question">{i + 1}. {t(item.prompt)}</span>
                                </div>

                                <div className="review-answers">
                                    <p>
                                        <strong>{t("individual.yourAnswer")}:</strong>{" "}
                                        <span className={isCorrect ? "text-correct" : "text-incorrect"}>
                                            {userAnswer !== undefined && userAnswer !== null
                                                ? t(item.options[userAnswer])
                                                : "—"}
                                        </span>
                                    </p>
                                    {!isCorrect && (
                                        <p>
                                            <strong>{t("individual.correctAnswer")}:</strong>{" "}
                                            <span className="text-correct">
                                                {t(item.options[item.correctOptionIndex])}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    className="btn btn-text btn-sm"
                                    onClick={() => toggleItem(item.id)}
                                >
                                    {expandedItems[item.id]
                                        ? t("individual.hideExplanation")
                                        : t("individual.showExplanation")}
                                </button>
                                {expandedItems[item.id] && (
                                    <div className="review-rationale">
                                        {t(item.rationale)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
