# 03 — Formulář kritických agend

> **Změna 03 — Formulář kritických agend** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

RPP Explorer je dnes čistě **read-only prohlížeč** veřejných open dat Registru práv a povinností. Tato změna do něj poprvé zavádí **zápisový/sběrový tok**: jednoduchý formulář (resp. tabulku) nad **všemi 406 agendami**, ve kterém věcný správce agendy u každé agendy vyplní dva údaje — **dobu, po kterou je výpadek ještě únosný** (4 hodiny / den / týden / měsíc), a **úroveň dopadu** (nízký / střední / vysoký / kritický).

Cílem je vytvořit **dosud chybějící datovou sadu o kritičnosti agend**, kterou podle slov Bohdana Urbana „nikdo nebyl schopen udělat" a na které si „vylámal zuby". Petr Kučera formulář navrhl jako **quick win** — věc, kterou „máš rychle, je vidět, že se něco děje a má to smysl". Je to **první věc, která má být hotová na páteční schůzku**, a zároveň architektonický základ pro Změnu 04 (mapování na systémy) a Změnu 18 (offline/krizový režim).

Klíčový požadavek: vyplňování musí být **extrémně jednoduché**, protože vyplňují **věcní správci agend, ne IT**. Nástroj zůstává postavený výhradně nad otevřenými daty; sbíraný expertní vstup je nová vrstva *nad* nimi, nikoli zásah do zdroje DIA.

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Pro analýzu rizik a kaskádových dopadů (UC13, viz `docs/01_informacni-architektura.md`) chybí nejdůležitější vstup: **lidský úsudek o tom, které agendy stát skutečně nesmí ztratit**. RPP obsahuje strukturu (agendy, systémy, vazby), ale neobsahuje *kritičnost z pohledu věcného gestora*. Žebříček „nejkritičtějších systémů" byl proto na 19. schůzce odmítnut jako věcně chybný (řadil podle počtu agend — viz `docs/06_*`, blok A). Kritičnost je třeba **doplnit jako expertní data**, ne dopočítat z RPP.

**Citace ze schůzky (parafráze).** Petr Kučera navrhl tabulku se všemi agendami, kategorizovanou podle ministerstva, aby šlo odfiltrovat nepriority — *„kulturou se nemusíš hned zabývat"*. U každé agendy správce vyplní dobu nedostupnosti a úroveň dopadu. Bohdan Urban potvrdil, že právě tuto „štábní úlohu" se dlouhodobě nedařilo dotáhnout a že dostane-li nástroj, **předloží ho hasičům, Správě státních hmotných rezerv a dalším** věcným gestorům.

**Hodnota pro DIA / krizové řízení.** (1) Vznikne první konsolidovaná sada kritičnosti agend napříč státem. (2) DIA získá nástroj, který může rozeslat věcným správcům jako *svůj* (ne audit zvenčí). (3) Data se okamžitě promítnou do dopadové analýzy a do mapy závislostí.

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Sponzor / vlastník dat | Bohdan Urban (DIA) | Získat sadu kritičnosti, předložit ji gestorům |
| Navrhovatel | Petr Kučera (PowerPatterns) | Rychlý quick win, využití RPP vazeb |
| Autor / vývojář | Jakub Bareš | Návrh, implementace, ETL |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Napojení na program digitální suverenity |
| **Vyplňovatel (primární uživatel)** | Věcný správce agendy (gestor na ministerstvu, HZS, SSHR) | Jednoduše ohodnotit „své" agendy |
| Konzument výstupu | Krizoví analytici, dopadová analýza | Číst kritičnost, filtrovat priority |

## 4. Business požadavky

