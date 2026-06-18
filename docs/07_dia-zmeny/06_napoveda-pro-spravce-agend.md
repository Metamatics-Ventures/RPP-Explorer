# 06 — Texty, nápověda a „hesla" pro správce agend

> **Změna 06 — Texty, nápověda a „hesla" pro správce agend** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Záznamy v RPP nevyplňují technici, ale **věcní správci agend** — typicky právníci, kteří popis agendy do registru původně vkládali. Pro ně je RPP cizí, formulářové prostředí a kvalita zápisu kolísá podle toho, jak dobře pochopí smysl jednotlivých polí a vazeb. Tato změna doplňuje do RPP Exploreru **vrstvu vysvětlujících textů, nápověd a metodických pokynů přímo v UI** — krátká „hesla" pro různé správce, která jim u každého kroku řeknou, *co* se po nich chce, *proč* to dělají a *podle jakého kritéria* mají pole vyplnit. Druhá část je **lehký metodický nástroj na typické chyby**: a priori upozornění typu „milí správci, typicky tu máme deset chyb — zkontrolujte, jestli některá není relevantní, a spojte se předem se svým IT oddělením", ne ex post audit. Bohdan Urban tento směr výslovně podpořil: metodická pomoc je jediné, co DIA jako správce RPP smí dělat („nemůžeme sahat správcům do byznysu, maximálně metodická pomoc"), a tento výstup by podle něj „mohl být zajímavý". Změna je levná, neinvazivní a má vysoký dopad na kvalitu dat u zdroje.

## 2. Obchodní kontext a zdůvodnění (BRD)

Problém má jasný kořen: RPP je naplňováno lidmi, kteří nejsou jeho autory ani techniky. Bohdan na poradě připomněl, že záznam zakládá právník a teprve mnohem později ho někdo technicky pročistí — mezi tím nikdo neví, jestli je vyplněn dobře. Jakub navrhl připravit „nějaká hesla pro různé správce agend" — tedy ne jednu obecnou nápovědu, ale cílené vysvětlující texty pro typické situace. Bohdan to rozšířil na obecné návody: „typicky máme deset chyb, milí správci, zkontrolujte, jestli některá není relevantní, a spojte se se svým IT oddělením". Klíčová je formulace **a priori, ne ex post** — nástroj nemá kárat za chyby, které už vznikly, ale nasměrovat správce *dřív, než* je udělá.

Hodnota pro DIA: jako správce RPP nesmí DIA zasahovat do byznysu resortů, ale **metodicky pomáhat smí, a je to dokonce jediná páka, kterou má**. Vysvětlující texty a kontrolní hesla jsou přesně tou metodickou pomocí — DIA je může nabídnout jako svůj nástroj, který zvyšuje kvalitu dat bez jakéhokoli direktivního zásahu. Je to levné (texty, ne kód datové vrstvy), rychlé a měřitelné: čím lépe správce rozumí poli, tím méně prázdných a chybných záznamů vzniká. Navíc to přímo podporuje navigaci při vyplňování formuláře (vazba na Změny 03 a 05) a snižuje budoucí náklady na čištění dat (vazba na Změnu 08).

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / správce RPP | Bohdan Urban (DIA) | Metodická pomoc správcům jako legitimní páka DIA |
| Cílový uživatel | Věcný správce agendy (právník resortu/úřadu) | Pochopit, co a proč vyplnit; vyhnout se typickým chybám |
| Doménový expert RPP | Petr Kučera (PowerPatterns) | Korektnost metodických tvrzení o polích RPP |
| Strategie/prezentace | Jaroslav Pejčoch (AFCEA) | Pozitivní rámec „pomáháme", ne „kritizujeme" |
| Autor / vývojář | Jakub Bareš (Metamatics) | Implementace textové vrstvy v `app.js`, údržba slovníku |
| IT oddělení správce | (resortní/úřední IT) | Adresát výzvy „zkontrolujte s IT předem" |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-06-1 | U každého klíčového pole/karty (toky R/W, bezpečnostní úroveň, rodina, napojení na ISSS, platnost) je dostupná kontextová nápověda „co to je / proč / jak vyplnit". |
| FR-06-2 | Nástroj nabízí sadu **metodických hesel** pro typické role správce (právník zakládající agendu, datař pročišťující záznam, správce ISVS). |
| FR-06-3 | Existuje seznam **„typických 10 chyb"** formulovaný a priori (druhá osoba, konkrétní příklad, výzva ke kontrole). |
| FR-06-4 | Každá chyba v seznamu obsahuje výzvu „zkontrolujte se svým IT oddělením předem". |
| FR-06-5 | Texty navigují při vyplňování formuláře (provázáno se Změnou 03/05): u každého kroku stručné vysvětlení smyslu. |
| FR-06-6 | Nápovědy jsou stručné (1–3 věty), psané druhou osobou, s konkrétním příkladem z reálných dat RPP. |
| FR-06-7 | Texty jsou centralizované ve slovníku (jedno místo k údržbě), ne roztroušené v renderu. |

