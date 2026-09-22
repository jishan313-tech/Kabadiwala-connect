import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, data } from "../services/api";
import {
  Button,
  Card,
  Empty,
  Loading,
  Speaker,
  Status,
} from "../components/UI";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileText,
  Home,
  MapPin,
  Navigation,
  Package,
  PackagePlus,
  ReceiptText,
  Recycle,
  Scale,
  Sparkles,
  WalletCards,
} from "lucide-react";

type CollectorTab = "home" | "create" | "lots" | "transactions";

type CollectorLanguage = "hi" | "mr" | "mwr";

interface Material {
  id: string;
  code: string;
  names?: Record<string, string>;
}

interface LotForm {
  category?: string;
  quantity: number;
  estimatedWeight: number;
  unit: string;
  description?: string;
  imageUrls?: string[];
  pickupAddress?: string;
  latitude?: number;
  longitude?: number;
}

interface Lot {
  id: string;
  lotId: string;
  category: string;
  estimatedWeight: number;
  status: string;
}

interface LotPage {
  content?: Lot[];
}

interface StoredFile {
  url: string;
}

interface CreatedLot {
  lotId: string;
}

interface Quotation {
  id: string;
  offeredPrice: number;
  proposedPickupDate: string;
  status: string;
}

interface Transaction {
  id: string;
  transactionId: string;
  finalAmount: number;
  finalWeight: number;
  status: string;
}

