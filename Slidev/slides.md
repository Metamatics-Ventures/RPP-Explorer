---
theme: default
background: '#060810'
colorSchema: dark
title: 'RPP Explorer — jak jsme z otevřených dat udělali nástroj, kterému experti věří'
info: |
  Mapa státu / RPP Explorer · iterace nad otevřenými daty RPP · AFCEA PS07 kGovernment · Jakub Bareš · 16. 6. 2026
class: text-white
highlighter: shiki
drawings:
  enabled: false
  persist: false
transition: slide-left
mdc: true
fonts:
  sans: 'Inter'
  mono: 'Fira Code'
download: true
exportFilename: rpp-explorer-iterace
---

<!-- ===================== SLIDE 1 — COVER ===================== -->

<div class="absolute inset-0 bg-gradient-to-br from-[#060810] via-[#0a0d1a] to-[#100820]"></div>

<div class="relative z-10 flex flex-col justify-center h-full px-16">

<div class="text-xs font-mono tracking-widest text-blue-400 uppercase mb-6 opacity-70">AFCEA · PS07 kGovernment · 16. 6. 2026</div>

<h1 class="text-6xl font-black leading-tight mb-4 text-white">
  Mapa státu<br/>
  <span class="bg-gradient-to-r from-blue-400 via-purple-300 to-violet-400 bg-clip-text text-transparent">RPP Explorer</span>
</h1>

<div class="text-xl text-gray-300 font-light mb-6 max-w-3xl">
  Jak jsme z otevřených dat Registru práv a povinností udělali nástroj,<br/>
  kterému rozumí lidé, kteří RPP znají zevnitř — v <span class="text-white font-semibold">6 verzích za 10 dní</span>.
</div>

<div class="flex items-center gap-3 text-sm text-gray-400">
  <span class="font-semibold text-white">Jakub Bareš</span>
  <span class="text-gray-600">·</span>
  <span>Metamatics Ventures</span>
  <span class="text-gray-600">·</span>
  <span>mapastatu.cz</span>
</div>

</div>

<div class="absolute bottom-8 right-10 text-xs font-mono text-gray-600 opacity-40">příběh jedné iterace nad daty státu</div>

<!--
Tohle není demo nástroje. Je to příběh o metodě: jak se dá nad otevřenými daty státu pracovat tak,
že výsledku věří odborníci. Nasadit → nechat experty rozbít → opravit → znovu. Šestkrát.
-->

---

<!-- ===================== SLIDE 2 — CO JE RPP ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="tag tag-blue mb-4">Registr práv a povinností · správce DIA</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">RPP je <span class="text-blue-400">páteř</span> českého eGovernmentu</h2>

<div class="text-gray-300 text-base italic mb-6">Kdo smí dělat co, s jakými daty, jakým systémem — pro celý stát na jednom místě. Jen se v tom skoro nikdo nevyzná.</div>

<div class="grid grid-cols-5 gap-3 mb-6">
  <div class="card text-center"><div class="stat-mid">406</div><div class="text-gray-400 text-xs mt-2">agend</div></div>
  <div class="card text-center"><div class="stat-mid" style="white-space:nowrap">12&nbsp;110</div><div class="text-gray-400 text-xs mt-2">systémů (ISVS)</div></div>
  <div class="card text-center"><div class="stat-mid" style="white-space:nowrap">18&nbsp;263</div><div class="text-gray-400 text-xs mt-2">orgánů (OVM)</div></div>
  <div class="card text-center"><div class="stat-mid" style="white-space:nowrap">9&nbsp;607</div><div class="text-gray-400 text-xs mt-2">služeb</div></div>
  <div class="card text-center"><div class="stat-mid" style="white-space:nowrap;font-size:1.9rem">910&nbsp;668</div><div class="text-gray-400 text-xs mt-2">vazeb působnosti</div></div>
</div>

<div class="highlight-box">
  <div class="text-center text-base text-gray-200">Šest typů entit, statisíce vazeb, denní aktualizace — a žádný způsob, jak to celé <span class="text-white font-semibold">uvidět najednou</span>.</div>
</div>

</div>

