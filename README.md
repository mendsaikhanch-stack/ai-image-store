# Atelier — Licensed AI Image Store

A curated premium marketplace for AI-generated image packs sold under
clear commercial-use licenses. Built with Next.js App Router, TypeScript,
Tailwind, Prisma, and PostgreSQL.

> **Status:** Phases 1–3 complete. Bulk import, admin CRUD, secure
> downloads, and middleware-based admin guards are all live.

---

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS 3
- Prisma ORM + PostgreSQL
- Lightweight auth: `bcryptjs` + `jose` JWT in httpOnly cookie (`USER` / `ADMIN`)
- `middleware.ts` for edge-side admin guard (jose-only, no Prisma)
- Payments: mock provider abstraction (Stripe / QPay drop-in later)
- Image pipeline: `sharp` (previews) + `adm-zip` (extraction) + sha256 dedup
- Pluggable vision provider (heuristic default, Claude stub)
- Pluggable watermark provider (no-op default, seam for Phase 4)

## Seed credentials

| Role  | Email                 | Password |
|-------|-----------------------|----------|
| Admin | `admin@atelier.dev`   | `admin123` |
| User  | `user@atelier.dev`    | `user123`  |

## Folder structure

```
app/
  (public)               /, /shop, /shop/[slug], /categories/[slug],
                         /bundles, /license, /cart, /checkout
  account/               profile, orders, downloads
  admin/                 dashboard, products, orders, categories, licenses,
                         import, import/review, abuse-reports
  api/
    admin/import         POST — bulk upload route handler
    downloads/[token]    GET — secure token-verified file download

components/
  ui/                    Button, Input, Select, Card, Badge, Alert, EmptyState
  layout/                Header, Footer
  product/               ProductCard, PurchasePanel
  shop/                  ShopFilters
  admin/                 ImportUploader, ReviewQueue, ReviewCard,
                         ProductEditForm, LicenseEditor, CreateCategoryForm
  auth/                  LoginForm, RegisterForm
  checkout/              CheckoutForm
  account/               DownloadButton

lib/
  prisma.ts              client singleton
  auth.ts                password hashing + JWT signing
  session.ts             getSession, requireUser, requireAdmin, requireAdminOrRedirect
  cart.ts                cookie cart
  licensePrice.ts        price resolver
  validation.ts          shared zod schemas
  hash.ts                sha256 hex
  storage.ts             disk paths + sanitizer (local today, S3 seam later)
  vision/                VisionProvider interface + heuristic + anthropic stub
  watermark/             WatermarkProvider interface + noopWatermark
  import/                filenameParser, zip, pipeline
  payments/              PaymentProvider interface + mock
  actions/
    auth.ts              login, register, logout
    cart.ts              add, remove, clear
    checkout.ts          placeOrder (mock provider + create Downloads)
    import.ts            upload helpers, approve/reject/update/merge/bulk
    product.ts           update/publish/archive/delete/image-reorder/license-overrides
    licenses.ts          update license tiers
    categories.ts        create/update categories
    downloads.ts         createDownloadToken

middleware.ts            edge-side /admin/* guard

prisma/
  schema.prisma          all models
  seed.ts                sample data
  migrations/            applied migrations

scripts/
  make-test-zip.mjs      generates sample-import.zip + dup-test.zip fixtures
  make-user-test-zip.mjs generates test-assets.zip (user-requested layout)
  mint-admin-cookie.mjs  mints an admin session cookie for e2e tests
  inspect-import.mjs     dumps the most recent import batch for debugging
```

---

## Setup (Windows PowerShell)

### 1. Start PostgreSQL

Docker is the easiest path:

```powershell
docker run -d --name ai-image-store-db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=ai_image_store `
  -p 5432:5432 `
  postgres:16
```

Or install Postgres natively and create a database named `ai_image_store`
owned by `postgres` / `postgres`.

Or paste a cloud URL (Neon, Supabase, Railway) into `DATABASE_URL` in `.env`.

### 2. Install and configure

```powershell
cd C:\Users\MNG\projects\ai-image-store
npm install
Copy-Item .env.example .env
```

Open `.env` and set:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_image_store?schema=public"
AUTH_SECRET="<long-random-string>"   # generate with: [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Migrate + seed

```powershell
npx prisma generate
npm run db:migrate
npm run db:seed
```

### 4. Run

```powershell
npm run dev
```

Open http://localhost:3000 (Next will pick 3001 if 3000 is taken).

---

## The full flow — import → review → edit → publish → purchase → download

### Bulk import

1. Sign in as `admin@atelier.dev` / `admin123`
2. Visit `/admin/import`
3. Pick **Zip archive** mode, upload `test-fixtures/test-assets.zip`
   (generate it with `node scripts/make-user-test-zip.mjs` if it doesn't
   exist yet)
4. The pipeline extracts, hashes, previews, and creates `ImportCandidate`
   rows grouped by leaf directory
5. The green summary panel shows: **Total files / Imported / Skipped /
   Duplicates / Drafted**

### Review

