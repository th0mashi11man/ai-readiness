"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function ExportButton() {
    const { locale } = useI18n();
    const [busy, setBusy] = useState(false);
    const label = locale === "sv" ? "Exportera" : "Export";

    const handleExport = async () => {
        if (busy) return;
        const password = window.prompt(locale === "sv" ? "Lösenord" : "Password");
        if (!password) return;

        setBusy(true);
        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (response.status === 401) {
                window.alert(locale === "sv" ? "Fel lösenord." : "Incorrect password.");
                return;
            }
            if (!response.ok) {
                window.alert(locale === "sv" ? "Exporten misslyckades. Försök igen." : "Export failed. Please try again.");
                return;
            }

            const csv = await response.text();
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `ai-readiness-data-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch {
            window.alert(locale === "sv" ? "Exporten misslyckades. Försök igen." : "Export failed. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            className="nav-export"
            onClick={handleExport}
            disabled={busy}
            aria-label={locale === "sv" ? "Exportera forskningsdata" : "Export research data"}
        >
            <svg
                className="nav-export-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="nav-export-label">{label}</span>
        </button>
    );
}
