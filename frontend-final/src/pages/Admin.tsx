import { type ReactNode, useCallback, useEffect, useState } from "react";
import { api, data } from "../services/api";
import { Button, Card, Empty, Loading, Status } from "../components/UI";

type AdminTab =
  | "dashboard"
  | "recyclers"
  | "lots"
  | "transactions"
  | "payments"
  | "materials"
  | "audit"
  | "settings";

type GenericRecord = Record<string, unknown>;

interface RecyclerItem extends GenericRecord {
  id: string;
  userId: string;
  businessName?: string;
  licenseNumber?: string;
  verificationStatus: string;
}

interface MaterialItem extends GenericRecord {
  id: string;
  code: string;
  names?: Record<string, string>;
  active?: boolean;
}

interface RecyclerDocument extends GenericRecord {
  id: string;
  originalName?: string;
  fileName?: string;
  contentType?: string;
  mimeType?: string;
  purpose?: string;
  url?: string;
  status?: string;
  createdAt?: string;
}

interface PageResponse {
  content?: GenericRecord[];
}

interface PreviewState {
  documentId: string;
  url: string;
  contentType: string;
  name: string;
}

const paths: Record<Exclude<AdminTab, "dashboard">, string> = {
  recyclers: "/admin/recyclers",
  lots: "/admin/lots",
  transactions: "/admin/transactions",
  payments: "/admin/payments",
  materials: "/materials",
  audit: "/admin/audit-logs",
  settings: "/admin/settings",
};

const tabNames: Record<AdminTab, string> = {
  dashboard: "Dashboard",
  recyclers: "Recyclers",
  lots: "Lots",
  transactions: "Transactions",
  payments: "Payments",
  materials: "Materials",
  audit: "Audit",
  settings: "Settings",
};