<!--
RPP je veřejné open-data od DIA. Obsahuje agendy, informační systémy, orgány, služby, údaje a oprávnění mezi nimi.
Je to obrovský propojený graf — ale dodává se jako desítky JSON souborů. Nedá se v tom „chodit".
-->

---

<!-- ===================== SLIDE 3 — PROČ EXPLORER ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="tag tag-purple mb-4">Proč to děláme · zadání z PS07</div>

<h2 class="text-4xl font-black text-white mb-6 leading-tight">První hmatatelný krok <span class="text-purple-400">znalostní vrstvy</span></h2>

<div class="grid grid-cols-3 gap-4">

<div class="card border-purple-900/40">
  <div class="text-purple-400 font-mono text-xs uppercase tracking-widest mb-2">Vidět stát jako systém</div>
  <div class="text-gray-300 text-sm">Strategie → zákony → agendy → činnost → systém → zdroj. RPP je vrstva „kdo dělá co a čím".</div>
</div>

<div class="card border-blue-900/40">
  <div class="text-blue-400 font-mono text-xs uppercase tracking-widest mb-2">Analýza rizik pro DIA</div>
  <div class="text-gray-300 text-sm">Ne audit chyb, ale nástroj, který ukáže rizika a kaskádové dopady výpadku agendy či systému.</div>
</div>

<div class="card border-teal-900/40">
  <div class="text-teal-400 font-mono text-xs uppercase tracking-widest mb-2">Domeček z karet</div>
  <div class="text-gray-300 text-sm">Co se stane, když vypadne základní registr? Které systémy „padají hned" a které vydrží dny?</div>
</div>

</div>

<div class="text-gray-500 text-sm mt-6 italic">
  Přímý původ: 17. schůzka — „dynamická vizualizace propojení systémů nad RPP" · 18. schůzka — „prozkoumat RPP open data, agregovat znalostní bázi".
</div>

</div>

<!--
Explorer není samoúčelný. Je to první konkrétní realizace vize znalostní vrstvy z PS07 a zároveň
podklad pro téma kaskádových dopadů (mentor DIA). Cíl: nástroj analýzy rizik, ne vytýkací audit.
-->

---
layout: center
---

<!-- ===================== SLIDE 4 — SECTION DIVIDER: SMYČKA ===================== -->

<div class="text-center">

<div class="text-xs font-mono tracking-widest text-teal-400 uppercase mb-8 opacity-70">jak jsme pracovali</div>

<h1 class="text-7xl font-black leading-tight text-white">
  Nasadit. Nechat<br/>
  <span class="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">experty rozbít.</span><br/>
  Opravit. Znovu.
</h1>

<div class="mt-10 text-base text-gray-500 font-mono tracking-wide">
  ne vodopád · ne specifikace dopředu · živá konfrontace s realitou
</div>

</div>

<!--
Tohle je jádro celé prezentace. Neudělali jsme dokonalý nástroj a pak ho ukázali. Udělali jsme funkční
nástroj, dali ho lidem, kteří RPP znají zevnitř, a nechali ho rozbít. Každá připomínka = další verze.
-->

---

<!-- ===================== SLIDE 5 — METODA ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="tag tag-teal mb-4">Metoda · iterace řízená oponenturou</div>

<h2 class="text-4xl font-black text-white mb-8">Smyčka kvality ve čtyřech krocích</h2>

<div class="grid grid-cols-1 gap-2 max-w-4xl">

<div class="card flex items-start gap-4">
  <div class="text-2xl font-black text-blue-400 font-mono w-10 flex-shrink-0">01</div>
  <div><div class="text-white font-semibold text-base">Nasadit funkční nástroj</div><div class="text-gray-400 text-xs mt-1">Žádný PowerPoint koncept — živá aplikace nad reálnými daty, kterou si lze hned proklikat.</div></div>
</div>

<div class="card flex items-start gap-4">
  <div class="text-2xl font-black text-purple-400 font-mono w-10 flex-shrink-0">02</div>
  <div><div class="text-white font-semibold text-base">Konfrontovat s expertem</div><div class="text-gray-400 text-xs mt-1">Lidé, kteří RPP znají zevnitř, hledají, kde nástroj „nerozumí logikám" registru.</div></div>