1. Click **Open review queue →** or visit `/admin/import/review`
2. Each candidate shows preview, suggested title/description/category/tags,
   confidence %, duplicate flag, batch metadata, and source path
3. Actions per card: **Edit**, **Approve**, **Reject**, **Merge into existing…**
4. Bulk actions: **Approve N safe** (skips duplicates automatically),
   **Reject N**

### Edit and publish (Phase 3)

1. Approve a candidate → becomes a `Product` with `status: DRAFT, isActive: false`
2. Visit `/admin/products?status=DRAFT`
3. Click the draft product → full edit form: title / slug / description /
   category / tags / base price / flags / license pricing overrides /
   preview image ordering
4. Click **Publish** → status flips to `ACTIVE`, the product appears in
   `/shop` and `/`
5. Alternatively: **Archive** (for published products) or **Delete draft**
   (draft only — published products can't be hard-deleted, archive instead)

### Purchase

1. Sign out, sign in as `user@atelier.dev` / `user123`
2. Browse `/shop`, click a product, pick a license in the purchase panel,
   click **Add to cart**
3. `/cart` → **Proceed to checkout**
4. `/checkout` → **Confirm order** — the mock payment provider always
   succeeds. The order is marked PAID, `Download` entitlements are created,
   and the cart is cleared
5. Redirected to `/account/downloads?success=1`

### Secure download

1. On `/account/downloads`, each entitlement has a **Download** button
2. Click it — this calls `createDownloadTokenAction`, which:
   - Validates the entitlement belongs to the current user
   - Checks the order status is `PAID`
   - Checks `usedCount < maxCount`
   - Creates a short-lived `DownloadToken` (10 min TTL)
   - Returns the URL `/api/downloads/<token>`
3. The client navigates to that URL, triggering the route handler
4. The handler re-validates (token match, user match, order PAID, not
   expired, not already used, under the download limit), loads the source
   file from `storage/source/...`, runs it through `WatermarkProvider.embed()`
   (no-op today), atomically increments `usedCount` + marks the token used
   + writes an `AuditLog` entry, then streams the bytes with
   `Content-Disposition: attachment`
5. Source files are **never** served from `/public` — the download route
   is the only path to them. Preview images under `/public/previews/` are
   public by design.

> **Seed data caveat:** seeded products use placeholder `sourcePath`
> values that don't exist on disk. The first real end-to-end download
> test is: import the test zip → approve a candidate → buy the new
> product → download it. Those sources actually exist under
> `storage/source/imports/<batchId>/...`.

---

## Environment variables

```
DATABASE_URL            # Postgres connection string
AUTH_SECRET             # 32+ char random, used for session JWT

NEXT_PUBLIC_APP_URL     # http://localhost:3000 for dev

STORAGE_SOURCE_DIR      # default ./storage/source — paid files, never public
STORAGE_PREVIEW_DIR     # default ./public/previews — public webp previews

PAYMENT_PROVIDER        # "mock" | "stripe" | "qpay" (only mock implemented)

VISION_PROVIDER         # "heuristic" (default) | "anthropic" (stub)
# ANTHROPIC_API_KEY     # required if VISION_PROVIDER=anthropic
```

---

## Route map

**Public:** `/`, `/shop`, `/shop/[slug]`, `/categories/[slug]`, `/bundles`,
`/license`, `/cart`, `/checkout`, `/login`, `/register`

**Account:** `/account`, `/account/downloads`

**Admin:** `/admin`, `/admin/products`, `/admin/products/[id]/edit`,
`/admin/orders`, `/admin/categories`, `/admin/licenses`,
`/admin/import`, `/admin/import/review`, `/admin/abuse-reports`

**API:** `POST /api/admin/import`, `GET /api/downloads/[token]`

---

## Scripts

```powershell
npm run dev            # dev server
npm run build          # production build
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm run db:generate    # prisma generate
npm run db:migrate     # prisma migrate dev
npm run db:seed        # prisma seed
npm run db:studio      # prisma studio

node scripts/make-test-zip.mjs          # builds sample-import.zip + dup-test.zip
node scripts/make-user-test-zip.mjs     # builds test-assets.zip
```

---

## Where to plug in Phase 4+

- **Stripe / QPay**: implement `PaymentProvider` in `lib/payments/`, register in `index.ts`
- **Invisible watermark**: implement `WatermarkProvider` in `lib/watermark/`. The download route already calls `embed()` — swap the implementation and every paid download fingerprints automatically
- **Claude vision classifier**: fill in `lib/vision/anthropic.ts`, set `VISION_PROVIDER=anthropic`
- **Subscriptions / membership**: extend `User` with a membership table and gate downloads on membership status in `createDownloadTokenAction`
- **Background import jobs**: `processImport()` in `lib/import/pipeline.ts` is structured to drop into a worker queue (BullMQ / Inngest). The route handler becomes a thin enqueuer
- **S3 / GCS storage**: replace disk ops in `lib/storage.ts` + the download route's `readFile()`
- **SEO / blog pages**: add under `app/(marketing)/` with a Prisma-backed Post model
