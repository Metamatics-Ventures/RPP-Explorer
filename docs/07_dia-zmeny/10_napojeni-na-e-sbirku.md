# 10 — Napojení na e-Sbírku zákonů jako druhý datový zdroj

> **Změna 10 — Napojení na e-Sbírku zákonů jako druhý datový zdroj** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

RPP Explorer dnes stojí výhradně na jednom zdroji — open datech Registru práv a povinností (DIA). Tato změna přidává **druhý datový zdroj: e-Sbírku zákonů** a posouvá nástroj od pouhého *zobrazování* obsahu RPP k jeho **validaci proti zákonnému základu**. RPP totiž není samostatný svět — primárně se odkazuje na zákony, které jednotlivým agendám stanovují, jaká data smí orgán publikovat, konzumovat a v jakém rozsahu má oprávnění. Když k RPP připojíme e-Sbírku a křížově obě sady porovnáme, dokážeme automaticky upozornit na nesoulady: má agenda v RPP zapsaný rozsah oprávnění odpovídající zákonné úpravě? Publikuje nebo konzumuje data v souladu se zmocněním, které jí zákon dává? Tato kontrola je přesně ten typ práce, který DIA nemůže snadno dělat ručně přes stovky agend — a proto je velmi prodejnou přidanou hodnotou. Začínáme **pilotně na úzké množině agend** a cílem prvního kroku je ukázat pár konkrétních, doložitelných nesouladů, ne plošně oskenovat všech 406 agend.

## 2. Obchodní kontext a zdůvodnění (BRD)

Na poradě 16. 6. 2026 položil Jakub Bareš přímou otázku, z jakých dalších zdrojů kromě RPP čerpat. Bohdan Urban (DIA) odpověděl, že RPP se primárně odkazuje na zákony, takže přirozeným druhým zdrojem je e-Sbírka. Parafráze: *„z e-Sbírky bychom jednoduchou analýzou měli být schopni porovnat, jestli rozsah dat, způsob a rozsah publikace a rozsah oprávnění konzumovat data odpovídá"* tomu, co je v RPP; e-Sbírka navíc odkazuje na konkrétní paragrafy a zákony, takže lze vazbu vést až na úroveň §. Bohdan zároveň pojmenoval **limit**: tímto způsobem nezachytíme případ, kdy „někomu unikl zákon" mimo přímou vazbu RPP↔zákon — tj. validace je tak silná, jak silné jsou existující odkazy.

Obchodní hodnota je dvojí. Za prvé **důvěryhodnost a kvalita dat RPP**: nástroj přestává jen ukazovat, co RPP obsahuje, a začíná říkat, *zda to odpovídá právu*. To je analytická vrstva, kterou DIA jako správce registru potřebuje pro vlastní řízení kvality. Za druhé **vytvoření poptávky**: kde validace odhalí mezeru (chybějící odkaz, rozsah oprávnění širší než zmocnění), vzniká konkrétní úkol pro gestora agendy. Bohdan už požádal kolegy z RPP, aby nestrukturovaně popsali zdroje dat a procesní postupy — tato změna dává tomuto úsilí strojovou oporu. Tón zůstává „analýza rizik a příležitost", ne audit chyb.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / cílový uživatel | Bohdan Urban (DIA) | Validace RPP proti zákonu; kvalita registru |
| Doménový expert RPP | Petr Kučera (PowerPatterns) | Korektní mapování agenda ↔ § ↔ oprávnění |
| Správní právo | Martin Vlasta | Výklad zmocnění a rozsahu publikace/konzumace |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Vyznění „pomáháme DIA", ne „kontrolujeme vás" |
| Autor / vývojář | Jakub Bareš (Metamatics) | Implementace ETL napojení, idempotence |
| Kolegové z RPP (DIA) | — | Dodání nestrukturovaného popisu zdrojů a postupů |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-10-1 | ETL stáhne / přijme výřez e-Sbírky relevantní pro pilotní množinu agend (zákony a paragrafy, na které RPP odkazuje). |
| FR-10-2 | Pro každou pilotní agendu se spáruje její odkaz na zákon/§ (z RPP) se záznamem v e-Sbírce. |
| FR-10-3 | Křížová kontrola: porovná rozsah oprávnění (R/W, údaje) v RPP proti zmocnění popsanému v zákoně. |
| FR-10-4 | Detekce nesouladů: agenda publikuje/konzumuje nad rámec zmocnění, nebo chybí očekávaný odkaz. |
| FR-10-5 | V detailu agendy nová karta „Právní základ" — zákon, §, stav shody (shoda / k ověření / nesoulad). |
| FR-10-6 | Seznam nalezených nesouladů jako samostatný přehled (route `#/validace-zakon`). |
| FR-10-7 | U každého verdiktu zobrazit zdroj (citaci §) a důvod — žádný „černý box". |
| FR-10-8 | Disclaimer o limitu: nezachytíme zákon mimo přímou vazbu RPP↔zákon. |