const collectorCopy = {
  hi: {
    workspace: "कलेक्टर कार्यक्षेत्र",
    homeDescription:
      "स्क्रैप लॉट बनाइए, रीसायकलर के भाव देखिए और अपने लेन-देन संभालिए।",
    homeVoice:
      "यह आपका कलेक्टर मुख्य पृष्ठ है। नया स्क्रैप लॉट बनाने के लिए नया लॉट बनाएं विकल्प चुनिए। अपने पुराने और चालू लॉट देखने के लिए मेरे लॉट खोलिए। भुगतान और डिजिटल रसीद देखने के लिए रसीदें खोलिए।",

    newCollection: "नया कलेक्शन",
    publishedLots: "प्रकाशित और चालू स्क्रैप लॉट",
    paymentsReceipts: "भुगतान और रसीदें",
    recentLots: "हाल के लॉट",
    viewAll: "सभी देखें",

    step: "चरण",
    of: "में से",

    materialDescription:
      "आपने जो स्क्रैप इकट्ठा किया है, उसकी सही सामग्री श्रेणी चुनिए।",
    materialVoice:
      "पहला चरण। अपने स्क्रैप की सामग्री श्रेणी चुनिए। उपलब्ध सूची में से सही सामग्री चुनिए। सामग्री चुनने के बाद आगे बटन दबाइए।",

    weightDescription: "सामान की मात्रा और अनुमानित वजन भरिए।",
    weightVoice:
      "दूसरा चरण। मात्रा वाले खाने में सामान की संख्या भरिए। अनुमानित वजन वाले खाने में कुल वजन किलो में भरिए। चाहें तो नीचे सामान की स्थिति या गुणवत्ता के बारे में छोटा विवरण लिखिए। जानकारी भरने के बाद आगे दबाइए।",
    shortDescription: "छोटा विवरण",
    shortDescriptionPlaceholder:
      "सामान की स्थिति, गुणवत्ता या उपयोगी जानकारी लिखें...",

    photoDescription:
      "साफ फोटो रीसायकलर को सामग्री समझने और सही भाव देने में मदद करती है।",
    photoVoice:
      "तीसरा चरण। अपने स्क्रैप की साफ और स्पष्ट फोटो जोड़िए। फोटो में सामग्री अच्छी तरह दिखाई देनी चाहिए। फोटो अपलोड होने के बाद आगे दबाइए।",
    addPhoto: "सामान की फोटो जोड़ें",
    photoFormats: "JPEG, PNG या WEBP",
    photosUploaded: "फोटो अपलोड हुई",

    locationDescription:
      "पिकअप पता लिखिए या अपनी वर्तमान जी पी एस लोकेशन लीजिए।",
    locationVoice:
      "चौथा चरण। पिकअप की जगह बताइए। वर्तमान जी पी एस लोकेशन इस्तेमाल करने के लिए जी पी एस बटन दबाइए। नीचे घर, दुकान, सड़क या पहचान वाली जगह का पता भी लिख सकते हैं। फिर आगे दबाइए।",
    useGps: "वर्तमान GPS लोकेशन इस्तेमाल करें",
    pickupAddress: "पिकअप पता",
    pickupPlaceholder: "घर / दुकान / सड़क / पहचान वाली जगह...",
    gpsCaptured: "GPS लोकेशन मिल गई",
    gpsUnavailable: "GPS उपलब्ध नहीं है — पता लिखें",

    reviewDescription: "लॉट प्रकाशित करने से पहले सभी जानकारी ध्यान से जांचिए।",
    reviewVoice:
      "पांचवां और अंतिम चरण। सामग्री, मात्रा, अनुमानित वजन, फोटो और पिकअप पता ध्यान से जांचिए। सारी जानकारी सही हो तो लॉट प्रकाशित करें बटन दबाइए।",
    lotSummary: "लॉट सारांश",
    material: "सामग्री",
    quantity: "मात्रा",
    estimatedWeight: "अनुमानित वजन",
    photos: "फोटो",
    pickupAddressReview: "पिकअप पता",
    gpsLocation: "GPS लोकेशन",

    lotsVoice:
      "यह आपके लॉट हैं। हर लॉट की सामग्री, वजन और स्थिति देखिए। अगर किसी लॉट पर रीसायकलर का भाव आया है, तो कीमत और पिकअप तारीख ध्यान से जांचिए। सही लगे तो स्वीकार करें बटन दबाइए।",
    scrapLot: "स्क्रैप लॉट",
    quotationsTitle: "रीसायकलर के भाव",
    quotationHelp: "भाव और पिकअप तारीख जांचें",
    quotationVoice:
      "रीसायकलर का भाव और पिकअप तारीख ध्यान से जांचिए। अगर भाव और तारीख सही लगे तो स्वीकार करें बटन दबाइए। स्वीकार करने के बाद यही चुना हुआ भाव आगे की पिकअप और भुगतान प्रक्रिया में इस्तेमाल होगा।",
    pickup: "पिकअप",
    accept: "स्वीकार करें",

    transactionsVoice:
      "यह आपके लेन-देन और रसीदें हैं। हर लेन-देन की अंतिम रकम, अंतिम वजन और स्थिति देखिए। जिस लेन-देन की स्थिति पूरी हो गई है, उसकी डिजिटल रसीद लेने के लिए रसीद PDF बटन दबाइए।",
    transactionRecord: "लेन-देन",
    receiptPdf: "रसीद PDF",
    noTransactions: "अभी कोई लेन-देन उपलब्ध नहीं है।",
  },

  mr: {
    workspace: "कलेक्टर कार्यक्षेत्र",
    homeDescription:
      "स्क्रॅप लॉट तयार करा, रीसायकलरचे दर पाहा आणि व्यवहार सांभाळा.",
    homeVoice:
      "हे तुमचे कलेक्टर मुख्य पान आहे. नवीन स्क्रॅप लॉट तयार करण्यासाठी नवीन लॉट तयार करा हा पर्याय निवडा. तुमचे लॉट पाहण्यासाठी माझे लॉट उघडा. पेमेंट आणि डिजिटल पावत्या पाहण्यासाठी पावत्या उघडा.",

    newCollection: "नवीन कलेक्शन",
    publishedLots: "प्रकाशित आणि चालू स्क्रॅप लॉट",
    paymentsReceipts: "पेमेंट आणि पावत्या",
    recentLots: "अलीकडील लॉट",
    viewAll: "सर्व पाहा",

    step: "टप्पा",
    of: "पैकी",

    materialDescription:
      "तुम्ही गोळा केलेल्या स्क्रॅपची योग्य साहित्य श्रेणी निवडा.",
    materialVoice:
      "पहिला टप्पा. तुमच्या स्क्रॅपची योग्य साहित्य श्रेणी निवडा. साहित्य निवडल्यानंतर पुढे बटण दाबा.",

    weightDescription: "सामानाची संख्या आणि अंदाजे वजन भरा.",
    weightVoice:
      "दुसरा टप्पा. संख्या या जागेत सामानाची संख्या भरा. अंदाजे वजन या जागेत किलोमध्ये वजन भरा. हवे असल्यास खाली थोडे वर्णन लिहा. त्यानंतर पुढे दाबा.",
    shortDescription: "लहान वर्णन",
    shortDescriptionPlaceholder:
      "सामानाची स्थिती, गुणवत्ता किंवा उपयुक्त माहिती लिहा...",

    photoDescription:
      "स्पष्ट फोटोमुळे रीसायकलरला साहित्य समजण्यास आणि योग्य दर देण्यास मदत होते.",
    photoVoice:
      "तिसरा टप्पा. स्क्रॅपचा स्पष्ट फोटो जोडा. फोटो अपलोड झाल्यानंतर पुढे दाबा.",
    addPhoto: "साहित्याचा फोटो जोडा",
    photoFormats: "JPEG, PNG किंवा WEBP",
    photosUploaded: "फोटो अपलोड झाले",

    locationDescription:
      "पिकअपचा पत्ता भरा किंवा सध्याची जी पी एस लोकेशन घ्या.",
    locationVoice:
      "चौथा टप्पा. पिकअपची जागा द्या. सध्याची जी पी एस लोकेशन वापरण्यासाठी जी पी एस बटण दाबा. खाली पत्ता देखील लिहू शकता.",
    useGps: "सध्याची GPS लोकेशन वापरा",
    pickupAddress: "पिकअप पत्ता",
    pickupPlaceholder: "घर / दुकान / रस्ता / ओळखीची जागा...",
    gpsCaptured: "GPS लोकेशन मिळाली",
    gpsUnavailable: "GPS उपलब्ध नाही — पत्ता लिहा",

    reviewDescription: "लॉट प्रकाशित करण्यापूर्वी सर्व माहिती तपासा.",
    reviewVoice:
      "पाचवा आणि शेवटचा टप्पा. साहित्य, संख्या, अंदाजे वजन, फोटो आणि पिकअप पत्ता तपासा. सर्व माहिती योग्य असल्यास लॉट प्रकाशित करा बटण दाबा.",
    lotSummary: "लॉट सारांश",
    material: "साहित्य",
    quantity: "संख्या",
    estimatedWeight: "अंदाजे वजन",
    photos: "फोटो",
    pickupAddressReview: "पिकअप पत्ता",
    gpsLocation: "GPS लोकेशन",

    lotsVoice:
      "हे तुमचे लॉट आहेत. प्रत्येक लॉटचे साहित्य, वजन आणि स्थिती पाहा. रीसायकलरचा दर आला असल्यास किंमत आणि पिकअप तारीख नीट तपासा. योग्य वाटल्यास स्वीकारा बटण दाबा.",
    scrapLot: "स्क्रॅप लॉट",
    quotationsTitle: "रीसायकलरचे दर",
    quotationHelp: "दर आणि पिकअप तारीख तपासा",
    quotationVoice:
      "रीसायकलरचा दर आणि पिकअप तारीख नीट तपासा. दर आणि तारीख योग्य वाटल्यास स्वीकारा बटण दाबा. स्वीकारल्यानंतर निवडलेला दर पुढील पिकअप आणि पेमेंट प्रक्रियेसाठी वापरला जाईल.",
    pickup: "पिकअप",
    accept: "स्वीकारा",

    transactionsVoice:
      "हे तुमचे व्यवहार आणि पावत्या आहेत. प्रत्येक व्यवहाराची अंतिम रक्कम, अंतिम वजन आणि स्थिती पाहा. व्यवहार पूर्ण झाल्यावर डिजिटल पावती घेण्यासाठी पावती PDF बटण दाबा.",
    transactionRecord: "व्यवहार",
    receiptPdf: "पावती PDF",
    noTransactions: "सध्या कोणताही व्यवहार उपलब्ध नाही.",
  },

  mwr: {
    workspace: "कलेक्टर काम री जगह",
    homeDescription:
      "स्क्रैप लॉट बणाओ, रीसायकलर रा भाव देखो अर आपरा लेन-देन संभाळो।",
    homeVoice:
      "यो आपरो कलेक्टर मुख्य पन्नो है। नवो स्क्रैप लॉट बणावण खातर नवो लॉट बणाओ रो विकल्प चुनो। आपरा लॉट देखण खातर म्हारा लॉट खोलो। भुगतान अर डिजिटल रसीद देखण खातर रसीदां खोलो।",

    newCollection: "नवो कलेक्शन",
    publishedLots: "चालू अर प्रकाशित स्क्रैप लॉट",
    paymentsReceipts: "भुगतान अर रसीदां",
    recentLots: "हाल रा लॉट",
    viewAll: "सगळा देखो",

    step: "चरण",
    of: "में सूं",

    materialDescription:
      "आप जे स्क्रैप इकट्ठो कर्यो है, उण री सही सामान री किस्म चुनो।",
    materialVoice:
      "पैलो चरण। आपरा स्क्रैप री सही सामान री किस्म चुनो। उपलब्ध सूची में सूं सही सामान चुनो। सामान चुनण पाछै आगै बटन दबाओ।",

    weightDescription: "सामान री मात्रा अर लगभग वजन भरो।",
    weightVoice:
      "दूजो चरण। मात्रा री जगह सामान री संख्या भरो। लगभग वजन री जगह किलो में कुल वजन भरो। चाहो तो नीचे सामान री हालत या गुणवत्ता री जानकारी भी लिख सको हो। फेर आगै दबाओ।",
    shortDescription: "छोटो विवरण",
    shortDescriptionPlaceholder:
      "सामान री हालत, गुणवत्ता या काम री जानकारी लिखो...",

    photoDescription:
      "साफ फोटो सूं रीसायकलर ने सामान समझण अर सही भाव देवण में मदद मिले है।",
    photoVoice:
      "तीजो चरण। आपरा स्क्रैप री साफ फोटो जोड़ो। फोटो में सामान साफ दिखणो चाइजे। फोटो अपलोड हो जावै पाछै आगै दबाओ।",
    addPhoto: "सामान री फोटो जोड़ो",
    photoFormats: "JPEG, PNG या WEBP",
    photosUploaded: "फोटो अपलोड हुई",

    locationDescription: "पिकअप री जगह लिखो या आपरी मौजूदा जी पी एस लोकेशन लो।",
    locationVoice:
      "चौथो चरण। पिकअप री जगह बताओ। मौजूदा जी पी एस लोकेशन लेवण खातर जी पी एस बटन दबाओ। नीचे घर, दुकान, सड़क या पहचान री जगह भी लिख सको हो। फेर आगै दबाओ।",
    useGps: "मौजूदा GPS लोकेशन लो",
    pickupAddress: "पिकअप री जगह",
    pickupPlaceholder: "घर / दुकान / सड़क / पहचान री जगह...",
    gpsCaptured: "GPS लोकेशन मिल गई",
    gpsUnavailable: "GPS उपलब्ध कोनी — जगह लिखो",

    reviewDescription: "लॉट चालू करण सूं पैली सारी जानकारी जांचो।",
    reviewVoice:
      "पांचवो अर आखरी चरण। सामान, मात्रा, लगभग वजन, फोटो अर पिकअप री जगह ध्यान सूं जांचो। सारी जानकारी सही हो तो लॉट प्रकाशित करो बटन दबाओ।",
    lotSummary: "लॉट रो सार",
    material: "सामान",
    quantity: "मात्रा",
    estimatedWeight: "लगभग वजन",
    photos: "फोटो",
    pickupAddressReview: "पिकअप री जगह",
    gpsLocation: "GPS लोकेशन",

    lotsVoice:
      "या आपरा लॉट है। हरेक लॉट रो सामान, वजन अर हालत देखो। रीसायकलर रो भाव आयो हो तो रकम अर पिकअप री तारीख ध्यान सूं जांचो। सही लागे तो स्वीकार करो बटन दबाओ।",
    scrapLot: "स्क्रैप लॉट",
    quotationsTitle: "रीसायकलर रा भाव",
    quotationHelp: "भाव अर पिकअप तारीख जांचो",
    quotationVoice:
      "रीसायकलर रो भाव अर पिकअप री तारीख ध्यान सूं जांचो। भाव अर तारीख सही लागे तो स्वीकार करो बटन दबाओ। स्वीकार करण पाछै यो चुण्यो भाव आगळी पिकअप अर भुगतान री प्रक्रिया में काम आवेगो।",
    pickup: "पिकअप",
    accept: "स्वीकार करो",

    transactionsVoice:
      "या आपरा लेन-देन अर रसीदां है। हरेक लेन-देन री आखरी रकम, आखरी वजन अर हालत देखो। जद लेन-देन पूरो हो जावै, डिजिटल रसीद लेवण खातर रसीद PDF बटन दबाओ।",
    transactionRecord: "लेन-देन",
    receiptPdf: "रसीद PDF",
    noTransactions: "अभी कोई लेन-देन उपलब्ध कोनी।",
  },
};

