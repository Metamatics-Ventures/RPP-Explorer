# 09 — Konsolidace duplicitních názvů systémů

> **Změna 09 — Konsolidace duplicitních názvů systémů** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Tentýž informační systém je v RPP veden pod mnoha různými názvy. Petr Kučera to na poradě shrnul jednou větou: „Ten jeden informační systém se tam jmenuje šesti různými názvy." Jakub při přípravě prototypu data ručně čistil — „dávaly se dohromady podobné názvy, abychom zjistili" skutečný počet systémů a jejich vazby. Tato změna povyšuje tehdejší jednorázové čištění na **trvalou funkci nástroje**: automatická detekce a **návrh slučování** pravděpodobně duplicitních názvů téhož systému (fuzzy matching) s **lidským potvrzením** ve stylu „tyto 3 záznamy jsou možná tentýž systém — sloučit?". Bez konsolidace jsou všechny ostatní analýzy — počet systémů, mapa závislostí, koncentrace rizika — **zkreslené**. Funkce navazuje na již nasazenou mapovací vrstvu „rodina" v ETL (`etl/build_client_data.py`, viz dok. 06 řádek 46) a přidává k ní **viditelný log** „kolik duplicit nástroj našel" — silný argument o kvalitě dat státu. Klíčové: konsolidace **se nedělá tiše na pozadí** a **nejde o velký schvalovací číselník** (ten „nikdy nefunguje") — je to mapovací vrstva nad daty **bez přepisu zdroje**.

## 2. Obchodní kontext a zdůvodnění (BRD)

