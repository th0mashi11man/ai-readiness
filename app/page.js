"use client";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Test data seeders — fill localStorage and navigate to results

function seedOrgAndGo(router, profile) {
  let answers = {};
  let priorities = {};

  // Updated items matching org_itembank.json (4 per orientation)
  const items = [];
  const orientations = ["EFF", "ANA", "TEC", "SUP", "KNO"];

  orientations.forEach(or => {
    for (let i = 1; i <= 4; i++) {
      items.push({ id: `q_${or.toLowerCase()}_${i}`, orientation: or });
    }
  });

  // Default: Low baseline (2)
  items.forEach(i => answers[i.id] = 2);
  orientations.forEach(o => priorities[o] = 3);

  if (profile === "efficiency") {
    // Case 1: Efficiency (Blue)
    items.forEach(i => {
      if (i.orientation === "EFF") answers[i.id] = 5;
      else if (i.orientation === "TEC") answers[i.id] = 4;
      else if (i.orientation === "ANA") answers[i.id] = 3;
    });
    priorities["KNO"] = 5;
    priorities["EFF"] = 2;
    priorities["ANA"] = 4;
    priorities["TEC"] = 3;
    priorities["SUP"] = 2;
  } else if (profile === "balanced") {
    // Case 2: Balanced (Hybrid)
    items.forEach((i, idx) => answers[i.id] = idx % 2 === 0 ? 4 : 3);
    answers["q_tec_3"] = 5; // Spike

    priorities["TEC"] = 5;
    priorities["EFF"] = 3;
    priorities["ANA"] = 2;
    priorities["KNO"] = 4;
    priorities["SUP"] = 3;
  } else if (profile === "knowledge") {
    // Case 3: Knowledge (Green)
    items.forEach(i => {
      if (i.orientation === "KNO") answers[i.id] = 5;
      else if (i.orientation === "SUP") answers[i.id] = 4;
      else answers[i.id] = 2;
    });
    priorities["EFF"] = 5;
    priorities["KNO"] = 2;
    priorities["SUP"] = 3;
    priorities["ANA"] = 4;
    priorities["TEC"] = 3;
  }

  localStorage.setItem("organization_state", JSON.stringify({
    sessionId: "test-session-" + Date.now(),
    answers,
    itemOrder: items.map(i => i.id),
    currentIndex: items.length - 1,
    completed: true,
  }));
  localStorage.setItem("org_priorities", JSON.stringify(priorities));

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
          <p className="hero-description">{t("home.description")}</p>
          <div className="cta-group">
            <Link
              href="/organization"
              className="btn btn-primary btn-lg"
              onClick={() => {
                localStorage.removeItem("organization_state");
                localStorage.removeItem("org_priorities");
              }}
            >
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
              <h4>Test Cases:</h4>
              <button onClick={() => seedOrgAndGo(router, "efficiency")}>Case 1</button>
              <button onClick={() => seedOrgAndGo(router, "balanced")}>Case 2</button>
              <button onClick={() => seedOrgAndGo(router, "knowledge")}>Case 3</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