**Nefunkční**

- **NFR-06-1 (tón):** metodická pomoc, nikdy audit/výtka; rámec „příležitost pro DIA / pomoc správci".
- **NFR-06-2 (čeština):** vše česky, dům-styl, druhá osoba jednotného/množného čísla podle kontextu.
- **NFR-06-3 (přístupnost):** nápovědy dostupné textově (tooltip + rozbalitelný panel), ne jen ikonou.
- **NFR-06-4 (bezpečnost):** výhradně veřejná open data a obecná metodika; žádný neveřejný zdroj ani osobní data.
- **NFR-06-5 (údržba):** přidání/změna textu bez zásahu do datové logiky; jedna konstanta `NAPOVEDA`.

## 5. User stories / use cases

- Jako **právník zakládající agendu** chci u pole „bezpečnostní úroveň" vidět, podle čeho ji určit (dle vyhlášky, dle dopadů, práh 125 tis. obyvatel), abych ji nevyplnil náhodně nebo nenechal „Neuvedeno".
- Jako **správce** chci před odevzdáním vidět seznam „typických 10 chyb", abych si zkontroloval, jestli se některá netýká mého záznamu.
- Jako **správce** chci u chyby „chybí napojení na ISSS" výzvu obrátit se na IT, protože sám to technicky neposoudím.
- Jako **datař resortu** chci heslo „než pročistíš záznam, ověř poslední platnou verzi agendy", abych needitoval historickou verzi.
- Jako **expert DIA** chci texty rámované jako pomoc, abych je mohl nabídnout správcům jako službu DIA, ne jako kritiku.

## 6. Datový model a zdroje dat

Změna je převážně **textová/UI**, nepřidává novou datovou sadu z ETL. Texty žijí v nové konstantě v `app/app.js`:

```js
const NAPOVEDA = {
  bezuroven: { co:'Bezpečnostní úroveň dle vyhlášky…', proc:'…', jak:'Stanovuje správce dle dopadů; práh 125 tis. obyvatel; úroveň 4 typicky registry.' },
  rw:        { co:'Směr toku údaje R/W…', proc:'…', jak:'R = čtete z registru, W = zapisujete (editor).' },
  isss:      { co:'Napojení na ISSS…', proc:'…', jak:'Zkontrolujte s IT, zda je systém napojen na Egon Service Bus / ISSS.' }
  /* … */
};
const TYPICKE_CHYBY = [ {nazev:'Prázdná povinná pole', priklad:'…', kontrola:'Zkontrolujte s IT předem.'}, /* …10× */ ];
```

