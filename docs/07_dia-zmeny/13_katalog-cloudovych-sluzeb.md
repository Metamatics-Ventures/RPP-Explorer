# 13 — Napojení na katalog cloudových služeb a analýza cloudových závislostí

> **Změna 13 — Katalog cloudových služeb a cloudové závislosti** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Změna zavádí pohled **„které systémy visí na kterých cloudových službách"** (Microsoft/Azure, AWS, eGovernment cloud…) a vizualizaci **kaskádového dopadu výpadku cloudové služby**. Petr Kučera na poradě otevřel oblast, kterou — jeho slovy — *„Bohdan vůbec nemá"* a na které sám pracuje: **katalog cloudových služeb**, do něhož by orgány měly zapisovat, které cloudové služby používají. Realita je tristní: *„je tam 6 záznamů a z toho 4 už jsou ukončené."* Riziko je přitom zásadní: *„když vypnu cloudovou službu, protože ji napadnu, nepojedou tisíce organizací."* Petr připomněl reálný incident — výpadek dvou cloudových služeb Microsoftu, kdy *„šmajdaly státní systémy"*, na 40 úřadech se to řešilo zvlášť a *„blbě se to hledá z logů"*. Cloudovou závislost dnes nelze z RPP plně sestavit (katalog je prázdný a v metodice skutečného provedení chybí i pokyn, že tam cloudové služby mají být — Petr to navrhuje doplnit a sepíše DIA do podkladů). Nástroj proto vznikne **nejdřív jako demonstrace** „jak užitečný by pohled byl, kdyby data existovala" — a tím vytvoří poptávku po jejich doplnění. Petr to shrnul: *„nad tím je krásná mapa závislostí — aha, s Microsoftem mi spadne i tenhle systém."*

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Cloudová závislost je skrytý systémový risk: jeden komerční poskytovatel může být SPOF pro tisíce organizací, ale stát o tom nemá strukturovaný přehled. RPP nese pouze hrubý signál — číselník `umístění-isvs` (cloud / částečně cloud / bez cloudu): v datech je 2 553 systémů „plně v cloudu", 26 „částečně", 9 531 „bez cloudu" (`meta.json`, `isvs_umisteni`). Neříká ale **kterého poskytovatele** ani **jakou konkrétní službu** — to je přesně ta díra, kterou má katalog cloudových služeb vyplnit.

**Citace ze schůzky (parafráze).** Katalog má dnes 6 záznamů (4 ukončené) a metodika neukládá orgánům cloudové služby vyplňovat. Petr proto navrhuje doplnit metodiku a sepsat to DIA do podkladů. Incident s dvěma službami Microsoftu (40 úřadů řešilo zvlášť, dohledání z logů obtížné) je živý důkaz hodnoty centrálního pohledu.

**Hodnota pro DIA / krizové řízení.** (1) Mapa „spadne-li Microsoft, spadne i tohle" — okamžitý přehled plošného rizika. (2) Vazba na bezpečnostní úroveň (Změna 14): kritické systémy (úroveň 4) **nesmějí viset na komerčním cloudu** — musí do Státní tiskárny cenin. Pohled odhalí porušení tohoto pravidla. (3) Demonstrace hodnoty motivuje DIA katalog skutečně naplnit (poptávka po datech).

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Navrhovatel oblasti | Petr Kučera (PowerPatterns) | Katalog cloud služeb, doplnění metodiky |
| Sponzor / vlastník dat | Bohdan Urban (DIA) | Získat přehled, který dnes „nemá" |
| Autor / vývojář | Jakub Bareš (Metamatics) | Demonstrace pohledu, ETL, mapa |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Digitální suverenita, závislost na komerci |
| Konzument výstupu | Krizoví analytici, PS07 | Kaskáda výpadku cloudu, prioritizace |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-13-1 | Pohled „cloudové závislosti": které systémy/organizace visí na které cloudové službě (poskytovatel → systémy). |
| FR-13-2 | Výchozí signál z RPP číselníku `umístění-isvs` (cloud / částečně / on-prem) — kde data o poskytovateli chybí. |
| FR-13-3 | Vizualizace **kaskádového dopadu výpadku cloudové služby** (poskytovatel jako epicentrum → padající systémy). |
| FR-13-4 | **Křížení s bezpečnostní úrovní** (Změna 14): zvýraznit kritické systémy (úroveň 4) na komerčním cloudu jako porušení pravidla. |
| FR-13-5 | Tam, kde katalog chybí, **demonstrační režim** „kdyby data byla" s ukázkovým poskytovatelem (Microsoft/Azure). |
| FR-13-6 | Proklik z poskytovatele na seznam dotčených systémů/organizací (drill-down) a do mapy závislostí (Změna 12). |
| FR-13-7 | Karta „mezera v datech" s počtem záznamů v katalogu a výzvou k doplnění (poptávka po datech). |

