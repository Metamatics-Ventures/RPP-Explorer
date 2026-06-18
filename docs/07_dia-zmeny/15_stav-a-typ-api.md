# 15 — Stav a typ API jako parametr systému

> **Změna 15 — Stav a typ API jako parametr systému** · Priorita P3 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Změna zavádí u každého informačního systému nový sledovaný atribut: **stav a typ API**. Bohdan Urban ve výčtu parametrů agendového IS zmínil *„stav API — jestli je tam univerzální API, nebo proprietární API"*. Cílem je sledovat u systému, zda nabízí **standardizované/univerzální API**, **proprietární API**, nebo jen **peer-to-peer sdílecí nástroj** k jinému konkrétnímu systému (typicky agendy ČÚZK). Tento parametr je důležitý pro **interoperabilitu a udržitelnost**: proprietární nebo chybějící API znamená vendor lock-in a vyšší náklady, zatímco univerzální API usnadňuje propojený datový fond i krizové sdílení dat. Bohdan sám atribut uvedl s rezervou — *„sypu z rukávu, není to sofistikovaný úplný výčet"* — takže jde o **kandidátní atribut** datového modelu systému, který se promítne do detailu systému a do mini-dashboardů (Změna 01). V UI půjde o jednoduchý filtrovatelný štítek u systému, který umožní pohled „ukaž kritické systémy bez univerzálního API". Spolu s ISSS (Změna 11), bezpečnostní úrovní (Změna 14) a cloudovou závislostí (Změna 13) tvoří API sadu technických atributů pro pohledy „kde můžeme být lepší" (Změna 19). Data dnes pravděpodobně nejsou strukturovaně dostupná, proto platí princip **„nejdřív ukázat užitečnost pohledu, pak motivovat k doplnění"**.

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Pro posouzení odolnosti a udržitelnosti státní IT architektury je klíčové vědět, jak spolu systémy umějí mluvit. Systém s univerzálním API lze zapojit do propojeného datového fondu a v krizi z něj rychle sdílet data; systém s proprietárním API nebo jen peer-to-peer napojením na jeden konkrétní systém je rigidní, drahý na změnu a znamená závislost na dodavateli. RPP tento atribut dnes strukturovaně nenese (datový model systému zahrnuje bezpečnostní úroveň, umístění, etapu, sdílení/využití — viz `etl/build_client_data.py:370–382` — ale ne typ API).

**Citace ze schůzky (parafráze).** Bohdan při výčtu parametrů AIS zmínil „stav API" jako jeden z atributů, který by stálo za to sledovat, a sám dodal, že výčet není úplný ani sofistikovaný — tedy otevřel ho k rozpracování.

**Hodnota pro DIA / krizové řízení.** (1) Pohled „kritické systémy bez univerzálního API" ukáže místa technologického dluhu a lock-inu — vstup pro plán modernizace. (2) Pro krizové sdílení dat je univerzální API předpoklad rychlé interoperability. (3) Atribut doplní sadu „kde můžeme být lepší" (Změna 19) a mini-dashboardy oblastí (Změna 01) o technický rozměr udržitelnosti.

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Navrhovatel atributu | Bohdan Urban (DIA) | Parametry AIS, stav/typ API |
| Doménový expert RPP | Petr Kučera (PowerPatterns) | Reálná dostupnost atributu v datech |
| Autor / vývojář | Jakub Bareš (Metamatics) | Datový model, štítek, filtr |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Interoperabilita, digitální suverenita |
| Konzument výstupu | PS07, krizoví analytici | Lock-in, krizové sdílení dat |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-15-1 | U každého systému evidovat atribut **typ API**: univerzální / proprietární / jen peer-to-peer / neuvedeno. |
| FR-15-2 | Zobrazit atribut jako **štítek** v detailu systému a v seznamu ISVS. |
| FR-15-3 | **Filtr** dle typu API v seznamu systémů (kombinovatelný s ostatními filtry). |
| FR-15-4 | Předdefinovaný pohled/filtr „**kritické systémy bez univerzálního API**" (křížení s bezp. úrovní, Změna 14). |
| FR-15-5 | Tam, kde atribut není v datech, zobrazit „**neuvedeno / kdyby data byla**", ne falešnou hodnotu. |
| FR-15-6 | Atribut zařadit do mini-dashboardů oblastí (Změna 01) jako technický nefunkční parametr. |
| FR-15-7 | Atribut exportovat do databázové vrstvy (`#/databaze`) jako sloupec systému. |

**Nefunkční**

- **NFR-15-1 (poctivost dat):** odlišit reálná RPP data od odvozených/demonstračních (atribut dnes pravděpodobně chybí — viditelně označit).
- **NFR-15-2 (bezpečnost dat):** jen veřejná open data + odborné poznámky skupiny.
- **NFR-15-3 (čeština):** štítky, filtry, tooltipy česky, dům-styl.
- **NFR-15-4 (přístupnost):** typ API značen textem i barvou štítku, ne jen barvou.
- **NFR-15-5 (idempotence):** odvození/načtení atributu v ETL deterministické.

## 5. User stories / use cases

