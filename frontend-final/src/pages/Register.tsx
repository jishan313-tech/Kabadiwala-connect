import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  MapPin,
  Recycle,
  ShieldCheck,
  Smartphone,
  Truck,
  UserRound,
} from "lucide-react";

import { Speaker } from "../components/UI";
import { api, data } from "../services/api";
import { setLanguage } from "../i18n";

type Role = "COLLECTOR" | "RECYCLER";
type CollectorLanguage = "hi" | "mr" | "mwr";
type Language = CollectorLanguage | "en";

interface RegistrationForm {
  role: Role;
  language: Language;
  fullName: string;
  mobile: string;
  email: string;
  businessName: string;
  licenseNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  password: string;
}

interface OtpSendResponse {
  developmentOtp?: string;
}

interface ApiErrorResponse {
  message?: string;
}

const collectorCopy = {
  hi: {
    back: "वापस",
    step: "चरण",
    of: "में से",

    heroTitleOne: "जुड़िए।",
    heroTitleTwo: "कमाइए। बचाइए।",
    heroDescription:
      "स्थानीय कबाड़ संग्रह से सत्यापित रीसायकलिंग तक — एक पारदर्शी, भरोसेमंद और टिकाऊ डिजिटल नेटवर्क।",
    verifiedNetwork: "सत्यापित नेटवर्क",
    verifiedNetworkDetail: "भरोसेमंद कलेक्टर और रीसायकलर",
    transparentPricing: "पारदर्शी भाव",
    transparentPricingDetail: "डिजिटल भाव और साफ रिकॉर्ड",
    secureTransactions: "सुरक्षित लेन-देन",
    secureTransactionsDetail: "पिकअप, सामान सौंपना और भुगतान ट्रैकिंग",
    collect: "इकट्ठा करें",
    recycle: "रीसायकल करें",
    earn: "कमाएं",

    chooseAccount: "अपना खाता चुनें",
    chooseAccountDescription:
      "आप Kabadiwala Connect को किस भूमिका में इस्तेमाल करेंगे?",
    collectorDescription:
      "कबाड़ इकट्ठा करें, लॉट प्रकाशित करें और रीसायकलर से भाव प्राप्त करें।",
    recyclerDescription: "उपलब्ध लॉट देखें, भाव भेजें और पिकअप संभालें।",
    preferredLanguage: "पसंदीदा भाषा",
    preferredLanguageDescription: "ऐप की मुख्य भाषा चुनें",
    continue: "आगे बढ़ें",
    alreadyAccount: "पहले से खाता है?",
    login: "लॉग इन करें",
    step1Voice:
      "पहला चरण। पहले अपना खाता प्रकार चुनिए। अगर आप कबाड़ इकट्ठा करके लॉट बनाते हैं तो कलेक्टर चुनिए। फिर हिन्दी, मराठी या मारवाड़ी में अपनी पसंद की भाषा चुनकर आगे बढ़ें।",

    detailsTitle: "आपकी जानकारी",
    detailsDescription:
      "खाता और मोबाइल सत्यापन के लिए अपनी बुनियादी जानकारी भरें।",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "जैसे: राहुल शर्मा",
    mobileNumber: "मोबाइल नंबर",
    email: "ईमेल",
    emailPlaceholder: "name@example.com (वैकल्पिक)",
    verifyMobile: "मोबाइल सत्यापित करें",
    generatingOtp: "OTP बनाया जा रहा है...",
    verificationHelper: "सत्यापन के लिए 6 अंकों का OTP बनाया जाएगा।",
    step2Voice:
      "दूसरा चरण। अपना पूरा नाम और दस अंकों का मोबाइल नंबर भरिए। ईमेल वैकल्पिक है। जानकारी सही भरने के बाद मोबाइल सत्यापित करें बटन दबाइए।",

    verifyTitle: "मोबाइल सत्यापित करें",
    otpDescriptionPrefix: "+91",
    otpDescriptionSuffix: "के लिए बनाया गया OTP दर्ज करें।",
    developmentOtp: "डेवलपमेंट OTP",
    developmentOtpShort: "सिर्फ स्थानीय डेवलपमेंट के लिए",
    sixDigitOtp: "6 अंकों का OTP",
    verifying: "सत्यापन हो रहा है...",
    verifyOtp: "OTP सत्यापित करें",
    newOtp: "नया OTP बनाएं",
    developmentOtpHelper:
      "डेवलपमेंट OTP केवल स्थानीय डेवलपमेंट वातावरण में दिखाई देता है।",
    step3Voice:
      "तीसरा चरण। स्क्रीन पर दिख रहा छह अंकों का OTP दर्ज कीजिए। OTP भरने के बाद OTP सत्यापित करें बटन दबाइए। जरूरत हो तो नया OTP भी बना सकते हैं।",

    completeTitle: "खाता पूरा करें",
    completeDescription: "अपना पता भरें और सुरक्षित पासवर्ड बनाएं।",
    address: "पता",
    addressPlaceholder: "घर / दुकान / सड़क",
    city: "शहर",
    state: "राज्य",
    pincode: "पिनकोड",
    pincodePlaceholder: "6 अंकों का पिनकोड",
    password: "पासवर्ड",
    passwordPlaceholder: "कम से कम 8 अक्षर",
    collectorAccount: "कलेक्टर खाता",
    creatingAccount: "खाता बनाया जा रहा है...",
    createAccount: "खाता बनाएं",
    showPassword: "पासवर्ड दिखाएं",
    hidePassword: "पासवर्ड छिपाएं",
    step4Voice:
      "चौथा और अंतिम चरण। अपना पूरा पता, शहर, राज्य और छह अंकों का पिनकोड भरिए। फिर कम से कम आठ अक्षरों का सुरक्षित पासवर्ड बनाइए और खाता बनाएं बटन दबाइए।",

    errorFullName: "पूरा नाम दर्ज करें।",
    errorMobile: "मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।",
    errorEmail: "मान्य ईमेल पता दर्ज करें।",
    errorOtp: "मान्य 6 अंकों का OTP दर्ज करें।",
    errorAddress: "पता दर्ज करें।",
    errorCity: "शहर दर्ज करें।",
    errorState: "राज्य दर्ज करें।",
    errorPincode: "मान्य 6 अंकों का पिनकोड दर्ज करें।",
    errorPassword: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।",
    genericError: "अनुरोध पूरा नहीं हो सका। कृपया दोबारा कोशिश करें।",
  },

  mr: {
    back: "मागे",
    step: "टप्पा",
    of: "पैकी",

    heroTitleOne: "जोडा.",
    heroTitleTwo: "कमवा. वाचवा.",
    heroDescription:
      "स्थानिक भंगार संकलनापासून पडताळलेल्या पुनर्वापरापर्यंत — पारदर्शक, विश्वासार्ह आणि टिकाऊ डिजिटल नेटवर्क.",
    verifiedNetwork: "पडताळलेले नेटवर्क",
    verifiedNetworkDetail: "विश्वासार्ह कलेक्टर आणि रीसायकलर",
    transparentPricing: "पारदर्शक दर",
    transparentPricingDetail: "डिजिटल दर आणि स्पष्ट नोंदी",
    secureTransactions: "सुरक्षित व्यवहार",
    secureTransactionsDetail: "पिकअप, सुपूर्दगी आणि पेमेंट ट्रॅकिंग",
    collect: "गोळा करा",
    recycle: "पुनर्वापर करा",
    earn: "कमवा",

    chooseAccount: "तुमचे खाते निवडा",
    chooseAccountDescription:
      "तुम्ही Kabadiwala Connect कोणत्या भूमिकेत वापरणार आहात?",
    collectorDescription:
      "भंगार गोळा करा, लॉट प्रकाशित करा आणि रीसायकलरकडून दर मिळवा.",
    recyclerDescription: "उपलब्ध लॉट पाहा, दर पाठवा आणि पिकअप व्यवस्थापित करा.",
    preferredLanguage: "पसंतीची भाषा",
    preferredLanguageDescription: "अॅपची मुख्य भाषा निवडा",
    continue: "पुढे जा",
    alreadyAccount: "आधीच खाते आहे?",
    login: "लॉग इन करा",
    step1Voice:
      "पहिला टप्पा. आधी तुमचा खाते प्रकार निवडा. तुम्ही भंगार गोळा करून लॉट तयार करत असाल तर कलेक्टर निवडा. त्यानंतर हिन्दी, मराठी किंवा मारवाडी यापैकी भाषा निवडून पुढे जा.",

    detailsTitle: "तुमची माहिती",
    detailsDescription: "खाते आणि मोबाइल पडताळणीसाठी मूलभूत माहिती भरा.",
    fullName: "पूर्ण नाव",
    fullNamePlaceholder: "उदा.: राहुल शर्मा",
    mobileNumber: "मोबाइल क्रमांक",
    email: "ईमेल",
    emailPlaceholder: "name@example.com (ऐच्छिक)",
    verifyMobile: "मोबाइल पडताळा",
    generatingOtp: "OTP तयार होत आहे...",
    verificationHelper: "पडताळणीसाठी 6 अंकी OTP तयार केला जाईल.",
    step2Voice:
      "दुसरा टप्पा. तुमचे पूर्ण नाव आणि दहा अंकी मोबाइल क्रमांक भरा. ईमेल ऐच्छिक आहे. माहिती भरल्यानंतर मोबाइल पडताळा बटण दाबा.",

    verifyTitle: "मोबाइल पडताळा",
    otpDescriptionPrefix: "+91",
    otpDescriptionSuffix: "साठी तयार केलेला OTP भरा.",
    developmentOtp: "डेव्हलपमेंट OTP",
    developmentOtpShort: "फक्त स्थानिक डेव्हलपमेंटसाठी",
    sixDigitOtp: "6 अंकी OTP",
    verifying: "पडताळणी होत आहे...",
    verifyOtp: "OTP पडताळा",
    newOtp: "नवीन OTP तयार करा",
    developmentOtpHelper:
      "डेव्हलपमेंट OTP फक्त स्थानिक डेव्हलपमेंट वातावरणात दिसतो.",
    step3Voice:
      "तिसरा टप्पा. स्क्रीनवर दिसणारा सहा अंकी OTP भरा. OTP भरल्यानंतर OTP पडताळा बटण दाबा. गरज असल्यास नवीन OTP तयार करू शकता.",

    completeTitle: "खाते पूर्ण करा",
    completeDescription: "तुमचा पत्ता भरा आणि सुरक्षित पासवर्ड तयार करा.",
    address: "पत्ता",
    addressPlaceholder: "घर / दुकान / रस्ता",
    city: "शहर",
    state: "राज्य",
    pincode: "पिनकोड",
    pincodePlaceholder: "6 अंकी पिनकोड",
    password: "पासवर्ड",
    passwordPlaceholder: "किमान 8 अक्षरे",
    collectorAccount: "कलेक्टर खाते",
    creatingAccount: "खाते तयार होत आहे...",
    createAccount: "खाते तयार करा",
    showPassword: "पासवर्ड दाखवा",
    hidePassword: "पासवर्ड लपवा",
    step4Voice:
      "चौथा आणि शेवटचा टप्पा. तुमचा पूर्ण पत्ता, शहर, राज्य आणि सहा अंकी पिनकोड भरा. नंतर किमान आठ अक्षरांचा सुरक्षित पासवर्ड तयार करा आणि खाते तयार करा बटण दाबा.",

    errorFullName: "पूर्ण नाव भरा.",
    errorMobile: "वैध 10 अंकी भारतीय मोबाइल क्रमांक भरा.",
    errorEmail: "वैध ईमेल पत्ता भरा.",
    errorOtp: "वैध 6 अंकी OTP भरा.",
    errorAddress: "पत्ता भरा.",
    errorCity: "शहर भरा.",
    errorState: "राज्य भरा.",
    errorPincode: "वैध 6 अंकी पिनकोड भरा.",
    errorPassword: "पासवर्ड किमान 8 अक्षरांचा असावा.",
    genericError: "विनंती पूर्ण होऊ शकली नाही. पुन्हा प्रयत्न करा.",
  },

  mwr: {
    back: "पाछै",
    step: "चरण",
    of: "में सूं",

    heroTitleOne: "जुड़ो.",
    heroTitleTwo: "कमाओ. बचाओ.",
    heroDescription:
      "लोकल कबाड़ इकट्ठो करण सूं जांच्या रीसायकलिंग तक — साफ, भरोसेमंद अर टिकाऊ डिजिटल नेटवर्क.",
    verifiedNetwork: "जांच्यो नेटवर्क",
    verifiedNetworkDetail: "भरोसेमंद कलेक्टर अर रीसायकलर",
    transparentPricing: "साफ भाव",
    transparentPricingDetail: "डिजिटल भाव अर साफ रिकॉर्ड",
    secureTransactions: "सुरक्षित लेन-देन",
    secureTransactionsDetail: "पिकअप, सामान सौंपणो अर भुगतान ट्रैकिंग",
    collect: "इकट्ठो करो",
    recycle: "रीसायकल करो",
    earn: "कमाओ",

    chooseAccount: "आपरो खातो चुनो",
    chooseAccountDescription:
      "आप Kabadiwala Connect ने कांई भूमिका में काम में लोगा?",
    collectorDescription:
      "कबाड़ इकट्ठो करो, लॉट चालू करो अर रीसायकलर सूं भाव लो.",
    recyclerDescription: "मिलता लॉट देखो, भाव भेजो अर पिकअप संभाळो.",
    preferredLanguage: "पसंद री भासा",
    preferredLanguageDescription: "ऐप री मुख्य भासा चुनो",
    continue: "आगै बढ़ो",
    alreadyAccount: "पैला सूं खातो है?",
    login: "लॉग इन करो",
    step1Voice:
      "पैलो चरण. पैली आपरो खातो रो प्रकार चुनो. अगर आप कबाड़ इकट्ठो करके लॉट बणाओ हो तो कलेक्टर चुनो. फेर हिन्दी, मराठी या मारवाड़ी में आपरी पसंद री भासा चुनके आगै बढ़ो.",

    detailsTitle: "आपरी जानकारी",
    detailsDescription: "खाता अर मोबाइल जांच खातर जरूरी जानकारी भरो.",
    fullName: "पूरो नाम",
    fullNamePlaceholder: "जैसे: राहुल शर्मा",
    mobileNumber: "मोबाइल नंबर",
    email: "ईमेल",
    emailPlaceholder: "name@example.com (जरूरी कोनी)",
    verifyMobile: "मोबाइल जांचो",
    generatingOtp: "OTP बण रियो है...",
    verificationHelper: "जांच खातर 6 अंक रो OTP बणसी.",
    step2Voice:
      "दूजो चरण. आपरो पूरो नाम अर दस अंक रो मोबाइल नंबर भरो. ईमेल जरूरी कोनी. जानकारी भरया पाछै मोबाइल जांचो बटन दबाओ.",

    verifyTitle: "मोबाइल जांचो",
    otpDescriptionPrefix: "+91",
    otpDescriptionSuffix: "खातर बण्यो OTP भरो.",
    developmentOtp: "डेवलपमेंट OTP",
    developmentOtpShort: "सिर्फ लोकल डेवलपमेंट खातर",
    sixDigitOtp: "6 अंक रो OTP",
    verifying: "जांच हो री है...",
    verifyOtp: "OTP जांचो",
    newOtp: "नवो OTP बणाओ",
    developmentOtpHelper: "डेवलपमेंट OTP सिर्फ लोकल डेवलपमेंट में दिखे है.",
    step3Voice:
      "तीजो चरण. स्क्रीन पर दिखतो छह अंक रो OTP भरो. OTP भरया पाछै OTP जांचो बटन दबाओ. जरूरत हो तो नवो OTP भी बणा सको हो.",

    completeTitle: "खातो पूरो करो",
    completeDescription: "आपरी जगह री जानकारी भरो अर सुरक्षित पासवर्ड बणाओ.",
    address: "पतो",
    addressPlaceholder: "घर / दुकान / सड़क",
    city: "शहर",
    state: "राज्य",
    pincode: "पिनकोड",
    pincodePlaceholder: "6 अंक रो पिनकोड",
    password: "पासवर्ड",
    passwordPlaceholder: "कम सूं कम 8 अक्षर",
    collectorAccount: "कलेक्टर खातो",
    creatingAccount: "खातो बण रियो है...",
    createAccount: "खातो बणाओ",
    showPassword: "पासवर्ड दिखाओ",
    hidePassword: "पासवर्ड छुपाओ",
    step4Voice:
      "चौथो अर आखरी चरण. आपरो पूरो पतो, शहर, राज्य अर छह अंक रो पिनकोड भरो. फेर कम सूं कम आठ अक्षर रो सुरक्षित पासवर्ड बणाओ अर खातो बणाओ बटन दबाओ.",

    errorFullName: "पूरो नाम भरो.",
    errorMobile: "सही 10 अंक रो भारतीय मोबाइल नंबर भरो.",
    errorEmail: "सही ईमेल पतो भरो.",
    errorOtp: "सही 6 अंक रो OTP भरो.",
    errorAddress: "पतो भरो.",
    errorCity: "शहर भरो.",
    errorState: "राज्य भरो.",
    errorPincode: "सही 6 अंक रो पिनकोड भरो.",
    errorPassword: "पासवर्ड कम सूं कम 8 अक्षर रो होणो चाइजे.",
    genericError: "काम पूरो कोनी हो पायो. फेर कोशिश करो.",
  },
};

