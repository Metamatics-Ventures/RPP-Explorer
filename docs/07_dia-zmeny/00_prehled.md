# 07 — Změny RPP Exploreru z porady DIA (přehled / index)

> **Zdroj:** porada **„DIA & AFCEA MapaStátu.cz"**, úterý **16. 6. 2026, 7:00** (Teams, přepis Fireflies `01KTYB7PRR7MKPRZHDBJ8903WZ`).
> **Účastníci:** Bohdan Urban (DIA — expert digitalizace), Petr Kučera (PowerPatterns; zná RPP zevnitř, dělá podklady pro DIA), Jaroslav Pejčoch (AFCEA — strategie a prezentace), Jakub Bareš (autor nástroje, Metamatics).
> **Navazuje:** rozšířená páteční schůzka (potvrzeno s Bohdanem, vzdáleně). Petr posílá link na vyhlášku o bezpečnostních úrovních IS.
> **Rámec:** nástroj se DIA prezentuje jako **jejich** nástroj a jako **analýza rizik** (ne audit chyb). Vše musí stát **pouze na otevřených datech** (Jaroslav: „to si může udělat každý — i Číňani"). Kde data nejsou, nástroj **ukáže hodnotu pohledu „jak by to vypadalo, kdyby data byla"** a tím vytvoří poptávku po jejich doplnění.

---

## Jak číst tuto složku

Každý soubor `NN_*.md` je samostatný **BRD + architektonický návrh** jedné změny (~1000–1500 slov) v dům-stylu projektu (sekce Účel → Obchodní kontext → Stakeholdeři → Funkční/Nefunkční požadavky → User stories → Datový model → Architektura → UI/UX → Akceptační kritéria → Rizika → Fázování). Návrhy odkazují na reálné komponenty: `etl/build_client_data.py`, `app/app.js`, `app/data/*.json`. Routy a nové datové struktury jsou **návrhy**, zatím neimplementované.

## Dvě priority na pátek (Bohdan je výslovně označil)

1. **Dashboard stavu digitalizace ČR + kvadranty/svodka po rozkliknutí** → změny **01, 02, 11, 14**.
2. **Analýza kritických agend** (formulář + mapování na systémy + kritéria z vyhlášky + nevypnutelný stát) → změny **03, 04, 05, 18**.

## Přehled změn

| # | Změna | Priorita | Klastr |
|---|---|---|---|
| 01 | [Mini-dashboard pro každou skupinu systémů (rozpad na fíčury)](01_mini-dashboard-skupin-systemu.md) | P1 | Dashboard |
| 02 | [Gartner kvadranty / svodka pozice ČR po rozkliknutí](02_gartner-kvadranty-pozice-cr.md) | P2 | Dashboard |
| 03 | [Formulář kritických agend (hlavní quick win)](03_formular-kritickych-agend.md) | P1 | Kritické agendy |
| 04 | [Automatické mapování agend na informační systémy](04_mapovani-agend-na-systemy.md) | P1 | Kritické agendy |
| 05 | [Hodnotící kritéria dle vyhlášky o bezp. úrovních IS](05_hodnotici-kriteria-vyhlaska.md) | P2 | Kritické agendy |
| 06 | [Texty, nápověda a „hesla" pro správce agend](06_napoveda-pro-spravce-agend.md) | P2 | Governance |
| 07 | [Systémy, na kterých stát „visí" (single point of failure)](07_systemy-na-kterych-stat-visi.md) | P1 | Závislosti |
| 08 | [Data governance vrstva — detekce chybějících/vadných dat](08_data-governance-vrstva.md) | P1 | Governance |
| 09 | [Konsolidace duplicitních názvů systémů](09_konsolidace-nazvu-systemu.md) | P1 | Governance |
| 10 | [Napojení na e-Sbírku zákonů jako druhý datový zdroj](10_napojeni-na-e-sbirku.md) | P2 | Zdroje dat |
| 11 | [Vizualizace stupně digitalizace agend (vstup + ISSS)](11_stupen-digitalizace-agend.md) | P1 | Dashboard |
| 12 | [Vylepšení mapy kritických závislostí mezi systémy](12_mapa-kritickych-zavislosti.md) | P1 | Závislosti |
| 13 | [Katalog cloudových služeb a cloudové závislosti](13_katalog-cloudovych-sluzeb.md) | P2 | Závislosti |
| 14 | [Bezpečnostní úroveň IS jako plnohodnotná dimenze](14_bezpecnostni-uroven-is-dimenze.md) | P2 | Dashboard |
| 15 | [Stav a typ API jako parametr systému](15_stav-a-typ-api.md) | P3 | Závislosti |
| 16 | [Rámec pro agentní vytěžování dokumentace (DSP)](16_ramec-vytezovani-dokumentace.md) | P3 (samostatný směr) | Zdroje dat |
| 17 | [Veřejná nástěnka / gamifikace pro motivaci správců](17_verejna-nastenka-gamifikace.md) | P3 | Governance |
| 18 | [„Stát, který se nedá vypnout" — kritické agendy offline](18_stat-ktery-se-neda-vypnout.md) | P2 | Kritické agendy |
| 19 | [Pohledy „kde můžeme být lepší" + demonstrace bez dat](19_pohledy-kde-muzeme-byt-lepsi.md) | P1 | Akční pohledy |
| 20 | [Ad-hoc dotazování nad daty v přirozeném jazyce](20_ad-hoc-dotazovani.md) | P2 | Akční pohledy |

## Provázanost změn

- **Kritické agendy:** 03 (formulář) je základ; 04 (mapování na systémy), 05 (kritéria z vyhlášky) i 18 (nevypnutelný stát) na něj navazují a sdílejí jednu sbíranou sadu. 03 zavádí **první zápisový/sběrový tok** v dosud read-only SPA (viz architektonická rozvaha v souboru 03).
- **Bezpečnostní úroveň:** 05 (sběr dle vyhlášky) ↔ 14 (dimenze) ↔ 13 (kritické systémy mimo komerční cloud).
- **Závislosti:** 07 (koncentrační uzly) ↔ 12 (mapa) ↔ 13 (cloud) ↔ 04 (kritické agendy na mapě).
- **Governance:** 06 (nápověda/chyby) ↔ 08 (automatická detekce) ↔ 09 (duplicity) ↔ 17 (gamifikace nad skóre z 08).
- **Zdroje & akční pohledy:** 10 (e-Sbírka) a 16 (DSP) rozšiřují datovou základnu; 19 (kde být lepší) a 20 (NL dotazy) z ní těží.

## Otevřené body pro páteční schůzku

- Prerekvizity a hodnotící kritéria kritických agend (Bohdan navrhl klidně 2 hodiny) — vstup do 03/05/18.
- Vyhláška o bezpečnostních úrovních IS (Petr pošle link) — vstup do 05/14.
- Potvrzení use case z programu **Byvoj** / **Digitální suverenity** („stát, který se nedá vypnout") — vstup do 18.
- Co konkrétně by pro DIA bylo nejužitečnější jako první report (vstup do 19/20).
