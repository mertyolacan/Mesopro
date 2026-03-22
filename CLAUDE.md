# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MesoPro** is a full-stack Turkish e-commerce platform for mesotherapy (professional skincare) products targeting clinics and doctors. UI text and comments are primarily in Turkish.

## Commands

```bash
# Development (runs Express API on :3001 + Vite frontend on :3000 concurrently)
npm run dev

# Frontend only
npm run client

# Backend only (tsx watch mode)
npm run server

# Type-check (no emit) — used as lint
npm run lint

# Production build
npm run build
```

There is no automated test runner. `tests/security_test.ts` contains manual integration tests.

## Architecture

### Request Flow
```
React (Vite :3000) → src/api.ts → Express (server.ts :3001) → PostgreSQL
                                                              → Cloudinary (images)
                                                              → Nodemailer (email)
                                                              → Google Gemini API (AI features)
```

Vite dev server proxies `/api/*` → `localhost:3001`.

### Frontend (`src/`)

- **App.tsx** — Router root. Wraps app in `AuthProvider → FavoritesProvider → CartProvider`. Uses `React.lazy` for route-level code splitting. Manages light/dark theme via localStorage.
- **api.ts** — Centralized API client. GET requests are memoized (2000ms cache). Attaches JWT from localStorage.
- **AuthContext.tsx** — User authentication state (JWT, user info, admin vs user roles).
- **CartContext.tsx** — Cart state plus all campaign/discount logic (volume discounts, BOGO, coupon codes).
- **FavoritesContext.tsx** — User favorites with server sync.
- **Admin.tsx** — Single large component (~1950 lines) managing products, orders, campaigns, categories, brands, messages, and media.

### Backend (`server.ts`)

Single-file Express server (~55K) with:
- PostgreSQL connection pool (`pg`)
- JWT auth (7d for users, 24h for admin) with role-based middleware
- Rate limiting: 10 auth attempts/15min, 5 orders/hour
- Helmet + CORS whitelist
- Multer + Cloudinary for image uploads
- Nodemailer for password reset emails
- Parameterized SQL queries throughout (no ORM)

### Database Tables
`users`, `products`, `orders`, `campaigns`, `favorites`, `categories`, `brands`, `messages`, `media`, `password_resets`

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini AI (product descriptions) |
| `APP_URL` | Backend hosting URL |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email for password reset |
| `FRONTEND_URL` | For CORS whitelist |

PostgreSQL connection is also configured via env vars (not shown in `.env.example` — check `server.ts` pool config).

## Key Patterns

- **Path alias**: `@/` maps to the repo root (configured in both `tsconfig.json` and `vite.config.ts`)
- **Dual auth flows**: Admin login (`/auth/login`) returns a different JWT than user login (`/auth/user-login`); middleware differentiates via `role` claim
- **Campaign types** in `CartContext.tsx`: volume-based, cart-total threshold, BOGO, and coupon-code discounts are all computed client-side from campaign data fetched from the server