type CollectorCopy = (typeof collectorCopy)[CollectorLanguage];

const lotStatusLabels: Record<CollectorLanguage, Record<string, string>> = {
  hi: {
    DRAFT: "ड्राफ्ट",
    PUBLISHED: "प्रकाशित",
    QUOTATIONS_RECEIVED: "भाव प्राप्त हुए",
    QUOTATION_SELECTED: "भाव चुना गया",
    PICKUP_SCHEDULED: "पिकअप तय",
    ON_THE_WAY: "पिकअप रास्ते में",
    HANDED_OVER: "सामान सौंपा गया",
    PAYMENT_PENDING: "भुगतान बाकी",
    COMPLETED: "पूरा हुआ",
    CANCELLED: "रद्द",
  },
  mr: {
    DRAFT: "मसुदा",
    PUBLISHED: "प्रकाशित",
    QUOTATIONS_RECEIVED: "दर प्राप्त झाले",
    QUOTATION_SELECTED: "दर निवडला",
    PICKUP_SCHEDULED: "पिकअप ठरला",
    ON_THE_WAY: "पिकअप मार्गावर",
    HANDED_OVER: "साहित्य सुपूर्द",
    PAYMENT_PENDING: "पेमेंट बाकी",
    COMPLETED: "पूर्ण",
    CANCELLED: "रद्द",
  },
  mwr: {
    DRAFT: "ड्राफ्ट",
    PUBLISHED: "चालू",
    QUOTATIONS_RECEIVED: "भाव आया",
    QUOTATION_SELECTED: "भाव चुन्यो",
    PICKUP_SCHEDULED: "पिकअप तय",
    ON_THE_WAY: "पिकअप रस्ता में",
    HANDED_OVER: "सामान सौंप दियो",
    PAYMENT_PENDING: "भुगतान बाकी",
    COMPLETED: "पूरो भयो",
    CANCELLED: "रद्द",
  },
};

