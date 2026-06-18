# 17 — Veřejná „nástěnka" / gamifikace pro motivaci správců

> **Změna 17 — Veřejná „nástěnka"/gamifikace pro motivaci správců** · Priorita P3 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

DIA jako správce RPP nesmí správce nutit do ničeho silou — smí jen metodicky pomáhat. Nejúčinnější neformální páka je proto **viditelnost a soutěživost**. Jaroslav Pejčoch popsal osvědčený „jednoduchý trik" z dob Y2K: veřejně přístupná mapa s barevně označenými okresy, kterou všichni viděli a kde se zaznamenával postup — „aniž bys kohokoliv nutil, necháš to na nástěnce a oni si dají bacha, aby tam nesvítili červeně". Bohdan Urban potvrdil, že přesně tenhle model DIA právě teď používá při onboardingu CIS: „když jsem řekl, nejlepší je Liberecký kraj, najednou Ústecký se mohl přetrhnout." Tato změna zavádí do RPP Exploreru **veřejný srovnávací žebříček (leaderboard) stavu digitalizace / kvality dat po resortech** (případně krajích/správcích) — semafor, žebříček nejlepších, postup v čase. Žebříček čerpá ze skóre zdraví dat (Změna 08) a podporuje i metodiku (Změna 06). Zásadní je riziko, na které Jaroslav sám upozornil: zveřejnění bez kontextu by mohlo být kontraproduktivní a sloužit kritikům („jak je všude bordel, zejména DIA"). Leaderboard proto vzniká **v koordinaci s DIA** a je **rámován pozitivně** — postup a zlepšení, ne pranýř.

## 2. Obchodní kontext a zdůvodnění (BRD)

Motivace správců je jádrový problém: data nikdo nedoplňuje, protože k tomu není tlak ani odměna. Jaroslav nabídl historicky ověřené řešení (Y2K): veřejná barevná mapa okresů, na níž je vidět, kdo je hotov a kdo ne. Mechanismus je sociální — nikdo nikoho nenutí, ale nikdo nechce „svítit červeně". Bohdan doložil, že stejný princip DIA aktuálně používá při onboardingu CIS: pochvala nejlepšího kraje (Liberecký) okamžitě nakopla další (Ústecký) k aktivitě. Jde tedy o praxí ověřený, levný motor doplňování a čištění dat.