**Nefunkční**

- **NFR-10-1 (bezpečnost):** e-Sbírka i RPP jsou veřejné zdroje — žádný neveřejný vstup; výstup zůstává otevřenými daty.
- **NFR-10-2 (výkon):** párování a validace probíhá v ETL; prohlížeč jen čte předpočítaný výsledek (< 300 ms na obrazovku).
- **NFR-10-3 (idempotence):** napojení e-Sbírky je drop & rebuild, opakovatelné při aktualizaci obou zdrojů.
- **NFR-10-4 (transparentnost):** každý verdikt nese citaci § a logiku porovnání.
- **NFR-10-5 (čeština):** všechny popisky, stavy a citace v češtině, dům-styl.

## 5. User stories / use cases

- Jako **expert DIA** chci u agendy vidět, zda její zapsaná oprávnění odpovídají zákonu, abych poznal, kde je RPP nepřesný.
- Jako **správní právník** chci proklik z verdiktu na konkrétní §, abych ověřil, že nesoulad je skutečný, ne artefakt párování.
- Jako **gestor agendy** chci seznam nesouladů své agendy, abych je mohl opravit ve zdroji.
- Jako **stratég** chci ukázat „pár konkrétních nesouladů" jako důkaz hodnoty rozšíření na všechny agendy.

## 6. Datový model a zdroje dat

Stávající zdroj: `app/data/agendy.json` (odkazy na zákony a §, již částečně přítomné v ETL § u činností — viz `06_*` připomínka E20), `app/data/opravneni.json` (R/W, údaje, z-agendy/do-agendy), `app/data/udaje.json`. **Nový zdroj e-Sbírka**: výřez zákonů a paragrafů pro pilotní agendy. Nová sada **`app/data/validace_zakon.json`**:

```json
{
  "agenda/A338": {
    "zakon": "240/2000 Sb.",
    "paragrafy": ["§ 15", "§ 21"],
    "rpp_opravneni": {"cte": 7, "zapisuje": 0},
    "shoda": "ok",
    "nalezy": [
      {"typ":"rozsah", "stav":"k_overeni",
       "popis":"RPP eviduje čtení z ROB; zmocnění v § 15 potvrzeno.",
       "citace":"§ 15 odst. 3 zák. 240/2000 Sb."}
    ]
  }
}
```

**Co chybí / limit:** e-Sbírka nemá strojový příznak „toto zmocnění odpovídá tomuto oprávnění v RPP" — vazbu je nutné odvodit přes odkaz na zákon/§, který RPP nese. Kde odkaz chybí, validace mlčí (limit dle Bohdana). Pilotní množina = úzký výběr agend (např. krizové řízení A338 a 4–5 dalších s jasným zákonným základem).

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** nová fáze, která (1) načte výřez e-Sbírky (lokální cache JSON, aby ETL zůstalo idempotentní a offline-opakovatelné), (2) pro pilotní agendy spáruje odkaz RPP→zákon/§ se záznamem e-Sbírky, (3) porovná rozsah oprávnění z `opravneni.json` proti zmocnění a (4) zapíše `validace_zakon.json` + souhrn do `meta.json` (počet shod / k ověření / nesouladů). Drop & rebuild.
- **`app/app.js`:** nová route `#/validace-zakon` s render funkcí po vzoru existujících datových obrazovek; v detailu agendy nová karta „Právní základ" (po vzoru karty „Toky údajů", `app/app.js:273`). Sdílí badge/chip helpery.
- **Datový tok:** RPP JSON + e-Sbírka cache → ETL párování a validace → `validace_zakon.json` → render karty a přehledu → proklik na detail agendy / citaci §.
- **Integrace:** navazuje na již importovaný § u činností (e-Sbírka jako primárně právní zdroj sdílí klíč zákon/§); neduplikuje data RPP.

