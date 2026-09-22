import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, data } from "../services/api";
import { Button, Speaker } from "../components/UI";
import { setLanguage } from "../i18n";
import { type Role } from "../context-store/AuthContext";

type CollectorLanguage = "hi" | "mr" | "mwr";

interface OtpSendResponse {
  developmentOtp?: string;
}

interface ApiErrorResponse {
  message?: string;
}

const collectorCopy = {
  hi: {
    title: "पासवर्ड रीसेट करें",
    intro: "अपने खाते का पासवर्ड बदलने के लिए पहले मोबाइल नंबर सत्यापित करें।",

    mobile: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर",

    sendOtp: "OTP भेजें",
    sendingOtp: "OTP भेजा जा रहा है...",

    otp: "6 अंकों का OTP",
    developmentOtp: "डेवलपमेंट OTP",

    password: "नया पासवर्ड",
    passwordPlaceholder: "कम से कम 8 अक्षरों का नया पासवर्ड",

    updatePassword: "पासवर्ड अपडेट करें",
    updatingPassword: "पासवर्ड अपडेट हो रहा है...",

    mobileError: "मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।",

    otpError: "मान्य 6 अंकों का OTP दर्ज करें।",

    passwordError: "नया पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।",

    requestError: "काम पूरा नहीं हो सका। कृपया दोबारा कोशिश करें।",

    backToLogin: "लॉग इन पर वापस जाएं",

    firstVoice:
      "पासवर्ड बदलने के लिए अपने खाते से जुड़ा दस अंकों का मोबाइल नंबर डालिए। फिर ओ टी पी भेजें बटन दबाइए।",

    secondVoice:
      "अब स्क्रीन पर दिख रहा छह अंकों का ओ टी पी भरिए। उसके बाद कम से कम आठ अक्षरों का नया पासवर्ड बनाइए और पासवर्ड अपडेट करें बटन दबाइए।",
  },

  mr: {
    title: "पासवर्ड रीसेट करा",
    intro: "तुमच्या खात्याचा पासवर्ड बदलण्यासाठी आधी मोबाइल क्रमांक पडताळा.",

    mobile: "मोबाइल क्रमांक",
    mobilePlaceholder: "10 अंकी मोबाइल क्रमांक",

    sendOtp: "OTP पाठवा",
    sendingOtp: "OTP पाठवला जात आहे...",

    otp: "6 अंकी OTP",
    developmentOtp: "डेव्हलपमेंट OTP",

    password: "नवीन पासवर्ड",
    passwordPlaceholder: "किमान 8 अक्षरांचा नवीन पासवर्ड",

    updatePassword: "पासवर्ड अपडेट करा",
    updatingPassword: "पासवर्ड अपडेट होत आहे...",

    mobileError: "वैध 10 अंकी भारतीय मोबाइल क्रमांक भरा.",

    otpError: "वैध 6 अंकी OTP भरा.",

    passwordError: "नवीन पासवर्ड किमान 8 अक्षरांचा असावा.",

    requestError: "विनंती पूर्ण होऊ शकली नाही. पुन्हा प्रयत्न करा.",

    backToLogin: "लॉग इनवर परत जा",

    firstVoice:
      "पासवर्ड बदलण्यासाठी तुमच्या खात्याशी जोडलेला दहा अंकी मोबाइल क्रमांक भरा. त्यानंतर ओ टी पी पाठवा बटण दाबा.",

    secondVoice:
      "आता स्क्रीनवर दिसणारा सहा अंकी ओ टी पी भरा. त्यानंतर किमान आठ अक्षरांचा नवीन पासवर्ड तयार करा आणि पासवर्ड अपडेट करा बटण दाबा.",
  },

  mwr: {
    title: "पासवर्ड फेर बणाओ",
    intro: "आपरे खाते रो पासवर्ड बदलण खातर पैली मोबाइल नंबर जांचो.",

    mobile: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंक रो मोबाइल नंबर",

    sendOtp: "OTP भेजो",
    sendingOtp: "OTP भेज्यो जा रियो है...",

    otp: "6 अंक रो OTP",
    developmentOtp: "डेवलपमेंट OTP",

    password: "नवो पासवर्ड",
    passwordPlaceholder: "कम सूं कम 8 अक्षर रो नवो पासवर्ड",

    updatePassword: "पासवर्ड बदलो",
    updatingPassword: "पासवर्ड बदल रियो है...",

    mobileError: "सही 10 अंक रो भारतीय मोबाइल नंबर भरो.",

    otpError: "सही 6 अंक रो OTP भरो.",

    passwordError: "नवो पासवर्ड कम सूं कम 8 अक्षर रो होणो चाइजे.",

    requestError: "काम पूरो कोनी हो पायो. फेर कोशिश करो.",

    backToLogin: "लॉग इन पाछै जाओ",

    firstVoice:
      "पासवर्ड बदलण खातर आपरे खाते सूं जुड़्यो दस अंक रो मोबाइल नंबर भरो. फेर ओ टी पी भेजो बटन दबाओ.",

    secondVoice:
      "अब स्क्रीन पर दिखतो छह अंक रो ओ टी पी भरो. फेर कम सूं कम आठ अक्षर रो नवो पासवर्ड बणाओ अर पासवर्ड बदलो बटन दबाओ.",
  },
} as const;

