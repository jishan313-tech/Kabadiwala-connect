import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BadgeCheck,
  Factory,
  Languages,
  Leaf,
  LockKeyhole,
  Recycle,
  Smartphone,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";

import { type Role } from "../context-store/AuthContext";
import { useAuth } from "../context-store/useAuth";
import { Button, Speaker } from "../components/UI";
import { setLanguage } from "../i18n";

interface ApiErrorResponse {
  message?: string;
}

type CollectorLanguage = "hi" | "mr" | "mwr";

const languageLabels: Record<CollectorLanguage, string> = {
  hi: "हिन्दी",
  mr: "मराठी",
  mwr: "मारवाड़ी",
};

const collectorVoiceGuide: Record<CollectorLanguage, string> = {
  hi:
    "कबाड़ीवाला कनेक्ट में आपका स्वागत है। " +
    "सबसे पहले अपनी पसंद की भाषा चुनिए। " +
    "मोबाइल नंबर वाले खाने में अपना दस अंकों का मोबाइल नंबर डालिए। " +
    "उसके बाद पासवर्ड वाले खाने में अपना पासवर्ड डालिए। " +
    "सभी जानकारी भरने के बाद लॉग इन बटन दबाइए। " +
    "अगर आप नया खाता बनाना चाहते हैं, तो नीचे नया कलेक्टर या रीसायकलर अकाउंट बनाने वाला विकल्प चुनिए।",

  mr:
    "कबाडीवाला कनेक्टमध्ये तुमचे स्वागत आहे. " +
    "सर्वप्रथम तुमच्या आवडीची भाषा निवडा. " +
    "मोबाईल क्रमांकाच्या जागेत तुमचा दहा अंकी मोबाईल क्रमांक टाका. " +
    "त्यानंतर पासवर्डच्या जागेत तुमचा पासवर्ड टाका. " +
    "सर्व माहिती भरल्यानंतर लॉग इन बटण दाबा. " +
    "नवीन खाते तयार करायचे असल्यास खाली नवीन कलेक्टर किंवा रीसायकलर अकाउंट तयार करण्याचा पर्याय निवडा.",

  mwr:
    "कबाड़ीवाला कनेक्ट में आपरो स्वागत है। " +
    "सबसे पैली आपरी पसंद री भासा चुनो। " +
    "मोबाइल नंबर री जगह आपरो दस अंक रो मोबाइल नंबर भरो। " +
    "फेर पासवर्ड री जगह आपरो पासवर्ड भरो। " +
    "सारी जानकारी भरने पाछै लॉग इन बटन दबाओ। " +
    "नवो खातो बणाणो हो तो नीचे नवो कलेक्टर या रीसायकलर अकाउंट बणावण रो विकल्प चुनो।",
};

const roleLabels: Record<Role, string> = {
  COLLECTOR: "Login as Collector",
  RECYCLER: "Login as Recycler",
  ADMIN: "Login as Admin",
};

const collectorCopy: Record<
  CollectorLanguage,
  {
    secureLogin: string;
    welcome: string;
    workspace: string;
    passwordPlaceholder: string;
    createAccount: string;
    trust: string;
    help: string;
    storyTitleOne: string;
    storyTitleTwo: string;
    storyCopy: string;
    collectorAction: string;
    recyclerAction: string;
    trustedTrade: string;
    trustedTradeAction: string;
    circularEconomy: string;
    transparentPricing: string;
    localFirst: string;
  }
