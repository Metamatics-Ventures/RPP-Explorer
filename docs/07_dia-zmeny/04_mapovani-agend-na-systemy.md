# 04 — Automatické mapování kritických agend na informační systémy

> **Změna 04 — Automatické mapování označených kritických agend na informační systémy** · Priorita P1 · Zdroj: porada DIA 16. 6. 2026 · Vlastník: Jakub Bareš · Stav: návrh

## 1. Účel a manažerské shrnutí

Jakmile věcný správce ve **Změně 03** označí agendu jako kritickou, tato změna **automaticky promítne** kritičnost na infrastrukturu: z RPP vazeb se odvodí, **na kterých informačních systémech (ISVS) daná agenda visí**, a dál přes sdílené služby až po prostředí (cloud / on-premise). Vzniká **obousměrný pohled**:
1. **agenda → systémy** — „na čem kritická agenda závisí",
2. **systém → agendy** — „kolik kritických agend padne, když vypadne tento systém".

Petr Kučera to popsal jako bezprostřední výnos formuláře: *„jenom kdyby se vyplnil tenhle formulář, tak z dat, která máme, to promítneme a řekneme — na tom visí tyhle systémy, nebo ty agendy visí na těchhle systémech."* RPP už vazby `agenda → ISVS` obsahuje, takže jde o **technické srdce nejžádanějšího use case** — propojení expertní kritičnosti s grafem závislostí. Zůstáváme výhradně nad otevřenými daty.

## 2. Obchodní kontext a zdůvodnění (BRD)

**Problém.** Sama kritičnost agendy (Změna 03) je seznam priorit, ale teprve **promítnutí na systémy** dává odpověď na otázku, kterou potřebuje krizové řízení i DIA: *„Když vypadne tento systém / prostředí, kolik kritického státu padne?"* Bez automatického mapování by gestor musel ručně dohledávat, které systémy jeho agendu obsluhují — to nikdo neudělá.

**Řetězec závislosti.** kritická agenda → ISVS (které agendu podporuje) → sdílené služby → cloud / on-prem prostředí. Tento řetězec je už dnes v datech (`isvs.agendy[]`, `pusobnost`, `sluzby.agenda`), jen není napojen na kritičnost.

**Citace ze schůzky (parafráze).** Petr Kučera: výplň formuláře stačí k tomu, aby aplikace „z dat, která máme" ukázala závislé systémy. Bohdan Urban upozornil, že **mapa závislostí je silně závislá na kvalitě byznysové architektury**: u nových projektů je kvalita „aspoň srovnatelná", u starších IS bez modelu ArchiMate je odvození složitější. Z toho plyne požadavek **vizuálně odlišit jistotu vazby** (doložená vs. odvozená/nejistá).

**Hodnota.** (1) Z kritičnosti agend se stane **kritičnost infrastruktury** — obhajitelný, datově podložený výstup. (2) DIA získá argument pro priority obnovy a pro umístění systémů (vazba na bezpečnostní úroveň, Změna 05). (3) Naplňuje se UC13 (kaskádové dopady) z `docs/01_*`.

## 3. Stakeholdeři a role

| Role | Osoba / útvar | Zájem |
|---|---|---|
| Navrhovatel | Petr Kučera (PowerPatterns) | „Promítnout z dat, která máme" |
| Sponzor dat | Bohdan Urban (DIA) | Kvalita byznysové architektury, jistota vazeb |
| Autor / vývojář | Jakub Bareš | ETL odvození řetězce, graf |
| Krizový analytik / gestor | HZS, SSHR, ministerstva | Vidět dopad výpadku systému na agendy |
| Strategie | Jaroslav Pejčoch (AFCEA) | Napojení na mapu závislostí a suverenitu |

## 4. Business požadavky

