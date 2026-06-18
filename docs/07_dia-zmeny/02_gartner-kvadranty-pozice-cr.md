# 02 — Gartner kvadranty / svodka pozice ČR po rozkliknutí

> **Změna 02 — Gartner kvadranty pozice ČR** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Tato změna doplňuje do mini-dashboardů jednotlivých oblastí (Změna 01) **jednoduchý kvadrant / svodku relativní vyspělosti** Česka v dané schopnosti — vizuální umístění „kde jsme" po vzoru Gartner Magic Quadrant. Bohdan Urban (DIA) si to na poradě 16. 6. 2026 vyžádal opakovaně: chtěl, aby tam, kde je oblast „fragmentovaná", bylo zároveň vidět, jak to „někde odpovídá umístění celkové pozice ČR". Doslova: *„ve chvíli, kdyby na rozkliknutí ještě poskytl nějakou opravdu úplně primitivní svodku nebo umístění v těch kvadrantech, tak to by bylo úplně super."* Nejde o vědeckou metodiku — kvadrant je **odborný odhad pracovní skupiny**, který se postupně dořeší. Každá oblast (např. elektronická identita poměřená s estonským modelem, dánským MitID a rámcem eIDAS 2.0) dostane na pozadí mini-dashboardu jednoduchý dvojosý graf nebo svodkový pruh, jenž ukáže relativní vyspělost a směr, kterým by se Česko mělo vydat. Čerpá z existující komparativní matice schopností (`CAPABILITIES`, `app/app.js:1093`) a referenčních zemí už použitých v `#/gap`.

## 2. Obchodní kontext a zdůvodnění (BRD)

Současný `#/gap` umí jen čtyřstupňové chipy zralosti (`GAP_MAT`: chybí / částečné / silné / lídr, `app/app.js:1076`) a typ mezery (`GAP_TYPE`). To je tabulkové, ne prostorové. Bohdan chtěl **umístění** — vidět ČR jako bod v poli os, protože manažersky to nese sdělení „kam se posunout" mnohem silněji než tabulka. Parafráze: pokud je schopnost fragmentovaná, mělo by to „odpovídat umístění celkové pozice ČR". Obchodní hodnota pro DIA je strategická: kvadrant je artefakt, který se dobře prezentuje vedení a politikům — ukazuje vyspělost relativně k zemím, s nimiž se Česko běžně srovnává (Estonsko, Dánsko, UK, Singapur, EU). Pro DIA jde o nástroj, který říká „kam bychom se měli vydat", aniž by působil jako audit. Princip „hodnota i bez kompletních dat" zde platí dvojnásob: kvadrant je explicitně označen jako odhad k diskusi, a právě tím legitimně otevírá debatu, jaká data by bylo třeba doplnit, aby umístění bylo měřitelné, ne odhadnuté.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor | Bohdan Urban (DIA) | Vidět umístění ČR v kvadrantu; „kam se vydat" |
| Strategie | Jaroslav Pejčoch (AFCEA) | Prezentovatelnost vůči vedení DIA |
| Doménový expert | Petr Kučera (PowerPatterns) | Realističnost os a referenčních zemí |
| Autor | Jakub Bareš (Metamatics) | Lehká implementace, žádný falešný vědecký nárok |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-02-1 | Každá oblast má svodku/kvadrant s umístěním ČR a referenčních zemí. |
| FR-02-2 | Osy kvadrantu jsou dvě jednoduché dimenze (např. „úplnost schopnosti" × „integrace/jednotnost"). |
| FR-02-3 | ČR bod je zvýrazněn; referenční země (Estonsko, Dánsko, UK, Singapur, EU) odlišeny. |
| FR-02-4 | U kvadrantu je explicitní disclaimer „odborný odhad, ne výpočet z RPP". |
| FR-02-5 | Pro oblasti bez kvadrantu se zobrazí lineární svodkový pruh (zralost 1–4). |
| FR-02-6 | Umístění je datově řízené (`oblasti.json`), nikoli zadrátované v UI. |

**Nefunkční**

- **NFR-02-1 (výkon):** kvadrant kreslen lehkým SVG/CSS, bez další knihovny (cytoscape se nezneužívá).
- **NFR-02-2 (bezpečnost):** žádná RPP data v kvadrantu (jde o odhad); RPP slouží jen jako proklik na reálné CZ systémy.
- **NFR-02-3 (čeština):** popisky os, zemí i legendy česky.
- **NFR-02-4 (přístupnost):** každý bod má textový popisek (název země + souřadnice slovně), ne jen pozici.
- **NFR-02-5 (idempotence ETL):** souřadnice v `oblasti.json` přepisovány deterministicky.

## 5. User stories / use cases

- Jako **expert DIA** chci u eID vidět bod „ČR" vlevo dole a „Estonsko" vpravo nahoře, abych okamžitě pochopil rozsah odstupu.
- Jako **stratég** chci kvadrant exportovatelný do prezentace, abych ukázal pozici ČR vedení.
- Jako **uživatel** chci u kvadrantu jasně přečíst, že jde o odhad, abych ho nezaměnil za měření.
- Jako **krizový analytik** chci u „základní registry" vidět, že ČR je lídr, abych věděl, kde je naopak síla.