> = {
  hi: {
    secureLogin: "सुरक्षित लॉगिन",
    welcome: "वापस स्वागत है",
    workspace: "अपने Kabadiwala Connect workspace में लॉग इन करें।",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    createAccount: "नया Collector / Recycler account बनाएं",
    trust: "सत्यापित रीसायकलर • सुरक्षित पहुंच • पारदर्शी रिकॉर्ड",
    help: "सहायता चाहिए?",
    storyTitleOne: "कबाड़ नहीं,",
    storyTitleTwo: "एक नई value.",
    storyCopy:
      "Collectors, verified recyclers और पारदर्शी लेन-देन को एक भरोसेमंद digital network में जोड़ने वाला platform.",
    collectorAction: "Scrap lot प्रकाशित करता है",
    recyclerAction: "उचित quotation देता है",
    trustedTrade: "विश्वसनीय व्यापार",
    trustedTradeAction: "सत्यापित handover और payment",
    circularEconomy: "Circular economy",
    transparentPricing: "पारदर्शी pricing",
    localFirst: "Local-first",
  },

  mr: {
    secureLogin: "सुरक्षित लॉगिन",
    welcome: "पुन्हा स्वागत आहे",
    workspace: "तुमच्या Kabadiwala Connect workspace मध्ये लॉग इन करा.",
    passwordPlaceholder: "तुमचा पासवर्ड टाका",
    createAccount: "नवीन Collector / Recycler account तयार करा",
    trust: "पडताळलेले recyclers • सुरक्षित प्रवेश • पारदर्शक नोंदी",
    help: "मदत हवी आहे?",
    storyTitleOne: "भंगार नाही,",
    storyTitleTwo: "एक नवीन value.",
    storyCopy:
      "Collectors, पडताळलेले recyclers आणि पारदर्शक व्यवहार एका विश्वासार्ह digital network मध्ये जोडणारे platform.",
    collectorAction: "Scrap lot प्रकाशित करतो",
    recyclerAction: "योग्य quotation देतो",
    trustedTrade: "विश्वासार्ह व्यवहार",
    trustedTradeAction: "पडताळलेले handover आणि payment",
    circularEconomy: "Circular economy",
    transparentPricing: "पारदर्शक pricing",
    localFirst: "Local-first",
  },

  mwr: {
    secureLogin: "सुरक्षित लॉगिन",
    welcome: "फेर स्वागत है",
    workspace: "आपरे Kabadiwala Connect workspace में लॉग इन करो।",
    passwordPlaceholder: "आपरो पासवर्ड भरो",
    createAccount: "नवो Collector / Recycler account बणाओ",
    trust: "जांचेला recyclers • सुरक्षित पहुंच • साफ रिकॉर्ड",
    help: "मदद चाइजे?",
    storyTitleOne: "कबाड़ कोनी,",
    storyTitleTwo: "एक नई value.",
    storyCopy:
      "Collectors, जांचेला recyclers अर साफ लेन-देन ने एक भरोसेमंद digital network में जोड़ण वालो platform.",
    collectorAction: "Scrap lot प्रकाशित करे है",
    recyclerAction: "ठीक quotation दे है",
    trustedTrade: "भरोसेमंद व्यापार",
    trustedTradeAction: "जांचेलो handover अर payment",
    circularEconomy: "Circular economy",
    transparentPricing: "साफ pricing",
    localFirst: "Local-first",
  },
};

const englishCopy = {
  secureLogin: "Secure login",
  welcome: "Welcome back",
  workspace: "Log in to your Kabadiwala Connect workspace.",
  passwordPlaceholder: "Enter your password",
  createAccount: "Create a new Collector / Recycler account",
  trust: "Verified recyclers • Secure access • Transparent records",
  help: "Need help?",
  storyTitleOne: "Waste becomes",
  storyTitleTwo: "new value.",
  storyCopy:
    "A trusted digital network connecting collectors, verified recyclers and transparent transactions.",
  collectorAction: "Publishes scrap lots",
  recyclerAction: "Provides fair quotations",
  trustedTrade: "Trusted trade",
  trustedTradeAction: "Verified handover and payment",
  circularEconomy: "Circular economy",
  transparentPricing: "Transparent pricing",
  localFirst: "Local-first",
};

function getSavedCollectorLanguage(): CollectorLanguage {
  const savedLanguage = localStorage.getItem("kc_lang");

  if (
    savedLanguage === "hi" ||
    savedLanguage === "mr" ||
    savedLanguage === "mwr"
  ) {
    return savedLanguage;
  }

  return "hi";
}

function getRoleFromQuery(value: string | null): Role {
  if (value === "COLLECTOR" || value === "RECYCLER" || value === "ADMIN") {
    return value;
  }

  return "COLLECTOR";
}

function getLanguageFromQuery(value: string | null): CollectorLanguage {
  if (value === "hi" || value === "mr" || value === "mwr") {
    return value;
  }

  return getSavedCollectorLanguage();
}