**Funkční**
- **FR-04-1** Pro každou agendu označenou v `kriticnost_agend.json` zobrazit **seznam ISVS**, které ji podporují (`isvs.agendy[]`).
- **FR-04-2** Rozšířit řetězec na **sdílené služby** a **prostředí** (cloud/on-prem, umístění ISVS).
- **FR-04-3** **Obrácený pohled „systém → kritické agendy"**: u ISVS spočítat počet a seznam *kritických* agend, které na něm visí.
- **FR-04-4** Skóre **„dopad výpadku systému"** = agregace kritičnosti agend, které systém obsluhuje (dle Změny 03).
- **FR-04-5** **Vizuálně odlišit jistotu vazby**: doložená (RPP vazba existuje) vs. odvozená/slabá (nejistý byznys model).
- **FR-04-6** **Propojit s grafem vazeb** (cytoscape) a s dopadovou/kaskádovou analýzou — kritické agendy/systémy zvýraznit.
- **FR-04-7** Filtr „jen kritické" pro obě strany pohledu.

**Nefunkční**
- **NFR-04-1 (výkon)** Mapování nad 12 110 ISVS a 406 agendami se předpočítá v ETL; klient jen čte agregáty.
- **NFR-04-2 (jen otevřená data)** Vazby se odvozují výhradně z RPP; kritičnost je expertní vrstva ze Změny 03. Žádná neveřejná data.
- **NFR-04-3 (přístupnost, čeština)** Popisky řetězce i jistoty vazby česky, srozumitelně.
- **NFR-04-4 (idempotence ETL)** Přepočet mapování je součástí `build_client_data.py`, opakovatelný drop & rebuild.
- **NFR-04-5 (transparentnost)** Každý odvozený vztah musí jít „rozkliknout k důkazu" (která RPP vazba ho podpírá).

## 5. User stories / use cases

- Jako **krizový analytik** chci u kritické agendy hned vidět systémy, na kterých visí, abych věděl, co chránit.
- Jako **DIA** chci u systému vidět, kolik kritických agend padne při jeho výpadku, abych určil prioritu.
- Jako **gestor** chci poznat, zda je vazba doložená, nebo jen odhadnutá, abych jí přiměřeně věřil.
- Jako **analytik suverenity** chci vidět, které kritické agendy běží v zahraničním cloudu, abych upozornil na riziko.
- Jako **autor** chci řetězec předpočítaný v ETL, aby klient zůstal rychlý.

## 6. Datový model a zdroje dat

**Zdroj (RPP):** `isvs.json` (`agendy[]` = ISVS podporuje agendu, `umístění` cloud/on-prem, `bezpečnostní-úroveň`), `sluzby.json` (`agenda`, `poskytovatel`), `pusobnost` (OVM ↔ agenda), `agendy.json`. **Vstup:** `kriticnost_agend.json` (Změna 03).

**Nové struktury (předpočítané ETL):**
```
// u ISVS: agregace kritických agend
isvs[i].kriticke = { pocet, agendy:[A338,...], skore_dopadu, jistota:"dolozena|odvozena" }
// u agendy: řetězec na infrastrukturu
agenda[a].infra = { isvs:[...], sluzby:[...], prostredi:["cloud","on-prem"], jistota }
// meta: žebříček systémů dle dopadu kritických agend
meta.top_kriticke_systemy = [...]
```
**Jistota vazby:** odvozená z přítomnosti/úplnosti vazby v RPP (ISVS s vyplněnou byznys architekturou vs. starší IS bez modelu). **Co chybí:** strojově čitelný model úplnosti byznys architektury — proto jistotu aproximujeme (např. vyplněnost klíčových polí) a označíme jako odhad; přesnost je otázka na DIA.

## 7. Architektura řešení

**Dotčené komponenty:** `etl/build_client_data.py` (předpočet `kriticke`/`infra`/`top_kriticke_systemy`), `app/app.js` (render řetězce, obrácený pohled, integrace do grafu a dopadové analýzy), `app/data/isvs.json` + `meta.json` (rozšíření).

**Datový tok:** `kriticnost_agend.json` (Změna 03, var. a/c) → re-import do ETL → ETL projde RPP vazby a **promítne kritičnost na ISVS/služby/prostředí** → zapíše agregáty do `app/data/*.json` → SPA je čte a vizualizuje. Žádný runtime zápis na straně klienta; mapování je deterministické čtení.

