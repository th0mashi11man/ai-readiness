"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function ExportPage() {
    const { locale } = useI18n();
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const sv = locale === "sv";
    const copy = {
        title: sv ? "Exportera forskningsdata" : "Export research data",
        intro: sv
            ? "Ange lösenordet för att ladda ner alla insamlade svar som en CSV-fil."
            : "Enter the password to download all collected submissions as a CSV file.",
        label: sv ? "Lösenord" : "Password",
        download: sv ? "Ladda ner CSV" : "Download CSV",
        working: sv ? "Hämtar..." : "Preparing...",
        wrong: sv ? "Fel lösenord." : "Incorrect password.",
        failed: sv ? "Exporten misslyckades. Försök igen." : "Export failed. Please try again.",
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (busy || !password) return;
        setBusy(true);
        setError("");
        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (response.status === 401) {
                setError(copy.wrong);
                return;
            }
            if (!response.ok) {
                setError(copy.failed);
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
            setError(copy.failed);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="page fade-in">
            <div className="card export-card">
                <h1>{copy.title}</h1>
                <p className="lead">{copy.intro}</p>
                <form className="export-form" onSubmit={handleSubmit}>
                    <label className="field">
                        <span>{copy.label}</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => { setPassword(event.target.value); setError(""); }}
                            autoComplete="current-password"
                            autoFocus
                        />
                    </label>
                    {error && <p className="share-status share-status-error" role="alert">{error}</p>}
                    <button type="submit" className="btn btn-primary" disabled={busy || !password}>
                        {busy ? copy.working : copy.download}
                    </button>
                </form>
            </div>
        </section>
    );
}
