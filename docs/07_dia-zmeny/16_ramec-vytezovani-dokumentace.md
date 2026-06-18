# 16 — Rámec pro agentní (AI) vytěžování dokumentace skutečného provedení (DSP)

> **Změna 16 — Rámec pro agentní vytěžování dokumentace skutečného provedení** · Priorita P3 (samostatný směr) · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Tato změna je svým charakterem odlišná od ostatních: **neběží nad otevřenými daty** a je nejnáročnější i nejcitlivější ze všech. Jejím cílem je navrhnout **rámec pro agentní (AI) vytěžování dokumentace skutečného provedení (DSP)** informačních systémů — tedy způsob, jak z roztříštěné, přírůstkové dokumentace (původní dokumentace + řada změnových listů) poskládat aktuální, strukturovaný popis systému. Dnes totiž DSP v konsolidované strukturované podobě „skoro u žádného systému neexistuje" — neexistuje „úplné znění" jako u konsolidovaného zákona, jen vrstvy změn. Klíčové je, že tento směr **musí být architektonicky oddělen** od veřejné části RPP Exploreru: vytěžování DSP probíhá v izolované, kontrolované „krabičce" agentního systému, ne ve veřejném cloudu a ne nad univerzálním jazykovým modelem. Mezi privátní část a cokoli, co jde ven, vstupuje **filtrační vrstva** s explicitními pravidly publikace. V tomto kroku **nestavíme** vytěžovací engine — navrhujeme architekturu oddělení a filtrační pravidla a ponecháváme směr jako samostatný, později řešený.

## 2. Obchodní kontext a zdůvodnění (BRD)

Na poradě 16. 6. 2026 Bohdan Urban (DIA) — s výslovnou prosbou „nebudete mě citovat" — přiznal, že i DIA má „bordel v popisu svých informačních systémů". DSP v aktuální strukturované podobě podle něj „skoro u žádného systému neexistuje": existuje původní dokumentace plus přírůstkové změnové listy, ne konsolidované „úplné znění". Z toho plyne potřeba rámce, který z této tříště poskládá aktuální strukturovaný popis systému — a to agentně, protože ruční konsolidace přes stovky systémů je neúnosná.

Bohdan zároveň stanovil **nepřekročitelné bezpečnostní omezení**: vytěžování nesmí běžet „ve veřejném cloudu nebo na základě univerzálního jazykového modelu", ale „opravdu v krabičce nějakého agentního systému" — tedy v izolovaném, kontrolovaném prostředí. Důvod je obranný: konsolidovaný popis systémů je mapa zranitelností a „někdo by mohl provést analýzu těch děr". Proto musí být součástí rámce i **pravidla pro publikaci ven a filtrace** — co smí jako otevřená data a co zůstane interní. Bohdan výslovně vyjmenoval mezi žádanými výstupy: „dokumentace, vytěžování dokumentace, rámec pro agentní vytěžování AI, pravidla pro publikaci ven, filtrace." Obchodní hodnota: DIA získá metodiku, jak dostat své systémy do strukturované podoby bez vystavení citlivých detailů — a RPP Explorer získá (přes filtr) doplněná data, která dnes v RPP chybí (např. DSP, reálné rozhraní).

## 3. Stakeholdeři a role

| Role | Jméno / útvar | Zájem |
|---|---|---|
| Sponzor / zadavatel | Bohdan Urban (DIA) | Konsolidace DSP bez úniku citlivých detailů |
| Architektura agentů | Petr Kučera (PowerPatterns) | Návrh „krabičky" a vytěžovacího toku |
| Bezpečnost / filtrace | DIA bezpečnostní útvar | Pravidla publikace, klasifikace dat |
| Strategie | Jaroslav Pejčoch (AFCEA) | Rámec jako služba DIA, ne hrozba |
| Autor / vývojář | Jakub Bareš (Metamatics) | Architektonické oddělení veřejné × privátní části |
| Pracovní skupina | PS07 kGovernment | Soulad se znalostní vrstvou (zdroj jako pilíř) |

## 4. Business požadavky

**Funkční**

