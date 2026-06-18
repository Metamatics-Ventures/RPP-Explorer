# RPP Explorer („mapa státu") — pokyny pro práci

Aplikace = statická SPA (vanilla JS, hash router) nad veřejnými open daty RPP (DIA).
- `app/index.html` — shell, navigace, přihlašovací brána (heslo `kgovernment`), načítá `app.js` + cytoscape.
- `app/app.js` — celá aplikace (routy, render, graf, dopady, databáze, SQL, **průvodce novinkami**).
- `app/data/*.json` — klientská data generovaná ETL.
- `etl/build_client_data.py` — ETL z `../RPP/*.json` (zdroj DIA) do `app/data/`. Po datových změnách **spustit ETL** (`python3 etl/build_client_data.py`).
- `docs/` — návrhové dokumenty; `docs/06_*` = připomínky 19. schůzky + plán oprav.
- Vše česky (deliverables jsou v češtině).

## ⚠ PRAVIDLO: verzování + průvodce novinkami (POVINNÉ při každé změně)

V aplikaci je vestavěný **interaktivní průvodce novinkami** — route `#/pruvodce`, funkce
`pruvodce()` + konstanta `CHANGELOG` v `app/app.js`. Uživatel v něm přepíná verze a
proklikává jednotlivé novinky; u nové verze se mu v menu objeví „● nové" a při návratu
z výchozí obrazovky se průvodce otevře sám.

**Pokaždé, když uděláš v aplikaci jakoukoli uživatelsky viditelnou změnu:**

1. **Přidej ji do `CHANGELOG`** v `app/app.js` — pole je řazené **nejnovější verzí nahoře**.
   - Buď přidej `steps` do stávající (ještě nevydané) verze, **nebo** založ novou verzi
     `{ ver, date, tag, summary, steps:[ {icon, title, body, route} ] }` jako **první prvek**.
   - Každý `step`: krátký `title`, 1–3 věty `body` (česky, lidsky, tón „co se zlepšilo"),
     `icon` (emoji) a `route` (hash odkaz „Ukázat v aplikaci →", pokud novinka má kam vést).
2. **Zvyš číslo verze** (`ver`) u nové verze — tím se uživateli automaticky zobrazí „● nové"
   a průvodce se mu otevře. Drobné úpravy v rámci téže nevydané verze číslo zvyšovat nemusí.
3. **Aktualizuj datum** (`date`) — relativní data převáděj na absolutní.
4. Pokud změna souvisí s připomínkami, zaznamenej stav i do `docs/06_*` (tabulka „Stav implementace").

Historie verzí (k 13. 6. 2026):
- **v1.0** — Základ (dashboard, entity, graf, dopady, analytika, hledání, brána).
- **v2.0** — Databáze & SQL (kontrola kvality, fill-rate, ref. integrita, SQL/JOIN, důležitost, kategorie).
- **v3.0** — Revize 19. schůzky PS07 (polarita R/W, kritičnost dle dopadu, rodiny produktů,
  BESP škála, role/§/paprskový graf, měkká/tvrdá kaskáda, editoři, zdroje dat, hranice RPP).

## Po zásazích vždy ověř
- `node --check app/app.js` (syntaxe).
- Headless smoke (volitelné): odemčená kopie + projít routy, hlídat `window.onerror` = 0.
- Po ETL: zkontrolovat `app/data/meta.json` (top_critical, fillrate) a klíčové entity.

## Nasazení
- Hostováno na **mapastatu.cz** (AWS S3 + CloudFront + Route53). Nasazovat jen na vyžádání uživatele.
- Git: commitovat jen když o to uživatel požádá; na default branch nejdřív větev.