type CollectorCopy = (typeof collectorCopy)[CollectorLanguage];

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

function getCollectorLanguage(language: Language): CollectorLanguage {
  if (language === "hi" || language === "mr" || language === "mwr") {
    return language;
  }

  return getSavedCollectorLanguage();
}

const initialForm: RegistrationForm = {
  role: "COLLECTOR",
  language: getSavedCollectorLanguage(),
  fullName: "",
  mobile: "",
  email: "",
  businessName: "",
  licenseNumber: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  password: "",
};

function translateCollectorBackendMessage(
  message: string,
  copy: CollectorCopy,
): string {
  switch (message) {
    case "Please wait before requesting another OTP":
      return copy.genericError;
    case "OTP not found":
      return copy.errorOtp;
    case "OTP already used":
      return copy.errorOtp;
    case "OTP expired":
      return copy.errorOtp;
    case "Too many attempts":
      return copy.errorOtp;
    case "Invalid OTP":
      return copy.errorOtp;
    case "Mobile already registered":
      return copy.genericError;
    case "Verify mobile first":
      return copy.errorOtp;
    default:
      return message;
  }
}

function getErrorMessage(
  error: unknown,
  recyclerMode: boolean,
  copy: CollectorCopy,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;

    if (message) {
      return recyclerMode
        ? message
        : translateCollectorBackendMessage(message, copy);
    }

    return recyclerMode
      ? "The request could not be completed."
      : copy.genericError;
  }

  if (error instanceof Error) {
    return recyclerMode ? error.message : copy.genericError;
  }

  return recyclerMode
    ? "Something went wrong. Please try again."
    : copy.genericError;
}

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegistrationForm>(initialForm);

  const [otp, setOtp] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isRecycler = form.role === "RECYCLER";
  const collectorLanguage = getCollectorLanguage(form.language);
  const copy = collectorCopy[collectorLanguage];

  function update<K extends keyof RegistrationForm>(
    key: K,
    value: RegistrationForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
  }

  function changeStep(nextStep: number) {
    setError("");
    setStep(nextStep);
  }

  function selectRole(role: Role) {
    const savedCollectorLanguage = getSavedCollectorLanguage();

    setForm((current) => ({
      ...current,
      role,
      language: role === "RECYCLER" ? "en" : savedCollectorLanguage,
    }));

    if (role === "COLLECTOR") {
      setLanguage(savedCollectorLanguage);
    }

    setError("");
  }

  function selectLanguage(language: CollectorLanguage) {
    update("language", language);
    setLanguage(language);
  }

  function validateDetails(): boolean {
    if (!form.fullName.trim()) {
      setError(isRecycler ? "Enter your full name." : copy.errorFullName);
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setError(
        isRecycler
          ? "Enter a valid 10 digit Indian mobile number."
          : copy.errorMobile,
      );
      return false;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(isRecycler ? "Enter a valid email address." : copy.errorEmail);
      return false;
    }

    if (isRecycler && !form.businessName.trim()) {
      setError("Enter your business name.");
      return false;
    }

    if (isRecycler && !form.licenseNumber.trim()) {
      setError("Enter your license or registration number.");
      return false;
    }

    return true;
  }

  async function sendOtp() {
    if (!validateDetails()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await data<OtpSendResponse>(
        api.post("/auth/otp/send", {
          mobile: form.mobile,
          purpose: "REGISTER",
        }),
      );

      setDevelopmentOtp(response.developmentOtp ?? "");
      setOtp("");
      setStep(3);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, isRecycler, copy));
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    setBusy(true);
    setError("");

    try {
      const response = await data<OtpSendResponse>(
        api.post("/auth/otp/send", {
          mobile: form.mobile,
          purpose: "REGISTER",
        }),
      );

      setDevelopmentOtp(response.developmentOtp ?? "");
      setOtp("");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, isRecycler, copy));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      setError(isRecycler ? "Enter a valid 6 digit OTP." : copy.errorOtp);
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.post("/auth/otp/verify", {
        mobile: form.mobile,
        otp,
        purpose: "REGISTER",
      });

      setStep(4);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, isRecycler, copy));
    } finally {
      setBusy(false);
    }
  }

  function validateFinalDetails(): boolean {
    if (!form.address.trim()) {
      setError(isRecycler ? "Enter your address." : copy.errorAddress);
      return false;
    }

    if (!form.city.trim()) {
      setError(isRecycler ? "Enter your city." : copy.errorCity);
      return false;
    }

    if (!form.state.trim()) {
      setError(isRecycler ? "Enter your state." : copy.errorState);
      return false;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      setError(
        isRecycler ? "Enter a valid 6 digit pincode." : copy.errorPincode,
      );
      return false;
    }

    if (form.password.length < 8) {
      setError(
        isRecycler
          ? "Password must be at least 8 characters."
          : copy.errorPassword,
      );
      return false;
    }

    return true;
  }

  async function finishRegistration() {
    if (!validateFinalDetails()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.post("/auth/register", {
        fullName: form.fullName.trim(),
        mobile: form.mobile,
        password: form.password,
        language: form.role === "RECYCLER" ? "en" : form.language,
        role: form.role,

        email: form.email.trim() || undefined,

        businessName:
          form.role === "RECYCLER" ? form.businessName.trim() : undefined,

        licenseNumber:
          form.role === "RECYCLER" ? form.licenseNumber.trim() : undefined,

        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode,
      });

      navigate("/login");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, isRecycler, copy));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="register-page">
      <aside className="register-visual">
        <Link to="/login" className="register-brand">
          <span className="brand-logo">
            <Recycle />
          </span>

          <span>
            <strong>Kabadiwala Connect</strong>
            <small>
              {isRecycler ? "Waste to Value Network" : copy.verifiedNetwork}
            </small>
          </span>
        </Link>

        <div className="register-visual-content">
          <span className="register-eyebrow">
            <ShieldCheck size={16} />
            {isRecycler ? "Trusted recycling network" : copy.verifiedNetwork}
          </span>

          {isRecycler ? (
            <h1>
              Join the network.
              <br />
              <span>Recycle with trust.</span>
            </h1>
          ) : (
            <h1>
              {copy.heroTitleOne}
              <br />
              <span>{copy.heroTitleTwo}</span>
            </h1>
          )}

          <p>
            {isRecycler
              ? "Connect with local collectors, receive transparent scrap lots and manage recycling transactions through a trusted digital network."
              : copy.heroDescription}
          </p>

          <div className="register-benefits">
            <div>
              <span className="benefit-check">
                <Check />
              </span>

              <span>
                <b>{isRecycler ? "Verified network" : copy.verifiedNetwork}</b>
                <small>
                  {isRecycler
                    ? "Trusted collectors and verified recyclers"
                    : copy.verifiedNetworkDetail}
                </small>
              </span>
            </div>

            <div>
              <span className="benefit-check">
                <Check />
              </span>

              <span>
                <b>
                  {isRecycler ? "Transparent pricing" : copy.transparentPricing}
                </b>
                <small>
                  {isRecycler
                    ? "Digital quotations and clear records"
                    : copy.transparentPricingDetail}
                </small>
              </span>
            </div>

            <div>
              <span className="benefit-check">
                <Check />
              </span>

              <span>
                <b>
                  {isRecycler ? "Secure transactions" : copy.secureTransactions}
                </b>
                <small>
                  {isRecycler
                    ? "Pickup, handover and payment tracking"
                    : copy.secureTransactionsDetail}
                </small>
              </span>
            </div>
          </div>
        </div>

        <div className="register-network">
          <span>
            <Truck size={16} />
            {isRecycler ? "Collect" : copy.collect}
          </span>

          <i />

          <span>
            <Recycle size={16} />
            {isRecycler ? "Recycle" : copy.recycle}
          </span>

          <i />

          <span>
            <BadgeCheck size={16} />
            {isRecycler ? "Earn" : copy.earn}
          </span>
        </div>
      </aside>

      <section className="register-workspace">
        <div className="register-container">
          <div className="register-toolbar">
            <button
              type="button"
              className="register-back"
              onClick={() => {
                if (step === 1) {
                  navigate("/login");
                  return;
                }

                if (step === 3) {
                  changeStep(2);
                  return;
                }

                changeStep(step - 1);
              }}
            >
              <ArrowLeft size={17} />
              {isRecycler ? "Back" : copy.back}
            </button>

            <span>
              {isRecycler
                ? `Step ${step} of 4`
                : `${copy.step} ${step} ${copy.of} 4`}
            </span>
          </div>

          <div className="register-progress">
            {[1, 2, 3, 4].map((item) => (
              <span key={item} className={item <= step ? "active" : ""} />
            ))}
          </div>

          {step === 1 && (
            <section className="register-step">
              <div className="register-heading">
                <span className="register-heading-icon">
                  <UserRound />
                </span>

                <h2>
                  {isRecycler ? (
                    "Choose your account"
                  ) : (
                    <>
                      {copy.chooseAccount} <Speaker text={copy.step1Voice} />
                    </>
                  )}
                </h2>

                <p>
                  {isRecycler
                    ? "Choose how you want to use Kabadiwala Connect."
                    : copy.chooseAccountDescription}
                </p>
              </div>

              <div className="register-role-grid">
                <button
                  type="button"
                  className={
                    form.role === "COLLECTOR"
                      ? "register-role selected"
                      : "register-role"
                  }
                  onClick={() => selectRole("COLLECTOR")}
                >
                  <span className="register-role-icon">
                    <Truck />
                  </span>

                  <span className="register-role-copy">
                    <b>Collector</b>

                    <small>
                      {isRecycler
                        ? "Collect scrap, publish lots and receive quotations from recyclers."
                        : copy.collectorDescription}
                    </small>
                  </span>

                  <span className="register-role-check">
                    {form.role === "COLLECTOR" && <Check />}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    form.role === "RECYCLER"
                      ? "register-role selected"
                      : "register-role"
                  }
                  onClick={() => selectRole("RECYCLER")}
                >
                  <span className="register-role-icon">
                    <Building2 />
                  </span>

                  <span className="register-role-copy">
                    <b>Recycler</b>

                    <small>
                      {isRecycler
                        ? "View available lots, submit quotations and manage pickups."
                        : copy.recyclerDescription}
                    </small>
                  </span>

                  <span className="register-role-check">
                    {form.role === "RECYCLER" && <Check />}
                  </span>
                </button>
              </div>

              {form.role === "COLLECTOR" && (
                <div className="register-language">
                  <div className="register-language-title">
                    <Languages size={18} />

                    <span>
                      <b>{copy.preferredLanguage}</b>
                      <small>{copy.preferredLanguageDescription}</small>
                    </span>
                  </div>

                  <div className="register-language-options">
                    <button
                      type="button"
                      className={form.language === "hi" ? "selected" : ""}
                      onClick={() => selectLanguage("hi")}
                    >
                      हिन्दी
                    </button>

                    <button
                      type="button"
                      className={form.language === "mr" ? "selected" : ""}
                      onClick={() => selectLanguage("mr")}
                    >
                      मराठी
                    </button>

                    <button
                      type="button"
                      className={form.language === "mwr" ? "selected" : ""}
                      onClick={() => selectLanguage("mwr")}
                    >
                      मारवाड़ी
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="register-primary"
                onClick={() => changeStep(2)}
              >
                {isRecycler ? "Continue" : copy.continue}
                <ArrowRight size={18} />
              </button>

              <p className="register-login">
                {isRecycler ? (
                  <>
                    Already have an account? <Link to="/login">Log in</Link>
                  </>
                ) : (
                  <>
                    {copy.alreadyAccount} <Link to="/login">{copy.login}</Link>
                  </>
                )}
              </p>
            </section>
          )}

          {step === 2 && (
            <section className="register-step">
              <div className="register-heading">
                <span className="register-heading-icon">
                  <UserRound />
                </span>

                <h2>
                  {isRecycler ? (
                    "Your details"
                  ) : (
                    <>
                      {copy.detailsTitle} <Speaker text={copy.step2Voice} />
                    </>
                  )}
                </h2>

                <p>
                  {isRecycler
                    ? "Enter the basic details required for your account and mobile verification."
                    : copy.detailsDescription}
                </p>
              </div>

              <div className="register-form-grid">
                <label className="register-field full">
                  {isRecycler ? "Full name *" : `${copy.fullName} *`}

                  <input
                    autoComplete="name"
                    placeholder={
                      isRecycler
                        ? "For example: Rahul Sharma"
                        : copy.fullNamePlaceholder
                    }
                    value={form.fullName}
                    onChange={(event) => update("fullName", event.target.value)}
                  />
                </label>

                <label className="register-field full">
                  {isRecycler ? "Mobile number *" : `${copy.mobileNumber} *`}

                  <div className="register-input-shell">
                    <Smartphone size={18} />

                    <span className="register-country">+91</span>

                    <input
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="98765 43210"
                      value={form.mobile}
                      onChange={(event) =>
                        update(
                          "mobile",
                          event.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                    />
                  </div>
                </label>

                <label className="register-field full">
                  {isRecycler ? "Email" : copy.email}

                  <input
                    type="email"
                    autoComplete="email"
                    placeholder={
                      isRecycler
                        ? "name@example.com (optional)"
                        : copy.emailPlaceholder
                    }
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                  />
                </label>

                {form.role === "RECYCLER" && (
                  <>
                    <label className="register-field">
                      Business name *
                      <input
                        placeholder="Business name"
                        value={form.businessName}
                        onChange={(event) =>
                          update("businessName", event.target.value)
                        }
                      />
                    </label>

                    <label className="register-field">
                      License / Registration no. *
                      <input
                        placeholder="Registration number"
                        value={form.licenseNumber}
                        onChange={(event) =>
                          update("licenseNumber", event.target.value)
                        }
                      />
                    </label>
                  </>
                )}
              </div>

              {error && <div className="register-error">{error}</div>}

              <button
                type="button"
                className="register-primary"
                disabled={busy}
                onClick={() => void sendOtp()}
              >
                {busy
                  ? isRecycler
                    ? "Generating OTP..."
                    : copy.generatingOtp
                  : isRecycler
                    ? "Verify mobile"
                    : copy.verifyMobile}

                {!busy && <ArrowRight size={18} />}
              </button>

              <p className="register-helper">
                {isRecycler
                  ? "A 6 digit OTP will be generated for verification."
                  : copy.verificationHelper}
              </p>
            </section>
          )}

          {step === 3 && (
            <section className="register-step register-otp-step">
              <div className="register-heading">
                <span className="register-heading-icon">
                  <Smartphone />
                </span>

                <h2>
                  {isRecycler ? (
                    "Verify mobile"
                  ) : (
                    <>
                      {copy.verifyTitle} <Speaker text={copy.step3Voice} />
                    </>
                  )}
                </h2>

                <p>
                  {isRecycler
                    ? `Enter the OTP generated for +91 ${form.mobile}.`
                    : `${copy.otpDescriptionPrefix} ${form.mobile} ${copy.otpDescriptionSuffix}`}
                </p>
              </div>

              {developmentOtp && (
                <div className="development-otp">
                  <div>
                    <b>
                      {isRecycler ? "Development OTP" : copy.developmentOtp}
                    </b>

                    <small>
                      {isRecycler
                        ? "For local development only"
                        : copy.developmentOtpShort}
                    </small>
                  </div>

                  <strong>{developmentOtp}</strong>
                </div>
              )}

              <label className="register-field full">
                {isRecycler ? "6 digit OTP" : copy.sixDigitOtp}

                <input
                  className="register-otp-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
              </label>

              {error && <div className="register-error">{error}</div>}

              <button
                type="button"
                className="register-primary"
                disabled={busy || otp.length !== 6}
                onClick={() => void verifyOtp()}
              >
                {busy
                  ? isRecycler
                    ? "Verifying..."
                    : copy.verifying
                  : isRecycler
                    ? "Verify OTP"
                    : copy.verifyOtp}

                {!busy && <BadgeCheck size={18} />}
              </button>

              <button
                type="button"
                className="register-secondary"
                disabled={busy}
                onClick={() => void resendOtp()}
              >
                {isRecycler ? "Generate a new OTP" : copy.newOtp}
              </button>

              <p className="register-helper">
                {isRecycler
                  ? "The development OTP is visible only in the local development environment."
                  : copy.developmentOtpHelper}
              </p>
            </section>
          )}

          {step === 4 && (
            <section className="register-step">
              <div className="register-heading">
                <span className="register-heading-icon">
                  <ShieldCheck />
                </span>

                <h2>
                  {isRecycler ? (
                    "Complete your account"
                  ) : (
                    <>
                      {copy.completeTitle} <Speaker text={copy.step4Voice} />
                    </>
                  )}
                </h2>

                <p>
                  {isRecycler
                    ? "Enter your address details and set a secure password."
                    : copy.completeDescription}
                </p>
              </div>

              <div className="register-form-grid">
                <label className="register-field full">
                  {isRecycler ? "Address *" : `${copy.address} *`}

                  <div className="register-input-shell">
                    <MapPin size={18} />

                    <input
                      autoComplete="street-address"
                      placeholder={
                        isRecycler
                          ? "House / shop / street"
                          : copy.addressPlaceholder
                      }
                      value={form.address}
                      onChange={(event) =>
                        update("address", event.target.value)
                      }
                    />
                  </div>
                </label>

                <label className="register-field">
                  {isRecycler ? "City *" : `${copy.city} *`}

                  <input
                    autoComplete="address-level2"
                    placeholder={isRecycler ? "City" : copy.city}
                    value={form.city}
                    onChange={(event) => update("city", event.target.value)}
                  />
                </label>

                <label className="register-field">
                  {isRecycler ? "State *" : `${copy.state} *`}

                  <input
                    autoComplete="address-level1"
                    placeholder={isRecycler ? "State" : copy.state}
                    value={form.state}
                    onChange={(event) => update("state", event.target.value)}
                  />
                </label>

                <label className="register-field full">
                  {isRecycler ? "Pincode *" : `${copy.pincode} *`}

                  <input
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder={
                      isRecycler ? "6 digit pincode" : copy.pincodePlaceholder
                    }
                    value={form.pincode}
                    onChange={(event) =>
                      update(
                        "pincode",
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                  />
                </label>

                <label className="register-field full">
                  {isRecycler ? "Password *" : `${copy.password} *`}

                  <div className="register-input-shell">
                    <LockKeyhole size={18} />

                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={
                        isRecycler
                          ? "Minimum 8 characters"
                          : copy.passwordPlaceholder
                      }
                      value={form.password}
                      onChange={(event) =>
                        update("password", event.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      aria-label={
                        isRecycler
                          ? showPassword
                            ? "Hide password"
                            : "Show password"
                          : showPassword
                            ? copy.hidePassword
                            : copy.showPassword
                      }
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="register-summary">
                <BadgeCheck size={20} />

                <span>
                  <b>{form.fullName}</b>

                  <small>
                    {isRecycler
                      ? `${form.businessName} • Recycler account`
                      : copy.collectorAccount}
                  </small>
                </span>
              </div>

              {error && <div className="register-error">{error}</div>}

              <button
                type="button"
                className="register-primary"
                disabled={busy}
                onClick={() => void finishRegistration()}
              >
                {busy
                  ? isRecycler
                    ? "Creating account..."
                    : copy.creatingAccount
                  : isRecycler
                    ? "Create account"
                    : copy.createAccount}

                {!busy && <Check size={18} />}
              </button>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