const englishCopy = {
  title: "Reset password",

  intro: "Verify your mobile number to set a new password.",

  mobile: "Mobile number",
  mobilePlaceholder: "10 digit mobile number",

  sendOtp: "Send OTP",
  sendingOtp: "Sending OTP...",

  otp: "6 digit OTP",
  developmentOtp: "Development OTP",

  password: "New password",
  passwordPlaceholder: "Minimum 8 characters",

  updatePassword: "Update password",
  updatingPassword: "Updating password...",

  mobileError: "Enter a valid 10 digit Indian mobile number.",

  otpError: "Enter a valid 6 digit OTP.",

  passwordError: "Password must be at least 8 characters.",

  requestError: "Request failed. Please try again.",

  backToLogin: "Back to login",
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

function parseRole(value: string | null): Role | null {
  if (value === "COLLECTOR" || value === "RECYCLER" || value === "ADMIN") {
    return value;
  }

  return null;
}

function parseLanguage(value: string | null): CollectorLanguage {
  if (value === "hi" || value === "mr" || value === "mwr") {
    return value;
  }

  return getSavedCollectorLanguage();
}

export default function Forgot() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedRole = parseRole(searchParams.get("role"));

  const selectedLanguage = parseLanguage(searchParams.get("lang"));

  const isCollector = selectedRole === "COLLECTOR";

  const copy = isCollector ? collectorCopy[selectedLanguage] : englishCopy;

  const [mobile, setMobile] = useState("");

  const [otp, setOtp] = useState("");

  const [password, setPassword] = useState("");

  const [step, setStep] = useState(0);

  const [developmentOtp, setDevelopmentOtp] = useState("");

  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isCollector) {
      setLanguage(selectedLanguage);
    }
  }, [isCollector, selectedLanguage]);

  function loginUrl(): string {
    if (!selectedRole) {
      return "/login";
    }

    if (selectedRole === "COLLECTOR") {
      return `/login?role=COLLECTOR&lang=${selectedLanguage}`;
    }

    return `/login?role=${selectedRole}`;
  }

  function getErrorMessage(requestError: unknown): string {
    if (axios.isAxiosError<ApiErrorResponse>(requestError)) {
      const backendMessage = requestError.response?.data?.message;

      if (!isCollector) {
        return backendMessage ?? englishCopy.requestError;
      }

      if (
        backendMessage === "Invalid OTP" ||
        backendMessage === "OTP expired" ||
        backendMessage === "OTP not found" ||
        backendMessage === "OTP already used" ||
        backendMessage === "Too many attempts"
      ) {
        return copy.otpError;
      }

      return copy.requestError;
    }

    if (!isCollector) {
      if (requestError instanceof Error) {
        return requestError.message;
      }

      return englishCopy.requestError;
    }

    return copy.requestError;
  }

  async function sendOtp() {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError(copy.mobileError);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await data<OtpSendResponse>(
        api.post("/auth/otp/send", {
          mobile,
          purpose: "RESET",
        }),
      );

      setDevelopmentOtp(response.developmentOtp ?? "");

      setOtp("");
      setStep(1);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!/^\d{6}$/.test(otp)) {
      setError(copy.otpError);
      return;
    }

    if (password.length < 8) {
      setError(copy.passwordError);
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", {
        mobile,
        otp,
        newPassword: password,
      });

      navigate(loginUrl(), {
        replace: true,
      });
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <h1>
        {copy.title}

        {isCollector && (
          <>
            {" "}
            <Speaker
              text={
                step === 0
                  ? collectorCopy[selectedLanguage].firstVoice
                  : collectorCopy[selectedLanguage].secondVoice
              }
            />
          </>
        )}
      </h1>

      <p>{copy.intro}</p>

      <div className="authbox">
        {step === 0 ? (
          <>
            <label>
              {copy.mobile}

              <input
                placeholder={copy.mobilePlaceholder}
                inputMode="numeric"
                autoComplete="tel"
                value={mobile}
                onChange={(event) =>
                  setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
            </label>

            <Button disabled={busy} onClick={() => void sendOtp()}>
              {busy ? copy.sendingOtp : copy.sendOtp}
            </Button>
          </>
        ) : (
          <>
            <label>
              {copy.otp}

              <input
                placeholder={copy.otp}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </label>

            {developmentOtp && (
              <small>
                {copy.developmentOtp}: {developmentOtp}
              </small>
            )}

            <label>
              {copy.password}

              <input
                type="password"
                autoComplete="new-password"
                placeholder={copy.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <Button disabled={busy} onClick={() => void resetPassword()}>
              {busy ? copy.updatingPassword : copy.updatePassword}
            </Button>
          </>
        )}

        {error && <p className="error">{error}</p>}

        <Button type="button" onClick={() => navigate(loginUrl())}>
          {copy.backToLogin}
        </Button>
      </div>
    </main>
  );
}
