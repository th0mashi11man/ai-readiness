"use client";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useState, useEffect } from "react";

function clearProgress() {
  localStorage.removeItem("organization_state");
  localStorage.removeItem("org_priorities");
}

export default function HomePage() {
  const { t } = useI18n();
  const [resumeHref, setResumeHref] = useState(null);
  const descriptionParagraphs = t("home.description")
    .split(/\n\s*\n/)
    .filter(Boolean);

  // Detect a saved in-progress assessment in this browser.
  useEffect(() => {
    try {
      const state = JSON.parse(localStorage.getItem("organization_state") || "null");
      const priorities = JSON.parse(localStorage.getItem("org_priorities") || "null");
      const hasAnswers = state && state.answers && Object.keys(state.answers).length > 0;
      const hasPriorities = priorities && Object.keys(priorities).length > 0;

      if (state && state.completedAt) setResumeHref("/organization?phase=results");
      else if (hasAnswers) setResumeHref("/organization?phase=survey");
      else if (hasPriorities) setResumeHref("/organization");
      else setResumeHref(null);
    } catch {
      setResumeHref(null);
    }
  }, []);

  return (
    <section className="page page-home fade-in">
      <div className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <h1 className="hero-title">{t("home.title")}</h1>
          <div className="hero-description">
            {descriptionParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="cta-group">
            {resumeHref ? (
              <>
                <Link href={resumeHref} className="btn btn-primary btn-lg">
                  {t("home.ctaResume")}
                </Link>
                <Link
                  href="/organization"
                  className="btn btn-ghost btn-lg"
                  onClick={clearProgress}
                >
                  {t("home.ctaStartOver")}
                </Link>
              </>
            ) : (
              <Link
                href="/organization"
                className="btn btn-primary btn-lg"
                onClick={clearProgress}
              >
                {t("home.ctaOrganization")}
              </Link>
            )}
          </div>
          {resumeHref && <p className="progress-note">{t("home.progressNote")}</p>}
          <div className="privacy-note">
            <svg className="privacy-note-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            <p className="privacy-note-text">
              {t("consent.body")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