function getLotStatusLabel(
  status: string,
  language: CollectorLanguage,
): string {
  return lotStatusLabels[language][status] ?? status.replaceAll("_", " ");
}

const transactionStatusLabels: Record<
  CollectorLanguage,
  Record<string, string>
> = {
  hi: {
    ACTIVE: "चालू",
    PAYMENT_PENDING: "भुगतान बाकी",
    COMPLETED: "पूरा हुआ",
    CANCELLED: "रद्द",
  },
  mr: {
    ACTIVE: "चालू",
    PAYMENT_PENDING: "पेमेंट बाकी",
    COMPLETED: "पूर्ण",
    CANCELLED: "रद्द",
  },
  mwr: {
    ACTIVE: "चालू",
    PAYMENT_PENDING: "भुगतान बाकी",
    COMPLETED: "पूरो भयो",
    CANCELLED: "रद्द",
  },
};

function getTransactionStatusLabel(
  status: string,
  language: CollectorLanguage,
): string {
  return (
    transactionStatusLabels[language][status] ?? status.replaceAll("_", " ")
  );
}

function getCollectorLanguage(language: string): CollectorLanguage {
  if (language === "mr") {
    return "mr";
  }

  if (language === "mwr") {
    return "mwr";
  }

  return "hi";
}

const styles = `
.kc-collector{--g:#126346;--gd:#062b22;--gm:#198257;--lime:#dff56d;--bg:#f5f8f6;--line:#dce7e1;--muted:#72857d;--text:#17352b;min-height:100%;padding:8px 4px 96px;color:var(--text)}
.kc-collector *,.kc-create *{box-sizing:border-box}
.kc-hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:20px;padding:28px 30px;border-radius:24px;color:#fff;background:radial-gradient(circle at 88% 12%,rgba(223,245,109,.2),transparent 28%),linear-gradient(135deg,var(--gd),var(--g));box-shadow:0 18px 45px rgba(10,58,45,.12)}
.kc-hero:after{content:"";position:absolute;right:-55px;bottom:-90px;width:210px;height:210px;border:1px solid rgba(255,255,255,.09);border-radius:50%;box-shadow:0 0 0 32px rgba(255,255,255,.035),0 0 0 64px rgba(255,255,255,.02)}
.kc-hero>div,.kc-hero-logo{position:relative;z-index:1}.kc-kicker{display:inline-flex;align-items:center;gap:7px;margin-bottom:9px;color:var(--lime);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.kc-hero h2{margin:0;color:#fff;font-size:clamp(25px,3vw,36px);letter-spacing:-.035em}.kc-hero p{max-width:540px;margin:8px 0 0;color:rgba(255,255,255,.64);font-size:12px;line-height:1.6}
.kc-hero-logo{width:68px;height:68px;display:grid;place-items:center;border:1px solid rgba(223,245,109,.2);border-radius:20px;color:var(--lime);background:rgba(255,255,255,.08)}
.kc-home{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:18px}
.kc-create-card{position:relative;overflow:hidden;min-height:235px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;padding:28px;border:0;border-radius:22px;color:var(--gd);text-align:left;background:radial-gradient(circle at 90% 15%,rgba(18,99,70,.12),transparent 27%),linear-gradient(145deg,#e8f6d0,var(--lime));box-shadow:0 14px 35px rgba(31,80,56,.08);transition:.18s}
.kc-create-card:hover,.kc-stat:hover{transform:translateY(-2px)}.kc-create-icon{position:absolute;top:25px;left:27px;width:52px;height:52px;display:grid;place-items:center;border-radius:16px;color:#fff;background:#0d513b}
.kc-create-card small{margin-bottom:7px;color:rgba(6,43,34,.62);font-size:10px;font-weight:800;text-transform:uppercase}.kc-create-card b{max-width:390px;font-size:clamp(22px,3vw,31px);line-height:1.15;letter-spacing:-.035em}
.kc-arrow{position:absolute;right:25px;bottom:25px;width:40px;height:40px;display:grid;place-items:center;border-radius:50%;color:#fff;background:#0d513b}
.kc-stack{display:grid;gap:14px}.kc-stat{min-height:110px;display:flex;align-items:center;gap:15px;padding:20px;border:1px solid var(--line);border-radius:19px;color:var(--text);background:#fff;text-align:left;transition:.16s}
.kc-stat-icon{width:46px;height:46px;display:grid;place-items:center;border-radius:14px;color:var(--g);background:#f1f9f3}.kc-stat b,.kc-stat small{display:block}.kc-stat b{font-size:13px}.kc-stat small{margin-top:4px;color:var(--muted);font-size:9px}.kc-count{margin-left:auto;color:#0d513b;font-size:24px;font-weight:800}
.kc-title{display:flex;align-items:center;justify-content:space-between;margin:26px 0 13px}.kc-title h3{margin:0;color:var(--gd);font-size:16px}.kc-title button{border:0;color:var(--g);background:transparent;font-size:10px;font-weight:800}
.kc-list{display:grid;gap:12px}.kc-collector .kc-card{padding:18px!important;border:1px solid var(--line)!important;border-radius:17px!important;background:#fff!important;box-shadow:none!important}
.kc-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.kc-id{display:flex;align-items:center;gap:10px}.kc-id>span{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;color:var(--g);background:#f1f9f3}.kc-id b,.kc-id small{display:block}.kc-id b{font-size:12px}.kc-id small{margin-top:3px;color:var(--muted);font-size:9px}
.kc-meta{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0 0}.kc-meta span{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border-radius:9px;color:#52675e;background:#f5f8f6;font-size:9px;font-weight:700}
.kc-quotes{display:grid;gap:9px;margin-top:15px;padding-top:14px;border-top:1px solid var(--line)}.kc-quote-guide{display:flex;align-items:center;gap:8px;color:#40574d;font-size:10px;font-weight:800}.kc-quote-guide .speaker{flex:0 0 auto}.kc-quote{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:12px;padding:11px 12px;border-radius:12px;background:#f1f9f3}.kc-quote b{color:#0d513b;font-size:15px}.kc-quote span{color:var(--muted);font-size:9px}
.kc-nav{position:sticky;bottom:12px;z-index:20;width:min(580px,calc(100% - 24px));display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:30px auto 0;padding:6px;border:1px solid rgba(220,231,225,.9);border-radius:18px;background:rgba(255,255,255,.94);box-shadow:0 15px 40px rgba(19,53,42,.12);backdrop-filter:blur(12px)}
.kc-nav button{min-height:48px;display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:13px;color:#75877f;background:transparent;font-size:9px;font-weight:700}.kc-nav button.active{color:#0d513b;background:#f1f9f3}.kc-nav svg{width:17px}
.kc-create{--g:#126346;--gd:#062b22;--gm:#198257;--lime:#dff56d;--line:#dce7e1;--muted:#72857d;--text:#17352b;width:min(760px,100%);margin:0 auto;padding:8px 4px 70px;color:var(--text)}
.kc-create-head{display:flex;align-items:center;justify-content:space-between}.kc-back{display:flex;align-items:center;gap:6px;padding:8px 0;border:0;color:var(--g);background:transparent;font-size:10px;font-weight:800}.kc-step-count{color:var(--muted);font-size:9px;font-weight:700}
.kc-progress{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:13px 0 34px}.kc-progress span{height:4px;border-radius:99px;background:#e1e9e4}.kc-progress span.active{background:var(--gm)}
.kc-flow-title{margin-bottom:24px}.kc-flow-icon{width:45px;height:45px;display:grid;place-items:center;margin-bottom:14px;border-radius:13px;color:var(--g);background:#f1f9f3}.kc-flow-title h2{display:flex;align-items:center;gap:8px;margin:0;color:var(--gd);font-size:clamp(25px,3vw,34px);letter-spacing:-.035em}.kc-flow-title p{margin:7px 0 0;color:var(--muted);font-size:10px;line-height:1.6}
.kc-materials{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}.kc-material{min-height:112px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:12px;padding:15px;border:1px solid var(--line);border-radius:15px;color:var(--text);background:#fff;text-align:left;font-size:10px;font-weight:800;transition:.16s}.kc-material:hover{transform:translateY(-2px);border-color:#b7d5c5}.kc-material.selected{border-color:var(--gm);background:#f1f9f3;box-shadow:0 0 0 3px rgba(25,130,87,.07)}.kc-material>span{width:37px;height:37px;display:grid;place-items:center;border-radius:11px;color:var(--g);background:#f1f9f3}.kc-material.selected>span{color:#fff;background:var(--g)}
.kc-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}.kc-field{color:#40574d;font-size:10px;font-weight:700}.kc-field.full{grid-column:1/-1}.kc-field input,.kc-field textarea{width:100%;margin-top:6px;border:1px solid var(--line);border-radius:12px;background:#fff;outline:none}.kc-field input{min-height:49px;padding:0 13px}.kc-field textarea{min-height:105px;padding:13px;resize:vertical}.kc-field input:focus,.kc-field textarea:focus{border-color:var(--gm);box-shadow:0 0 0 4px rgba(25,130,87,.08)}
.kc-upload{min-height:190px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:11px;padding:25px;border:1.5px dashed #a9cdb8;border-radius:18px;color:var(--g);background:#f1f9f3;cursor:pointer;text-align:center}.kc-upload>span{width:52px;height:52px;display:grid;place-items:center;border-radius:15px;color:#fff;background:var(--g)}.kc-upload b,.kc-upload small{display:block}.kc-upload b{font-size:12px}.kc-upload small{color:var(--muted);font-size:9px}
.kc-location{padding:18px;border:1px solid var(--line);border-radius:17px;background:#fff}.kc-gps{width:100%;min-height:48px;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px;border:1px solid #b8d8c5;border-radius:12px;color:var(--g);background:#f1f9f3;font-size:10px;font-weight:800}
.kc-review{overflow:hidden;border:1px solid var(--line);border-radius:19px;background:#fff}.kc-review-head{padding:22px;color:#fff;background:linear-gradient(135deg,var(--gd),var(--g))}.kc-review-head svg{margin-bottom:12px;color:var(--lime)}.kc-review-head h3{margin:0;color:#fff;font-size:20px}.kc-review-body{display:grid;gap:1px;background:var(--line)}.kc-review-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 18px;background:#fff}.kc-review-row span{color:var(--muted);font-size:9px}.kc-review-row b{font-size:10px;text-align:right}
.kc-actions{display:flex;justify-content:flex-end;margin-top:22px}.kc-next{min-width:180px;min-height:49px;display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:12px;color:#fff;background:var(--g);font-size:10px;font-weight:800}.kc-next:disabled{opacity:.45}.kc-msg{margin-top:13px;padding:10px 12px;border-radius:10px;color:#0d513b;background:#f1f9f3;font-size:10px}
@media(max-width:760px){.kc-home{grid-template-columns:1fr}.kc-hero{padding:22px}.kc-hero-logo{display:none}.kc-materials{grid-template-columns:repeat(2,1fr)}.kc-form{grid-template-columns:1fr}.kc-field.full{grid-column:auto}}
@media(max-width:480px){.kc-hero{border-radius:18px}.kc-create-card{min-height:205px;padding:22px}.kc-quote{grid-template-columns:1fr}.kc-nav{width:100%}}
`;