export default function Login() {
  const { t } = useTranslation();
  const { login, logout } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = getRoleFromQuery(searchParams.get("role"));

  const initialLanguage = getLanguageFromQuery(searchParams.get("lang"));

  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);

  const [selectedLanguage, setSelectedLanguage] =
    useState<CollectorLanguage>(initialLanguage);

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isCollector = selectedRole === "COLLECTOR";

  const copy = isCollector ? collectorCopy[selectedLanguage] : englishCopy;

  useEffect(() => {
    if (selectedRole === "COLLECTOR") {
      setLanguage(selectedLanguage);
    }
  }, [selectedRole, selectedLanguage]);

  function handleRoleChange(role: Role) {
    setSelectedRole(role);
    setError("");

    if (role === "COLLECTOR") {
      setLanguage(selectedLanguage);
    }
  }

  function handleLanguageChange(language: CollectorLanguage) {
    setSelectedLanguage(language);
    setLanguage(language);
    setError("");
  }

  function getForgotUrl(): string {
    if (isCollector) {
      return `/forgot?role=COLLECTOR&lang=${selectedLanguage}`;
    }

    return `/forgot?role=${selectedRole}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      await login(mobile, password);

      const storedUser = localStorage.getItem("kc_user");

      let authenticatedRole: Role | null = null;

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as {
            role?: Role;
          };

          authenticatedRole = parsedUser.role ?? null;
        } catch {
          authenticatedRole = null;
        }
      }

      if (!authenticatedRole || authenticatedRole !== selectedRole) {
        await logout();

        if (authenticatedRole) {
          const readableRole = authenticatedRole
            .toLowerCase()
            .replace(/^./, (letter) => letter.toUpperCase());

          setError(
            `This account is registered as ${readableRole}. Please select Login as ${readableRole}.`,
          );
        } else {
          setError("Unable to verify the account role. Please log in again.");
        }

        return;
      }

      navigate("/app", {
        replace: true,
      });
    } catch (requestError: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(requestError)) {
        setError(
          requestError.response?.data?.message ??
            (isCollector
              ? t("error")
              : "Something went wrong. Please try again."),
        );
      } else {
        setError(
          isCollector ? t("error") : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />

        <div className="login-brand">
          <div className="brand-logo">
            <Recycle />
          </div>

          <div>
            <strong>Kabadiwala Connect</strong>
            <span>Waste to Value Network</span>
          </div>
        </div>

        <div className="story-content">
          <div className="eyebrow">
            <Sparkles size={16} />
          </div>

          <h1>
            {copy.storyTitleOne}
            <br />
            <span>{copy.storyTitleTwo}</span>
          </h1>

          <p className="story-copy">{copy.storyCopy}</p>

          <div className="journey">
            <div className="journey-item">
              <div className="journey-icon">
                <Truck />
              </div>

              <div>
                <b>Collector</b>
                <span>{copy.collectorAction}</span>
              </div>
            </div>

            <div className="journey-line" />

            <div className="journey-item">
              <div className="journey-icon">
                <Factory />
              </div>

              <div>
                <b>Recycler</b>
                <span>{copy.recyclerAction}</span>
              </div>
            </div>

            <div className="journey-line" />

            <div className="journey-item">
              <div className="journey-icon">
                <BadgeCheck />
              </div>

              <div>
                <b>{copy.trustedTrade}</b>
                <span>{copy.trustedTradeAction}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="story-footer">
          <span>
            <Leaf size={17} />
            {copy.circularEconomy}
          </span>

          <span>•</span>

          <span>{copy.transparentPricing}</span>

          <span>•</span>

          <span>{copy.localFirst}</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-mobile-brand">
          <div className="brand-logo">
            <Recycle />
          </div>

          <strong>Kabadiwala Connect</strong>
        </div>

        <div className="login-card">
          <div className="login-heading">
            <span className="welcome-pill">
              <span className="online-dot" />
              {copy.secureLogin}
            </span>

            <h2>{copy.welcome}</h2>

            <p>
              {copy.workspace}

              {isCollector && (
                <>
                  {" "}
                  <Speaker text={collectorVoiceGuide[selectedLanguage]} />
                </>
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="field-label">
              Login role
              <div className="input-shell">
                <UserRound size={19} />

                <select
                  value={selectedRole}
                  onChange={(event) =>
                    handleRoleChange(event.target.value as Role)
                  }
                  aria-label="Login role"
                >
                  {(Object.keys(roleLabels) as Role[]).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {isCollector && (
              <label className="field-label">
                {t("language")}

                <div className="input-shell">
                  <Languages size={19} />

                  <select
                    value={selectedLanguage}
                    onChange={(event) =>
                      handleLanguageChange(
                        event.target.value as CollectorLanguage,
                      )
                    }
                    aria-label="Collector language"
                  >
                    {(Object.keys(languageLabels) as CollectorLanguage[]).map(
                      (language) => (
                        <option key={language} value={language}>
                          {languageLabels[language]}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </label>
            )}

            <label className="field-label">
              {isCollector ? t("mobile") : "Mobile number"}

              <div className="input-shell">
                <Smartphone size={19} />

                <span className="country-code">+91</span>

                <input
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={(event) =>
                    setMobile(
                      event.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                />
              </div>
            </label>

            <label className="field-label">
              <span className="label-row">
                {isCollector ? t("password") : "Password"}

                <Link to={getForgotUrl()}>
                  {isCollector ? t("forgot") : "Forgot password?"}
                </Link>
              </span>

              <div className="input-shell">
                <LockKeyhole size={19} />

                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </label>

            {error && <div className="login-error">{error}</div>}

            <Button
              disabled={busy || mobile.length !== 10 || !password}
              className="login-submit"
            >
              <span>
                {busy
                  ? isCollector
                    ? t("loading")
                    : "Signing in..."
                  : isCollector
                    ? t("login")
                    : "Log in"}
              </span>

              {!busy && <ArrowRight size={19} />}
            </Button>
          </form>

          <div className="login-divider">
            <span>{isCollector ? "या" : "OR"}</span>
          </div>

          <Link to="/register" className="create-account">
            <UserRound size={19} />

            {copy.createAccount}
          </Link>

          <div className="login-trust">
            <BadgeCheck size={17} />

            <span>{copy.trust}</span>
          </div>
        </div>

        <p className="login-help">
          {copy.help} <strong>Kabadiwala Connect Support</strong>
        </p>
      </section>
    </main>
  );
}
