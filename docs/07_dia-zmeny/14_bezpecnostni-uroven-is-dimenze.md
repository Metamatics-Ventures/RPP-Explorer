# 14 — Bezpečnostní úroveň IS jako plnohodnotná dimenze

> **Změna 14 — Bezpečnostní úroveň IS jako dimenze** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Tato změna povyšuje **bezpečnostní úroveň informačního systému** z dnešního přehlíženého sloupce na **plnohodnotnou analytickou dimenzi**, kterou nástroj zobrazuje barevně (semafor) v mini-dashboardech, na mapě závislostí i v žebříčcích — a u které vždy explicitně označí chybějící údaj. Petr Kučera na poradě 16. 6. 2026 upozornil, že bezpečnostní úroveň je v RPP „děravý údaj" a že je to „špatně": kritéria jsou ve vyhlášce, platí pravidlo, že „všecky kritické by neměly viset na Microsoftu" (úroveň 4 → ne komerční cloud), ale „tím, že úroveň není, protože ji často ani nemají, nemáš podle čeho říct". Jakub to označil za „další zajímavý use case": dohledat metodiku/vyhlášku, vizualizovat barevně (s upozorněním, že **úroveň 4 = nejvyšší dopad, ne ‚nejhorší'**), a kombinovat dimenze tak, že **kritická agenda + nízká/chybějící bezpečnostní úroveň + komerční cloud = červený alarm**. Dnes je v `meta.json` distribuce `isvs_bezuroven` taková, že z 12 110 systémů má ~8 309 hodnotu „Neuvedeno" — což přesně ilustruje princip „hodnota i bez kompletních dat".

## 2. Obchodní kontext a zdůvodnění (BRD)