export default function Collector() {
  const { t, i18n } = useTranslation();

  const language = getCollectorLanguage(i18n.language);

  const copy = collectorCopy[language];

  const [tab, setTab] = useState<CollectorTab>("home");

  const [lots, setLots] = useState<Lot[]>([]);

  const [materials, setMaterials] = useState<Material[]>([]);

  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState("");

  const [step, setStep] = useState(0);

  const [form, setForm] = useState<LotForm>({
    quantity: 1,
    estimatedWeight: 1,
    unit: "kg",
  });

  function set<K extends keyof LotForm>(key: K, value: LotForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const load = useCallback(async () => {
    setBusy(true);

    const [lotsResult, materialsResult] = await Promise.allSettled([
      data<LotPage>(api.get("/collector/lots")),
      data<Material[]>(api.get("/materials")),
    ]);

    if (lotsResult.status === "fulfilled") {
      setLots(lotsResult.value.content ?? []);
    } else {
      setLots([]);

      console.error("Collector lots load failed:", lotsResult.reason);
    }

    if (materialsResult.status === "fulfilled") {
      setMaterials(
        Array.isArray(materialsResult.value) ? materialsResult.value : [],
      );
    } else {
      setMaterials([]);

      console.error("Materials load failed:", materialsResult.reason);
    }

    setBusy(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file: File) {
    const formData = new FormData();

    formData.append("purpose", "lot-photo");

    formData.append("file", file);

    const storedFile = await data<StoredFile>(api.post("/files", formData));

    set("imageUrls", [...(form.imageUrls ?? []), storedFile.url]);
  }

  async function publish() {
    const lot = await data<CreatedLot>(api.post("/collector/lots", form));

    await api.post(`/collector/lots/${lot.lotId}/publish`);

    setMsg(`✓ ${t("success")}`);
    setStep(0);
    setTab("lots");

    setForm({
      quantity: 1,
      estimatedWeight: 1,
      unit: "kg",
    });

    await load();
  }

  function geo() {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));

        setMsg(`✓ ${copy.gpsCaptured}`);
      },
      () => setMsg(copy.gpsUnavailable),
    );
  }

  if (busy) {
    return <Loading />;
  }

  if (tab === "create") {
    return (
      <>
        <style>{styles}</style>

        <div className="kc-create">
          <header className="kc-create-head">
            <button
              type="button"
              className="kc-back"
              onClick={() => (step > 0 ? setStep(step - 1) : setTab("home"))}
            >
              <ArrowLeft size={16} />
              {t("back")}
            </button>

            <span className="kc-step-count">
              {copy.step} {step + 1} {copy.of} 5
            </span>
          </header>

          <div className="kc-progress">
            {[0, 1, 2, 3, 4].map((item) => (
              <span key={item} className={item <= step ? "active" : ""} />
            ))}
          </div>

          {step === 0 && (
            <>
              <div className="kc-flow-title">
                <span className="kc-flow-icon">
                  <Recycle />
                </span>

                <h2>
                  {t("selectMaterial")}

                  <Speaker text={copy.materialVoice} />
                </h2>

                <p>{copy.materialDescription}</p>
              </div>

              <div className="kc-materials">
                {materials.map((material) => (
                  <button
                    type="button"
                    key={material.id}
                    className={
                      form.category === material.code
                        ? "kc-material selected"
                        : "kc-material"
                    }
                    onClick={() => set("category", material.code)}
                  >
                    <span>
                      <Recycle size={18} />
                    </span>

                    {material.names?.[language] ?? material.code}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="kc-flow-title">
                <span className="kc-flow-icon">
                  <Scale />
                </span>

                <h2>
                  {t("weight")}

                  <Speaker text={copy.weightVoice} />
                </h2>

                <p>{copy.weightDescription}</p>
              </div>

              <div className="kc-form">
                <label className="kc-field">
                  {t("quantity")}

                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(event) =>
                      set("quantity", Number(event.target.value))
                    }
                  />
                </label>

                <label className="kc-field">
                  {t("weight")} (kg)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.estimatedWeight}
                    onChange={(event) =>
                      set("estimatedWeight", Number(event.target.value))
                    }
                  />
                </label>

                <label className="kc-field full">
                  {copy.shortDescription}

                  <textarea
                    placeholder={copy.shortDescriptionPlaceholder}
                    value={form.description ?? ""}
                    onChange={(event) => set("description", event.target.value)}
                  />
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="kc-flow-title">
                <span className="kc-flow-icon">
                  <Camera />
                </span>

                <h2>
                  {t("photo")}

                  <Speaker text={copy.photoVoice} />
                </h2>

                <p>{copy.photoDescription}</p>
              </div>

              <label className="kc-upload">
                <span>
                  <Camera size={22} />
                </span>

                <b>{copy.addPhoto}</b>

                <small>{copy.photoFormats}</small>

                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      void upload(file);
                    }
                  }}
                />
              </label>

              <p className="kc-msg">
                {form.imageUrls?.length ?? 0} {copy.photosUploaded}
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="kc-flow-title">
                <span className="kc-flow-icon">
                  <MapPin />
                </span>

                <h2>
                  {t("location")}

                  <Speaker text={copy.locationVoice} />
                </h2>

                <p>{copy.locationDescription}</p>
              </div>

              <div className="kc-location">
                <button type="button" className="kc-gps" onClick={geo}>
                  <Navigation size={17} />
                  {copy.useGps}
                </button>

                <label className="kc-field">
                  {copy.pickupAddress}

                  <textarea
                    placeholder={copy.pickupPlaceholder}
                    value={form.pickupAddress ?? ""}
                    onChange={(event) =>
                      set("pickupAddress", event.target.value)
                    }
                  />
                </label>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="kc-flow-title">
                <span className="kc-flow-icon">
                  <CheckCircle2 />
                </span>

                <h2>
                  {t("review")}

                  <Speaker text={copy.reviewVoice} />
                </h2>

                <p>{copy.reviewDescription}</p>
              </div>

              <div className="kc-review">
                <div className="kc-review-head">
                  <FileText size={24} />

                  <h3>{copy.lotSummary}</h3>
                </div>

                <div className="kc-review-body">
                  <div className="kc-review-row">
                    <span>{copy.material}</span>

                    <b>{form.category ?? "—"}</b>
                  </div>

                  <div className="kc-review-row">
                    <span>{copy.quantity}</span>

                    <b>{form.quantity}</b>
                  </div>

                  <div className="kc-review-row">
                    <span>{copy.estimatedWeight}</span>

                    <b>
                      {form.estimatedWeight} {form.unit}
                    </b>
                  </div>

                  <div className="kc-review-row">
                    <span>{copy.photos}</span>

                    <b>{form.imageUrls?.length ?? 0}</b>
                  </div>

                  <div className="kc-review-row">
                    <span>{copy.pickupAddressReview}</span>

                    <b>{form.pickupAddress || copy.gpsLocation}</b>
                  </div>
                </div>
              </div>

              <div className="kc-actions">
                <button
                  type="button"
                  className="kc-next"
                  onClick={() => void publish()}
                >
                  <Sparkles size={16} />
                  {t("publish")}
                </button>
              </div>
            </>
          )}

          {step < 4 && (
            <div className="kc-actions">
              <button
                type="button"
                className="kc-next"
                disabled={
                  (step === 0 && !form.category) ||
                  (step === 1 &&
                    (form.quantity <= 0 || form.estimatedWeight <= 0))
                }
                onClick={() => setStep((current) => current + 1)}
              >
                {t("next")}

                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {msg && <p className="kc-msg">{msg}</p>}
        </div>
      </>
    );
  }

  const recentLots = lots.slice(0, 3);

  return (
    <>
      <style>{styles}</style>

      <div className="kc-collector">
        <header className="kc-hero">
          <div>
            <span className="kc-kicker">
              <Recycle size={14} />
              {copy.workspace}
            </span>

            <h2>
              {tab === "lots"
                ? t("myLots")
                : tab === "transactions"
                  ? t("transactions")
                  : t("dashboard")}

              {(tab === "home" || tab === "lots" || tab === "transactions") && (
                <>
                  {" "}
                  <Speaker
                    text={
                      tab === "home"
                        ? copy.homeVoice
                        : tab === "lots"
                          ? copy.lotsVoice
                          : copy.transactionsVoice
                    }
                  />
                </>
              )}
            </h2>

            <p>{copy.homeDescription}</p>
          </div>

          <span className="kc-hero-logo">
            <Recycle size={31} />
          </span>
        </header>

        {tab === "home" && (
          <>
            <div className="kc-home">
              <button
                type="button"
                className="kc-create-card"
                onClick={() => {
                  setMsg("");
                  setStep(0);
                  setTab("create");
                }}
              >
                <span className="kc-create-icon">
                  <PackagePlus />
                </span>

                <small>{copy.newCollection}</small>

                <b>{t("createLot")}</b>

                <span className="kc-arrow">
                  <ChevronRight />
                </span>
              </button>

              <div className="kc-stack">
                <button
                  type="button"
                  className="kc-stat"
                  onClick={() => setTab("lots")}
                >
                  <span className="kc-stat-icon">
                    <Package />
                  </span>

                  <span>
                    <b>{t("myLots")}</b>

                    <small>{copy.publishedLots}</small>
                  </span>

                  <strong className="kc-count">{lots.length}</strong>
                </button>

                <button
                  type="button"
                  className="kc-stat"
                  onClick={() => setTab("transactions")}
                >
                  <span className="kc-stat-icon">
                    <WalletCards />
                  </span>

                  <span>
                    <b>{t("transactions")}</b>

                    <small>{copy.paymentsReceipts}</small>
                  </span>

                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="kc-title">
              <h3>{copy.recentLots}</h3>

              {lots.length > 0 && (
                <button type="button" onClick={() => setTab("lots")}>
                  {copy.viewAll} →
                </button>
              )}
            </div>

            {recentLots.length ? (
              <div className="kc-list">
                {recentLots.map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                    materials={materials}
                    language={language}
                    copy={copy}
                  />
                ))}
              </div>
            ) : (
              <Empty
                text={t("emptyLots")}
                action={
                  <Button onClick={() => setTab("create")}>
                    {t("createLot")}
                  </Button>
                }
              />
            )}
          </>
        )}

        {tab === "lots" &&
          (lots.length ? (
            <div className="kc-list">
              {lots.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  materials={materials}
                  language={language}
                  copy={copy}
                />
              ))}
            </div>
          ) : (
            <Empty
              text={t("emptyLots")}
              action={
                <Button onClick={() => setTab("create")}>
                  {t("createLot")}
                </Button>
              }
            />
          ))}

        {tab === "transactions" && (
          <Transactions language={language} copy={copy} />
        )}

        <nav className="kc-nav">
          <button
            type="button"
            className={tab === "home" ? "active" : ""}
            onClick={() => setTab("home")}
          >
            <Home />

            <span>{t("dashboard")}</span>
          </button>

          <button
            type="button"
            className={tab === "lots" ? "active" : ""}
            onClick={() => setTab("lots")}
          >
            <Package />

            <span>{t("myLots")}</span>
          </button>

          <button
            type="button"
            className={tab === "transactions" ? "active" : ""}
            onClick={() => setTab("transactions")}
          >
            <ReceiptText />

            <span>{t("transactions")}</span>
          </button>
        </nav>
      </div>
    </>
  );
}