**Integrace:**
- **Graf vazeb (cytoscape):** kritické agendy a jejich nosné systémy zvýraznit; hrany s nízkou jistotou zobrazit přerušovaně.
- **Dopadová/kaskádová analýza:** epicentrem může být systém; výstup „kolik kritických agend padne". Navazuje na typ závislosti (měkká/tvrdá) z `docs/06_*` (F22/F23).

**Sběrový aspekt:** tato změna sama nezapisuje — konzumuje expertní vrstvu ze Změny 03. Tím se drží statická architektura (S3+CloudFront) a celý zápisový tok je soustředěn do jednoho formuláře.

## 8. UI/UX

- **V detailu agendy** (stávající route): nová karta **„Na čem agenda závisí"** — systémy → služby → prostředí, s odznakem jistoty.
- **V detailu ISVS:** nová karta **„Kritické agendy na tomto systému"** + skóre dopadu výpadku.
- **Nová route `#/dopad-systemu`** (nebo rozšíření Analytiky): **žebříček systémů dle dopadu kritických agend** — nahradí věcně chybný žebříček „dle počtu agend" (viz `docs/06_*`, A1).
- **Odznaky jistoty:** „doložená vazba" vs. „odvozeno (k ověření)".
- **Filtr „jen kritické"** a propojení do grafu („Zobrazit v grafu →").
- **CHANGELOG:** `step` „Kritické agendy ↔ systémy" (icon 🔗, route `#/dopad-systemu`, body: „Po vyplnění kritičnosti aplikace sama ukáže, na jakých systémech kritické agendy visí — a kolik kritických agend padne při výpadku systému.").

## 9. Akceptační kritéria

1. Pro agendu označenou jako kritická se v jejím detailu zobrazí seznam nosných ISVS odvozený z `isvs.agendy[]`.
2. Řetězec pokračuje na služby a prostředí (cloud/on-prem) z RPP polí.
3. V detailu ISVS se zobrazí počet a seznam kritických agend + skóre dopadu.
4. Žebříček `#/dopad-systemu` řadí systémy podle dopadu kritických agend, ne podle počtu agend.
5. Vazby s nízkou jistotou jsou vizuálně odlišené (přerušovaná hrana / odznak „k ověření").
6. Kritické prvky se zvýrazní v grafu vazeb a fungují jako epicentrum dopadové analýzy.
7. Vše předpočítáno v ETL; `build_client_data.py` je idempotentní; `meta.json` obsahuje nové agregáty.
8. `node --check app/app.js` projde; CHANGELOG aktualizován.

## 10. Rizika, závislosti a otevřené otázky

- **Závislost na Změně 03** — bez vyplněné kritičnosti je mapování prázdné (lze ukázat na demo agendě, např. A338).
- **Kvalita byznys architektury** (Urban) — u starších IS bez ArchiMate je řetězec neúplný; řešíme odznakem jistoty, ne tichým dopočtem.
- **Účelové vyklikání agend** (viz `docs/06_*`, A2) — ISVS obcí mají „všech 406 agend"; mapování musí preferovat *kritické* agendy a nosné systémy, ne počet.
- **Otázka na DIA:** Existuje strojově čitelný ukazatel úplnosti/kvality byznys architektury ISVS, ze kterého lze jistotu vazby odvodit přesněji?
- **Otázka na DIA:** Je u sdílených služeb a prostředí (cloud) vazba v open datech dostatečně úplná pro celý řetězec?

## 11. Fázování a hrubý odhad

- **MVP do pátku:** směr **agenda → systémy** v detailu agendy + obrácený počet kritických agend u ISVS, na demo datech ze Změny 03. Odhad 0,5–1 den (vazby už v datech jsou).
- **Fáze 2:** žebříček `#/dopad-systemu`, skóre dopadu, odznaky jistoty, zvýraznění v grafu. 1 den.
- **Fáze 3:** plný řetězec na služby+prostředí, napojení na kaskádovou analýzu (typ závislosti), aproximace jistoty z úplnosti byznys architektury. 1–2 dny.