Hodnota pro DIA: leaderboard je čistě **metodický a motivační** nástroj — žádné direktivní zasahování do byznysu, jen viditelnost a pozitivní soutěž. Dává DIA páku, kterou jinak jako správce RPP nemá. Zároveň je tu vážné riziko, které Jaroslav sám pojmenoval v úvodu: pokud se stav dat zveřejní bez kontextu, může to posloužit kritikům státu i samotné DIA („všude bordel"). Proto je obchodní podmínkou, aby leaderboard (a) vznikl v koordinaci s DIA, (b) byl rámován jako **postup a zlepšení** (kdo se nejvíc zlepšil, ne kdo je nejhorší), a (c) měl jasný metodický kontext (proč jsou některá pole prázdná, viz Změna 06/08). Při dodržení těchto podmínek je to nejlevnější a nejúčinnější ze všech navržených změn.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / správce RPP | Bohdan Urban (DIA) | Motivace bez direktivy; koordinace zveřejnění |
| Autor konceptu | Jaroslav Pejčoch (AFCEA) | Y2K „nástěnka"; pozitivní rámec, ošetření rizika |
| Iniciátor zdrojových dat | Petr Kučera (PowerPatterns) | Korektnost skóre, ze kterého žebříček čerpá |
| Autor / vývojář | Jakub Bareš (Metamatics) | Render leaderboardu, semafor, trend v čase |
| Cílový adresát motivace | Správci / resorty / kraje | Vidět svůj postup; nechtít „svítit červeně" |
| Pracovní skupina | PS07 kGovernment | Vazba na zdraví dat (08) a metodiku (06) |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-17-1 | **Veřejný srovnávací žebříček** stavu digitalizace / kvality dat po resortech (volitelně krajích/správcích). |
| FR-17-2 | **Barevné označení (semafor)** stavu — zelená/žlutá/červená nebo neutrální gradient. |
| FR-17-3 | **Žebříček nejlepších** (a volitelně „nejvíce zlepšených"), s pozitivním rámcem. |
| FR-17-4 | **Postup v čase** — trend skóre (zlepšení od posledního snapshotu). |
| FR-17-5 | Žebříček **čerpá ze skóre zdraví dat** (Změna 08), nepřepočítává samostatně. |
| FR-17-6 | Kontextové vysvětlení u skóre (proč jsou pole prázdná) — odkaz na metodiku (Změna 06). |
| FR-17-7 | Rámec je **pozitivní** (postup/zlepšení), ne pranýř; bez vytržených „nejhorších". |
| FR-17-8 | Zveřejnění je **konfigurovatelné** (interní × veřejné) v koordinaci s DIA. |

**Nefunkční**

- **NFR-17-1 (rámec):** vždy pozitivní/motivační; žádná formulace umožňující čtení „bordel, zejména DIA".
- **NFR-17-2 (koordinace):** veřejná varianta jen po odsouhlasení DIA; výchozí stav „interní".
- **NFR-17-3 (výkon):** leaderboard z předpočítaného `health.json`/snapshotu; bez dopočtu v prohlížeči.
- **NFR-17-4 (přístupnost):** stav nejen barvou, ale i textem/číslem (semafor + popisek).
- **NFR-17-5 (čeština + open data):** vše česky; výhradně veřejná open data RPP.

## 5. User stories / use cases

- Jako **expert DIA** chci pochválit nejlepší resort/kraj a vidět, jak to nakopne ostatní, abych motivoval bez direktivy.
- Jako **správce resortu** chci vidět, kde stojím vůči ostatním a o kolik jsem se zlepšil, abych nechtěl „svítit červeně".
- Jako **stratég AFCEA** chci pozitivní rámec (postup/zlepšení), abych se vyhnul tomu, že žebříček poslouží kritikům.
- Jako **uživatel** chci u skóre vysvětlení, proč jsou některá pole prázdná, abych stav četl spravedlivě.
- Jako **DIA** chci přepínač interní/veřejné, abych zveřejnění řídil a koordinoval.

## 6. Datový model a zdroje dat

Žebříček **nepočítá vlastní metriku** — čte skóre z `app/data/health.json` (Změna 08, `per_resort.skore` + rozpad nálezů). Pro trend v čase se přidávají **snapshoty** skóre: nová sada **`app/data/leaderboard.json`** s časovou řadou:

```json
{
  "snapshots": [
    {"datum":"2026-06-01", "resorty":{"MV":68,"MF":74,"...":0}},
    {"datum":"2026-06-16", "resorty":{"MV":72,"MF":76,"...":0}}
  ],
  "aktualni": {"poradi":[{"resort":"MF","skore":76,"trend":+2,"semafor":"zelena"}]},
  "rezim":"interni"
}
```

`rezim` (`interni`/`verejne`) řídí, zda se žebříček ukazuje za branou nebo veřejně — výchozí `interni`, přepnutí jen v koordinaci s DIA. Skóre i rozpad nálezů jsou totožné se Změnou 08 (jeden zdroj pravdy). Kontext „proč prázdné" se odkazuje na metodiku (Změna 06).

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** po `compute_health()` (Změna 08) přidá aktuální skóre per resort do časové řady v `leaderboard.json` (append snapshot s datem ETL) a spočítá pořadí, trend a semafor. Idempotentní pro daný den (přepíše dnešní snapshot). Žádný nový výpočet kvality — jen agregace a časová řada.
- **`app/app.js`:** nová route `#/zebricek` s render funkcí `zebricek()` — semafor mapa/tabulka resortů, žebříček nejlepších a nejvíce zlepšených, sparkline trendu. Respektuje `rezim` (interní za branou × veřejná). Sdílí barevné helpery a `cmpBar` (`app/app.js:1023`).
- **Datový tok:** `health.json` (08) → ETL append snapshot → `leaderboard.json` → `zebricek()` render.
- **Integrace:** přímá závislost na Změně 08 (skóre) a Změně 06 (kontext); log duplicit (Změna 09) lze zobrazit jako jeden z motivačních ukazatelů.

## 8. UI/UX

Route `#/zebricek` (sekce Analýza). Nahoře **semafor přehled** (mapa krajů nebo dlaždice resortů obarvené dle skóre, vždy s číslem a popiskem), výrazně rámováno „**Postup digitalizace a kvality dat — kdo se nejvíc zlepšil**". Pod tím dvě tabulky: **Nejlepší** a **Největší zlepšení** (trend ▲). U každého řádku sparkline postupu v čase. Pod žebříčkem trvalá vysvětlivka: „Skóre měří formální úplnost a konzistenci dat (ne obsahovou správnost). Prázdná pole mají často metodické důvody — viz Pro správce agend." Žádná samostatná tabulka „nejhorších". Při `rezim:'verejne'` banner „Zveřejněno v koordinaci s DIA". Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze, tag „Žebříček postupu (motivace)", step `{icon:'🏅', title:'Veřejný žebříček postupu digitalizace per resort (pozitivní rámec)', route:'#/zebricek'}`.

## 9. Akceptační kritéria

1. ETL doplní `leaderboard.json` (append dnešního snapshotu) idempotentně pro daný den.
2. Route `#/zebricek` se renderuje bez `window.onerror`; zobrazí semafor, žebříček nejlepších a největšího zlepšení.
3. Skóre v žebříčku se shoduje se skóre v `#/zdravi` (Změna 08) — jeden zdroj pravdy.
4. U skóre je trvalá vysvětlivka „formální úplnost/konzistence, ne obsah" + odkaz na metodiku (Změna 06).
5. Žebříček nemá samostatnou tabulku „nejhorších"; rámec je pozitivní (postup/zlepšení).
6. `rezim` řídí interní × veřejné zobrazení; výchozí je `interni`.
7. `node --check app/app.js` projde; novinka je v `#/pruvodce` jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko zneužití (hlavní):** zveřejnění bez kontextu poslouží kritikům („bordel, zejména DIA"). Mitigace: výchozí interní režim, pozitivní rámec, povinná vysvětlivka, zveřejnění jen po odsouhlasení DIA.
- **Riziko nespravedlnosti:** resort s legitimně prázdnými poli vypadá špatně. Mitigace: kontext „proč prázdné" (Změna 06), důraz na trend, ne absolutní stav.
- **Riziko gamifikace naruby:** správci optimalizují skóre, ne kvalitu (vyplní cokoli). Mitigace: skóre váže i konzistenci, ne jen vyplněnost.
- **Závislost:** tvrdá na Změně 08 (skóre) a Změně 06 (kontext); bez nich nemá žebříček vstup ani férový rámec.
- **Otázka na DIA:** Chce DIA žebříček veřejný, nebo jen interní jako onboarding nástroj (jako u CIS)? Jaká granularita motivuje nejlépe — resort, kraj, nebo správce? Souhlasí DIA s rámcem „postup/zlepšení" a s tím, že nezveřejníme tabulku „nejhorších"?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** route `#/zebricek` nad existujícím skóre (Změna 08), semafor + žebříček nejlepších, výchozí interní režim, vysvětlivka, 1 zápis do CHANGELOG. ~0,5–1 den (staví na `health.json`).
- **Fáze 2:** časová řada snapshotů a trend „největší zlepšení"; granularita kraj/správce; přepínač režimu.
- **Fáze 3:** veřejná varianta po koordinaci s DIA (mapa krajů, sdílitelný odkaz); napojení na metodická hesla a log duplicit jako další motivační ukazatele.
