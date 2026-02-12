"use client";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "./Navbar";

export default function AppShell({ uiStrings, children }) {
    return (
        <I18nProvider uiStrings={uiStrings}>
            <Navbar />
            <main className="main-content">
                {children}
            </main>
        </I18nProvider>
    );
}