| ID | Požadavek |
|---|---|
| FR-16-1 | Rámec popíše vstup: roztříštěná původní dokumentace + změnové listy jednoho systému. |
| FR-16-2 | Agentní pipeline poskládá z přírůstků aktuální strukturovaný popis („úplné znění" DSP). |
| FR-16-3 | Pipeline běží výhradně v izolované „krabičce" — bez veřejného cloudu a univerzálního LLM. |
| FR-16-4 | Filtrační vrstva klasifikuje každý prvek výstupu: veřejné / interní / utajené. |
| FR-16-5 | Ven (do veřejné části RPP Exploreru) projdou jen prvky klasifikované jako veřejné. |
| FR-16-6 | Filtrace je auditovatelná — každý publikovaný prvek nese stopu, proč směl ven. |
| FR-16-7 | Architektonické oddělení veřejné části (open data) a privátní části je doložené diagramem. |

**Nefunkční (bezpečnost a ochrana dat — klíčové)**

- **NFR-16-1 (izolace):** zpracování citlivé DSP probíhá v uzavřeném prostředí; data **nesmí** opustit krabičku ani být odeslána do veřejného LLM/cloudu. Toto je tvrdý, nepřekročitelný požadavek (Bohdan).
- **NFR-16-2 (obrana proti analýze zranitelností):** konsolidovaný popis je citlivý — výstup ven musí být zbaven detailů umožňujících „analýzu děr".
- **NFR-16-3 (jednosměrnost filtru):** mezi privátní a veřejnou částí teče jen filtrovaný, klasifikovaný výstup; opačným směrem nic.
- **NFR-16-4 (auditovatelnost):** každé rozhodnutí filtru je logované a přezkoumatelné.
- **NFR-16-5 (čeština, dům-styl):** dokumentace rámce a popisky česky.

## 5. User stories / use cases

- Jako **DIA** chci z hromady změnových listů dostat aktuální strukturovaný popis systému, aniž bych ho vystavil veřejně.
- Jako **bezpečnostní pracovník DIA** chci jistotu, že nic citlivého neopustí krabičku a že každý publikovaný prvek prošel filtrem.
- Jako **správce veřejné mapy** chci přijmout jen filtrovaná, bezpečná metadata k doplnění RPP.
- Jako **auditor** chci dohledat, proč konkrétní údaj směl ven.

## 6. Datový model a zdroje dat

**Tento směr neběží nad otevřenými daty.** Vstup je **neveřejný**: původní dokumentace + změnové listy DSP (drží DIA). Výstup ven je úzká, filtrovaná podmnožina — strukturovaná metadata, která lze bezpečně zveřejnit a případně doplnit do veřejného `app/data/*.json` (např. příznak „DSP konsolidována", typ rozhraní bez citlivých detailů). Privátní strukturovaný popis (plné „úplné znění" DSP) zůstává **uvnitř krabičky** a do repozitáře veřejné aplikace nikdy nevstupuje. Klasifikační schéma každého prvku: `verejne` / `interni` / `utajene` + důvod. RPP Explorer ve veřejné části přijímá pouze `verejne`.

## 7. Architektura řešení — oddělení veřejné a privátní („krabičkové") části

Architektura je rozdělena na **dvě fyzicky i logicky oddělené zóny** s jednosměrnou filtrační branou mezi nimi:

- **Veřejná zóna (stávající RPP Explorer):** statická SPA na mapastatu.cz (AWS S3 + CloudFront), `app/app.js`, `app/data/*.json`, ETL `etl/build_client_data.py` nad veřejnými RPP daty. Sem **nesmí** vstoupit nic neveřejného.
- **Privátní „krabička" (nová, oddělená):** izolované prostředí (on-premise / uzavřený okruh DIA), kde běží agentní pipeline vytěžování DSP nad lokálním modelem. Žádné volání veřejného LLM/cloudu. Vstup: změnové listy. Výstup: privátní strukturovaný popis.
- **Filtrační vrstva (brána):** jediný kanál mezi zónami. Klasifikuje, redukuje a propustí ven jen `verejne` prvky; vše loguje. Tok je **jednosměrný** (privátní → filtr → veřejné), nikdy obráceně.

Datový tok: změnové listy → krabička (agentní konsolidace) → privátní DSP → filtr (klasifikace + redukce) → bezpečná metadata → (volitelně) doplnění veřejných `app/data/*.json`. Stávající veřejný ETL a `app.js` se nemění — jen mohou přijmout filtrovaná pole. Integrace s DIA: krabička je provozována v prostředí DIA; AFCEA dodává návrh rámce a filtračních pravidel.

## 8. UI/UX

V tomto kroku **bez nové funkční obrazovky** ve veřejné aplikaci — jde o architektonický rámec. Ve veřejné části se promítne nanejvýš tak, že karta „Hranice RPP" (Analytika) a případné DSP-příznaky zmíní, že část metadat pochází z filtrovaného vytěžování DSP. Hlavním výstupem je **dokumentace rámce + diagram oddělení zón + tabulka filtračních pravidel**. Zápis do `CHANGELOG` (`app/app.js:1837`) je v této fázi pouze informativní — nová verze **v10.0**, tag „Rámec vytěžování DSP (architektura)", step `{icon:'🔒', title:'Oddělení veřejné a krabičkové části', body:'Navrhli jsme, jak by šlo bezpečně vytěžovat dokumentaci systémů v izolované krabičce — citlivá data ven nejdou, projde jen filtrovaný výřez.', route:'#/analytika'}`. Žádná uživatelská funkce nad citlivými daty se nepublikuje.

## 9. Akceptační kritéria

1. Dokument rámce obsahuje **diagram dvou oddělených zón** (veřejná × krabička) s jednosměrnou filtrační branou.
2. Filtrační pravidla jsou popsána jako tabulka: typ prvku → klasifikace → smí ven (ano/ne) → důvod.
3. Je explicitně doloženo, že žádné citlivé DSP ani volání univerzálního LLM/veřejného cloudu nevstupuje do veřejné zóny (NFR-16-1).
4. Tok je prokazatelně **jednosměrný** (privátní → veřejné), opačný směr je vyloučen architekturou.
5. Každý hypotetický publikovaný prvek nese auditní stopu (kdo/co/proč povolil).
6. Veřejná aplikace zůstává čistě nad open daty — `node --check app/app.js` projde, žádný neveřejný zdroj v repozitáři.
7. Rámec je schválen bezpečnostním útvarem DIA před jakoukoli implementací.

## 10. Rizika, závislosti a otevřené otázky

- **Riziko úniku:** jakýkoli netěsný kanál mezi krabičkou a veřejnou částí je bezpečnostní incident. Mitigace: jednosměrný filtr, audit, žádné sdílené úložiště.
- **Riziko modelu:** lokální model v krabičce musí být dost dobrý na konsolidaci přírůstků bez halucinací nad bezpečnostně citlivým obsahem.
- **Riziko falešné publikace:** filtr může omylem klasifikovat citlivý prvek jako veřejný. Mitigace: konzervativní default „interní", lidské schválení před prvním zveřejněním.
- **Závislost:** prostředí krabičky a citlivá data drží **výhradně DIA** — AFCEA bez nich engine nepostaví.
- **Otázka na DIA:** kde poběží krabička (infrastruktura DIA), jaký model je přípustný, kdo schvaluje publikaci?
- **Otázka na DIA:** jaká je klasifikační taxonomie DIA pro prvky DSP (co je z principu utajené)?
- **Otázka:** je tento směr v gesci AFCEA (návrh + filtrace), nebo dodavatele DIA (provoz)? MVP = jen návrh.

## 11. Fázování a hrubý odhad

- **Fáze 0 (tento krok):** návrh architektury oddělení zón + filtračních pravidel + diagram; bez implementace. ~2 dny návrhové práce, schválení DIA.
- **Fáze 1 (samostatný projekt, později):** pilotní krabička nad 1–2 systémy DIA, lokální model, ruční schválení publikace.
- **Fáze 2:** rozšíření na více systémů, poloautomatická filtrace s auditem.
- **Fáze 3:** rutinní doplňování filtrovaných metadat do veřejné mapy. Tento směr zůstává **odložený a samostatný** vůči ostatním změnám — teď stačí architektura a pravidla.
