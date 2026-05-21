# JokerFashion

JokerFashion är i **Rebuild Phase 2**: backend/API-lager för riktig datalagring av admin-hanterat innehåll.

## Vad som är nytt i Phase 2

- **Riktig backend-persistence** via Vercel KV (Upstash Redis)
- **REST API-endpoints** för produkter, kategorier och butiksinställningar
- Admin-CRUD går nu via riktiga API-anrop – inte längre bara localStorage
- Produkter och kategorier skapade via adminpanelen överlever sessioner och enheter
- Storefront (katalog, startsida, produktsida) hämtar data via API och faller tillbaka på bas-data vid fel

## API-endpoints

> **Vercel Hobby plan**: Deployed serverless function count = **11** (≤ 12 limit ✓)

| Metod | Endpoint | Funktion |
|-------|----------|----------|
| GET | `/api/products` | Lista adminprodukter |
| POST | `/api/products` | Skapa produkt |
| GET | `/api/products/:id` | Hämta produkt |
| PUT | `/api/products/:id` | Uppdatera produkt |
| DELETE | `/api/products/:id` | Ta bort produkt |
| GET | `/api/categories` | Lista adminkategorier |
| POST | `/api/categories` | Skapa kategori |
| GET | `/api/categories/:id` | Hämta kategori |
| PUT | `/api/categories/:id` | Uppdatera kategori |
| DELETE | `/api/categories/:id` | Ta bort kategori |
| GET | `/api/settings` | Hämta butiksinställningar (publik läsning för storefront + admin) |
| PUT | `/api/settings` | Uppdatera butiksinställningar |
| GET | `/api/content/home` | Hämta publicerat startsideinnehåll |
| PUT | `/api/content/home` | Uppdatera startsideinnehåll (admin) |
| GET | `/api/admin/auth` | Validera aktuell admin-session |
| POST | `/api/admin/auth` `{ action: "login" }` | Admin-inloggning (sätter sessionscookie) |
| POST | `/api/admin/auth` `{ action: "logout" }` | Admin-utloggning (raderar sessionscookie) |
| POST | `/api/admin/media-upload` | Skyddad bilduppladdning (Cloudinary) |
| GET | `/api/admin/orders` | Lista persisterade ordrar (admin) |
| GET | `/api/admin/orders/:id` | Hämta orderdetaljer (admin) |
| PATCH | `/api/admin/orders/:id` | Uppdatera orderstatus (admin) |
| POST | `/api/send-order` | Skapa och persistera order + försöker skicka ordermail |

### Konsolidering (Vercel Hobby-plan)

`/api/admin/login`, `/api/admin/logout` och `/api/admin/session` har slagits samman till ett enda endpoint `/api/admin/auth` för att hålla serverless-function-antalet under Vercel Hobby-planens gräns på 12.

## Appstruktur (Phase 2)

- `index.html` – Joker-themed landningssida
- `catalog.html` – kategoribaserad browsing (API-backed)
- `checkout.html` – kundvagn + checkout
- `account.html` – scaffold för konto/login-flöden
- `admin.html` – adminpanel med API-backed CRUD
- `admin-login.html` – admininloggning för skyddad panelåtkomst
- `product.html` – produktdetaljsida
- `app/main.js` – page-bootstrap per route (hanterar async init)
- `app/pages/*` – sidinitiering per route (alla async)
- `app/components/renderers.js` – återanvändbara UI-renderers
- `app/data/catalog.js` – bas-kategorier + seed-produkter (statisk fallback)
- `app/data/home-content.js` – default/saniterat CMS-innehåll för startsidan
- `app/state/store.js` – API-klient för admin/catalog; localStorage för cart/checkout/session
- `app/styles/app.css` – Joker design tokens + layout primitives
- `api/_kv.js` – Vercel KV REST API-helper (pipeline-baserad)
- `api/products.js` – produkter list + create
- `api/products/[id].js` – produkt get/update/delete
- `api/categories.js` – kategorier list + create
- `api/categories/[id].js` – kategori get/update/delete
- `api/settings.js` – butiksinställningar get + update
- `api/content/home.js` – publikt homepage-CMS get + adminskyddad update
- `api/_auth.js` – server-side admin-auth helper (credentials + sessionscookie)
- `api/admin/auth.js` – konsoliderat admin-auth endpoint (session/login/logout)
- `api/admin/media-upload.js` – skyddad bilduppladdning via Cloudinary
- `api/admin/orders.js` – admin orderlistning (autentiserad)
- `api/admin/orders/[id].js` – admin orderdetalj + statusuppdatering

## Persistence-arkitektur

```
Admin-panel (admin.html)
  └─→ app/state/store.js (async API-klient)
        └─→ /api/products, /api/categories, /api/settings  (Vercel serverless)
              └─→ Vercel KV (Upstash Redis) ← riktig persistence

Storefront (catalog.html, index.html, product.html)
  └─→ app/state/store.js (async, graceful fallback)
        ├─→ /api/products → mergas med bas-produkter
        ├─→ /api/content/home → mergas med default homepage content
        └─→ vid fel: visar bara bas-produkter (ingen blackout)

Varukorg / Checkout / Session
  └─→ localStorage (client-side, oförändrat)
```

## Sätt upp Vercel KV (krävs för persistence)