Příklady do textů se čerpají z reálných distribucí v `app/data/meta.json` (např. „8 309 z 12 110 systémů má bezpečnostní úroveň ‚Neuvedeno'") — aby nápověda byla konkrétní, ne abstraktní. Žádné nové ETL výstupy nejsou nutné; volitelně lze později generovat počty chyb per resort (vazba na Změnu 08).

## 7. Architektura řešení

- **`app/app.js`:** nová konstanta `NAPOVEDA` (slovník hesel) a `TYPICKE_CHYBY` (10 položek). Sdílí už existující helper pro „vysvětlivku" `dvd()`/`dH()` (viz `app/app.js:247`, `app/app.js:479`), takže tooltipy se napojí na stejnou komponentu. Nová route `#/metodika` s render funkcí `metodika()` pro souhrnnou stránku „Pro správce agend" (hesla + 10 chyb). U formulářových kroků (Změna 03/05) se vkládá kontextová nápověda z `NAPOVEDA`.
- **`etl/build_client_data.py`:** beze změny pro MVP; volitelně rozšířit `meta.json` o agregát „typické chyby per resort" pro provázání se Změnou 08.
- **Datový tok:** statické texty (slovník) → render do tooltipů a stránky `#/metodika`; konkrétní čísla čtena z `meta.json` při renderu.
- **Integrace:** sdílí tón a legendu původu hodnot s verzí 6.1; navazuje na formulářové průvodce (Změny 03/05) a na zdraví dat (Změna 08).

## 8. UI/UX

Dvě roviny. (1) **Kontextová nápověda** — u klíčových polí ikona „?" otevírající krátký panel se třemi řádky: *Co to je · Proč to vyplňujete · Jak to vyplnit (s příkladem)*. (2) **Stránka „Pro správce agend"** (route `#/metodika`, sekce Nápověda): nahoře hesla podle role (karty „Jsem právník zakládající agendu", „Pročišťuji záznam", „Spravuji systém"), pod nimi výrazný blok **„Typických 10 chyb — zkontrolujte předem"**: očíslovaný seznam, každá položka = název chyby + konkrétní příklad + výzva „spojte se se svým IT oddělením předem". Tón vlídný, druhá osoba. Zápis do `CHANGELOG` (`app/app.js:1837`): nová verze, tag „Metodika pro správce agend", step `{icon:'🧭', title:'Nápověda a 10 typických chyb pro správce', route:'#/metodika'}`.

## 9. Akceptační kritéria

1. Route `#/metodika` se renderuje bez `window.onerror` a obsahuje hesla podle role i seznam „10 chyb".
2. Seznam typických chyb má 10 položek, každá s konkrétním příkladem a výzvou ke kontrole s IT.
3. U ≥ 3 klíčových polí (bezpečnostní úroveň, R/W, napojení na ISSS) je kontextová nápověda „co/proč/jak".
4. Texty jsou v druhé osobě, stručné (1–3 věty), s příkladem z reálných dat RPP.
5. Alespoň jeden příklad cituje reálné číslo z `meta.json` (např. počet „Neuvedeno").
6. Tón je metodický (pomoc), nikde formulace typu „máte chybu/bordel".
7. `node --check app/app.js` projde; novinka je v `#/pruvodce` jako nejnovější verze.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko tónu:** text může nechtěně vyznít jako kritika. Mitigace: revize Jaroslavem (prezentace), formulace v „my pomáháme".
- **Riziko věcné správnosti:** metodická tvrzení o polích RPP musí být přesná. Mitigace: revize Petrem Kučerou.
- **Závislost:** formulářové kroky (Změny 03/05) — nápověda se na ně věší; ideálně vyvíjet společně.
- **Závislost:** seznam „10 chyb" se opírá o katalog chyb ze Změny 08 (automatická detekce) — měly by sdílet jednu definici chyb.
- **Otázka na DIA:** Má DIA už existující metodiku/checklist pro správce, který lze převzít místo psaní od nuly? Jaké chyby DIA při onboardingu reálně nejčastěji vidí?
- **Otázka:** Chce DIA texty publikovat veřejně, nebo jen za branou nástroje?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** konstanta `NAPOVEDA` + `TYPICKE_CHYBY` (10 položek), stránka `#/metodika`, kontextová nápověda u 3 polí, 1 zápis do CHANGELOG. ~0,5–1 den (převážně psaní textů, revize Kučera/Pejčoch).
- **Fáze 2:** napojení nápověd na všechny formulářové kroky (Změny 03/05); příklady čerpané dynamicky z `meta.json`.
- **Fáze 3:** počty „typických chyb per resort" z katalogu Změny 08; personalizace hesel podle role přihlášeného správce (pokud bude DIA chtít).
