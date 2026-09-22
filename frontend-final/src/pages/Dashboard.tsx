import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Recycle,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../context-store/useAuth";
import { setLanguage } from "../i18n";
import Collector from "./Collector";
import Recycler from "./Recycler";
import Admin from "./Admin";
import Notifications from "./Notifications";

type Language = "hi" | "mr" | "mwr";

const languageLabels: Record<Language, string> = {
  hi: "हिन्दी",
  mr: "मराठी",
  mwr: "मारवाड़ी",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [languageOpen, setLanguageOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isCollector = user.role === "COLLECTOR";

  const currentLanguage =
    (localStorage.getItem("kc_lang") as Language | null) ?? "hi";

  function changeLanguage(language: Language) {
    setLanguage(language);
    setLanguageOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="kc-app-shell">
      <header className="kc-app-header">
        <div className="kc-header-inner">
          <div className="kc-app-brand">
            <span className="kc-app-brand-mark">
              <Recycle />
            </span>

            <span className="kc-app-brand-copy">
              <strong>Kabadiwala Connect</strong>

              <small>Waste to Value Network</small>
            </span>
          </div>

          <div className="kc-header-actions">
            {isCollector && (
              <div className="kc-language-wrap">
                <button
                  type="button"
                  className="kc-header-button kc-language-button"
                  aria-label="Change language"
                  aria-expanded={languageOpen}
                  onClick={() => setLanguageOpen((current) => !current)}
                >
                  <Languages />

                  <span>{languageLabels[currentLanguage] ?? "हिन्दी"}</span>

                  <ChevronDown className="kc-chevron" />
                </button>

                {languageOpen && (
                  <div className="kc-language-menu">
                    {(Object.keys(languageLabels) as Language[]).map(
                      (language) => (
                        <button
                          type="button"
                          key={language}
                          className={
                            currentLanguage === language ? "active" : ""
                          }
                          onClick={() => changeLanguage(language)}
                        >
                          {languageLabels[language]}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="kc-header-button kc-icon-button"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen((current) => !current)}
            >
              {notificationsOpen ? <X /> : <Bell />}
            </button>

            <div className="kc-user-chip">
              <span className="kc-user-avatar">
                <UserRound />
              </span>

              <span className="kc-user-copy">
                <strong>{user.name}</strong>

                <small>
                  {user.role
                    .toLowerCase()
                    .replace(/^./, (letter) => letter.toUpperCase())}
                </small>
              </span>
            </div>

            <button
              type="button"
              className="kc-header-button kc-icon-button kc-logout-button"
              aria-label="Logout"
              onClick={() => void handleLogout()}
            >
              <LogOut />
            </button>
          </div>
        </div>
      </header>

      {notificationsOpen && (
        <div className="kc-notifications-layer">
          <Notifications onClose={() => setNotificationsOpen(false)} />
        </div>
      )}

      <main className="kc-app-main">
        {user.role === "COLLECTOR" ? (
          <Collector />
        ) : user.role === "RECYCLER" ? (
          <Recycler />
        ) : (
          <Admin />
        )}
      </main>
    </div>
  );
}