</div>

<div class="card flex items-start gap-4">
  <div class="text-2xl font-black text-teal-400 font-mono w-10 flex-shrink-0">03</div>
  <div><div class="text-white font-semibold text-base">Opravit u zdroje</div><div class="text-gray-400 text-xs mt-1">Připomínka → konkrétní zásah do ETL nebo UI → záznam do changelogu a do plánu oprav.</div></div>
</div>

<div class="card flex items-start gap-4">
  <div class="text-2xl font-black text-green-400 font-mono w-10 flex-shrink-0">04</div>
  <div><div class="text-white font-semibold text-base">Znovu nasadit a ukázat</div><div class="text-gray-400 text-xs mt-1">Vestavěný „průvodce novinkami" ukáže recenzentovi přesně, co se podle jeho připomínky změnilo.</div></div>
</div>

</div>

<div class="highlight-box mt-5">
  <div class="text-center text-base text-white">6 verzí za 10 dní — každá verze je odpověď na konkrétní oponenturu.</div>
</div>

</div>

<!--
Klíč: rychlost smyčky. Recenzent neměl pocit, že mluví do zdi — připomínku viděl příště nasazenou,
i s vysvětlením v aplikaci. To buduje důvěru rychleji než jakýkoli dokument.
-->

---

<!-- ===================== SLIDE 6 — RECENZENTI ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="tag tag-green mb-4">Kdo nástroj prověřoval</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">Věcná oponentura, ne uživatelské testování</h2>

<div class="text-gray-300 text-base italic mb-6">Lidé, kteří RPP buď spravují, nebo do něj zevnitř dodávali systémy, nebo podle něj rozhodují.</div>

<div class="grid grid-cols-2 gap-4">

<div class="card border-green-900/40">
  <div class="text-green-400 font-mono text-xs uppercase tracking-widest mb-2">Mirek Lukeš</div>
  <div class="text-white font-semibold text-sm mb-1">Krizové řízení · ISKŘ / HZS</div>
  <div class="text-gray-400 text-xs">Vede revizi věrnosti datům — měkká vs. tvrdá závislost, kaskády, ROB jako pilíř.</div>
</div>

<div class="card border-blue-900/40">
  <div class="text-blue-400 font-mono text-xs uppercase tracking-widest mb-2">Petr Kučera</div>
  <div class="text-white font-semibold text-sm mb-1">RPP zevnitř · návrh a dodávky IS</div>
  <div class="text-gray-400 text-xs">13 věcných připomínek — od polarity čte/zapisuje po reálná vs. vymyšlená data.</div>
</div>

<div class="card border-purple-900/40">
  <div class="text-purple-400 font-mono text-xs uppercase tracking-widest mb-2">Martin Vlasta</div>
  <div class="text-white font-semibold text-sm mb-1">Správní právo</div>
  <div class="text-gray-400 text-xs">Kdo vlastně přistupuje do RPP — SPUÚ, notáři, exekutoři; sesouhlasení počtů.</div>
</div>

<div class="card border-teal-900/40">
  <div class="text-teal-400 font-mono text-xs uppercase tracking-widest mb-2">DIA — Šedivec, Urban</div>
  <div class="text-white font-semibold text-sm mb-1">Správce registru</div>
  <div class="text-gray-400 text-xs">Oficiální čísla (agendy, IS, OVM) a metodika — proti čemu se srovnáváme.</div>
</div>

</div>

</div>

<!--
Cílová skupina recenze byla schválně tvrdá. Když nástroj přesvědčí Kučeru (dělal RPP zevnitř) a Lukeše
(krizové řízení), je připravený i pro DIA. Recenze proběhla živě nad sdílenou obrazovkou + písemně.
-->

---

<!-- ===================== SLIDE 7 — TIMELINE ===================== -->

<div class="h-full flex flex-col justify-center px-10">

<div class="tag tag-blue mb-4">Spirála verzí · 6.–16. 6. 2026</div>

<h2 class="text-3xl font-black text-white mb-6">Šest verzí, každá odpovědí na zpětnou vazbu</h2>

<div class="grid grid-cols-1 gap-1.5 text-sm">

