# 01 — Mini-dashboard pro každou skupinu systémů (rozpad na „fíčury")

> **Změna 01 — Mini-dashboard skupin systémů** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Vysokoúrovňový dashboard a zejména nový pohled „Architektura státu — gap analýza" (route `#/gap`) na poradě 16. 6. 2026 zaujaly: Bohdan Urban (DIA) i Jakub Bareš se shodli, že přehled „překvapivě hodně odpovídá realitě". Ukázalo se ale, že chybí **hloubka při rozkliknutí** — uživatel vidí, že eID je „FRAGMENTOVÁNO", ale nedostane se k tomu, *které konkrétní systémy* za tím verdiktem stojí a *proti čemu* se Česko poměřuje. Tato změna zavádí pro každou kategorii systémů (elektronická identita, doručování, platby, registry…) **vlastní mini-dashboard**, který kategorii rozloží na funkční požadavky („fíčury"), nefunkční požadavky a souvislosti: co takový systém má mít, co má jeho zahraniční protějšek, co nám chybí, kolik systémů dané třídy reálně provozujeme a kolik agend je na ně napojeno. Záměrně začínáme „úplně primitivně" — kostrou hierarchie **oblast → kategorie → systém**, na kterou se postupně věší ostatní pohledy (kvadranty z Změny 02, stupeň digitalizace z Změny 11, bezpečnostní úroveň z Změny 14). Bohdan use case označil za takový, který „extrémně pomůže".

## 2. Obchodní kontext a zdůvodnění (BRD)

