# Pydah Stationery Management

[![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20First-1C4ED8)](https://web.dev/progressive-web-apps/)

An offline-first stationery inventory and student issuance platform built for the Pydah Group of Institutions. The system combines a React/Vite PWA frontend with an Express/MongoDB backend to deliver fast, reliable operations across admissions, stock management, transactions, and reporting—even without internet connectivity.

---

## ✨ Highlights - checking


- **Offline-first PWA** with precached shell, background sync queues for transactions, and graceful fallbacks for all major views.
- **Role-aware dashboard** surfacing student, stock, and revenue insights with quick actions.
- **Student lifecycle tools** for admissions, bulk imports, dashboards, and issuance tracking.
- **Inventory control** covering product kits, set composition, vendor management, stock entries, low-stock indicators, and historical pricing.
- **Transaction engine** with receipt printing, PDF export, student-item locking, and offline queueing with automatic sync.
- **Sub-admin governance** supporting fine-grained permission sets and centralized settings management.

---

## 🧭 Table of Contents

1. [Project Structure](#-project-structure)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Getting Started](#-getting-started)
5. [Environment Configuration](#-environment-configuration)
6. [Available Scripts](#-available-scripts)
7. [Offline & PWA Behaviors](#-offline--pwa-behaviors)
8. [Data Flow Overview](#-data-flow-overview)
9. [Testing & Quality](#-testing--quality)
10. [Deployment Notes](#-deployment-notes)
11. [Roadmap Ideas](#-roadmap-ideas)

---

## 🗂 Project Structure

```
.
├── backend/
│   ├── controllers/        # Business logic for users, products, transactions, etc.
│   ├── models/             # Mongoose schemas (User, Product, SubAdmin, Vendor, ...)
│   ├── routes/             # Express routers wiring endpoints
│   ├── scripts/            # Seeders (products, vendors, students, super admin)
│   ├── config/db.js        # Connection + course-specific DB helper
│   └── server.js           # Express bootstrap and middleware
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # React page-level components (Dashboard, StudentDetail, ...)
│   │   ├── components/     # Shared components (ProtectedRoute, Sidebar, ...)
│   │   ├── hooks/          # Custom hooks (useOnlineStatus)
│   │   ├── utils/          # API helpers, storage helpers
│   │   └── main.jsx        # App entry with Router + PWA registration
│   ├── public/             # Static assets + offline fallback
│   ├── vite.config.js      # Vite & PWA plugin config
│   └── package.json
│
├── README.md               # You are here
└── new_updates.md          # Project notes/changelog (if maintained)
```

---

## 🛠 Key Features

### Frontend
- **Smart authentication**: consumes sub-admin login API, caches auth token, supports offline relaunch straight into the app.
- **Responsive layout**: adaptive sidebar, mobile-friendly dashboards, collapsible navigation.
- **Role-based access**: `ProtectedRoute` and sidebar filters respect super-admin vs sub-admin permissions.
- **Student tooling**:
  - Add, edit, delete, and bulk-import students from CSV/XLSX.
  - Student detail view highlights issued/pending kits, add-on items, and full transaction history.
  - Student dashboard with filtering, metrics, and quick delete actions.
- **Inventory management**:
  - Manage single products and bundled sets (kits) with set composition.
  - Vendor CRUD, stock entry logging, low-stock warnings.
  - Background refresh when transactions impact stock.
- **Transactions & receipts**:
  - Point-of-sale style issuance modal with receipt preview, PDF export, and print hooks.
  - Offline transaction queue retains pending operations, syncs on reconnect, deduplicates once server confirms.
- **Settings & branding**:
  - Institution headers configurable via backend settings endpoint.
  - Branding data reused on login screen and receipt output.

### Backend
- **Express API** with routed modules for users, products, vendors, settings, transactions, stock entries, academic config, and sub-admins.
- **MongoDB models** using Mongoose with built-in hooks (e.g., password hashing).
- **Course-aware data** via `getCourseConnection` to support campus or program segregation if needed.
- **Seeder scripts** to bootstrap demo data (super admin, students, products, vendors).
- **Robust error handling** pipeline with consistent JSON responses.

---

## 🧱 Tech Stack

| Layer        | Technology                                                   |
|--------------|--------------------------------------------------------------|
| Frontend     | React 19, Vite 5/7, React Router 6, Lucide Icons, Tailwind   |
| PWA          | `vite-plugin-pwa`, Workbox runtime caching & background sync |
| Backend      | Node.js, Express, express-async-handler                      |
| Database     | MongoDB with Mongoose                                        |
| Utilities    | XLSX import, HTML-to-canvas, jsPDF for receipts              |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ recommended
- MongoDB instance (local or Atlas)

### 1. Clone repository
```bash
git clone <repo-url>
cd STATIONARY-MANAGEMENT
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in another shell)
cd ../frontend
npm install
```

### 3. Configure environment

Create `.env` files with the values described below.

#### Backend `.env`
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster/myDatabase
```

#### Frontend `.env` (optional overrides)
```
VITE_API_BASE_URL=https://your-backend-domain.com
```

### 4. Run in development mode

```bash
# backend
cd backend
npm run dev   # or npm start if nodemon not configured

# frontend
cd ../frontend
npm run dev
```

Frontend runs on Vite’s default port (5173). API requests will proxy to the backend through the configured URL or local dev server.

---

## 🧪 Available Scripts

| Location  | Script          | Description                                |
|-----------|-----------------|--------------------------------------------|
| backend   | `npm run dev`   | Start Express server (consider nodemon)    |
| backend   | `npm start`     | Start server without hot reload            |
| frontend  | `npm run dev`   | Start Vite dev server                      |
| frontend  | `npm run build` | Generate production build + service worker |
| frontend  | `npm run preview` | Preview production build locally         |
| frontend  | `npm run lint`  | Run ESLint (React + Hooks rules)           |

---

## 📡 Offline & PWA Behaviors

- **Precache**: App shell, CSS, JS bundles, fonts, key icons, and `offline.html` are precached via Workbox.
- **Runtime caching**:
  - GET `/api/**` → `NetworkFirst` with cache fallback.
  - POST/PUT/DELETE → `NetworkOnly` with Background Sync queues (`api-post-queue`, etc.).
  - App assets → `StaleWhileRevalidate`.
- **Background Sync**:
  - Failed transactions queue and sync automatically once a connection returns.
  - Pending entries surface in Student detail history with a “Sync Pending” badge until confirmed.
- **Offline banner**:
  - Top-center pill on every page reminding users that edits will sync once reconnected.
- **Login persistence**:
  - Stores `authToken` and `currentUser`. On load—even offline—the app checks local storage and rehydrates session.
- **Offline fallback page (`offline.html`)**:
  - Clean top-pill layout encouraging users to retry connection.

---

## 🔄 Data Flow Overview

1. **Auth**: Sub-admin logs in → `authToken` (or fallback) saved locally → routes unlocked based on role & permissions.
2. **Students**: Managed via `/api/users` endpoints. Cached locally to drive offline dashboards.
3. **Products & Stock**: `/api/products`, `/api/vendors`, `/api/stock-entries`. Issuance triggers stock refresh.
4. **Transactions**:
   - StudentReceipt modal posts to `/api/transactions`.
   - Offline mode enqueues payload, updates UI optimistically, and prints placeholder receipt.
   - Upon sync, queue item is removed and history deduplicates using normalized signatures.
5. **Settings**: `/api/settings` drives branding (headers) on login and receipts.

---

## ✅ Testing & Quality

- **ESLint** with React + Hooks plugin (run `npm run lint` in frontend).
- **Manual smoke tests**:
  - Add/edit/delete students.
  - Issue transactions online and offline (verify queue + dedupe).
  - Manage stock and vendors.
  - Update settings branding and confirm login/receipt updates.
- **Recommended additions** (not yet implemented):
  - Jest/Testing Library coverage for hooks and components.
  - Cypress end-to-end flows for offline/online transitions.
  - Super admin invite/update flows.

---

## 🌐 Deployment Notes

- **Frontend**:
  - Run `npm run build` to produce static assets + `dist/` service worker.
  - Deploy to static host (Vercel, Netlify, S3, etc.) ensuring service worker files served with correct MIME types.
- **Backend**:
  - Deploy to Node-compatible host (Heroku, Render, Railway) or containerize.
  - Ensure `MONGO_URI` is set and accessible from the host.
- **CORS**:
  - `backend/server.js` whitelists production frontend URLs. Update `allowedOrigins` as needed.
- **Environment Sync**:
  - For production builds, set `VITE_API_BASE_URL` so the PWA knows the live API URL.

---

## 🧭 Roadmap Ideas

- Role-based audit logs & recent activity feed.
- Two-factor or token-based authentication for sub-admins.
- Push notifications for low-stock thresholds.
- Dedicated analytics dashboard (weekly issuance trends, course comparisons).
- App-wide internationalization (i18n) support.
- Automated testing pipeline (CI) with lint + unit/E2E coverage.

---

## 🤝 Contributing

1. Fork and clone the repository.
2. Create a feature branch (`git checkout -b feature/cool-idea`).
3. Make changes with linting (`npm run lint`) and builds passing.
4. Commit with conventional messages.
5. Open a pull request with context, screenshots, and test notes.

---

## 📬 Support

Have feedback, found a bug, or want to suggest an enhancement?  
Open an issue or reach out to the maintainers through your preferred channel.

Let’s keep the stationery hub fast, reliable, and delightfully offline-first! ✨