function LotCard({
  lot,
  materials,
  language,
  copy,
}: {
  lot: Lot;
  materials: Material[];
  language: CollectorLanguage;
  copy: CollectorCopy;
}) {
  const materialName =
    materials.find((material) => material.code === lot.category)?.names?.[
      language
    ] ?? lot.category;

  return (
    <Card className="kc-card">
      <div className="kc-card-top">
        <div className="kc-id">
          <span>
            <Package size={17} />
          </span>

          <div>
            <b>{lot.lotId}</b>

            <small>{copy.scrapLot}</small>
          </div>
        </div>

        <Status value={getLotStatusLabel(lot.status, language)} />
      </div>

      <div className="kc-meta">
        <span>
          <Recycle size={13} />
          {materialName}
        </span>

        <span>
          <Scale size={13} />
          {lot.estimatedWeight} kg
        </span>
      </div>

      {["QUOTATIONS_RECEIVED", "QUOTATION_SELECTED"].includes(lot.status) && (
        <QuotationList lot={lot} copy={copy} />
      )}
    </Card>
  );
}

function QuotationList({ lot, copy }: { lot: Lot; copy: CollectorCopy }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    void data<Quotation[]>(api.get(`/lots/${lot.lotId}/quotations`)).then(
      setQuotations,
    );
  }, [lot.lotId]);

  if (!quotations.length) {
    return null;
  }

  return (
    <div className="kc-quotes">
      <div className="kc-quote-guide">
        <span>{copy.quotationHelp}</span>

        <Speaker text={copy.quotationVoice} />
      </div>

      {quotations.map((quotation) => (
        <div className="kc-quote" key={quotation.id}>
          <b>₹{quotation.offeredPrice}</b>

          <span>
            {copy.pickup}: {quotation.proposedPickupDate}
          </span>

          {quotation.status === "SUBMITTED" && (
            <Button
              onClick={() => {
                void api
                  .post(
                    `/collector/lots/${lot.lotId}/quotations/${quotation.id}/accept`,
                  )
                  .then(() => window.location.reload());
              }}
            >
              ✓ {copy.accept}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function Transactions({
  language,
  copy,
}: {
  language: CollectorLanguage;
  copy: CollectorCopy;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    void data<Transaction[]>(api.get("/transactions")).then(setTransactions);
  }, []);

  async function downloadReceipt(transactionId: string) {
    const response = await api.get(
      `/transactions/${transactionId}/receipt.pdf`,
      {
        responseType: "blob",
      },
    );

    const url = URL.createObjectURL(response.data);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = `receipt-${transactionId}.pdf`;

    anchor.click();

    URL.revokeObjectURL(url);
  }

  if (!transactions.length) {
    return <Empty text={copy.noTransactions} />;
  }

  return (
    <div className="kc-list">
      {transactions.map((transaction) => (
        <Card className="kc-card" key={transaction.id}>
          <div className="kc-card-top">
            <div className="kc-id">
              <span>
                <ReceiptText size={17} />
              </span>

              <div>
                <b>{transaction.transactionId}</b>

                <small>
                  ₹{transaction.finalAmount} · {transaction.finalWeight} kg
                </small>
              </div>
            </div>

            <Status
              value={getTransactionStatusLabel(transaction.status, language)}
            />
          </div>

          {transaction.status === "COMPLETED" && (
            <div
              style={{
                marginTop: 14,
              }}
            >
              <Button
                onClick={() => void downloadReceipt(transaction.transactionId)}
              >
                <ReceiptText size={15} />
                {copy.receiptPdf}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
