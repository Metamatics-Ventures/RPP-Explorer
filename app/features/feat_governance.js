/* RPP Explorer — feat_governance.js
   Doplňkový modul (klasický script, načítaný PO app.js, sdílí global scope).
   Přidává 4 obrazovky: #/metodika, #/zdravi, #/duplicity, #/nastenka.
   Vše čistě klientsky, česky, tón „analýza rizik / příležitost pro DIA" (NE audit/pranýř).
   Žádné jiné soubory se neupravují. Helper computeHealth() je sdílen mezi #/zdravi a #/nastenka. */
(function () {
  'use strict';

  /* ============================================================
     SDÍLENÉ POMOCNÉ FUNKCE
     ============================================================ */

  /* Semafor barva podle skóre úplnosti 0–100. Pozitivní rámec:
     zelená = data v pořádku, žlutá = rozpracováno, červená = prostor doplnit. */
  function scoreColor(s) {
    if (s >= 70) return { cls: 'ok', bg: '#ecfdf5', fg: '#047857', label: 'dobrý stav', dot: '🟢' };
    if (s >= 40) return { cls: 'warn', bg: '#fffbeb', fg: '#b45309', label: 'rozpracováno', dot: '🟡' };
    return { cls: 'bad', bg: '#fef2f2', fg: '#b91c1c', label: 'prostor doplnit', dot: '🔴' };
  }

  /* Skóre úplnosti resortu (0–100). Definice je záměrně jednoduchá a STROJOVĚ
     ověřitelná (jen vyplněnost povinných polí), aby šla obhájit a zopakovat:
       - 50 % váhy: podíl systémů s vyplněnou bezpečnostní úrovní
       - 30 % váhy: podíl systémů s vyplněným umístěním (cloud/on-prem)
       - 20 % váhy: podíl systémů navázaných alespoň na jednu agendu (kontext)
     Skóre NEHODNOTÍ obsahovou správnost (to automat neumí) — jen úplnost evidence. */
  function healthScore(pctBezp, pctUmisteni, pctAgenda) {
    return Math.round(0.5 * pctBezp + 0.3 * pctUmisteni + 0.2 * pctAgenda);
  }

  /* computeHealth() — vrací pole {resort, n, pctBezp, pctUmisteni, pctAgenda, dupRodiny, skore}
     agregované per správce (spravce_nazev). Sdílí ho #/zdravi i #/nastenka.
     Pole isvs je k dispozici z await load('isvs'). */
  async function computeHealth() {
    const isvs = await load('isvs');
    const map = new Map();
    for (const r of isvs) {
      const key = (r.spravce_nazev && String(r.spravce_nazev).trim()) || 'Neuvedený správce';
      let a = map.get(key);
      if (!a) { a = { resort: key, n: 0, bezp: 0, umisteni: 0, agenda: 0, rodiny: new Map() }; map.set(key, a); }
      a.n++;
      // STROJOVĚ kontrolovatelné: má/nemá vyplněnou bezpečnostní úroveň
      if (r.bezuroven && r.bezuroven !== 'Neuvedeno' && (r.bez_rank || 0) > 0) a.bezp++;
      // má/nemá vyplněné umístění
      if (r.umisteni && String(r.umisteni).trim()) a.umisteni++;
      // má/nemá vazbu na agendu (kontext systému)
      if (Array.isArray(r.agendy) && r.agendy.length) a.agenda++;
      // duplicitní rodiny v rámci resortu (stejná rodina ≥2×)
      if (r.rodina && String(r.rodina).trim()) {
        const rk = String(r.rodina).trim();
        a.rodiny.set(rk, (a.rodiny.get(rk) || 0) + 1);
      }
    }
    const out = [];
    for (const a of map.values()) {
      const pctBezp = a.n ? Math.round(a.bezp / a.n * 100) : 0;
      const pctUmisteni = a.n ? Math.round(a.umisteni / a.n * 100) : 0;
      const pctAgenda = a.n ? Math.round(a.agenda / a.n * 100) : 0;
      let dupRodiny = 0;
      a.rodiny.forEach(c => { if (c >= 2) dupRodiny++; });
      out.push({
        resort: a.resort, n: a.n, pctBezp, pctUmisteni, pctAgenda,
        dupRodiny, skore: healthScore(pctBezp, pctUmisteni, pctAgenda)
      });
    }
    out.sort((x, y) => y.skore - x.skore || y.n - x.n);
    return out;
  }
  // sdílej i mimo IIFE (kdyby ho chtěl použít app.js / jiný modul)
  window.computeHealth = computeHealth;

  /* Normalizace názvu systému pro fuzzy detekci duplicit:
     lowercase, bez diakritiky, bez verzí / čísel / „hosting" / mezer a interpunkce. */
  function normName(s) {
    if (!s) return '';
    let t = String(s).toLowerCase();
    t = t.normalize('NFD').replace(/[̀-ͯ]/g, ''); // odstranit diakritiku
    t = t.replace(/\b(verze|version|ver|v)\s*\.?\s*\d+(\.\d+)*/g, ' ');
    t = t.replace(/\bhosting\b/g, ' ');
    t = t.replace(/\b(system|systém|informacni|informa[cč]ni|is)\b/g, ' ');
    t = t.replace(/[0-9]+/g, ' ');         // čísla pryč
    t = t.replace(/[^a-z]+/g, '');         // jen písmena, bez mezer/interpunkce
    return t;
  }

  /* malá KPI dlaždice (nepřebíhá na .kpi grid, jde použít kdekoli) */
  function kpiTile(v, l, tip) {
    return `<div class="kpi"${tip ? ` title="${esc(tip)}"` : ''}><div class="v">${v}</div><div class="l">${esc(l)}</div></div>`;
  }

  /* ============================================================
     1) #/metodika — Texty, nápověda a „hesla" pro správce agend
     ============================================================ */

  const NAPOVEDA = [
    {
      pole: 'Bezpečnostní úroveň (dle vyhlášky o VIS)',
      role: 'IT / bezpečnostní role',
      co: 'Zařazení systému do škály dopadu 1–4 (1 = nízká … 4 = kritická). NEjde o „jak dobře je systém zabezpečen", ale o to, jaký dopad by mělo jeho narušení.',
      proc: 'Úroveň určuje povinnosti (kontroly, audit) a omezení — systém úrovně 4 (kritická) nesmí do veřejného cloudu. V RPP úroveň chybí u většiny systémů, takže stát nevidí celkový rizikový profil.',
      jak: 'Stanovte ji podle dopadů (na obyvatele, na chod úřadu, na navázané systémy), ne podle pocitu. Práh dopadu na obyvatele je ~125 tis. — větší město/okres typicky „vyskočí" výš. Při pochybnostech se spojte s bezpečnostní rolí úřadu PŘEDEM.'
    },
    {
      pole: 'Umístění / cloud (on-prem × cloud)',
      role: 'IT / dataři',
      co: 'Kde systém fyzicky/logicky běží: bez cloudu, částečně, nebo plně v cloudu.',
      proc: 'Společně s bezpečnostní úrovní rozhoduje o přípustnosti řešení (úroveň 4 do veřejného cloudu nesmí). Je to také vstup pro analýzu závislostí a odolnosti.',
      jak: 'Vyplňte vždy — toto pole je v RPP nejúplnější (~100 %), držte ten standard. Pokud kombinujete provoz, zvolte „částečně" a stav popište v charakteristice systému.'
    },
    {
      pole: 'Napojení na ISSS / ISZR (sdílené služby)',
      role: 'IT / architekt',
      co: 'Zda a jak systém čerpá referenční údaje přes sdílenou infrastrukturu (ISZR, ISSS/eGSB, Czech POINT, datové schránky).',
      proc: 'Napojení na sdílené služby je páteř propojeného státu. Bez něj vzniká stínová evidence a duplicitní pořizování stejných údajů.',
      jak: 'Uveďte editor/čtenář vztah k základním registrům. Pokud systém údaje jen čte, je čtenář; pokud do registru zapisuje (matriky, cizinecký systém…), je editor. Pochybnosti řešte s architektem PŘEDEM, ne až při kontrole.'
    },
    {
      pole: 'Popis systému / charakteristika (DSP)',
      role: 'Věcný správce (typicky právník) + IT',
      co: 'Stručný věcný popis: k čemu systém je, jaká data zpracovává, pro koho. Toto je obsahová část, kterou automat neumí posoudit.',
      proc: 'Z popisu se odvozuje kontext „kdo komu co" — bez něj je systém v registru jen prázdné ID. Kvalitní popis výrazně snižuje počet zpětných dotazů.',
      jak: 'Pište věcně a konkrétně (2–5 vět). Vyhněte se marketingu dodavatele. Provázejte s agendou, kterou systém podporuje — věcný správce (právník) zná agendu, IT zná systém: doplňte to společně.'
    },
    {
      pole: 'Oprávnění k údajům (kdo co čte/zapisuje)',
      role: 'Věcný správce (právník)',
      co: 'Výčet údajů, které je úřad v rámci agendy oprávněn využívat, a v jaké úrovni (čtení / zápis).',
      proc: 'Oprávnění jsou právní základ pro sdílení dat. RPP zachycuje jen SCHVÁLENÁ oprávnění — čekající/zablokovaná nejsou vidět, proto je důležité je včas vypořádat.',
      jak: 'Navazujte oprávnění na konkrétní činnosti agendy (§). Pokud oprávnění chybí, ale fakticky data potřebujete, řešte to právní cestou — ne obejitím přes lokální kopii dat.'
    }
  ];

  /* „Máme tady typicky 10 chyb, milí správci…" — a priori, ne ex post. */
  const TYPICKE_CHYBY = [
    { t: 'Nevyplněná bezpečnostní úroveň', d: 'Pole zůstane „neuvedeno", protože „to vyplníme později". U ~69 % systémů úroveň chybí.', dop: 'Doplňte ji hned při registraci podle dopadu. Není to jednorázový úkon „na konec".' },
    { t: 'Úroveň stanovená „od oka"', d: 'Zařazení podle pocitu, ne podle dopadové analýzy. Časté podhodnocení u systémů velkých měst.', dop: 'Spočítejte dopad na obyvatele a na navázané systémy. Práh ~125 tis. obyvatel berte jako orientační hranici.' },
    { t: 'Tentýž systém pod více názvy', d: 'Stejný produkt evidovaný stovkami obcí pod různými názvy (viz KEO, Munis…).', dop: 'Použijte ustálený název produktu (rodinu). Nevymýšlejte lokální varianty názvu.' },
    { t: 'Chybějící vazba na agendu', d: 'Systém visí v registru bez vazby na agendu, kterou podporuje.', dop: 'Provažte systém s agendou — bez toho nelze posoudit kontext „kdo komu co".' },
    { t: 'Marketingový popis místo věcného', d: 'Charakteristika přejatá z nabídky dodavatele, ne z reálné funkce systému.', dop: 'Popisujte funkci a data, ne obchodní výhody. 2–5 vět stačí.' },
    { t: 'Editor vs. čtenář popletený', d: 'Systém uvedený jako editor registru, přitom data jen čte (nebo naopak).', dop: 'Ověřte s IT/architektem skutečný směr toku (R/W) PŘEDEM.' },
    { t: 'Neaktualizovaný záznam', d: 'Záznam starší 3–6 let, který už neodpovídá realitě (systém změněn/zrušen).', dop: 'Revidujte záznamy s vyplněnou platností starší 3 let. Zrušený systém označte.' },
    { t: 'Náklady prázdné nebo nesrovnatelné', d: 'Pole nákladů vyplněno jen u ~1 % systémů, navíc nejednotně.', dop: 'Pokud náklady vyplňujete, držte jednotnou metodiku (TCO/rok), jinak je raději nevyplňujte zkresleně.' },
    { t: 'Umístění „cloud" bez kontroly úrovně', d: 'Systém v cloudu, ale s úrovní 4 (kritická) — to vyhláška nedovoluje.', dop: 'Před zvolením cloudu ověřte přípustnost vůči bezpečnostní úrovni.' },
    { t: 'Změny řešené až při kontrole', d: 'Správce čeká na podnět zvenčí a opravuje data ex post.', dop: 'Pracujte a priori: spojte se s IT oddělením a bezpečnostní rolí PŘEDEM, ještě před registrací/změnou.' }
  ];

  async function metodika() {
    let pocet = '';
    try {
      const m = await load('meta');
      const fr = m.fillrate || {};
      pocet = `<div class="desc" style="margin-top:6px">Pro kontext z živých dat RPP: bezpečnostní úroveň je vyplněna u <b>${fr.bezuroven || 0} %</b> systémů, umístění u <b>${fr.umisteni || 0} %</b>, náklady jen u <b>${fr.naklady || 0} %</b>. Většina „chyb" níže je tedy o úplnosti evidence, ne o zlém úmyslu.</div>`;
    } catch (e) { pocet = ''; }

    const napovedaCards = NAPOVEDA.map(n => `
      <div class="card" style="margin:0">
        <h2 style="margin-bottom:4px">${esc(n.pole)}</h2>
        <div style="margin:0 0 10px"><span class="chip" style="background:rgba(0,216,255,.12);color:#0e7490">pro: ${esc(n.role)}</span></div>
        <div class="kv"><span>Co to je</span><b>${esc(n.co)}</b></div>
        <div class="kv"><span>Proč na tom záleží</span><b>${esc(n.proc)}</b></div>
        <div class="kv"><span>Jak vyplnit</span><b>${esc(n.jak)}</b></div>
      </div>`).join('');

    const chybyCards = TYPICKE_CHYBY.map((c, i) => `
      <div class="card" style="margin:0;border-left:3px solid var(--neon-cyan)">
        <div style="font-weight:700;margin-bottom:6px"><span class="badge grey" style="margin-right:6px">${i + 1}</span>${esc(c.t)}</div>
        <div class="desc" style="margin-bottom:8px">${esc(c.d)}</div>
        <div style="font-size:12.5px"><b style="color:#047857">✓ Doporučení:</b> ${esc(c.dop)}</div>
      </div>`).join('');

    view.innerHTML = `
      <div class="pagehdr"><div>
        <h1>Metodika a nápověda pro správce</h1>
        <div class="sub">Referenční nápověda k vyplňování RPP — texty, „hesla" a typické chyby (a priori, ne ex post)</div>
      </div></div>
      ${srcHeader('RPP — metodická vrstva')}

      <div class="card" style="border-left:4px solid var(--neon-cyan)">
        <h2>Milí správci agend — pár slov úvodem</h2>
        <div class="desc">
          Tato stránka je <b>nápověda</b>, ne kontrola. DIA jako správce RPP smí dělat jediné: poskytovat
          <b>metodickou pomoc</b> — nemůže a nesmí sahat správcům do jejich byznysu ani jim přepisovat data.
          Proto vám tady neříkáme „co máte špatně", ale <b>jak pole vyplnit dobře napoprvé</b>.
          Klíčové je dělat to <b>a priori</b>: spojte se s IT oddělením a bezpečnostní rolí <b>předem</b>,
          ještě než systém registrujete nebo měníte — ušetří to čas všem.
        </div>
        ${pocet}
        <div class="gap" style="margin-top:10px">
          ℹ Vyplňujete-li konkrétní formulář kritičnosti systému, tato nápověda je jeho referenční doprovod —
          <a class="link" href="#/kriticnost">otevřít formulář kritičnosti →</a>
        </div>
      </div>

      <h2 style="margin:24px 0 12px">Nápověda k klíčovým polím RPP</h2>
      <div class="desc" style="margin:-6px 0 14px">Pole jsou rozlišena podle role, která je typicky vyplňuje: <b>věcný správce agendy</b> (zpravidla právník — zná agendu) vs. <b>IT / dataři</b> (znají systém). Nejlépe je doplňte společně.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${napovedaCards}</div>

      <h2 style="margin:28px 0 6px">Typicky tady máme 10 chyb, milí správci…</h2>
      <div class="desc" style="margin:0 0 14px">Není to pranýř — je to seznam míst, kde se data nejčastěji „rozsypou", a jak tomu předejít předem. Stejné chyby řeší skoro každý úřad, takže se jimi netrapte sami.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${chybyCards}</div>

      <div class="card" style="margin-top:22px">
        <h2>Kam dál</h2>
        <div class="kv"><span>Automatická kontrola úplnosti dat</span><b><a class="link" href="#/zdravi">Zdraví dat resortů →</a></b></div>
        <div class="kv"><span>Konsolidace duplicitních názvů systémů</span><b><a class="link" href="#/duplicity">Duplicity a kandidáti na sloučení →</a></b></div>
        <div class="kv"><span>Pozitivní žebříček kvality dat</span><b><a class="link" href="#/nastenka">Veřejná nástěnka →</a></b></div>
      </div>`;
  }

  /* ============================================================
     2) #/zdravi — Data governance vrstva (per resort)
     ============================================================ */

  async function zdravi() {
    await ensureNames();
    let m = {};
    try { m = await load('meta'); } catch (e) { m = {}; }
    const fr = m.fillrate || {};
    const isvs = await load('isvs');

    // KPI: systémy s chybějící úrovní + duplicitní rodiny (celkem)
    let bezChybi = 0;
    const rodinaCount = new Map();
    for (const r of isvs) {
      if (!(r.bezuroven && r.bezuroven !== 'Neuvedeno' && (r.bez_rank || 0) > 0)) bezChybi++;
      if (r.rodina && String(r.rodina).trim()) {
        const rk = String(r.rodina).trim();
        rodinaCount.set(rk, (rodinaCount.get(rk) || 0) + 1);
      }
    }
    let dupRodinCelkem = 0;
    rodinaCount.forEach(c => { if (c >= 2) dupRodinCelkem++; });

    const health = await computeHealth();

    view.innerHTML = `
      <div class="pagehdr"><div>
        <h1>Zdraví dat resortů</h1>
        <div class="sub">Automatická detekce chybějících/vadných dat per resort (správce) — příležitost pro DIA</div>
      </div></div>
      ${srcHeader('RPP — ISVS + agendy')}

      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        ${kpiTile((fr.bezuroven || 0) + ' %', 'Fill-rate bezp. úrovně', 'Podíl systémů s vyplněnou bezpečnostní úrovní (z meta.fillrate).')}
        ${kpiTile(fmt(bezChybi), 'Systémy bez úrovně', 'Počet systémů, kde bezpečnostní úroveň v RPP chybí (neuvedeno).')}
        ${kpiTile(fmt(dupRodinCelkem), 'Duplicitní rodiny', 'Počet produktových rodin, které jsou v registru ≥2×.')}
        ${kpiTile(fmt(health.length), 'Resortů / správců', 'Počet odlišných správců (spravce_nazev) v datech.')}
      </div>

      <div class="grid2">
        <div class="card" style="border-left:4px solid #047857">
          <h2>✓ Co hlídá automat (strojově ověřitelné)</h2>
          <div class="desc">Tzv. Bohdanova hranice — strojem lze spolehlivě zkontrolovat jen <b>úplnost a jednoduché stavy</b>:</div>
          <div class="kv"><span>Chybějící povinná pole</span><b>má / nemá bezpečnostní úroveň</b></div>
          <div class="kv"><span>Umístění</span><b>cloud / částečně / on-prem / chybí</b></div>
          <div class="kv"><span>Registr</span><b>je / není základní registr</b></div>
          <div class="kv"><span>Vazba na agendu</span><b>navázán / nenavázán</b></div>
          <div class="kv"><span>Duplicita rodiny</span><b>stejná rodina v resortu ≥2×</b></div>
        </div>
        <div class="card" style="border-left:4px solid #b45309">
          <h2>👤 Co musí posoudit člověk (obsahová správnost)</h2>
          <div class="desc">Tohle automat <b>nehodnotí</b> — jen na to upozorní. Jde o výklad agendy „kdo komu co":</div>
          <div class="kv"><span>Je úroveň stanovena správně?</span><b>vyžaduje dopadovou analýzu</b></div>
          <div class="kv"><span>Sedí popis na realitu?</span><b>věcné posouzení správce</b></div>
          <div class="kv"><span>Jsou oprávnění úplná a oprávněná?</span><b>právní výklad</b></div>
          <div class="kv"><span>Editor vs. čtenář</span><b>znalost skutečného toku dat</b></div>
        </div>
      </div>

      <div class="card">
        <h2>Úplnost dat per resort <span class="small muted">řazeno dle skóre úplnosti (0–100)</span></h2>
        <div class="desc">
          Toto je <b>per-resort hloubka</b> nad celkovým fill-rate z <a class="link" href="#/analytika">Analytiky</a>.
          Skóre = 50 % bezp. úroveň + 30 % umístění + 20 % vazba na agendu. Měří <b>úplnost evidence</b>,
          ne kvalitu práce úřadu. Rámec je pozitivní: ukazuje, kde je nejvíc prostoru data doplnit.
        </div>
        <div class="toolbar">
          <input class="grow" id="zd_q" placeholder="Filtrovat resort / správce…">
          <span class="count" id="zd_c"></span>
        </div>
        <div id="zd_table"></div>
      </div>`;

    const cols = [
      { h: 'Resort / správce', render: r => esc(r.resort) },
      { h: 'Systémů', cls: 'right', render: r => fmt(r.n) },
      { h: '% úroveň', cls: 'right', render: r => `${r.pctBezp} %` },
      { h: '% umístění', cls: 'right', render: r => `${r.pctUmisteni} %` },
      { h: 'Dup. rodiny', cls: 'right', render: r => r.dupRodiny ? `<span class="badge grey">${r.dupRodiny}</span>` : '<span class="muted">0</span>' },
      {
        h: 'Skóre úplnosti', render: r => {
          const c = scoreColor(r.skore);
          return `<span class="badge" style="background:${c.bg};color:${c.fg}">${c.dot} ${r.skore}</span>` +
            `<div class="bar" style="margin-top:4px"><div class="track"><div class="fill ${r.skore >= 70 ? 'lime' : r.skore >= 40 ? '' : 'pink'}" style="width:${r.skore}%"></div></div></div>`;
        }
      }
    ];

    const draw = () => {
      const q = (byId('zd_q').value || '').trim().toLowerCase();
      const rows = q ? health.filter(r => r.resort.toLowerCase().includes(q)) : health;
      byId('zd_table').innerHTML = table(rows, cols);
      byId('zd_c').textContent = `${fmt(rows.length)} resortů`;
      window.__export = { name: 'zdravi-resorty', rows, cols };
    };
    byId('zd_q').addEventListener('input', draw);
    draw();
  }

  /* ============================================================
     3) #/duplicity — Konsolidace duplicitních názvů systémů
     ============================================================ */

  async function duplicity() {
    await ensureNames();
    const isvs = await load('isvs');

    // (A) Rodiny s ≥2 instalacemi — z mapovací vrstvy (rodina / rodina_pocet)
    const rodMap = new Map();
    for (const r of isvs) {
      if (r.rodina && String(r.rodina).trim()) {
        const rk = String(r.rodina).trim();
        let g = rodMap.get(rk);
        if (!g) { g = { rodina: rk, pocet: 0, pocetPole: r.rodina_pocet || 0 }; rodMap.set(rk, g); }
        g.pocet++;
        if (r.rodina_pocet) g.pocetPole = Math.max(g.pocetPole, r.rodina_pocet);
      }
    }
    const rodiny = [...rodMap.values()].filter(g => g.pocet >= 2).sort((a, b) => b.pocet - a.pocet);
    const maxInstalaci = rodiny.length ? rodiny[0].pocet : 0;
    let soucetVRodinach = 0;
    rodiny.forEach(g => { soucetVRodinach += g.pocet; });

    // (B) Fuzzy detekce: stejný normalizovaný tvar, ale RŮZNÁ / chybějící rodina
    const normMap = new Map();
    for (const r of isvs) {
      const nn = normName(r.nazev);
      if (nn.length < 4) continue; // příliš krátké → moc šumu
      let g = normMap.get(nn);
      if (!g) { g = { norm: nn, varianty: new Map(), rodiny: new Set(), pocet: 0, ids: [] }; normMap.set(nn, g); }
      g.pocet++;
      g.varianty.set(r.nazev, (g.varianty.get(r.nazev) || 0) + 1);
      g.rodiny.add(r.rodina && String(r.rodina).trim() ? String(r.rodina).trim() : '— (bez rodiny)');
      if (g.ids.length < 6) g.ids.push(r.id);
    }
    // kandidát na sloučení = stejný norm. tvar, ≥2 RŮZNÉ původní názvy A (≥2 rodiny NEBO některá rodina chybí)
    const kandidati = [...normMap.values()].filter(g => {
      if (g.varianty.size < 2) return false;
      const maChybejici = g.rodiny.has('— (bez rodiny)');
      return g.rodiny.size >= 2 || maChybejici;
    }).map(g => ({
      norm: g.norm,
      varianty: [...g.varianty.keys()],
      pocet: g.pocet,
      rodiny: [...g.rodiny],
      ids: g.ids
    })).sort((a, b) => b.pocet - a.pocet);

    // VIDITELNÝ LOG (silný argument o kvalitě dat státu)
    const evidovano = isvs.length;
    const odhadSkutecnych = evidovano - (soucetVRodinach - rodiny.length); // každou rodinu počítáme jako 1 produkt
    const logLines = [
      `Načteno ISVS záznamů: ${fmt(evidovano)}`,
      `Rodin (produktů) s >1 instalací: ${fmt(rodiny.length)}`,
      `Z toho instalací celkem: ${fmt(soucetVRodinach)} (= tolik záznamů je „tentýž systém pod jiným kabátem")`,
      `Maximum instalací jedné rodiny: ${fmt(maxInstalaci)}${maxInstalaci ? ` (${esc(rodiny[0].rodina)})` : ''}`,
      `Fuzzy kandidátů na sloučení (stejný název, jiná/chybějící rodina): ${fmt(kandidati.length)}`,
      `Hrubý odhad „skutečných" produktů místo evidovaných: ~${fmt(odhadSkutecnych)} vs. ${fmt(evidovano)} evidovaných`
    ];

    view.innerHTML = `
      <div class="pagehdr"><div>
        <h1>Duplicity a konsolidace názvů</h1>
        <div class="sub">Jeden systém pod více názvy — příležitost pro DIA vyčistit RPP (žádný přepis zdroje)</div>
      </div></div>
      ${srcHeader('RPP — ISVS (mapovací vrstva rodin + fuzzy)')}

      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        ${kpiTile(fmt(rodiny.length), 'Rodin s >1 instalací', 'Produktové rodiny, které jsou v registru vícekrát.')}
        ${kpiTile(fmt(maxInstalaci), 'Max instalací rodiny', maxInstalaci ? esc(rodiny[0].rodina) : '')}
        ${kpiTile(fmt(kandidati.length), 'Fuzzy kandidátů', 'Skupiny záznamů, které jsou podle názvu možná tentýž systém, ale s jinou/chybějící rodinou.')}
        ${kpiTile('~' + fmt(odhadSkutecnych), 'Odhad „skutečných"', `Po sloučení rodin místo ${fmt(evidovano)} evidovaných.`)}
      </div>

      <div class="card" style="border-left:4px solid var(--neon-cyan)">
        <h2>Detekční log <span class="small muted">co automat při průchodu dat našel</span></h2>
        <div class="desc">Tohle není výtka — je to <b>měřitelný argument o kvalitě dat státu</b> a zároveň mapa, kde se dá RPP konsolidovat.</div>
        <pre class="mono" style="background:#0a1f44;color:#7ef0ff;padding:12px 14px;border-radius:10px;overflow:auto;font-size:12px;line-height:1.7;margin:0">${logLines.map(l => '› ' + esc(l)).join('\n')}</pre>
      </div>

      <div class="card">
        <h2>Žebříček: jeden systém pod více názvy <span class="small muted">rodiny s ≥2 instalacemi</span></h2>
        <div class="desc">Mapovací vrstva rodin už existuje — zde je její žebříček. Vyšší počet = větší úspora při konsolidaci evidence.</div>
        <div class="toolbar">
          <input class="grow" id="dp_q" placeholder="Filtrovat rodinu…">
          <span class="count" id="dp_c"></span>
        </div>
        <div id="dp_table"></div>
      </div>

      <div class="card">
        <h2>Kandidáti na sloučení (fuzzy) <span class="small muted">návrh, BEZ přepisu zdroje</span></h2>
        <div class="desc">
          Tyto záznamy mají po normalizaci <b>stejný název</b>, ale <b>různou nebo chybějící rodinu</b> — možná jde o tentýž systém.
          Je to <b>pouze návrh „sloučit?"</b> pro správce RPP (DIA); aplikace nic nepřepisuje, RPP není schvalovací číselník.
        </div>
        <div class="toolbar">
          <input class="grow" id="dk_q" placeholder="Filtrovat podle názvu / tvaru…">
          <span class="count" id="dk_c"></span>
        </div>
        <div id="dk_table"></div>
      </div>`;

    // tabulka rodin
    const rodCols = [
      { h: 'Rodina (produkt)', render: g => esc(g.rodina) },
      { h: 'Instalací', cls: 'right', render: g => `<span class="badge grey">${fmt(g.pocet)}</span>` },
      { h: 'Podíl', render: g => `<div class="bar"><div class="track"><div class="fill" style="width:${maxInstalaci ? Math.round(g.pocet / maxInstalaci * 100) : 0}%"></div></div></div>` }
    ];
    const drawRod = () => {
      const q = (byId('dp_q').value || '').trim().toLowerCase();
      const rows = q ? rodiny.filter(g => g.rodina.toLowerCase().includes(q)) : rodiny;
      byId('dp_table').innerHTML = table(rows.slice(0, 200), rodCols);
      byId('dp_c').textContent = `${fmt(rows.length)} rodin` + (rows.length > 200 ? ' · zobrazeno 200' : '');
      window.__export = { name: 'duplicity-rodiny', rows, cols: rodCols };
    };
    byId('dp_q').addEventListener('input', drawRod);

    // tabulka fuzzy kandidátů
    const kandCols = [
      { h: 'Normalizovaný tvar', render: g => `<span class="mono">${esc(g.norm)}</span>` },
      {
        h: 'Varianty názvů', render: g => g.varianty.slice(0, 4).map((v, i) =>
          `<div>${link(g.ids[i] || g.ids[0], v)}</div>`).join('') + (g.varianty.length > 4 ? `<span class="muted small">+${g.varianty.length - 4} dalších</span>` : '')
      },
      { h: 'Záznamů', cls: 'right', render: g => `<span class="badge grey">${fmt(g.pocet)}</span>` },
      { h: 'Rodiny', render: g => g.rodiny.map(r => `<span class="chip"${r.indexOf('bez rodiny') >= 0 ? ' style="background:#fef2f2;color:#b91c1c"' : ''}>${esc(r)}</span>`).join(' ') },
      { h: '', render: () => `<span class="badge" style="background:rgba(0,216,255,.12);color:#0e7490">sloučit?</span>` }
    ];
    const drawKand = () => {
      const q = (byId('dk_q').value || '').trim().toLowerCase();
      const rows = q ? kandidati.filter(g => g.norm.includes(q) || g.varianty.some(v => v.toLowerCase().includes(q))) : kandidati;
      byId('dk_table').innerHTML = table(rows.slice(0, 200), kandCols);
      byId('dk_c').textContent = `${fmt(rows.length)} kandidátů` + (rows.length > 200 ? ' · zobrazeno 200' : '');
    };
    byId('dk_q').addEventListener('input', drawKand);

    drawRod();
    drawKand();
  }

  /* ============================================================
     4) #/nastenka — Veřejná nástěnka / gamifikace (POZITIVNÍ)
     ============================================================ */

  function nastenkaSnapshot(health) {
    // ulož snapshot {resort: skore} a vrať předchozí (pro trend)
    let prev = null;
    try {
      const raw = localStorage.getItem('rpp_nastenka_snapshot');
      if (raw) prev = JSON.parse(raw);
    } catch (e) { prev = null; }
    const now = {};
    health.forEach(h => { now[h.resort] = h.skore; });
    try {
      localStorage.setItem('rpp_nastenka_snapshot', JSON.stringify({ ts: Date.now(), data: now }));
    } catch (e) { /* ignore */ }
    return prev && prev.data ? prev.data : null;
  }

  async function nastenka() {
    await ensureNames();
    const health = await computeHealth();

    // jen resorty s rozumným počtem systémů (≥3), ať žebříček nesvádějí drobné záznamy
    const board = health.filter(h => h.n >= 3).sort((a, b) => b.skore - a.skore || b.n - a.n);
    const prev = nastenkaSnapshot(health);

    const trend = (resort, skore) => {
      if (!prev || !(resort in prev)) return '<span class="muted small" title="Bez předchozího snímku — trend se ukáže při příští návštěvě.">— nový</span>';
      const d = skore - prev[resort];
      if (d > 0) return `<span class="badge ok" title="Zlepšení od minulé návštěvy">▲ +${d}</span>`;
      if (d < 0) return `<span class="badge warn" title="Pokles od minulé návštěvy">▼ ${d}</span>`;
      return '<span class="muted small">beze změny</span>';
    };

    const medal = ['🥇', '🥈', '🥉'];
    const top3 = board.slice(0, 3).map((h, i) => {
      const c = scoreColor(h.skore);
      return `<div class="card" style="margin:0;text-align:center;border-top:4px solid ${c.fg}">
        <div style="font-size:34px">${medal[i]}</div>
        <div style="font-weight:800;font-size:15px;margin:6px 0 2px">${esc(h.resort)}</div>
        <div class="badge" style="background:${c.bg};color:${c.fg};font-size:13px">${c.dot} skóre ${h.skore}</div>
        <div class="muted small" style="margin-top:6px">${fmt(h.n)} systémů · ${trend(h.resort, h.skore)}</div>
      </div>`;
    }).join('');

    view.innerHTML = `
      <div class="pagehdr"><div>
        <h1>Nástěnka kvality dat</h1>
        <div class="sub">Pozitivní žebříček digitalizace po resortech — soutěž jako motor zlepšování</div>
      </div></div>
      ${srcHeader('RPP — odvozeno ze skóre úplnosti')}

      <div class="card" style="border-left:4px solid #047857">
        <h2>Jak to čteme</h2>
        <div class="desc">
          Nástěnka je <b>záměrně pozitivní</b>: oceňuje postup, zlepšení a „kdo nejvíc doplnil".
          <b>Žádný pranýř „nejhorších"</b> — nízké skóre znamená jen „tady je nejvíc prostoru doplnit data",
          ne selhání. Inspirace modelem soutěživosti při onboardingu (např. Liberecký vs. Ústecký kraj):
          přátelská soutěž doplňování dat motivuje víc než kontrola.
        </div>
        <div class="toolbar" style="margin-top:10px">
          <span class="muted small">Režim zobrazení:</span>
          <select id="na_mode">
            <option value="interni">Interní (pracovní)</option>
            <option value="verejne">Veřejné</option>
          </select>
          <span class="count" id="na_note"></span>
        </div>
        <div id="na_banner"></div>
      </div>

      <h2 style="margin:22px 0 12px">🏆 TOP 3 resorty dle úplnosti dat</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${top3 || '<div class="empty">Zatím není dost dat.</div>'}</div>

      <div class="card" style="margin-top:22px">
        <h2>Žebříček resortů <span class="small muted">semafor + trend od minulé návštěvy</span></h2>
        <div class="desc">Trend se počítá proti uloženému snímku v tomto prohlížeči (localStorage). Při první návštěvě se snímek založí a rozdíl uvidíte příště.</div>
        <div class="toolbar">
          <input class="grow" id="na_q" placeholder="Filtrovat resort…">
          <span class="count" id="na_c"></span>
        </div>
        <div id="na_table"></div>
      </div>`;

    const cols = [
      { h: '#', cls: 'right', render: (r) => `<b>${r.__rank}</b>` },
      { h: 'Resort / správce', render: r => esc(r.resort) },
      { h: 'Systémů', cls: 'right', render: r => fmt(r.n) },
      {
        h: 'Stav', render: r => {
          const c = scoreColor(r.skore);
          return `<span class="badge" style="background:${c.bg};color:${c.fg}">${c.dot} ${c.label}</span>`;
        }
      },
      {
        h: 'Skóre', render: r => `<div class="bar"><div class="track"><div class="fill ${r.skore >= 70 ? 'lime' : r.skore >= 40 ? '' : 'pink'}" style="width:${r.skore}%"></div></div><div class="val">${r.skore}</div></div>`
      },
      { h: 'Trend', render: r => trend(r.resort, r.skore) }
    ];

    const ranked = board.map((r, i) => Object.assign({ __rank: i + 1 }, r));
    const draw = () => {
      const q = (byId('na_q').value || '').trim().toLowerCase();
      const rows = q ? ranked.filter(r => r.resort.toLowerCase().includes(q)) : ranked;
      byId('na_table').innerHTML = table(rows, cols);
      byId('na_c').textContent = `${fmt(rows.length)} resortů`;
      window.__export = { name: 'nastenka-zebricek', rows, cols };
    };
    byId('na_q').addEventListener('input', draw);

    const applyMode = () => {
      const v = byId('na_mode').value;
      if (v === 'verejne') {
        byId('na_note').textContent = 'náhled veřejné verze';
        byId('na_banner').innerHTML = `<div class="gap" style="margin-top:10px">🌐 <b>Veřejná verze</b> vzniká vždy v koordinaci s DIA. Zveřejňuje se pozitivní postup (zlepšení, doplnění), nikdy ne žebříček „nejhorších".</div>`;
      } else {
        byId('na_note').textContent = 'jen pro interní práci';
        byId('na_banner').innerHTML = `<div class="gap" style="margin-top:10px">🔒 <b>Interní režim</b> — pracovní pohled pro tým. Před zveřejněním projít s DIA.</div>`;
      }
    };
    byId('na_mode').addEventListener('change', applyMode);

    applyMode();
    draw();
  }

  /* ============================================================
     REGISTRACE ROUT
     ============================================================ */
  Object.assign(ROUTES, { metodika, zdravi, duplicity, nastenka });
})();
