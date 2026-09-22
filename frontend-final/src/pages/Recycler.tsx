import { useCallback, useEffect, useState } from "react";
import { api, data } from "../services/api";
import { Button, Card, Empty, Loading, Status } from "../components/UI";

type RecyclerTab = "market" | "pickups" | "tx" | "docs";

interface RecyclerProfileData {
  profile?: {
    businessName?: string;
    verificationStatus?: string;
  };

  user?: {
    fullName?: string;
  };
}

interface MarketplaceLot {
  id: string;
  lotId: string;
  category: string;
  estimatedWeight: number;
  pickupAddress?: string;
  status: string;
  acceptedQuotationId?: string;
}

interface MarketplacePage {
  content?: MarketplaceLot[];
}

interface Quotation {
  id: string;
  lotId: string;
  recyclerId?: string;
  offeredPrice?: number;
  priceUnit?: string;
  proposedPickupDate?: string;
  status?: string;
}

interface Transaction {
  id: string;
  transactionId: string;
  lotId?: string;
  material?: string;
  finalWeight?: number;
  finalAmount?: number;
  paymentStatus?: string;
  handoverStatus?: string;
  receiptId?: string;
  status: string;
}

interface Pickup {
  id?: string;
  lotId?: string;
  address?: string;
  status: string;
  date?: string;
  timeWindow?: string;
  finalWeight?: number;
  finalAmount?: number;
}

interface PaymentDetails {
  paymentId: string;
  provider: "MANUAL" | "RAZORPAY";
}

interface RazorpayProviderDetails {
  id: string;
  amount: number;
}

interface PaymentInitiation {
  payment: PaymentDetails;
  provider?: RazorpayProviderDetails;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  handler: (response: RazorpaySuccessResponse) => Promise<void>;
}