Nástroj se DIA prezentuje jako *jejich* nástroj a jako **analýza rizik**, ne audit chyb. Současný `#/gap` dává makro-verdikt (matice 11 schopností `CAPABILITIES`, `app/app.js:1093–1125`), ale Bohdan se opakovaně ptal „jak probíhá to porovnání a proti čemu" — tedy chtěl rozpad pod každou dlaždici. Parafráze ze schůzky: dashboard je výborný, ale „ve chvíli, kdyby na rozkliknutí poskytl ještě nějakou opravdu primitivní svodku", byl by „úplně super". Obchodní hodnota pro DIA je dvojí. Za prvé **navigační páteř**: hierarchie oblast → kategorie → systém je kostra, do níž lze postupně zavěsit všechny analytické pohledy, takže DIA dostane jednu konzistentní mapu místo izolovaných obrazovek. Za druhé **vytvoření poptávky po datech**: tam, kde data chybí (počet napojených agend dané třídy, mapování systému na schopnost), mini-dashboard ukáže prázdné místo s popiskem „jak by to vypadalo, kdyby data byla" — a tím motivuje DIA pole doplnit. Pro krizové řízení je hodnota v tom, že kategorie (např. „základní registry") zpřehlední, které konkrétní systémy nese a jak jsou kritické.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / cílový uživatel | Bohdan Urban (DIA) | Pochopit „proti čemu" se porovnává; nástroj jako vlastní |
| Doménový expert RPP | Petr Kučera (PowerPatterns) | Korektní mapování systém ↔ kategorie ↔ schopnost |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Vyznění „kam se vydat", ne „co je špatně" |
| Autor / vývojář | Jakub Bareš (Metamatics) | Implementace v `app.js` + ETL, idempotence |
| Pracovní skupina | PS07 kGovernment | Konzistence se znalostní vrstvou |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-01-1 | Každá kategorie schopnosti z `CAPABILITIES` má klikací dlaždici vedoucí na vlastní mini-dashboard (route `#/oblast/<klíč>`). |
| FR-01-2 | Mini-dashboard rozkládá kategorii na sekce: Funkční požadavky („fíčury") · Nefunkční požadavky · Souvislosti (vazby na jiné kategorie). |
| FR-01-3 | U každé fíčury stav: máme / částečně / chybí + odkaz na zahraniční protějšek. |
| FR-01-4 | Mini-dashboard zobrazí metriky z RPP: počet systémů dané kategorie a počet napojených agend. |
| FR-01-5 | Tam, kde CZ systém v RPP existuje, je proklik (↗) na jeho detail (`#/isvs/<id>`). |
| FR-01-6 | Navigační hierarchie oblast → kategorie → systém jako drobečková navigace (breadcrumb). |
| FR-01-7 | Chybějící data se zobrazí jako placeholder „neuvedeno / kdyby data byla", ne jako nula. |

**Nefunkční**

- **NFR-01-1 (výkon):** mini-dashboard se renderuje z předpočítaného `oblasti.json`, bez dopočtu nad 12 110 ISVS v prohlížeči (< 300 ms).
- **NFR-01-2 (bezpečnost):** výhradně veřejná open data RPP + odborné poznámky skupiny; žádný neveřejný zdroj.
- **NFR-01-3 (čeština):** všechny popisky a stavy česky, dům-styl.
- **NFR-01-4 (přístupnost):** dlaždice a chipy s textovým ekvivalentem, ne jen barvou.
- **NFR-01-5 (idempotence ETL):** přiřazení systém→kategorie se počítá v ETL deterministicky (drop & rebuild).

## 5. User stories / use cases

- Jako **expert DIA** chci po kliknutí na „eID" vidět, které systémy a fíčury se za verdiktem skrývají, abych pochopil, proti čemu se porovnáváme.
- Jako **stratég AFCEA** chci u kategorie vidět chybějící fíčury vedle zahraničních, abych ukázal „kam se vydat".
- Jako **krizový analytik** chci u kategorie „základní registry" vidět seznam konkrétních systémů a počet napojených agend, abych odhadl dopad výpadku třídy.
- Jako **uživatel** chci proklik z fíčury na reálný detail systému, abych ověřil, že nejde o dojem, ale o data RPP.

## 6. Datový model a zdroje dat

Zdroj: `app/data/isvs.json` (12 110 systémů, pole `bezuroven`, `agendy[]`, `spravce`), `app/data/agendy.json`, `app/data/meta.json` (distribuce `isvs_bezuroven`, `top_critical`, `top_spread`). Nová struktura **`app/data/oblasti.json`** generovaná ETL:

```json
{
  "eid": {
    "nazev": "Elektronická identita (eID)",
    "vrstva": "Identita a autentizace",
    "ficury": [{"nazev":"...", "stav":"partial", "ex":"MitID 🇩🇰"}],
    "nfr": ["dostupnost 99,9 %", "úroveň záruky vysoká"],
    "souvislosti": ["registry", "portal"],
    "systemy": ["isvs/…"],
    "pocet_systemu": 0, "pocet_agend": 0
  }
}
```

**Co chybí v RPP:** explicitní příznak „tento ISVS realizuje schopnost X" — RPP nemá taxonomii schopností. Mapování systém→kategorie proto vzniká heuristicky (slovník známých systémů, jako u rodin produktů v `#/gap`) a kde nelze, zůstává prázdné s disclaimerem.

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** nová funkce, která pro každou položku `CAPABILITIES` slovníkem přiřadí kandidátní ISVS (whitelist znamých systémů jako u `top_critical`), spočítá `pocet_systemu` a `pocet_agend`, a uloží `app/data/oblasti.json`. Idempotentní, drop & rebuild.
- **`app/app.js`:** nová route `#/oblast/<klíč>` a render funkce `oblast()` po vzoru `gap()` (`app/app.js:1127`). Dlaždice na `#/gap` a na dashboardu dostanou `href="#/oblast/<klíč>"`. Drobečková navigace přes `routeOf` (`app/app.js:33`).
- **Datový tok:** RPP JSON → ETL přiřazení → `oblasti.json` → `oblast()` render → proklik na `#/isvs/<id>`.
- **Integrace:** sdílí chip helpery `matChip`/`gapChip` (`app/app.js:1130–1131`) a slovník schopností; neduplikuje data.

## 8. UI/UX

Route `#/oblast/<klíč>`. Hlavička s breadcrumbem „Architektura státu › Identita › eID". Tři karty: **Fíčury** (tabulka název | stav-chip | zahraniční protějšek), **Nefunkční požadavky** (seznam), **Souvislosti** (chipy odkazující na sourozenecké kategorie). Pod nimi KPI dlaždice „Systémů: N · Napojených agend: M" a tabulka systémů s proklikem. Vše záměrně „primitivní" — žádné grafy v MVP. Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze **v8.0**, tag „Mini-dashboardy oblastí", step `{icon:'🗂️', title:'Rozklik kategorie na fíčury', route:'#/oblast/eid'}`.

## 9. Akceptační kritéria

1. Klik na dlaždici „eID" v `#/gap` vede na `#/oblast/eid` bez `window.onerror`.
2. Mini-dashboard zobrazí ≥ 3 fíčury se stavem a zahraničním protějškem.
3. KPI „Systémů" a „Napojených agend" odpovídají hodnotám z `oblasti.json`.
4. Aspoň jeden systém má funkční proklik na `#/isvs/<id>`.
5. Kategorie bez namapovaných systémů ukáže placeholder „kdyby data byla", ne nulu bez vysvětlení.
6. `node --check app/app.js` projde; ETL po `python3 etl/build_client_data.py` vygeneruje `oblasti.json` idempotentně.
7. Novinka je v průvodci (`#/pruvodce`) jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko mapování:** heuristické přiřazení systém→kategorie může být nepřesné (stejný problém jako rodiny produktů). Mitigace: slovník + disclaimer „odvozeno".
- **Závislost:** sdílí slovník schopností se Změnou 02 (kvadranty) — vyvíjet společně.
- **Otázka na DIA:** existuje v DIA interní taxonomie schopností/služeb, kterou lze místo heuristiky použít? Lze RPP rozšířit o příznak schopnosti?
- **Otázka:** chceme oblasti definovat shora (11 schopností) nebo zdola (shluky systémů)? MVP jde shora.

## 11. Fázování a hrubý odhad

- **MVP do pátku:** route `#/oblast/<klíč>`, statické fíčury/NFR ve slovníku, KPI z ETL, proklik na systémy, 1 zápis do CHANGELOG. ~1 den.
- **Fáze 2:** zavěšení kvadrantu (Změna 02) a stupně digitalizace (Změna 11) přímo do mini-dashboardu; profilace mapování člověkem.
- **Fáze 3:** plné napojení na znalostní vrstvu (oblast → činnost → zdroj).
