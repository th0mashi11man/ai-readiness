"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

export default function Navbar() {
    const { locale, setLocale, t } = useI18n();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    const links = [
        { href: "/", label: t("nav.home") },
    ].filter(l => l.href !== "/" || pathname !== "/");

    return (
        <nav className="navbar" aria-label="Main navigation">
            <div className="nav-inner">
                <div className="nav-brand">
                    <a href="https://www.credtech.se" target="_blank" rel="noopener noreferrer" className="nav-logo-link">
                        <img src="/credtech-logo.png" alt="CREDtech" className="nav-logo" />
                    </a>
                    <span className="nav-brand-sep" aria-hidden="true">×</span>
                    <a href="https://goteborgsregionen.se" target="_blank" rel="noopener noreferrer" className="nav-logo-link">
                        <img src="/gr-logo.png" alt="Göteborgsregionen" className="nav-logo nav-logo-gr" />
                    </a>
                </div>

                <button
                    className={`nav-toggle ${menuOpen ? "open" : ""}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                >
                    <span /><span /><span />
                </button>

                <div className={`nav-links ${menuOpen ? "open" : ""}`}>
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`nav-link ${pathname === l.href ? "active" : ""}`}
                            onClick={() => {
                                setMenuOpen(false);
                                if (l.href === "/") {
                                    // Handle Restart logic
                                    localStorage.removeItem("organization_state");
                                    localStorage.removeItem("org_priorities");
                                }
                            }}
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>

                <button
                    className="lang-toggle"
                    onClick={() => setLocale(locale === "sv" ? "en" : "sv")}
                    aria-label={`Switch language to ${locale === "sv" ? "English" : "Svenska"}`}
                >
                    <span className={`lang-opt ${locale === "sv" ? "active" : ""}`}>SV</span>
                    <span className="lang-sep">|</span>
                    <span className={`lang-opt ${locale === "en" ? "active" : ""}`}>EN</span>
                </button>
            </div>
        </nav>
    );
}
