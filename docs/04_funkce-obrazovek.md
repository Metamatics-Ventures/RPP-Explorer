# 04 — Funkce jednotlivých obrazovek

Pro každou obrazovku: účel, komponenty, filtry, sloupce, interakce, drill-down.

---

## A. Dashboard `/`
**Účel:** rychlý přehled stavu a vstupní body do analýz.
- **KPI dlaždice:** 406 agend · 12 110 ISVS · 19 555 OVM · 9 607 služeb · 828 objektů údajů · 1 879 oprávnění.
- **Dlaždice „Pokrytí agend":** % agend bez ISVS (UC1) → klik vede na filtrovaný seznam.
- **Graf:** ISVS podle bezpečnostní úrovně; ISVS podle umístění (cloud/on-prem); služby podle typu.
- **Top 10 nejkritičtějších systémů** (dle počtu agend) → klik na detail.
- **Poslední změny** (dle `poslední-změna`).

## B. Seznam agend `/agendy`
- **Sloupce:** kód, název, ohlašovatel (OVM), #činností, #ISVS, #služeb, platnost od.
- **Filtry/fasety:** ohlašovatel/resort, má/nemá ISVS, má definici služeb/údajů, platnost.
- **Interakce:** řazení, fulltext v rámci seznamu, výběr řádků → export, klik → detail.

## C. Detail agendy `/agendy/:id`
**Karta agendy se záložkami:**
- **Přehled:** název, kód, ohlašovatel, stanoviska (služby/údaje), odkazy na eSbírku.
- **Činnosti:** tabulka (kód, název, popis, volitelný výkon, § eSbírka jako odkaz).
- **Vykonávající OVM:** seznam orgánů (z `pusobnost`) → klik na profil úřadu.
- **Informační systémy:** ISVS podporující agendu → klik na detail.
- **Služby:** služby pod agendou.
- **Údaje:** objekty a údaje agendy (typ, sdílení na PPDF).
- **Oprávnění:** co agenda čte z jiných agend a co čtou jiní z ní (UC2).

## D. Seznam OVM `/ovm`
- **Sloupce:** IČO, název, právní forma, kategorie, #agend, #ISVS, #služeb.
- **Filtry:** kategorie OVM, právní forma, jen/bez vnitřní jednotky, má datovou schránku.
- Klik → profil úřadu.

## E. Detail OVM `/ovm/:id` (profil úřadu)
- **Přehled:** IČO, název, adresa sídla, osoba v čele, datové schránky, kategorie, právní forma.
- **Vykonávané agendy** (z `pusobnost`).
- **Spravované ISVS** (z `isvs.správce`).
- **Poskytované služby** (z místní příslušnosti / poskytovatel).

## F. Seznam ISVS `/isvs`
- **Sloupce:** identifikátor, název, správce (OVM), bezpečnostní úroveň, úroveň sdílení/využití, umístění, etapa, #agend.
- **Filtry/fasety:** bezpečnostní úroveň, umístění (cloud/on-prem), etapa (provoz/rozvoj/útlum), správce.
- **Sloupec „kritičnost":** počet navázaných agend (UC4).

## G. Detail ISVS `/isvs/:id`
- **Přehled:** název, charakteristika, verze, vytvoření/změna, umístění, bezpečnostní úroveň, úroveň sdílení/využití, etapa.
- **Správa:** správce (OVM) + kontakty.
- **Podporované agendy** (`isvs.agendy[]`).
- **Související služby a údaje** (odvozené přes agendu).

## H. Seznam služeb `/sluzby`
- **Sloupce:** identifikátor, název, agenda, typ služby, klienti (FO/PO/PFO), poskytovatel, #úkonů.
- **Filtry:** typ služby, typ klienta, agenda, povinnost sběru adresy, (digitální dostupnost z úkonů).

## I. Detail služby `/sluzby/:id`
- **Přehled:** název, popis, typ, povinnost sběru adresy.
- **Agenda a činnosti** (odkazy).
- **Klienti** (typy subjektů).
- **Místní příslušnost:** poskytovatelé (OVM) podle typu subjektu/působnosti.
- **Úkony:** rozpad úkonů a obslužných kanálů (digitální/osobní).