**Nefunkční**

- **NFR-13-1 (poctivost dat):** jasně odlišit reálná RPP data (`umístění-isvs`) od demonstračních/odvozených (poskytovatel) — nepředstírat přesnost.
- **NFR-13-2 (bezpečnost dat):** jen veřejná open data + veřejně známé incidenty; žádný neveřejný zdroj.
- **NFR-13-3 (čeština):** popisky, štítky, tooltipy česky, dům-styl „analýza rizik / příležitost pro DIA".
- **NFR-13-4 (přístupnost):** cloud vs. on-prem a porušení pravidla úrovně 4 značeno textem i barvou.
- **NFR-13-5 (idempotence):** odvození cloud-závislosti v ETL deterministické.

## 5. User stories / use cases

- Jako **expert DIA** chci vidět, kolik kritických systémů visí na komerčním cloudu, abych poznal riziko digitální suverenity.
- Jako **krizový analytik** chci simulovat výpadek Microsoftu a vidět, co spadne, abych se na incident připravil.
- Jako **stratég AFCEA** chci ukázat, jak málo je katalog naplněný, abych zdůvodnil poptávku po datech.
- Jako **uživatel** chci z poskytovatele prokliknout na dotčené systémy, abych pochopil rozsah závislosti.

## 6. Datový model a zdroje dat

Zdroj reálný: `app/data/isvs.json` pole `umisteni` (z číselníku `umístění-isvs`, plněno v `etl/build_client_data.py:374`), distribuce v `meta.json` (`isvs_umisteni`), `bezuroven` pro křížení. Nová struktura **`app/data/cloud.json`** (zatím demonstrační + reálný signál):

```json
{
  "poskytovatele":[{"nazev":"Microsoft / Azure","systemy":["isvs/…"],
                    "organizaci":0,"demo":true}],
  "porad_pravidla":[{"isvs":"isvs/…","bezuroven":"4. Kritická",
                     "umisteni":"Plně s využitím cloud computingu","porušeno":true}]
}
```

**Co chybí v RPP:** katalog cloudových služeb je prakticky prázdný (6 záznamů, 4 ukončené) a metodika neukládá ho plnit. Mapování systém → konkrétní poskytovatel proto **dnes neexistuje** — pohled je demonstrační (`demo:true`) a zároveň přesná specifikace, jaká data DIA potřebuje doplnit. Reálný je jen hrubý signál cloud/on-prem.

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** z `umisteni` (`:374`) odvodit seznam systémů v cloudu; sestavit `cloud.json` s demonstračním poskytovatelem a s detekcí porušení pravidla (úroveň 4 × cloud) křížením `bezuroven` × `umisteni`. Idempotentní.
- **`app/app.js`:** nová route `#/cloud` a render po vzoru dopadové analýzy (`app/app.js:817+`) — poskytovatel jako epicentrum, kaskáda na navázané systémy. Karta „porušení pravidla úrovně 4". Využít existující `isvs_umisteni` render na dashboardu (`app/app.js:254`) jako vstupní KPI.
- **Datový tok:** RPP JSON → ETL (cloud signál + porušení) → `cloud.json` → `cloud()` render → proklik na `#/dopady` a `#/graf` (Změna 12). Provázání s koncentračním rizikem (Změna 07): cloudová služba je SPOF.
- **Integrace:** sdílí kaskádu s dopadovou analýzou; cloud je jedna z dimenzí překryvu v mapě závislostí (Změna 12) a v mini-dashboardech (Změna 01).

