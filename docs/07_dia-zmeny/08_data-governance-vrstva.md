# 08 — Data governance vrstva: automatická detekce chybějících a vadných dat

> **Změna 08 — Data governance vrstva — automatická detekce chybějících a vadných dat** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

RPP dlouhodobě trpí tím, že — slovy poradce — „se nikdo nestará o kvalitu dat". Záznam založí právník, technicky se pročistí mnohem později a mezitím nikdo systematicky nehlídá, co chybí a co si protiřečí. Tato změna zavádí do RPP Exploreru **data governance vrstvu**: automat, který nad veřejnými open daty RPP průběžně dělá „profylaxi" — kontroluje strojově ověřitelnou **úplnost a konzistenci** záznamů a vrací zpětnou vazbu typu „tohle máte nevyplněné / nekonzistentní". Výstupem je **přehled ‚zdraví dat' per resort / správce**, ideálně s napojením na gamifikaci (Změna 17). Klíčová hranice, kterou Bohdan Urban jasně vytyčil: automatizovat lze chybějící pole a jednoduché stavové analýzy (využívá se / nevyužívá, publikuje / konzumuje); **výklad agendy** (kdo komu co a od koho) automatizovat nelze a zůstává na lidech. Nástroj proto důsledně odděluje **strojově kontrolovatelnou úplnost/konzistenci** od **obsahové správnosti**. Stavíme na již existující fill-rate kartě v Analytice (`app/app.js:974–983`), kterou povyšujeme z jednorázové metriky na průběžný governance dashboard.

## 2. Obchodní kontext a zdůvodnění (BRD)

Na poradě zaznělo jádro problému od Petra Kučery: „je potřeba vybudovat data governance, dělat profylaxy, na data musí někdo koukat a zpátky dostávat zpětnou vazbu — to může dělat automat" (typu „tohle máte nevyplněné"). Bohdan Urban hranici upřesnil: automatizovat lze (a) **chybějící pole** a (b) **jednoduché stavové analýzy** — využívá se / nevyužívá se systém, agenda publikuje / konzumuje data. Co automatizovat nelze, je **výklad agendy** — „kdo komu co, případně od koho" — to vyžaduje člověka. Pro nástroj z toho plyne tvrdé pravidlo: nesmí předstírat, že posuzuje obsahovou správnost; smí posuzovat jen formální úplnost a konzistenci.

Hodnota pro DIA je přímá. DIA jako správce RPP nesmí zasahovat do byznysu, ale **provozovat governance automat a dávat zpětnou vazbu smí** — je to forma metodické pomoci. Automat odhalí: prázdná povinná pole, duplicitní/nekonzistentní názvy (souvisí se Změnou 09), chybějící napojení na ISSS a neaktualizované záznamy. Posledně jmenované má jasný mechanismus, který Bohdan popsal: záznam zakládá právník a teprve při napojení na Egon Service Bus ho dataři resortu poprvé pročistí — do té doby může být měsíce nedotčený. Governance vrstva tyto „spící" záznamy zviditelní a dá DIA podklad, na který resort upozornit. Přehled per resort/správce navíc otevírá dveře pozitivní motivaci (Změna 17) a podkladu pro metodická hesla (Změna 06).

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / správce RPP | Bohdan Urban (DIA) | Governance jako legitimní páka; hranice automat × člověk |
| Iniciátor konceptu | Petr Kučera (PowerPatterns) | Profylaxe, automatická zpětná vazba o kvalitě |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Pozitivní rámec „zdraví dat", ne pranýř |
| Autor / vývojář | Jakub Bareš (Metamatics) | ETL pravidla + render, idempotence |
| Cílový adresát zpětné vazby | Datař / správce resortu | Konkrétní „co doplnit" u svých záznamů |
| Pracovní skupina | PS07 kGovernment | Vazba na znalostní vrstvu a kvalitu dat státu |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-08-1 | Automat detekuje **prázdná povinná pole** napříč entitami (agenda, ISVS, OVM, služba, údaj). |
| FR-08-2 | Automat detekuje **duplicitní/nekonzistentní názvy** systémů (sdílí logiku se Změnou 09). |
| FR-08-3 | Automat kontroluje **napojení na ISSS / Egon Service Bus** (kde lze odvodit) a flaguje chybějící. |
| FR-08-4 | Automat **flaguje neaktualizované záznamy** (poslední změna nad prahem, např. > 3 roky). |
| FR-08-5 | Jednoduché **stavové analýzy**: systém se využívá / nevyužívá, agenda publikuje / konzumuje. |
| FR-08-6 | Výstup je **přehled ‚zdraví dat' per resort / správce** (skóre + rozpad na typy nálezů). |
| FR-08-7 | Každý nález je jasně označen jako **úplnost/konzistence**, NIKDY jako obsahová správnost. |
| FR-08-8 | Výstup je strojově generovaný v ETL a předpočítaný (žádné posuzování obsahu agendy automatem). |

