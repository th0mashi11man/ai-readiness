"use client";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "./Navbar";

export default function AppShell({ uiStrings, initialLocale, children }) {
    return (
        <I18nProvider uiStrings={uiStrings} initialLocale={initialLocale}>
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </I18nProvider>
    );
}
