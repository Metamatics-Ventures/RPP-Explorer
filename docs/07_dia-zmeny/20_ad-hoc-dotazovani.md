# 20 — Ad-hoc dotazování nad daty v přirozeném jazyce

> **Změna 20 — Ad-hoc dotazování nad daty v přirozeném jazyce** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Tato změna rozvíjí funkci, kterou Jakub Bareš ukázal v demu jako „dobrou hračku" — **volný dotaz nad daty v přirozeném jazyce** — do plnohodnotné funkce ad-hoc dotazování a generování reportů na míru. Uživatel (expert DIA, krizový analytik, stratég) položí otázku běžnou češtinou — např. „kolik existuje systémů, které se starají o Ministerstvo vnitra a spravuje je firma začínající na první dvě písmena…" — a nástroj nad daty RPP (postupně i nad dalšími zdroji jako e-Sbírka ze Změny 10) vygeneruje odpověď nebo report. Tím se zhodnocuje hlavní deviza projektu — **rychlost**: místo aby se pro každou novou otázku programoval nový pohled, zeptá se uživatel sám. Klíčová podmínka pro státní použití je **přesnost a transparentnost**: nástroj musí vždy ukázat, z jakých dat odpověď vznikla (jaký dotaz/filtr proběhl), aby zůstal důvěryhodný a ověřitelný. Funkce architektonicky navazuje na **už existující lokální „databázi" a jednoduché SQL** v `app/app.js`.

## 2. Obchodní kontext a zdůvodnění (BRD)

