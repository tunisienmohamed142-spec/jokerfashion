# JokerFashion

JokerFashion är en modern modebutik byggd som en statisk frontend med en serverless API-endpoint för att skicka beställningar via EmailJS.

## Innehåll

- startsida med kategorier och utvalda produkter
- separata kategorisidor för dam, herr och barn
- varukorg med localStorage
- orderformulär med fältvis validering
- PDF-generering av beställning
- serverless endpoint för mejlutskick via EmailJS

## Filer

- `index.html` – startsida och orderflöde
- `dam.html` – kategori för dam
- `herr.html` – kategori för herr
- `barn.html` – kategori för barn
- `style.css` – all styling
- `script.js` – varukorg, formulär, validering och PDF
- `api/send-order.js` – serverless funktion för att skicka beställning via EmailJS
- `CNAME` – anpassad domän för publicering

## Miljövariabler

Följande miljövariabler måste finnas i din deploymiljö:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`

## Deploy

För att `api/send-order.js` ska fungera behöver projektet deployas på en plattform som stödjer serverless functions, till exempel Vercel.

## Testchecklista

1. Lägg till produkter i varukorgen.
2. Ladda om sidan och kontrollera att varukorgen ligger kvar.
3. Fyll i formuläret och kontrollera att uppgifter sparas lokalt.
4. Testa ogiltig e-post, telefon och postnummer.
5. Ladda ner PDF.
6. Skicka beställningen live efter att miljövariablerna är satta.
