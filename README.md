# RPP Explorer

**Prozkoumatelný průzkumník českého Registru práv a povinností (RPP).** Stahuje veřejná open data RPP, přerestrukturalizuje je do lokální databáze, propojí přes identifikátory a umožní procházet a analyzovat celý graf státní správy — agendy, orgány veřejné moci, informační systémy, služby, údaje a oprávnění.

> Projekt vzniká v rámci pracovní skupiny **PS07 kGovernment, AFCEA Česká republika**, jako první konkrétní krok **znalostní vrstvy** nad státem.

---

## Jak projekt vznikl

RPP Explorer je realizací úkolu z jednání pracovní skupiny **PS07 Intelligence / kGovernment** (AFCEA ČR):

- **17. schůzka (29. 5. 2026), action item #4:** *„Ověřit u Institute of Effectivity stav mapování RPP; případně udělat dynamickou vizualizaci propojení systémů."* (odpovědný: Jakub Bareš)
- **17. schůzka, §7 — nové policy téma:** *Rizika a kaskádové dopady výpadku agendy/služby přes RPP* — celostátní pohled na to, „co se zbourá jako domeček z karet", když vypadne služba (např. ransomware útok jako na Slovensku). Technický podnět: Petr Kučera; vhodné pro mentora z DIA.
- **18. schůzka (5. 6. 2026), action item:** *„Prozkoumat OpenData zdroje z registru RPP a začít agregovat expertní znalostní bázi"* — s vazbou na krizové řízení, **společný operační obraz (CROP)** a „app pro premiéra".

Data a struktura aplikace tedy nejsou navržené „od stolu" — vycházejí z reálných potřeb skupiny a z analýzy skutečného schématu RPP open dat. Vývojová příprava (stažení dat, analýza schématu, návrhové dokumenty) byla provedena pomocí **Claude Code**.

## Odkud jsou data

Veřejná open data **Registru práv a povinností (RPP)**, jejichž správcem je **Digitální a informační agentura (DIA)**:

