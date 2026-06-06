# 00 — Vize a kontext (PS07 kGovernment / AFCEA)

Tento dokument vysvětluje, **proč** RPP Explorer vzniká a jak zapadá do širší iniciativy. Vychází ze zápisů schůzek PS07 kGovernment (zejm. 11., 17. a 18. schůzka) a z pozičního dokumentu *Architektura znalostní vrstvy pro agentický eGovernment*.

---

## 1. Iniciativa: znalostní vrstva nad státem

PS07 kGovernment (pracovní skupina AFCEA ČR) buduje **znalostní vrstvu (Knowledge Layer)** pro strategické řízení státu v oblastech **bezpečnosti, obrany a odolnosti**.

> *„Vytváříme znalostní vrstvu nad strategiemi a legislativou ČR pro podporu strategického rozhodování a řízení státu."* — ONE_PAGER kGovernment

> *„Není to o nástroji, je to o metodice. Pokud je to o práci s informacemi, propojování informací, vytváření kontextu nad informacemi, tak prostě potřebuješ znalostní vrstvy."*

**Klíčový problém — rezortismus:** data státu jsou uvězněná v izolovaných resortních silech; AI systémy se nasazují nad fragmentovanými, vzájemně nedůvěryhodnými základnami; meziresortní koordinace probíhá ad hoc. Chybí sdílená, důvěryhodná, strojově čitelná vrstva pravidel, metadat a přístupů.

---

## 2. Role RPP v této vizi

**Registr práv a povinností (RPP)** už dnes je mechanismus, přes který informační systémy žádají jiné systémy o přístup k datům (Portál občana, BankID, ověření ŘP fungují na tomto principu). Ve vizi znalostní vrstvy je RPP **páteří**, kterou je třeba:
- **zviditelnit a zanalyzovat** (← to dělá RPP Explorer),
- **rozšířit o identitu AI agentů** (kdo se ptá, jménem koho, v jakém kontextu),
- doplnit o **Governance as Code** a **MCP rozhraní** nad jednotlivými registry.

RPP open data obsahují (slovy P. Kučery z 18. schůzky) *„detailní popisy agend až na paragrafy v zákonech, s klíčovými slovy jako požár, povodeň"* — tedy přesně to, na co se dá navázat krizové řízení. Popisy generoval tým z MatFyz pro DIA.

---

## 3. Konkrétní projekty, které RPP Explorer obsluhuje

### 3.1 Dynamická vizualizace propojení systémů (úkol 17. schůzky, action item #4)
> *„Ověřit u Institute of Effectivity stav mapování RPP; případně udělat dynamickou vizualizaci propojení systémů."* — odpovědný: Jakub Bareš

RPP Explorer je realizací tohoto úkolu.

### 3.2 Policy paper: Rizika a kaskádové dopady výpadku agendy/služby (17. schůzka, §7)
Nadějné nové téma (podnět V. Rohel, technicky P. Kučera), vhodné pro mentora z DIA:
- Každý úřad si dělá vlastní analýzu rizik, ale **nikdo nemá celostátní pohled** — co se stane, když nepoběží agenda úřadu (ransomware jako na Slovensku); které navázané agendy to dopadne; jaké sankce a škody (i pro občana).
- Z RPP lze zjistit propojení systémů a udělat **vizualizaci „co všechno se zbourá jako domeček z karet"**, když vypadne služba.
- **Gap ve standardu:** finální architektury IS posílané na OHA **nezachycují cloudové závislosti** — tento problém je třeba pojmenovat.

→ V RPP Exploreru jako **dopadová / kaskádová analýza** (UC13, obrazovka „Dopady & kaskády").

### 3.3 Společný relevantní operační obraz (CROP) a „app pro premiéra" (18. schůzka)
- Cíl do roka: definovat 1–2 **scénáře krizového řízení** a **aplikaci pro premiéra** zobrazující společný operační obraz.
- T. Vejlupek zavedl modifikaci **CROP = Context Relevant Operation Picture** — jen informace potřebné k danému rozhodnutí, z pohledu vlastníků dat.
- Expertní skupina (Pejčoch, Vejlupek, Rosendorf, Bareš, Kučera…) se má sejít začátkem července.
- RPP Explorer poskytuje **statickou znalostní bázi** (agendy, systémy, působnosti, zdroje dat), na kterou se napojí živá data.

### 3.4 Datově podložené policy papery pro CIS / CEVRO
Spolupráce s **Centrem pro informovanou společnost (CIS)** — studenti píší policy papery, AFCEA mentoruje. RPP Explorer dodává **data a čísla**, ze kterých papery vyrostou.

---

## 4. Metodický rámec (terminologie skupiny)

| Pojem | Význam |
|---|---|
| **Znalostní vrstva / Knowledge Layer** | sdílená mezivrstva metadat, pravidel a přístupů nad distribuovanými zdroji |
| **Ontologie** | strukturovaný slovník: *hřiště* (instituce), *hráči* (osoby/role), *aktivity* (cíle/úkoly) a vazby |
| **Rezortismus** | systémová bariéra — izolovaná resortní datová sila |
| **CROP** | Context Relevant Operation Picture — kontextově relevantní operační obraz |
| **Governance as Code** | přístupová pravidla jako strojově čitelné politiky |
| **MCP** | Model Context Protocol — jednotné rozhraní pro agentický přístup k datům |
| **NIPS** | národní informační platforma pro systémy krizového řízení (usnesení vlády, gesce gen. Šnajdárek) |
| **Domeček z karet** | metafora kaskádového výpadku navázaných agend/služeb |

---

## 5. Stakeholdeři a zdroje

- **Skupina:** PS07 kGovernment, AFCEA ČR (Bareš, Vejlupek, Pejčoch, Rohel, Kučera, Müller, Vlasta a další).
- **Partneři / cíle:** DIA (správce RPP), MV (krizové řízení), MO / gen. Šnajdárek (NIPS, armáda), CIS/CEVRO (policy papery), Institute of Effectivity (mapování RPP).
- **Legislativní kontext:** Zákon o správě dat (transpozice EU Data Governance Act, 1. čtení od 4/2026) + prováděcí vyhláška — příležitost prosadit MCP jako standard interoperability.
- **Datový zdroj:** RPP open data (DIA), https://rpp-opendata.egon.gov.cz/odrpp/datovasada/ a katalog data.gov.cz.

---

## 6. Severní hvězda
Aplikace je úspěšná, když z ní člen skupiny během pár minut vytáhne **citovatelné číslo, graf nebo vizualizaci kaskády** do policy paperu nebo na kulatý stůl (Lipník, CIS, jednání u premiéra) — a kdokoli si přes deep-link otevře přesně ten samý pohled.
