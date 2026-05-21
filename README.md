# JokerFashion

JokerFashion är en modern modebutik byggd som en statisk frontend med en serverless API-endpoint för att skicka beställningar via Resend.

## Innehåll

- startsida med kategorier och utvalda produkter
- separata kategorisidor för dam, herr och barn
- varukorg med localStorage
- orderformulär med fältvis validering
- serverless endpoint för mejlutskick via Resend

## Filer

- `index.html` – startsida och orderflöde
- `dam.html` – kategori för dam
- `herr.html` – kategori för herr
- `barn.html` – kategori för barn
- `style.css` – all styling
- `script.js` – varukorg, formulär och validering
- `api/send-order.js` – serverless funktion för att skicka beställning via Resend
- `CNAME` – anpassad domän för publicering

## Miljövariabler

Följande miljövariabler måste finnas i din deploymiljö (t.ex. Vercel):

- `RESEND_API_KEY` – din API-nyckel från [resend.com](https://resend.com)
- `ORDER_FROM_EMAIL` – avsändaradress som är verifierad i Resend (t.ex. `orders@dindoman.se`)
- `ORDER_TO_EMAIL` – mottagaradress dit beställningar ska skickas (t.ex. `info@jokerfashion.se`)

## Ordermejl

När en order skickas postar frontend orderdata till `api/send-order.js`.
Serverless-funktionen skickar sedan ett vanligt ordermejl via **Resend**.

Resend kräver att avsändaradressen (`ORDER_FROM_EMAIL`) är kopplad till en verifierad domän i Resend-dashboarden.
Se [resend.com/docs](https://resend.com/docs) för hur du verifierar din domän.

## Deploy

För att `api/send-order.js` ska fungera behöver projektet deployas på en plattform som stödjer serverless functions, till exempel Vercel.

## Testchecklista

1. Lägg till produkter i varukorgen.
2. Ladda om sidan och kontrollera att varukorgen ligger kvar.
3. Fyll i formuläret och kontrollera att uppgifter sparas lokalt.
4. Testa ogiltig e-post, telefon och postnummer.
5. Skicka beställningen live efter att miljövariablerna är satta.
