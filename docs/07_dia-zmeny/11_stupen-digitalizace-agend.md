# 11 — Vizualizace stupně digitalizace agend (vstup + napojení na ISSS)

> **Změna 11 — Stupeň digitalizace agend** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Tato změna zavádí jednu ze **dvou páteřních metrik** nástroje: vizualizaci **stupně digitalizace agend**. Bohdan Urban (DIA) ji na poradě 16. 6. 2026 popsal jako „v celku triviální rovnici": stupeň digitalizace = počet agend, které mají **digitalizovaný vstup** (elektronický formulář, podání), plus počet **AIS připojených na ISSS / Egon Service Bus** — což je podle něj „úplně zatím nejvýše možný dosažitelný stupeň digitalizace". Pro DIA je to klíčové, protože tuto metriku potřebují sledovat „plus tři roky tohoto volebního období" jako ukazatel pokroku, a dnes jim to „jde jako psovi pastva" — nemají to přehledně zobrazené. Pohled rozliší tři stavy agendy: **bez digitalizovaného vstupu** / **formulář bez ISSS** / **plně napojeno**. Komplikace reality (peer-to-peer sdílení místo ISSS u agend ČÚZK, více systémů na jednu agendu u sociálky) se nesou jako poznámky a odchylky, ne jako tichá zkreslení. Tím nástroj DIA dává metriku, kterou může reportovat vedení a po níž může měřit progres.

## 2. Obchodní kontext a zdůvodnění (BRD)

DIA dnes nemá jednoduchý, prezentovatelný ukazatel „jak daleko jsme s digitalizací" napříč agendami. Bohdanova rovnice je záměrně jednoduchá, protože má sloužit jako sledovatelná metrika ve volebním období. Parafráze ze schůzky: jde o „nejvýše možný dosažitelný stupeň digitalizace" — agenda je „hotová", když má elektronický vstup a její AIS je napojen na sdílenou sběrnici (ISSS / Egon Service Bus), takže si data vyměňuje, místo aby je vyžadovala od občana. Obchodní hodnota pro DIA: (1) **report progresu** — graf, který lze sledovat čtvrtletně po tři roky; (2) **identifikace mezer** — které agendy ještě nemají digitální vstup nebo napojení, tedy kde je práce; (3) **legitimizace dat** — princip „hodnota i bez kompletních dat": kde RPP příznak napojení nenese, ukáže se to jako „neuvedeno" a vznikne poptávka po doplnění. Pro krizové řízení je hodnota v tom, že napojení na ISSS indikuje, zda agenda umí čerpat data za běhu (živá závislost) versus drží lokální kopie — což přímo souvisí s kaskádovou analýzou (`#/dopady`).

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor | Bohdan Urban (DIA) | Metrika pokroku digitalizace na 3 roky |
| Doménový expert | Petr Kučera (PowerPatterns) | Korektní odvození napojení z RPP dat |
| Strategie | Jaroslav Pejčoch (AFCEA) | Prezentovatelnost metriky vedení |
| Autor | Jakub Bareš (Metamatics) | Implementace, poctivé označení odchylek |
| Krizový expert | Mirek Lukeš (PS07) | Vazba napojení ↔ typ závislosti v kaskádě |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-11-1 | Každá agenda má odvozený stupeň digitalizace ve 3 stavech: bez digitálního vstupu / formulář bez ISSS / plně napojeno. |
| FR-11-2 | Nový souhrnný pohled (route `#/digitalizace`) s rozložením agend do tří stavů. |
| FR-11-3 | Stav digitalizace se zobrazí i v seznamu agend a v detailu agendy. |
| FR-11-4 | Odchylky vyznačeny jako poznámky: peer-to-peer místo ISSS (typicky ČÚZK), více systémů na agendu (sociálka). |
| FR-11-5 | Chybějící příznak napojení se zobrazí jako „neuvedeno", ne jako „nenapojeno". |
| FR-11-6 | Metrika je agregovaná do jednoho čísla „% plně digitalizovaných agend" pro report. |

**Nefunkční**

- **NFR-11-1 (výkon):** stupeň předpočítán v ETL do `agendy.json`; UI jen čte (< 300 ms).
- **NFR-11-2 (bezpečnost):** výhradně open data RPP; žádný neveřejný registr napojení.
- **NFR-11-3 (čeština):** stavy i poznámky česky.
- **NFR-11-4 (přístupnost):** stav vyjádřen textem i barvou (3 chipy), ne jen barvou.
- **NFR-11-5 (idempotence ETL):** příznak digitalizace přepočítáván deterministicky při každém běhu.

## 5. User stories / use cases

- Jako **expert DIA** chci vidět, kolik procent agend je plně napojeno na ISSS, abych reportoval pokrok za volební období.
- Jako **expert DIA** chci seznam agend „formulář bez ISSS", abych věděl, kde je další krok blízko.
- Jako **stratég** chci graf rozložení tří stavů, abych ho ukázal vedení jako jednu metriku.
- Jako **krizový analytik** chci vědět, zda je agenda na ISSS živě napojena, abych odhadl chování při výpadku registru.
- Jako **uživatel** chci u agend ČÚZK vidět poznámku „peer-to-peer", abych nečetl absenci ISSS jako zaostalost.

## 6. Datový model a zdroje dat