1. Öppna [Vercel Dashboard](https://vercel.com/dashboard)
2. Gå till **Storage** → **Create Database** → välj **KV**
3. Anslut databasen till ditt project via **Connect to Project**
4. Vercel sätter automatiskt `KV_REST_API_URL` och `KV_REST_API_TOKEN` i din deploy-miljö

Utan dessa variabler:
- GET-endpoints returnerar tomma arrayer (inga adminprodukter)
- POST/PUT/DELETE returnerar `503 Storage not configured`
- Storefront och adminpanel fungerar fortfarande (med bas-data)

## Miljövariabler

### Beställnings-API (befintlig)
- `RESEND_API_KEY`
- `ORDER_FROM_EMAIL`
- `ORDER_TO_EMAIL`

### Persistence (ny i Phase 2)
- `KV_REST_API_URL` – sätts automatiskt av Vercel KV
- `KV_REST_API_TOKEN` – sätts automatiskt av Vercel KV

### Admin-auth (ny i detta steg)
- `ADMIN_USERNAME` – admin-användarnamn (t.ex. `admin`)
- `ADMIN_PASSWORD` – starkt unikt admin-lösenord
- `ADMIN_AUTH_SECRET` – lång slumpmässig signeringshemlighet för sessionscookies

### Media upload (ny i detta steg)
- `CLOUDINARY_CLOUD_NAME` – Cloudinary cloud name
- `CLOUDINARY_API_KEY` – Cloudinary API-nyckel
- `CLOUDINARY_API_SECRET` – Cloudinary API-hemlighet
- `CLOUDINARY_UPLOAD_FOLDER` (valfritt) – standardmapp för uppladdningar (default: `jokerfashion/admin`)

## Kvar före DNS/live (pre-launch gaps)

1. **Admin orderhantering** – ordrar persisteras nu i KV men adminvy/statusflöden för hantering byggs i nästa steg
2. **Rikare homepage-CMS** – hero/highlight/rubriker/CTA är dynamiska, men fler block/ordning/fler homepage-bilder kan fortfarande byggas ut senare

## Homepage CMS (detta PR-steg)

- Ny skyddad CMS-yta i `admin.html` för startsidans viktigaste marketing-block.
- Admin kan nu uppdatera:
  - hero-överblick, rubrik, supporting text och båda hero-CTA:erna
  - highlight-/bannerkortets text och två CTA-länkar
  - rubriker/CTA för kategori-, featured- och nyhetssektionerna
  - footerns sammanfattande marketingrad
- `index.html` läser detta dynamiskt via `/api/content/home` och faller tillbaka till säkra defaultvärden om inget är sparat eller API:t inte svarar.
- Kategorikortens bilder fortsätter styras via kategori-adminen och produktgriderna fortsätter läsa riktiga katalog-/adminprodukter.

## Mediahantering i admin (detta PR-steg)

- Produkter: admin kan ladda upp bildfiler (JPG/PNG/WEBP/GIF, max 3 MB), få direkt preview och spara URL automatiskt.
- Kategorier: admin kan ladda upp kategoribild med samma flöde och visa den på startsidans kategorikort.
- URL-fält för bilder finns kvar för bakåtkompatibilitet, men valideras till `http/https`.
- Upload-endpointen är server-side skyddad med admin-session och lagrar bilder via Cloudinary (signerad server-uppladdning).

## Admin-auth och accesskontroll

- `admin.html` är nu gated via server-validerad admin-session (`/api/admin/auth`)
- Obehöriga användare omdirigeras till `admin-login.html`
- Följande admin-endpoints kräver autentiserad adminsessionscookie:
  - `POST /api/products`
  - `GET/PUT/DELETE /api/products/:id`
  - `POST /api/categories`
  - `GET/PUT/DELETE /api/categories/:id`
  - `PUT /api/settings`
  - `PUT /api/content/home`

## Shipping i checkout (detta PR-steg)

- Checkout använder nu sparade `shippingRate` och `freeShippingThreshold` från `/api/settings` som source of truth.
- Kund ser tydlig summering med **subtotal**, **frakt** och **totalt** i checkout.
- Fri-frakt-regeln appliceras automatiskt när subtotal når tröskeln i settings.
- Vid settings-fel används säkra fallback-värden så checkout fortsätter fungera.
- Nästa commerce-steg för MVP är order persistence + admin order management.

## Order persistence i checkout (detta PR-steg)

- Checkout-submission via `POST /api/send-order` skapar nu en riktig orderpost i Vercel KV (`jf:orders`).
- Persisterad order innehåller:
  - `id`, mänsklig `orderReference`, `status` (initialt `pending`), `createdAt`, `updatedAt`
  - `customer` + `shippingAddress`
  - normaliserade `items` (produkt-id, namn, kategori, storlek, antal, enhetspris, radsubtotal)
  - `totals` (subtotal, frakt, total, shipping rate/tröskel, valuta)
- Befintligt mailflöde via Resend behålls: API:t försöker fortfarande skicka notis-mail när konfiguration finns.
- Om mail misslyckas returneras ändå lyckat ordersvar så att ordern förblir durabelt sparad.
- Nästa fas är admin order-view/management (lista ordrar, statusändringar och operativ hantering).

## Migration från Phase 1

Produkter och kategorier skapade i Phase 1 (lagrades i `localStorage` under `jokerfashion-admin-products` / `jokerfashion-admin-categories`) migreras inte automatiskt. Lägg in dem på nytt via adminpanelen när Vercel KV är konfigurerat.

## Lokal verifiering

Det finns ingen test-runner i repot. Kör syntaktisk validering:

```bash
node --check app/main.js
find app -name '*.js' -print0 | xargs -0 -n1 node --check
find api -name '*.js' -print0 | xargs -0 -n1 node --check
```

För att testa API lokalt, kör:
```bash
vercel dev
```
(kräver [Vercel CLI](https://vercel.com/docs/cli) och att Vercel KV-variabler finns i `.env.local`)
