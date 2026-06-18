# 19 — Pohledy „kde můžeme být lepší" + princip demonstrace hodnoty i bez dat

> **Změna 19 — Pohledy „kde můžeme být lepší" + demonstrace hodnoty i bez dat** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Tato změna zavádí **agregační „akční" pohled napříč dimenzemi systémů**, který jasně ukazuje, *kde můžeme být lepší* — co je červené a co zelené v napojení na ISSS, existenci dokumentace, bezpečnostní úrovni, API a cloudu. Místo izolovaných obrazovek dostane DIA jeden seřazený přehled konkrétních mezer podle dopadu: „tyto systémy nemají dokumentaci", „tady chybí API", „tady neznáme bezpečnostní úroveň". Druhým, stejně důležitým pilířem je **metodický princip pro chybějící data**: i tam, kde data nemáme (cloud, bezpečnostní úroveň, DSP), ukážeme „jak by ten pohled byl užitečný, kdyby data existovala". Nástroj tím získává dvojí roli — analyzuje, co v otevřených datech je, *a zároveň* funguje jako poptávka po chybějících datech a důkaz jejich hodnoty. To je hlavní „prodejní" výstup pro DIA: ukázat, kam investovat a co metodicky vymáhat. Pohled je navržen tak, aby šlo **průběžně přidávat nové dimenze** — dívat se na stejná data „jinak a jinak".

## 2. Obchodní kontext a zdůvodnění (BRD)

Na poradě 16. 6. 2026 Jakub Bareš navrhl: „pojďme nechat vizualizovat všechno o těch systémech, kde můžeme být lepší — co je červené, co zelené" (napojení na ISSS, existence dokumentace, bezpečnostní úroveň). Jde o agregační pohled napříč dimenzemi (digitalizace vstupu, ISSS, dokumentace, bezpečnostní úroveň, API, cloud), který ukazuje konkrétní mezery seřazené dle dopadu — tedy ne „co je špatně" plošně, ale „kde má smysl začít".

Druhý, koncepčně zásadní bod je **demonstrace hodnoty i bez dat**. Jakub to formuloval jako princip: „my ta data nemáme, nejsme schopni je dát, ale když řekneme — takovýhle pohled by byl fajn — tak se třeba podaří data sehnat." Tím se nástroj stává nejen analytikem dostupných dat, ale i **nástrojem poptávky**: prázdná dlaždice s popiskem „kdyby data byla, viděli bychom X" je argument pro DIA, aby data doplnila a metodicky vymáhala. Tato dvojí role je hlavní obchodní hodnota — DIA dostane mapu, kam investovat. Jakub navíc zdůraznil rozšiřitelnost: „je možné konstantně doplňovat takové pohledy a dívat se na to jinak a jinak", takže architektura musí umožnit přidávat dimenze průběžně bez přepisu.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / cílový uživatel | Bohdan Urban (DIA) | „Kam investovat", co metodicky vymáhat |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Vyznění „příležitost", ne audit |
| Doménový expert RPP | Petr Kučera (PowerPatterns) | Korektnost dimenzí a jejich zdrojů |
| Autor / vývojář | Jakub Bareš (Metamatics) | Rozšiřitelný pohled + placeholdery „kdyby data byla" |
| Krizový expert | Mirek Lukeš | Pohled „kde jsou slabá místa" pro odolnost |
| Pracovní skupina | PS07 kGovernment | Konzistence se znalostní vrstvou |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-19-1 | Agregační pohled (route `#/kde-lepe`) zobrazí systémy/kategorie napříč dimenzemi: ISSS, dokumentace, bezpečnostní úroveň, API, cloud, digitalizace vstupu. |
| FR-19-2 | Každá dimenze má stav zelená / žlutá / červená + textový ekvivalent (ne jen barva). |
| FR-19-3 | Výstupem je seznam konkrétních mezer **seřazený dle dopadu** (kritičnost × velikost mezery). |
| FR-19-4 | Dimenze bez dat se zobrazí jako placeholder „kdyby data byla, viděli bychom…" — ne jako červená/nula. |
| FR-19-5 | Architektura dimenzí je **rozšiřitelná** — nová dimenze se přidá konfigurací, ne přepisem. |
| FR-19-6 | Proklik z mezery na detail dotčeného systému (`#/isvs/<id>`) nebo agendy. |
| FR-19-7 | U každé dimenze je vidět, zda je „reálná z RPP" / „odvozená" / „chybí" (návaznost na rozlišení reálná × odvozená × chybějící data). |