Zdroj: `app/data/agendy.json` (pole o službách a systémech agendy), `app/data/sluzby.json` (úkony — zda jsou digitální, viz `#/sluzby`), `app/data/isvs.json`. **Digitalizovaný vstup** lze odvodit z existence elektronického úkonu/formuláře u služeb agendy (RPP nese úkony a jejich digitálnost — využíváno už v detailu služby, viz CHANGELOG v6.0). **Napojení na ISSS / Egon Service Bus** je problematické: RPP nemá přímé pole „napojeno na ISSS". Kandidátní příznaky: úroveň sdílení/využití ISVS (`uroven_sdileni`, `uroven_vyuziti`), sdílení údaje na PPDF (`sdílen-na-PPDF` v `udaje.json`), případně příslušnost systému ke sdílené infrastruktuře ISZR (už rozlišeno v v6.0). Nová pole v `agendy.json`:

```json
{ "id":"agenda/A338",
  "digi": { "vstup": true, "isss": false,
            "stupen": "formular_bez_isss",
            "pozn": ["více systémů na agendu"] } }
```

**Co chybí v RPP:** explicitní evidence napojení AIS na ISSS/ESB — to je hlavní mezera a hlavní poptávka na DIA.

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** nová odvozovací funkce `digi_stupen(agenda)` — z úkonů služeb agendy zjistí `vstup`, z příznaků sdílení/PPDF/ISZR odvodí `isss`, určí `stupen` ∈ {bez_vstupu, formular_bez_isss, plne_napojeno} a doplní `pozn` (odchylky). Zapíše do `agendy.json` a agregát (rozložení, %) do `meta.json` (`digi_distribuce`). Idempotentní.
- **`app/app.js`:** nová route `#/digitalizace` + funkce `digitalizace()` — graf tří stavů (sloupce/pruhy v dům-stylu, bez nové knihovny) + tabulka agend filtrovatelná dle stavu. V detailu agendy a v seznamu agend přidat chip stupně (helper `digiBadge`).
- **Datový tok:** RPP úkony/sdílení → ETL `digi_stupen` → `agendy.json.digi` + `meta.json.digi_distribuce` → render.
- **Integrace:** příznak `isss` se nabízí kaskádové analýze (`#/dopady`) jako vstup pro rozlišení živé vs. měkké závislosti — provázat s logikou v `app/app.js:927–929`.

## 8. UI/UX

Route `#/digitalizace`. Nahoře headline metrika „Plně digitalizováno: N % agend" + tři KPI dlaždice (bez vstupu / formulář bez ISSS / plně napojeno). Pod tím vodorovný stohovaný pruh rozložení a tabulka agend (název | stav-chip | poznámky | proklik na detail). Tři barvy chipů: šedá (bez vstupu), jantarová (formulář bez ISSS), zelená (plně napojeno) — vždy s textem. Disclaimer kurzívou: *„Napojení na ISSS je odvozeno z příznaků sdílení v RPP; přímé pole RPP nenese — kde chybí, uvádíme ‚neuvedeno'."* Poznámky-odchylky (ČÚZK peer-to-peer, sociálka více systémů) jako malé chipy. Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze **v9.0**, tag „Stupeň digitalizace agend", step `{icon:'📶', title:'Jak daleko jsme s digitalizací', body:'Tři stavy agend: bez digitálního vstupu / formulář bez ISSS / plně napojeno na sběrnici. Páteřní metrika pro sledování pokroku.', route:'#/digitalizace'}`.

## 9. Akceptační kritéria

1. `#/digitalizace` zobrazí rozložení agend do 3 stavů a headline „% plně digitalizováno" bez `window.onerror`.
2. Každá agenda má v detailu chip stupně digitalizace.
3. Filtr dle stavu funguje a počty sedí na `meta.json.digi_distribuce`.
4. Agendy ČÚZK nesou poznámku „peer-to-peer", agendy s více systémy poznámku „více systémů na agendu".
5. Kde RPP příznak napojení nemá, stav je „neuvedeno", ne „nenapojeno".
6. `node --check app/app.js` projde; ETL po `python3 etl/build_client_data.py` přepočítá `digi` idempotentně.
7. Novinka je v `#/pruvodce`.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko odvození ISSS:** RPP nemá přímé pole; heuristika přes sdílení/PPDF/ISZR může být nepřesná. Mitigace: disclaimer + „neuvedeno" + poptávka na DIA.
- **Riziko odchylek:** peer-to-peer (ČÚZK) by neměl být penalizován jako „nenapojeno" — řešeno poznámkou.
- **Závislost:** sdílí příznak `isss` s kaskádovou analýzou (Změna návaznost na `#/dopady`).
- **Otázka na DIA:** existuje autoritativní seznam AIS napojených na ISSS / Egon Service Bus, který lze do nástroje dostat? Lze ho zpřístupnit jako open data?
- **Otázka:** jak přesně počítat „digitalizovaný vstup" — stačí jeden elektronický úkon, nebo většina úkonů agendy?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** ETL odvození `vstup` z úkonů + hrubé `isss` z příznaků sdílení, route `#/digitalizace` se třemi stavy a headline %, chip v detailu agendy, 1 step v CHANGELOG. ~1,5 dne.
- **Fáze 2:** nahrazení heuristiky ISSS autoritativním seznamem od DIA; propojení do `#/dopady`.
- **Fáze 3:** časová řada metriky (sledování pokroku po čtvrtletích volebního období).
