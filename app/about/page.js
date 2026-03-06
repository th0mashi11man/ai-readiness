"use client";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";

// Test data seeders — fill localStorage and navigate to results
function seedOrgAndGo(router, profile) {
    let answers = {};
    let priorities = {};

    // Updated items matching org_itembank.json (4 per orientation)
    const items = [];
    const orientations = ["EFF", "ANA", "TEC", "SUP", "KNO"];

    orientations.forEach(or => {
        for (let i = 1; i <= 4; i++) {
            items.push({ id: `q_${or.toLowerCase()}_${i}`, orientation: or });
        }
    });

    // Default: Low baseline (2)
    items.forEach(i => answers[i.id] = 2);
    orientations.forEach(o => priorities[o] = 3);

    if (profile === "efficiency") {
        // Case 1: Efficiency (Blue)
        items.forEach(i => {
            if (i.orientation === "EFF") answers[i.id] = 5;
            else if (i.orientation === "TEC") answers[i.id] = 4;
            else if (i.orientation === "ANA") answers[i.id] = 3;
        });
        priorities["KNO"] = 5;
        priorities["EFF"] = 2;
        priorities["ANA"] = 4;
        priorities["TEC"] = 3;
        priorities["SUP"] = 2;
    } else if (profile === "balanced") {
        // Case 2: Balanced (Hybrid)
        items.forEach((i, idx) => answers[i.id] = idx % 2 === 0 ? 4 : 3);
        answers["q_tec_3"] = 5; // Spike

        priorities["TEC"] = 5;
        priorities["EFF"] = 3;
        priorities["ANA"] = 2;
        priorities["KNO"] = 4;
        priorities["SUP"] = 3;
    } else if (profile === "knowledge") {
        // Case 3: Knowledge (Green)
        items.forEach(i => {
            if (i.orientation === "KNO") answers[i.id] = 5;
            else if (i.orientation === "SUP") answers[i.id] = 4;
            else answers[i.id] = 2;
        });
        priorities["EFF"] = 5;
        priorities["KNO"] = 2;
        priorities["SUP"] = 3;
        priorities["ANA"] = 4;
        priorities["TEC"] = 3;
    }

    localStorage.setItem("organization_state", JSON.stringify({
        sessionId: "test-session-" + Date.now(),
        answers,
        itemOrder: items.map(i => i.id),
        currentIndex: items.length - 1,
        completed: true,
    }));
    localStorage.setItem("org_priorities", JSON.stringify(priorities));

    router.push("/organization?phase=results");
}

export default function AboutPage() {
    const { t, locale } = useI18n();
    const router = useRouter();

    return (
        <section className="page fade-in">
            <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1>{t("about.title")}</h1>
                <p className="lead" style={{ marginBottom: "2.5rem" }}>
                    {t("about.intro")}
                </p>

                <div style={{ marginBottom: "2.5rem" }}>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{t("about.descriptionTitle")}</h2>
                    <p style={{ lineHeight: "1.7", color: "var(--color-text-secondary)" }}>
                        {t("about.descriptionBody")}
                    </p>
                </div>

                <div style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>{t("about.usageTitle")}</h2>
                    <p style={{ lineHeight: "1.7", color: "var(--color-text-secondary)" }}>
                        {t("about.usageBody")}
                    </p>
                </div>

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

                {/* Discrete Test Cases */}
                <div className="test-links" style={{
                    marginTop: "4rem",
                    paddingTop: "2rem",
                    borderTop: "1px solid var(--color-border-subtle)",
                    opacity: 0.4,
                    transition: "opacity 0.2s",
                }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.4"}
                >
                    <div className="test-section" style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8rem" }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>Debug:</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => seedOrgAndGo(router, "efficiency")}>Case 1</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => seedOrgAndGo(router, "balanced")}>Case 2</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => seedOrgAndGo(router, "knowledge")}>Case 3</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
