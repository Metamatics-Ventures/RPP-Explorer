# 05 — Hodnotící kritéria dle vyhlášky o bezpečnostních úrovních IS

> **Změna 05 — Hodnotící kritéria dle vyhlášky o bezpečnostních úrovních informačních systémů** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Změna rozšiřuje **formulář kritických agend (Změna 03)** o **strukturovaná hodnoticí kritéria převzatá z vyhlášky o bezpečnostních úrovních informačních systémů** (loňská vyhláška; Petr Kučera pošle odkaz). Místo aby si tým kritéria vymýšlel, použije **oficiální metodiku**: kategorie typu *zda hrozí nepokoje / narušení veřejného pořádku*, *na kolik lidí dopad dosáhne*, *zda vzniknou finanční škody* a podobně. Správce agendy je vyplní **vedle** základní kritičnosti, takže z jednoho vyplnění vznikne **podstatně bohatší a obhajitelnější** datová sada.

Petr Kučera to shrnul jasně: kritéria *„nevymýšlet — oni je mají, jsou ve vyhlášce."* Jakub Bareš navrhl je rovnou zahrnout: *„ať máme fakt dobrá data, když už to budou dělat jednou."* Změna „zabíjí víc much": (1) strukturovaná data navázaná na **oficiální metodiku**, (2) **obhajitelný výstup** vůči auditu i gestorům, (3) **doplnění děravého pole „bezpečnostní úroveň IS"** z RPP. Souvisí se Změnou 14 (bezpečnostní úroveň jako analytická dimenze). Jakub má vyhlášku prostudovat před pátkem.

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Pole **bezpečnostní úroveň ISVS** je v RPP z velké části prázdné (viz `docs/06_*`, A5 — v `meta.json` přes 8 300 ISVS „Neuvedeno"). Zároveň by ad-hoc vymýšlení vlastních kritérií kritičnosti vedlo k neobhajitelnému výstupu. Vyhláška o bezpečnostních úrovních IS přitom **dopadová kritéria definuje** — stačí je převzít a nechat věcného správce vyplnit.

**Citace ze schůzky (parafráze).** Petr Kučera: kritéria jsou ve vyhlášce, není je třeba vymýšlet; jde o kategorie jako vznik nepokojů, počet zasažených lidí, finanční škody. (Na 19. schůzce navíc zaznělo, že práh dopadu na lidi je relativně nízký — kolem **125 tis. obyvatel** — a že úroveň 4 znamená legislativní omezení, např. zákaz běžného komerčního cloudu.) Jakub Bareš: zahrnout kritéria vedle formuláře, ať jsou data kvalitní, „když už to budou dělat jednou".

**Hodnota pro DIA / krizové řízení.** (1) Kritičnost se opírá o **platnou vyhlášku**, ne o názor — to je při jednání s gestory i auditem zásadní. (2) Vzniká vstup pro **dopočet/ověření bezpečnostní úrovně** tam, kde RPP mlčí. (3) Data jsou kompatibilní s legislativní logikou (úroveň → požadavky na umístění dat → suverenita).

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Navrhovatel metodiky | Petr Kučera (PowerPatterns) | Použít vyhlášku, ne vymýšlet |
| Vlastník dat | Bohdan Urban (DIA) | Doplnit chybějící bezpečnostní úroveň |
| Autor / vývojář | Jakub Bareš | Prostudovat vyhlášku, navrhnout pole |
| Vyplňovatel | Věcný správce agendy / IS | Vyplnit kritéria srozumitelně |
| Auditor / gestor | NÚKIB, kontrolní orgány | Obhajitelnost dle metodiky |

## 4. Business požadavky

**Funkční**
- **FR-05-1** Doplnit do formuláře (Změna 03) sadu **kritérií z vyhlášky** (dopad na osoby/počet zasažených, veřejný pořádek/nepokoje, finanční škody, ochrana života a zdraví, chod státu — finální seznam dle vyhlášky).
- **FR-05-2** U každého kritéria nabídnout **škálu/stupně** odpovídající vyhlášce (např. prahy počtu osob, výše škody).
- **FR-05-3** Z vyplněných kritérií **odvodit návrh bezpečnostní úrovně 1–4** (orientačně, dle logiky vyhlášky).
- **FR-05-4** Zobrazit kritéria **kontextově** — rozšiřitelný panel / nápověda u polí, jazykem vyhlášky, ale srozumitelně.
- **FR-05-5** Odvozenou úroveň **porovnat s úrovní z RPP** (`bezuroven`) a označit nesoulad / doplnění chybějícího pole.
- **FR-05-6** Uložit hodnoticí kritéria do téže sbírané sady jako kritičnost (Změna 03).

**Nefunkční**
- **NFR-05-1 (jen otevřená data + metodika)** Kritéria pocházejí z veřejné vyhlášky; vyplnění je expertní vstup. Žádná neveřejná data.
- **NFR-05-2 (srozumitelnost / čeština)** Texty kritérií převést z „jazyka vyhlášky" do srozumitelné češtiny, s odkazem na příslušné ustanovení.
- **NFR-05-3 (přístupnost)** Rozšiřitelné panely a nápovědy ovladatelné klávesnicí.
- **NFR-05-4 (jednoduchost)** Kritéria nesmí formulář „utopit" — výchozí pohled zůstává jednoduchý (Změna 03), kritéria jsou v rozbalitelné sekci.
- **NFR-05-5 (idempotence ETL)** Re-import kritérií je idempotentní; odvození úrovně deterministické.

## 5. User stories / use cases

- Jako **správce IS** chci kritéria popsaná srozumitelně s odkazem na vyhlášku, abych je správně vyplnil.
- Jako **DIA** chci, aby se z kritérií dopočetla bezpečnostní úroveň tam, kde v RPP chybí.
- Jako **auditor** chci vidět, podle kterého ustanovení vyhlášky kritičnost vznikla, abych ji mohl obhájit.
- Jako **analytik** chci porovnat odvozenou úroveň s úrovní v RPP, abych našel nesoulady.
- Jako **vyplňovatel** chci, aby kritéria byla nepovinná nad rámec základu, abych nemusel vyplnit vše najednou.

## 6. Datový model a zdroje dat

**Zdroj metodiky:** vyhláška o bezpečnostních úrovních IS (loňská) — Petr pošle odkaz; Jakub převede kritéria a prahy do strukturovaného číselníku.

**Zdroj RPP:** `isvs.json` (`bezpečnostní-úroveň`), `meta.json` (`isvs_bezuroven` distribuce) — k porovnání a doplnění děravého pole.

**Rozšíření sbírané sady** (`kriticnost_agend.json`, sdílená se Změnou 03):
```
"A338": {
  ... (doba_nedostupnosti, uroven_dopadu z 03) ...,
  "kriteria_vyhlaska": {
     "dopad_osoby": "<stupeň / práh>",
     "verejny_poradek": "<ano/ne / stupeň>",
     "financni_skody": "<pásmo>",
     "zivot_zdravi": "<stupeň>",
     ...
  },
  "odvozena_uroven": 1..4,
  "uroven_rpp": "<z isvs.bezpečnostní-úroveň>"
}
```
**Nový číselník** `cis_kriteria_vyhlaska` (kritéria, stupně, prahy, odkaz na ustanovení). **Co chybí:** mapovací pravidlo „kombinace kritérií → úroveň 1–4" — odvodí se z vyhlášky; do potvrzení označit jako orientační.

## 7. Architektura řešení

**Dotčené komponenty:** `app/app.js` (rozšiřitelný panel kritérií ve formuláři, odvození úrovně, porovnání s RPP), `app/data/kriticnost_agend.json` (rozšíření), nový `app/data/cis_kriteria_vyhlaska.json`, `etl/build_client_data.py` (načtení číselníku kritérií, re-import vyplněných kritérií, výpočet distribucí a nesouladů do `meta.json`).

**Datový tok:** vyhláška → číselník kritérií (ručně připravený JSON) → ETL jej zařadí mezi `cis_*` → SPA vykreslí kritéria u formuláře → správce vyplní → sběr (stejný mechanismus jako Změna 03, **doporučená varianta a** = localStorage + export JSON, doplněná variantou c) → re-import do ETL → odvození úrovně a porovnání s RPP.

**Sběrový/zápisový mechanismus:** beze změny oproti Změně 03 — kritéria jsou jen další pole téhož formuláře; nevzniká druhý zápisový kanál. Tím se udrží statická architektura a jediné místo zápisu.

**Odvození úrovně:** deterministická funkce v `app.js` (klient) i v ETL (pro agregáty), aby šlo zobrazit okamžitě i přepočítat dávkově.

## 8. UI/UX

- **Ve formuláři kritičnosti** (route `#/kriticnost`, Změna 03): u rozkliknutého řádku **rozšiřitelná sekce „Hodnoticí kritéria (dle vyhlášky)"**.
- Každé kritérium: krátký srozumitelný popis + **nápověda (i)** s citací/odkazem na ustanovení a prahem (např. „dopad na ≥ 125 tis. osob").
- **Živý náhled odvozené bezpečnostní úrovně 1–4** s vysvětlením, jak vznikla.
- **Porovnání s RPP:** odznak „RPP: Neuvedeno → návrh úrovně 4" nebo „nesoulad (RPP 2 vs. odvozeno 4)".
- Vizuální škála úrovně **neutrální** (nikoli zeleno-červená „dobré/špatné" — viz oprava `badgeSec` v `docs/06_*`, A5); úroveň 4 = „nejsilnější dopad", ne „nejhorší".
- **CHANGELOG:** `step` „Kritéria dle vyhlášky" (icon 📏, route `#/kriticnost`, body: „K formuláři kritičnosti přibyla oficiální hodnoticí kritéria z vyhlášky — z nich aplikace navrhne bezpečnostní úroveň 1–4 a doplní chybějící údaj z RPP.").

## 9. Akceptační kritéria

1. U rozkliknuté agendy se zobrazí sekce kritérií z vyhlášky s nápovědami a odkazy na ustanovení.
2. Každé kritérium má škálu/stupně odpovídající vyhlášce.
3. Z vyplněných kritérií se zobrazí **orientační bezpečnostní úroveň 1–4** s vysvětlením.
4. Odvozená úroveň se porovná s `bezuroven` z RPP a nesoulad/doplnění je vyznačeno.
5. Texty jsou v srozumitelné češtině s odkazem na vyhlášku; barevná škála je neutrální.
6. Kritéria se ukládají do téže sbírané sady a re-importují idempotentně; `meta.json` nese distribuce a počet nesouladů.
7. Výchozí pohled formuláře zůstává jednoduchý (kritéria skrytá do rozbalení).
8. `node --check app/app.js` projde; CHANGELOG aktualizován.

## 10. Rizika, závislosti a otevřené otázky

- **Závislost na obdržení vyhlášky** (Petr pošle odkaz) a na jejím prostudování Jakubem před pátkem — kritická pro přesné prahy.
- **Riziko zahlcení formuláře** → kritéria nepovinná, skrytá do rozbalení, výchozí jednoduchost zachována.
- **Odvození úrovně z kombinace kritérií** je interpretací vyhlášky → do potvrzení označit „orientační".
- **Otázka na DIA / Petra:** Přesné znění a prahy kritérií; je v RPP/metodice DIA závazný algoritmus „kritéria → úroveň", který lze převzít 1:1?
- **Otázka na DIA:** Lze odvozenou úroveň oficiálně použít k doplnění děravého pole `bezpečnostní-úroveň`, nebo jen jako indikaci?
- **Závislost:** vstup pro Změnu 14 (bezpečnostní úroveň jako dimenze) a podpora Změny 04 (prostředí dle úrovně).

## 11. Fázování a hrubý odhad

- **Příprava do pátku:** Jakub prostuduje vyhlášku, vytvoří `cis_kriteria_vyhlaska.json` (kritéria, stupně, prahy, odkazy). 0,5 dne.
- **MVP do pátku:** rozšiřitelná sekce kritérií u formuláře + nápovědy; ukládání do sdílené sady. 0,5 dne.
- **Fáze 2:** odvození úrovně 1–4, porovnání s RPP, agregáty v ETL, neutrální škála. 1 den.
- **Fáze 3:** plné napojení na Změnu 14 (dimenze) a na řetězec prostředí (Změna 04 — úroveň 4 → omezení cloudu). 1 den.