<div class="card flex items-center gap-4 py-2"><div class="font-mono text-blue-400 font-bold w-12">v1.0</div><div class="text-white font-semibold w-64">Základ — Mapa státu</div><div class="text-gray-400 text-xs">dashboard, entity, graf vazeb, dopady & kaskády, analytika</div></div>

<div class="card flex items-center gap-4 py-2"><div class="font-mono text-purple-400 font-bold w-12">v2.0</div><div class="text-white font-semibold w-64">Databáze &amp; SQL</div><div class="text-gray-400 text-xs">kontrola kvality, fill-rate, referenční integrita, SQL nad RPP v prohlížeči</div></div>

<div class="card flex items-center gap-4 py-2 border-teal-900/40"><div class="font-mono text-teal-400 font-bold w-12">v3.0</div><div class="text-white font-semibold w-64">Revize 19. schůzky</div><div class="text-gray-400 text-xs">Lukeš + Kučera + Vlasta — polarita R/W, kritičnost dle dopadu, rodiny produktů, BESP</div></div>

<div class="card flex items-center gap-4 py-2"><div class="font-mono text-orange-400 font-bold w-12">v4.0</div><div class="text-white font-semibold w-64">Znalostní vrstva</div><div class="text-gray-400 text-xs">trojúhelník činnost × hráči × hřiště, CROP — co aktér potřebuje k rozhodnutí</div></div>

<div class="card flex items-center gap-4 py-2"><div class="font-mono text-green-400 font-bold w-12">v5.0</div><div class="text-white font-semibold w-64">Sesouhlasení čísel s DIA</div><div class="text-gray-400 text-xs">„tady nám to nesedí" → každý rozdíl vysvětlen záznam po záznamu</div></div>

<div class="card flex items-center gap-4 py-2 border-red-900/40"><div class="font-mono text-red-400 font-bold w-12">v6.0</div><div class="text-white font-semibold w-64">Druhé kolo revize</div><div class="text-gray-400 text-xs">opravený směr dopadů, registr × ISZR, detaily služeb, nové filtry</div></div>

<div class="card flex items-center gap-4 py-2 border-purple-900/40"><div class="font-mono text-purple-300 font-bold w-12">v6.1</div><div class="text-white font-semibold w-64">Reálná × odvozená × chybějící data</div><div class="text-gray-400 text-xs">pryč se smyšlenými hodnotami; jasné označení původu každé hodnoty</div></div>

</div>

</div>

<!--
Tahle jediná obrazovka je celý příběh. Všimněte si rytmu: technický základ (v1–v2), pak nárazy expertní
recenze (v3, v6) a sesouhlasení s autoritou (v5). Verze nejsou „features" — jsou to odpovědi.
-->

---
layout: center
---

<!-- ===================== SLIDE 8 — SECTION DIVIDER: CO JSME SE NAUČILI ===================== -->

<div class="text-center">

<div class="text-xs font-mono tracking-widest text-orange-400 uppercase mb-8 opacity-70">pět lekcí o kvalitě dat</div>

<h1 class="text-6xl font-black leading-tight text-white">
  Co recenze<br/>
  <span style="color:#fb923c;">odhalila</span>
</h1>

<div class="mt-10 text-base text-gray-500 font-mono tracking-wide">
  rozsah ≠ kritičnost · směr závislosti · jeden systém, mnoho jmen · sesouhlasení · původ hodnoty
</div>

</div>

<!--
Teď konkrétně. Pět nejhlubších věcí, které by nás samotné nenapadly — protože nejsme uvnitř RPP.
Každá je obecná lekce o tom, jak (ne)pracovat s daty veřejné správy.
-->

---

<!-- ===================== SLIDE 9 — KRITIČNOST ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="flex items-center gap-3 mb-4">
  <span class="cat-num text-orange-400">LEKCE 01</span>
  <span class="tag tag-orange">rozsah ≠ kritičnost</span>
</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">Nejdůležitější systém státu <span class="text-orange-400">není ten s nejvíc agendami</span></h2>

<div class="grid grid-cols-2 gap-4 mb-4 mt-2">

