import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { api, data } from "../services/api";
import { Button, Empty, Speaker, Status } from "../components/UI";
import { useAuth } from "../context-store/useAuth";

type CollectorLanguage = "hi" | "mr" | "mwr";

interface NotificationItem {
  id: string;
  type: string;
  read: boolean;
}

interface NotificationPage {
  content?: NotificationItem[];
}

interface NotificationsResponse {
  items?: NotificationPage;
}

interface NotificationsProps {
  onClose: () => void;
}

const notificationLabels = {
  en: {
    RECYCLER_APPROVED: "Recycler approved",
    RECYCLER_REJECTED: "Recycler rejected",
    RECYCLER_SUSPENDED: "Recycler suspended",
    RECYCLER_PENDING_VERIFICATION: "Recycler verification pending",
    NEW_QUOTATION: "New quotation received",
    QUOTATION_ACCEPTED: "Quotation accepted",
    PICKUP_SCHEDULED: "Pickup scheduled",
    PICKUP_UPDATED: "Pickup updated",
    HANDOVER_VERIFIED: "Handover verified",
    PAYMENT_SUCCESS: "Payment successful",
    TRANSACTION_COMPLETED: "Transaction completed",
  },

  hi: {
    RECYCLER_APPROVED: "रीसायकलर सत्यापित हुआ",
    RECYCLER_REJECTED: "रीसायकलर आवेदन अस्वीकार हुआ",
    RECYCLER_SUSPENDED: "रीसायकलर निलंबित हुआ",
    RECYCLER_PENDING_VERIFICATION: "रीसायकलर सत्यापन बाकी है",
    NEW_QUOTATION: "नया भाव मिला",
    QUOTATION_ACCEPTED: "भाव स्वीकार हुआ",
    PICKUP_SCHEDULED: "पिकअप तय हुआ",
    PICKUP_UPDATED: "पिकअप की स्थिति बदली",
    HANDOVER_VERIFIED: "सामान सौंपना सत्यापित हुआ",
    PAYMENT_SUCCESS: "भुगतान सफल हुआ",
    TRANSACTION_COMPLETED: "लेन-देन पूरा हुआ",
  },

  mr: {
    RECYCLER_APPROVED: "रीसायकलर पडताळला गेला",
    RECYCLER_REJECTED: "रीसायकलर अर्ज नाकारला गेला",
    RECYCLER_SUSPENDED: "रीसायकलर निलंबित झाला",
    RECYCLER_PENDING_VERIFICATION: "रीसायकलर पडताळणी बाकी आहे",
    NEW_QUOTATION: "नवीन दर प्रस्ताव मिळाला",
    QUOTATION_ACCEPTED: "दर प्रस्ताव स्वीकारला",
    PICKUP_SCHEDULED: "पिकअप ठरला",
    PICKUP_UPDATED: "पिकअपची स्थिती बदलली",
    HANDOVER_VERIFIED: "साहित्य सुपूर्द करणे पडताळले",
    PAYMENT_SUCCESS: "भरणा यशस्वी झाला",
    TRANSACTION_COMPLETED: "व्यवहार पूर्ण झाला",
  },

  mwr: {
    RECYCLER_APPROVED: "रीसायकलर जांच्यो गयो",
    RECYCLER_REJECTED: "रीसायकलर अर्ज नामंजूर भयो",
    RECYCLER_SUSPENDED: "रीसायकलर रोक्यो गयो",
    RECYCLER_PENDING_VERIFICATION: "रीसायकलर री जांच बाकी है",
    NEW_QUOTATION: "नवो भाव आयो",
    QUOTATION_ACCEPTED: "भाव मंजूर भयो",
    PICKUP_SCHEDULED: "पिकअप तय भयो",
    PICKUP_UPDATED: "पिकअप री स्थिति बदली",
    HANDOVER_VERIFIED: "सामान सौंपणो जांच्यो गयो",
    PAYMENT_SUCCESS: "भुगतान सफल भयो",
    TRANSACTION_COMPLETED: "लेन-देन पूरो भयो",
  },
} as const;

