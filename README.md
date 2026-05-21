# JokerFashion

JokerFashion är nu i **Rebuild Phase 1**: första vertikala steget från enkel storefront/orderform till en skalbar e-handelsapplikation med Joker-inspirerad design.

Den senaste vertical slice:en gör även kundflödet funktionellt i den nya arkitekturen med:

- kategoribaserad katalog med rikare produktspotlight
- varukorg i `localStorage`
- checkout-sida som skickar order via befintligt `/api/send-order`

## Vad som ingår i Phase 1

- Joker-inspirerat designsystem (färgtema, typografi, UI-primitiver)
- ny modulär appstruktur (`app/`) för fortsatt utbyggnad
- ny startsida med tydlig e-handelsriktning
- kategoribaserad produktvisning med strukturerad lokal datamodell
- produktkort/grid-komponenter för återanvändning
- produktspotlight med storleksval och add-to-cart
- `checkout.html` för varukorg, orderöversikt och leveransuppgifter
- auth-ready kontostruktur (`account.html`) med sessionscaffold
- admin foundation (`admin.html`) för lokal produkt-draft-hantering

## Appstruktur (foundation)

- `index.html` – ny Joker-themed landningssida
- `catalog.html` – kategoribaserad browsing
- `checkout.html` – kundvagn + checkout i rebuild-UI
- `account.html` – scaffold för konto/login-flöden
- `admin.html` – scaffold för admininnehåll och produktutkast
- `app/main.js` – page-bootstrap per route
- `app/pages/*` – sidinitiering per route
- `app/components/renderers.js` – återanvändbara UI-renderers
- `app/data/catalog.js` – kategorier + seed-produkter
- `app/state/store.js` – lokal state för mock session/admin drafts
- `app/styles/app.css` – Joker design tokens + layout primitives

## Migration från tidigare storefront

Tidigare sidor (`dam.html`, `herr.html`, `barn.html`) och beställnings-API (`api/send-order.js`) ligger kvar för kompatibilitet under ombyggnaden.

Detta gör att vi kan iterera stegvis utan att riva hela lösningen i en enda PR.

## Miljövariabler (beställnings-API)

Följande miljövariabler krävs fortsatt för ordermejl via Resend i `api/send-order.js`:

- `RESEND_API_KEY`
- `ORDER_FROM_EMAIL`
- `ORDER_TO_EMAIL`

## Nästa planerade faser

### Phase 2

- koppla riktig auth-provider (registrering/login/logout)
- införa backend/API-lager för produkter/kategorier
- skydda admin route med rollbaserad access

### Phase 3

- persistent admin CRUD (databas)
- kundkonto med orderhistorik
- checkout/orderflöde i nya arkitekturen

## Lokal verifiering

Det finns ingen test-runner i repot. Kör syntaktisk validering:

```bash
node --check script.js
node --check api/send-order.js
find app -name '*.js' -print0 | xargs -0 -n1 node --check
```
