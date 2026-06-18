# 12 — Vylepšení mapy kritických závislostí mezi systémy

> **Změna 12 — Mapa kritických závislostí mezi systémy** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Mapa rozpadu vazeb (graf vazeb, cytoscape ego-graf) je už dnes v aplikaci a na poradě se ukázalo, že je to její **nejsilnější prvek**. Bohdan Urban ji označil za *„asi nejužitečnější věc, kterou jsem tady viděl"* a vyzdvihl, že je *„hodně založená na přístupu k datům na úrovni byznysové architektury"*. Jakub Bareš zároveň přiznal rezervu: *„šlo by to velmi vylepšit."* Tato změna proto graf povyšuje na **centrální analytický nástroj** celé aplikace — plátno, na které se napojují všechny ostatní pohledy (kritické agendy ze Změny 03, koncentrační uzly ze Změny 07, cloudové závislosti ze Změny 13, bezpečnostní úroveň ze Změny 14). Konkrétně přináší: čitelnost při velkém počtu uzlů, zvýraznění kritických cest, **obousměrnou navigaci** (agenda → systémy i systém → agendy), zvýraznění koncentračních uzlů a **vizuální odlišení jistoty vazby** (u nových projektů kvalitní vazby z ArchiMate, u starších IS odhad). Cílem je nástroj, který pomůže odhalit i **redundantní/neefektivní volání** — Bohdan uvedl příklad e-dokladů, které se *„v průběhu jedné transakce ptají na ISZR na údaje držitele pětkrát"* kvůli špatně postavené architektuře.

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Současný graf (`app/app.js:716–790`, funkce `graf()`) umí ego-graf s expandováním uzlů (`expand`, `app/app.js:756`) a dva layouty — orbitální a tokový L→R (breadthfirst, `app/app.js:776`). To je dobrý základ, ale: při mnoha uzlech se ztrácí čitelnost, kritické cesty nejsou zvýrazněné, navigace je směrově nevyvážená a všechny hrany vypadají stejně jistě, ačkoli jejich kvalita se zásadně liší podle stáří systému.

**Citace ze schůzky (parafráze).** Bohdan vysvětlil, proč je rozdíl v jistotě vazeb: u nových projektů, které procházejí schvalováním s modelem architektury, je kvalita vazeb „aspoň srovnatelná"; u starších IS bez ArchiMate je rekonstrukce vazby složitější a méně jistá. Bohdanův příklad e-dokladů (pětinásobný dotaz na ISZR v jedné transakci) ukazuje druhou hodnotu mapy — nejen „co na čem visí", ale i **kde je architektura neefektivní**.

**Hodnota pro DIA / krizové řízení.** (1) Most mezi všemi funkcemi — jedno plátno místo izolovaných obrazovek. (2) Schopnost odhalit redundantní volání (úspora, bezpečnost, odolnost). (3) Pro krizové řízení vizualizace kritických cest „odkud kam tečou data, když vypadne X". Mapa je zároveň prezentačně nejsilnější artefakt vůči DIA.

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Sponzor / cílový uživatel | Bohdan Urban (DIA) | Byznysová architektura, odhalení neefektivity |
| Doménový expert RPP | Petr Kučera (PowerPatterns) | Korektnost vazeb, jistota hran |
| Autor / vývojář | Jakub Bareš (Metamatics) | Vylepšení cytoscape vrstvy, výkon |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Mapa jako vlajkový pohled |
| Konzument výstupu | Krizoví analytici, PS07 | Kritické cesty, dopady |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-12-1 | Zvýraznění **kritických cest** v grafu (cesta z epicentra k registru / od registru k živě závislým). |
| FR-12-2 | **Obousměrná navigace**: z agendy expandovat systémy a z každého systému zpět jeho agendy. |
| FR-12-3 | **Zvýraznění koncentračních uzlů** (SPOF ze Změny 07) velikostí/barvou uzlu. |
| FR-12-4 | **Překryv dimenzí** přepínačem: kritičnost agendy (Změna 03), bezpečnostní úroveň (Změna 14), cloudová závislost (Změna 13). |
| FR-12-5 | **Vizuální odlišení jistoty vazby** (jistá z ArchiMate / odvozená u starších IS) — styl hrany. |
| FR-12-6 | Detekce a vizualizace **redundantních/opakovaných volání** mezi dvěma uzly (např. násobné R z téhož zdroje). |
| FR-12-7 | Čitelnost při mnoha uzlech: shlukování, limit zobrazení, „rozbalit více". |

**Nefunkční**

- **NFR-12-1 (výkon):** plynulé vykreslení i při stovkách uzlů; expand lazy (jen na vyžádání, jako dnes `app/app.js:756`).
- **NFR-12-2 (bezpečnost dat):** jen veřejná open data RPP; jistota vazby je odvozená vlastnost, ne neveřejný zdroj.
- **NFR-12-3 (čeština):** legenda, štítky, tooltipy česky, dům-styl.
- **NFR-12-4 (přístupnost):** dimenze a jistota odlišeny nejen barvou, ale i tvarem/štítkem v legendě.
- **NFR-12-5 (idempotence):** odvození jistoty vazby a redundance v ETL deterministické.

## 5. User stories / use cases

