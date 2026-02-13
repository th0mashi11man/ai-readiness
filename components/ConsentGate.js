"use client";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsentGate({ module, children }) {
    const { t } = useI18n();
    const [consented, setConsented] = useState(false);
    const [checked, setChecked] = useState(false);

    if (consented) return children;

    return (
        <section className="page page-consent fade-in">
            <div className="card card-consent">
                <p className="consent-body" style={{ marginTop: '1rem' }}>{t("consent.body")}</p>
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecked(e.target.checked)}
                        aria-required="true"
                    />
                    <span className="checkmark" />
                    <span>{t("consent.checkbox")}</span>
                </label>
                {!checked && (
                    <p className="hint">{t("consent.continueDisabledHint")}</p>
                )}
                <button
                    className="btn btn-primary"
                    disabled={!checked}
                    onClick={() => setConsented(true)}
                >
                    {t("common.continue")}
                </button>
            </div>
        </section>
    );
}
