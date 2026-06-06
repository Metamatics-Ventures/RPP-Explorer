# 05 — Co z aplikace udělá nejužitečnější nástroj

Seznamový průzkumník je „hezký", ale skutečnou hodnotu (a podklady pro policy papery) přinášejí **průřezové funkce** a **analytická vrstva**. Tento dokument je priorita designu.

---

## 1. Killer funkce (odlišovače)

### 1.1 „Only-once" analyzátor (vlajková funkce)
Z `opravneni_k_udajum` (z-agendy → do-agendy, údaje R/W) postavit:
- mapu **kdo od koho čte které údaje**,
- detekci **údajů vedených duplicitně** napříč agendami,
- detekci **údajů nesdílených na PPDF**, které by sdílené být měly.
→ přímý podklad pro paper *„kde stát zbytečně obtěžuje občana"*. Žádný veřejný nástroj tohle dnes srozumitelně neukazuje.

### 1.2 Skóre kritičnosti systémů
Pro každý ISVS spočítat **kompozitní skóre** = f(počet závislých agend, počet služeb, úroveň sdílení) a porovnat s bezpečnostní úrovní. Výstup: „kritické, ale slabě zabezpečené systémy" — okamžitě použitelné pro paper o odolnosti eGovernmentu.

### 1.3 Index pokrytí / digitalizace agend
Jedno číslo na agendu/resort: má ISVS? má el. služby? jaký podíl úkonů je digitálních? → žebříček resortů, který se dá citovat.

### 1.4 Interaktivní graf s expanzí
Od libovolného uzlu rozbalovat sousedy — vizuální „prozkoumatelnost všeho", kterou si uživatel intuitivně osahá (UC11).

### 1.5 Kaskádová / dopadová analýza — „domeček z karet" ★ nejvlajkovější
Přímá odpověď na téma 17. schůzky: simulace výpadku agendy/služby/systému a propagace dopadu po řádech přes graf vazeb (UC13). Ukazuje **co všechno se zbourá**, kvantifikuje dosah (blast radius) a **pojmenovává mezeru ve standardu** (chybějící cloudové závislosti v architekturách na OHA). Tohle dnes nikdo na celostátní úrovni neukazuje — je to nosný argument pro bezpečnostní policy paper i pro kulatý stůl k NIPS.

---

## 2. Co zásadně zvyšuje použitelnost (UX základ)

- **Resolve číselníků a odkazů** — nikde nezůstane holý kód (`umístění-isvs/ON_PREMISE` → „On-premise"); každý `typ/id` je klikací odkaz na detail. Bez tohoto je registr nečitelný.
- **Globální fulltext (FTS5)** napříč vším, výsledky seskupené podle typu entity.
- **Deep-linky a breadcrumbs** — každý pohled má trvalý URL (sdílení v týmu, citace) a cestu zpět.
- **Export všude** — CSV/JSON z každého seznamu, sestavy i detailu, s automatickou citací zdroje (RPP open data + datum).
- **Uložené pohledy / záložky** — analytik si uloží filtr (např. „agendy bez ISVS na MV") a vrací se k němu.
- **Rychlost** — stránkování a indexy (zejm. 957k řádků působnosti) za API; tabulky virtualizované.
- **Vlajky kvality dat** — vizuální označení neúplných záznamů (chybí ISVS, chybí stanovisko, údaj bez sdílení) — samo o sobě analytický signál.

---

## 3. Analytická vrstva → policy papery

Každá sestava v `/analytika` je navržená tak, aby z ní rovnou vznikl graf/tabulka do paperu:

| Sestava | Paper (témata PS07 / CIS) |
|---|---|
| **Dopady & kaskády** | ***Rizika a kaskádové dopady výpadku agendy/služby*** (mentor DIA) ★ |
| Krizový balík (CROP) | *Sdílení informací v krizových situacích / společný operační obraz* |
| Toky a duplicity údajů | *Only-once: kde stát obtěžuje občana* + *Interoperabilita dat napříč státem* |
| Kritičnost × bezpečnost | *Kritické závislosti eGovernmentu* |
| Pokrytí agend systémy | *Stav digitalizace agend ČR* |
| Cloud vs. on-prem, etapy | *Kde a jak stát provozuje IT* |
| Konsolidační potenciál | *Konsolidace IT státu* |

Volitelně **sémantická/LLM vrstva** nad bohatými popisy z `agendy-detail` (shrnutí agendy, klasifikace, dotazování v přirozeném jazyce).

---

## 4. Doporučené fázování (aby to vzniklo a bylo užitečné brzy)

**MVP (fáze 1)** — největší hodnota za nejmíň práce:
1. ETL → SQLite + číselníky + FTS.
2. Seznamy + detaily 5 jádrových entit (agenda, OVM, ISVS, služba, údaj) s resolvem a proklikem.
3. Globální vyhledávání.
4. Dashboard se 3–4 KPI a „pokrytí agend".

**Fáze 2 — analytika:**
5. Toky údajů / only-once.
6. Kritičnost systémů + digitalizace.
7. Export + uložené pohledy.

**Fáze 3 — průzkum a srovnání:**
8. Interaktivní graf.
9. **Dopady & kaskády** (domeček z karet) + Krizový balík (CROP).
10. Srovnání entit.
11. (Volitelně) LLM/sémantická vrstva nad detaily agend (popisy s klíčovými slovy požár/povodeň).

**Fáze 4 — směrem ke znalostní vrstvě (vize):**
12. **MCP wrapper** nad RPP daty → RPP Explorer se stává prvním datovým zdrojem dostupným agentům.
13. Napojení **živých dat** na krizový balík (společný operační obraz / app pro premiéra).
14. Příspěvek do diskuse o prováděcí vyhlášce k Zákonu o správě dat (MCP jako standard interoperability).

---

## 5. Měřítko „nejužitečnosti"
Aplikace je úspěšná, když analytik z ní **během pár minut vytáhne citovatelné číslo nebo graf do policy paperu** a kdokoliv z týmu si přes deep-link otevře přesně ten samý pohled. To je severní hvězda návrhu.