## J. Katalog údajů `/udaje`
- **Strom/tabulka:** objekt-subjekt → jednotlivé údaje.
- **Sloupce údaje:** kód, název, typ údaje (vlastní/přebíraný), veřejný/neveřejný, sdílen na PPDF, agenda.
- **Filtry:** sdílen/nesdílen na PPDF (UC3), typ údaje, veřejnost, agenda.

## K. Toky údajů / Oprávnění `/opravneni`
**Nejsilnější analytická obrazovka (UC2, UC3).**
- **Matice agenda × agenda:** kdo od koho čte (heatmapa intenzity).
- **Seznam oprávnění:** z-agendy → do-agendy, typ oprávnění, #údajů, R/W, referenční rozhraní.
- **Detail oprávnění `/opravneni/:id`:** seznam konkrétních údajů s úrovní přístupu a rolemi.
- **Pohled „pro agendu X":** vstupní a výstupní toky.

## L. Graf vazeb `/graf`
- **Plátno** (Cytoscape): uzly = entity (barva dle typu), hrany = vazby.
- **Interakce:** klik na uzel → expanze sousedů; dvojklik → detail; filtr typů hran/uzlů; vyhledání uzlu.
- **Režimy:** ego-graf (od jednoho uzlu), závislosti ISVS, toky údajů mezi agendami.

## L2. Dopady & kaskády `/dopady` ★ vlajková (UC13)
**Účel:** ukázat „co se zbourá jako domeček z karet", když vypadne služba/agenda/systém — podklad pro policy paper *Rizika a kaskádové dopady*.
- **Výběr výchozího uzlu:** ISVS / služba / agenda / OVM (hledáním nebo z detailu tlačítkem „Simuluj výpadek").
- **Propagace výpadku:** algoritmus projde závislé hrany a spočítá zasažené entity po **řádech** (1. řád = přímo navázané, 2. řád = navázané na ně, …).
- **Výstup:**
  - **Dominó vizualizace** (graf zvýrazněných zasažených uzlů, barva dle řádu dopadu).
  - **Tabulka dopadů:** zasažené agendy / služby / orgány, řád, typ vazby, počet dotčených.
  - **Souhrn:** „výpadek X zasáhne N agend, M služeb, K orgánů".
- **Vlajka gapu:** označení, kde RPP neobsahuje informaci o **cloudových závislostech** → „neznámá závislost" (pojmenování mezery ve standardu OHA).
- **Export** scénáře dopadu (CSV/JSON) + deep-link.

## L3. Krizový balík (CROP) `/krizovy-balik` (UC14)
**Účel:** sestavit statickou znalostní bázi pro krizový scénář / společný operační obraz.
- **Vstup:** klíčová slova / témata (požár, povodeň, krizové řízení) — fulltext nad agendami a jejich popisy.
- **Výběr:** uživatel zaškrtá relevantní agendy → systém přibalí jejich služby, vykonávající orgány, údaje a zdroje dat.
- **Výstup:** strukturovaný „balík" (JSON) připravený k napojení živých dat; náhled jako přehledová karta scénáře.

## M. Analytika `/analytika`
Předpřipravené sestavy s grafy + tabulkou + exportem:
- **Pokrytí agend systémy** (UC1).
- **Kritičnost systémů** (žebříček + bezpečnost) (UC4).
- **Digitalizace služeb** (el. vs. osobní) (UC9).
- **Cloud vs. on-premise / etapy** (UC10).
- **Duplicity a sdílení údajů** (UC3).
- **Kaskádová zranitelnost** — žebříček systémů/služeb podle dosahu výpadku (blast radius) (UC13).

## N. Srovnání `/srovnani`
- Výběr 2–4 entit (agend/OVM/resortů) → tabulka metrik vedle sebe + radarový/sloupcový graf + export (UC8).

## O. Globální vyhledávání `/hledat`
- FTS5 napříč názvy/popisy. Výsledky **seskupené podle typu** (Agendy / OVM / ISVS / Služby / Údaje), zvýraznění shod, klik → detail (UC7).
