# Kabadiwala Connect — Smart India Hackathon 2026

**Connect | Verify | Recycle**

Kabadiwala Connect is a fresh React + Spring Boot + MongoDB platform connecting informal e-waste collectors with admin-verified recyclers. The repository contains three role experiences, secure JWT/refresh authentication, OTP provider abstraction, lot/quotation/pickup/handover/payment workflows, notifications, audit logs, file storage abstraction and PDF receipts.

## Architecture

`frontend-final` is a Vite/React/TypeScript SPA. `backend` is Java 21/Spring Boot with Controller → Service → Repository → MongoDB layering. MongoDB database name is `kabadiwala_connect_2026` by default. Critical quotation acceptance uses an atomic MongoDB `findAndModify` predicate so only one quotation can win. Files use local disk in development or S3 in production. SMS uses a development console provider or Twilio. Payments use an explicitly confirmed manual-record provider or Razorpay order/signature integration.

## Technology stack

Frontend: Node 22 LTS-compatible runtime, npm 10+, React 19, Vite 7, TypeScript 5.9, React Router 7, Axios, i18next, Vitest and Playwright. Backend: OpenJDK 21, Spring Boot 3.5.5, Spring Security, Spring Data MongoDB, JWT/JJWT, PDFBox and AWS SDK S3. Database: MongoDB 8 recommended (MongoDB 7 is also suitable).

## Required local development setup

### Mandatory local software

| Tool | Version | Why | Install | Verify |
|---|---|---|---|---|
| Java JDK | **21** | Compiles/runs Spring Boot | Adoptium Temurin 21 or OS JDK 21 package | `java --version` |
| Node.js | **22 LTS** recommended | Builds/runs Vite frontend | nodejs.org installer, `winget install OpenJS.NodeJS.LTS`, or nvm | `node --version` |
| npm | **10+** (bundled with Node) | Frontend dependency manager | Included with Node | `npm --version` |
| MongoDB | **8.0 Community** recommended, or Atlas | Primary database | MongoDB Community installer/package, or create Atlas cluster | `mongosh --version` and `mongosh` |
| Git | 2.4x+ recommended | Source control | git-scm.com / `winget install Git.Git` | `git --version` |

**Maven does not need to be globally installed.** This repository includes `backend/mvnw` and `backend/mvnw.cmd`, which bootstrap Maven 3.9.11 on first use. First wrapper use requires internet access plus `curl`+`tar` on Linux/macOS or PowerShell on Windows. Verify with `./mvnw --version` or `mvnw.cmd --version`. A global Maven 3.9.x installation is optional.

You need either local MongoDB **or** MongoDB Atlas, not both. Atlas requires no local MongoDB server but does require internet access and a valid `MONGODB_URI`.

### Windows setup

Install JDK 21, Node LTS, Git and MongoDB Community with their official installers or Windows Package Manager. PowerShell example: `winget install EclipseAdoptium.Temurin.21.JDK`, `winget install OpenJS.NodeJS.LTS`, `winget install Git.Git`, then install MongoDB Community Server 8 from MongoDB's official Windows MSI. Open a new terminal and verify `java --version`, `node --version`, `npm --version`, `git --version`, and `mongosh --version`. Run Maven through `backend\mvnw.cmd`.

### Linux/macOS setup

Install Temurin/OpenJDK 21, Node 22 (nvm is convenient), Git and MongoDB Community 8 using the official package repositories. On macOS, Homebrew equivalents are acceptable. Verify the same version commands, then use `./backend/mvnw`.

### Optional developer tools

MongoDB Compass (visual DB inspection), IntelliJ IDEA or VS Code (IDE), Postman/Insomnia (manual API testing), and Docker Desktop/Engine + Docker Compose v2 (one-command full stack) are optional. Docker becomes the easiest run method if you do not want local Java/Node/Mongo installations.

## MongoDB setup

Local default URI: `mongodb://localhost:27017/kabadiwala_connect_2026`. The backend enables MongoDB automatic index creation for annotated unique and compound indexes. For Atlas, create a dedicated database user, allow your development IP, copy the driver URI, and set `MONGODB_URI`. Do not point it at an old project's database.

## Environment configuration

Copy `backend/.env.example` values into your shell/IDE run configuration; Spring Boot does not automatically import `.env`. Copy `frontend-final/.env.example` to `frontend-final/.env`.

Backend variables actually consumed by code: `MONGODB_URI`, `JWT_SECRET`, `JWT_ACCESS_EXPIRY_MINUTES`, `JWT_REFRESH_EXPIRY_DAYS`, `CORS_ALLOWED_ORIGINS`, `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `STORAGE_PROVIDER`, `LOCAL_STORAGE_DIR`, `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `PAYMENT_PROVIDER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `BOOTSTRAP_ADMIN_MOBILE`, `BOOTSTRAP_ADMIN_PASSWORD`.

Frontend variables: `VITE_API_BASE_URL` and `VITE_RAZORPAY_KEY_ID` when Razorpay Checkout is enabled. Current location uses the browser Geolocation API and manual-address fallback, so no map credential is required for the implemented flow.

## Frontend installation and run

```bash
cd frontend-final
npm install
npm run dev
```

Open `http://localhost:5173`. Production checks: `npm run lint`, `npm run test`, `npm run build`. Playwright: `npx playwright install chromium` once, then `npm run e2e` while the backend/database are available for full API scenarios.

## Backend installation and run

Linux/macOS:

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

Windows:

```bat
cd backend
mvnw.cmd test
mvnw.cmd spring-boot:run
```

Production package: `./mvnw clean package` (or `mvnw.cmd clean package`). Backend is on `http://localhost:8080`; health endpoint is `/actuator/health`.

## Docker setup

