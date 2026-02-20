"use client";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function AboutPage() {
    const { t, locale } = useI18n();

    return (
        <section className="page fade-in">
            <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1>{t("about.title")}</h1>
                <p className="lead" style={{ marginBottom: "2.5rem" }}>
                    {t("about.intro")}
                </p>

                {/* CREDtech */}
                <div className="about-org" style={{
                    padding: "2rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    marginBottom: "1.5rem",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        <img
                            src="/credtech-logo.png"
                            alt="CREDtech"
                            style={{ height: "48px", objectFit: "contain" }}
                        />
                    </div>
                    <p style={{ lineHeight: "1.7", color: "var(--color-text-secondary)", margin: "0 0 1rem 0" }}>
                        {t("about.credtechDescription")}
                    </p>
                    <a
                        href="https://www.credtech.se"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                    >
                        credtech.se
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </a>
                </div>

                {/* Göteborgsregionen */}
                <div className="about-org" style={{
                    padding: "2rem",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    marginBottom: "2.5rem",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        <img
                            src="/gr-logo.png"
                            alt="Göteborgsregionen"
                            style={{ height: "48px", objectFit: "contain" }}
                        />
                    </div>
                    <p style={{ lineHeight: "1.7", color: "var(--color-text-secondary)", margin: "0 0 1rem 0" }}>
                        {t("about.grDescription")}
                    </p>
                    <a
                        href="https://goteborgsregionen.se"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                    >
                        goteborgsregionen.se
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                    </a>
                </div>


            </div>
        </section>
    );
}