## 6. Datový model a zdroje dat

Rozšíření **`app/data/oblasti.json`** (zaváděného Změnou 01) o blok kvadrantu:

```json
"eid": {
  "kvadrant": {
    "osa_x": "Úplnost schopnosti",
    "osa_y": "Jednotnost / integrace",
    "body": [
      {"zeme":"ČR","x":0.4,"y":0.3,"cz":true},
      {"zeme":"Estonsko 🇪🇪","x":0.9,"y":0.9},
      {"zeme":"Dánsko 🇩🇰 (MitID)","x":0.85,"y":0.8},
      {"zeme":"EU (eIDAS 2.0)","x":0.6,"y":0.7}
    ],
    "odhad": true
  }
}
```

Souřadnice jsou **odborný odhad skupiny** odvozený ze stávajícího `cz` stupně zralosti a `gap` typu mezery v `CAPABILITIES` (`app/app.js:1093–1125`). RPP žádná srovnávací data nenese — to je explicitně přiznáno. Reálná RPP data vstupují jen nepřímo: proklik na CZ systém realizující schopnost (z FR-01-5).

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** rozšíří generátor `oblasti.json` o převod (`cz` stupeň, `gap` typ) → výchozí souřadnice kvadrantu; ruční korekce odhadů drženy ve slovníku v ETL, ne v UI. Idempotentní.
- **`app/app.js`:** ve funkci `oblast()` (Změna 01) přibude render kvadrantu — čistý SVG: dvě osy, čtyři kvadranty s popisky, body zemí, zvýrazněný bod ČR. Helper `kvadrant(blok)`. Pro oblasti bez `kvadrant` fallback svodkový pruh ze stupně `cz`.
- **Datový tok:** `CAPABILITIES` → ETL odhad souřadnic → `oblasti.json.kvadrant` → SVG render v mini-dashboardu.
- **Integrace:** nezavádí knihovnu, drží se dům-stylu chipů a karet; sdílí slovník zemí s `#/gap`.

## 8. UI/UX

Kvadrant je **na pozadí / v hlavičce** mini-dashboardu oblasti (route `#/oblast/<klíč>`, ze Změny 01). Čtvercové pole, osy X/Y s popisky, čtyři rohové štítky (např. „Lídři" vpravo nahoře). ČR jako výrazný plný bod, ostatní země menší. Pod kvadrantem věta-disclaimer kurzívou: *„Umístění je odborný odhad pracovní skupiny, ne výpočet z RPP — slouží k diskusi ‚kam se vydat'."* U oblastí bez kvadrantu vodorovný pruh 1→4 se značkou ČR. Zápis do `CHANGELOG` (`app/app.js:1837`): do verze **v8.0** přidat step `{icon:'🧭', title:'Umístění ČR v kvadrantu (odhad)', route:'#/oblast/eid'}`, v summary zdůraznit „odborný odhad, ne měření".

## 9. Akceptační kritéria

1. Mini-dashboard eID vykreslí kvadrant se 4 body včetně zvýrazněné ČR bez `window.onerror`.
2. Disclaimer „odborný odhad, ne výpočet z RPP" je viditelný u každého kvadrantu.
3. Oblast bez `kvadrant` zobrazí fallback svodkový pruh, nespadne.
4. Souřadnice odpovídají hodnotám v `oblasti.json` (ne zadrátované v JS).
5. Každý bod má textový popisek čitelný odečítačem obrazovky.
6. `node --check app/app.js` projde; ETL je idempotentní.
7. Novinka je v `#/pruvodce`.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko nadinterpretace:** kvadrant může být čten jako tvrdé měření. Mitigace: silný disclaimer + slovo „odhad".
- **Riziko metodiky:** volba os je arbitrární. Mitigace: osy zvolit jednoduché a obhájitelné; dořešit s DIA.
- **Závislost:** staví na `oblasti.json` ze Změny 01 — musí jít ruku v ruce.
- **Otázka na DIA:** má DIA preferovanou metodiku benchmarkingu (např. EU eGovernment Benchmark, DESI)? Lze ji použít jako oficiální osu?
- **Otázka:** chceme zveřejnit konkrétní souřadnice, nebo jen relativní zóny?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** SVG kvadrant pro 3–4 klíčové oblasti (eID, registry, platby, doručování) s odhadnutými souřadnicemi; fallback pruh pro zbytek; 1 step v CHANGELOG. ~1 den, navazuje na MVP Změny 01.
- **Fáze 2:** napojení os na oficiální benchmark (DESI/EU) místo odhadu; ruční doladění souřadnic s DIA.
- **Fáze 3:** časová osa (kde byla ČR loni vs. dnes) a cílový stav „kam se vydat".
