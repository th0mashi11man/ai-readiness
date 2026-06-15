"use client";
import { useState } from "react";

export default function ExportButton() {
    const [busy, setBusy] = useState(false);

    const handleExport = async () => {
        if (busy) return;
        const password = window.prompt("Password");
        if (!password) return;

        setBusy(true);
        try {
            const response = await fetch("/api/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (response.status === 401) {
                window.alert("Incorrect password.");
                return;
            }
            if (!response.ok) {
                window.alert("Export failed. Please try again.");
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
            window.alert("Export failed. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <footer className="site-footer">
            <button
                type="button"
                className="export-trigger"
                onClick={handleExport}
                aria-label="Export research data"
            >
                ·
            </button>
        </footer>
    );
}
