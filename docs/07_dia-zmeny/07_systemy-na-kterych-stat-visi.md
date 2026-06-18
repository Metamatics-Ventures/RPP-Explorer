# 07 — Identifikace systémů, na kterých stát „visí" (single point of failure)

> **Změna 07 — Systémy, na kterých stát „visí" (single point of failure)** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Cílem změny je povýšit dnešní žebříček „nejkritičtějších systémů" na **plnohodnotnou analytickou funkci „koncentrační riziko"** — tedy systematickou identifikaci uzlů, na kterých „visí" neúměrně velká část státu. Petr Kučera na poradě pojmenoval jádro problému přesně: *„když máte Alici, na ní visí 3 600 organizací jako na cloudové službě, je to jeden prvek, o který se v analýze rizik státu je potřeba zajímat. Protože když vypadne Alice, vypadne 3 600 organizací."* Jeden technický prvek se tak stává **single point of failure** celé třídy úřadů. Nástroj má takové uzly seřadit, vizuálně zvýraznit nad zvoleným prahem a umožnit proklik na seznam dotčených organizací a agend. Prototyp tuto myšlenku částečně obsahuje (`top_critical` a `top_spread` v `app/data/meta.json`, render na dashboardu `app/app.js:232`), ale jako vedlejší kartu, ne jako first-class pohled „na kterých systémech stát nejvíc visí". Funkce stojí **výhradně na otevřených datech** — což je její největší síla. Jaroslav Pejčoch to formuloval jako podmínku důvěryhodnosti: *„musí to vycházet jen z otevřených dat — to si může udělat každý, i Číňani."* Pohled je proto bezpečný, opakovatelný a přesvědčivý zároveň.

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Analýza rizik státu se dnes dělá po jednotlivých systémech, ale chybí pohled „kde je koncentrace" — které prvky obsluhují tolik organizací nebo agend, že jejich výpadek znamená plošný kolaps. RPP přitom data pro tento pohled nese: u každého ISVS je seznam navázaných agend (`isvs.agendy[]`) a přes hostingové/rodinné rozšíření (`top_spread` v `meta.json`) lze odvodit, kolik instalací téže rodiny běží — KEO 3 625, Munis 1 234, GORDIC/GINIS přes 1 500 dohromady. To jsou reálná čísla z open dat.

**Hodnota pro DIA / krizové řízení.** (1) DIA dostane do ruky **mapu koncentračního rizika** jako vlastní nástroj analýzy rizik, ne audit zvenčí. (2) Tam, kde data o sdílených/cloudových službách chybí (viz Změna 13), pohled ukáže prázdné místo s popiskem „kdyby data byla" a vytvoří poptávku po jejich doplnění. (3) Krizový analytik uvidí, výpadek kterého prvku zasáhne nejvíc organizací — vstup pro prioritizaci ochrany.

**Zdůvodnění priority P1.** Je to pohled, který Bohdan Urban i hosté označili za nejnázornější ukázku přidané hodnoty nad RPP. Zároveň navazuje na opravu kritičnosti z 19. schůzky (`docs/06_*`, blok A): tam šlo o to **nepředstírat** kritičnost počtem agend; tady jde o **legitimní** koncentrační metriku (počet napojených organizací jako míra dopadu výpadku).

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Sponzor / cílový uživatel | Bohdan Urban (DIA) | Mapa koncentračního rizika jako vlastní nástroj |
| Navrhovatel pohledu | Petr Kučera (PowerPatterns) | „Na čem visí 3 600 organizací" — SPOF |
| Strategie / důvěryhodnost | Jaroslav Pejčoch (AFCEA) | Jen otevřená data, replikovatelnost |
| Autor / vývojář | Jakub Bareš (Metamatics) | Implementace v ETL + `app.js`, idempotence |
| Konzument výstupu | Krizoví analytici, PS07 | Prioritizace ochrany kritických uzlů |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-07-1 | Samostatná route `#/uzly` (koncentrační riziko) — žebříček prvků dle počtu napojených organizací/agend. |
| FR-07-2 | Dvě osy koncentrace: (a) systém ↔ počet napojených agend; (b) produktová rodina/sdílená služba ↔ počet instalací/organizací (z `top_spread`). |
| FR-07-3 | Vizuální zvýraznění uzlů **nad nastavitelným prahem** (např. > 1 000 organizací) výstražnou barvou a štítkem „SPOF". |
| FR-07-4 | Proklik z uzlu na **seznam dotčených organizací a agend** (drill-down). |
| FR-07-5 | U každého uzlu odhad dopadu výpadku (počet organizací × bezpečnostní úroveň) jako kompozitní skóre koncentrace. |
| FR-07-6 | Proklik z uzlu do dopadové/kaskádové analýzy (`#/dopady/<id>`) a do mapy závislostí (Změna 12). |
| FR-07-7 | Placeholder „kdyby data byla" tam, kde sdílená/cloudová služba v RPP chybí (vazba na Změnu 13). |

**Nefunkční**

- **NFR-07-1 (výkon):** žebříček se renderuje z předpočítaného `meta.json` / `uzly.json`, bez dopočtu nad 12 110 ISVS v prohlížeči (< 300 ms).
- **NFR-07-2 (bezpečnost dat):** výhradně veřejná open data RPP; žádný neveřejný zdroj — Jaroslavova podmínka replikovatelnosti.
- **NFR-07-3 (čeština):** všechny popisky, štítky a tooltipy česky, dům-styl „analýza rizik".
- **NFR-07-4 (přístupnost):** SPOF nad prahem značen textem i barvou, ne jen barvou.
- **NFR-07-5 (idempotence):** výpočet koncentrace v ETL deterministický (drop & rebuild).

## 5. User stories / use cases

