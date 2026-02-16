"use client";
import { useI18n } from "@/lib/i18n";

export default function PrintHeader({ title }) {
    const { t } = useI18n();

    return (
        <div className="print-header">
            <div className="print-brand">
                <img src="/credtech-logo.png" alt="CREDtech" className="print-logo" />
                <span className="print-sep">×</span>
                <img src="/gr-logo.png" alt="Göteborgsregionen" className="print-logo nav-logo-gr" />
            </div>
            <div className="print-titles">
                <h1 className="print-main-title">{t("home.title")}</h1>
                <h2 className="print-sub-title">{title}</h2>
            </div>
        </div>
    );
}