export default function Admin() {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [dashboard, setDashboard] = useState<GenericRecord>({});
  const [items, setItems] = useState<GenericRecord[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async (target: AdminTab) => {
    setBusy(true);

    try {
      if (target === "dashboard") {
        const dashboardData = await data<GenericRecord>(
          api.get("/admin/dashboard"),
        );

        setDashboard(dashboardData);
        setItems([]);
        return;
      }

      const response = await data<PageResponse | GenericRecord[]>(
        api.get(paths[target]),
      );

      if (Array.isArray(response)) {
        setItems(response);
      } else {
        setItems(response.content ?? []);
      }
    } catch (error) {
      console.error(`Admin ${target} load failed:`, error);
      setItems([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [load, tab]);

  async function updateRecyclerStatus(
    userId: string,
    verificationStatus: string,
  ) {
    let reason = "";

    if (verificationStatus !== "VERIFIED") {
      reason = window.prompt("Reason") ?? "";

      if (!reason.trim()) {
        return;
      }
    }

    try {
      await api.post(`/admin/recyclers/${userId}/status`, {
        status: verificationStatus,
        reason,
      });

      await load("recyclers");
    } catch (error) {
      console.error("Recycler status update failed:", error);
      window.alert("Unable to update recycler status.");
    }
  }

  const recyclerItems = items as RecyclerItem[];
  const materialItems = items as MaterialItem[];

  return (
    <div className="admin-layout">
      <aside>
        <h2>♻ KC Admin</h2>

        {(
          [
            "dashboard",
            "recyclers",
            "lots",
            "transactions",
            "payments",
            "materials",
            "audit",
            "settings",
          ] as AdminTab[]
        ).map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {tabNames[item]}
          </button>
        ))}
      </aside>

      <main>
        <h1>{tabNames[tab]}</h1>

        {busy ? (
          <Loading />
        ) : tab === "dashboard" ? (
          <DashboardView dashboard={dashboard} />
        ) : tab === "recyclers" ? (
          recyclerItems.length > 0 ? (
            recyclerItems.map((recycler) => (
              <RecyclerCard
                key={recycler.id}
                recycler={recycler}
                onStatusChange={updateRecyclerStatus}
              />
            ))
          ) : (
            <Empty text="No recyclers found" />
          )
        ) : tab === "materials" ? (
          <Materials items={materialItems} />
        ) : tab === "lots" ? (
          <LotsView items={items} />
        ) : tab === "transactions" ? (
          <TransactionsView items={items} />
        ) : tab === "payments" ? (
          <PaymentsView items={items} />
        ) : tab === "audit" ? (
          <AuditView items={items} />
        ) : tab === "settings" ? (
          <SettingsView items={items} />
        ) : (
          <Empty text="No data found" />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   COMMON DISPLAY HELPERS
   ========================================================= */

function text(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function money(value: unknown) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "—";
  }

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function dateTime(value: unknown) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function label(value: string) {
  if (!value || value === "—") {
    return value;
  }

  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortId(value: unknown) {
  const id = text(value);

  if (id === "—" || id.length <= 22) {
    return id;
  }

  return `${id.slice(0, 9)}…${id.slice(-6)}`;
}

function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginTop: 18,
      }}
    >
      {children}
    </div>
  );
}

function Detail({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        border: "1px solid #dfe9e4",
        borderRadius: 12,
        background: "#f8fbf9",
        minWidth: 0,
      }}
    >
      <small
        style={{
          display: "block",
          color: "#657a70",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {title}
      </small>

      <div
        style={{
          color: "#123b31",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle?: string;
  status?: unknown;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            color: "#073c30",
          }}
        >
          {title}
        </h3>

        {subtitle && (
          <p
            style={{
              margin: "6px 0 0",
              color: "#657a70",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {status !== undefined && status !== null && status !== "" && (
        <Status value={String(status)} />
      )}
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function DashboardView({ dashboard }: { dashboard: GenericRecord }) {
  const entries = Object.entries(dashboard);

  if (entries.length === 0) {
    return <Empty text="No dashboard data found" />;
  }

  return (
    <div className="metrics">
      {entries.map(([key, value]) => (
        <Card key={key}>
          <small
            style={{
              display: "block",
              marginBottom: 8,
              color: "#657a70",
            }}
          >
            {label(key)}
          </small>

          <strong
            style={{
              fontSize: 26,
              color: "#073c30",
            }}
          >
            {text(value, "0")}
          </strong>
        </Card>
      ))}
    </div>
  );
}

/* =========================================================
   RECYCLERS + DOCUMENT PREVIEW
   ========================================================= */

function RecyclerCard({
  recycler,
  onStatusChange,
}: {
  recycler: RecyclerItem;
  onStatusChange: (userId: string, status: string) => Promise<void>;
}) {
  const [documents, setDocuments] = useState<RecyclerDocument[]>([]);

  const [showDocuments, setShowDocuments] = useState(false);

  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const [documentsLoaded, setDocumentsLoaded] = useState(false);

  const [preview, setPreview] = useState<PreviewState | null>(null);

  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  async function loadDocuments() {
    if (showDocuments) {
      setShowDocuments(false);
      closePreview();
      return;
    }

    setShowDocuments(true);

    if (documentsLoaded) {
      return;
    }

    setLoadingDocuments(true);

    try {
      const response = await data<
        | RecyclerDocument[]
        | {
            content?: RecyclerDocument[];
          }
      >(api.get(`/admin/recyclers/${recycler.userId}/documents`));

      if (Array.isArray(response)) {
        setDocuments(response);
      } else {
        setDocuments(response.content ?? []);
      }

      setDocumentsLoaded(true);
    } catch (error) {
      console.error("Recycler documents load failed:", error);

      setDocuments([]);
      window.alert("Unable to load recycler documents.");
    } finally {
      setLoadingDocuments(false);
    }
  }

  function getDocumentPath(documentUrl: string) {
    let path = documentUrl;

    if (path.startsWith("http://") || path.startsWith("https://")) {
      const parsed = new URL(path);
      path = parsed.pathname;
    }

    if (path.startsWith("/api/v1")) {
      path = path.substring("/api/v1".length);
    }

    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    return path;
  }

  async function previewDocument(document: RecyclerDocument) {
    if (!document.url) {
      window.alert("Document URL is not available.");
      return;
    }

    if (preview?.documentId === document.id) {
      closePreview();
      return;
    }

    setOpeningDocumentId(document.id);

    try {
      const path = getDocumentPath(document.url);

      const response = await api.get<Blob>(path, {
        responseType: "blob",
      });

      const headerType = String(response.headers["content-type"] ?? "");

      let contentType = document.contentType || document.mimeType || headerType;

      const fileName = document.originalName || document.fileName || "document";

      if (!contentType || contentType === "application/octet-stream") {
        const lowerName = fileName.toLowerCase();

        if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
          contentType = "image/jpeg";
        } else if (lowerName.endsWith(".png")) {
          contentType = "image/png";
        } else if (lowerName.endsWith(".webp")) {
          contentType = "image/webp";
        } else if (lowerName.endsWith(".pdf")) {
          contentType = "application/pdf";
        }
      }

      if (
        !contentType.startsWith("image/") &&
        contentType !== "application/pdf"
      ) {
        window.alert("This document format cannot be previewed.");
        return;
      }

      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }

      const blob = new Blob([response.data], {
        type: contentType,
      });

      const blobUrl = URL.createObjectURL(blob);

      setPreview({
        documentId: document.id,
        url: blobUrl,
        contentType,
        name: fileName,
      });
    } catch (error) {
      console.error("Document preview failed:", error);

      window.alert("Unable to preview document.");
    } finally {
      setOpeningDocumentId(null);
    }
  }

  function closePreview() {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview(null);
  }

  const isPending = recycler.verificationStatus === "PENDING_VERIFICATION";

  return (
    <Card>
      <SectionHeader
        title={recycler.businessName ?? "Recycler"}
        subtitle={
          recycler.licenseNumber
            ? `License: ${recycler.licenseNumber}`
            : "No license number"
        }
        status={recycler.verificationStatus}
      />

      <div className="actions" style={{ marginTop: 18 }}>
        <Button onClick={() => void loadDocuments()}>
          {showDocuments ? "Hide Documents" : "View Documents"}
        </Button>

        {isPending && (
          <>
            <Button
              onClick={() => void onStatusChange(recycler.userId, "VERIFIED")}
            >
              Approve
            </Button>

            <Button
              onClick={() => void onStatusChange(recycler.userId, "REJECTED")}
            >
              Reject
            </Button>
          </>
        )}

        {recycler.verificationStatus !== "SUSPENDED" && (
          <Button
            onClick={() => void onStatusChange(recycler.userId, "SUSPENDED")}
          >
            Suspend
          </Button>
        )}
      </div>

      {showDocuments && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #dfe9e4",
          }}
        >
          <h3>Verification Documents</h3>

          {loadingDocuments ? (
            <p>Loading documents...</p>
          ) : documents.length === 0 ? (
            <Empty text="No verification documents uploaded" />
          ) : (
            documents.map((document) => {
              const isOpen = preview?.documentId === document.id;

              return (
                <div
                  key={document.id}
                  style={{
                    padding: 14,
                    marginTop: 10,
                    border: "1px solid #dfe9e4",
                    borderRadius: 12,
                    background: "#f8fbf9",
                  }}
                >
                  <strong>
                    {document.originalName ??
                      document.fileName ??
                      "Verification document"}
                  </strong>

                  {document.purpose && (
                    <p>Purpose: {label(document.purpose)}</p>
                  )}

                  {document.status && (
                    <div
                      style={{
                        marginBottom: 12,
                      }}
                    >
                      <Status value={document.status} />
                    </div>
                  )}

                  {document.createdAt && (
                    <p>Uploaded: {dateTime(document.createdAt)}</p>
                  )}

                  <Button onClick={() => void previewDocument(document)}>
                    {openingDocumentId === document.id
                      ? "Loading..."
                      : isOpen
                        ? "Close Preview"
                        : "Preview Document"}
                  </Button>

                  {isOpen && preview && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 12,
                        border: "1px solid #dfe9e4",
                        borderRadius: 12,
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong>{preview.name}</strong>

                        <Button onClick={closePreview}>Close</Button>
                      </div>

                      {preview.contentType.startsWith("image/") ? (
                        <img
                          src={preview.url}
                          alt={preview.name}
                          style={{
                            display: "block",
                            width: "100%",
                            maxHeight: 600,
                            objectFit: "contain",
                            borderRadius: 10,
                          }}
                        />
                      ) : (
                        <iframe
                          src={preview.url}
                          title={preview.name}
                          style={{
                            width: "100%",
                            height: 600,
                            border: "none",
                            borderRadius: 10,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   LOTS
   ========================================================= */

function LotsView({ items }: { items: GenericRecord[] }) {
  if (items.length === 0) {
    return <Empty text="No lots found" />;
  }

  return (
    <>
      {items.map((lot, index) => {
        const history = Array.isArray(lot.history)
          ? (lot.history as GenericRecord[])
          : [];

        const imageUrls = Array.isArray(lot.imageUrls) ? lot.imageUrls : [];

        return (
          <Card key={String(lot.id ?? lot.lotId ?? index)}>
            <SectionHeader
              title={text(lot.lotId, "Scrap Lot")}
              subtitle={`${label(text(lot.category, "Material"))} scrap lot`}
              status={lot.status}
            />

            <DetailGrid>
              <Detail title="Material" value={label(text(lot.category))} />

              <Detail title="Description" value={text(lot.description)} />

              <Detail
                title="Quantity"
                value={`${text(lot.quantity)} ${text(lot.unit, "")}`.trim()}
              />

              <Detail
                title="Estimated Weight"
                value={
                  lot.estimatedWeight !== undefined
                    ? `${text(lot.estimatedWeight)} kg`
                    : "—"
                }
              />

              <Detail title="Condition" value={text(lot.condition)} />

              <Detail title="Pickup Address" value={text(lot.pickupAddress)} />

              <Detail title="Collector ID" value={shortId(lot.collectorId)} />

              <Detail
                title="Accepted Quotation"
                value={shortId(lot.acceptedQuotationId)}
              />
            </DetailGrid>

            {(lot.latitude !== undefined || lot.longitude !== undefined) && (
              <div
                style={{
                  marginTop: 16,
                  color: "#657a70",
                }}
              >
                <strong>Pickup Location:</strong> {text(lot.latitude)} /{" "}
                {text(lot.longitude)}
              </div>
            )}

            {imageUrls.length > 0 && (
              <p
                style={{
                  color: "#657a70",
                  marginTop: 16,
                }}
              >
                {imageUrls.length} lot{" "}
                {imageUrls.length === 1 ? "photo" : "photos"} uploaded
              </p>
            )}

            {history.length > 0 && (
              <details
                style={{
                  marginTop: 20,
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#0b5b47",
                  }}
                >
                  View Lot Timeline ({history.length})
                </summary>

                <div
                  style={{
                    marginTop: 14,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  {history.map((entry, historyIndex) => (
                    <div
                      key={historyIndex}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: "#f8fbf9",
                        border: "1px solid #dfe9e4",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong>
                          {label(text(entry.from))} → {label(text(entry.to))}
                        </strong>

                        <small>{dateTime(entry.at)}</small>
                      </div>

                      {entry.note !== undefined && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "#657a70",
                          }}
                        >
                          {text(entry.note)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </Card>
        );
      })}
    </>
  );
}

/* =========================================================
   TRANSACTIONS
   ========================================================= */

function TransactionsView({ items }: { items: GenericRecord[] }) {
  if (items.length === 0) {
    return <Empty text="No transactions found" />;
  }

  return (
    <>
      {items.map((transaction, index) => (
        <Card
          key={String(transaction.id ?? transaction.transactionId ?? index)}
        >
          <SectionHeader
            title={text(transaction.transactionId, "Transaction")}
            subtitle={`Lot: ${text(transaction.lotId)}`}
            status={transaction.status}
          />

          <DetailGrid>
            <Detail
              title="Material"
              value={label(text(transaction.material))}
            />

            <Detail
              title="Final Weight"
              value={
                transaction.finalWeight !== undefined
                  ? `${text(transaction.finalWeight)} kg`
                  : "—"
              }
            />

            <Detail
              title="Final Amount"
              value={money(transaction.finalAmount)}
            />

            <Detail
              title="Payment Status"
              value={
                transaction.paymentStatus ? (
                  <Status value={String(transaction.paymentStatus)} />
                ) : (
                  "—"
                )
              }
            />

            <Detail
              title="Handover Status"
              value={
                transaction.handoverStatus ? (
                  <Status value={String(transaction.handoverStatus)} />
                ) : (
                  "—"
                )
              }
            />

            <Detail title="Receipt ID" value={text(transaction.receiptId)} />

            <Detail title="Created" value={dateTime(transaction.createdAt)} />

            <Detail
              title="Completed"
              value={dateTime(transaction.completedAt)}
            />
          </DetailGrid>

          <details style={{ marginTop: 20 }}>
            <summary
              style={{
                cursor: "pointer",
                color: "#0b5b47",
                fontWeight: 700,
              }}
            >
              Technical Details
            </summary>

            <DetailGrid>
              <Detail
                title="Collector ID"
                value={shortId(transaction.collectorId)}
              />

              <Detail
                title="Recycler ID"
                value={shortId(transaction.recyclerId)}
              />

              <Detail title="Database ID" value={shortId(transaction.id)} />
            </DetailGrid>
          </details>
        </Card>
      ))}
    </>
  );
}

/* =========================================================
   PAYMENTS
   ========================================================= */

function PaymentsView({ items }: { items: GenericRecord[] }) {
  if (items.length === 0) {
    return <Empty text="No payments found" />;
  }

  return (
    <>
      {items.map((payment, index) => (
        <Card key={String(payment.id ?? payment.paymentId ?? index)}>
          <SectionHeader
            title={text(payment.paymentId, "Payment")}
            subtitle={`Transaction: ${text(payment.transactionId)}`}
            status={payment.status}
          />

          <DetailGrid>
            <Detail title="Amount" value={money(payment.amount)} />

            <Detail title="Currency" value={text(payment.currency)} />

            <Detail title="Provider" value={label(text(payment.provider))} />

            <Detail
              title="Provider Order ID"
              value={text(payment.providerOrderId)}
            />

            <Detail
              title="Provider Payment ID"
              value={text(payment.providerPaymentId)}
            />

            <Detail title="Created" value={dateTime(payment.createdAt)} />

            <Detail title="Last Updated" value={dateTime(payment.updatedAt)} />
          </DetailGrid>
        </Card>
      ))}
    </>
  );
}

/* =========================================================
   AUDIT
   ========================================================= */

function AuditView({ items }: { items: GenericRecord[] }) {
  if (items.length === 0) {
    return <Empty text="No audit records found" />;
  }

  return (
    <>
      {items.map((audit, index) => {
        const metadata =
          audit.metadata &&
          typeof audit.metadata === "object" &&
          !Array.isArray(audit.metadata)
            ? (audit.metadata as GenericRecord)
            : {};

        const metadataEntries = Object.entries(metadata);

        return (
          <Card key={String(audit.id ?? index)}>
            <SectionHeader
              title={label(text(audit.action, "Activity"))}
              subtitle={`${label(text(audit.entityType, "Entity"))} activity`}
              status={audit.newStatus}
            />

            <DetailGrid>
              <Detail
                title="Entity Type"
                value={label(text(audit.entityType))}
              />

              <Detail title="Entity ID" value={shortId(audit.entityId)} />

              <Detail title="Actor ID" value={shortId(audit.actorId)} />

              <Detail
                title="Previous Status"
                value={
                  audit.previousStatus ? (
                    <Status value={String(audit.previousStatus)} />
                  ) : (
                    "—"
                  )
                }
              />

              <Detail
                title="New Status"
                value={
                  audit.newStatus ? (
                    <Status value={String(audit.newStatus)} />
                  ) : (
                    "—"
                  )
                }
              />

              <Detail title="Date & Time" value={dateTime(audit.createdAt)} />
            </DetailGrid>

            {metadataEntries.length > 0 && (
              <details
                style={{
                  marginTop: 20,
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#0b5b47",
                  }}
                >
                  Activity Metadata
                </summary>

                <DetailGrid>
                  {metadataEntries.map(([key, value]) => (
                    <Detail
                      key={key}
                      title={label(key)}
                      value={
                        typeof value === "object"
                          ? JSON.stringify(value)
                          : text(value)
                      }
                    />
                  ))}
                </DetailGrid>
              </details>
            )}
          </Card>
        );
      })}
    </>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function SettingsView({ items }: { items: GenericRecord[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <SectionHeader
          title="Platform Settings"
          subtitle="No configurable settings are currently available."
        />

        <p
          style={{
            marginTop: 18,
            color: "#657a70",
          }}
        >
          Runtime configuration is currently managed by the backend environment.
        </p>
      </Card>
    );
  }

  return (
    <>
      {items.map((setting, index) => (
        <Card key={String(setting.id ?? index)}>
          <SectionHeader
            title={text(
              setting.name ?? setting.key ?? setting.code,
              `Setting ${index + 1}`,
            )}
          />

          <DetailGrid>
            {Object.entries(setting)
              .filter(([key]) => key !== "id" && key !== "_class")
              .map(([key, value]) => (
                <Detail
                  key={key}
                  title={label(key)}
                  value={
                    typeof value === "object"
                      ? JSON.stringify(value)
                      : text(value)
                  }
                />
              ))}
          </DetailGrid>
        </Card>
      ))}
    </>
  );
}

/* =========================================================
   MATERIALS
   ========================================================= */

function Materials({ items }: { items: MaterialItem[] }) {
  const [code, setCode] = useState("");

  const [adding, setAdding] = useState(false);

  async function add() {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      window.alert("Enter category code.");
      return;
    }

    setAdding(true);

    try {
      await api.post("/materials", {
        code: normalizedCode,
        names: {
          hi: normalizedCode,
          mr: normalizedCode,
          mwr: normalizedCode,
        },
        units: ["kg", "piece"],
        active: true,
      });

      window.location.reload();
    } catch (error) {
      console.error("Material creation failed:", error);

      window.alert("Unable to add material category.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <Card>
        <h3
          style={{
            marginTop: 0,
            color: "#073c30",
          }}
        >
          Add Material Category
        </h3>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="New category code"
            value={code}
            disabled={adding}
            onChange={(event) => setCode(event.target.value)}
          />

          <Button onClick={() => void add()}>
            {adding ? "Adding..." : "Add Category"}
          </Button>
        </div>
      </Card>

      {items.length > 0 ? (
        items.map((material) => (
          <Card key={material.id}>
            <SectionHeader
              title={material.code}
              subtitle={
                Object.values(material.names ?? {}).join(" / ") ||
                "Material category"
              }
              status={material.active ? "ACTIVE" : "INACTIVE"}
            />
          </Card>
        ))
      ) : (
        <Empty text="No materials found" />
      )}
    </>
  );
}