<div class="card border-red-900/40">
  <div class="text-red-400 font-mono text-xs uppercase tracking-widest mb-2">Dřív</div>
  <div class="text-gray-300 text-sm">Žebříček „nejkritičtějších" vedla spisová služba malé obce — protože měla nejvíc navázaných agend (důsledek hromadného vyklikávání).</div>
</div>

<div class="card border-green-900/40">
  <div class="text-green-400 font-mono text-xs uppercase tracking-widest mb-2">Teď</div>
  <div class="text-gray-200 text-sm">Kritičnost se počítá z <span class="text-white font-semibold">dopadu</span>: základní registr → bezpečnostní úroveň → ústřednost správce. Nahoře jsou ROB, ROS, datové schránky, Czech POINT.</div>
</div>

</div>

<div class="highlight-box">
  <div class="text-center text-base text-gray-200">Počet vazeb je <span class="text-white font-semibold">rozsah působnosti</span>, ne důležitost. Snadno se zamění — a celý žebříček je pak vzhůru nohama.</div>
</div>

</div>

<!--
A1/A2 od Kučery a Lukeše. Naivní metrika „počet navázaných agend" vypadá objektivně, ale měří úplně
něco jiného než kritičnost. Přepsali jsme skóre v ETL na dopadové kritérium.
-->

---

<!-- ===================== SLIDE 10 — SMĚR ZÁVISLOSTI ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="flex items-center gap-3 mb-4">
  <span class="cat-num text-red-400">LEKCE 02</span>
  <span class="tag tag-red">měli jsme to obráceně</span>
</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">Výpadek registru <span class="text-red-400">nezkosí</span> půlku státu</h2>

<div class="grid grid-cols-2 gap-4 mb-4 mt-2">

<div class="card border-red-900/40">
  <div class="text-red-400 font-mono text-xs uppercase tracking-widest mb-2">Dřív (špatně)</div>
  <div class="text-gray-300 text-sm">Výpadek základního registru jsme promítali jako pád všech navázaných systémů — kaskáda se šířila po všech hranách grafu.</div>
</div>

<div class="card border-green-900/40">
  <div class="text-green-400 font-mono text-xs uppercase tracking-widest mb-2">Teď (jak to funguje)</div>
  <div class="text-gray-200 text-sm">Většina úřadů drží <span class="text-white font-semibold">lokální kopii</span> kmene a běží dál — jen neověří nově příchozího. Okamžitě padají jen <span class="text-white font-semibold">živě připojené</span>: policie, soudy, IZS.</div>
</div>

</div>

<div class="highlight-box">
  <div class="text-xs font-mono tracking-widest text-red-300 uppercase mb-2">Klíčové zjištění</div>
  <div class="text-gray-200 text-sm">Měli jsme přehozený <span class="text-white font-semibold">směr závislosti</span> (čte vs. zapisuje) a editor registru kaskádu vůbec nešíří. Kaskádu nelze počítat jen z hran grafu — to byla nejnebezpečnější chyba ze všech.</div>
</div>

</div>

<!--
A3/A4/F22 — Kučera a Lukeš. Nejcennější připomínka: polaritu R/W jsme měli obráceně a model kaskády byl
mechanický. Realita: měkká závislost (lokální kopie + notifikace, odolná dny) vs. tvrdá/živá (okamžitý pád).
-->

---

<!-- ===================== SLIDE 11 — RODINY PRODUKTŮ ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="flex items-center gap-3 mb-4">
  <span class="cat-num text-blue-400">LEKCE 03</span>
  <span class="tag tag-blue">jeden systém, mnoho jmen</span>
</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">„KEO", „KEO 4", „KEO X Hosting" — <span class="text-blue-400">jeden produkt</span></h2>

<div class="text-gray-300 text-base italic mb-6">Tentýž software je v RPP zapsaný pod desítkami názvů. Bez sjednocení nevidíte skutečné rozšíření.</div>

<div class="grid grid-cols-3 gap-4">

<div class="card border-blue-900/40">
  <div class="text-blue-400 font-mono text-xs uppercase tracking-widest mb-2">Číselníková vrstva</div>
  <div class="text-gray-300 text-sm">Odvozené pole „rodina produktu" sjednotí varianty názvů — <span class="text-white font-semibold">bez přepisu zdroje</span>.</div>