V demu 16. 6. 2026 Jakub předvedl volný dotaz nad daty (parafráze: „kolik existuje systémů, které se starají o Ministerstvo vnitra a spravuje je firma začínající na první dvě písmena…"). Petr Kučera to ocenil jako „způsob, jak to konečně inteligentně prezentovat"; Jakub to označil za „dobrou hračku, docela cool". Kontext porady byl ale širší: statické dashboardy jsou pro Jakuba „nuda" a „reálný use case musíme teprve vymyslet společně" — proto je volný dotaz strategicky důležitý. Projekt si zakládá na rychlosti dodávky („data v pátek, prototyp v sobotu", „během pár hodin dáme dohromady") a volný dotaz tuto rychlost posouvá až k uživateli: nemusí čekat na nový naprogramovaný pohled, zeptá se sám.

Obchodní hodnota: ad-hoc dotazování dělá z nástroje **dialogový analytický nástroj** místo sady pevných obrazovek — přesně to, co DIA potřebuje pro průzkum vlastních dat. Bohdan i Jakub se domluvili připravit na pátek konkrétní use case podle toho, „co by pro vás bylo užitečné" — volný dotaz je univerzální nosič takových use casů. Riziko a zároveň podmínka úspěchu pro státní použití je důvěryhodnost: odpověď musí být **doložitelná** (z jakých dat, jakým dotazem vznikla), jinak nástroj ztratí kredit. Proto je transparentnost (zobrazení podkladového dotazu a zdrojů) první třídy, ne doplněk.

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / cílový uživatel | Bohdan Urban (DIA) | Ptát se vlastních dat bez programování |
| Demo / „cool faktor" | Petr Kučera (PowerPatterns) | Inteligentní prezentace dat |
| Krizový expert | Mirek Lukeš | Rychlé ad-hoc otázky nad systémy/agendami |
| Strategie | Jaroslav Pejčoch (AFCEA) | Use case „co by bylo užitečné" na pátek |
| Autor / vývojář | Jakub Bareš (Metamatics) | NL→dotaz nad lokální DB + mantinely |
| Pracovní skupina | PS07 kGovernment | Důvěryhodnost pro státní použití |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-20-1 | Uživatel zadá otázku v přirozené češtině do dotazovacího pole (route `#/dotaz`). |
| FR-20-2 | Nástroj přeloží otázku na dotaz nad lokální „databází" (NL→SQL/filtr) a vrátí odpověď. |
| FR-20-3 | Odpověď zobrazí výsledek (číslo, tabulka, seznam) i **podkladový dotaz** (transparentnost). |
| FR-20-4 | Vždy je vidět, **z jakých dat / sad** odpověď vznikla (RPP entity, později další zdroje). |
| FR-20-5 | Výsledek lze proklikem otevřít jako detail entity (`#/isvs/<id>`, `#/agenda/<id>`). |
| FR-20-6 | Z odpovědi lze vygenerovat jednoduchý report (export / tisknutelný přehled). |
| FR-20-7 | Při neporozuměné otázce nástroj řekne, čemu nerozuměl, a nabídne příklady — nehalucinuje. |

**Nefunkční (bezpečnost a ochrana dat — klíčové)**

- **NFR-20-1 (bezpečnost dat):** dotazování běží **pouze nad veřejnými open daty** v prohlížeči/lokálně; citlivá data (DSP) sem **nesmí** vstoupit a nesmí být odeslána do veřejného LLM/cloudu (vazba na Změnu 16).
- **NFR-20-2 (mantinely dotazu):** překlad generuje pouze **čtecí** dotazy (SELECT) nad lokální DB; žádný zápis, žádné spuštění libovolného kódu.
- **NFR-20-3 (transparentnost):** každá odpověď nese podkladový dotaz a zdroj dat — bez „černé skříňky".
- **NFR-20-4 (přesnost):** raději přiznat „nevím / neumím přeložit" než dát nepodložené číslo; čísla musí odpovídat lokální DB.
- **NFR-20-5 (čeština, dům-styl):** vstup i výstup česky.

## 5. User stories / use cases

- Jako **expert DIA** chci se zeptat „kolik ISVS s bezpečnostní úrovní 4 spravuje DIA", abych dostal odpověď bez čekání na nový pohled.
- Jako **krizový analytik** chci „které agendy čtou z ROB", abych rychle našel závislosti.
- Jako **uživatel** chci u odpovědi vidět dotaz a zdroj, abych jí mohl věřit a ověřit ji.
- Jako **stratég** chci z odpovědi udělat report na míru pro konkrétní jednání.

## 6. Datový model a zdroje dat

Zdroj: stávající lokální „databáze" sestavená v prohlížeči z `app/data/*.json` (agendy, isvs, ovm, sluzby, udaje, opravneni, names, meta) — táž, nad kterou už běží jednoduché SQL/JOIN a kontroly kvality (verze v2.0 dle CLAUDE.md). Žádná nová datová sada není nutná; volitelně **`app/data/dotaz_priklady.json`** se sadou předpřipravených příkladových otázek a jejich ověřených dotazů (slouží jako few-shot pro překlad a jako nápověda v UI). Postupně lze zahrnout další zdroje (e-Sbírka, Změna 10) přidáním jejich sad do lokální DB. Citlivá data (DSP) se do této DB **nikdy** nenačítají (NFR-20-1).

## 7. Architektura řešení

- **`app/app.js`:** nová route `#/dotaz` s render funkcí a dotazovacím polem; navazuje na existující vrstvu lokální DB + SQL (funkce databáze/SQL z verze v2.0). Jádrem je **překlad NL→dotaz**:
  - **Varianta A (bez cloudu, preferovaná pro citlivost):** šablonový/gramatický překlad — rozpoznání entit, atributů a operátorů z otázky a sestavení parametrizovaného SELECT nad lokální DB. Žádné odeslání dat ven. Vhodné pro běžné dotazy (počty, filtry, JOIN).
  - **Varianta B (volitelná, jen veřejná data):** NL→SQL přes jazykový model **pouze nad metadaty schématu** (názvy tabulek/sloupců), ne nad obsahem; vygenerovaný SELECT se validuje (jen čtení, whitelist tabulek) a spustí lokálně. Pro citlivá data zakázáno (NFR-20-1).
- **Bezpečnostní mantinely:** generuje se výhradně SELECT, parametrizovaně, s whitelistem tabulek/sloupců a limitem řádků; žádný zápis ani eval. Validátor odmítne vše mimo whitelist.
- **Datový tok:** otázka → překlad (A/B) → validace dotazu → spuštění nad lokální DB → výsledek + podkladový dotaz + zdroj → render → proklik / export.
- **Integrace:** sdílí lokální DB a SQL vrstvu; reporty využijí stávající render tabulek; rozšiřitelné o další zdroje.

## 8. UI/UX

Route `#/dotaz`. Nahoře vstupní pole „Zeptejte se dat…" s příklady otázek (z `dotaz_priklady.json`). Po odeslání: **odpověď** (číslo / tabulka / seznam s prokliky), pod ní rozbalovací panel **„Jak odpověď vznikla"** s podkladovým dotazem (SQL/filtr) a **zdrojem dat** (které sady RPP). Tlačítko „Vytvořit report". Při neporozumění hláška „Nerozuměl jsem části…" + návrhy. Vše neutrální, důvěryhodné, česky. Zápis do `CHANGELOG` (`app/app.js:1837`) jako nová verze **v12.0**, tag „Ptejte se dat přirozeným jazykem", step `{icon:'💬', title:'Volný dotaz nad daty', body:'Nově se můžete zeptat běžnou češtinou (např. „které agendy čtou z ROB") a nástroj odpoví — a vždy ukáže, z jakých dat a jakým dotazem odpověď vznikla.', route:'#/dotaz'}`.