Bezpečnostní úroveň byla částečně řešena už v revizi 19. schůzky (neutrální škála 1→4, oprava matoucí zeleno-červené `badgeSec`, `app/app.js:53–61`). Schůzka DIA ale posunula požadavek dál: úroveň nemá být jen čitelný sloupec, ale **dimenze, která se kříží s ostatními** a sama o sobě generuje rizikový signál. Parafráze Petra Kučery: úroveň je „děravá", protože ji správci „často ani nemají", a kde chybí, „nemáš podle čeho říct" — tedy chybějící údaj je sám rizikem, ne neutrální mezerou. Obchodní hodnota pro DIA: (1) **rizikový radar** — kombinace dimenzí odhalí systémy, které jsou kritické, špatně/neoznačeně zabezpečené a přitom na komerčním cloudu, což je přímo regulatorní problém (úroveň 4 nesmí do MS cloudu, musí do Státní tiskárny cenin); (2) **governance poptávka** — vizualizace 8 309 „Neuvedeno" jako rizika tlačí DIA k doplnění úrovní; (3) **provázání s formulářem kritických agend** — bezpečnostní úroveň a kritičnost se vyplňují podle týchž hodnotících kritérií, takže obě dimenze lze pořídit najednou.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Doménový expert | Petr Kučera (PowerPatterns) | Správný výklad vyhlášky, „děravost" jako riziko |
| Sponzor | Bohdan Urban (DIA) | Rizikový radar, governance doplnění úrovní |
| Autor | Jakub Bareš (Metamatics) | Vizualizace, kombinace dimenzí, semafor |
| Krizový expert | Mirek Lukeš (PS07) | Kritická agenda × slabé zabezpečení v kaskádě |
| Strategie | Jaroslav Pejčoch (AFCEA) | Vyznění „riziko/příležitost", ne audit |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-14-1 | Bezpečnostní úroveň zobrazena jako semafor 1→4 s výkladem (4 = nejvyšší dopad, ne „nejhorší"). |
| FR-14-2 | Chybějící úroveň („Neuvedeno") explicitně označena jako samostatný stav i jako riziko. |
| FR-14-3 | Dimenze dostupná v mini-dashboardech oblastí (Změna 01) a na mapě/grafu závislostí. |
| FR-14-4 | Kombinovaný rizikový signál: kritická agenda + nízká/chybějící BÚ + komerční cloud = červený alarm. |
| FR-14-5 | Tooltip s metodikou (vyhláška, dopadová kritéria, práh 125 tis., úroveň 4 → ne MS cloud). |
| FR-14-6 | Filtr/řazení podle bezpečnostní úrovně napříč seznamem systémů. |
| FR-14-7 | Provázání s hodnotícími kritérii formuláře kritických agend (vyplnit BÚ i kritičnost najednou). |

**Nefunkční**

- **NFR-14-1 (výkon):** distribuce a alarmy předpočítány v ETL do `meta.json` / `isvs.json`.
- **NFR-14-2 (bezpečnost):** jen open data RPP; metodika z veřejné vyhlášky.
- **NFR-14-3 (čeština):** semafor, výklad i alarmy česky.
- **NFR-14-4 (přístupnost):** úroveň vyjádřena číslem + textem, ne jen barvou (kvůli barvosleposti).
- **NFR-14-5 (idempotence ETL):** přepočet distribuce a alarmů deterministický při každém běhu.

## 5. User stories / use cases

- Jako **expert DIA** chci vidět všechny systémy s alarmem „kritické + slabě/neoznačeně zabezpečené + komerční cloud", abych je řešil přednostně.
- Jako **Petr Kučera** chci, aby „Neuvedeno" bylo viditelné jako riziko, ne jako prázdno, aby vznikl tlak na doplnění.
- Jako **uživatel** chci u úrovně 4 tooltip, že to znamená nejvyšší dopad a zákaz MS cloudu, abych barvu nečetl jako „nejhorší systém".
- Jako **krizový analytik** chci na mapě závislostí vidět bezpečnostní úroveň uzlů, abych odhadl, kde je slabé místo řetězce.
- Jako **správce agendy** chci vyplnit BÚ i kritičnost jedním formulářem, abych nezadával dvakrát.

## 6. Datový model a zdroje dat

Zdroj: `app/data/isvs.json` (pole `bezuroven`, plněné z číselníku v ETL — viz `build_client_data.py`), `app/data/meta.json` (`isvs_bezuroven`: `{"Neuvedeno": 8309, "2. Střední": 3059, "3. Vysoká": 357, "1. Nízká": 318, "4. Kritická": 67}`, dále `isvs_umisteni` pro cloud/on-prem). Nové odvozené pole v `isvs.json`:

```json
{ "id":"isvs/3",
  "alarm": { "kriticka_agenda": true, "bu": "Neuvedeno",
             "komercni_cloud": true, "cerveny": true } }
```

Kombinace: `bezuroven` (dopad) × umístění (`isvs_umisteni`, komerční cloud) × kritičnost (existující kompozitní skóre kritičnosti z revize 19. schůzky, `IMPORTANCE`/`top_critical`). **Co chybí v RPP:** u 8 309 systémů úroveň zcela chybí — to je hlavní mezera. Metodika (kritéria, prahy) pochází z veřejné vyhlášky o bezpečnostních úrovních, nese se jako text v tooltipu, ne jako data.

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** rozšířit odvození o `alarm` blok pro každý ISVS (kritičnost × `bezuroven` × umístění). Agregovat počet „červených alarmů" do `meta.json`. Plnění `bezuroven` z číselníku zůstává. Idempotentní.
- **`app/app.js`:** povýšit `badgeSec` (`app/app.js:53`) na plnohodnotný semafor 1→4 s neutrální škálou dopadu (už opraveno v v3.0, zde rozšířit o stav „Neuvedeno = riziko"). Přidat `alarmBadge` pro červený alarm. Dimenzi zobrazit: v mini-dashboardech (`oblast()`, Změna 01), na grafu závislostí (uzly obarvit dle BÚ — `app/app.js` graf sekce kolem `:963`), v dopadech (`#/dopady`, banner už úroveň epicentra zmiňuje, `app/app.js:929`). Nový filtr úrovně v seznamu ISVS.
- **Datový tok:** RPP `bezuroven` + umístění + kritičnost → ETL `alarm` → `isvs.json`/`meta.json` → semafor + alarm v UI.
- **Integrace:** sdílí kompozitní kritičnost a `_spravce_typ` z revize 19. schůzky; nezavádí nové knihovny.

## 8. UI/UX

Semafor: úroveň 1–4 jako neutrální gradient (světle → tmavě), nikdy zeleno-červeně „dobré/špatné"; „Neuvedeno" jako šedý chip s ikonou ⚠ „úroveň chybí (riziko)". Červený alarm: výrazný štítek „🔴 kritická + slabé/neoznačené zabezpečení + komerční cloud" v detailu systému, na mapě závislostí (orámování uzlu) a v samostatné kartě „Rizikový radar" v Analytice (`#/analytika`). Tooltip u úrovně obsahuje výklad vyhlášky (stanovuje správce dle dopadů, práh 125 tis. obyvatel, úroveň 4 → ne MS cloud → Státní tiskárna cenin). Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze **v10.0**, tag „Bezpečnostní úroveň jako dimenze", step `{icon:'🚦', title:'Bezpečnostní úroveň jako plná dimenze', body:'Semafor 1→4 (4 = nejvyšší dopad, ne nejhorší), chybějící úroveň označena jako riziko, a červený alarm: kritická agenda + slabé/neoznačené zabezpečení + komerční cloud.', route:'#/analytika'}`.

## 9. Akceptační kritéria

1. Bezpečnostní úroveň se zobrazuje jako neutrální semafor 1→4, úroveň 4 vizuálně „nejsilnější", ne „nejhorší".
2. „Neuvedeno" (8 309 systémů) je vlastní stav s označením rizika, ne prázdná buňka.
3. Tooltip obsahuje výklad vyhlášky včetně pravidla úroveň 4 → ne MS cloud.
4. Rizikový radar / alarm zobrazí ≥ 1 systém splňující „kritické + slabé/neoznačené + komerční cloud".
5. Dimenze je viditelná v mini-dashboardu oblasti i na grafu závislostí.
6. Filtr dle bezpečnostní úrovně funguje v seznamu ISVS.
7. `node --check app/app.js` projde; ETL přepočítá `alarm` idempotentně; `meta.json` nese počet alarmů.
8. Novinka je v `#/pruvodce`.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko interpretace:** semafor svádí ke čtení „červená = špatný systém"; úroveň 4 je naopak nejchráněnější. Mitigace: text + tooltip + neutrální gradient.
- **Riziko falešného alarmu:** komerční cloud se odvozuje z `isvs_umisteni`, které je také děravé. Mitigace: alarm jen když jsou obě dimenze přítomné; jinak „k ověření".
- **Závislost:** kompozitní kritičnost z revize 19. schůzky; umístění z `isvs_umisteni`; mini-dashboardy ze Změny 01.
- **Otázka na DIA:** lze doplnit bezpečnostní úrovně k 8 309 systémům „Neuvedeno"? Existuje autoritativní mapování systém → cloud (komerční/gov)?
- **Otázka:** přesné prahy a kritéria vyhlášky pro tooltip — která verze vyhlášky je platná?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** semafor 1→4 se stavem „Neuvedeno = riziko", tooltip s výkladem, ETL `alarm` blok, karta „Rizikový radar" v Analytice, 1 step v CHANGELOG. ~1 den (staví na již opraveném `badgeSec`).
- **Fáze 2:** dimenze na grafu závislostí (obarvení uzlů) a v mini-dashboardech; filtr v seznamu ISVS.
- **Fáze 3:** formulář kritických agend vyplňující BÚ i kritičnost najednou; doplnění úrovní od DIA.