**Funkční**
- **FR-03-1** Zobrazit tabulku **všech 406 agend** s názvem, kódem a gestorem (ohlašovatel OVM).
- **FR-03-2** **Filtr a seskupení podle ministerstva / gestora**, aby šlo skrýt nepriority (např. kulturu).
- **FR-03-3** U každé agendy umožnit zadat **dobu únosné nedostupnosti**: 4 h / den / týden / měsíc (jeden výběr).
- **FR-03-4** U každé agendy umožnit zadat **úroveň dopadu**: nízký / střední / vysoký / kritický.
- **FR-03-5** **Rozklikávací řádek (toggle)** — po rozkliknutí ukáže detail agendy (systémy, vazby) a **tlačítka pro jednoklikové označení** obou hodnot.
- **FR-03-6** Zobrazit **stav vyplnění** (kolik z N agend gestora je hotovo) a umožnit filtr „nevyplněné".
- **FR-03-7** **Uložení a export** vyplněných dat (viz arch. — varianta sběru).
- **FR-03-8** Re-import vyplněných dat zpět do aplikace / ETL, aby se kritičnost propsala do analýz.

**Nefunkční**
- **NFR-03-1 (výkon)** Tabulka 406 řádků musí filtrovat a překreslovat plynule v prohlížeči (statická SPA, žádný server v MVP).
- **NFR-03-2 (bezpečnost / jen otevřená data)** Zdrojem zůstávají výhradně open data RPP. Sbíraná kritičnost je *expertní názorová* vrstva, neobsahuje neveřejné údaje; ukládá se odděleně a označuje jako „expertní vstup", ne jako fakt z RPP.
- **NFR-03-3 (přístupnost)** Ovládatelné klávesnicí, čitelné kontrasty, jasné popisky.
- **NFR-03-4 (čeština)** Celé UI i hodnoty česky, jazykem věcného správce.
- **NFR-03-5 (idempotence ETL)** Re-import kritičnosti je idempotentní (drop & rebuild), `etl/build_client_data.py` zůstává opakovatelně spustitelný.

## 5. User stories / use cases

- Jako **správce agendy** chci u svých agend jedním kliknutím označit dopad a únosný výpadek, abych nemusel psát dlouhé texty.
- Jako **správce z ministerstva** chci si odfiltrovat jen své agendy, abych se nemusel probírat cizími resorty.
- Jako **Bohdan Urban (DIA)** chci poslat odkaz hasičům a SSHR, aby si gestoři vyplnili kritičnost sami.
- Jako **krizový analytik** chci vidět, které agendy mají kritický dopad a krátkou únosnou dobu, abych určil priority obnovy.
- Jako **autor** chci vyplněná data snadno dostat zpět do ETL, aby se propsala do dopadové analýzy.

## 6. Datový model a zdroje dat

**Zdroj (RPP, beze změny):** `app/data/agendy.json` (kód, název, ohlašovatel), `names.json` (popisky OVM/ministerstva), `meta.json`. Gestor a „resort" se odvodí z ohlašovatele agendy (OVM → kategorie/ministerstvo).

**Nová struktura — kritičnost agendy (sbíraná).** Navrhovaný soubor `app/data/kriticnost_agend.json` (generovaný/re-importovaný):
```
{
  "A338": {
    "doba_nedostupnosti": "4h | den | tyden | mesic",
    "uroven_dopadu": "nizky | stredni | vysoky | kriticky",
    "vyplnil": "<volně, role/útvar>",
    "datum": "2026-06-..",
    "zdroj": "expertni-vstup"
  }, ...
}
```
**Co chybí v RPP:** kritičnost z pohledu gestora, únosná doba výpadku — RPP je nemá a mít nebude; proto je sbíráme. Tato struktura je sdílena se Změnou 05 (přidá pole hodnoticích kritérií dle vyhlášky) a Změnou 18 (přidá dimenzi odolnosti / nepřetržitosti).

## 7. Architektura řešení

**Dotčené komponenty:** `app/app.js` (nová route a render), `app/data/kriticnost_agend.json` (nová sada), `etl/build_client_data.py` (re-import + propsání do `meta.json`/`agendy.json`).

**Datový tok:** RPP open data → ETL → `app/data/*.json` → tabulka v SPA → správce vyplní → **sběr** → `kriticnost_agend.json` → re-import do ETL → propsání do analýz.