interface RazorpayInstance {
  open: () => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

/*
 * Accepted lots disappear from the normal
 * marketplace because backend marketplace
 * only returns currently published lots.
 *
 * We therefore remember lot IDs on which
 * this recycler submitted quotations.
 */
const QUOTED_LOTS_KEY = "kc_recycler_quoted_lots";

function getRememberedLotIds(): string[] {
  try {
    const raw = localStorage.getItem(QUOTED_LOTS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function rememberLotId(lotId: string) {
  const current = getRememberedLotIds();

  if (current.includes(lotId)) {
    return;
  }

  localStorage.setItem(QUOTED_LOTS_KEY, JSON.stringify([...current, lotId]));
}

function forgetLotId(lotId: string) {
  const next = getRememberedLotIds().filter((id) => id !== lotId);

  localStorage.setItem(QUOTED_LOTS_KEY, JSON.stringify(next));
}

export default function Recycler() {
  const [tab, setTab] = useState<RecyclerTab>("market");

  const [lots, setLots] = useState<MarketplaceLot[]>([]);

  const [acceptedLots, setAcceptedLots] = useState<MarketplaceLot[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [profile, setProfile] = useState<RecyclerProfileData>();

  const [busy, setBusy] = useState(true);

  const [category, setCategory] = useState("");

  const loadAcceptedLots = useCallback(async () => {
    const lotIds = getRememberedLotIds();

    if (lotIds.length === 0) {
      setAcceptedLots([]);
      return;
    }

    const results = await Promise.allSettled(
      lotIds.map(async (lotId) => {
        /*
         * First verify that this
         * recycler actually has a
         * quotation on the lot.
         */
        const quotations = await data<Quotation[]>(
          api.get(`/lots/${lotId}/quotations`),
        );

        const mine = quotations.find(
          (quotation) =>
            quotation.lotId === lotId && quotation.status === "ACCEPTED",
        );

        if (!mine) {
          return null;
        }

        const lot = await data<MarketplaceLot>(api.get(`/lots/${lotId}`));

        if (
          ![
            "QUOTATION_SELECTED",
            "PICKUP_SCHEDULED",
            "HANDOVER_VERIFIED",
            "PAYMENT_PENDING",
          ].includes(lot.status)
        ) {
          return null;
        }

        return lot;
      }),
    );

    const accepted = results.flatMap((result) => {
      if (result.status === "fulfilled" && result.value) {
        return [result.value];
      }

      return [];
    });

    setAcceptedLots(accepted);
  }, []);

  const load = useCallback(async () => {
    setBusy(true);

    try {
      const profileData = await data<RecyclerProfileData>(api.get("/profile"));

      setProfile(profileData);

      const verificationStatus =
        profileData.profile?.verificationStatus ?? "PENDING_VERIFICATION";

      if (verificationStatus === "VERIFIED") {
        try {
          const marketplace = await data<MarketplacePage>(
            api.get("/recycler/marketplace", {
              params: {
                category: category || undefined,
              },
            }),
          );

          setLots(marketplace.content ?? []);
        } catch (error) {
          console.error("Marketplace load failed:", error);

          setLots([]);
        }

        try {
          await loadAcceptedLots();
        } catch (error) {
          console.error("Accepted lots load failed:", error);

          setAcceptedLots([]);
        }
      } else {
        setLots([]);
        setAcceptedLots([]);
      }

      try {
        const transactionList = await data<Transaction[]>(
          api.get("/transactions"),
        );

        setTransactions(Array.isArray(transactionList) ? transactionList : []);
      } catch (error) {
        console.error("Transactions load failed:", error);

        setTransactions([]);
      }
    } catch (error) {
      console.error("Recycler profile load failed:", error);
    } finally {
      setBusy(false);
    }
  }, [category, loadAcceptedLots]);

  useEffect(() => {
    void load();
  }, [load]);

  if (busy) {
    return <Loading />;
  }

  const verificationStatus =
    profile?.profile?.verificationStatus ?? "PENDING_VERIFICATION";

  const isVerified = verificationStatus === "VERIFIED";

  return (
    <div className="role-page">
      <div className="page-title">
        <div>
          <small>RECYCLER WORKSPACE</small>

          <h2>
            {profile?.profile?.businessName ??
              profile?.user?.fullName ??
              "Recycler"}
          </h2>
        </div>

        <Status value={verificationStatus} />
      </div>

      <div className="tabs">
        <Button onClick={() => setTab("market")}>Marketplace</Button>

        <Button onClick={() => setTab("pickups")}>
          My Pickups
          {acceptedLots.length > 0 ? ` (${acceptedLots.length})` : ""}
        </Button>

        <Button onClick={() => setTab("tx")}>Transactions</Button>

        <Button onClick={() => setTab("docs")}>Documents</Button>
      </div>

      {tab === "market" && (
        <>
          {isVerified && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>

              <option value="MOBILE">MOBILE</option>

              <option value="COMPUTER">COMPUTER</option>

              <option value="LAPTOP">LAPTOP</option>

              <option value="BATTERY">BATTERY</option>
            </select>
          )}

          {!isVerified ? (
            <Empty text="Marketplace unlocks after admin verification." />
          ) : lots.length > 0 ? (
            lots.map((lot) => (
              <MarketplaceLotCard
                key={lot.id}
                lot={lot}
                onQuotationSubmitted={() => {
                  rememberLotId(lot.lotId);

                  void load();
                }}
              />
            ))
          ) : (
            <Empty text="No published lots match your filters" />
          )}
        </>
      )}

      {tab === "pickups" && (
        <>
          {!isVerified ? (
            <Empty text="Pickup management unlocks after admin verification." />
          ) : acceptedLots.length > 0 ? (
            acceptedLots.map((lot) => (
              <PickupLotCard
                key={lot.id}
                lot={lot}
                onChanged={() => void load()}
              />
            ))
          ) : (
            <Empty text="No accepted quotations waiting for pickup" />
          )}
        </>
      )}

      {tab === "tx" && (
        <>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <Card key={transaction.id}>
                <b>{transaction.transactionId}</b>

                {transaction.lotId && <p>Lot: {transaction.lotId}</p>}

                <p>
                  {transaction.material ?? "Material"}
                  {" · ₹"}
                  {transaction.finalAmount ?? 0}
                </p>

                {transaction.finalWeight !== undefined && (
                  <p>Final weight: {transaction.finalWeight} kg</p>
                )}

                <Status value={transaction.status} />

                {transaction.status === "ACTIVE" && (
                  <Payment transaction={transaction} />
                )}

                {transaction.status === "COMPLETED" && (
                  <Receipt transaction={transaction} />
                )}
              </Card>
            ))
          ) : (
            <Empty text="No transactions yet" />
          )}
        </>
      )}

      {tab === "docs" && <Docs />}
    </div>
  );
}

