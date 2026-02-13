"use client";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Test data seeders — fill localStorage and navigate to results
function seedIndividualAndGo(router) {
  // Give a mix of correct and incorrect answers for a realistic spread
  const answers = {
    apply_ai_q1: 2, apply_ai_q2: 0, apply_ai_q3: 0,   // 2/3 correct
    create_ai_q1: 1, create_ai_q2: 1, create_ai_q3: 2, // 2/3 correct
    detect_ai_q1: 1, detect_ai_q2: 2, detect_ai_q3: 0, // 3/3 correct
    ai_ethics_q1: 1, ai_ethics_q2: 0, ai_ethics_q3: 3,  // 2/3 correct
    gen_ai_q1: 1, gen_ai_q2: 1, gen_ai_q3: 2,           // 2/3 correct
    understand_ai_q1: 0, understand_ai_q2: 1, understand_ai_q3: 0, // 2/3 correct
  };
  const itemOrder = Object.keys(answers);
  localStorage.setItem("individual_state", JSON.stringify({
    answers, itemOrder, currentIndex: itemOrder.length - 1, completed: true,
  }));
  router.push("/individual?phase=results");
}

function seedOrgAndGo(router) {
  // Realistic Likert spread — TA strong, hybrid-leaning
  const answers = {
    TA_SEP_01: 4, TA_SEP_02: 3, TA_INT_01: 4, TA_INT_02: 5, TA_HYB_01: 4, TA_HYB_02: 4,
    PT_SEP_01: 2, PT_SEP_02: 3, PT_INT_01: 4, PT_INT_02: 3, PT_HYB_01: 3, PT_HYB_02: 4,
    DDL_SEP_01: 3, DDL_SEP_02: 2, DDL_INT_01: 3, DDL_INT_02: 4, DDL_HYB_01: 3, DDL_HYB_02: 3,
    SB_SEP_01: 2, SB_SEP_02: 2, SB_INT_01: 4, SB_INT_02: 5, SB_HYB_01: 4, SB_HYB_02: 3,
    X_DIAG_SILO: 2, X_DIAG_FRAGMENT: 3,
    X_GOV_DATA_READINESS: 3, X_GOV_BOUNDARY_ROLES: 2, X_GOV_IT_INTEGRATION: 2, X_GOV_PARTNERSHIPS: 4,
  };
  const itemOrder = Object.keys(answers);
  localStorage.setItem("organization_state", JSON.stringify({
    answers, itemOrder, currentIndex: itemOrder.length - 1, completed: true,
  }));
  router.push("/organization?phase=results");
}

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <section className="page page-home fade-in">
      <div className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <h1 className="hero-title">{t("home.title")}</h1>
          <p className="hero-intro" style={{ marginTop: '1.5rem' }}>{t("home.intro")}</p>
          <div className="cta-group">
            <Link href="/individual" className="btn btn-primary btn-lg">
              <span className="btn-icon" aria-hidden="true">📝</span>
              {t("home.ctaIndividual")}
            </Link>
            <Link href="/organization" className="btn btn-secondary btn-lg">
              <span className="btn-icon" aria-hidden="true">🏫</span>
              {t("home.ctaOrganization")}
            </Link>
          </div>
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
          <div className="test-links">
            <button onClick={() => seedIndividualAndGo(router)}>Test: Individual results</button>
            <button onClick={() => seedOrgAndGo(router)}>Test: Organization results</button>
          </div>
        </div>
      </div>
    </section>
  );
}