</div>

<div class="card border-teal-900/40">
  <div class="text-teal-400 font-mono text-xs uppercase tracking-widest mb-2">Reálné rozšíření</div>
  <div class="text-gray-300 text-sm">KEO běží na <span class="text-white font-semibold">3 625</span> instalacích, Munis 1 234, GINIS/GORDIC stovky.</div>
</div>

<div class="card border-orange-900/40">
  <div class="text-orange-400 font-mono text-xs uppercase tracking-widest mb-2">Riziko koncentrace</div>
  <div class="text-gray-300 text-sm">Cloudová varianta jednoho produktu = jeden bod selhání pro tisíce úřadů.</div>
</div>

</div>

<div class="text-gray-500 text-sm mt-6 italic">
  Správný typ řešení (Vlasta/Kučera): mapovací vrstva nad názvy, ne přepisování dat. Zdroj zůstává nedotčený.
</div>

</div>

<!--
C14. Petr poznal „svůj" ALIS/KEO hned, jak se varianty sjednotily. Pointa metody: kvalitu dat zvyšujeme
NAD zdrojem (odvozená vrstva), nikdy ne přepsáním zdroje — jinak ztratíme auditovatelnost.
-->

---

<!-- ===================== SLIDE 12 — SESOUHLASENÍ S DIA ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="flex items-center gap-3 mb-4">
  <span class="cat-num text-teal-400">LEKCE 04</span>
  <span class="tag tag-teal">„tady nám to nesedí"</span>
</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">Důvěra se buduje <span class="text-teal-400">sesouhlasením</span>, ne tvrzením</h2>

<div class="grid grid-cols-3 gap-3 mb-5 mt-2">
  <div class="card text-center"><div class="stat-mid">18 263</div><div class="text-gray-400 text-xs mt-2">OVM — jen <b>aktivní</b><br/>(zaniklé se nepočítají)</div></div>
  <div class="card text-center"><div class="stat-mid">3 421</div><div class="text-gray-400 text-xs mt-2"><b>agendové</b> IS<br/>(ne celý registr 12 110)</div></div>
  <div class="card text-center"><div class="stat-mid">406</div><div class="text-gray-400 text-xs mt-2">agend — živá data<br/>(DIA k 20. 5.: 405)</div></div>
</div>

<div class="highlight-box">
  <div class="text-center text-base text-gray-200">Žádný rozdíl proti číslům DIA <span class="text-white font-semibold">není chyba</span> — jde buď o datum snapshotu, nebo o definici počítané množiny. Každý rozdíl je v aplikaci vysvětlený a ověřitelný.</div>
</div>

</div>

<!--
v5.0, reakce na Martina Vlastu a čísla T. Šedivce. Prošli jsme zdroj záznam po záznamu. Místo obhajoby
„naše čísla jsou správná" ukazujeme mechaniku každého rozdílu. To je rozdíl mezi nástrojem a marketingem.
-->

---

<!-- ===================== SLIDE 13 — REÁLNÁ × ODVOZENÁ × CHYBĚJÍCÍ ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="flex items-center gap-3 mb-4">
  <span class="cat-num text-purple-400">LEKCE 05</span>
  <span class="tag tag-purple">poslední a nejdůležitější</span>
</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">Nemíchat <span class="text-purple-400">reálná</span>, <span class="text-blue-400">odvozená</span> a <span class="text-gray-400">chybějící</span> data</h2>

<div class="grid grid-cols-3 gap-4 mb-4 mt-2">

<div class="card border-blue-900/40">
  <div class="text-blue-300 font-mono text-xs uppercase tracking-widest mb-2">Reálné pole RPP</div>
  <div class="text-gray-300 text-sm">Přímo ze zdroje. Bez značky.</div>
</div>

<div class="card border-purple-900/40">
  <div class="text-purple-300 font-mono text-xs uppercase tracking-widest mb-2">⚙ Odvozené</div>
  <div class="text-gray-300 text-sm">Dopočítal nástroj (kritičnost, kategorie…). Vždy označené, s vysvětlením.</div>