## 8. UI/UX

Route `#/validace-zakon` — přehledová tabulka: agenda | zákon | §§ | stav shody (chip: shoda / k ověření / nesoulad) | proklik. V **detailu agendy** nová karta „Právní základ": citace zákona a §, vedle nich zapsaná oprávnění z RPP a verdikt s vysvětlením. Nesoulady barevně odlišené, vždy s textovým ekvivalentem (ne jen barva) a s citací zdroje. Disclaimer kurzívou: *„Porovnáváme jen tam, kde RPP nese odkaz na zákon; zákon mimo tuto vazbu nezachytíme."* Zápis do `CHANGELOG` (`app/app.js:1837`) jako nová verze **v9.0**, tag „e-Sbírka — validace RPP proti zákonu", step `{icon:'⚖️', title:'Křížová kontrola se zákony', body:'Nově porovnáváme rozsah oprávnění v RPP s tím, co povoluje zákon v e-Sbírce — a ukazujeme konkrétní nesoulady.', route:'#/validace-zakon'}`.

## 9. Akceptační kritéria

1. ETL po `python3 etl/build_client_data.py` vygeneruje `validace_zakon.json` pro pilotní agendy idempotentně (drop & rebuild dá stejný výsledek).
2. Route `#/validace-zakon` se vykreslí bez `window.onerror` a zobrazí pilotní agendy se stavem shody.
3. Detail agendy A338 ukáže kartu „Právní základ" s citací zák. 240/2000 Sb. a verdiktem (čte z registrů, zapisuje 0 — viz polarita R/W).
4. Aspoň **jeden konkrétní nesoulad nebo „k ověření"** je doložen citací §.
5. Každý verdikt nese zdroj (§) a slovní vysvětlení — žádný neodůvodněný stav.
6. Disclaimer o limitu (zákon mimo vazbu) je viditelný.
7. `node --check app/app.js` projde; novinka je nejnovější verzí v `#/pruvodce`.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko párování:** odkaz RPP→§ může být neúplný nebo nejednoznačný; špatné spárování by dalo falešný nesoulad. Mitigace: pilotní rozsah, stav „k ověření" místo tvrdého verdiktu, citace pro ruční kontrolu.
- **Riziko výkladu:** „rozsah zmocnění" je právní výklad, ne mechanické porovnání — nutná validace Martinem Vlastou.
- **Závislost:** kvalita § importu (připomínka E20 z `06_*`) a ochota kolegů z RPP dodat popis zdrojů.
- **Otázka na DIA:** existuje strojově čitelná vazba RPP↔e-Sbírka (API, identifikátor §), nebo ji musíme rekonstruovat? V jakém formátu je e-Sbírka dostupná pro automatizované čtení?
- **Otázka na DIA:** kterou pilotní množinu agend zvolit, aby nesoulady byly přesvědčivé a politicky bezpečné pro demo?

## 11. Fázování a hrubý odhad

- **MVP (pilot):** výřez e-Sbírky pro 4–6 agend v lokální cache, ETL párování + validace, karta „Právní základ" a přehled `#/validace-zakon`, 1 zápis do CHANGELOG. ~1,5–2 dny.
- **Fáze 2:** automatizované čtení e-Sbírky přes API, rozšíření na desítky agend, kategorizace typů nesouladu (rozsah / chybějící odkaz / směr R-W).
- **Fáze 3:** plošná validace všech 406 agend a zavěšení na znalostní vrstvu (strategie → zákon → agenda → činnost → zdroj).
