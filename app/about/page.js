"use client";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
    const { t, uiStrings } = useI18n();
    const refs = uiStrings.about?.references || [];

    return (
        <section className="page page-about fade-in">
            <div className="card">
                <h1>{t("about.title")}</h1>
                <p className="about-body">{t("about.body")}</p>
                <h2>{t("about.referencesTitle")}</h2>
                <ul className="references-list">
                    {refs.map((ref, i) => (
                        <li key={i} className="ref-item">
                            <a href={ref.url} target="_blank" rel="noopener noreferrer">
                                {t(ref.label)}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