Problém je doložen z obou stran. Petr Kučera, který RPP zná zevnitř, popsal, že jeden systém nese až šest názvů — protože každá obec/úřad si název píše po svém („KEO" vs „KEO 4" vs „KEO X Hosting", lišící se i jen mezerou; doloženo už v dok. 06, připomínka C14). Jakub při tvorbě prototypu musel názvy ručně shlukovat, aby vůbec zjistil skutečný počet instalací a vazeb. Dopad je systémový: pokud se jeden systém počítá jako šest, pak je nafouknutý počet systémů, rozmělněná mapa závislostí a podhodnocená koncentrace rizika (jeden produkt vypadá jako šest nezávislých, ač padne najednou).

Hodnota pro DIA je dvojí. Za prvé **korektnost všech analýz** — bez konsolidace nelze věřit žádnému číslu o systémech. Za druhé **silný governance argument**: viditelný log „nástroj automaticky našel N pravděpodobných duplicit" je hmatatelný důkaz o stavu dat, který DIA může použít jako podklad pro metodickou pomoc správcům. Důležité jsou tři meze dané poradou a 19. schůzkou: (1) **ne velký schvalovací číselník** — centrální registrační číselník produktů „nikdy nefunguje"; řešením je mapovací vrstva nad daty, která zdroj nepřepisuje; (2) **lidské potvrzení** — automat jen navrhuje, slučuje člověk; (3) **nedělat to tiše** — proces a jeho výsledky musí být viditelné, protože samotné číslo nalezených duplicit je hodnotný výstup.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / správce RPP | Bohdan Urban (DIA) | Korektní počty; mapovací vrstva bez zásahu do zdroje |
| Iniciátor problému | Petr Kučera (PowerPatterns) | „Jeden systém = šest názvů"; věcná správnost slučování |
| Autor / vývojář | Jakub Bareš (Metamatics) | Fuzzy matching, UI potvrzení, log, idempotence |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Log duplicit jako argument o kvalitě dat |
| Kdokoli potvrzující | Expert skupiny / DIA | Lidské rozhodnutí „sloučit / nesloučit" |
| Pracovní skupina | PS07 kGovernment | Konzistence se znalostní vrstvou a Změnou 08 |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-09-1 | Automat **detekuje pravděpodobné duplicitní názvy** téhož systému (fuzzy matching nad názvy ISVS). |
| FR-09-2 | Pro každý shluk nástroj **navrhne sloučení** s formulací „tyto N záznamů jsou možná tentýž systém — sloučit?". |
| FR-09-3 | Slučování vyžaduje **lidské potvrzení**; automat nikdy neslučuje sám. |
| FR-09-4 | Konsolidace je **mapovací vrstva** (rodina/kanonický název), **nepřepisuje zdrojová data**. |
| FR-09-5 | Nástroj vede **viditelný log**: kolik duplicit našel, kolik bylo potvrzeno/zamítnuto. |
| FR-09-6 | Po potvrzení se analýzy (počet systémů, mapa, koncentrace rizika) počítají nad **kanonickými** systémy. |
| FR-09-7 | Funkce **NENÍ** centrální schvalovací číselník; je to lehká mapovací vrstva nad daty. |
| FR-09-8 | Proces probíhá **viditelně**, ne tiše na pozadí. |

**Nefunkční**

- **NFR-09-1 (žádný přepis zdroje):** zdrojové názvy zůstávají; mapování je oddělená vrstva (jako stávající `rodina`).
- **NFR-09-2 (transparentnost):** každý návrh i potvrzení je auditovatelný (kdo, kdy, na základě jaké shody).
- **NFR-09-3 (výkon):** fuzzy matching se počítá v ETL; UI pracuje s předpočítanými kandidáty.
- **NFR-09-4 (idempotence):** detekce kandidátů deterministická (drop & rebuild); potvrzení perzistentní.
- **NFR-09-5 (čeština + open data):** vše česky; výhradně veřejná open data RPP.

## 5. User stories / use cases

- Jako **expert DIA** chci vidět návrhy „tyto 3 záznamy jsou možná KEO" a potvrdit/zamítnout, abych nemusel slučovat ručně.
- Jako **analytik** chci, aby počet systémů a mapa závislostí počítaly s kanonickými systémy, aby čísla nebyla nafouknutá.
- Jako **stratég AFCEA** chci log „nástroj našel N duplicit", abych měl hmatatelný argument o kvalitě dat státu.
- Jako **správce RPP** chci jistotu, že se zdrojová data nepřepisují, jen mapují, aby zůstala auditovatelná.
- Jako **uživatel** chci u sloučeného systému vidět, které původní názvy se pod něj sbíhají, abych chápal, co se stalo.

## 6. Datový model a zdroje dat

Zdroj: `app/data/isvs.json` (12 110 systémů, pole `nazev`, `rodina`, `rodina_pocet`, `rodina_slovnik`, `spravce`). Stávající rodina už shlukuje ze slovníku známých produktů a z přesné shody názvu u ≥ 2 instalací (`app/app.js:479`, `app/app.js:1142–1143`). Tuto vrstvu rozšiřujeme o **fuzzy kandidáty** a o **stav potvrzení**. Nová sada **`app/data/dup_candidates.json`**:

```json
{
  "kandidati": [
    {"id":"dup-001", "kanonicky_navrh":"KEO",
     "clenove":["isvs/213","isvs/2038","isvs/890"],
     "nazvy":["KEO 4","KEO X Hosting","KEO4"],
     "skore_shody":0.92, "duvod":"fuzzy nad názvem",
     "stav":"navrzeno"}
  ],
  "log":{"nalezeno":134,"potvrzeno":0,"zamitnuto":0}
}
```

Potvrzení správce se ukládá do mapovací vrstvy (kanonický název → členové) **bez** zápisu do zdrojových polí. Pole pro výpočet shody: normalizovaný `nazev` (mezery, verze, „Hosting/SQL/v3" sufixy). Návaznost: kanonické systémy vstupují do `top_critical`, `top_spread` a do žebříčku rozšíření (`app/app.js:1182–1187`).

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** rozšířit stávající normalizaci rodin o **fuzzy shlukování** (např. token-set / Levenshtein nad normalizovaným názvem) → vygenerovat `dup_candidates.json` (kandidáti + log). Idempotentní, drop & rebuild. Sdílí normalizaci se Změnou 08 (duplicity jako jeden typ nálezu zdraví dat), aby se logika nepsala dvakrát.
- **`app/app.js`:** nová route `#/duplicity` s render funkcí `duplicity()` — seznam kandidátů, u každého tlačítka „Sloučit / Ponechat odděleně", a horní log „nalezeno N / potvrzeno / zamítnuto". Potvrzení se ukládá do `localStorage` (klientská perzistence) a aplikuje se na výpočty kanonických systémů. Žebříčky a mapa čtou kanonický identifikátor.
- **Datový tok:** RPP JSON → ETL fuzzy → `dup_candidates.json` → `duplicity()` UI → potvrzení → kanonická vrstva → ostatní analýzy.
- **Integrace:** sdílí mapovací vrstvu „rodina" a normalizaci se Změnou 08; výstupní log je argument pro Změnu 17.

## 8. UI/UX

Route `#/duplicity` (sekce Data/Analýza). Nahoře výrazný **log**: „Nástroj automaticky našel **N** pravděpodobných duplicit (jeden systém pod více názvy)" + počty potvrzeno/zamítnuto. Pod ním seznam kandidátů: každá karta = navrhovaný kanonický název, pod ním seznam členských záznamů s původními názvy a správci, skóre shody a důvod, a dvě tlačítka **„Sloučit do jednoho systému" / „Ponechat odděleně"**. Po sloučení se v detailu systému zobrazí „Pod tímto systémem sjednoceno: KEO 4, KEO X Hosting, KEO4 (zdroj nezměněn)". Tón neutrální, faktický, žádné obviňování. Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze, tag „Konsolidace názvů systémů", step `{icon:'🧷', title:'Návrhy sloučení duplicitních názvů + log nalezených duplicit', route:'#/duplicity'}`.

## 9. Akceptační kritéria

1. ETL vygeneruje `dup_candidates.json` idempotentně, s alespoň jedním reálným shlukem (např. KEO/GINIS varianty).
2. Route `#/duplicity` se renderuje bez `window.onerror`; zobrazí log nalezených duplicit a seznam kandidátů.
3. U kandidáta lze provést „Sloučit" i „Ponechat odděleně"; rozhodnutí přetrvá (perzistence).
4. Po sloučení počítají žebříčky/mapa s kanonickým systémem (počet systémů klesne o sloučené duplicity).
5. Zdrojová pole `nazev` zůstávají nezměněna; sloučení je jen mapovací vrstva (ověřitelné v detailu).
6. Nikde neběží automatické slučování bez potvrzení; proces je viditelný (ne na pozadí).
7. `node --check app/app.js` projde; novinka je v `#/pruvodce` jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko falešného sloučení:** fuzzy může spojit nesouvisející systémy (stejný kořen názvu, jiný produkt) — proto povinné lidské potvrzení a viditelné skóre shody.
- **Riziko falešného nesloučení:** příliš přísný práh nechá duplicity rozdělené. Mitigace: laditelný práh + zobrazení i „slabších" kandidátů.
- **Riziko perzistence:** klientský `localStorage` je per prohlížeč; sdílené rozhodnutí napříč týmem/DIA vyžaduje serverovou vrstvu (mimo statickou SPA). Pro MVP postačí klientsky + export.
- **Závislost:** sdílí normalizaci a katalog duplicit se Změnou 08; log je vstup pro Změnu 17.
- **Otázka na DIA:** Existuje (nebo má vzniknout) na straně DIA kanonický identifikátor produktu, na který lze mapovat? Chce DIA potvrzení duplicit centrálně (serverově), nebo stačí jako podklad pro metodiku? Jaký práh shody je akceptovatelný?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** fuzzy shlukování v ETL → `dup_candidates.json` + log, route `#/duplicity` s potvrzením (localStorage), aplikace na žebříčky, 1 zápis do CHANGELOG. ~1–1,5 dne (staví na existující rodině).
- **Fáze 2:** export potvrzených sloučení (CSV/JSON) pro DIA; provázání s `health.json` (Změna 08) jako typ nálezu „duplicitní názvy".
- **Fáze 3:** serverová/sdílená perzistence potvrzení (pokud DIA bude chtít týmové rozhodování); napojení kanonických systémů na celou mapu závislostí a koncentraci rizika.