- Jako **expert DIA** chci přepnout překryv „bezpečnostní úroveň", abych viděl, kudy vedou cesty přes kritické systémy.
- Jako **architekt** chci uvidět, že e-doklady volají ISZR vícekrát v jedné transakci, abych odhalil neefektivitu.
- Jako **krizový analytik** chci zvýrazněnou kritickou cestu z epicentra k registru, abych pochopil dopad výpadku.
- Jako **uživatel** chci z agendy i ze systému navigovat oběma směry, abych prozkoumal vazbu z obou stran.
- Jako **uživatel** chci poznat, která hrana je jistá a která odhadnutá, abych věděl, čemu věřit.

## 6. Datový model a zdroje dat

Zdroje: `app/data/isvs.json` (`agendy[]`, `bezuroven`, `umisteni`), `app/data/opravneni.json` (toky `z`/`do`, úroveň `rw` — R/W), `app/data/agendy.json`, `names.json`. Nové odvozené vlastnosti hran ukládané ETL:

```json
{"edges":[{"from":"…","to":"…","rw":"R","jistota":"archimate|odvozeno",
           "pocet_volani":5,"redundance":true}]}
```

**Co chybí v RPP:** explicitní model architektury (ArchiMate) u starších IS — jistota vazby se proto odvozuje heuristicky (např. etapa životního cyklu / přítomnost strukturovaných vazeb). Počet volání v jedné transakci RPP nenese — redundance „pětkrát na ISZR" je dnes neměřitelná z open dat a zůstává jako demonstrace „kdyby data byla" + poptávka na DIA.

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** doplnit u hran příznak `jistota` (z etapy/strukturovanosti vazby) a — kde lze — `pocet_volani`/`redundance`. Stavět na existujících tocích oprávnění (`etl/build_client_data.py:162–170`, z→do, rw).
- **`app/app.js`:** rozšířit `graf()` (`app/app.js:716`) a `expand()` (`app/app.js:756`): styly hran dle `jistota` (plná/čárkovaná), velikost uzlů dle koncentrace (Změna 07), přepínač překryvu dimenzí, zvýraznění kritické cesty (BFS od epicentra po R-hranách jako v dopadové analýze `app/app.js:817+`). Obousměrný expand: u systému dotáhnout jeho agendy.
- **Datový tok:** RPP JSON → ETL (hrany + jistota + dimenze) → cytoscape elements → interaktivní mapa. Sdílí kaskádovou logiku s `#/dopady` (kritická cesta = tvrdé R-hrany).
- **Integrace:** mapa je plátno pro Změny 03 (kritičnost), 07 (SPOF), 13 (cloud), 14 (bezp. úroveň) — všechny se promítají jako překryvy, ne jako samostatné grafy.

## 8. UI/UX

Route `#/graf` (rozšíření stávající). Nad plátnem panel: přepínač layoutu (orbit/tok, už existuje `app/app.js:730`), **selektor překryvu** (kritičnost / bezp. úroveň / cloud / jistota), tlačítko „zvýraznit kritickou cestu", slider „max uzlů". Legenda dole vysvětlí barvy dimenzí, tloušťku/styl hran (jistá vs. odvozená) a velikost uzlu (koncentrace). Tooltip na hraně ukáže R/W, jistotu a (kde je) počet volání s upozorněním na redundanci. Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze, tag „Mapa závislostí — kritické cesty a jistota vazeb", step `{icon:'🕸️', title:'Vylepšená mapa závislostí', route:'#/graf'}`.

## 9. Akceptační kritéria

1. V grafu lze přepnout překryv (kritičnost / bezp. úroveň / cloud / jistota) bez `window.onerror`.
2. Hrany s odvozenou jistotou jsou vizuálně odlišené (styl) od jistých; legenda to vysvětluje.
3. Tlačítko „zvýraznit kritickou cestu" zvýrazní cestu z epicentra po R-hranách.
4. Z agendy lze expandovat systémy a ze systému zpět jeho agendy (obousměrně).
5. Koncentrační uzel (SPOF, Změna 07) je v grafu zvětšený/zvýrazněný.
6. Tam, kde RPP nenese počet volání, je redundance označena jako „k ověření / kdyby data byla".
7. `node --check app/app.js` projde; ETL idempotentně doplní příznaky hran.
8. Novinka je v průvodci (`#/pruvodce`) jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko čitelnosti:** velký graf zůstane nepřehledný i po vylepšení. Mitigace: limit uzlů, shlukování, lazy expand.
- **Riziko jistoty:** heuristika „jistá vs. odvozená" může být nepřesná. Mitigace: konzervativně označovat jako „odvozeno" a doplnit disclaimer.
- **Závislost:** Změny 03/07/13/14 (dimenze překryvů), dopadová analýza (kritická cesta).
- **Otázka na DIA:** lze z RPP / navazujících podkladů (ArchiMate u nových projektů) získat příznak kvality/jistoty vazby? Eviduje se počet volání rozhraní (případ e-dokladů × ISZR)?
- **Otázka:** chceme redundanci volání řešit jako demonstraci, dokud data nejsou, nebo ji zatím vynechat?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** přepínač překryvu (bezp. úroveň + kritičnost), zvýraznění kritické cesty, obousměrný expand, 1 zápis do CHANGELOG. ~1,5 dne.
- **Fáze 2:** odvození a vizualizace jistoty vazeb (ArchiMate vs. odhad), zvětšení SPOF uzlů (Změna 07), shlukování pro čitelnost.
- **Fáze 3:** detekce redundantních volání (po doplnění dat DIA), plné napojení cloudové dimenze (Změna 13) a integrace do znalostní vrstvy.