</div>

<div class="card border-gray-700/40">
  <div class="text-gray-400 font-mono text-xs uppercase tracking-widest mb-2">Neuvedeno</div>
  <div class="text-gray-300 text-sm">V RPP nevyplněno. Odlišené od nuly i od odhadu.</div>
</div>

</div>

<div class="highlight-box">
  <div class="text-xs font-mono tracking-widest text-purple-300 uppercase mb-2">v6.1 · podle připomínky Petra Kučery</div>
  <div class="text-gray-200 text-sm">Smyšlená data jsme <span class="text-white font-semibold">odstranili</span> — nástroj přestal hádat „rodinu" z části názvu (zrušeno <span class="text-white font-semibold">1 357</span> umělých skupin). Co zůstává, je buď ze zdroje, nebo poctivě označené jako odvozené, nebo přiznané jako chybějící.</div>
</div>

</div>

<!--
v6.1, dnešní práce. Kučera: „strašně to máte, protože si míchají reálná data s absentovanými s vymyšlenými".
Volba: oddělit a označit (ne plošně mazat analytiku, kterou PS07 chtěla). Legenda původu na každé obrazovce.
-->

---

<!-- ===================== SLIDE 14 — JAK O RPP PŘEMÝŠLÍME ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="tag tag-green mb-4">Jak nástroj používáme · mentální model</div>

<h2 class="text-4xl font-black text-white mb-3 leading-tight">RPP není pravda — je to <span class="text-green-400">čočka</span></h2>

<div class="text-gray-300 text-base italic mb-6">Hodnota nástroje není „ukázat, co v RPP je". Je v tom ukázat i to, co RPP <span class="text-white font-semibold">neví</span> — a kde.</div>

<div class="grid grid-cols-2 gap-4">

<div class="card border-green-900/40">
  <div class="text-green-400 font-mono text-xs uppercase tracking-widest mb-2">Co nástroj dělá</div>
  <ul class="text-gray-300 text-sm space-y-1.5">
    <li>· ukazuje fill-rate klíčových polí (příležitost pro DIA)</li>
    <li>· přiznává hranice RPP: kompetenční role, schvalování, cloud</li>
    <li>· analýza rizik, ne vytýkací audit</li>
  </ul>
</div>

<div class="card border-orange-900/40">
  <div class="text-orange-400 font-mono text-xs uppercase tracking-widest mb-2">Co z toho plyne</div>
  <ul class="text-gray-300 text-sm space-y-1.5">
    <li>· mezery v datech jsou samy o sobě poznatek</li>
    <li>· nástroj je pozvánka k lepším datům, ne soud</li>
    <li>· stejnou metodou jde mapovat libovolný registr státu</li>
  </ul>
</div>

</div>

<div class="highlight-box mt-5">
  <div class="text-center text-base text-white">Poctivost o původu a úplnosti dat je to, co z prohlížeče dělá důvěryhodný analytický nástroj.</div>
</div>

</div>

<!--
Tady je „how we think about using it". RPP bereme jako model reality, ne realitu. Nejcennější výstup pro DIA
často není graf, ale zjištění „tady chybí 69 % bezpečnostních úrovní". Stejný přístup škáluje na další registry.
-->

---

<!-- ===================== SLIDE 15 — CO DÁL ===================== -->

<div class="h-full flex flex-col justify-center px-12">

<div class="tag tag-orange mb-4">Co dál · otevřené směry</div>

<h2 class="text-4xl font-black text-white mb-6">Kam to vede dál</h2>

<div class="grid grid-cols-2 gap-4">

<div class="card flex items-start gap-4">
  <div class="text-xl w-8 flex-shrink-0">🏘️</div>
  <div><div class="text-white font-semibold text-sm">Kdo v RPP chybí</div><div class="text-gray-400 text-xs mt-1">Porovnat RPP s daty ČSÚ — které obce a školy nemají žádnou agendu ani systém.</div></div>
</div>

<div class="card flex items-start gap-4">
  <div class="text-xl w-8 flex-shrink-0">📈</div>
  <div><div class="text-white font-semibold text-sm">Časová řada registrací</div><div class="text-gray-400 text-xs mt-1">Jak přibývají systémy a roste podíl cloudu (~90 % za poslední rok) — trend i riziko.</div></div>