Docker is optional. Copy root `.env.example` to `.env`, set a strong `JWT_SECRET` and optional bootstrap admin credentials, then run `docker compose up --build`. MongoDB is exposed on 27017, backend on 8080, frontend on 3000. Secrets are supplied from environment variables and are not embedded in Compose.

## Authentication and role workflows

Collector registration: language → mobile OTP → details/password → login. Recycler registration follows the same verified-mobile flow and creates a `PENDING_VERIFICATION` recycler profile. Admin accounts are not publicly registrable. To bootstrap the first admin, set `BOOTSTRAP_ADMIN_MOBILE` and `BOOTSTRAP_ADMIN_PASSWORD` only for the first run; after login, remove those environment variables. Passwords and OTPs use BCrypt. Access JWTs are short-lived; opaque refresh tokens are SHA-256 hashed in MongoDB, rotated on refresh, revoked on logout, and all active refresh tokens are revoked after password reset.

Recycler marketplace operations call a server-side `VERIFIED` check. Collector/Recycler/Admin API access also uses Spring Security role guards.

## OTP configuration

`SMS_PROVIDER=development` is intentionally non-production: OTPs are printed to backend logs and returned only by the development provider. For real delivery set `SMS_PROVIDER=twilio`, obtain a Twilio account SID, auth token and SMS-capable sender number, then configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Production must not use the development provider.

## Maps/location

The implemented collector wizard uses `navigator.geolocation` after user permission and always provides manual address entry. Latitude/longitude/address persist with the lot. No third-party map is required for this flow. If a visual Google map is added, obtain a Google Maps Platform project/key and enable Maps JavaScript API; restrict the key to the production frontend origins; only add a frontend environment variable when that renderer is implemented.

## Storage configuration

Development default is `STORAGE_PROVIDER=local` and `LOCAL_STORAGE_DIR=./uploads`. Production S3 support is implemented through AWS SDK: set `STORAGE_PROVIDER=s3`, `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` (or use the AWS default credential chain/IAM role). Accepted uploads are JPG, PNG, WebP and PDF up to 10 MB. MongoDB stores metadata/keys, not large binary files.

## Payment configuration

Default `PAYMENT_PROVIDER=manual` **does not fake a gateway payment**. It creates a payment record and requires an explicit confirmation that settlement happened outside the application. For online payments use `PAYMENT_PROVIDER=razorpay` with `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from a Razorpay account. The backend creates Razorpay orders and verifies the HMAC payment signature. The recycler UI loads Razorpay Checkout only when a Razorpay order is initiated, using `VITE_RAZORPAY_KEY_ID`, then submits Razorpay payment/signature fields to the backend for HMAC verification. No real online payment can be tested without valid sandbox/live credentials.

## Notifications and receipts

In-app notifications persist in MongoDB with read/unread state and mark-one/mark-all APIs. Events include new/accepted quotations, recycler verification, pickup changes, handover, payment and completion. Completed transactions receive a unique receipt ID. `/api/v1/transactions/{transactionId}/receipt.pdf` generates an actual PDF using PDFBox; the collector UI downloads it as an authenticated blob.

## Audit and traceability

Critical authentication, recycler verification, lot, quotation, pickup, handover, payment and transaction actions write audit records containing actor, entity, status changes, timestamp and metadata. Admin has an audit viewer endpoint/screen. Lot documents additionally keep status history.

## Testing

Backend JUnit/Spring Security dependencies are configured under `src/test`. Frontend Vitest component tests and Playwright browser smoke tests are included. Run all available local checks before deployment. A true database/provider E2E test requires MongoDB plus any external provider credentials being exercised.

## Production build

Frontend: `npm run build`, deploy `frontend-final/dist` behind HTTPS. Backend: `./mvnw clean package`, run the generated JAR with production environment variables. Use MongoDB Atlas or a secured replica set, S3/IAM, HTTPS reverse proxy, restricted CORS, a cryptographically random JWT secret, and real SMS/payment providers.

## Render deployment

The root `render.yaml` defines the Spring Boot backend as a Docker web service and the React frontend as a static site. Push the repository to GitHub, then create a Render Blueprint from that repository.

During Blueprint creation, provide `MONGODB_URI`, `CORS_ALLOWED_ORIGINS`, `VITE_API_BASE_URL`, and optional bootstrap-admin values. Deploy the backend first if necessary so its public URL is known. Use `https://<backend-service>.onrender.com/api/v1` for `VITE_API_BASE_URL`, and use the frontend's exact public origin (without a trailing slash) for `CORS_ALLOWED_ORIGINS`. After changing a Vite environment variable, redeploy the frontend because Vite embeds it at build time.

For a demo, `SMS_PROVIDER=development`, `PAYMENT_PROVIDER=manual`, and local storage are usable. Render's local filesystem is ephemeral, so uploaded files do not survive restarts or redeploys; configure S3 for persistent production uploads. Remove the bootstrap-admin variables after the first administrator account has been created.

## Troubleshooting

If Maven Wrapper cannot bootstrap, confirm internet access to Maven Central and `curl`/PowerShell availability, or install Maven 3.9.x globally. If `npm install` stalls, confirm npm registry/network access (`npm config get registry`) and retry; do not remove dependencies arbitrarily. If Mongo connection fails, check `MONGODB_URI`, local service status/Atlas IP allow-list, and credentials. A 403 marketplace response for a recycler normally means admin verification is still pending/suspended. Browser geolocation generally requires HTTPS outside localhost.

## Current external-service boundaries

Twilio, AWS S3 and Razorpay cannot be proven against their live/sandbox systems without user-owned credentials. The repository contains their provider adapters and configuration, but they should be considered **configuration required** until exercised with those credentials. The local storage, development OTP and manual payment-record modes are intended for development, not as claims of real third-party delivery/payment.