- Jako **expert DIA** chci filtrovat „kritické systémy bez univerzálního API", abych poznal technologický dluh a lock-in.
- Jako **architekt** chci u systému vidět typ API, abych posoudil jeho interoperabilitu.
- Jako **krizový analytik** chci vědět, které kritické systémy nemají univerzální API, protože se z nich v krizi špatně sdílí data.
- Jako **stratég AFCEA** chci atribut v mini-dashboardu oblasti, abych ukázal „kde můžeme být lepší".

## 6. Datový model a zdroje dat

Zdroj: `app/data/isvs.json` — rozšíření objektu systému o pole `typ_api` (`univerzalni` | `proprietarni` | `p2p` | null). Doplnit do skladby ISVS v ETL (`etl/build_client_data.py:370–382`), kde dnes vznikají `bezuroven`, `umisteni`, `etapa`, `sdileni`, `vyuziti`. Detail systému zobrazuje tyto atributy v `app/app.js:496–512`; sem přibude řádek „Typ API". Seznam ISVS a jeho filtry jsou v `app/app.js:458–483`; sem přibude filtr a sloupec.

**Co chybí v RPP:** strukturovaný atribut typu API. RPP eviduje, že systém je „referenční rozhraní" (příznak `ref_rozhrani` u oprávnění, viz schéma `docs/01_*`), ale nerozlišuje univerzální vs. proprietární API. Atribut proto vznikne nejdřív jako **heuristika/demonstrace** (např. odvození „univerzální" u systémů napojených přes ISZR/eGSB) + slovník známých případů (ČÚZK = peer-to-peer), a zbytek „neuvedeno" jako poptávka na DIA.

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** přidat `typ_api` do skladby systému (`:370–382`), odvozený heuristikou (napojení na sdílené rozhraní → kandidát „univerzální"; slovník známých p2p případů jako ČÚZK), jinak null. Idempotentní, drop & rebuild.
- **`app/app.js`:** doplnit štítek do detailu systému (`app/app.js:496–512`), filtr a sloupec do seznamu ISVS (`app/app.js:458–483`), předdefinovaný pohled „kritické bez univerzálního API" (křížení s `bezuroven`). Sloupec přidat i do DB schématu (`app/app.js:1689`).
- **Datový tok:** RPP JSON → ETL (`typ_api`) → `isvs.json` → render štítku + filtr → mini-dashboard oblasti (Změna 01).
- **Integrace:** atribut je jeden z technických parametrů sady „kde můžeme být lepší" (Změna 19) vedle ISSS (Změna 11), bezp. úrovně (Změna 14), cloudu (Změna 13).

## 8. UI/UX

V detailu systému (`app/app.js:496+`) přibude řádek „Typ API" se štítkem (univerzální = pozitivní, proprietární = neutrální upozornění, p2p = informativní, neuvedeno = šedý). V seznamu ISVS přibude sloupec a filtr „Typ API". Na dashboardu / v sekci „kde můžeme být lepší" (Změna 19) předdefinovaný proklik „kritické systémy bez univerzálního API". Tooltip vysvětlí význam (lock-in vs. interoperabilita). Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze, tag „Typ API jako parametr systému", step `{icon:'🔌', title:'Stav a typ API u systémů', route:'#/isvs'}`.

## 9. Akceptační kritéria

1. Detail systému zobrazuje řádek „Typ API" se štítkem (nebo „neuvedeno") bez `window.onerror`.
2. Seznam ISVS má filtr „Typ API" kombinovatelný s ostatními filtry.
3. Předdefinovaný pohled „kritické systémy bez univerzálního API" vrátí křížení `bezuroven` × `typ_api`.
4. Systémy bez atributu zobrazí „neuvedeno / kdyby data byla", ne falešnou hodnotu.
5. Atribut je dostupný jako sloupec v databázové vrstvě (`#/databaze`).
6. `node --check app/app.js` projde; ETL idempotentně doplní `typ_api`.
7. Novinka je v průvodci (`#/pruvodce`) jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko dat:** atribut v RPP pravděpodobně chybí — heuristika může být nepřesná. Mitigace: konzervativně „neuvedeno", štítek „odvozeno", disclaimer.
- **Riziko taxonomie:** Bohdan sám řekl, že výčet není úplný — kategorie (univerzální/proprietární/p2p) je třeba ověřit s DIA. Mitigace: rozšiřitelný číselník.
- **Závislost:** Změny 01 (mini-dashboard), 11 (ISSS), 13 (cloud), 14 (bezp. úroveň), 19 (kde můžeme být lepší).
- **Otázka na DIA:** eviduje (nebo může RPP evidovat) typ/stav API u AIS? Existuje DIA taxonomie API (univerzální vs. proprietární)? Lze odvodit „univerzální" z napojení na eGSB/ISZR?
- **Otázka:** je p2p (ČÚZK) samostatná kategorie, nebo podtyp proprietárního API?

## 11. Fázování a hrubý odhad

- **MVP do pátku (volitelně):** pole `typ_api` v ETL (heuristika + slovník), štítek v detailu systému, filtr v seznamu, 1 zápis do CHANGELOG. ~0,5 dne.
- **Fáze 2:** předdefinovaný pohled „kritické bez univerzálního API", sloupec v DB vrstvě, zařazení do mini-dashboardů (Změna 01).
- **Fáze 3:** po doplnění dat DIA — reálný atribut místo heuristiky, plné napojení do sady „kde můžeme být lepší" (Změna 19).