</div>

<div class="card flex items-start gap-4">
  <div class="text-xl w-8 flex-shrink-0">☁️</div>
  <div><div class="text-white font-semibold text-sm">Cloud vs. on-premise</div><div class="text-gray-400 text-xs mt-1">Filtr nad rozšířenými systémy — cloudová služba je z pohledu rizika kritičtější.</div></div>
</div>

<div class="card flex items-start gap-4">
  <div class="text-xl w-8 flex-shrink-0">🌍</div>
  <div><div class="text-white font-semibold text-sm">Gap analýza vs. jiné státy</div><div class="text-gray-400 text-xs mt-1">Které systémy nám architektonicky chybí a kde naopak utrácíme za přebytek.</div></div>
</div>

</div>

<div class="text-gray-400 text-sm mt-6 font-mono">🔗 Živě: <span class="text-white">mapastatu.cz</span> · heslo na vyžádání</div>

</div>

<!--
Všechny čtyři směry vzešly přímo z poslední zpětné vazby (Kučera, Vlasta). Smyčka pokračuje — tohle je
zásobník další iterace, ne hotový seznam.
-->

---
layout: center
---

<!-- ===================== SLIDE 16 — MEETUP ===================== -->

<div class="text-center max-w-4xl mx-auto px-8">

<div class="tag tag-teal mb-6">🤝 Pojďme si o tom popovídat naživo</div>

<h2 class="text-5xl font-black leading-tight text-white mb-3">
  Agent-Driven Meetup<br/>
  <span style="color:#5eead4;">Praha</span>
</h2>

<div class="card border-teal-900/40 p-6 text-left mt-6">
  <div class="text-teal-400 font-mono text-xs uppercase tracking-widest mb-3">Příští event</div>
  <div class="text-white text-xl font-bold mb-4">Organization of the Future: Simulating the AI-Native Teams Workshop</div>
  <div class="grid grid-cols-3 gap-3 text-sm">
    <div>
      <div class="text-gray-500 text-xs font-mono uppercase">Datum</div>
      <div class="text-white">úterý 23. 6. · 18:00</div>
    </div>
    <div>
      <div class="text-gray-500 text-xs font-mono uppercase">Místo</div>
      <div class="text-white">Ataccama, Sokolovská 685/136f, Karlín</div>
    </div>
    <div>
      <div class="text-gray-500 text-xs font-mono uppercase">Kapacita</div>
      <div class="text-white">40 míst</div>
    </div>
  </div>
</div>

<div class="mt-6 text-base text-gray-400 font-mono">🔗 meetup.com/agent-driven/</div>

</div>

<!--
Pozvánka na komunitní meetup. Téma POD týmů a AI agentů jako členů týmu — tematicky blízké tomu,
jak jsme iterovali nad RPP (agentní smyčka + lidský expert).
-->

---
layout: center
---

<!-- ===================== SLIDE 17 — DĚKUJI ===================== -->

<div class="text-center max-w-3xl mx-auto px-8">

<div class="text-xs font-mono tracking-widest text-purple-400 uppercase mb-8 opacity-70">děkuji</div>

<h1 class="text-6xl font-black leading-tight text-white mb-8">
  Nasadit. Nechat rozbít.<br/>
  <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Opravit. Znovu.</span>
</h1>

<div class="text-lg text-gray-300 font-light mb-10">
  Takhle se z otevřených dat státu stává nástroj, kterému experti věří.
</div>

<div class="flex items-center justify-center gap-3 text-sm text-gray-400">
  <span class="font-semibold text-white">Jakub Bareš</span>
  <span class="text-gray-600">·</span>
  <span class="text-teal-300 font-mono">jakub@metamatics.ventures</span>
  <span class="text-gray-600">·</span>
  <span>mapastatu.cz</span>
</div>

</div>

<!--
Závěr. Zopakovat metodu jako hlavní message: ne dokonalost na první pokus, ale rychlá smyčka s experty.
Kontakt: jakub@metamatics.ventures.
-->

<style>
@import url('./style.css');
</style>
