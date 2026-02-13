"use client";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Test data seeders — fill localStorage and navigate to results
// Test data seeders — fill localStorage and navigate to results
function seedIndividualAndGo(router, profile = "proficient") {
  let answers = {};

  if (profile === "novice") {
    // ~7/18 correct (random guessing territory)
    answers = {
      apply_ai_q1: 2, apply_ai_q2: 1, apply_ai_q3: 0,   // 1/3
      create_ai_q1: 1, create_ai_q2: 0, create_ai_q3: 1, // 1/3
      detect_ai_q1: 1, detect_ai_q2: 0, detect_ai_q3: 1, // 1/3
      ai_ethics_q1: 1, ai_ethics_q2: 0, ai_ethics_q3: 0, // 1/3
      gen_ai_q1: 1, gen_ai_q2: 0, gen_ai_q3: 1,           // 1/3
      understand_ai_q1: 0, understand_ai_q2: 0, understand_ai_q3: 0, // 1/3 plus one extra
      understand_ai_q2: 1,
    };
  } else if (profile === "expert") {
    // 17/18 correct (Realistic expert)
    answers = {
      apply_ai_q1: 2, apply_ai_q2: 0, apply_ai_q3: 1,
      create_ai_q1: 1, create_ai_q2: 1, create_ai_q3: 2, // Missed q3
      detect_ai_q1: 1, detect_ai_q2: 2, detect_ai_q3: 0,
      ai_ethics_q1: 1, ai_ethics_q2: 1, ai_ethics_q3: 3,
      gen_ai_q1: 1, gen_ai_q2: 1, gen_ai_q3: 0,
      understand_ai_q1: 0, understand_ai_q2: 1, understand_ai_q3: 2,
    };
  } else {
    // Proficient (~12/18 - Balanced intermediate)
    answers = {
      apply_ai_q1: 2, apply_ai_q2: 0, apply_ai_q3: 0,   // 2/3
      create_ai_q1: 1, create_ai_q2: 1, create_ai_q3: 2, // 2/3
      detect_ai_q1: 1, detect_ai_q2: 2, detect_ai_q3: 1, // 2/3
      ai_ethics_q1: 1, ai_ethics_q2: 0, ai_ethics_q3: 3, // 2/3
      gen_ai_q1: 1, gen_ai_q2: 1, gen_ai_q3: 2,           // 2/3
      understand_ai_q1: 0, understand_ai_q2: 1, understand_ai_q3: 0, // 2/3
    };
  }

  const itemOrder = Object.keys(answers);
  localStorage.setItem("individual_state", JSON.stringify({
    answers, itemOrder, currentIndex: itemOrder.length - 1, completed: true,
  }));
  router.push("/individual?phase=results");
}

function seedOrgAndGo(router, profile = "hybrid") {
  let answers = {};

  if (profile === "admin") {
    // "Separation": High SEP (5s), Low INT/HYB (1s/2s)
    answers = {
      TA_SEP_01: 5, TA_SEP_02: 5, TA_INT_01: 1, TA_INT_02: 1, TA_HYB_01: 2, TA_HYB_02: 2,
      PT_SEP_01: 4, PT_SEP_02: 4, PT_INT_01: 1, PT_INT_02: 1, PT_HYB_01: 1, PT_HYB_02: 1,
      DDL_SEP_01: 5, DDL_SEP_02: 5, DDL_INT_01: 2, DDL_INT_02: 1, DDL_HYB_01: 2, DDL_HYB_02: 2,
      SB_SEP_01: 4, SB_SEP_02: 4, SB_INT_01: 1, SB_INT_02: 1, SB_HYB_01: 1, SB_HYB_02: 1,
      X_DIAG_SILO: 5, X_DIAG_FRAGMENT: 1,
      X_GOV_DATA_READINESS: 2, X_GOV_BOUNDARY_ROLES: 1, X_GOV_IT_INTEGRATION: 5, X_GOV_PARTNERSHIPS: 3,
    };
  } else if (profile === "pedagogical") {
    // "Integration": High INT (5s), Low SEP/HYB (1s/2s)
    answers = {
      TA_SEP_01: 1, TA_SEP_02: 2, TA_INT_01: 4, TA_INT_02: 4, TA_HYB_01: 2, TA_HYB_02: 2,
      PT_SEP_01: 1, PT_SEP_02: 1, PT_INT_01: 5, PT_INT_02: 5, PT_HYB_01: 2, PT_HYB_02: 1,
      DDL_SEP_01: 1, DDL_SEP_02: 1, DDL_INT_01: 4, DDL_INT_02: 4, DDL_HYB_01: 1, DDL_HYB_02: 2,
      SB_SEP_01: 2, SB_SEP_02: 2, SB_INT_01: 5, SB_INT_02: 5, SB_HYB_01: 2, SB_HYB_02: 2,
      X_DIAG_SILO: 1, X_DIAG_FRAGMENT: 5,
      X_GOV_DATA_READINESS: 4, X_GOV_BOUNDARY_ROLES: 2, X_GOV_IT_INTEGRATION: 2, X_GOV_PARTNERSHIPS: 5,
    };
  } else {
    // "Hybrid": High HYB (5s), Low/Med others
    answers = {
      TA_SEP_01: 2, TA_SEP_02: 2, TA_INT_01: 2, TA_INT_02: 2, TA_HYB_01: 5, TA_HYB_02: 5,
      PT_SEP_01: 2, PT_SEP_02: 2, PT_INT_01: 2, PT_INT_02: 2, PT_HYB_01: 5, PT_HYB_02: 5,
      DDL_SEP_01: 2, DDL_SEP_02: 2, DDL_INT_01: 2, DDL_INT_02: 2, DDL_HYB_01: 5, DDL_HYB_02: 5,
      SB_SEP_01: 3, SB_SEP_02: 3, SB_INT_01: 3, SB_INT_02: 3, SB_HYB_01: 5, SB_HYB_02: 5,
      X_DIAG_SILO: 1, X_DIAG_FRAGMENT: 1,
      X_GOV_DATA_READINESS: 5, X_GOV_BOUNDARY_ROLES: 5, X_GOV_IT_INTEGRATION: 4, X_GOV_PARTNERSHIPS: 5,
    };
  }

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
          <p className="hero-intro">{t("home.intro")}</p>
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
            <div className="test-section">
              <h4>Test Individual:</h4>
              <button onClick={() => seedIndividualAndGo(router, "novice")}>Novice</button>
              <button onClick={() => seedIndividualAndGo(router, "proficient")}>Proficient</button>
              <button onClick={() => seedIndividualAndGo(router, "expert")}>Expert</button>
            </div>
            <div className="test-section">
              <h4>Test Organization:</h4>
              <button onClick={() => seedOrgAndGo(router, "admin")}>Separation</button>
              <button onClick={() => seedOrgAndGo(router, "pedagogical")}>Integration</button>
              <button onClick={() => seedOrgAndGo(router, "hybrid")}>Hybrid</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