**Nefunkční**

- **NFR-08-1 (hranice):** automat nikdy netvrdí, že rozumí výkladu agendy; obsahová správnost je explicitně mimo rozsah.
- **NFR-08-2 (tón):** „příležitost pro DIA / zdraví dat", ne audit chyb ani pranýř.
- **NFR-08-3 (výkon):** přehled se renderuje z předpočítaného `health.json`, bez dopočtu nad 12 110 ISVS v prohlížeči.
- **NFR-08-4 (idempotence):** governance metriky se počítají v ETL deterministicky (drop & rebuild).
- **NFR-08-5 (čeština + open data):** vše česky; výhradně veřejná open data RPP.

## 5. User stories / use cases

- Jako **expert DIA** chci přehled zdraví dat per resort, abych viděl, kde je nejvíc prázdných povinných polí a koho metodicky oslovit.
- Jako **datař resortu** chci u svých systémů seznam konkrétních prázdných polí, abych věděl, co doplnit.
- Jako **správce** chci vidět, že můj záznam je „neaktualizovaný > 3 roky", abych ho zrevidoval.
- Jako **analytik** chci stavovou analýzu „publikuje / konzumuje", abych pochopil roli agendy v toku dat.
- Jako **stratég AFCEA** chci skóre zdraví dat, které lze pozitivně rámovat v žebříčku (Změna 17), ne jako seznam hanby.

## 6. Datový model a zdroje dat

Zdroj: všechny `app/data/*.json` (agendy, isvs, ovm, sluzby, udaje, opravneni) + `meta.json` (distribuce, fill-rate). Existující fill-rate logika je už v aplikaci: per-field fill rate a počty broken-ref nad celým datasetem (`app/app.js:1525–1537`, `app/app.js:1570`). Tu povyšujeme a agregujeme **per resort/správce** do nové sady **`app/data/health.json`**:

```json
{
  "per_resort": {
    "MV": {
      "skore": 72,
      "prazdna_povinna": 134,
      "neaktualizovane_3r": 12,
      "chybi_isss": 8,
      "duplicitni_nazvy": 21,
      "stav": {"vyuziva": 40, "nevyuziva": 5, "publikuje": 12, "konzumuje": 28}
    }
  },
  "katalog_chyb": [{"kod":"PRAZDNE_POVINNE","label":"Prázdné povinné pole","typ":"uplnost"}]
}
```

