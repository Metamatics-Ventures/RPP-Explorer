# 18 — Use case „stát, který se nedá vypnout"

> **Změna 18 — Use case „stát, který se nedá vypnout": kritické agendy v offline/krizovém režimu** · Priorita P2 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Nejambicióznější a „společensky nejžádanější" use case nástroje: identifikovat **agendy, které stát musí mít v provozu vždycky** — i v režimu válečném, krizovém, při pandemii nebo při výpadku internetu — a které je proto třeba podporovat přes **pevnou, end-to-end propojovací komunikační síť dosažitelnou i offline / při bezdrátovém výpadku**. Změna rozšiřuje **formulář kritických agend (Změna 03)** o **dimenzi odolnosti / nepřetržitosti** a doplňuje ji **rychlou rešerší z RPP**, která označí kandidáty podle prerekvizit (které agendy/systémy mají vlastnosti nezbytné pro nepřetržitý provoz).

Bohdan Urban tento use case zarámoval programem **Byvoj** — identifikace kritických agend podporovaných v území přes pevnou síť, dosažitelných i bez internetu. Ilustroval ho protikladem: *řidičák v krizi počká, ale cizinecký informační systém musí být dostupný do poslední chvíle.* Označil to za „štábní úlohu, kterou nikdo nebyl schopen udělat" a na které si „vylámal zuby". Jaroslav Pejčoch ji napojil na **program Digitální suverenity AFCEA** a heslo *„budujeme stát, který se nedá vypnout"* a na společný operační obraz fungující offline (varování obyvatelstva). Urban přislíbil, že v pátek věnuje klidně **dvě hodiny prerekvizitám a hodnoticím kritériím** a že „budete slavní na programu Byvoj".

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Krizová připravenost dnes nemá **datově podložený seznam agend, které musí běžet i v odpojeném státě.** Selekce „co stát musí mít vždy" se dělala intuitivně, štábně, bez nástroje. Přitom právě tato množina určuje, kam směřovat investice do odolné komunikační infrastruktury a co musí fungovat v offline operačním obrazu.

**Citace ze schůzky (parafráze).** Bohdan Urban (program Byvoj): identifikovat kritické agendy v území dosažitelné přes pevnou end-to-end síť i při výpadku internetu; množina agend, které „stát musí mít v provozu vždycky — i v režimu válečném, krizovém, covidu, čehokoliv"; ilustrace řidičák vs. cizinecký systém; „tuto štábní úlohu nikdo nebyl schopen udělat". Jaroslav Pejčoch: AFCEA program Digitální suverenity, „stát, který se nedá vypnout", vazba na společný operační obraz a varování obyvatelstva offline.

**Hodnota.** (1) Propojuje **civilní digitalizaci s obranou** — přímý vstup do programu Byvoj a do digitální suverenity. (2) Dává krizovému řízení **prioritizovaný seznam** agend pro nepřetržitý provoz a pro offline operační obraz. (3) Z RPP rešerše vznikne **první kandidátní seznam**, který experti jen potvrdí — ne vytvoří od nuly.

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Sponzor use case | Bohdan Urban (DIA, program Byvoj) | Seznam vždy-dostupných agend, prerekvizity |
| Strategie / obrana | Jaroslav Pejčoch (AFCEA, Digitální suverenita) | „Stát, který se nedá vypnout", offline operační obraz |
| Autor / vývojář | Jakub Bareš | RPP rešerše kandidátů, dimenze odolnosti |
| Věcný expert (krizové řízení) | HZS / správci kritických agend | Potvrdit nepřetržitost, prerekvizity |
| Vyplňovatel | Správce agendy | Označit režim provozu |

## 4. Business požadavky

