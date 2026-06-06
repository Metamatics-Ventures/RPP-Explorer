# 02 — Use cases a jak je aplikace řeší

## Persony

| Persona | Kdo | Co potřebuje |
|---|---|---|
| **P1 — Policy analytik (AFCEA / PS07)** | člen pracovní skupiny píšící policy papery | data podložená čísla, exporty, srovnání resortů |
| **P2 — Architekt eGovernmentu / DIA** | technický pohled na systémy a vazby | mapa systémů, závislosti, bezpečnostní úrovně |
| **P3 — Výzkumník / novinář** | vnější analýza státu | vyhledávání, srozumitelné detaily, citovatelné zdroje |
| **P4 — Úředník / ohlašovatel agendy** | správa konkrétní agendy | co moje agenda obsahuje, kdo k ní má oprávnění |
| **P5 — Krizový manažer / koordinátor (MV, armáda, IZS)** | příprava na výpadky a krize | co se zhroutí, když vypadne služba; CROP — kontextově relevantní obraz |
| **P6 — Mentor/garant z DIA** | dohled nad policy paperem o rizicích | celostátní mapa závislostí, gapy ve standardu (cloudové závislosti) |

---

## Use cases (JTBD) a řešení

### UC1 — „Které agendy nemají žádný informační systém?"
**Persona:** P1, P2
**Řešení:** Z `isvs_agenda` se odvodí pro každou ze 406 agend počet podpůrných ISVS. Dashboard „Pokrytí agend" zobrazí seznam agend s 0 systémy + filtr podle resortu/ohlašovatele. Export do CSV pro policy paper *„stav digitalizace agend"*.

### UC2 — „Jaké údaje si která agenda bere od jiné agendy?" (princip only-once)
**Persona:** P1, P2, P4
**Řešení:** `opravneni_k_udajum` má `z-agendy → do-agendy` a seznam údajů s úrovní `R/W`. Obrazovka „Toky údajů" ukáže pro vybranou agendu, odkud čerpá údaje a kdo čerpá od ní; matice agenda×agenda; detail až na jednotlivý údaj. Podklad pro paper *„kde stát zbytečně obtěžuje občana"*.

### UC3 — „Které údaje se vedou duplicitně ve více agendách / nejsou sdílené na PPDF?"
**Persona:** P1, P2
**Řešení:** Z `udaje.údaje[]` (`sdílen-na-PPDF`, `typ-údaje`) + oprávnění se identifikují údaje vedené vícekrát a údaje nesdílené přes propojený datový fond. Sestava „Duplicity a sdílení údajů".

### UC4 — „Který systém je nejkritičtější (na kolika agendách/službách závisí)?"
**Persona:** P2, P1
**Řešení:** Síťová centralita: počet agend (`isvs_agenda`) a navázaných služeb na ISVS. Žebříček + graf závislostí. Křížově s `bezpečnostní-úroveň` → „kritické a přitom slabě zabezpečené systémy".

### UC5 — „Co všechno dělá konkrétní orgán (např. Ministerstvo vnitra)?"
**Persona:** P3, P4, P1
**Řešení:** Detail OVM: agendy, které vykonává (`pusobnost`), ISVS, které spravuje, služby, které poskytuje, kategorie, datové schránky. Jeden profil úřadu se vším.

### UC6 — „Jak je na tom konkrétní agenda?"
**Persona:** P4, P1
**Řešení:** Detail agendy: činnosti (s odkazy na § eSbírky), vykonávající OVM, podpůrné ISVS, služby, údaje, oprávnění dovnitř/ven, stanoviska. Kompletní „karta agendy".

### UC7 — „Najdi mi všechno, co souvisí s pojmem X" (např. „energie", „zdravotnictví")
**Persona:** všichni
**Řešení:** Globální full-text vyhledávání (FTS5) napříč názvy/popisy agend, ISVS, služeb, údajů → výsledky seskupené podle typu entity, klik na detail.

### UC8 — „Srovnej dva resorty / dvě agendy"
**Persona:** P1
**Řešení:** Srovnávací obrazovka: vedle sebe metriky (počet systémů, služeb, digitalizace, bezpečnostní profil). Výstup do policy paperu.

### UC9 — „Kolik služeb je dostupných elektronicky vs. jen osobně?"
**Persona:** P1
**Řešení:** Z `sluzby` + `úkony`/`typ-obslužných-kanálů` agregace digitální dostupnosti, rozpad podle agendy/resortu.

### UC10 — „Mapa cloud vs. on-premise / fáze životního cyklu systémů"
**Persona:** P2
**Řešení:** Z `isvs.umístění` a `aktuální-typ-etapy` rozpady a filtry — kde stát hostuje, kolik systémů je v provozu/rozvoji/útlumu.

### UC11 — „Prozkoumej graf vazeb od libovolného uzlu"
**Persona:** všichni
**Řešení:** Interaktivní graf — od agendy/OVM/ISVS rozbalovat sousední uzly (ego-graph), klik = expanze. Vizuální „prozkoumatelnost všeho".

### UC12 — „Vyexportuj podklad pro policy paper / citaci"
**Persona:** P1, P3
**Řešení:** Každá sestava i detail má export CSV/JSON + trvalý odkaz (deep-link) a uvedení zdroje (RPP open data, datum stažení).

### UC13 — „Co se zhroutí jako domeček z karet, když vypadne služba/agenda?" ★ vlajkový
**Persona:** P5, P6, P1 — přímo policy paper *„Rizika a kaskádové dopady"* (17. schůzka, §7).
**Řešení:** Nad grafem vazeb (agenda ↔ OVM ↔ ISVS ↔ služba ↔ údaj + oprávnění mezi agendami) se spustí **propagace výpadku**: vyber uzel (např. ISVS nebo službu) → aplikace prochází závislé hrany a vrátí **množinu zasažených agend, služeb a orgánů** + počet/dosah (1., 2., n-tý řád). Vizualizace „dominó" + tabulka dopadů + export. Pojmenovává i **gap**: kde chybí informace o cloudových závislostech (nejsou v RPP → vlajka „neznámá závislost").

### UC14 — „Sestav znalostní bázi pro krizový scénář / CROP"
**Persona:** P5 — vstup pro „app pro premiéra" a společný operační obraz (18. schůzka).
**Řešení:** Fulltext + filtr podle klíčových slov agend (požár, povodeň, krizové řízení) → výběr relevantních agend, jejich služeb, vykonávajících orgánů a zdrojů dat. Export jako strukturovaný „balík" (JSON), na který se v další fázi napojí živá data. RPP Explorer dodává **statickou znalostní vrstvu** scénáře.

---

## Mapování use case → obrazovka (předzávorka k dokumentu 03)

| UC | Hlavní obrazovka |
|---|---|
| UC1, UC9 | Dashboard / Pokrytí |
| UC2, UC3 | Toky údajů |
| UC4, UC10 | Systémy (ISVS) + Analytika |
| UC5 | Detail OVM |
| UC6 | Detail agendy |
| UC7 | Globální vyhledávání |
| UC8 | Srovnání |
| UC11 | Graf vazeb |
| UC12 | průřezově všude (export) |
| UC13 | Dopady & kaskády (+ Graf vazeb) |
| UC14 | Globální vyhledávání + Krizový balík (export) |
