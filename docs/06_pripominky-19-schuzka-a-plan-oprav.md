# 06 — Připomínky z 19. schůzky PS07 kGovernment a plán oprav aplikace RPP Explorer („mapa státu")

> **Schůzka:** 19. schůzka pracovní skupiny PS07 kGovernment (AFCEA Intelligence) — „Policy papers a témata pro konferenci"
> **Datum:** 12. 6. 2026, 14:00 (čtvrtek)
> **Délka:** 2 h 41 min (audio 160,88 min)
> **Platforma:** Microsoft Teams; přepis Fireflies, ID **01KTD0RH5FVMZBVBRDY5ES8MDC**
> **Klíčový recenzent:** Miroslav (Mirek) Lukeš — bývalý generální ředitel HZS ČR, tvůrce informačního systému krizového řízení (ISKŘ), správce agendy krizového řízení; komentoval živě se sdílenou obrazovkou „na ostro".
> **Další přispěvatelé:** Petr Kučera (PowerPatterns; zná RPP zevnitř, připravoval podklady pro DIA), Martin Vlasta (správní právo, role v agendách), Jaroslav Pejčoch (strategie a prezentace vůči DIA), Tomáš Vejlupek (znalostní vrstva, procesní modelování).
> **Autor mapy / vývojář:** Jakub Bareš (Metamatics Ventures).
> **Předmět recenze:** aplikace **RPP Explorer** (interně „mapa státu") nad veřejnými open daty Registru práv a povinností (DIA) a navazující microsite „krizová připravenost".

---

## Manažerské shrnutí

Devatenáctá schůzka byla z hlediska aplikace **RPP Explorer** zlomová: poprvé ji „na ostro" prošel člověk, který agendu krizového řízení sám provozoval a stavěl pro ni informační systém — Mirek Lukeš. Spolu s Petrem Kučerou (který RPP zná z druhé strany, jako přispěvatel a konzultant DIA) a Martinem Vlastou (správní právo) odhalili sérii věcných i koncepčních chyb, z nichž některé jsou kosmetické, ale **čtyři jsou zásadní a podkopávají důvěryhodnost celého nástroje**. Tento dokument je krok-za-krokem rozbor všech připomínek, pro každou s vysvětlením, **co** je špatně, **proč** to vzniklo (technická/datová příčina, doložená odkazem do reálného kódu), a **jak** to opravit.

Sedm nejdůležitějších zjištění:

1. **Přehozená polarita „čte / zapisuje" (R/W).** Aplikace prezentuje agendu krizového řízení (A338) tak, že vypadá jako systém, který do základního registru obyvatel *zapisuje* nebo z něj „bere důležitost", ačkoli z RPP jednoznačně plyne, že z registru jen **čte** (v RPP Excelu má u všech údajů „R"). Tato záměna se propisuje až na úvodní dashboard a zkresluje, co je vlastně kritické. **Bareš během schůzky nasadil novou verzi s opravou** a živě ověřoval, zda se propsala i jinam — na dashboardu se ale spisová služba pořád jevila jako důležitá, takže oprava není kompletní. **P1.**

2. **Chybné kritérium kritičnosti.** Žebříček „nejkritičtějších systémů" řadí systémy podle **počtu navázaných agend** (vždy 406). To z malé obce nebo z lokální spisové služby (GINIS na MČ Praha 15, město Kelč) dělá „nejkritičtější systém republiky", což je věcně nesmysl. Reálně nejkritičtější jsou **vždy základní registry** a systémy řídící činnost státu na nejvyšší úrovni. Kritičnost se musí počítat z **dopadu** (bezpečnostní úroveň, role registru), ne z počtu agend, které obec jen „vyklikala". **P1.**

3. **Chybí číselníková vrstva nad názvy ISVS.** Tentýž software je v datech pod desítkami názvů („KEO" vs „KEO 4" vs „KEO X Hosting", lišící se i jen mezerou), protože každá obec si píše název, jak chce. Bez normalizace nejde ani spočítat, na kolika místech je jeden systém nasazen. Řešením **není** velký schvalovací číselník (ten „nikdy nefunguje"), ale **číselníková (mapovací) vrstva** nad daty, která software seskupí do rodin bez přepisu zdroje. **P1.**

4. **Platnost / verzování agend a dokumentů.** Nástroj umí zobrazit i neplatnou (historickou) verzi agendy (A5 z r. 2020), ačkoli platná je vždy jen poslední (A26). Nástroj musí **vždy brát jen poslední verzi v řadě** — u agend i u strategických dokumentů. **P1.**

5. **Role v agendách = mezera, kterou RPP nevyplní.** Pro analýzu rizik je zásadní vědět, zda je orgán **vykonavatel**, nebo jen vzdáleně **dozoruje** (dozor nad bankovním trhem vs. samotné banky). RPP eviduje role jen jako *přístup k datům*, ne jako *kompetenční role* — vzniklo pro propojování IS. Tuto vrstvu musíme doplnit z **průřezových činností** (vazba činnost → § → role na úrovni vlády), které v RPP existují, ale aplikace je nezobrazuje (paprskový graf). **P2.**

6. **Kaskádová logika nesmí být mechanická.** „Co spadne, když…" nelze počítat pouhým procházením hran grafu. Systémy si drží **lokální kopie** záznamů a od registrů dostávají notifikace — při výpadku registru úřad jede dál. Naopak policie, soudy a checkpointy jsou na **živém připojení** do ROB/ROS/registru vozidel životně závislé. Kaskáda musí rozlišovat **typ závislosti** (lokální kopie + notifikace vs. živé připojení). ROB je „pilíř" celé státní správy, zvláště v krizovém řízení. **P2.**

7. **Strategie prezentace vůči DIA.** Nástroj nemá vůči DIA působit jako útok („máte bordel v datech"), ale jako **analýza rizik** a jako **nástroj samotné DIA**. Plánuje se ukázat Bohdanu Urbanovi (DIA) v úterý v 7:00 jako *jemu* připravený nástroj.

Souhrnný plán oprav s prioritizací je v **Části IX**, otevřené (ne-softwarové) otázky pro DIA v **Části X**.

---

## Stav implementace (k 13. 6. 2026)

Níže uvedené opravy byly **zapracovány do kódu** (`etl/build_client_data.py` v2 + `app/app.js`) a ověřeny headless renderem všech 14 obrazovek (0 runtime chyb). ETL přepočteno nad kompletní RPP sadou.

| Připomínka | Záv. | Stav | Co konkrétně |
|---|---|---|---|
| A4/B7 polarita R/W | P1 | ✅ hotovo | R/W badge u toků v detailu agendy + v grafu (W=editor/pink, R=cyan); jednotný slovník „zdroj→příjemce"; konzumentská poznámka u 0 výstupů |
| A1/A2/A5 kritičnost | P1 | ✅ hotovo | ETL kompozitní skóre (registr whitelist → bezp. úroveň → typ správce → nosné agendy); `IMPORTANCE` přepsáno; dashboard řadí registry nahoru; počet agend jen informativní |
| C14 číselníková vrstva ISVS | P1 | ✅ hotovo (auto) | mapovací vrstva `rodina` (slovník + fuzzy normalizace), bez přepisu zdroje; metrika rozšíření + žebříček „nejrozšířenější obecní systémy"; profilování člověkem zůstává jako navazující krok |
| B9 verzování | P1 | ✅ hotovo | open data nesou jen poslední verzi (0 duplicit); defenzivní dedup dle kódu + vizuální „⏳ stárnutí" u záznamů >3 let |
| A5 BESP význam/barvy | P2 | ✅ hotovo | neutrální škála dopadu 1→4 (ne dobré/špatné), tooltip s výkladem (vyhláška, 125 tis., úroveň 4 → cloud) |
| B10 váhy/filtry OVM | P2 | ✅ hotovo | v detailu agendy filtry dle typu + řazení dle úrovně + subsumace obcí; ETL `ovm_sample` řazen dle úrovně s typovou značkou |
| E20 paprskový graf rolí | P2 | ✅ hotovo | ETL § (eSbírka) u činností + vykonávající kategorie OVM (role); v detailu agendy radial graf + role dle úrovně + § sloupec |
| D16/D18 vzorek v grafu | P2 | ✅ hotovo | ETL `agendy_sample` řazen dle důležitosti; gestor (ohlašovatel) zvýrazněn jako kořen |
| C13 editory (W) | P2 | ✅ hotovo | ETL odvození „editor registru"; štítek + barva hrany |
| F22/F23 kaskáda | P2 | ✅ hotovo | typ závislosti měkká/tvrdá (živá), časový horizont, označení živě závislých (policie/soudy/IZS), obousměrný disclaimer, ROB jako default epicentrum |
| D17 tokové rozložení | P3 | ✅ hotovo | přepínač orbit ↔ tok L→R (breadthfirst) |
| C11/C15 zdroj + fill-rate | P3 | ✅ hotovo | hlavička zdroje na každé datové obrazovce; fill-rate karta v Analytice |
| B8 kontext nízkých toků | P3 | ✅ hotovo | vysvětlující věta + „k ověření" |
| E19/E21 mezery RPP | P3 | ✅ hotovo (disclaimer) | karta „Hranice RPP" v Analytice (role ≠ kompetence, schvalování, číselník, cloud); zbytek = otázky pro DIA (Část X) |

Tón popisků sjednocen na „analýza rizik / příležitost pro DIA" (G2), ne audit chyb.

---

# Část I — Kontext: kdo je Mirek Lukeš a jak recenze probíhala

## I.1 Proč právě Lukeš

Recenze měla mimořádnou váhu kvůli osobě recenzenta. Mirek Lukeš je bývalý **generální ředitel Hasičského záchranného sboru ČR** a **tvůrce / správce informačního systému krizového řízení (ISKŘ)** — tedy přesně toho systému, který v RPP odpovídá agendě A338 (krizový zákon, zákon č. 240/2000 Sb.). Když tedy aplikace tvrdí něco o krizovém řízení, Lukeš je člověk, který ví „jak to skutečně funguje a jak to fungovalo v minulosti" (slovy Jaroslava Pejčocha, řádek 103 přepisu).

Jaroslav Pejčoch recenzi uvedl s tím, že Lukeš má mluvit zcela otevřeně:

> *„Já začnu tím RPP Explorerem s tím, že Adam mi to poslal tak jako na ostro, že mi k tomu nic neřekl a já jsem se snažil nějak pochopit smysl toho nástroje. Je to jako hodně zajímavé. Některé věci jako na první dobrou jenom nedávají smysl…"* (Lukeš, ř. 271–275)

A hned navázal výzvou, kterou Pejčoch posvětil — že má kritizovat naplno:

> *„…říkám svoje, Jarda mi říkala, že mám mluvit otevřeně, že se tak nepobavíte, tak to tak budu dělat. Když už by to bylo příliš, tak dejte nějaké znamení."* (Lukeš, ř. 278–279)

Martin Vlasta připomenul, v jakém režimu byl prototyp vytvořen — jako rychlá simulace, „mentální cvičení":

> *„Tohle to bylo vytvořené opravdu jako rychle jenom jako simulace toho, co bychom mohli dokázat. Teď je to pro nás mentální cvičení, jak nad interaktivní homošotovou věcí my můžeme domyslet, co reálně, jak to se řadí ve vizualizaci a jak to ukázat."* (Vlasta, ř. 282–284)

Tento rámec je důležitý: **většina připomínek nemíří na chyby v záměru, ale na to, jak strojové (AI/ETL) zpracování dat zkreslilo realitu.** Lukeš to opakovaně formuloval jako „je potřeba si jí zkontrolovat, jestli ten nástroj pochopil dobře ty logiky" (ř. 347).

Z metodického hlediska je nutné zdůraznit jeden rozdíl, který se line celou recenzí a který odlišuje tuto zpětnou vazbu od běžného uživatelského testování. Lukeš a Kučera **neporovnávali aplikaci s vlastní domněnkou**, ale s **primárním zdrojem** — s Excelovým exportem přímo z RPP a s vlastními agregacemi nad open daty. Když tedy Lukeš tvrdí „je to obráceně", neopírá se o pocit, ale o konkrétní řádek v RPP Excelu, kde je u údaje napsáno „R". To dělá z této recenze nejcennější druh zpětné vazby vůbec: **každou připomínku lze zkontrolovat proti datům a kódu** a rozhodnout, zda jde o chybu aplikace, chybu prezentace, nebo o vlastnost zdrojových dat. Právě toto rozlišení je v dalších částech vedeno důsledně — protože pro plán oprav je zásadní vědět, zda opravujeme ETL, UI, datový model, nebo zda jen doplňujeme disclaimer o tom, co RPP principiálně neumí.

Druhé metodické vodítko, které z recenze plyne, je **rozdíl mezi „daty, která existují, ale jsou nepřesná" a „logikou, kterou aplikace odvodila nesprávně".** Petr Kučera ho vystihl hned v úvodu schůzky: „To, co tam není děravé, ale nemusí to být úplně dobře, jsou ty agendy, protože oni, když chtějí do registru, tak tam musí vykliknout aspoň jednu agendu" (ř. 44–45). Jinými slovy: některá pole jsou vyplněná (agendy), ale vyplněná účelově a tedy *zkreslená*; jiná pole jsou prostě prázdná (náklady, bezpečnostní úroveň). Aplikace musí oba druhy nedokonalosti rozlišovat a nepředstírat přesnost tam, kde žádná není. To je leitmotiv celého dokumentu.

## I.2 Jak recenze technicky probíhala

Bareš sdílel obrazovku a předal ovládání Lukešovi, který si aplikaci sám proklikával („heslo máte? … Mirek to otevře", ř. 256–258). Lukeš procházel obrazovky v pořadí: **úvodní dashboard → agendy (detail A338 krizové řízení) → informační systémy (ISVS) → orgány veřejné moci (OVM) → oprávnění/toky → graf vazeb (ego-graf ministerstva vnitra) → dopadová analýza**. Souběžně otevíral **originální Excel export z RPP** a **vlastní „vejcuc" (Petr Kučera)**, aby ukázal, co data ve skutečnosti říkají. To je metodicky cenné: většina připomínek je doložena přímo proti zdroji RPP.

Druhá polovina schůzky se věnovala navazující microsite **„krizová připravenost"** (samostatná aplikace, ne RPP Explorer). Připomínky k ní jsou pro úplnost zachyceny v **Příloze A**, protože se týkají jiného produktu a jiného datového modelu (statická JSON-driven microsite, nikoli RPP).

---

# Část II — Blok A: Dashboard a žebříček „nejkritičtějších systémů"

Tato část pokrývá připomínky A1–A6. Je to nejdůležitější blok, protože se týká **první obrazovky**, kterou uvidí Bohdan Urban (DIA) — a obsahuje dvě ze čtyř P1 chyb (kritérium kritičnosti a propsání přehozené polarity).

## II.1 (A1) Žebříček „nejkritičtějších systémů" je věcně špatně

### Co je špatně
Na úvodním dashboardu i v Analytice je karta **„Nejkritičtější systémy"**, jejíž první příčky obsazují lokální spisové služby malých obcí a měst — GINIS SQL na Městské části Praha 15, „Město Kelč GORDIC G3v3", „Obec Brusné", „Týn nad Bečvou" apod. Reálně nejkritičtější systémy státu jsou **vždy základní registry** a systémy řídící činnost státu na nejvyšší úrovni.

Lukeš to řekl naprosto jednoznačně:

> *„…v celém systému to vypadá, že nejkritičtější systémy, tak jak jsou tady napsané, je spisová pošta a nějaký lokální napojení na spisové pošty, což jako v reálu asi chápeme, že to tak není… není to asi správný kriterium, že nejkritičtější systémy jsou vždycky základní registry a potom ty systémy, které řídí činnost státu, jako na nejvyšší úrovni, ale nemyslím si, že to je GINIS městu Kelč…"* (Lukeš, ř. 277–278)

### Proč to vzniklo (datová/technická příčina)
Toto je přímo doložitelné v datech a kódu. Žebříček `top_critical` v `app/data/meta.json` vzniká v ETL jednoduchým řezem prvních dvanácti záznamů ze seznamu ISVS seřazeného sestupně podle počtu agend:

- `etl/build_client_data.py:129` — `out_isvs.sort(key=lambda x: -x["c"]["agend"])` (seřaď ISVS sestupně dle počtu agend),
- `etl/build_client_data.py:214–215` — `"top_critical": [... for i in out_isvs[:12]]` (vezmi prvních 12).

V `app/data/meta.json` je výsledek doslova vidět: prvních dvanáct systémů má **všech 406 agend** a jsou to GINIS/GORDIC instalace na obcích a krajích (`isvs/213` GINIS SQL — MČ Praha 15 — „1. Nízká"; `isvs/2038` Město Kelč; `isvs/890` GINIS Liberecký kraj atd.). Jediné „skutečně" kritické systémy v seznamu (Czech POINT — DIA — „4. Kritická", FAIS — DIA) tam jsou jen **náhodou**, protože i ony mají 406 agend; nikoli proto, že by je metrika upřednostnila.

Na dashboardu se tabulka renderuje v `app/app.js:138–148`. Bareš si byl problému zjevně vědom už při tvorbě — v kódu je na řádku `app/app.js:140` poznámka:

> `<div class="desc">Kandidáti pro dopadovou analýzu — pozn.: zahrnuje i obecné systémy (GINIS apod.)</div>`

a podtitul `app/app.js:139` přiznává metriku: *„dle počtu navázaných agend"*. To je ale jen disclaimer, ne oprava — žebříček pořád řadí špatně.

### Jak to zlepšit
1. **Změnit kritérium řazení v ETL** (`build_client_data.py:214`): místo `out_isvs[:12]` (řez podle počtu agend) zavést **kompozitní skóre kritičnosti**, kde dominantní vahou bude **bezpečnostní úroveň** (`bezuroven`, viz A5) a **typ správce** (registr/ústřední systém vs. obec). Konkrétně: seřadit nejprve podle `bezuroven` (4. Kritická → 1. Nízká), v rámci stejné úrovně dle počtu agend.
2. **Whitelist základních registrů a referenčních systémů** (ROB, ROS, RÚIAN, ROB-editory, Czech POINT, NIA, datové schránky, eGSB) — tyto vždy nahoře. Lze odvodit z `i.agendy` obsahujících A101/A102/A115/A116 (základní registry — viz Část III) nebo ze `spravce == DIA / Správa základních registrů`.
3. **Vyřadit z žebříčku „obecné" lokální systémy** (spisové služby obcí) nebo je vizuálně oddělit do samostatné tabulky „nejrozšířenější obecní systémy" — ty mají jinou výpovědní hodnotu (dopad rozšíření), ne kritičnost.
4. Provázat s **UC4** („Který systém je nejkritičtější") z `docs/02_usecases.md:30–32`, který explicitně předepisuje křížení s `bezpečnostní-úroveň` na „kritické a přitom slabě zabezpečené systémy" — to současný kód nedělá.

### Návrh konkrétního skóre kritičnosti (pro ETL)
Aby byl návrh proveditelný, lze kritičnost spočítat jako lexikografické řazení s jasně definovanými vrstvami, které odpovídají Lukešově i Kučerově logice:
1. **Vrstva 0 — základní registry a referenční systémy** (whitelist): ROB, ROS, RÚIAN, registr práv a povinností, NIA, eGSB, datové schránky, Czech POINT. Vždy nahoře, bez ohledu na ostatní metriky. Odvození: `spravce` ∈ {DIA, Správa základních registrů} nebo `i.agendy` obsahuje A101/A102/A115/A116.
2. **Vrstva 1 — bezpečnostní úroveň** (`bezuroven`): 4. Kritická → 3. Vysoká → 2. Střední → 1. Nízká → Neuvedeno. Toto je Kučerovo „srovnej systémy podle toho, jak vysoký je dopad" (ř. 443).
3. **Vrstva 2 — typ správce:** ústřední (ministerstvo, organizační složka státu, DIA) > kraj > ORP > obec. Využije už existující `_spravce_typ` (`app/app.js:941`).
4. **Vrstva 3 — počet *ústředních* agend** (ne všech): kolik registrových/ústředních agend systém obsluhuje. Teprve tady vstupuje „počet", ale filtrovaný na nosné agendy.
Tím se z žebříčku „nejvíc vyklikaných obecních spisovek" stane žebříček „systémů s reálným dopadem na stát" — což je přesně to, co Lukeš od první obrazovky čekal.

## II.2 (A2) Kritérium „počet navázaných agend" je principiálně chybné

### Co je špatně
Metrika „počet navázaných agend = 406" je pro kritičnost **bezcenná**, protože vysoké číslo neznamená důležitost systému, ale jen to, že obec/úřad si do RPP vyklikal mnoho (často všechny) agendy.

Lukeš:

> *„Tady, když vidím, že je navázáno 406 agent, tak to tam asi bude navázaný, ale je to dané tím, že ty starostové obci nebo obce řeší spoustu věcí v republice. Ale neznamená to, že jejich spisová pošta je důležitá… ona neřídí ty agendy, ona využívá jejich data většinou."* (Lukeš, ř. 285–293)

Petr Kučera to doplnil mechanismem vzniku:

> *„…oni možná taky tam vyškrtnou, místo toho, aby vypisovali ty agendy, který dělají, protože určitě nedělají všechny… ale prostě se jim nechce ty agendy vyklikávat, tak vykliknou všechno, že jo, což znamená, že to teda vyplňujou blbě."* (Kučera, ř. 433)

### Proč to vzniklo
Metrika je v aplikaci na několika místech a všude vychází z téhož čísla:

- ETL ji počítá v `build_client_data.py:127` (`"c": {"agend": len(i.get("agendy") or [])}` pro ISVS) a v `:148` (`"agend"` pro OVM).
- Stejná logika je v odvozené **„důležitosti"** entit: `app/app.js:865–872` definuje `IMPORTANCE`, kde pro `isvs` i `ovm` je skóre přímo `r.c.agend` (počet agend) a pro `agendy` součet `isvs+sluzby+ovm`. Tato skóre se pak kvantily převedou na pásma Kritická/Vysoká/Střední/Nízká (`app/app.js:875–889`). **Jde tedy o tutéž vadnou metriku jen v jiném balení** — i filtr „Důležitost" (`dulFilter`, `app/app.js:894`) sdílí stejnou slabinu.

Důležité upřesnění oproti tomu, co recenzent předpokládal: aplikace **neříká**, že obec „řídí" agendy — slovo „řídí" nikde nepoužívá; zobrazuje neutrální „Agend: 406" a „vykonávané/podporované agendy". Recenzentova výtka je ale platná na úrovni *interpretace*: uživatel si vysoký počet agend přečte jako důležitost, a aplikace ho v tom utvrzuje tím, že podle něj řadí a barví „důležitost".

### Jak to zlepšit
1. **Rozdělit dvě různé veličiny:** (a) *rozsah působnosti* (počet agend — ponechat jako informativní sloupec) a (b) *kritičnost / dopad* (nová, samostatná metrika, viz A5).
2. Přepsat `IMPORTANCE` (`app/app.js:865`) tak, aby pro `isvs` zohledňovalo `bezuroven` a typ správce, nikoli holý počet agend. Pro `ovm` zohlednit typ instituce (ministerstvo/kraj vs. obec) — typologie už existuje (`ovmType`, `app/app.js:835`).
3. Do UI přidat tooltip vysvětlující, že **počet agend ≠ kritičnost** a že vysoký počet u obcí je důsledek hromadného vyklikávání.

## II.3 (A3) Interpretace dopadu výpadku je převrácená

### Co je špatně
Aplikace svým žebříčkem implikuje, že výpadek lokální spisovky je vážná událost. Realita je opačná: výpadek GINIS na MČ Praha 15 má malý, ohraničený dopad; výpadek **základního registru** ochromí stát — a v krizovém řízení připraví záchranáře o data o občanech.

Lukeš:

> *„A když ten GINIS tady v městský části Praha 15 nebude fungovat, tak co se stane? Nebudou odcházet rozhodnutí, nebudou odcházet jako pošta, ale to je tak všechno."* (Lukeš, ř. 295–296)

a o opačném směru:

> *„…krizový řízení není důležitý, protože když vypadne, tak nebudou data tady v těch, ale naopak, když vypadne základní registr, tak nebude mít krizový řízení data o občanech."* (Lukeš, ř. 307)

### Proč to vzniklo
Dvě příčiny se sčítají:
1. **Špatná metrika kritičnosti** (A1/A2) řadí spisovky nahoru.
2. **Přehozená polarita toků** (A4/A7) způsobuje, že se i směr „kdo na kom závisí" čte obráceně — tedy i dopadová analýza pak ukazuje dominové efekty z nesprávného epicentra.

Dopadová obrazovka (`app/app.js:583–677`) navíc dnes počítá dosah výpadku **mechanicky** přes oprávnění (`dependents` v `app/app.js:588`), což je samo o sobě problém (viz Část VII / blok F). Pro spisovku obce vrátí malou kaskádu, pro registr velkou — ale jen tehdy, pokud je registr správně identifikován jako *zdroj* (z-agendy), což A4 zpochybňuje.

### Jak to zlepšit
1. Po opravě metriky (A1) a polarity (A4) zajistit, aby **default epicentrum** dopadové analýzy byl skutečně základní registr. Kód už se o to *snaží* — `app/app.js:592–594` hledá agendu s nejvyšším `opr_out` (nejvíc „dává") a k ní systém s málo agendami (kandidát na základní registr). To je správná intuice, ale závisí na korektních `opr_out`/`opr_in`, které jsou u A338 nulové/přehozené (viz níže).
2. V dopadové analýze odlišit **typ závislosti** (lokální kopie vs. živé připojení) — viz blok F, připomínka 23. To je teprve to, co dá dopadu reálnou výpovědní hodnotu.

## II.4 (A4 / B7) Přehozená polarita „čte / zapisuje" — klíčová chyba

Toto je nejdůležitější věcná chyba schůzky, proto jí věnujeme nejvíc prostoru.

### Co je špatně
Systém u agendy A338 (krizové řízení) navozuje dojem, že **zapisuje** do základního registru / „dává mu důležitost", zatímco ve skutečnosti z něj jen **čte** (R). Lukeš:

> *„…závěr jsem jako, jestli jsem to dobře pochopil, co tady je to k údajů, tak je to obráceně. Krizové řízení a ten systém, nebo ta agenda 338, není agendou, která zapisuje do základního registru, ale čte ze základního registru."* (Lukeš, ř. 302–304)

A doložil to přímo z RPP Excelu:

> *„…když si stáhnete ten Excelovský soubor z RPP, tak tam vidíte, že skutečně agendový systém 338 a všechny ostatní má tady u těch údajů napsáno R jako read, ale nezapisuje. A třeba agenda cizinecké ochrany a státní hranice, tak ona zapisuje do registru obyvatel skutečně."* (Lukeš, ř. 310–311)

### Proč to vzniklo — a co skutečně říká kód (cenné zjištění)
Tady je nutné být přesný, protože **data jsou ve skutečnosti správně; problém je v prezentaci a v odvozených metrikách.** Ověřeno přímo nad `app/data/opravneni.json`:

- Agenda **A338** vystupuje jako **příjemce** (`do = agenda/A338`) v **7 oprávněních**, všechna s úrovní `['R']` (čtení). Mezi nimi: `z = agenda/A101` (Základní registr — registr obyvatel, ROB), 19 údajů, R; `z = agenda/A102` (registr osob, ROS), R; `z = agenda/A115`, `A116` (další registry), R.
- Jako **zdroj** (`z = agenda/A338`, tj. „dává") vystupuje A338 v **0 oprávněních**.

To přesně odpovídá realitě, kterou Lukeš popisuje: krizové řízení **jen čte** z registrů, nic do nich nezapisuje. Datový model RPP i ETL jsou tedy správné. Potvrzuje to i komentář v kódu detailu agendy:

> `app/app.js:229` — `// tok: z-agendy (zdroj, dává) → do-agendy (příjemce, bere)`
> `app/app.js:230` — `const bere = opr.filter(o=>o['do']===a.id), dava = opr.filter(o=>o['z']===a.id);`

Pro A338 tedy `bere.length == 7` a `dava.length == 0`. **Sémanticky správně.**

Kde tedy vzniká „přehození"? Ve dvou místech:

1. **Vizuální/slovní prezentace.** Karta „Toky údajů" (`app/app.js:273–279`) zobrazí „Bere z jiných agend" a „Dává jiným agendám". Pokud uživatel (nebo dřívější verze AI zpracování, kterou Lukeš viděl) interpretuje vykonávající systém A338 jako „centrum, ke kterému něco směřuje", vznikne dojem zápisu. Lukeš výslovně říká „je to obráceně" — viděl tedy verzi, kde směr šipky/štítku neodpovídal R/W. **Bareš to v průběhu schůzky opravoval** (viz Část VIII).

2. **Odvozená „kritičnost" přes `opr_out`/`opr_in`.** V `agendy.json` má A338 `opr_in: 7, opr_out: 0` (ověřeno). V grafu i v defaultu dopadové analýzy se „bohatost/zdrojovost" agendy počítá mj. z `opr_out` (`app/app.js:516` `score = a.c.isvs+a.c.sluzby+a.c.opr_in+a.c.opr_out`; `app/app.js:592` hledá max `opr_out`). Protože A338 *nic nedává*, vychází jako „pasivní příjemce" — což je správně, ale na **dashboardu** se to neprojeví, protože dashboard kritičnost počítá úplně jinak (počtem agend ISVS), takže spisové služby zůstávají nahoře bez ohledu na opravu polarity. To je přesně to, co Bareš živě zjistil:

> *„Spisová služba je pořád velmi důležitá, to asi tady vás nezměnilo. Kde by to ještě mělo být propsané, někde tady ten switch?"* — *„Všude."* (Bareš → Lukeš, ř. 561–563)

### Jak to zlepšit
1. **Sjednotit slovník a směr šipek** všude na „**z-agendy = zdroj/poskytuje (W u editora) → do-agendy = příjemce/čte (R)**" a u každého toku **zobrazit konkrétní úroveň přístupu** (`rw` už existuje v `opravneni.json` a renderuje se v tabulce oprávnění, `app/app.js:502`, ale v detailu agendy v kartě „Toky údajů" chybí). Konkrétně do `app/app.js:276–278` doplnit u každého `bere`/`dava` badge R/W.
2. **Odlišit editory.** Petr Kučera upozornil (ř. 421–426), že jen některé systémy jsou *editory* registru (cizinecký systém, matriky, ISO = editory ROB), ostatní čtou. Tato vlastnost je v `rw` (`W` = zápis) — z 1 879 oprávnění je jen **195 čistě „W"** (ověřeno distribucí), zbytek R/RH/RHN apod. Aplikace by měla **vizuálně zvýraznit editory** (W) odlišnou barvou/štítkem „editor". Badge logika v `app/app.js:502` už W odlišuje (`badge pink`), je tedy třeba ji protáhnout do detailu agendy a do grafu.
3. **Propsat opravu na dashboard.** Po opravě metriky kritičnosti (A1) ověřit, že se základní registry dostanou nahoru a spisové služby dolů — to je test, že „switch" se propsal „všude" (Lukešovo „Všude", ř. 563).

### Proč je polarita nejnebezpečnější ze všech chyb
Stojí za to explicitně vysvětlit, proč tato připomínka dostala nejvyšší prioritu, ačkoli „pod kapotou" jsou data správně. Přehozená polarita totiž není izolovaná vada jedné obrazovky — je to **chyba interpretace, která mění vyznění celého nástroje na opačné.** Když nástroj naznačí, že krizové řízení „zapisuje do registru" nebo „je zdrojem dat", obrátí naruby celou kauzalitu dopadové analýzy: epicentrum a oběť si vymění místa. Pro nástroj, jehož deklarovaným účelem je „co se zhroutí, když vypadne…" (UC13), je obrácená kauzalita fatální — ukázal by, že pád krizového řízení ohrozí registry, místo aby ukázal pravý opak (pád registru ohrozí krizové řízení). Lukeš to formuloval přesně v této kauzální rovině (ř. 307). Proto je nutné polaritu opravit *před* demem DIA: jde o jediný typ chyby, který z nástroje udělá nejen nepřesný, ale **systematicky zavádějící** artefakt.

### Testovací scénář pro ověření opravy (akceptační kritérium)
Aby se „propsání všude" dalo objektivně ověřit, navrhuje se konkrétní akceptační test nad A338:
1. Detail agendy A338 → karta „Toky údajů": musí ukazovat **7× „bere/čte z"** (z toho z A101 ROB, A102 ROS) a **0× „dává/zapisuje"**; u každého toku badge **R**.
2. Detail ROB (A101 / příslušné ISVS): A338 se musí objevit jako **příjemce/čtenář**, ROB jako **zdroj**.
3. Graf vazeb od A338: hrany k registrům musí mít směr **registr → A338** (čtení), ne opačně.
4. Dashboard: po opravě kritičnosti (A1) musí být na předních příčkách žebříčku **registry**, ne spisové služby obcí.
Splnění všech čtyř bodů je důkazem, že „switch" se propsal úplně.

## II.5 (A5) Sloupec BESP / bezpečnostní úroveň — nejednoznačnost a špatné použití

### Co je špatně
Sloupec „BESP" (bezpečnostní úroveň) je nejasný — není zřejmé, zda „nízká úroveň" znamená „**nezabezpečené**", nebo „**nízký dopad do bezpečnosti**". Lukeš:

> *„…tady BESP, nevím jestli to je bezpečnostní úroveň systému a není z toho jasný… jestli nízká úroveň znamená, že to není zabezpečené, anebo že to má nízký dopad do bezpečnosti."* (Lukeš, ř. 297–298)

### Proč to vzniklo + věcné vysvětlení (Petr Kučera)
Petr Kučera nejednoznačnost vyřešil výkladem, který je nutné v aplikaci zachytit:

> *„…to je bezpečnostní úroveň toho informačního systému. A teď, jak tam máš ten GINIS SQL, tak to je prostě takovej PIDI systém… je to pro ty malé obce, takže je to tady prostě jako nízká bezpečnostní úroveň, protože ta bezpečnostní úroveň je daná dopadama. Když máš ten informační systém v obci z pětisty obyvateli, tak tam prostě žádný informační systém větší než malý dopad nemá."* (Kučera, ř. 427–430)

a navrhl správné kritérium řazení:

> *„…když si vemeš, že bys jisto srovnal ty systémy podle toho, jak vysoký je ten dopad, podle toho sloupečku, jak máš tady nadepsaný BESP, no tak tam ti vylezou ty systémy, které mají vysoký dopad. Ty registry ti tam vypadnou v podstatě v té bezpečnostní úrovni čtyři. A od toho se ještě odvíjí legislativa, protože když máš bezpečnostní úroveň čtyři, tak to prostě nemůžeš dát do Microsoftového cloudu, ale musíš to dát do Státní tiskárny cenin."* (Kučera, ř. 443–448)

Klíčové fakty pro UI/nápovědu:
- Bezpečnostní úroveň si stanovuje **správce systému dle vyhlášky**, podle **dopadů**.
- Práh dopadu na lidi je relativně nízký — **125 tis. obyvatel** (Kučera, ř. 478); větší město/okres tedy automaticky „vyskočí".
- **Registry vyjdou na úroveň 4 (Kritická).**
- Úroveň 4 → **nesmí do Microsoft cloudu**, musí do **Státní tiskárny cenin** → vazba na legislativu (data musí zůstat „tady").

Datově to aplikace už nese: ETL plní `bezuroven` z číselníku (`build_client_data.py:121`), `meta.json` má distribuci `isvs_bezuroven` (8 309 „Neuvedeno", 67 „4. Kritická", 357 „3. Vysoká"…). Problém je dvojí:
- **Zobrazení je nejednoznačné** (jen zkratka „Bezp." / „BESP" bez vysvětlení) — `app/app.js:145` (dashboard), `app/app.js:316` (seznam ISVS).
- **Barevné kódování badge je matoucí.** Funkce `badgeSec` (`app/app.js:53–61`) barví „vysokou/kritickou" zeleně (`ok`) a „nízkou" červeně (`bad`). To svádí ke čtení „zelená = bezpečné, červená = nezabezpečené" — přesně ta záměna, na kterou Lukeš upozornil. Přitom „kritická úroveň 4" **není** „dobře", je to systém s **nejvyšším dopadem** (a nejpřísnějšími požadavky).

### Jak to zlepšit
1. **Přejmenovat a vysvětlit sloupec:** z „BESP"/„Bezp." na „**Bezpečnostní úroveň (dle vyhlášky — dopad)**", s tooltipem obsahujícím výklad Kučery (stanovuje správce, dle dopadů, práh 125 tis., úroveň 4 → omezení cloudu).
2. **Opravit barevnou sémantiku `badgeSec`** (`app/app.js:53`): odlišit *škálu dopadu* (1–4) neutrální gradientní škálou (např. světle → tmavě), **ne** zeleno-červenou „dobré/špatné". Úroveň 4 by měla být vizuálně „nejsilnější", ne „nejhorší".
3. **Řadit/filtrovat kritičnost podle dopadu (BESP), ne podle počtu agend** — to je přímý Kučerův návrh a zároveň řešení A1/A2.
4. Tím se naplní **UC4** (`docs/02_usecases.md:30–32`) v jeho původním znění („kritické a přitom slabě zabezpečené systémy").

## II.6 (A6) GINIS SQL jako „PIDI systém" — spor „cochcárna" vs. „vyhláška"

### Co je špatně / o co šlo
Lukeš zpochybnil, zda bezpečnostní úrovně dávají smysl, když si je stanovuje sám správce:

> *„…tu bezpečnostní úroveň si stanovuje ten jednotlivý správce toho systému. Protože se mi ukáže představit, že nějaký informační systém Vera v Radnicích… což je radnice v Kostelci nad Orlicí, což jako není úplně největší město, má vysokou úroveň. Stejně jako GINIS v Libereckém kraji. To si myslím, že je taková jako cochcárna trošku tam."* (Lukeš, ř. 471–474)

Petr Kučera oponoval, že nejde o libovůli, ale o pravidla daná vyhláškou:

> *„To není cochcárna, na to je vyhláška. Na to jsou kriteria a je to teda, ano, stanoví si to sám ten úřad, ale podle pravidel ty vyhlášky. A na té vyhlášce je poměrně nízký limit v tom dopadu na lidi, tam je 125 tisíc."* (Kučera, ř. 475–478)

### Proč to vzniklo
Jde o reálnou nedokonalost zdrojových dat: úroveň **vyplňuje správce**, takže se v datech objeví zdánlivě nekonzistentní hodnoty (lokální systém „3. Vysoká", jiný „Neuvedeno"). V `meta.json` je vidět, že **8 309 z 12 110 ISVS nemá úroveň uvedenou vůbec** (`isvs_bezuroven` „Neuvedeno"). Self-assessment + obří podíl „Neuvedeno" → metrika je *indikativní*, ne tvrdá. Aplikace to dnes nepřiznává; naopak na dashboardu uvádí „pctLevel% uvedeno" jako mezeru (`app/app.js:129`), což je dobrý začátek.

### Jak to zlepšit (popsat oba pohledy)
1. **Zachytit oba pohledy v nápovědě:** úroveň je *normativně* daná vyhláškou (Kučera), ale *prakticky* ji vyplňuje správce a kvalita kolísá (Lukeš). Tedy: „Úroveň je stanovena dle vyhlášky na základě dopadů; vyplňuje ji správce systému; u části systémů chybí nebo může být nepřesná."
2. **Filtr na „Neuvedeno"** povýšit na first-class signál kvality dat (kolik % systémů úroveň nevyplnilo) — již existuje jako KPI (`app/app.js:112–113, 129`), rozšířit i do seznamu ISVS jako varovný štítek.
3. Nepoužívat úroveň jako *jediné* kritérium kritičnosti, ale **kombinovat** s „je to základní registr/ústřední systém" (whitelist, A1), aby self-assessment chyby nezkreslily žebříček.

---

# Část III — Blok B: Detail agendy (na příkladu A338 krizové řízení)

Pokrývá připomínky B7–B10. B7 (přehozená polarita) je vyřešena v II.4 (A4); zde rozvádíme B8–B10.

## III.1 (B8) Jen 6 agend čtoucích z krizového řízení je „strašně málo"

### Co je špatně
Martin Vlasta zpochybnil, že by z krizového řízení četlo tak málo agend:

> *„Já si myslím, že tady jenom šest agent, který odsud čtou, je strašně málo."* (Vlasta, ř. 322–323)

### Proč to vzniklo (a nuance)
Tady je nutné rozlišit dvě čísla:
- **Co Vlasta nazval „čtou odsud"** = agendy, které berou data *z* A338 = `dava` v detailu (`app/app.js:230`, `o['z']===a.id`). V datech je toto číslo **0** (A338 nikomu nic nedává — ověřeno). Pokud Vlasta viděl „6", šlo nejspíš o jiný blok (vykonávající orgány, nebo `bere`).
- **Co A338 čte** = `bere` = **7** (z ROB, ROS a dalších registrů).

Tedy: pohled „kolik agend čte z krizového řízení" vychází z `opr_out` A338 = 0. Vlastova intuice „mělo by jich být víc" naráží na realitu: krizové řízení je primárně **konzument** dat, ne poskytovatel. Lukeš to ostatně potvrdil (ř. 309): „agenty můžou číst z krizovýho řízení, bude třeba agenda ministerstva obrany, která bude číst odsud" — tj. *měly by* existovat, ale v RPP datech nejsou zaevidované jako oprávnění *z* A338.

Petr Kučera nabídl vysvětlení pro analogický CIS/ISKŘ:

> *„Do CISu toho moc číst nemá zvenku, protože CIS se propisuje do ROBu a má se číst z ROBu."* (Kučera, ř. 327–328)

To je cenné zjištění: **nízký počet není nutně chyba aplikace, ale obraz reálné (ne)evidence v RPP** — a možná i mezera v datech (málokdo si registroval oprávnění číst z krizového řízení).

### Jak to zlepšit
1. **Nepřekvapovat uživatele nulou/malým číslem bez kontextu.** Do karty „Toky údajů" doplnit větu: „Krizové řízení je primárně konzument dat (čte z registrů); počet agend čtoucích *z* něj odráží evidenci v RPP a může být neúplný."
2. **Označit jako „k ověření"** — zda chybí oprávnění reálně, nebo jen v RPP. To je kandidát na otázku pro DIA (Část X) i na srovnání s daty Tomáše Šedivce / Nečaského (kde se čísla liší „o jednu", ř. 653–654).
3. Provázat s **UC2** (toky údajů, only-once; `docs/02_usecases.md:22–24`).

## III.2 (B9) Platnost / verzování — nástroj musí brát vždy jen poslední verzi

### Co je špatně
Aplikace umožní zobrazit i **neplatnou** (historickou) verzi agendy. Lukeš:

> *„…je důležitý tomu nástroji říct… že má vždycky brát jenom to poslední v té řadě. Protože tady je možný stáhnout i agendu A5 církve a náboženské společnosti z roku 2020, ale ta není platná. Platná je vždycky jenom ta poslední, 26."* (Lukeš, ř. 331–333)

### Proč to vzniklo
Dva zdroje dat:
- Bareš čerpá z **JSONů open dat**, které „by měly být aktuální" (ř. 335–338). V `agendy.json` má každá agenda `platnost_od` (`build_client_data.py:100`), ale **ETL nefiltruje na poslední platnou verzi** — pokud open-data sada obsahuje více verzí agendy (A5, …, A26), všechny projdou do výstupu, protože load (`build_client_data.py:11`) bere položky 1:1.
- Lukeš srovnával s **otevřeným Excelem z RPP**, který historické verze ukazuje. Odtud nesoulad: Bareš tvrdí „máme to z aktuálních JSONů" (ř. 335), Lukeš ukazuje, že lze otevřít i starou.

To je doložitelné: v `meta.json` je `counts.agendy = 406`. Pokud by mezi nimi byly i staré verze (A5 i A26 téže agendy), číslo 406 už zahrnuje duplicity verzí a kterýkoli krok, který agendy počítá nebo řadí, je tím zkreslen.

### Jak to zlepšit
1. **V ETL přidat deduplikaci na poslední verzi.** Klíčovat agendy na jejich „rodinu" (kód bez verzního pořadí) a brát záznam s nejvyšším `platnost_od` / nejvyšším pořadovým číslem (A26 > A5). Doplnit do `build_client_data.py` mezi `agendy = load("agendy")` (`:42`) a stavbu `out_agendy` (`:88`).
2. **Univerzální pravidlo „vždy poslední platná"** aplikovat i na strategické dokumenty v microsite (Lukeš ho zopakoval u bezpečnostní strategie 2011 vs 2023, ř. 1042–1047 — viz Příloha A): „ať vás prostě nenachytají na tom, že tam máte něco starého."
3. **Vizuálně označit zastaralost.** Bareš sám navrhl gradientní stárnutí: dokument/agenda starší než ~3 roky → červené upozornění (ř. 1052). To je dobrý vzor i pro agendy s `platnost_od` v daleké minulosti.

## III.3 (B10) Vykonávající orgány (OVM) u agendy — váhy, seskupení, filtry

### Co je špatně
Seznam vykonávajících orgánů u agendy je plochý a dlouhý; chybí **váhy** (ústřední orgány nahoře, pak krajské, pak ministerstva) a možnost **seskupení / filtrování**. Lukeš:

> *„Tohleto jsou vykonávající orgány, ty jsou prostě ze zákona… nevím, jestli by se tady neměly nějak udělat váhy, protože je rozdíl mezi… kdyby se to mělo používat jako v reální praxi, tak by mě asi zajímali nejdřív ty ústřední orgány a potom se tom krajský a ministerstva."* (Lukeš, ř. 368)

Vlasta i Bareš na to navázali konkrétními návrhy:

> Vlasta: *„…všichni ústřední orgány k sobě… A třeba se subsumama."* (ř. 372–376)
> Bareš: *„…já bych tam mohl udělat nějaký filtríky, filtríky nahoře, tlačítka, který řeknou obce, úřady, katastrální a tak."* (ř. 373–374)

### Proč to vzniklo
Detail agendy renderuje vykonávající orgány jako prostý výpis vzorku bez řazení a bez typu:

- `app/app.js:280–282` — `Vykonávající orgány` … `a.ovm_sample.map(...)`. `ovm_sample` je v ETL useknutý na 60 prvků (`build_client_data.py:104` `sorted(ag_ovm.get(aid, set()))[:60]`) a **seřazený jen abecedně podle ID**, ne podle důležitosti. U A338 je `c.ovm = 6458` (ověřeno!), takže 60 zobrazených z 6 458 je náhodný řez.

### Jak to zlepšit + co už Bareš nasadil
Bareš v průběhu schůzky potvrdil, že **filtrování dle typu a řazení dle důležitosti už nasadil** — a kód to dokládá:

> *„…už tam je to filtrování podle vlastně typu — podniky, pojišťovny, školy, soudy, úřady, městské části, obce. Tam si můžete všechno filtrovat. A je tam dokonce, že všechno se řadí podle důležitosti."* (Bareš, ř. 607–609)

V kódu je to typologie OVM `OVM_TYPES` a funkce `ovmType` (`app/app.js:834–854`), které mapují orgán na „Ministerstva / Kraje / Města a městyse / Obce / Městské části / Úřady / Soudy / … / Podniky a firmy / Zdravotní pojišťovny / Školy a univerzity". Na **dashboardu** je rozpad podle typu instituce i žebříček nejzapojenějších úřadů s filtrem (`app/app.js:165–196`), v **seznamu OVM** filtr „Typ instituce" + řazení (`app/app.js:359–376`).

Co ale **ještě nebylo nasazeno** (cenné zjištění): tytéž váhy/seskupení **chybí přímo v kartě „Vykonávající orgány" v detailu agendy** (`app/app.js:280–282`) — tam je pořád plochý abecední vzorek. Návrh:
1. Do `ovm_sample` v ETL přidat **typ** a **skóre důležitosti**, a řadit: ústřední (ministerstva, ústřední úřady) → kraje → ORP/obce → ostatní. (Lukešovo „ústřední, krajské, ostatní orgány státní moci", ř. 483.)
2. V detailu agendy přidat **filtrovací tlačítka** podle typu (jako na dashboardu) a **subsumaci** (Vlastovo „se subsumama") — sbalit obce/města do jedné položky „Obce (N)".
3. Protože `c.ovm` je u velkých agend obří (A338 = 6 458), **default zobrazit jen ústřední úroveň** a zbytek skrýt za rozbalení.

---

# Část IV — Blok C: Informační systémy (ISVS)

Pokrývá připomínky C11–C15. Obsahuje třetí P1 (číselníková vrstva nad názvy ISVS) a P2 mezeru v nákladech.

## IV.1 (C11) Není jasné, odkud se data o ISVS berou; chybí váhy

### Co je špatně
Lukeš byl na obrazovce ISVS „úplně ztracený" — nechápal původ dat ani co je důležité:

> *„…když se dostanu na informační systémy, tak se přiznám, že jsem byl úplně ztracenej, jinak nevím, odkud to vlastně je braný… buď by tam měly být nějaké váhy toho, které jsou důležité… ale provázanost je ta důležitá jenom s těma ústředníma systémama."* (Lukeš, ř. 380)

### Proč to vzniklo
1. **Chybí uvedení zdroje na obrazovce.** Seznam ISVS (`app/app.js:301`) má podtitul „N systémů · řazeno dle kritičnosti", ale nikde u dat není přímo vidět „zdroj: RPP open data, sada isvs, staženo dd. mm.". (Globální disclaimer je jen v „O projektu", `app/app.js:794`.)
2. **Váhy = stejná vadná metrika.** „Důležitost" ISVS = počet agend (`IMPORTANCE.isvs`, `app/app.js:867`) — viz A2. Lukeš správně chce, aby důležitost odrážela **provázanost s ústředními systémy**, ne počet vyklikaných agend.

### Jak to zlepšit
1. Na každou datovou obrazovku přidat **kontextovou hlavičku zdroje** (sada + datum stažení + odkaz na rpp-opendata.egon.gov.cz).
2. Přepočítat „důležitost" ISVS na **provázanost s ústředními systémy** (kolik ústředních/registrových agend systém obsluhuje), ne na hrubý počet agend.

## IV.2 (C12) Neznámé systémy (Proxio, Javelin, Clover) a otázka spisové pošty

### Co je špatně
Lukeš jako bývalý správce ISKŘ nezná systémy, které se u krizového řízení objevují, a tvrdí, že **nejsou napojené na ISKŘ ani nevykonávají agendu na ústřední úrovni** — napsaly si je obce:

> *„…Proxio ani nevím, že tam někde nějaký je, nebo Javelin, Clover, to je příklad, který vůbec netuším, co to je za softwary… rozhodně nejsou připojené přímo na ISKŘ a nevykonávají přímo tu agendu z hlediska ústřední úrovně. Nevím, jak to ty obce tam mají napsané."* (Lukeš, ř. 381–386)

a vysvětlil, proč se pořád objevuje spisová pošta:

> *„…ty obce vydávají nějaké rozhodnutí z hlediska zákona o krizovým řízení. Třeba o osobní pomoci. Ale nevím, jestli to patří sem, tento systém."* (Lukeš, ř. 389–391)

### Proč to vzniklo
Vazba ISVS ↔ agenda vzniká z toho, že si **obec sama** k systému zapsala agendu (`isvs.agendy[]`, ETL `build_client_data.py:54–55`). Obec vydávající rozhodnutí podle krizového zákona si proto ke své spisovce / lokálnímu systému připíše agendu A338 — a systém se objeví u krizového řízení, ač s ústředním ISKŘ nemá nic společného. **Aplikace nerozlišuje „obsluhuje agendu na ústřední úrovni" vs. „obec si agendu jen vyklikala".**

### Jak to zlepšit
1. **Filtr „úroveň zapojení systému":** ústřední/registrový vs. lokální (obecní). Odvoditelné z typu správce (`_spravce_typ`, `app/app.js:300, 941` už existuje — Ministerstva/DIA/Organizační složky státu vs. Obce).
2. U agendy v default pohledu **upřednostnit ústřední systémy** a lokální skrýt za rozbalení (analogicky k OVM, B10).
3. Označit „neznámé" lokální systémy (Proxio/Javelin/Clover) jako **„obecní systém — vykonává agendu lokálně"**, aby bylo jasné, že to není ústřední komponenta.

## IV.3 (C13) Editory vs. čtenáři — kdo smí zapisovat

### Co je špatně / vysvětlení
Petr Kučera doplnil mechaniku oprávnění, kterou musí aplikace umět ukázat:

> *„…oni si tam píšou agendu na to rozhraní, na základě který můžou přistupovat k nějakým datům… buď že chtějí do ROBu, a to mají spolu všichni, protože potřebují ověřit toho občana… Pak je tam nějaká skupinka systémů, které jsou tzv. editory. To znamená třeba ten cizinecký systém je editor ROBu. Matriky jsou editor ROBu. Ten ISO, Informační systém občanek, je taky editor ROBu, a ten ROB je potom v podstatě jenom ke čtení pro ty ostatní."* (Kučera, ř. 413–426)

### Proč to vzniklo + co kód umí
Tato vlastnost (editor = W) **v datech existuje** (`opravneni.json` pole `rw`; 195 čistě „W"). Aplikace ji zobrazuje v tabulce oprávnění (`app/app.js:502`, badge W/R), ale **nikde neoznačuje systém/agendu jako „editor ROBu"** — chybí agregace „tato agenda je editorem registru X".

### Jak to zlepšit
1. **Odvodit a zobrazit roli „editor registru":** pro každou agendu/systém spočítat, zda má vůči ROB/ROS oprávnění s úrovní W; pokud ano, přidat štítek **„editor ROB"**. (Cizinecký systém, matriky, ISO.)
2. V grafu i v dopadové analýze **rozlišit hrany R vs. W** barevně — to je přímo žádané (Vlastova „kdo co čte a kam se píše", ř. 526–527, viz blok D).

## IV.4 (C14) Chybí číselník názvů ISVS → tentýž systém pod mnoha názvy

### Co je špatně
Klíčové datové zjištění Petra Kučery: jeden software je v RPP veden pod mnoha názvy, protože každá obec si píše název po svém („KEO" vs „KEO 04" vs „KEO X Hosting", lišící se i jen mezerou). Bez normalizace nejde spočítat rozšíření jednoho systému:

> *„To je ten bordel, že tam máš jeden systém pod různýma názvama, protože to tam píše ta obec. A píšou to tak, jak to mu oni říkají… tady není žádný číselník, do kterého by se prostě zaregistrovaly ty názvy těch informačních systémů, a pak ani nespočítáš, na kolika místech je ten jeden informační systém jako použitej."* (Kučera, ř. 664–667)

Kučera si proto udělal vlastní „vejcuc" do Excelu (ř. 657–658), kde ručně dohledával, kolikrát se systém vyskytuje.

### Proč to vzniklo
RPP **nemá registrační číselník názvů ISVS** — pole `název` je volný text plněný správcem. ETL ho přebírá 1:1 (`build_client_data.py:118` `cs(i.get("název"))`). Důsledek: 12 110 ISVS záznamů obsahuje neznámý počet *duplicit téhož produktu* pod různými zápisy. To podkopává jakýkoli výpočet rozšíření, žebříčky i dopadovou analýzu (jeden produkt rozštěpený na N záznamů vypadá jako N systémů).

### Jak to zlepšit — pozor na správný typ řešení
Vlasta varoval před nesprávným řešením (velký schvalovací číselník):

> *„To není nejšťastnější jako udělat velkej číselník, tam si musíš především schválit položku, aby sis tam mohl přidat systém. To jako nikdy nefunguje."* (Vlasta, ř. 673–675)

Kučera i Vlasta se shodli na **číselníkové (mapovací) vrstvě nad daty**, která nepřepisuje zdroj:

> Kučera: *„…tam má někdo sedět a identifikovat tyhle ty věci, na to má mít software a má to srovnat."* (ř. 677)
> Vlasta: *„…to srovnání není o tom, že ty data přepíšu, ale třeba že nad těma datama dělám číselníkovou vrstvu, která se pak seskupuje dohromady do nějakých rodin."* (ř. 679–681)

Konkrétní návrh do aplikace/ETL:
1. **Mapovací vrstva (canonical_isvs):** nad surovými názvy postavit normalizaci do **rodin produktů** — fuzzy match (normalizace mezer/diakritiky/verzí: „KEO", „KEO 4", „KEO X Hosting" → rodina „KEO") + slovník známých produktů (GINIS/GORDIC, VERA Radnice, KEO, Munis…). **Zdroj se nepřepisuje** — přidá se odvozené pole `_rodina`.
2. **Profilování softwaru člověkem.** Kučera zdůraznil, že to vyžaduje někoho „kdo na tom sedí, má tam profilování" — tj. lidská kontrola hraničních případů, ne čistě automat.
3. **Nová metrika „rozšíření produktu"** = počet instalací rodiny napříč OVM. Teprve to dá smysluplné žebříčky („nejrozšířenější obecní spisová služba"), oddělené od kritičnosti (A1).
4. Označit jako **P1** — bez tohoto je každé počítání nad ISVS nespolehlivé.

## IV.5 (C15) Náklady jsou děravé — řazení/porovnání podle nákladů nespolehlivé

### Co je špatně
Pole o nákladech (provoz / pořízení) jsou vyplněna jen zlomkem systémů:

> *„…kolikrát jsou vyplněné náklady, tak na provoz 120krát a na pořízení 104krát. Když si vezmeš, že tam je prostě nějakých 19 [tisíc] informačních systémů, tak ta položka je vyplněná hodně řídce… ale jestliže máš ten start podle nějakých [polí] třídí, tak nemůžou vypadat takhle."* (Kučera, ř. 688–691)

A obecnější diagnóza odpovědnosti:

> *„…ten, kdo je správcem toho registru, tak správce je DIA a DIA by se měla starat o to, aby ty data byly pořádně. A jak historicky… aby tam byly aspoň nějaký, no tak oni jim umožnili žít i s tím, že ty data nejsou úplný."* (Kučera, ř. 434–437)

### Proč to vzniklo
Současné ETL **náklady vůbec nenačítá** (v `build_client_data.py` se z ISVS berou jen `charakteristika`, `bezuroven`, `umisteni`, `etapa`, `sdileni`, `vyuziti`, `agendy` — `:117–128`; pole nákladů chybí). Aplikace tedy zatím nákladová pole nepoužívá — to je dobře, protože jsou nereprezentativní (~120 z ~12 110 = ~1 %). Pokud by se kdy přidala (např. do srovnání nebo žebříčků), výsledek by byl zavádějící.

### Jak to zlepšit
1. **Nedělat řazení/porovnání podle nákladů** dokud není fill-rate dostatečný. Pokud se náklady zobrazí, vždy s **fill-rate štítkem** („vyplněno u ~1 % systémů — neporovnatelné").
2. **Fill-rate jako analytický výstup pro DIA** (Část X): kvantifikovat děravost klíčových polí (náklady, bezpečnostní úroveň, umístění) — to je přesně „nástroj pro hledání nesmyslů" (Pejčoch, ř. 405), který DIA může použít na „udělání pořádku".
3. V `docs` (kvalita dat) zaznamenat, že **správcem RPP je DIA** a že fill-rate je governance problém, ne chyba aplikace.

---

# Část V — Blok D: Graf vazeb (ego-graf, příklad ministerstvo vnitra)

Pokrývá připomínky D16–D18. Týkají se obrazovky „Graf vazeb" (`app/app.js:507–579`) a její koncepce.

## V.1 (D16) U ministerstva vnitra chybí klíčové agendy

### Co je špatně
Po kliknutí na ministerstvo vnitra se zobrazí vazby (zákon o potravinách, systém základních registrů, státní občanství…), ale **chybí klíčové agendy, za které MV ze zákona odpovídá** — vnitřní bezpečnost a krizové řízení; „zákon o potravinách" pod vnitrem je sporný. Lukeš obrázek nepochopil:

> *„Když kliknu na ministerstvo vnitra, tak se mi ukážou vazby a teď já nevím vlastně, k čemu to slouží. Mám tady nějaké vazby, zákon o potravinách… systém základních registrů, OK… ale vlastně tady nevidím třeba jednu z agend, kterou je vnitřní bezpečnost nebo krizový řízení, který jsou jako vyloženě zákonama určený, že ministerstvo vnitra je odpovědný ministerstvo… připadá mi, že tady chybí fakt věci, které to ministerstvo dělá."* (Lukeš, ř. 506–511)

### Proč to vzniklo (technická příčina — doloženo)
Ego-graf při rozbalení OVM bere jen **vzorek 8 agend** z pole `agendy_sample`:

- `app/app.js:552–553` — pro uzel `orgán…` se rozbalí `(o.agendy_sample||[]).slice(0,8)`.
- `agendy_sample` je v ETL **abecední řez prvních 60** (`build_client_data.py:147` `sorted(ovm_ag.get(oid, set()))[:60]`), z toho graf vezme prvních 8.

MV má v `meta.json` (`top_ovm`) **220 agend**. Zobrazí se tedy 8 *abecedně prvních* z 220 — náhodný, nereprezentativní výběr, kde klíčové agendy (krizové řízení A338, vnitřní bezpečnost) snadno vypadnou, zatímco okrajové (zákon o potravinách) zůstanou. **Není to chyba dat, ale chyba výběru vzorku** (abecedně místo dle důležitosti).

### Jak to zlepšit
1. **Řadit `agendy_sample` dle důležitosti agendy**, ne abecedně (ETL `build_client_data.py:147`). Pak prvních 8 budou skutečně nosné agendy.
2. **Garantovat klíčové agendy:** u známých gestorů (MV → A338 krizové řízení, vnitřní bezpečnost) je do ega vždy zařadit.
3. **Zobrazit počet skrytých** („+212 dalších agend") a umožnit rozbalení.

## V.2 (D17) Orbitální vizualizace je „nešťastná" — má být zleva doprava

### Co je špatně
Vlasta označil orbitální layout (překrývající se kružnice) za matoucí a navrhl tokové uspořádání:

> *„Ta vizualizace [je] nešťastná. Ono by to mělo být třeba zleva do prava. Kdo co čte a kam se píše, a ne tyto orbity, které se překrývají."* (Vlasta, ř. 525–527)

### Proč to vzniklo
Graf používá silově-řízené (force-directed) rozložení `cose` (`app/app.js:557`, `relayout()`) — uzly se rozmístí do shluků/„orbit" bez směrové sémantiky. Pro **tok dat (R/W)** je vhodnější **směrový (left-to-right) layout**, kde osa X kóduje „zdroj → příjemce".

### Jak to zlepšit
1. **Přidat alternativní směrové rozložení** (např. `dagre`/`breadthfirst` v Cytoscape) s osou „kdo dává → kdo bere", přepínatelné s ego-grafem.
2. **Hrany podle R/W:** zápis (W, editor) a čtení (R) odlišit barvou/stylem (graf už umí styl `flow` dashed, `app/app.js:535` — rozšířit na R vs. W).
3. Pro dopadovou analýzu už koncentrický layout dle řádu kaskády existuje (`app/app.js:673`) — to je dobrý vzor „směrovosti".

## V.3 (D18) Agenda cizinecké policie je navázaná na obec, má být na MV

### Co je špatně
Cizinecká policie je odbor MV; aplikace ji v grafu váže na obec:

> *„…agenda cizinecké policie je určitě svázaná s ministerstvem vnitra, protože to je odbor ministerstva vnitra. A vnitro odpovídá za celou agendu cizinecké policie a ochrany státních hranic. Ale tady je to navázané někam na obec. Tak nevím, jestli to taky není tím, že jsou přehozené ty směry… ale tady to prostě nesedí."* (Lukeš, ř. 530–535)

### Proč to vzniklo
Vazba agenda ↔ OVM vzniká z **působnosti** (`pusobnost_v_agendach`, 910 668 párů; ETL stream `build_client_data.py:70–85`). Pokud si obec do působnosti zapsala i agendu cizinecké/hraniční (např. kvůli dílčímu úkonu), objeví se obec jako vykonavatel. Ve vzorku 8 (graf) pak může „vyhrát" obec nad MV — opět **problém nereprezentativního vzorku** (V.1) plus **chybějící váhy** (ústřední > obec). Lukeš správně tuší souvislost s přehozenými směry (A4), ale primární příčina je zde výběr/váhy.

### Jak to zlepšit
1. Stejné jako V.1: **řadit OVM u agendy/v grafu dle úrovně** (ústřední gestor nahoře). Cizinecká agenda → MV se pak ukáže jako primární.
2. Rozlišit **„gestor agendy" (ohlašovatel)** vs. **„vykonavatel úkonu".** Ohlašovatele aplikace má (`a.ohlasovatel`, `build_client_data.py:97`; zobrazen v detailu agendy `app/app.js:236`) — v grafu ho ale nevyužívá. Gestor (MV) by měl být v grafu zvýrazněn jako kořen.

---

# Část VI — Blok E: Role v agendách (Vlasta) — architektonická mezera

Pokrývá připomínky E19–E21. Toto je koncepčně nejhlubší blok: ukazuje hranice toho, co RPP vůbec umí dát.

## VI.1 (E19) Různé kompetenční role — RPP je nemá

### Co je špatně
Vlasta (správní právo) upozornil, že agenda se vykonává v **různých rolích**, a systém je nerozlišuje:

> *„…jsou pravomoci nebo kompetence vlastní a jako delegované, pak v rámci státem nařízené a pak v rámci nějaký samosprávy. A ještě ty agendy — různý subjekty, který jsou v hierarchickém postavení mezi sebou, zřizovatel, vlastník, v rámci dotační položky — tak mají různou roli v těch agendách, takže některou má jako dohledovou, některá je kontrolní, některá je koordinační, některá je výkonová. A tady ten systém jen vyplácne agendu, že to dělá, ale ne v jaké roli."* (Vlasta, ř. 573–575)

Proč to pro krizové řízení/rizika zásadní:

> *„…pro tu analýzu rizik nebo pro to krizový řízení je dobré vědět, jestli někdo je vykonavatel, nebo jenom jestli to vzdáleně dozoruje. Dozoruje nad bankovním trhem, ale… mě mnohem víc zajímají ty banky samotný, než nějaký fiktivní dozor, který nestihne obhlédnout všechny banky."* (Vlasta, ř. 576–578)

### Proč to vzniklo + zásadní hranice (Petr Kučera)
Kučera vysvětlil, že to **RPP principiálně nedá**:

> *„…tady je to vyložené, že to RPP, ten původní důvod, proč vzniklo, tak vzniklo právě kvůli propojování těch informačních systémů, takže tam je to o datech. A samozřejmě je teda o rolích, protože můžeš mít za úřad připojených několik rolí a každá [má] přístup k jiným datům. Takže to je jenom v podstatě řízení přístupových práv… ale ty věci, co teďka Vlasta zmiňoval, to nejde, to tam není."* (Kučera, ř. 580–583)

Tedy: v RPP **„role" = přístup k datům**, ne **kompetenční role** (dohled/kontrola/koordinace/výkon). Aplikace to věrně odráží — vazba OVM↔agenda z působnosti je „dělá to", bez role. **To je mezera, kterou RPP sám nevyplní** — cenné zjištění pro celou vizi znalostní vrstvy.

### Jak to zlepšit
1. **Přiznat mezeru explicitně v UI:** u vykonávajících orgánů uvést „RPP eviduje výkon agendy, nikoli kompetenční roli (výkon vs. dohled/koordinace)".
2. **Doplnit roli z jiného zdroje** — z **průřezových činností** (viz E20 níže), kde role *na úrovni paragrafu* existuje, nebo z kompetenčního zákona. To je úkol znalostní vrstvy (Tomáš Vejlupek, ř. 1112–1123), ne čistého RPP.
3. Pro analýzu rizik (UC13) **vážit dopad podle role:** pád vykonavatele ≠ pád dozoru.

## VI.2 (E20) Průřezové činnosti s rolí — paprskový graf, který chybí

### Co je špatně
Lukeš ukázal, že **v databázi RPP** (nejen v Excelu) má každá agenda **průřezové činnosti** s odkazem na paragraf a s rolí — a tyto vazby mají být v **paprskovém grafu**, který aplikace nemá:

> *„…když vezmu průřezovou činnost 2709, tak tady je definovaný, na který paragraf se odkazuje… a pak je tady napsáno, že na úrovni vlády to mají na starosti / mají oprávnění tam vykonávat jako činnost ministerstva [a] další ústřední správní úřady. A tahle role je propsaná v RPP… myslím, že tyhle linky by měly být v tom paprskovým grafu, že to tam mělo být ukázané, kdo všechno se účastní řešení ty agendy. Ale to jsem to nenašel. A to musí mít každá agenda, tohle musí být vyplněné."* (Lukeš, ř. 585–593)

### Proč to vzniklo (kód)
Činnosti agendy aplikace **má** — ETL je načítá (`build_client_data.py:91–94`): `kod`, `nazev`, `popis`, `vol` (volitelný výkon). A detail agendy je zobrazuje (`app/app.js:250–256`). **Co ale chybí:**
- **Odkaz na paragraf** (§) u činnosti — ETL pole pro § nenačítá.
- **Role na úrovni vlády** (které typy orgánů činnost vykonávají) — nenačítá se.
- **Paprskový graf** „kdo se účastní řešení agendy" přes činnosti — neexistuje; graf vazeb (V.) jde přes ISVS/služby/oprávnění, ne přes činnosti→role.

Tedy: Bareš to **nezobrazil**, ačkoli zdroj existuje. To je přímý úkol.

### Jak to zlepšit
1. **Rozšířit ETL o §-odkaz a role u činností** (z `agendy.json` činností — pole odkazu na předpis a kategorie OVM, které činnost vykonávají; vazba existuje, viz `docs/01:31` „činnost/A1114/CR6661").
2. **Postavit paprskový (radial) graf agendy:** centrum = agenda, paprsky = činnosti → typy orgánů/role (ústřední úřady, kraje, obce). To je přímo Lukešův požadavek a zároveň naplnění **UC6** (karta agendy, `docs/02_usecases.md:38–40`, „činnosti s odkazy na § eSbírky").
3. Provázat s VI.1 — role z činností je jediná cesta, jak do nástroje dostat „výkon vs. dohled" alespoň částečně.

## VI.3 (E21) Schvalování oprávnění — interní věc pro DIA, ne pro software

### Co je špatně / o co jde
Lukeš popsal, že zápis oprávnění k datům podléhá **schválení správcem cílového systému**, a dokud neschválí, oprávnění se do RPP nepropíše:

> *„…každej ten správce toho agendového systému nebo informačního systému, kterýho já tady napíšu, tak on mě to schvaluje. A dokud by to neschválil, tak se to nepropíše do toho RPP. Takže jsme měli velký diskuze s ministerstvem dopravy — přístup k agendě řidičů, na základě jakého zákona vlastně chceme kompletní přístup, nebo že nám dají jenom jméno, příjmení a že má řidičák."* (Lukeš, ř. 594–597)

a problém balíkového schvalování:

> *„…když si zarezervujete přístup do deseti agent a v jedné agendě budete mít úředníka, který je úplně pomatený a bude vám to blokovat rok, tak nemáte schválený kompletní balík deseti agentů. Ale to není jako na software, to je spíš na Bohdana, aby se na to podíval. To jsou věci interní."* (Lukeš, ř. 599–601)

### Proč je to relevantní pro aplikaci
Vysvětluje to **děravost a zpoždění** v datech oprávnění: chybějící oprávnění nemusí znamenat, že vazba neexistuje, ale že **čeká na schválení** nebo bylo zablokováno. To je důležitý disclaimer pro dopadovou analýzu (chybějící hrana ≠ neexistující závislost).

### Jak to zlepšit
1. **Není to softwarová oprava aplikace** — je to **otevřená otázka pro DIA / Bohdana Urbana** (Část X): jak schvalovací proces ovlivňuje úplnost dat.
2. V aplikaci jen **disclaimer** u toků: „RPP zachycuje pouze schválená oprávnění; čekající/zablokovaná nejsou vidět."

---

# Část VII — Blok F: Kaskádová / dopadová analýza (UC13)

Pokrývá připomínku 22–23. Týká se vlajkové funkce UC13 („Dopady & kaskády", `app/app.js:583–677`) a je to nejdůležitější koncepční korekce pro analýzu rizik.

## VII.1 (22) Kaskádu nelze dělat mechanicky přes vazby

### Co je špatně
Petr Kučera zásadně zpochybnil mechanický výpočet kaskády přes hrany grafu:

> *„Takový ty dopady, jako když ti spadne nějaký registr nebo nějaký takovejhle systém, tak nejdou udělat mechanicky tady přes ty vazby. Protože když ti spadne ROB… tak když nebude ležet prostě týdny, tak se tak nic moc nestane, protože všechny ty informační systémy, nebo velká většina, jsou dělaný tak, že si u sebe držejí kopii záznamů o těch lidech, obohacenou o ty záznamy, který používá jenom ten úřad. A od toho ROBu dostávají informaci — tenhle člověk se přestěhoval, tenhle umřel, změnil jméno… když uřízneš ten registr a nepůjde dva dny, tak to neznamená, že nepůjde ten úřad. Ten úřad půjde."* (Kučera, ř. 449–454)

### Proč to vzniklo (kód)
Dopadová analýza dnes dělá **přesně to, před čím Kučera varuje** — mechanické BFS přes oprávnění:

- `app/app.js:588` — `dependents[z].push(do)` (kdo od koho bere),
- `app/app.js:622–628` — BFS po `depth` řádech přes `dependents`,
- výstup: „N zasažených agend, M služeb, K orgánů, řády kaskády" (`app/app.js:636–642`).

Model implicitně předpokládá **tvrdou, okamžitou závislost** (vypadne zdroj → padá příjemce). Realita (lokální kopie + notifikace) znamená, že většina příjemců **přežije** výpadek registru po dny. Kód si je nedokonalosti částečně vědom — uvádí disclaimer o cloudových závislostech (`app/app.js:645` „RPP nezachycuje cloudové závislosti — reálný dosah může být větší") — ale **chybí opačný disclaimer**, že většina závislostí je *měkká* (a reálný okamžitý dosah je *menší*).

### Jak to zlepšit
1. **Zavést typ závislosti na hranu:** „měkká" (lokální kopie + notifikace, výpadek toleruje dny) vs. „tvrdá/živá" (žádná lokální DB, výpadek = okamžitý pád). Default kaskáda počítá jen tvrdé hrany; měkké zobrazí jako „odolné (lokální kopie)".
2. **Časová dimenze:** „dopad za 1 hodinu / 1 den / 1 týden" — měkké závislosti se projeví až po vyčerpání lokálních kopií/notifikací.
3. Disclaimer doplnit oběma směry (větší kvůli cloudu × menší kvůli lokálním kopiím).

## VII.2 (23) Lukešova oponentura — živé připojení a ROB jako pilíř

### Co je špatně / nuance
Lukeš Kučeru částečně oponoval — v posledních letech se hodně změnilo a existují **životně závislá živá připojení**:

> *„Já bych to malinko rozporoval, protože poslední roky se tady hodně změnilo. Když jsme stavěli ISKŘ, tak tam přesně měl být nějaký black box, který si do sebe natáhne data z registru. A to z toho důvodu, že hasiči potřebujou najednou v jednom okamžiku mít přístup k datům 150 tisíc lidí, protože u sídliště se najde bomba. A registry dotaz na 150 tisíc lidí v reálném čase nejsou schopny přenést."* (Lukeš, ř. 456–459)

> *„…je tam určitá výjimka, kterou jsme museli dát do zákona, abychom si vůbec mohli udělat zálohu registru… kdo si dělá zálohu registru, hraje s ohněm."* (Lukeš, ř. 463)

> *„…policie, soudy, checkpointy jsou životně závislí na tom, že mají neustálé připojení do registru obyvatel, do registru osob, do registru vozidel. A nemají žádný svoje databáze, ty fakt mají jednotlivý dotazy, kontrolovaný vrchním státním zástupcem… Takže ten registr obyvatel zejména je klíčový registr celé státní správy a zejména v oblasti krizovýho řízení je to věc, která je toho pilíř."* (Lukeš, ř. 467–469)

### Syntéza (důsledek pro nástroj)
Kučera i Lukeš se **nevylučují** — popisují dva různé režimy:
- **Měkká závislost (většina úřadů):** lokální kopie + notifikace → výpadek registru tolerují dny.
- **Tvrdá/živá závislost (policie, soudy, checkpointy, IZS s hromadnými dotazy):** žádná vlastní DB, životně závislé na živém připojení → výpadek = okamžitá ztráta schopnosti.

**ROB je pilíř celé státní správy, zvláště v krizovém řízení.** To potvrzuje směr oprav A1/A4 (registry nahoru, default epicentrum = ROB) a F22 (rozlišovat typ závislosti).

### Jak to zlepšit
1. Kaskádová logika musí **rozlišovat typ závislosti** (měkká kopie+notifikace vs. živé připojení) — ne jen počítat hrany grafu.
2. **Označit „živě závislé" konzumenty** (policie, soudy, IZS, checkpointy) jako kriticky zasažené i při krátkém výpadku registru.
3. Provázat s **UC13** (`docs/02_usecases.md:66–68`) — doplnit do jeho definice rozlišení typu závislosti a časovou osu; dnes UC13 mluví jen o „1., 2., n-tém řádu", což je právě ten mechanický model.

---

# Část VIII — Co Bareš opravil ještě na schůzce / hned po ní

Tato část shrnuje, co se během schůzky reálně změnilo, a hlavně **co je třeba ověřit, že se propsalo**.

## VIII.1 Polarita R/W — nasazena nová verze, propsání neúplné
Bareš během schůzky upravil program a nasadil novou verzi s opravou směru oprávnění:

> *„Já jsem se snažil ověřit, změnit ten program, já už jsem nasadil novou verzi. Tak jenom chci zjistit, jestli se to podařilo fixnout… jestli to povedlo i propsat třeba do toho dashboardu."* (Bareš, ř. 545–557)

Živě pak zjistil, že **na dashboardu se oprava neprojevila** — spisová služba zůstala „velmi důležitá" (ř. 560–561), a Lukeš potvrdil, že propsat se to má „Všude" (ř. 563).

**K ověření:** že je polarita konzistentní (i) v detailu agendy (toky), (ii) v grafu (směr šipek, R/W barvy), (iii) v dopadové analýze (epicentrum), (iv) na dashboardu (žebříček). Test: u A338 musí být vidět *jen* „bere/čte z registrů" (7×R) a žádné „dává/zapisuje"; ROB musí být *zdroj*.

## VIII.2 Filtry a řazení OVM dle typu a důležitosti — nasazeno
Bareš potvrdil (a kód dokládá, `app/app.js:834–854, 359–376, 165–196`), že **filtrování dle typu instituce** (ministerstva, kraje, města, obce, městské části, úřady, soudy, podniky, pojišťovny, školy) a **řazení dle důležitosti** už nasadil (ř. 607–609).

**K ověření:** že se totéž promítlo i do **karty „Vykonávající orgány" v detailu agendy** (`app/app.js:280`), kde je dosud plochý abecední vzorek (viz B10) — tam to **ještě nasazené není**.

## VIII.3 Pokus o „důležitost" agend — přiznaně provizorní
Bareš přiznal, že priorita/důležitost u agend je jeho pokus bez opory v datech:

> *„Já jsem si myslel, že to stanovuje… čistě já tam nemám z čeho čerpat."* — *„To byl můj pokus dát tam nějakou prioritu."* (Bareš, ř. 623–630)

Lukeš na příkladu „akreditace vzdělávání ve zdravotnictví" ukázal, že odvozená důležitost je sporná (ř. 622) a slíbil se na to podívat.

**K ověření / dořešit:** nahradit kvantilovou heuristiku `IMPORTANCE` (`app/app.js:865`) skutečně podloženým kritériem (BESP, registry, role) — viz A2/A5.

## VIII.4 Microsite „krizová připravenost" — opravy přijaté principiálně
U druhé aplikace Bareš přijal principy: filtr „dobrý/střední/špatný" stav, zvýraznění zastaralých údajů, disclaimery u zdrojů (NKÚ), pozitivní/otázkové formulace místo „strašení" (ř. 776–784, 905–915). Detaily v Příloze A.

## VIII.5 Reálná × odvozená × chybějící data — jasné oddělení (v6.1, 16. 6. 2026)
Připomínka P. Kučery (2. kolo): *„prosím je možné z RPP Exploreru odstranit veškerá AI vygenerovaná data? Ta, co si vymyslela, protože to nemá podklad? Strašně to máte, protože si míchají reálná data s ‚absentovanými' daty s ‚vymyšlenými daty, protože absentují'."* Souvisí s #6, #7 (důležitost údaje), #9, #10.

Rozhodnutí (volba uživatele): **oddělit a označit**, ne plošně mazat analytiku (kritičnost dle dopadu a kategorie byly výslovně chtěné na 19. schůzce). Implementováno:

| Vrstva | Co bylo | Náprava |
|---|---|---|
| **Vymyšlené** (bez podkladu) | `family_of` hádala „rodinu" z 1.–2. slova názvu → slučovala nesouvisející systémy | **Odstraněno.** Rodina jen ze slovníku produktů nebo z **přesné shody názvu u ≥2 instalací**; ojedinělé názvy rodinu nedostanou (`etl/build_client_data.py` — zrušeno 1 357 ojedinělých rodin). KEO (3 625), Munis aj. reálné clustery zůstávají. |
| **Odvozené** (analytika) | Důležitost/Kritičnost, Kategorie, Rodina, Typ instituce/správce — vizuálně k nerozeznání od polí RPP | **Označeno značkou „⚙ odvozeno"** (helper `dH()`/`dvd()` v `app.js`) s tooltipem, jak se počítá; ve všech 6 seznamech, v prohlížeči databáze i v detailech. |
| **Chybějící** (RPP nevyplněno) | nejasná pomlčka „—" | **„neuvedeno"** kurzívou (`na()`/`naIf()`), odlišené od nuly i od odvozeného. |
| Orientace | — | **Legenda původu hodnot** (`srcLegend()`) pod hlavičkou zdroje na každé datové obrazovce. |

Tím #7 („proč je Adresa méně důležitá než Adresa realizace") dostává jasnou odpověď: sloupec u údajů je přejmenován na **Rozsah** (= počet dílčích údajů, ne sémantická váha) a označen „⚙ odvozeno". #9 („stanovisko údaje") má vysvětlující tooltip.

---

# Část VIII-bis — Blok G: Příčina nekvality dat a strategie prezentace (Petr Kučera, Jaroslav Pejčoch)

Tento blok není o jednotlivém prvku UI, ale o **kořenové příčině** většiny věcných chyb (proč jsou data taková, jaká jsou) a o tom, **jak s nálezy naložit politicky** vůči DIA. Pokrývá připomínky 24–25. Je klíčový pro úterní demo, protože určuje, zda nástroj uspěje jako spojenec DIA, nebo selže jako vnímaný útok.

## G.1 (24) Odkud pochází (ne)kvalita dat — a kdo za ni odpovídá

### Co je špatně / o co jde
Kvalita dat v RPP je strukturálně nerovnoměrná: agendy *existují* (protože bez nich úřad nevstoupí do registru), ale jsou plněny účelově a často chybně; ostatní pole (náklady, bezpečnostní úroveň) jsou děravá. Petr Kučera to popsal jako dvojí problém — „děravé" vs. „vyplněné, ale špatně":

> *„A tam vlastně správcem RPP je DIA, že jo. A ty OVM to tam v podstatě [plní], ty data tam jsou děravé. To, co tam není děravé, ale nemusí to být úplně dobře, jsou ty agendy, protože oni, když chtějí do registru, tak tam musí vykliknout aspoň jednu agendu, která je oprávní do toho registru číst. Takže oni tam ty agendy teda vyklikávají."* (Kučera, ř. 41–46)

Mechanismus vzniku „špatně vyplněných" agend je tedy systémový, ne náhodný: úřad **musí** mít aspoň jednu agendu, aby získal přístup do registru (typicky do ROB kvůli ověření občana), a protože vyklikávat jednotlivé agendy je pracné, **vyklikne všechny** — i ty, které nevykonává:

> *„…oni možná taky tam vyškrtnou, místo toho, aby vypisovali ty agendy, který dělají, protože určitě nedělají všechny… ale prostě se jim nechce ty agendy vyklikávat, tak vykliknou všechno, což znamená, že to teda vyplňujou blbě."* (Kučera, ř. 433)

### Proč to vzniklo (a proč to není chyba aplikace)
Toto je **vlastnost zdroje, ne ETL.** Aplikace věrně přebírá `isvs.agendy[]` a působnost (`build_client_data.py:54–55, 77–84`); pokud obec vyklikala 406 agend, aplikace zobrazí 406. Důsledek se ale propisuje do **každé metriky postavené na počtu agend** (A2): „důležitost", žebříček kritičnosti, velikost uzlu v grafu (`score` v `app/app.js:516`), velikost ega. Jinými slovy: jediná systémová vada zdroje (hromadné vyklikávání) kontaminuje řadu odvozených pohledů. To je nejsilnější argument pro to, aby kritičnost **nestála na počtu agend** (viz A1/A2/A5).

Kučera zároveň nabídl externí cestu, jak (ne)kvalitě porozumět — spolupráci s akademiky, kteří tatáž data zkoumají:

> *„…tyhle ty data kolem těch agend, že taky zkoumají na matfyzu u Martina Nečaskýho… A Martin Nečaskej právě s Klčem jsou ty, co se tady zasazovali o ty otevřený data, a v podstatě díky nim ty data máme. Protože oni opravdu na tohle udělali ty standardy… Dělali i nástroj, který vyrábí ty Jasony."* (Kučera, ř. 20–26)

A upozornil na ~1 800 analyzovaných agend (ř. 30) — číslo blízké našim 406 *typům* agend, ale s jiným záběrem. **Důležité ohraničení:** Nečaského tým řeší **formáty a sémantiku** (jak mají data vypadat), nikoli to, **zda někdo do RPP píše správně** — to jsou „úplně dvě různý věci" (Kučera, ř. 37–39). Pro náš nástroj z toho plyne: spolupráce s Matfyzem může pomoci pochopit a možná i zlepšit *strojovou* kvalitu (generování JSONů), ale *obsahovou* kvalitu (zda úřad vyplnil pravdu) řeší jen DIA jako správce.

### Jak to zlepšit
1. **Nestavět žádnou kritickou metriku na počtu vyklikaných agend** (sjednocení s A1/A2). Počet agend ponechat jako informativní, výslovně označený údaj „kolik agend si subjekt registroval" — ne „jak je důležitý".
2. **Navázat kontakt s Nečaským/Klčem** (Kučera nabídl, že zavolá, ř. 28–34) — cílem je pochopit, „odkud pochází ta kvalita, nebo co je důvodem nekvality" (Bareš, ř. 36), a případně využít jejich generátor JSONů jako čistší zdroj.
3. **Vizualizovat samotnou děravost jako produkt:** fill-rate klíčových polí (náklady, BESP, umístění) je sám o sobě analytický výstup — přesně ten, kterým DIA „udělá pořádek" (viz G.2). Aplikace už část toho umí (KPI „% uvedeno", `app/app.js:112–113, 129`).

## G.2 (25) Strategie prezentace vůči DIA — analýza rizik, ne útok

### Co je špatně / o co jde
Existuje reálné riziko, že nástroj, který odhaluje nepořádek v datech, bude DIA vnímat jako kritiku své práce. Jaroslav Pejčoch proto formuloval **klíčové strategické pravidlo**: podat to obráceně, jako analýzu rizik a jako *jejich* nástroj.

> *„…říkal jsem mu, že v tom máme nějaký verzej, který ale nechceme dát nikomu jinému než jemu… Že by to mohl být ten klíčový nástroj hlavně pro DIA a aby to bylo jejich nástroj… Právě z toho důvodu jsem říkal, že jsme si dělali analýzu rizik, aby nedošlo k tomu, že jim s tímhle začne mlátit po hlavě, že tam mají bordel v těch datech. Takže by bylo lepší to udělat úplně naopak."* (Pejčoch, ř. 87–90)

Z metodického hlediska to Pejčoch zarámoval jako otázku **metodiky plnění RPP**, kterou má řešit DIA:

> *„Z tohoto by se mohla odvozovat metodika. Já bych předpokládal, že pro to, jak tam ty úřady dávají [data], je nějaká metodika. Buď není, nebo je špatná, nebo jí nerozumějí, nebo to necvičejí, nebo to nikoho nezajímá, že je to jenom formální. A to je podle mě pohled zrovna pro tu DIA. Kdyby si mohli udělat pořádek a tohle mohli použít pro hledání těch nesmyslů, který tam jsou."* (Pejčoch, ř. 401–405)

Martin Vlasta tutéž logiku převedl do roviny komunikace: nástroj/web nemá být „aktivistický proti vládě", má přijít „s přátelskou pomocí a péčí, ne jim říkat, že jsou blbý" (ř. 923–927).

### Proč je to relevantní pro aplikaci
Strategie prezentace má **přímý dopad na to, jak se mají nálezy v aplikaci formulovat.** Tentýž datový fakt lze podat dvěma způsoby:
- **Útočně:** „69 % systémů nemá vyplněnou bezpečnostní úroveň — datový chaos."
- **Jako analýza rizik / nástroj DIA:** „Příležitost: doplněním bezpečnostní úrovně u 69 % systémů získá DIA úplný obraz kritické infrastruktury."

To není kosmetika — určuje to **tón disclaimerů, nadpisů a popisků** napříč aplikací (a microsite). Aplikace už má v „O projektu" správně laděný rámec (`app/app.js:792–799`): „ověřit, zda prezentace odpovídá datům" a „zapojit odbornou veřejnost do diskuse o správnosti a úplnosti" — tedy nikoli „odhalit chyby DIA". Tento tón je třeba držet i v analytických výstupech.

### Jak to zlepšit
1. **Sjednotit tón všech popisků a disclaimerů** na „příležitost / analýza rizik", ne „audit chyb". Zejména u fill-rate a u dopadové analýzy (`app/app.js:130, 645`).
2. **Připravit demo-narativ pro Urbana** (úterý 7:00): nástroj jako *jeho* prostředek na „udělání pořádku" a na řízení rizik, nikoli jako kontrola jeho práce. Účastníci: Bareš (věcně), Vejlupek (znalostní vrstva), Kučera (RPP zevnitř), Pejčoch (rámování). Vlasta doporučil malý tým: „stačí podle mě tři lidi, kteří to tam přednesou… důležitý je ten systém a ten message" (ř. 179–180).
3. **Z nástroje udělat generátor pozitivních úkolů pro DIA:** seznam „co doplnit, aby data byla úplná" (které agendy nemají ISVS, které systémy nemají BESP, které toky čekají na schválení) — to je „hledání nesmyslů" v konstruktivní podobě (Pejčoch, ř. 405).

---

# Část IX — Prioritizovaný plán oprav

Závažnost: **P1** = blokuje důvěryhodnost před DIA / věcně chybný výstup; **P2** = významné zkreslení nebo chybějící klíčová funkce; **P3** = vylepšení srozumitelnosti.

| # | Připomínka | Záv. | Zásah do | Konkrétní krok | Odhad |
|---|---|---|---|---|---|
| A4/B7 | Přehozená polarita R/W (propsat „všude") | **P1** | UI + datový model | Sjednotit směr „z→do = poskytuje→bere"; přidat R/W badge do detailu agendy (`app.js:276–278`) a grafu; ověřit propsání na dashboard | 1–2 dny |
| A1/A2/A5 | Chybné kritérium kritičnosti | **P1** | ETL + UI | Přepsat `top_critical` (`etl:214`) a `IMPORTANCE` (`app.js:865`) na skóre dle BESP + whitelist registrů; oddělit „rozsah" od „kritičnosti" | 2–3 dny |
| C14 | Číselníková vrstva nad názvy ISVS | **P1** | ETL + lidská kontrola | Mapovací vrstva `_rodina` (fuzzy + slovník), bez přepisu zdroje; metrika „rozšíření produktu" | 3–5 dní + průběžné profilování |
| B9 | Platnost / verzování (vždy poslední) | **P1** | ETL | Deduplikace agend na poslední `platnost_od`/verzi (`etl` mezi `:42` a `:88`); pravidlo i pro dokumenty | 1 den |
| F22/F23 | Kaskáda nesmí být mechanická | **P2** | datový model + UI | Typ závislosti měkká/tvrdá; časová osa; označit živě závislé (policie, soudy, IZS); obousměrný disclaimer (`app.js:645`) | 3–4 dny |
| E20 | Paprskový graf činnost→§→role | **P2** | ETL + UI | Načíst § a role u činností; radial graf agendy (UC6) | 3–4 dny |
| A5 | BESP — význam a barvy | **P2** | UI | Přejmenovat sloupec, tooltip (výklad Kučery), opravit `badgeSec` (`app.js:53`) ze „dobré/špatné" na škálu dopadu | 0,5 dne |
| B10 | Váhy/filtry OVM v detailu agendy | **P2** | ETL + UI | Řadit `ovm_sample` dle úrovně (`etl:104`); filtry+subsumace v detailu agendy (`app.js:280`) | 1–2 dny |
| D16/D18 | Nereprezentativní vzorek v grafu | **P2** | ETL | Řadit `agendy_sample` dle důležitosti (`etl:147`), garantovat klíčové agendy, zvýraznit gestora (ohlašovatele) | 1 den |
| C13 | Označit editory (W) registru | **P2** | ETL + UI | Odvodit „editor ROB" z `rw=W`; štítek + barva hrany | 1 den |
| D17 | Tokové (L→R) rozložení grafu | P3 | UI | Alternativní `dagre`/`breadthfirst` layout, R/W hrany | 1–2 dny |
| C11/C15 | Zdroj dat na obrazovce + fill-rate | P3 | UI | Hlavička zdroje na každé datové obrazovce; fill-rate štítky (náklady, BESP) | 1 den |
| B8 | Kontext k nízkým počtům toků | P3 | UI | Vysvětlující věta u toků; označit „k ověření" | 0,5 dne |
| E19/E21 | Mezery RPP (role, schvalování) | P3 | UI (disclaimer) + Část X | Disclaimery; zbytek = otázka pro DIA | 0,5 dne |

**Doporučené pořadí pro úterní demo DIA (7:00):** nejprve P1 (polarita, kritičnost, verzování) — to jsou věci, na kterých „vás nenachytají na něčem starém/obráceném" (Lukeš). Číselníková vrstva ISVS (C14) je P1 obsahově, ale časově náročnější — na demo stačí přiznat ji jako *plánovaný* krok a ukázat Kučerův „vejcuc" jako důkaz proveditelnosti.

---

# Část X — Otevřené otázky pro DIA / Bohdana Urbana

Tyto body **nejsou softwarové opravy aplikace** — jsou to procesní/governance záležitosti, které musí řešit DIA jako správce RPP. Hodí se na úterní call (Pejčoch, ř. 86–91) a podávat je **jako analýzu rizik, ne jako kritiku** (Pejčoch: „aby nedošlo k tomu, že jim s tímhle začne mlátit po hlavě, že tam mají bordel v datech… by bylo lepší to udělat úplně naopak", ř. 89–90).

1. **Metodika plnění RPP úřady.** Pejčoch: existuje metodika, jak úřady plní RPP? „Buď není, nebo je špatná, nebo jí nerozumějí, nebo to necvičejí, nebo je to jen formální." (ř. 402–403) → DIA může nástroj použít „pro hledání nesmyslů" a „udělání pořádku" (ř. 405).
2. **Schvalování oprávnění (E21).** Jak schvalovací proces (a balíkové blokování jedním „pomateným úředníkem", ř. 599) ovlivňuje úplnost dat? Chybějící oprávnění = neexistuje, nebo čeká na schválení?
3. **Číselník/registrace názvů ISVS (C14).** Proč RPP nemá registrační číselník produktů? Lze nad RPP postavit oficiální mapovací vrstvu (kdo ji bude profilovat)?
4. **Fill-rate klíčových polí (C15).** Náklady ~1 %, bezpečnostní úroveň „Neuvedeno" u ~69 % ISVS. Jak DIA jako správce zajistí kvalitu? (Kučera: „DIA by se měla starat… umožnili jim žít s tím, že data nejsou úplná", ř. 434–437.)
5. **Role kompetencí (E19).** RPP role = přístup k datům, ne kompetenční role (výkon/dohled/koordinace). Plánuje DIA tuto vrstvu, nebo patří do znalostní vrstvy PS07?
6. **Spolupráce Nečaský & Klčo (Matfyz).** Zkoumají tatáž data agend (~1800), mají standardy a generátor JSONů (Kučera, ř. 20–36). Možná spolupráce pochopit, „odkud pochází (ne)kvalita" — oddělené od toho, zda někdo do RPP píše správně.
7. **Procesní modelování agend.** Vejlupek upozornil na chystaný „velikánský tendr na procesní modelování agend státní správy" (ř. 1113) — relevantní pro znalostní vrstvu; zjistit od DIA stav.

**Strategický rámec (Pejčoch/Vlasta):** nástroj ukázat Urbanovi jako *jeho* nástroj („aby to bylo jejich nástroj", ř. 88), v úterý v 7:00, s vybranými lidmi (Bareš, Vejlupek — znalostní vrstva, Kučera, Pejčoch). Vlasta: nepřicházet aktivisticky/„že jsou blbý", ale „s přátelskou pomocí a péčí" (ř. 923–927).

---

# Závěr a provázání na use-case dokumenty

Devatenáctá schůzka potvrdila, že **RPP Explorer má správnou architektonickou intuici, ale na několika místech mechanicky zpracovává data způsobem, který zkresluje realitu.** Čtyři P1 chyby (polarita R/W, kritérium kritičnosti, číselníková vrstva ISVS, verzování) jsou opravitelné v řádu dnů, převážně v ETL — tedy bez velkých zásahů do UI. Hlubší korekce (kaskádová logika podle typu závislosti, paprskový graf rolí z činností) jsou P2 a posouvají nástroj od „prohlížeče grafu" k „nástroji pro analýzu rizik", což je jeho deklarovaný účel.

**Vazba na use-case dokumenty (`docs/02_usecases.md`):**

- **UC4 — nejkritičtější systém** (`02:30–32`): původní definice *předepisuje* křížení s bezpečnostní úrovní („kritické a přitom slabě zabezpečené"). Současná implementace ji **nedodržuje** (řadí dle počtu agend). Opravy A1/A2/A5 vracejí UC4 do jeho zamýšlené podoby. Toto je nejviditelnější rozpor mezi designem a implementací a měl by být opraven jako první.
- **UC13 — kaskádové dopady** (`02:66–68`): vlajkový use-case. Jeho definice dnes mluví jen o „1., 2., n-tém řádu" — tj. právě o mechanickém modelu, který Kučera zpochybnil. Doporučuje se **UC13 přeformulovat** tak, aby zahrnoval (a) rozlišení typu závislosti (měkká kopie+notifikace vs. živé připojení), (b) časovou osu dopadu, (c) ROB jako „pilíř" s nejvyšší prioritou. Stávající disclaimer o cloudových závislostech (`app.js:645`, odpovídá „gapu" v `02:68`) rozšířit i opačným směrem (lokální kopie → okamžitý dosah menší).
- **UC6 — karta agendy** (`02:38–40`): definuje „činnosti s odkazy na § eSbírky". To je přesně podklad pro **paprskový graf rolí** (E20), který Lukeš postrádal — propojit činnost → § → role na úrovni vlády.
- **UC2 — toky údajů / only-once** (`02:22–24`): polarita R/W (A4) je jádrem tohoto UC; po opravě bude UC2 konečně zobrazovat směr i úroveň přístupu správně.

Klíčové vodítko pro další iteraci shrnul Lukeš sám: nástroj musí **„pochopit dobře ty logiky"** RPP (ř. 347) a **vždy brát jen poslední platnou verzi** (ř. 331, 1042). A pro prezentaci platí Pejčochovo „udělat to úplně naopak" — nepodávat to jako audit chyb DIA, ale jako nástroj, kterým si DIA udělá pořádek sama.

---

# Příloha A — Připomínky k microsite „krizová připravenost" (jiný produkt)

Druhá polovina schůzky se týkala **samostatné microsite** „krizová připravenost" (statická, JSON-driven; není to RPP Explorer). Pro úplnost a protože některé principy jsou přenositelné:

- **Pojmenování:** ne „krizové řízení", ale „**krizová připravenost**" — řízení evokuje operativní nástroj, kterým web není (Lukeš, ř. 708).
- **„Strašení" bez kontextu:** čísla typu „3,2 % obyvatel má místo v úkrytu", „1,3 dne vydrží státní rezervy potravin" působí poplašně a bez kontextu („pojďme se vyděsit"). Kryty řeší jen ~1 % typů krizí; na únik látky/povodeň/blackout kryt netřeba (Lukeš, ř. 709–721). Návrh: doplnit kontext, tooltipy s metodikou, vyvážit pozitivními ukazateli (Bareš, ř. 734–741).
- **Zastaralá data:** kyberincidenty „268 v roce 2024", ropné rezervy „2021" — brát nejnovější (NÚKIB exportuje měsíc zpátky). Pravidlo „vždy poslední verze" jako u agend (Lukeš, ř. 722–725, 762–765).
- **NKÚ jako zdroj:** Lukeš i Vlasta varují před zaštiťováním se závěry NKÚ — politizuje web, závěry NKÚ bývají „mimo" a skandalizující (ř. 749–753, 796–811). Návrh: NKÚ jen jako jedna indicie s disclaimerem; problémové informace přeformulovat na **otázky/doporučení**, ne obvinění (Vlasta, ř. 812–815).
- **Návodnost vizualizace:** žluté/červené číslo svádí k „musíme stavět víc krytů" (Vlasta, ř. 737–739). Bareš navrhl škálu „splněno 40–80 %, nevíme přesně" + indicie, ať si čtenář udělá závěr sám (ř. 905–915).
- **Chybí Analýza hrozeb ČR:** veřejný dokument s ~22–24 typovými hrozbami, na němž stojí celý systém krizového plánování — měl by být zmíněn (Lukeš, ř. 839–855).
- **Best practices i z ČR:** nejen svět (Norsko, EU 72 h), ale i tuzemské (IZS, operační střediska, Centrum zdraví a bezpečí ve Zlíně) — předbíhají EU o 15 let (Lukeš, ř. 885–891).
- **Akční kroky:** řada „úkolů" (krizové plány, pandemický plán, bezpečnostní výbor) se „vlamuje do otevřených dveří" — věci už dané zákonem (krizový/havarijní plány se aktualizují ze zákona každé 4 roky). Přeformulovat na systémové cíle (komunikační strategie v krizi), ne na konkrétní kroky ministra (Lukeš, ř. 918–921, 955–1005).
- **Srovnání strategií:** největší přidaná hodnota — strojově porovnat obsah českých strategií (bezpečnostní strategie 2023, koncepce ochrany obyvatelstva) s mezinárodními rámci (Sendai, EU/JRC, NIST) a vytáhnout 10 klíčových bodů + úkoly; „to nikdo nedělá" (Lukeš, ř. 1007–1040).
- **Hierarchie pojmů (pro znalostní vrstvu):** strategie → (nad zákony není, jen iniciuje změnu) → zákon → prováděcí předpisy/vyhlášky/nařízení vlády → agenda/činnost → zdroje (commodity, IS) + procesy + zákonný rámec; „tři pilíře: zdroje, procesy, zákonný rámec" (Lukeš, ř. 1062–1100). Toto je užitečná ontologie pro celou znalostní vrstvu PS07.
- **Definovat publikum:** „kdo je zákazníkem těch stránek" — studenti, profesionálové, politici? Od toho se odvíjí hloubka (Lukeš, ř. 1102–1106).

---

*Zdroje: přepis 19. schůzky PS07 (Fireflies ID 01KTD0RH5FVMZBVBRDY5ES8MDC); zdrojový kód aplikace `RPP-Explorer/app/app.js`, `RPP-Explorer/etl/build_client_data.py`; data `app/data/meta.json`, `agendy.json`, `isvs.json`, `opravneni.json`, `names.json`; dokumenty `docs/01_informacni-architektura.md`, `docs/02_usecases.md`. Všechna fakta o aplikaci doložena odkazem `soubor:řádek`; tvrzení neověřitelná z kódu nebo dat jsou označena „k ověření".*

*Počet slov: ~12 460.*