function MarketplaceLotCard({
  lot,
  onQuotationSubmitted,
}: {
  lot: MarketplaceLot;
  onQuotationSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);

  const [price, setPrice] = useState("");

  const [date, setDate] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function quote() {
    if (!price || Number(price) <= 0) {
      window.alert("Please enter a valid offer amount.");

      return;
    }

    if (!date) {
      window.alert("Please select pickup date.");

      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/recycler/lots/${lot.lotId}/quotations`, {
        offeredPrice: Number(price),

        priceUnit: "TOTAL",

        proposedPickupDate: date,

        validUntil: new Date(Date.now() + 86_400_000).toISOString(),
      });

      /*
       * Remember the lot locally so
       * after Collector accepts it,
       * Recycler can continue pickup
       * workflow.
       */
      rememberLotId(lot.lotId);

      setOpen(false);

      window.alert("Quotation submitted successfully.");

      onQuotationSubmitted();
    } catch (error) {
      console.error("Quotation submission failed:", error);

      window.alert("Unable to submit quotation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <b>{lot.lotId}</b>

      <p>
        {lot.category}
        {" · "}
        {lot.estimatedWeight} kg
      </p>

      {lot.pickupAddress && <p>{lot.pickupAddress}</p>}

      <Status value={lot.status} />

      <Button onClick={() => setOpen(!open)}>
        {open ? "Cancel" : "Send quotation"}
      </Button>

      {open && (
        <div className="inline-form">
          <input
            type="number"
            min="1"
            placeholder="Offer ₹"
            value={price}
            disabled={submitting}
            onChange={(event) => setPrice(event.target.value)}
          />

          <input
            type="date"
            value={date}
            disabled={submitting}
            onChange={(event) => setDate(event.target.value)}
          />

          <Button onClick={() => void quote()}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function PickupLotCard({
  lot,
  onChanged,
}: {
  lot: MarketplaceLot;
  onChanged: () => void;
}) {
  const [pickup, setPickup] = useState<Pickup | null>(null);

  const [date, setDate] = useState("");

  const [timeWindow, setTimeWindow] = useState("10:00-14:00");

  const [scheduling, setScheduling] = useState(false);

  const [loadingPickup, setLoadingPickup] = useState(false);

  const getPickup = useCallback(async () => {
    setLoadingPickup(true);

    try {
      const pickupData = await data<Pickup>(
        api.get(`/lots/${lot.lotId}/pickup`),
      );

      setPickup(pickupData);
    } catch {
      /*
       * QUOTATION_SELECTED means
       * pickup does not exist yet,
       * so 400 here is expected.
       */
      setPickup(null);
    } finally {
      setLoadingPickup(false);
    }
  }, [lot.lotId]);

  useEffect(() => {
    if (lot.status !== "QUOTATION_SELECTED") {
      void getPickup();
    }
  }, [getPickup, lot.status]);

  async function schedule() {
    if (!date) {
      window.alert("Please select pickup date.");

      return;
    }

    if (!timeWindow.trim()) {
      window.alert("Please enter pickup time window.");

      return;
    }

    setScheduling(true);

    try {
      const result = await data<Pickup>(
        api.post(`/recycler/lots/${lot.lotId}/pickup`, {
          date,
          timeWindow: timeWindow.trim(),
        }),
      );

      setPickup(result);

      window.alert("Pickup scheduled successfully.");

      onChanged();
    } catch (error) {
      console.error("Pickup scheduling failed:", error);

      window.alert("Unable to schedule pickup.");
    } finally {
      setScheduling(false);
    }
  }

  async function updatePickupStatus(status: string) {
    try {
      const updated = await data<Pickup>(
        api.patch(`/recycler/lots/${lot.lotId}/pickup`, {
          status,
        }),
      );

      setPickup(updated);

      onChanged();
    } catch (error) {
      console.error("Pickup status update failed:", error);

      window.alert("Unable to update pickup status.");
    }
  }

  return (
    <Card>
      <b>{lot.lotId}</b>

      <p>
        {lot.category}
        {" · "}
        {lot.estimatedWeight} kg
      </p>

      {lot.pickupAddress && <p>Pickup address: {lot.pickupAddress}</p>}

      <Status value={lot.status} />

      {lot.status === "QUOTATION_SELECTED" && !pickup && (
        <div className="inline-form">
          <h3>Schedule Pickup</h3>

          <input
            type="date"
            value={date}
            disabled={scheduling}
            onChange={(event) => setDate(event.target.value)}
          />

          <select
            value={timeWindow}
            disabled={scheduling}
            onChange={(event) => setTimeWindow(event.target.value)}
          >
            <option value="08:00-10:00">08:00 - 10:00</option>

            <option value="10:00-14:00">10:00 - 14:00</option>

            <option value="14:00-18:00">14:00 - 18:00</option>

            <option value="18:00-20:00">18:00 - 20:00</option>
          </select>

          <Button onClick={() => void schedule()}>
            {scheduling ? "Scheduling..." : "Schedule Pickup"}
          </Button>
        </div>
      )}

      {loadingPickup && <p>Loading pickup...</p>}

      {pickup && (
        <div className="inline-form">
          <h3>Pickup Details</h3>

          <Status value={pickup.status} />

          {pickup.date && <p>Date: {pickup.date}</p>}

          {pickup.timeWindow && <p>Time: {pickup.timeWindow}</p>}

          {pickup.address && <p>Address: {pickup.address}</p>}

          {pickup.status === "SCHEDULED" && (
            <Button onClick={() => void updatePickupStatus("ON_THE_WAY")}>
              Mark On The Way
            </Button>
          )}

          {pickup.status === "ON_THE_WAY" && (
            <Button onClick={() => void updatePickupStatus("ARRIVED")}>
              Mark Arrived
            </Button>
          )}

          {pickup.status === "ARRIVED" && (
            <Button onClick={() => void updatePickupStatus("HANDOVER_STARTED")}>
              Start Handover
            </Button>
          )}

          {pickup.status !== "COMPLETED" && (
            <Handover
              lot={lot}
              pickup={pickup}
              onCompleted={() => {
                forgetLotId(lot.lotId);

                onChanged();
              }}
            />
          )}
        </div>
      )}

      {!pickup && lot.status !== "QUOTATION_SELECTED" && (
        <Button onClick={() => void getPickup()}>Refresh Pickup</Button>
      )}
    </Card>
  );
}

function Handover({
  lot,
  pickup,
  onCompleted,
}: {
  lot: MarketplaceLot;
  pickup: Pickup;
  onCompleted: () => void;
}) {
  const [code, setCode] = useState("");

  const [weight, setWeight] = useState("");

  const [amount, setAmount] = useState("");

  const [verifying, setVerifying] = useState(false);

  async function verifyHandover() {
    if (!/^\d{6}$/.test(code)) {
      window.alert("Enter the 6-digit handover code.");

      return;
    }

    if (Number(weight) <= 0 || Number(amount) <= 0) {
      window.alert("Enter valid final weight and amount.");

      return;
    }

    setVerifying(true);

    try {
      await api.post(`/recycler/lots/${lot.lotId}/handover`, {
        code,

        finalWeight: Number(weight),

        finalAmount: Number(amount),
      });

      window.alert("Handover verified successfully. Transaction created.");

      onCompleted();
    } catch (error) {
      console.error("Handover verification failed:", error);

      window.alert("Unable to verify handover.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="inline-form">
      <h3>Verify Handover</h3>

      <p>Collector se 6-digit handover code lo.</p>

      <Status value={pickup.status} />

      <input
        inputMode="numeric"
        maxLength={6}
        placeholder="Collector handover code"
        value={code}
        disabled={verifying}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
      />

      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Final kg"
        value={weight}
        disabled={verifying}
        onChange={(event) => setWeight(event.target.value)}
      />

      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Final ₹"
        value={amount}
        disabled={verifying}
        onChange={(event) => setAmount(event.target.value)}
      />

      <Button onClick={() => void verifyHandover()}>
        {verifying ? "Verifying..." : "Verify Handover"}
      </Button>
    </div>
  );
}

function Payment({ transaction }: { transaction: Transaction }) {
  const [payment, setPayment] = useState<PaymentInitiation>();

  const [initiating, setInitiating] = useState(false);

  async function initiate() {
    setInitiating(true);

    try {
      const result = await data<PaymentInitiation>(
        api.post(
          `/recycler/payments/transactions/${transaction.transactionId}/initiate`,
        ),
      );

      setPayment(result);

      if (result.payment.provider === "RAZORPAY") {
        await checkout(result);
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);

      window.alert("Unable to initiate payment.");
    } finally {
      setInitiating(false);
    }
  }

  async function checkout(result: PaymentInitiation) {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!key) {
      window.alert("VITE_RAZORPAY_KEY_ID is required for Razorpay Checkout");

      return;
    }

    if (!result.provider) {
      window.alert("Razorpay provider details are missing.");

      return;
    }

    if (!window.Razorpay) {
      try {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>(
            'script[data-kc-razorpay="true"]',
          );

          if (existing) {
            if (window.Razorpay) {
              resolve();
            } else {
              existing.addEventListener("load", () => resolve(), {
                once: true,
              });

              existing.addEventListener(
                "error",
                () => reject(new Error("Unable to load Razorpay Checkout")),
                {
                  once: true,
                },
              );
            }

            return;
          }

          const script = document.createElement("script");

          script.src = "https://checkout.razorpay.com/v1/checkout.js";

          script.dataset.kcRazorpay = "true";

          script.onload = () => resolve();

          script.onerror = () =>
            reject(new Error("Unable to load Razorpay Checkout"));

          document.body.appendChild(script);
        });
      } catch (error) {
        console.error("Razorpay script failed:", error);

        window.alert("Unable to load Razorpay Checkout.");

        return;
      }
    }

    if (!window.Razorpay) {
      window.alert("Razorpay Checkout did not initialize.");

      return;
    }

    const razorpay = new window.Razorpay({
      key,

      order_id: result.provider.id,

      amount: result.provider.amount,

      currency: "INR",

      name: "Kabadiwala Connect",

      handler: async (response: RazorpaySuccessResponse) => {
        await api.post(
          `/recycler/payments/${result.payment.paymentId}/confirm`,
          {
            providerPaymentId: response.razorpay_payment_id,

            signature: response.razorpay_signature,
          },
        );

        window.location.reload();
      },
    });

    razorpay.open();
  }

  async function confirmManualPayment() {
    if (!payment) {
      return;
    }

    try {
      await api.post(
        `/recycler/payments/${payment.payment.paymentId}/confirm`,
        {
          manualConfirmed: true,
        },
      );

      window.alert("Payment confirmed successfully.");

      window.location.reload();
    } catch (error) {
      console.error("Manual payment confirmation failed:", error);

      window.alert("Unable to confirm payment.");
    }
  }

  if (!payment) {
    return (
      <div>
        <Button onClick={() => void initiate()}>
          {initiating ? "Initiating..." : "Initiate Payment"}
        </Button>
      </div>
    );
  }

  if (payment.payment.provider === "MANUAL") {
    return (
      <div className="inline-form">
        <p>Payment mode: MANUAL</p>

        <p>
          Offline / UPI / bank settlement independently confirm hone ke baad hi
          payment complete karo.
        </p>

        <Button onClick={() => void confirmManualPayment()}>
          Confirm Externally Settled Payment
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={() => void checkout(payment)}>
        Open Razorpay Checkout
      </Button>
    </div>
  );
}

function Receipt({ transaction }: { transaction: Transaction }) {
  async function openReceipt() {
    try {
      const response = await api.get<Blob>(
        `/transactions/${transaction.transactionId}/receipt.pdf`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch (error) {
      console.error("Receipt open failed:", error);

      window.alert("Unable to open receipt.");
    }
  }

  return (
    <div>
      <Button onClick={() => void openReceipt()}>View Receipt</Button>
    </div>
  );
}

function Docs() {
  const [message, setMessage] = useState("");

  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    setMessage("");

    const formData = new FormData();

    formData.append("purpose", "recycler-document");

    formData.append("file", file);

    try {
      await api.post("/files", formData);

      setMessage("Document uploaded for admin review.");
    } catch (error) {
      console.error("Document upload failed:", error);

      setMessage("Document upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <h3>Verification documents</h3>

      <p>
        Upload your business or authorization document for admin verification.
      </p>

      <input
        type="file"
        accept="application/pdf,image/*"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void upload(file);
          }
        }}
      />

      {uploading && <p>Uploading...</p>}

      {message && <p>{message}</p>}
    </Card>
  );
}