- Jako **expert DIA** chci vidět seřazený seznam prvků „na kterých stát visí", abych poznal koncentrační riziko bez ručního počítání.
- Jako **krizový analytik** chci u uzlu rovnou seznam dotčených organizací, abych odhadl rozsah plošného výpadku.
- Jako **stratég AFCEA** chci ukázat, že tento pohled jde postavit jen z otevřených dat, aby byl nezpochybnitelný.
- Jako **uživatel** chci z uzlu prokliknout do kaskádové analýzy, abych viděl, co se zhroutí dál.

## 6. Datový model a zdroje dat

Zdroje: `app/data/isvs.json` (pole `agendy[]`, `bezuroven`, `umisteni`, `spravce`), `app/data/meta.json` (`top_critical`, `top_spread` — rodiny a počty instalací: KEO 3 625, Munis 1 234, GINIS/GORDIC ~1 571). Nová předpočítaná struktura **`app/data/uzly.json`**:

```json
{
  "systemy": [{"id":"isvs/…","nazev":"…","organizaci":3600,"agend":406,
               "bezuroven":"4. Kritická","skore":0,"spof":true}],
  "rodiny":  [{"rodina":"KEO","instalaci":3625,"organizaci":3625,"spof":true}]
}
```

**Co chybí v RPP:** počet organizací „visících" na *sdílené* službě (typ Alice/cloud) — RPP eviduje instalaci u správce, ne počet konzumentů sdílené služby. Tato osa zůstává prázdná s disclaimerem a je explicitní poptávkou (Změna 13). Počet instalací rodiny lze odvodit z normalizace názvů (rodiny, `etl/build_client_data.py:290`).

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** rozšířit výpočet o **koncentrační skóre** = funkce počtu napojených organizací/agend a bezpečnostní úrovně; uložit `uzly.json` a označit `spof = (organizaci > práh)`. Navazuje na existující řazení ISVS dle dopadu (`etl/build_client_data.py:373`, kritičnost dle registru/úrovně) a na `top_spread`. Idempotentní.
- **`app/app.js`:** nová route `#/uzly` a render `uzly()` po vzoru dashboardových karet (`app/app.js:232`). Tabulka s řazením, prahový slider, štítek „SPOF". Drill-down využije existující resolvery názvů (`names.json`).
- **Datový tok:** RPP JSON → ETL koncentrace → `uzly.json` → `uzly()` render → proklik na `#/dopady/<id>` (kaskáda) a `#/graf/<id>` (mapa, Změna 12).
- **Integrace:** sdílí epicentrum a kaskádovou logiku s dopadovou analýzou (`app/app.js:817+`), překryv dimenzí (kritičnost agendy ze Změny 03, bezpečnostní úroveň ze Změny 14, cloud ze Změny 13) s mapou závislostí (Změna 12).

## 8. UI/UX

Route `#/uzly`, položka v sekci „Analýza". Hlavička „Na čem stát visí — koncentrační riziko" s disclaimerem „jen z otevřených dat RPP". Dvě karty: **Systémy** (tabulka systém | organizací | agend | bezp. úroveň | skóre | „⚠ dopad") a **Produktové rodiny / sdílené služby** (rodina | instalací | „SPOF"). Nad tabulkou **slider prahu**; řádky nad prahem dostanou výstražný štítek a barvu. Každý řádek má proklik „⚠ dopad" a „🕸 mapa". Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze **v9.0**, tag „Koncentrační riziko — na čem stát visí", step `{icon:'🎯', title:'Systémy, na kterých stát visí', route:'#/uzly'}`.

## 9. Akceptační kritéria

1. Route `#/uzly` se vykreslí bez `window.onerror`; žebříček je seřazen dle koncentračního skóre.
2. Uzly nad zvoleným prahem mají štítek „SPOF" (text i barva); změna prahu sliderem žebříček přerovná.
3. Proklik z uzlu vede na `#/dopady/<id>` a na detail/mapu závislostí.
4. Osa „produktové rodiny" zobrazí KEO/Munis/GINIS s počty z `top_spread` (KEO 3 625 ověřitelné v `meta.json`).
5. Osa „sdílené služby" bez dat ukáže placeholder „kdyby data byla", ne nulu bez vysvětlení.
6. `node --check app/app.js` projde; ETL po `python3 etl/build_client_data.py` vygeneruje `uzly.json` idempotentně.
7. Novinka je v průvodci (`#/pruvodce`) jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko interpretace:** „počet organizací" nesmí splynout se „kritičností" (chyba z 19. schůzky). Mitigace: koncentraci prezentovat jako *dopad výpadku*, ne jako *důležitost*, a kombinovat s bezpečnostní úrovní.
- **Riziko dat:** osa sdílených služeb je v RPP prázdná — bez Změny 13 je jen demonstrativní.
- **Závislost:** kaskádová logika (dopadová analýza), `top_spread` (rodiny), Změny 12/13/14.
- **Otázka na DIA:** eviduje (nebo může evidovat) RPP počet organizací konzumujících sdílenou službu typu Alice/eGovernment cloud? Lze rozlišit „instalaci u správce" od „počtu napojených konzumentů"?
- **Otázka:** jaký výchozí práh SPOF zvolit (organizací? agend? kompozit)?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** route `#/uzly`, žebříček systémů a rodin z `meta.json`, prahový slider, proklik na dopady, 1 zápis do CHANGELOG. ~1 den.
- **Fáze 2:** koncentrační skóre v ETL (`uzly.json`), drill-down na seznam organizací, překryv bezpečnostní úrovně.
- **Fáze 3:** napojení osy sdílených/cloudových služeb (Změna 13) a integrace do mapy závislostí (Změna 12) jako vrstva „koncentrace".
