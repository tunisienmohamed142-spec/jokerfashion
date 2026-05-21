# JokerFashion

JokerFashion är i **Rebuild Phase 2**: backend/API-lager för riktig datalagring av admin-hanterat innehåll.

## Vad som är nytt i Phase 2

- **Riktig backend-persistence** via Vercel KV (Upstash Redis)
- **REST API-endpoints** för produkter, kategorier och butiksinställningar
- Admin-CRUD går nu via riktiga API-anrop – inte längre bara localStorage
- Produkter och kategorier skapade via adminpanelen överlever sessioner och enheter
- Storefront (katalog, startsida, produktsida) hämtar data via API och faller tillbaka på bas-data vid fel

## API-endpoints

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
| GET | `/api/settings` | Hämta butiksinställningar |
| PUT | `/api/settings` | Uppdatera butiksinställningar |

## Appstruktur (Phase 2)

- `index.html` – Joker-themed landningssida
- `catalog.html` – kategoribaserad browsing (API-backed)
- `checkout.html` – kundvagn + checkout
- `account.html` – scaffold för konto/login-flöden
- `admin.html` – adminpanel med API-backed CRUD
- `product.html` – produktdetaljsida
- `app/main.js` – page-bootstrap per route (hanterar async init)
- `app/pages/*` – sidinitiering per route (alla async)
- `app/components/renderers.js` – återanvändbara UI-renderers
- `app/data/catalog.js` – bas-kategorier + seed-produkter (statisk fallback)
- `app/state/store.js` – API-klient för admin/catalog; localStorage för cart/checkout/session
- `app/styles/app.css` – Joker design tokens + layout primitives
- `api/_kv.js` – Vercel KV REST API-helper (pipeline-baserad)
- `api/products.js` – produkter list + create
- `api/products/[id].js` – produkt get/update/delete
- `api/categories.js` – kategorier list + create
- `api/categories/[id].js` – kategori get/update/delete
- `api/settings.js` – butiksinställningar get + update

## Persistence-arkitektur

```
Admin-panel (admin.html)
  └─→ app/state/store.js (async API-klient)
        └─→ /api/products, /api/categories, /api/settings  (Vercel serverless)
              └─→ Vercel KV (Upstash Redis) ← riktig persistence

Storefront (catalog.html, index.html, product.html)
  └─→ app/state/store.js (async, graceful fallback)
        ├─→ /api/products → mergas med bas-produkter
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

## Kvar före DNS/live (pre-launch gaps)

1. **Admin-autentisering** – adminpanelen är fortfarande öppen; nästa steg är inloggning + rollbaserad access
2. **Bilduppladdning** – admin anger bild-URL; nästa steg är riktig upload via t.ex. Vercel Blob / Cloudinary
3. **Shipping kopplat till checkout** – fraktkostnader finns i settings men räknas inte in i checkout-totalen ännu
4. **Orderhantering** – ordrar sparas inte i databasen; admin kan inte se inkomna ordrar

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