## 9. Akceptační kritéria

1. Route `#/dotaz` se vykreslí bez `window.onerror`; pole přijme českou otázku.
2. Aspoň 3 příkladové otázky vrátí **správnou** odpověď ověřitelnou proti lokální DB.
3. U každé odpovědi je viditelný podkladový dotaz **a** zdroj dat (transparentnost).
4. Generovaný dotaz je vždy jen **čtecí** (SELECT); pokus o zápis/jiný příkaz je odmítnut validátorem.
5. Žádná data neopouštějí prohlížeč směrem do veřejného LLM/cloudu ve variantě A; ve variantě B jde ven jen schéma, ne obsah, a jen pro veřejná data.
6. Neporozuměná otázka vede k poctivé hlášce + příkladům, **ne** k vymyšlenému číslu.
7. Výsledek lze proklikem otevřít jako detail entity a exportovat jako report.
8. `node --check app/app.js` projde; novinka je nejnovější verzí v `#/pruvodce`.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko přesnosti překladu:** NL→dotaz může otázku pochopit špatně. Mitigace: zobrazení podkladového dotazu (uživatel ověří), poctivé „nevím" místo dohadu, few-shot příklady.
- **Riziko důvěryhodnosti:** jedno chybné číslo na demu poškodí kredit u DIA. Mitigace: transparentnost + omezení na ověřené třídy dotazů v MVP.
- **Riziko bezpečnosti:** pokušení použít veřejný LLM nad obsahem dat. Mitigace: tvrdé pravidlo NFR-20-1, varianta A jako default, varianta B jen nad schématem a veřejnými daty.
- **Závislost:** stávající lokální DB + SQL vrstva (v2.0); volitelně e-Sbírka (Změna 10).
- **Otázka na DIA:** jaký konkrétní use case připravit na pátek („co by pro vás bylo užitečné")?
- **Otázka:** je přípustné použít cloudový LLM nad veřejnými daty (varianta B), nebo trvat na plně lokálním řešení i pro veřejnou část?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** route `#/dotaz`, varianta A (šablonový překlad) pro ~5 tříd otázek (počty, filtr dle atributu, JOIN agenda↔ISVS, „kdo čte/zapisuje"), panel „Jak odpověď vznikla", 5 příkladů, 1 zápis do CHANGELOG. ~1–1,5 dne.
- **Fáze 2:** varianta B (NL→SQL nad schématem, veřejná data) s validátorem; generování reportů; více tříd otázek.
- **Fáze 3:** zahrnutí dalších zdrojů (e-Sbírka) do dotazů; uložené dotazy a sdílené reporty; napojení na znalostní vrstvu.