**Sběrový/zápisový mechanismus — varianty:**
- **(a) Klientský export do JSON / sdílený stav** — vyplněné hodnoty se drží v `localStorage`, tlačítkem **„Stáhnout vyplněné (JSON)"** se exportují. Žádný backend, plně v souladu se statickou SPA na S3+CloudFront. Nevýhoda: sdílení mezi více vyplňovateli je manuální (sběr JSON e-mailem).
- **(b) Tenké API / serverless** (např. AWS Lambda + DynamoDB/S3 PUT) — víceuživatelský zápis, ale vyžaduje backend, autentizaci a provoz; ohrožuje páteční termín a čistotu „jen statická data".
- **(c) Předvyplněná tabulka ke stažení (CSV/Excel) + re-import do ETL** — gestor vyplní offline, pošle zpět, ETL importuje. Nejbližší současnému workflow DIA, ale nejméně interaktivní.

**Doporučení:** pro páteční MVP **varianta (a)** — rychlá, bez infrastruktury, udrží statickou architekturu; doplnit **(c)** jako import/export můstek pro hromadný sběr od více gestorů. **(b)** odložit do další fáze, až bude jasné, kolik vyplňovatelů a jaká governance. Zdůvodnění: na pátek vítězí rychlost a nulová závislost na backendu; (c) zajišťuje udržitelnost a re-import do idempotentního ETL.

## 8. UI/UX

- **Route `#/kriticnost`** — nová obrazovka „Kritičnost agend".
- **Hlavička zdroje** (konzistentně s ostatními datovými obrazovkami) + věta, že jde o **expertní vstup nad open daty**.
- **Filtr/seskupení podle ministerstva** (rozbalovací výběr) + přepínač „jen nevyplněné".
- **Řádek agendy:** název, kód, gestor, dva kompaktní přepínače (doba 4h/den/týden/měsíc; dopad nízký→kritický) jako sada **tlačítek pro jednoklikové označení**.
- **Toggle detailu řádku:** po rozkliknutí navázané systémy/služby (předstupeň Změny 04) a delší nápověda.
- **Indikátor postupu** (např. „32 / 58 agend vašeho resortu").
- **Tlačítka** „Stáhnout vyplněné (JSON)" a „Načíst vyplněné".
- **CHANGELOG:** nová verze v `app/app.js` (např. v4.0) se `step` „Formulář kritičnosti agend" (icon 🗳️, route `#/kriticnost`, body: „Nově můžete u každé agendy jedním klikem označit dopad výpadku a jak dlouho je únosný — vzniká sada kritičnosti agend.").

## 9. Akceptační kritéria

1. Route `#/kriticnost` zobrazí všech **406 agend** s názvem, kódem a gestorem.
2. Filtr podle ministerstva skryje/zobrazí agendy správně; „jen nevyplněné" funguje.
3. U agendy lze **jedním kliknutím** nastavit dobu i dopad; volba je vizuálně zřejmá.
4. Rozkliknutí řádku zobrazí detail a tlačítka pro označení.
5. Indikátor postupu odpovídá počtu vyplněných agend.
6. „Stáhnout vyplněné (JSON)" vyexportuje validní `kriticnost_agend.json`; „Načíst" jej obnoví.
7. Re-import přes ETL je idempotentní a kritičnost se objeví v `meta.json`.
8. `node --check app/app.js` projde; 0 runtime chyb; CHANGELOG aktualizován.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko nízkého vyplnění** — proto extrémní jednoduchost a předfiltr nepriorit.
- **Sdílení mezi gestory** ve variantě (a) je manuální → otevřená otázka, zda jít na (b) v další fázi.
- **Subjektivita** vstupu → označit jako expertní vrstvu, ne fakt RPP.
- **Otázka na DIA:** Kdo jsou určení vyplňovatelé a jak DIA zajistí distribuci a zpětný sběr? Existuje preferovaný formát (Excel) pro variantu (c)?
- **Závislost:** je vstupem pro Změny 04, 05 a 18.

## 11. Fázování a hrubý odhad

- **MVP do pátku:** route `#/kriticnost`, tabulka 406 agend, filtr dle ministerstva, dva jednoklikové přepínače, localStorage + export JSON. Odhad 0,5–1 den.
- **Fáze 2:** import zpět do ETL, propsání do dopadové analýzy, CSV/Excel můstek (var. c). 1 den.
- **Fáze 3:** víceuživatelský sběr (var. b, serverless), pokud DIA potvrdí potřebu. 2–3 dny.
