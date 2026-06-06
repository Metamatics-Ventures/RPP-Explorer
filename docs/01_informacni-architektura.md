# 01 — Informační architektura aplikace RPP Explorer

Cíl aplikace: **prozkoumatelný průzkumník celého Registru práv a povinností** — uživatel může procházet agendy, orgány, informační systémy, služby, údaje a oprávnění a sledovat vazby mezi nimi až do detailu. Data se z JSON přerestrukturalizují do lokální databáze a propojí přes identifikátory.

---

## 0. Kontext a vize (proč to stavíme)

RPP Explorer není samoúčelný prohlížeč dat — je to **první konkrétní krok znalostní vrstvy** (Knowledge Layer), kterou buduje pracovní skupina **PS07 kGovernment (AFCEA ČR)**. Vychází přímo z úkolu 17. schůzky (29. 5. 2026, bod 7 a action item #4): *„udělat dynamickou vizualizaci propojení systémů"* nad RPP a z úkolu 18. schůzky (5. 6. 2026): *„Prozkoumat OpenData zdroje z registru RPP a začít agregovat expertní znalostní bázi"*.

**Problém (rezortismus):** Stát generuje obrovské množství dat, ale ta jsou uvězněná v **izolovaných resortních silech**. Neexistuje celostátní pohled na to, jak jsou agendy, systémy a služby vzájemně provázané — a tedy ani na to, **co se „zbourá jako domeček z karet", když vypadne jedna služba či agenda** (např. ransomware útok jako na Slovensku).

**Vize znalostní vrstvy:** sdílená, strojově čitelná mezivrstva metadat, pravidel a přístupů nad distribuovanými zdroji státu (data zůstávají u poskytovatelů; Governance as Code; MCP jako rozhraní; rozšíření RPP o identitu AI agentů). RPP je v této vizi páteř — mechanismus, přes který si systémy navzájem žádají o data.

**Jak do toho zapadá RPP Explorer:** zhmotňuje **graf propojení** z veřejných RPP open dat a dělá ho prozkoumatelným a analyzovatelným. Tím obsluhuje tři konkrétní cíle skupiny:
1. **Dopadová / kaskádová analýza** (policy paper *„Rizika a kaskádové dopady výpadku agendy/služby"*, mentor z DIA) — viz UC13 v dok. 02.
2. **Společný relevantní operační obraz (CROP — Context Relevant Operation Picture)** pro krizové řízení a „app pro premiéra".
3. **Datově podložené policy papery** pro spolupráci s CIS (Centrum pro informovanou společnost) / CEVRO.

Detailní rozpracování vize a vazby na metodiku (ontologie hřiště/hráči/aktivity, OODA, Governance as Code, NIPS) je v dokumentu **00_vize-a-kontext.md**.

---

## 1. Zdrojová data → entity

Data jsou v OFN JSON, záznamy pod klíčem `položky`. Každý záznam má stabilní textový identifikátor (`id`) ve tvaru `typ/kód`, kterým na sebe sady odkazují. To je hotový graf — stačí ho zhmotnit.

| Entita | Soubor | Záznamů | Klíč (id) |
|---|---|---|---|
| Agenda | `agendy.json` | 406 | `agenda/A1114` |
| Činnost (agendy) | uvnitř `agendy.json` | ~tisíce | `činnost/A1114/CR6661` |
| ISVS (informační systém) | `isvs.json` | 12 110 | `isvs/3` |
| OVM (orgán veřejné moci) | `ovm.json` | 19 555 | `orgán-veřejné-moci/00288543` |
| Služba | `sluzby.json` | 9 607 | `služba/S41947` |
| Objekt/údaj | `udaje.json` | 828 objektů → tisíce údajů | `objekt-subjekt/3-2`, `údaj/3-2-1` |
| Oprávnění k údajům | `opravneni_k_udajum.json` | 1 879 | `oprávnění.../A1441-A101-12` |
| Působnost v agendách | `pusobnost_v_agendach.json` | 957 582 | vazební záznamy OVM↔agenda |
| Role | `role.json` | 17 980 | `role/...` |
| SPUU (soukromopráv. uživatel) | `spuu.json` | 16 669 | |
| Kategorie OVM / SPUU | `kategorie_*.json` | 184 / 13 | `kategorie-ovm/KO14` |
| Číselníky (dimenze) | `cis_*.json` (33) | — | `typ-údaje/VLASTNI`, `umístění-isvs/ON_PREMISE` |

---

## 2. Model vazeb (graf)

Skutečné vazby zjištěné z dat:

```
                ┌──────────── pusobnost_v_agendach (957k) ────────────┐
                ▼                                                      ▼
   AGENDA ◄──── vykonává ──── OVM ──── správce ────► ISVS ──── podporuje ────► AGENDA
     │  ▲                      │ ičo                  │ bezpečnostní-úroveň
     │  │                      │ kategorie            │ úroveň-sdílení/využití
     │  │ agenda               │ právní-forma         │ umístění (cloud/on-prem)
     │  │                      ▼                       │ aktuální-typ-etapy
     │  └── SLUŽBA ── poskytovatel(OVM), klienti[], úkony[], typ-služby
     │         │ činnosti[]
     │         ▼
     │      ČINNOST (agendy)
     │
     ├── ÚDAJE (objekt-subjekt → jednotlivé údaje, typ-údaje, sdílen-na-PPDF)
     │
     └── OPRÁVNĚNÍ: z-agendy ──► do-agendy, na úrovni jednotlivých údajů (R/W), přes role
```

**Klíčové hrany pro analýzy:**
- `isvs.agendy[]` → ISVS podporuje agendu (pokrytí).
- `isvs.správa-isvs.správce-isvs` → OVM provozuje ISVS.
- `pusobnost_v_agendach` → který OVM vykonává kterou agendu (957k vazeb).
- `sluzby.agenda` + `sluzby.poskytovatel` → kdo poskytuje službu pod jakou agendou.
- `opravneni_k_udajum.z-agendy / do-agendy / údaje[].úroveň-přístupu` → **tok dat mezi agendami** (princip „only-once").
- `udaje.údaje[].sdílen-na-PPDF` → sdílení údaje přes propojený datový fond.

---

## 3. Databázové schéma (lokální, SQLite/DuckDB)

Normalizováno na jádrové tabulky + vazební (junction) tabulky + číselníky. Číselníky drží lidsky čitelné popisky, aby se v UI místo `umístění-isvs/ON_PREMISE` zobrazilo „On-premise".

**Jádrové tabulky**
```sql
agenda(id PK, kod, nazev, ohlasovatel_ovm_id, platnost_od, posledni_zmena,
       stanovisko_sluzby, stanovisko_udaje, def_ais, def_sluzby, def_udaje)
cinnost(id PK, agenda_id FK, kod, nazev, popis, volitelny_vykon, platnost_od)
isvs(id PK, identifikator, nazev, charakteristika, spravce_ovm_id FK,
     umisteni_code FK, bezpecnostni_uroven_code FK, uroven_sdileni_code FK,
     uroven_vyuziti_code FK, typ_etapy_code FK, vytvoreni, posledni_zmena)
ovm(id PK, ico, nazev, pravni_forma_code FK, adresa, osoba_v_cele,
    vnitrni_jednotka BOOL, zahajeni)
sluzba(id PK, identifikator, nazev, popis, agenda_id FK, typ_sluzby_code FK,
       povinnost_sberu_adresy_code FK)
objekt_subjekt(id PK, kod, nazev, popis, agenda_id FK)
udaj(id PK, objekt_id FK, kod, nazev, popis, typ_udaje_code FK,
     sdilen_ppdf_code FK, verejny BOOL)
opravneni(id PK, kod, typ_code FK, z_agenda_id FK, do_agenda_id FK,
          ref_rozhrani BOOL)
ciselnik(domena, code PK, nazev, popis)   -- sjednocené cis_* (33 souborů)
```

**Vazební tabulky (M:N)**
```sql
isvs_agenda(isvs_id, agenda_id)                      -- ISVS podporuje agendu
pusobnost(ovm_id, agenda_id, ...)                    -- 957k řádků; indexovat obě FK
sluzba_cinnost(sluzba_id, cinnost_id)
sluzba_klient(sluzba_id, typ_subjektu_code)
sluzba_mistni_prislusnost(sluzba_id, ovm_id, typ_subjektu_code, typ_pusobnosti_code)
ovm_kategorie(ovm_id, kategorie_code, od, prime)
opravneni_udaj(opravneni_id, udaj_id, uroven_pristupu)  -- R / W
opravneni_role(opravneni_id, role_id)
agenda_ovm(agenda_id, ovm_id)                        -- vykonávající OVM
agenda_kategorie_ovm(agenda_id, kategorie_code)
```

**Indexy** (kvůli 957k řádkům působnosti a rychlému drill-downu): na všech FK ve vazebních tabulkách, plus full-text index nad `nazev`/`popis` (SQLite FTS5) pro globální vyhledávání.

---

## 4. ETL (JSON → DB)

Jeden Python skript `etl/build_db.py`:
1. Načte každý soubor (`pusobnost` streamovaně — `ijson` kvůli 662 MB).
2. Pro jádrové entity rozseká nested struktury (činnosti z agend, údaje z objektů, úkony ze služeb) do samostatných tabulek.
3. Vazby uloží do junction tabulek s odkazy na `id`.
4. Číselníky `cis_*` sloučí do jedné tabulky `ciselnik(domena, code, nazev)`.
5. Postaví FTS5 index. Výstup: `rpp.sqlite` (odhad ~300–500 MB).

ETL je idempotentní (drop & rebuild), aby šlo znovu spustit po aktualizaci open dat (denní frekvence).

---

## 5. Technologický stack

| Vrstva | Volba | Proč |
|---|---|---|
| DB | **SQLite** (+ FTS5) | jeden soubor, žádný server, snadné sdílení v týmu |
| ETL | Python (`ijson`, `sqlite3`) | zvládne streamování velkých JSON |
| Backend API | **FastAPI** (Python) | tenká REST/GraphQL vrstva nad SQLite, stránkování, agregace |
| Frontend | **React + Vite + TypeScript** | SPA průzkumník |
| UI knihovny | TanStack Table (tabulky), TanStack Query (data), shadcn/ui | výkonné tabulky, filtrování, caching |
| Graf/vizualizace | Cytoscape.js / react-force-graph | průzkum vazeb |
| Grafy/metriky | Recharts | dashboardy |

Alternativa bez backendu: **DuckDB-WASM** v prohlížeči přímo nad `rpp.sqlite`/parquet — ale 957k řádků působnosti je lepší držet za API s indexy. Doporučení: FastAPI + SQLite pro MVP.

---

## 6. Princip čitelnosti (resolve)
Každé pole typu `…/CODE` se v UI překládá přes tabulku `ciselnik` na lidský popisek. Každý odkaz `typ/id` je v UI **klikací** a vede na detail dané entity → odtud plyne „prozkoumatelnost všeho".