`katalog_chyb` je sdílený se Změnou 06 (metodická hesla) a Změnou 09 (duplicity). Pole „poslední změna" se čte z `posledni_zmena` (už používané pro „⏳ stárnutí", viz dok. 06 řádek 47). Co RPP **principiálně neobsahuje** (výklad agendy, kompetenční role), zůstává mimo automat a je popsáno v kartě „Hranice RPP" (`app/app.js:1001`).

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** nová funkce `compute_health()`, která projde entity, aplikuje pravidla z `katalog_chyb` (prázdná povinná pole, stáří, ISSS, duplicity z rodin), spočítá stavové analýzy a agreguje per `spravce`/resort. Výstup `app/data/health.json`. Idempotentní, drop & rebuild. Sdílí normalizaci názvů (rodiny) se Změnou 09, takže duplicity se počítají jednou.
- **`app/app.js`:** rozšíření Analytiky — fill-rate karta (`app/app.js:974`) se doplní o blok „Zdraví dat per resort" a nová route `#/zdravi` s render funkcí `zdravi()` (tabulka resort | skóre | rozpad nálezů | proklik na dotčené záznamy). Každý nález nese štítek typu nálezu (úplnost / konzistence).
- **Datový tok:** RPP JSON → ETL pravidla → `health.json` → `zdravi()` render → proklik na konkrétní entity (`#/isvs/<id>` apod.).
- **Integrace:** `health.json` je vstupem pro žebříček (Změna 17) a pro metodická hesla (Změna 06); duplicity sdílí se Změnou 09. Žádná duplikace logiky.

## 8. UI/UX

Route `#/zdravi` (sekce Analýza). Nahoře KPI „Celkové zdraví dat RPP" (skóre + počet otevřených nálezů), pod tím **tabulka per resort/správce**: sloupce *Resort · Skóre (barevný pruh) · Prázdná povinná · Neaktualizováno · Chybí ISSS · Duplicity · Stav (publikuje/konzumuje)*. Klik na buňku → seznam konkrétních záznamů s proklikem na detail. U každého typu nálezu chip „úplnost" nebo „konzistence" a věta „jde o formální kontrolu, ne posouzení obsahu agendy". Tón: „příležitost pro DIA". Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze, tag „Data governance — zdraví dat", step `{icon:'🩺', title:'Automatická kontrola úplnosti a konzistence per resort', route:'#/zdravi'}`.

## 9. Akceptační kritéria

1. ETL vygeneruje `health.json` idempotentně (`python3 etl/build_client_data.py`).
2. Route `#/zdravi` se renderuje bez `window.onerror` a zobrazí tabulku per resort se skóre a rozpadem nálezů.
3. Detekce pokrývá: prázdná povinná pole, neaktualizované (> 3 r.), chybějící ISSS, duplicitní názvy, stav publikuje/konzumuje.
4. Klik na nález vede na konkrétní dotčené záznamy (proklik na detail).
5. Každý nález je označen jako úplnost/konzistence; nikde se netvrdí posouzení obsahové správnosti.
6. Čísla v přehledu odpovídají fill-rate kartě v Analytice (žádný rozpor).
7. `node --check app/app.js` projde; novinka je v `#/pruvodce` jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko překročení hranice:** automat by mohl být čten jako „posuzuje obsah". Mitigace: explicitní štítky úplnost/konzistence + disclaimer.
- **Riziko falešných pozitiv u ISSS:** napojení na ISSS/ESB nemusí být v open datech přímo. Mitigace: flagovat jen tam, kde lze spolehlivě odvodit; jinak „nelze ověřit".
- **Závislost:** sdílí katalog chyb se Změnou 06 a normalizaci duplicit se Změnou 09 — vyvíjet provázaně.
- **Závislost:** výstup je vstupem pro žebříček (Změna 17) — musí být stabilní a férový.
- **Otázka na DIA:** Která pole RPP jsou skutečně povinná (definice), aby „prázdné povinné" odpovídalo metodice DIA? Lze z dat spolehlivě odvodit napojení na ESB/ISSS? Jaký práh stáří záznamu DIA považuje za „neaktualizovaný"?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** `compute_health()` pro prázdná povinná pole + stáří + agregace per resort, route `#/zdravi`, 1 zápis do CHANGELOG. ~1–1,5 dne (staví na existující fill-rate logice).
- **Fáze 2:** doplnit detekci ISSS a stavové analýzy publikuje/konzumuje; sdílení duplicit se Změnou 09.
- **Fáze 3:** napojení na gamifikaci (Změna 17) a generování metodických hesel per resort (Změna 06); periodické přepočty se snapshoty v čase pro trend.