- **Endpoint:** https://rpp-opendata.egon.gov.cz/odrpp/datovasada/
- **Katalog:** [data.gov.cz](https://data.gov.cz) — poskytovatel IČO 17651921 (DIA)
- **Rozsah:** 56 datových sad ve formátu JSON (OFN — otevřené formální normy), ~840 MB
- **Frekvence aktualizace:** denní

Klíčové sady (počty záznamů): **agendy** (406), **ISVS / informační systémy** (12 110), **OVM / orgány veřejné moci** (19 555), **služby** (9 607), **údaje** (828 objektů), **oprávnění k údajům** (1 879) a **působnost v agendách** (957 582 vazeb) + 33 číselníků.

> Data **nejsou** součástí tohoto repozitáře (velikost, denní aktualizace). Stahuje je ETL skript (viz `docs/01`). Detailní soupis viz `RPP/README_RPP.md` v pracovním adresáři skupiny.

## Cíl

Udělat z roztříštěných RPP open dat **jednu prozkoumatelnou znalostní bázi**, ze které:

1. člen skupiny během pár minut vytáhne **citovatelné číslo, graf nebo vizualizaci kaskády** do policy paperu;
2. krizový koordinátor sestaví **kontextově relevantní operační obraz (CROP)** pro scénář;
3. vznikne základ pro **dynamickou vizualizaci propojení a kaskádových dopadů** výpadku služeb.

Severní hvězda: *„Není to o nástroji, je to o metodice — o práci s informacemi, jejich propojování a vytváření kontextu. K tomu potřebuješ znalostní vrstvu."*

## Architektura

```
RPP open data (JSON)  →  ETL (Python, streaming)  →  SQLite (+ FTS5)  →  FastAPI  →  React/Vite SPA
```

| Vrstva | Technologie | Role |
|---|---|---|
| Data | RPP open data (JSON) | zdroj |
| ETL | Python (`ijson`, `sqlite3`) | rozsekání nested struktur, propojení přes `id`, číselníky, FTS index |
| DB | **SQLite** + FTS5 | jeden přenositelný soubor, jádrové + vazební tabulky |
| API | **FastAPI** | stránkování, agregace, dopadové dotazy nad grafem |
| Frontend | **React + Vite + TypeScript** | SPA průzkumník (TanStack Table/Query, shadcn/ui) |
| Vizualizace | Cytoscape.js / react-force-graph, Recharts | graf vazeb, kaskády, dashboardy |

Data tvoří **graf** — entity na sebe odkazují stabilními identifikátory (`agenda/A1114`, `isvs/3`, `orgán-veřejné-moci/00288543`, `služba/S41947`, `údaj/101-1-1`), takže každý odkaz v UI je klikací a vede na detail. Číselníky (`cis_*`) se resolvují na lidsky čitelné popisky.

Podrobně viz [`docs/01_informacni-architektura.md`](docs/01_informacni-architektura.md).

## Funkce

- **Procházení a detaily** 6 jádrových entit (agendy, OVM, ISVS, služby, údaje, oprávnění) s filtry, řazením a proklikem na navázané entity.
- **Globální fulltext** (FTS5) napříč názvy a popisy, výsledky seskupené podle typu.
- **Dashboard** s klíčovými metrikami a pokrytím agend systémy.
- **Toky údajů / only-once** — kdo od koho čte které údaje, detekce duplicit a nesdílených údajů.
- **Dopady & kaskády** ★ — simulace výpadku služby/systému a propagace dopadu po řádech („domeček z karet"), vč. pojmenování mezery v cloudových závislostech.
- **Krizový balík (CROP)** — sestavení znalostní báze pro krizový scénář.
- **Graf vazeb** — interaktivní průzkum s expanzí uzlů.
- **Analytika** — kritičnost systémů, digitalizace služeb, cloud vs. on-premise, kaskádová zranitelnost.
- **Export & deep-linky** všude — CSV/JSON + trvalé odkazy s uvedením zdroje.

## Dokumentace

| Dokument | Obsah |
|---|---|
| [`docs/00_vize-a-kontext.md`](docs/00_vize-a-kontext.md) | vize znalostní vrstvy, kontext schůzek PS07, projekty |
| [`docs/01_informacni-architektura.md`](docs/01_informacni-architektura.md) | entitní model, graf, DB schéma, ETL, stack |
| [`docs/02_usecases.md`](docs/02_usecases.md) | persony a use cases s tím, jak je app řeší |
| [`docs/03_dekompozice-obrazovek.md`](docs/03_dekompozice-obrazovek.md) | sitemap, navigace, mapování obrazovka→use case |
| [`docs/04_funkce-obrazovek.md`](docs/04_funkce-obrazovek.md) | funkce každé obrazovky |
| [`docs/05_co-z-toho-udela-nejuzitecnejsi-nastroj.md`](docs/05_co-z-toho-udela-nejuzitecnejsi-nastroj.md) | killer funkce, UX základy, fázování |

## Stav

🚧 **Fáze návrhu.** Hotová jsou návrhová dokumentace a kompletní stažení + validace dat (56 sad). Implementace MVP (ETL → SQLite → API → React) je dalším krokem.

## Kdo a kontext

**PS07 kGovernment, AFCEA Česká republika** — expertní skupina (státní správa, průmysl, akademie) budující znalostní vrstvu pro strategické řízení státu v oblasti bezpečnosti, obrany a odolnosti. Spolupráce s **Centrem pro informovanou společnost (CIS / CEVRO)** na datově podložených policy paperech.

## Licence a data

Kód: viz `LICENSE` (TBD). Data RPP jsou open data DIA bez omezení autorských práv k distribucím; při použití uvádějte zdroj (RPP open data, DIA) a datum stažení.

---

*Repozitář: Metamatics-Ventures/RPP-Explorer. Vznikl jako výstup práce skupiny PS07 kGovernment, AFCEA ČR.*