**Nefunkční**

- **NFR-19-1 (bezpečnost):** pouze veřejná open data RPP + odborné poznámky; žádný neveřejný zdroj.
- **NFR-19-2 (výkon):** agregace předpočítaná v ETL; prohlížeč jen čte (< 300 ms).
- **NFR-19-3 (čeština, dům-styl):** popisky, stavy, placeholdery česky.
- **NFR-19-4 (přístupnost):** stav vždy textem i barvou; neutrální škála dopadu (ne dobré/špatné), v souladu s BESP opravou.
- **NFR-19-5 (idempotence ETL):** agregace dimenzí drop & rebuild.
- **NFR-19-6 (poctivost):** chybějící data se nikdy nevydávají za nulu — vždy placeholder s vysvětlením.

## 5. User stories / use cases

- Jako **expert DIA** chci jeden seřazený přehled mezer, abych věděl, kde začít a co vymáhat.
- Jako **stratég** chci u chybějící dimenze vidět „kdyby data byla, viděli bychom X", abych odůvodnil poptávku po datech.
- Jako **krizový analytik** chci najít systémy s vysokým dopadem a slabou dokumentací/bezpečností, abych odhadl rizika.
- Jako **vývojář** chci přidat novou dimenzi (např. „MFA") jen konfigurací, ne přepisem pohledu.

## 6. Datový model a zdroje dat

Zdroj: `app/data/isvs.json` (`bezuroven`, `umisteni` cloud/on-prem, `agendy[]`, `spravce`), `app/data/agendy.json`, `app/data/meta.json` (distribuce). Nová sada **`app/data/dimenze.json`** — konfigurace dimenzí + předpočítané agregace:

```json
{
  "dimenze": [
    {"klic":"dokumentace", "nazev":"Existence dokumentace (DSP)",
     "zdroj":"chybi", "placeholder":"Kdyby data byla, viděli bychom podíl systémů bez DSP."},
    {"klic":"bezuroven", "nazev":"Bezpečnostní úroveň",
     "zdroj":"realne", "rozlozeni":{"4":67,"3":357,"neuvedeno":8309}},
    {"klic":"cloud", "nazev":"Umístění (cloud/on-prem)", "zdroj":"realne"},
    {"klic":"api", "nazev":"Strojové rozhraní (API)", "zdroj":"odvozene"},
    {"klic":"isss", "nazev":"Napojení na ISSS", "zdroj":"chybi", "placeholder":"…"}
  ],
  "mezery": [{"isvs":"isvs/…", "dimenze":"bezuroven", "stav":"red", "dopad":4}]
}
```

**Co je v RPP a co chybí:** bezpečnostní úroveň a cloud/on-prem jsou v RPP (byť často „Neuvedeno"); **dokumentace (DSP), napojení na ISSS a část API/cloud detailů v RPP nejsou** — tyto dimenze jsou „chybí" a renderují se jako placeholder „kdyby data byla". Pole `zdroj` (realne / odvozene / chybi) je povinné u každé dimenze — naplňuje rozlišení reálná × odvozená × chybějící data.

## 7. Architektura řešení

- **ETL `etl/build_client_data.py`:** nová funkce, která pro každou *reálnou* dimenzi spočítá rozložení a identifikuje mezery (systém s vysokým dopadem + chybějící/slabou hodnotou), seřadí dle dopadu (kompozitní skóre kritičnosti — sdílí logiku `IMPORTANCE`/`bezuroven` z oprav v `06_*`) a zapíše `dimenze.json`. Dimenze „chybí" jen zaregistruje s placeholderem. Idempotentní, drop & rebuild.
- **`app/app.js`:** nová route `#/kde-lepe` s render funkcí, která iteruje **konfiguraci dimenzí** (proto rozšiřitelnost — přidání dimenze = přidání záznamu v `dimenze.json`/slovníku). Sdílí badge/chip helpery a neutrální škálu dopadu.
- **Datový tok:** RPP JSON → ETL agregace dimenzí + detekce mezer → `dimenze.json` → `kdeLepe()` render (matice systém × dimenze + seřazený seznam mezer) → proklik na detail.
- **Integrace:** dlaždice „Kde můžeme být lepší" se přidá na dashboard a do `#/gap`; dimenze sdílejí slovník schopností/kategorií se Změnou 01 (mini-dashboardy), takže lze pohled zavěsit i do oblasti.

## 8. UI/UX

Route `#/kde-lepe`. Nahoře **seřazený seznam mezer dle dopadu** (nejdůležitější akce první) — řádek: systém/kategorie | dimenze | stav-chip | dopad | proklik. Pod ním **matice systém × dimenze** se semaforovými chipy (zelená/žlutá/červená + text). Dimenze „chybí" je vizuálně odlišená (např. šedá/šrafovaná) s popiskem „kdyby data byla, viděli bychom…". U každé dimenze štítek zdroje (reálná / odvozená / chybí). Neutrální škála dopadu (ne „dobré/špatné") v souladu s opravou BESP. Zápis do `CHANGELOG` (`app/app.js:1837`) jako nová verze **v11.0**, tag „Kde můžeme být lepší — akční mezery", step `{icon:'🚦', title:'Mezery seřazené dle dopadu', body:'Nově vidíte napříč systémy, co je červené a co zelené (dokumentace, ISSS, bezpečnost, API, cloud) — a u chybějících dat ukazujeme, jak cenný by ten pohled byl, kdyby data existovala.', route:'#/kde-lepe'}`.

## 9. Akceptační kritéria

1. Route `#/kde-lepe` se vykreslí bez `window.onerror` a zobrazí ≥ 4 dimenze.
2. Seznam mezer je **seřazený dle dopadu** (systém s vyšší kritičností a horší hodnotou výš).
3. Aspoň jedna dimenze „chybí" se zobrazí jako placeholder „kdyby data byla…", **ne** jako červená nula.
4. Každá dimenze nese štítek zdroje (reálná / odvozená / chybí).
5. Stav je čitelný textem i barvou (přístupnost); škála dopadu je neutrální.
6. Přidání nové dimenze proběhne změnou konfigurace (`dimenze.json`/slovník), bez přepisu render funkce — ověřeno přidáním testovací dimenze.
7. `node --check app/app.js` projde; ETL vygeneruje `dimenze.json` idempotentně; novinka je nejnovější v `#/pruvodce`.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko zkreslení dopadu:** řazení mezer závisí na korektní metrice kritičnosti (oprava A1/A5 z `06_*`). Mitigace: sdílet už opravenou logiku, ne počet agend.
- **Riziko „samá červená":** příliš mnoho chybějících dat může vypadat jako audit chyb. Mitigace: tón „příležitost", placeholdery místo červené, řazení dle dopadu (málo akcí nahoře).
- **Závislost:** sdílí slovník kategorií se Změnou 01 a rozlišení reálná × odvozená × chybějící data.
- **Otázka na DIA:** která data k dimenzím „dokumentace" a „ISSS" reálně existují (byť neveřejně) a šla by metodicky vymáhat?
- **Otázka na DIA:** které dimenze jsou pro DIA nejcennější jako poptávka — kam směřovat „kdyby data byla"?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** route `#/kde-lepe`, 3 reálné dimenze (bezpečnostní úroveň, cloud/on-prem, počet ústředních agend) + 2 placeholderové (dokumentace, ISSS), seřazený seznam mezer, dlaždice na dashboardu, 1 zápis do CHANGELOG. ~1 den.
- **Fáze 2:** doplnění dimenzí API a digitalizace vstupu, zavěšení do mini-dashboardů oblastí (Změna 01), profilace mezer člověkem.
- **Fáze 3:** napojení získaných dat (přes filtr ze Změny 16) na dříve chybějící dimenze a průběžné přidávání nových pohledů „jinak a jinak".