## 8. UI/UX

Route `#/cloud`, sekce „Analýza". Hlavička „Cloudové závislosti — na čem visíme mimo stát". KPI: systémů v cloudu (2 579), z toho úroveň 4 na komerčním cloudu (porušení). Karta **Poskytovatelé** (poskytovatel → počet systémů, štítek „demo / kdyby data byla"). Karta **Kaskáda výpadku** (výběr poskytovatele → padající systémy, vizuál jako u dopadů). Karta **Porušení pravidla úrovně 4** (tabulka systém | bezp. úroveň | umístění | „⚠ nesmí do komerčního cloudu"). Karta **Mezera v datech** (katalog: 6 záznamů, 4 ukončené → výzva k doplnění). Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze, tag „Cloudové závislosti — na čem visíme mimo stát", step `{icon:'☁️', title:'Cloudové závislosti a kaskáda výpadku', route:'#/cloud'}`.

## 9. Akceptační kritéria

1. Route `#/cloud` se vykreslí bez `window.onerror`; KPI „systémů v cloudu" odpovídá `meta.json` (2 553 + 26).
2. Karta poskytovatelů je jasně označena jako demonstrační („kdyby data byla"), reálný cloud/on-prem signál je odlišen.
3. Výběr poskytovatele zobrazí kaskádu padajících systémů (vizuál jako dopadová analýza).
4. Tabulka „porušení pravidla úrovně 4" vypíše kritické systémy na komerčním cloudu (křížení `bezuroven` × `umisteni`).
5. Karta „mezera v datech" uvádí stav katalogu (6/4) a výzvu k doplnění.
6. `node --check app/app.js` projde; ETL idempotentně vygeneruje `cloud.json`.
7. Novinka je v průvodci (`#/pruvodce`) jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko poctivosti:** demonstrační poskytovatel nesmí vypadat jako reálná data. Mitigace: viditelný štítek „demo", oddělení od RPP signálu.
- **Riziko interpretace:** „bez cloudu" v RPP obsahuje slovo „cloud" (`app/app.js:1759`) — pozor na filtr. Mitigace: přesný match na „s využitím cloud".
- **Závislost:** Změna 14 (bezpečnostní úroveň), Změna 07 (cloud jako SPOF), Změna 12 (cloud dimenze v mapě). Externí: Petr doplní metodiku a sepíše DIA do podkladů.
- **Otázka na DIA:** doplní DIA do metodiky povinnost evidovat cloudové služby a jejich poskytovatele? Lze katalog cloudových služeb otevřít jako open data, aby šel napojit?
- **Otázka:** evidovat poskytovatele na úrovni systému, nebo organizace (Alice = sdílená služba pro 3 600 org)?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** route `#/cloud`, KPI cloud/on-prem z `meta.json`, tabulka porušení pravidla úrovně 4 (reálné křížení), demonstrační poskytovatel Microsoft, 1 zápis do CHANGELOG. ~1 den.
- **Fáze 2:** kaskáda výpadku poskytovatele (sdílení logiky s dopady), karta „mezera v datech", napojení na koncentrační riziko (Změna 07).
- **Fáze 3:** po naplnění katalogu DIA — reálné mapování systém → poskytovatel, cloud dimenze v mapě závislostí (Změna 12), integrace do znalostní vrstvy.