**Funkční**
- **FR-18-1** Rozšířit formulář (Změna 03) o **dimenzi odolnosti / nepřetržitosti**: zda agenda musí běžet i offline / v krizi (např. „vždy" / „do poslední chvíle" / „smí počkat").
- **FR-18-2** Zachytit **kanál dosažitelnosti** (vyžaduje pevnou end-to-end síť / smí přes veřejný internet / lokální provoz stačí).
- **FR-18-3** **Rychlá RPP rešerše kandidátů** — automaticky předoznačit agendy splňující prerekvizity (živé připojení do registrů, bezpečnostní úroveň, kategorie OVM bezpečnostního/krizového charakteru).
- **FR-18-4** Definovat a vyhodnotit **prerekvizity nepřetržitosti** (např. nezávislost na komerčním cloudu, vazba na základní registry, role IZS/policie).
- **FR-18-5** Generovat **pohled „stát, který se nedá vypnout"** — seznam/mapa agend nutných v offline/krizovém režimu, s mírou jistoty.
- **FR-18-6** Propojit s **dopadovou/kaskádovou analýzou** a s typem závislosti (živé připojení vs. lokální kopie — viz `docs/06_*`, F22/F23).

**Nefunkční**
- **NFR-18-1 (jen otevřená data)** Kandidáti se odvozují z RPP open dat; režim provozu je expertní vstup. Žádná utajovaná data — citlivé úvahy o obraně zůstávají mimo nástroj.
- **NFR-18-2 (čeština, srozumitelnost)** Jazyk krizového řízení, srozumitelný štábu.
- **NFR-18-3 (přístupnost)** Pohled čitelný i bez grafu (seznamová alternativa).
- **NFR-18-4 (idempotence ETL)** Rešerše kandidátů i agregace deterministické a opakovatelné.
- **NFR-18-5 (výkon)** Předvýběr kandidátů předpočítán v ETL.

## 5. User stories / use cases

- Jako **Bohdan Urban (Byvoj)** chci seznam agend, které musí běžet i offline, abych věděl, kam vést odolnou síť.
- Jako **krizový štáb** chci vidět agendy „do poslední chvíle" (cizinecký systém) odděleně od těch, které počkají (řidičák).
- Jako **expert** chci, aby mi RPP rešerše předoznačila kandidáty, abych je jen potvrdil, ne hledal od nuly.
- Jako **analytik suverenity** chci vidět, které vždy-dostupné agendy závisí na komerčním cloudu, abych označil riziko.
- Jako **autor** chci dimenzi odolnosti ve stejném formuláři, aby ji správce vyplnil zároveň s kritičností.

## 6. Datový model a zdroje dat

**Zdroj RPP:** `isvs.json` (`umístění` cloud/on-prem, `bezpečnostní-úroveň`), `opravneni.json` (živé čtení z registrů — typ závislosti), `agendy.json`, `ovm.json` + kategorie (IZS, policie, bezpečnostní složky), `pusobnost`. **Vstup:** sdílená sada `kriticnost_agend.json` (Změny 03/05).

**Rozšíření sbírané sady:**
```
"A338": {
  ...,
  "rezim_provozu": "vzdy | do_posledni_chvile | smi_pockat",
  "kanal_dosazitelnosti": "pevna_sit | verejny_internet | lokalne",
  "prerekvizity_splneno": ["zive_pripojeni_registry","nezavislost_cloud", ...],
  "kandidat_byvoj": true|false,   // z RPP rešerše
  "jistota": "dolozena|odvozena"
}
```
**Prerekvizity (odvozené z RPP):** živé připojení do ROB/ROS (z oprávnění R do registrů), bezpečnostní úroveň (Změna 05), kategorie OVM (IZS/policie/krize), umístění mimo komerční cloud. **Co chybí:** RPP nezná „provoz v krizi" ani topologii pevné sítě — doplňujeme expertním vstupem a explicitním disclaimerem o hranicích RPP.

## 7. Architektura řešení

**Dotčené komponenty:** `etl/build_client_data.py` (rešerše kandidátů Byvoj, vyhodnocení prerekvizit, agregát do `meta.json`), `app/app.js` (dimenze odolnosti ve formuláři, pohled „stát, který se nedá vypnout", integrace do kaskády), `app/data/kriticnost_agend.json` + `meta.json` (rozšíření).

**Datový tok:** RPP → ETL **předoznačí kandidáty** dle prerekvizit → SPA zobrazí dimenzi odolnosti ve formuláři → expert potvrdí/upraví režim → sběr (stejný mechanismus jako Změna 03, **doporučená varianta a** = localStorage + export JSON, doplněná var. c pro hromadný sběr) → re-import do ETL → pohled „stát, který se nedá vypnout".

**Sběrový/zápisový mechanismus:** žádný nový kanál — dimenze odolnosti je další pole téhož formuláře (Změna 03). Zápis zůstává soustředěn do jednoho místa, architektura zůstává statická (S3+CloudFront). Pro páteční dvouhodinovku s Urbanem postačí varianta a (rychlé vyplnění a export).

**Integrace:** napojení na **kaskádovou analýzu** (živé připojení = tvrdá závislost) a na **CROP / offline operační obraz** (vstup pro varování obyvatelstva).

## 8. UI/UX

- **Ve formuláři kritičnosti** (route `#/kriticnost`): u agendy přepínač **„režim provozu v krizi"** (vždy / do poslední chvíle / smí počkat) a **kanál dosažitelnosti**; u předoznačených kandidátů odznak **„kandidát Byvoj (z RPP)"**.
- **Nová route `#/nevypnutelny-stat`** — pohled „stát, který se nedá vypnout": seznam/mapa vždy-dostupných agend, prerekvizity, míra jistoty, filtr „závisí na komerčním cloudu".
- **Nápověda** s ilustrací (řidičák vs. cizinecký systém) a s disclaimerem o hranicích RPP.
- **Propojení do grafu** a do kaskádové analýzy (živé připojení zvýrazněno).
- **CHANGELOG:** `step` „Stát, který se nedá vypnout" (icon 🛡️, route `#/nevypnutelny-stat`, body: „Nový pohled na agendy, které musí běžet i offline a v krizi — aplikace z RPP předoznačí kandidáty a experti je potvrdí. Vstup pro program Byvoj a digitální suverenitu.").

## 9. Akceptační kritéria

1. Formulář umožní u agendy nastavit režim provozu v krizi a kanál dosažitelnosti.
2. ETL předoznačí kandidáty Byvoj podle prerekvizit z RPP; každý kandidát má míru jistoty.
3. Route `#/nevypnutelny-stat` zobrazí seznam/mapu vždy-dostupných agend s prerekvizitami.
4. Filtr „závisí na komerčním cloudu" / „mimo cloud" funguje.
5. Pohled je propojen s kaskádovou analýzou a rozlišuje živé připojení vs. lokální kopii.
6. Disclaimer o hranicích RPP je zobrazen; nástroj nepracuje s utajovanými daty.
7. Sběr probíhá v jednom formuláři; re-import idempotentní; `meta.json` nese agregát kandidátů.
8. `node --check app/app.js` projde; CHANGELOG aktualizován.

## 10. Rizika, závislosti a otevřené otázky

- **Ambicióznost vs. termín** — na pátek stačí dimenze odolnosti ve formuláři + hrubý kandidátní seznam z RPP; plný pohled je fáze 2 (Urban přislíbil 2 h na prerekvizity a kritéria).
- **Hranice RPP** — RPP nezná krizový provoz ani topologii sítě; nutný expertní vstup a disclaimer (viz `docs/06_*`, E19/E21).
- **Citlivost obrany** — udržet vše na otevřených datech; neutajované úrovni.
- **Závislost na Změnách 03 (formulář), 05 (úroveň/prerekvizity), 04 (řetězec na prostředí).**
- **Otázka na DIA/Byvoj:** Jaké jsou závazné prerekvizity nepřetržitosti a kritéria pro „vždy-dostupnou" agendu? Existuje seznam systémů na pevné end-to-end síti?
- **Otázka na DIA:** Lze výstup použít jako oficiální vstup programu Byvoj?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** dimenze odolnosti ve formuláři + RPP předvýběr kandidátů (živé připojení do registrů, bezpečnostní úroveň, kategorie IZS) + jednoduchý seznam. Odhad 1 den; v pátek 2 h s Urbanem na doladění prerekvizit a kritérií.
- **Fáze 2:** route `#/nevypnutelny-stat` jako plný pohled, filtr cloud, míra jistoty, propojení s kaskádou. 1–2 dny.
- **Fáze 3:** napojení na CROP / offline operační obraz a varování obyvatelstva; sladění s programem Byvoj a digitální suverenitou. Dle dohody s DIA/AFCEA.