const collectorCopy = {
  hi: {
    title: "सूचनाएं",
    markAllRead: "सभी को पढ़ा हुआ करें",
    noNotifications: "अभी कोई सूचना नहीं है",
    read: "पढ़ी गई",
    new: "नई",
    close: "सूचनाएं बंद करें",
    voiceEmpty: "अभी आपके लिए कोई नई सूचना नहीं है।",
    voiceIntro: "आपकी सूचनाएं हैं।",
  },

  mr: {
    title: "सूचना",
    markAllRead: "सर्व वाचले म्हणून चिन्हांकित करा",
    noNotifications: "सध्या कोणतीही सूचना नाही",
    read: "वाचले",
    new: "नवीन",
    close: "सूचना बंद करा",
    voiceEmpty: "सध्या तुमच्यासाठी कोणतीही नवीन सूचना नाही.",
    voiceIntro: "तुमच्या सूचना आहेत.",
  },

  mwr: {
    title: "सूचना",
    markAllRead: "सगळ्यां ने पढ़्यो बताओ",
    noNotifications: "अभी कोई सूचना कोनी",
    read: "पढ़ी",
    new: "नई",
    close: "सूचना बंद करो",
    voiceEmpty: "अभी थारे खातर कोई नई सूचना कोनी.",
    voiceIntro: "थारी सूचना ई है.",
  },
} as const;

function getCollectorLanguage(language: string): CollectorLanguage {
  if (language === "hi" || language === "mr" || language === "mwr") {
    return language;
  }

  const saved = localStorage.getItem("kc_lang");

  if (saved === "hi" || saved === "mr" || saved === "mwr") {
    return saved;
  }

  return "hi";
}

function humanizeType(type: string): string {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Notifications({ onClose }: NotificationsProps) {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const isCollector = user?.role === "COLLECTOR";

  const collectorLanguage = getCollectorLanguage(i18n.language);

  const copy = collectorCopy[collectorLanguage];

  const load = useCallback(async () => {
    const response = await data<NotificationsResponse>(
      api.get("/notifications"),
    );

    setNotifications(response.items?.content ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    await api.patch("/notifications/read-all");

    await load();
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);

    await load();
  }

  function getLabel(notificationType: string): string {
    if (!isCollector) {
      return (
        notificationLabels.en[
          notificationType as keyof typeof notificationLabels.en
        ] ?? humanizeType(notificationType)
      );
    }

    const languageLabels = notificationLabels[collectorLanguage];

    return (
      languageLabels[notificationType as keyof typeof languageLabels] ??
      humanizeType(notificationType)
    );
  }

  const voiceText = useMemo(() => {
    if (!isCollector) {
      return "";
    }

    if (!notifications.length) {
      return copy.voiceEmpty;
    }

    const notificationText = notifications
      .map((notification) => getLabel(notification.type))
      .join(". ");

    return `${copy.voiceIntro} ${notificationText}.`;
  }, [notifications, isCollector, collectorLanguage]);

  return (
    <div className="drawer">
      <div className="drawer-head">
        <h3>
          {isCollector ? copy.title : "Notifications"}

          {isCollector && (
            <>
              {" "}
              <Speaker text={voiceText} />
            </>
          )}
        </h3>

        <Button
          aria-label={isCollector ? copy.close : "Close notifications"}
          onClick={onClose}
        >
          ×
        </Button>
      </div>

      <Button onClick={() => void markAllRead()}>
        {isCollector ? copy.markAllRead : "Mark all read"}
      </Button>

      {notifications.length ? (
        notifications.map((notification) => (
          <button
            type="button"
            className="notification"
            key={notification.id}
            onClick={() => void markRead(notification.id)}
          >
            <b>{getLabel(notification.type)}</b>

            <Status
              value={
                notification.read
                  ? isCollector
                    ? copy.read
                    : "READ"
                  : isCollector
                    ? copy.new
                    : "NEW"
              }
            />
          </button>
        ))
      ) : (
        <Empty text={isCollector ? copy.noNotifications : "No notifications"} />
      )}
    </div>
  );
}
