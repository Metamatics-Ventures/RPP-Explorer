/* RPP Explorer — SPA. Vanilla JS, hash router, lazy JSON, Cytoscape graph. */
'use strict';
const view = document.getElementById('view');
const DATA = {};
const NAMES = {};

/* ---------- utils ---------- */
const esc = s => (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => (n == null ? '' : Number(n).toLocaleString('cs-CZ'));
const byId = i => document.getElementById(i);
const INFO_ICON = ' <span style="cursor:help;color:var(--muted);font-size:11px;border:1px solid var(--line);border-radius:50%;padding:0 4px">i</span>';
const _loading = {};
async function load(name){
  if (DATA[name]) return DATA[name];
  if (_loading[name]) return _loading[name];   // sdílej probíhající fetch (jinak vznikne víc instancí pole a tagy se ztratí)
  _loading[name] = (async ()=>{
    const r = await fetch('data/' + name + '.json');
    if (!r.ok) throw new Error('Nelze načíst ' + name);
    DATA[name] = await r.json();
    return DATA[name];
  })();
  _loading[name].catch(()=>{ delete _loading[name]; });   // selhání → umožni další pokus
  return _loading[name];
}
async function ensureNames(){
  if (NAMES._loaded) return;
  const n = await load('names');
  NAMES.agenda = n.agenda; NAMES.ovm = n.ovm; NAMES.isvs = n.isvs; NAMES.sluzba = n.sluzba;
  NAMES.kat = n.kat || {};
  NAMES._loaded = true;
}
/* id -> {route,name} resolution */
function routeOf(id){
  if (!id) return null;
  if (id.startsWith('agenda/')) return 'agendy';
  if (id.startsWith('orgán-veřejné-moci/')) return 'ovm';
  if (id.startsWith('isvs/')) return 'isvs';
  if (id.startsWith('služba/')) return 'sluzby';
  if (id.startsWith('objekt-subjekt/')) return 'udaje';
  return null;
}
function nameOf(id){
  if (!id) return '';
  if (id.startsWith('agenda/')) return (NAMES.agenda && NAMES.agenda[id]) || id;
  if (id.startsWith('orgán-veřejné-moci/')) return (NAMES.ovm && NAMES.ovm[id]) || id;
  if (id.startsWith('isvs/')) return (NAMES.isvs && NAMES.isvs[id]) || id;
  if (id.startsWith('služba/')) return (NAMES.sluzba && NAMES.sluzba[id]) || id;
  return id;
}
function link(id, label){
  const rt = routeOf(id); const nm = esc(label || nameOf(id) || id);
  if (!rt) return nm;
  return `<a class="link" href="#/${rt}/${encodeURIComponent(id)}">${nm}</a>`;
}
/* A5 — bezpečnostní úroveň = škála DOPADU dle vyhlášky, NE „dobré/špatné".
   Stanovuje ji správce podle dopadů systému; vyšší číslo = vyšší dopad a přísnější
   požadavky (úroveň 4 nesmí do veřejného cloudu). Proto neutrální gradient 1→4,
   ne zeleno-červená (ta svádí ke čtení „zelená=bezpečné, červená=nezabezpečené"). */
const BESP_TIP = 'Bezpečnostní úroveň dle vyhlášky o významných informačních systémech. Stanovuje ji SPRÁVCE systému podle DOPADŮ (ne podle míry zabezpečení). Vyšší číslo = vyšší dopad a přísnější požadavky; práh dopadu na obyvatele je ~125 tis. (větší město/okres „vyskočí“). Úroveň 4 (kritická) typicky registry — nesmí do veřejného cloudu, jen do Státní tiskárny cenin. U cca 69 % systémů úroveň v RPP chybí (vyplňuje ji správce, kvalita kolísá).';
function bespRank(level){ if(!level) return 0; const m=String(level).match(/\b([1-4])\b/); return m?+m[1]:0; }
const BESP_STYLE = {
  1:'background:#e8eef7;color:#41566f;border-color:#cdd9e8',
  2:'background:#cfe0f3;color:#23456e;border-color:#a9c6e6',
  3:'background:#5b8fd6;color:#fff;border-color:#3f74bd',
  4:'background:#0a1f44;color:#7ef0ff;border-color:#0a1f44',
};
function badgeSec(level){
  const r = bespRank(level);
  if (!r) return `<span class="badge grey" title="${esc(BESP_TIP)}">neuvedeno</span>`;
  return `<span class="badge" style="${BESP_STYLE[r]}" title="${esc(BESP_TIP)}">${esc(level)}</span>`;
}
/* C11 — hlavička zdroje dat na každé datové obrazovce (odkud data jsou). */
function srcHeader(sada){
  return `<div style="font-size:11.5px;color:var(--muted);background:#f1f5fb;border:1px solid var(--line);border-radius:8px;padding:6px 11px;margin-bottom:8px">📊 Zdroj: <b>RPP open data (DIA)</b>${sada?` · sada <span class="mono">${esc(sada)}</span>`:''} · staženo 6/2026 · <a class="link" href="https://rpp-opendata.egon.gov.cz/odrpp/datovasada/" target="_blank" rel="noopener">rpp-opendata.egon.gov.cz</a></div>${srcLegend()}`;
}
/* ---------- Původ hodnoty: reálné pole RPP × odvozené (dopočítal nástroj) × chybějící ---------- */
/* Reakce na připomínku P. Kučery: v aplikaci se nesmí míchat reálná data se
   smyšlenými. Smyšlená (bez podkladu) jsme odstranili; odvozené (analytické)
   hodnoty zůstávají, ale jsou VŽDY zřetelně označené značkou „⚙ odvozeno", a
   chybějící pole RPP se zobrazují jako „neuvedeno" (odlišené od nuly i od odvozeného). */
const DERIVED_TIP = 'Odvozeno tímto nástrojem z dat RPP (heuristika / agregace) — NENÍ to přímé pole zdroje RPP. Orientační pomůcka, ne oficiální hodnota.';
function dvd(tip){ return `<sup class="dvd" title="${esc(tip||DERIVED_TIP)}">⚙ odvozeno</sup>`; }
/* záhlaví sloupce / popisek, který nástroj DOPOČÍTAL (není přímo v RPP) */
function dH(label, tip){ return `${esc(label)} <sup class="dvd" title="${esc(tip||DERIVED_TIP)}">⚙</sup>`; }
/* chybějící (v RPP nevyplněné) pole — odlišit od nuly i od odvozené hodnoty */
function na(){ return '<span class="absent" title="V RPP toto pole není vyplněné (chybějící údaj, nikoli nula).">neuvedeno</span>'; }
function naIf(v){ return (v==null||v==='') ? na() : esc(v); }
/* legenda původu hodnot — připojuje se pod hlavičku zdroje na každé datové obrazovce */
function srcLegend(){ return `<div class="srcleg">Původ hodnot: <span class="lgi">přímé pole&nbsp;<b>RPP</b></span> · <span class="lgi"><sup class="dvd">⚙ odvozeno</sup>&nbsp;dopočítal nástroj (ne ze zdroje)</span> · <span class="lgi"><span class="absent">neuvedeno</span>&nbsp;= v RPP nevyplněno</span></div>`; }
/* A4/B7 + C13 — R/W badge u toku: R = čte (cyan), W = zapisuje/editor (pink). */
const RW_TIP = 'R = čte (jen čtení) · W = zapisuje (editor registru) · H/N = historie/notifikace. Úroveň přístupu příjemce ke zdrojovým údajům (z RPP, pole „úroveň-přístupu“).';
function rwBadges(rw){
  if (!rw || !rw.length) return '';
  return rw.map(x=>{ const w=String(x).includes('W'); return `<span class="badge ${w?'pink':'cyan'}" title="${esc(RW_TIP)}">${esc(x)}</span>`; }).join(' ');
}
function badgeRegistr(){ return `<span class="badge" style="background:#0a1f44;color:#7ef0ff;border-color:#0a1f44" title="Základní / referenční registr — pilíř státní správy. Při výpadku ochromí navázané systémy (zejm. živě připojené: policie, soudy, IZS).">⬢ registr</span>`; }
function badgeEditor(){ return `<span class="badge pink" title="Editor registru — má oprávnění s úrovní W (zápis) vůči základnímu registru (např. matriky, cizinecký systém, ISO jsou editory ROB). Ostatní systémy z registru jen čtou.">✎ editor</span>`; }
/* Sdílená infrastruktura ISZR (ISZR, ISSS/eGSB, ISDS, Czech POINT, AISV, FAIS) —
   NENÍ základní registr, ale „spadá do ISZR" (sdílené rozhraní / referenční služby). */
function badgeIszr(){ return `<span class="badge" style="background:#13315c;color:#9fd8ff;border-color:#1e4a82" title="Sdílená infrastruktura ISZR (informační systém základních registrů / sdílené služby / Czech POINT / datové schránky). NENÍ základní registr — zprostředkovává přístup k registrům přes referenční rozhraní.">⬡ ISZR</span>`; }
function badgeRole(i){ return i.registr?badgeRegistr():i.iszr?badgeIszr():i.editor?badgeEditor():''; }
/* B10/E20 — mapování krátkého typu OVM (z ETL pole ovm_t) na čitelný název + úroveň. */
const OVM_ABBR2TYPE = {min:'Ministerstva',oss:'Organizační složky státu',urad:'Úřady (státní správa)',soud:'Soudy a st. zastupitelství',kraj:'Kraje',mesto:'Města a městyse',mc:'Městské části',obec:'Obce',poj:'Zdravotní pojišťovny',komora:'Komory a prof. samospráva',po:'Příspěvkové organizace',skola:'Školy a univerzity',firma:'Podniky a firmy',ost:'Ostatní',nd:'Neurčeno'};
const OVM_ABBR_LEVEL = {min:0,oss:0,urad:1,soud:1,kraj:2,mesto:3,mc:4,obec:5,poj:3,komora:3,po:4,skola:5,firma:6,ost:6,nd:7};
/* B9 — gradientní stárnutí: údaj/dokument starší ~3 let → upozornění (vždy bereme poslední platnou verzi). */
function ageBadge(dateStr){
  if (!dateStr) return '';
  const y = parseInt(String(dateStr).slice(0,4),10); if (!y) return '';
  const age = (new Date().getFullYear()) - y;
  if (age < 3) return '';
  const cls = age >= 6 ? 'bad' : 'warn';
  return `<span class="badge ${cls}" title="Platnost od ${esc(dateStr)} — záznam je starší ${age} let. Nástroj zobrazuje vždy poslední platnou verzi; ověřte aktuálnost.">⏳ ${age} let</span>`;
}
const ELI_BASE = 'https://www.e-sbirka.cz/eli';
/* E20 — role/kategorie OVM seskupené dle úrovně (ústřední → obecní). */
const ROLE_COL = {'ústřední':'#0a1f44','krajská':'#7c5cff','obecní':'#00a3c4','jiná':'#64748b'};
function renderRoles(roles){
  const order=['ústřední','krajská','obecní','jiná'];
  const g={}; roles.forEach(r=>{(g[r.lvl]=g[r.lvl]||[]).push(r);});
  return order.filter(l=>g[l]).map(l=>`<div style="margin:6px 0;line-height:2">`
    +`<span class="chip" style="background:${ROLE_COL[l]};color:#fff">${l} (${g[l].length})</span> `
    +g[l].slice(0,12).map(r=>`<span class="chip" title="${esc(r.nazev)}">${esc(r.nazev.length>42?r.nazev.slice(0,42)+'…':r.nazev)}</span>`).join(' ')
    +(g[l].length>12?` <span class="muted small">+${g[l].length-12} dalších</span>`:'')+`</div>`).join('');
}
function parLink(c){
  if (!c.par) return '<span class="muted">—</span>';
  if (c.eli) return `<a class="link" href="${ELI_BASE}${esc(c.eli.replace(/^\/eli/,''))}" target="_blank" rel="noopener" title="otevřít v eSbírce">${esc(c.par)}</a>`;
  return esc(c.par);
}

/* ---------- generic list page ---------- */
function listPage(opts){
  // opts: {rows, cols, searchText(r), filters:[{label,values,test(r,v)}], exportName}
  const state = { q:'', limit:150, f:{} };
  (opts.filters||[]).forEach((fl,i)=>{ if(fl.default) state.f[i]=fl.default; });   // přednastavený filtr
  const tools = (opts.filters||[]).map((fl,i)=>`<select data-f="${i}"><option value="">${esc(fl.label)}: vše</option>${fl.values.map(v=>`<option ${fl.default===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`).join('');
  view.querySelector('.content,#view'); // noop
  const host = document.createElement('div');
  host.innerHTML = `<div class="toolbar">
      <input class="grow" id="lq" placeholder="Filtrovat podle názvu / kódu…">
      ${tools}
      <span class="count" id="lc"></span>
    </div>
    ${opts.note?`<div class="desc small" style="margin:-2px 0 10px">ℹ ${opts.note}</div>`:''}
    <div id="ltable"></div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="lmore" style="display:none">Načíst dalších 150</button></div>`;
  view.appendChild(host);
  function filtered(){
    let rows = opts.rows;
    const q = state.q.trim().toLowerCase();
    if (q) rows = rows.filter(r => opts.searchText(r).toLowerCase().includes(q));
    (opts.filters||[]).forEach((fl,i)=>{ const v=state.f[i]; if(v) rows=rows.filter(r=>fl.test(r,v)); });
    return rows;
  }
  function draw(){
    const rows = filtered();
    const shown = rows.slice(0, state.limit);
    byId('ltable').innerHTML = table(shown, opts.cols);
    byId('lc').textContent = `${fmt(rows.length)} záznamů` + (rows.length>shown.length?` · zobrazeno ${fmt(shown.length)}`:'');
    byId('lmore').style.display = rows.length > state.limit ? '' : 'none';
    window.__export = { name: opts.exportName, rows, cols: opts.cols };
  }
  host.querySelector('#lq').addEventListener('input', e=>{ state.q=e.target.value; state.limit=150; draw(); });
  host.querySelectorAll('select[data-f]').forEach(s=>s.addEventListener('change', e=>{ state.f[e.target.dataset.f]=e.target.value; state.limit=150; draw(); }));
  host.querySelector('#lmore').addEventListener('click', ()=>{ state.limit+=150; draw(); });
  draw();
}
function table(rows, cols){
  if (!rows.length) return '<div class="empty">Nic nenalezeno.</div>';
  let t = '<div class="tablewrap"><table><thead><tr>' + cols.map(c=>`<th class="${c.cls||''}">${c.h}</th>`).join('') + '</tr></thead><tbody>';
  t += rows.map(r=>'<tr>'+cols.map(c=>`<td class="${c.cls||''}">${c.render(r)}</td>`).join('')+'</tr>').join('');
  return t + '</tbody></table></div>';
}
function bar(label, val, max, cls){
  const pct = max ? Math.round(val/max*100) : 0;
  return `<div class="bar"><div class="lbl">${esc(label)}</div><div class="track"><div class="fill ${cls||''}" style="width:${pct}%"></div></div><div class="val">${fmt(val)}</div></div>`;
}

/* ---------- DASHBOARD ---------- */
async function dashboard(){
  await ensureNames(); const m = await load('meta'); const c = m.counts;
  const sec = m.isvs_bezuroven; const totalIsvs = c.isvs;
  const withLevel = totalIsvs - (sec['Neuvedeno']||0); const pctLevel = Math.round(withLevel/totalIsvs*100);
  const maxSec = Math.max(...Object.values(sec));
  const maxUm = Math.max(...Object.values(m.isvs_umisteni));
  const cloud = (m.isvs_umisteni['Plně s využitím cloud computingu']||0)+(m.isvs_umisteni['Částečně s využitím cloud computingu']||0);
  view.innerHTML = `
   <div class="pagehdr"><div><h1>Dashboard</h1><div class="sub">Registr práv a povinností · ${m.src_count} datových sad · zdroj DIA</div></div></div>
   ${srcHeader('RPP — kompletní sada')}
   <div class="kpis">
     <a class="kpi" href="#/agendy" title="Počet agend v živých open datech (denní aktualizace). Publikovaný „Report agendy VS“ uvádí 387 — starší výřez.${c.agendy?'':''}"><div class="v">${fmt(c.agendy)}</div><div class="l">Agendy</div></a>
     <a class="kpi" href="#/isvs" title="Celý registr ISVS (i provozní/neagendové, napříč fázemi). Z toho agendových: ${fmt(c.isvs_agendove||0)}."><div class="v">${fmt(c.isvs)}</div><div class="l">ISVS v registru</div></a>
     <a class="kpi" href="#/isvs" title="Informační systémy navázané na ≥1 agendu — srovnatelné s číslem DIA (~3,4 tis. „agendových IS“)."><div class="v">${fmt(c.isvs_agendove||0)}</div><div class="l">z toho agendové IS</div></a>
     <a class="kpi" href="#/ovm" title="Aktivní orgány veřejné moci. Zaniklých (zrušených/sloučených) ${fmt(c.ovm_zaniklo||0)} se do počtu nezahrnuje; SPUÚ jsou samostatná sada."><div class="v">${fmt(c.ovm)}</div><div class="l">Orgány (OVM) — aktivní</div></a>
     <a class="kpi" href="#/sluzby"><div class="v">${fmt(c.sluzby)}</div><div class="l">Služby</div></a>
     <a class="kpi" href="#/opravneni"><div class="v">${fmt(c.opravneni)}</div><div class="l">Oprávnění k údajům</div></a>
     <div class="kpi"><div class="v">${fmt(c.pusobnost)}</div><div class="l">Vazby působnosti</div></div>
   </div>
   ${m.reconcile?`<div class="card" style="margin-top:14px">
     <h2>Srovnání s čísly DIA / T. Šedivce <span class="small muted">naše open data (${esc(m.src_date||'')}) vs. DIA (${esc(m.dia_date||'')})</span></h2>
     <div class="desc">Reakce na připomínku „tady nám to nesedí“. Prošli jsme zdrojová open data RPP záznam po záznamu a u každého rozdílu zjistili příčinu. <b>Žádný z rozdílů není chyba v datech</b> — jde buď o <b>datum snapshotu</b> (RPP se aktualizuje denně, naše data jsou novější než konferenční čísla), nebo o <b>definici počítané množiny</b> (aktivní vs. všechny záznamy, agendové IS vs. celý registr ISVS). Klikni na řádek „Podrobně“ pro úplnou mechaniku a postup ověření přímo v aplikaci.</div>
     ${table(m.reconcile, [
        {h:'Metrika', render:r=>esc(r.metrika)},
        {h:'Naše', cls:'right', render:r=>`<b>${fmt(r.nase)}</b>`},
        {h:'DIA', cls:'right', render:r=>fmt(r.dia)},
        {h:'Rozdíl', cls:'right', render:r=>{const d=r.nase-r.dia;const pct=r.dia?Math.round(Math.abs(d)/r.dia*100):0;return `<span class="muted">${d>0?'+':''}${fmt(d)}${pct?` (${pct} %)`:''}</span>`;}},
        {h:'Stručně', render:r=>`<span class="small">${esc(r.vyklad)}</span>`},
     ])}
     <div style="margin-top:16px">
       <div class="desc" style="font-weight:700;color:var(--ink);margin-bottom:6px">Podrobně — mechanika rozdílu a jak ho ověřit</div>
       ${m.reconcile.map(r=>`<details class="recd" style="border:1px solid var(--line,#e6eaf0);border-radius:10px;padding:10px 14px;margin-bottom:8px">
         <summary style="cursor:pointer;font-weight:600">${esc(r.metrika)} <span class="muted small">— naše ${fmt(r.nase)} · DIA ${fmt(r.dia)}</span></summary>
         <p class="small" style="line-height:1.7;margin:10px 0 6px;max-width:90ch">${esc(r.detail||r.vyklad)}</p>
         ${r.overit?`<div class="kv" style="margin-top:6px"><span class="small muted">Jak ověřit v aplikaci</span><b class="small">${esc(r.overit)}</b></div>`:''}
       </details>`).join('')}
     </div>
     <div class="desc small" style="margin-top:10px">Zdroj: RPP open data (DIA), denní aktualizace, snapshot ${esc(m.src_date||'')} · plně aktuální seznam agend: <span class="mono">rpp-ais.egon.gov.cz/gen/agendy-detail/</span></div>
   </div>`:''}
   <div class="grid2">
     <div>
       <div class="card">
         <h2>Bezpečnostní úroveň systémů <span class="badge grey">${pctLevel}% uvedeno</span></h2>
         <div class="desc">Příležitost pro správce (DIA): doplněním bezpečnostní úrovně u zbývajících ${100-pctLevel} % systémů vznikne úplný obraz kritické infrastruktury. Úroveň = dopad dle vyhlášky (vyšší = kritičtější).</div>
         <div class="cov">
           <div class="donut" style="background:conic-gradient(var(--neon-cyan) ${pctLevel}%, #e6eaf0 0)"><div class="num"><b>${pctLevel}%</b><span>má úroveň</span></div></div>
           <div style="flex:1;min-width:240px">
             ${Object.entries(sec).map(([k,v])=>bar(k,v,maxSec, k==='Neuvedeno'?'grey':(k.includes('Kritická')||k.includes('Vysoká'))?'':(k.includes('Nízká')?'pink':''))).join('')}
           </div>
         </div>
       </div>
       <div class="card">
         <h2>Nejkritičtější systémy <span class="small muted">dle dopadu (registr · bezp. úroveň · role správce)</span></h2>
         <div class="desc">Kritičnost se počítá z <b>dopadu</b>, ne z počtu navázaných agend — nahoře jsou základní registry a ústřední systémy (pilíře státu). Počet agend je jen informativní; vysoký počet u obcí je důsledek hromadného vyklikávání, ne důležitosti.</div>
         ${table(m.top_critical, [
            {h:'Systém', render:r=>link(r.id, r.nazev)+(r.registr?' '+badgeRegistr():'')},
            {h:'Důvod', render:r=>`<span class="chip">${esc(r.duvod||'—')}</span>`},
            {h:'Správce', render:r=>esc(r.spravce||'—')},
            {h:'Bezp.', render:r=>badgeSec(r.bezuroven)},
            {h:'Agend', cls:'right', render:r=>`<span class="muted" title="počet registrovaných agend — informativní rozsah působnosti, NE kritičnost">${fmt(r.agend)}</span>`},
            {h:'', render:r=>`<a class="link" href="#/dopady/${encodeURIComponent(r.id)}">⚠ dopad</a>`},
         ])}
       </div>
       ${(m.top_spread&&m.top_spread.length)?`<div class="card">
         <h2>Nejrozšířenější obecní systémy <span class="small muted">rozsah ≠ kritičnost</span></h2>
         <div class="desc">Kolik instalací téže rodiny produktu napříč úřady (číselníková vrstva nad názvy ISVS — sjednocuje „KEO“, „KEO 4“, „KEO X Hosting“…). Vypovídá o <b>rozšíření</b>, ne o kritičnosti.</div>
         ${table(m.top_spread, [
            {h:dH('Rodina produktu','Rodina ze slovníku známých produktů nebo z přesné shody názvu u ≥2 instalací. RPP pole „rodina" nemá; ojedinělé názvy se neslučují.'), render:r=>esc(r.rodina)},
            {h:'Instalací', cls:'right', render:r=>fmt(r.pocet)},
         ])}
       </div>`:''}
     </div>
     <div>
       <div class="card">
         <h2>Umístění systémů</h2><div class="desc">Cloud vs. on-premise · v cloudu ${fmt(cloud)} systémů</div>
         ${Object.entries(m.isvs_umisteni).map(([k,v])=>bar(k,v,maxUm,k.includes('cloud')?'lime':'grey')).join('')}
       </div>
       <div class="card">
         <h2>Fáze životního cyklu</h2>
         ${Object.entries(m.isvs_etapa).map(([k,v])=>bar(k,v,Math.max(...Object.values(m.isvs_etapa)),'')).join('')}
       </div>
       <div class="card">
         <h2>Služby podle typu</h2>
         ${Object.entries(m.sluzby_typ).map(([k,v])=>bar(k.trim()||'Neuvedeno',v,Math.max(...Object.values(m.sluzby_typ)),'pink')).join('')}
       </div>
     </div>
   </div>
   <div class="card" id="instcard" style="margin-top:14px">
     <h2>Orgány veřejné moci podle typu instituce <span class="badge grey" id="insttot">…</span>
       <span style="float:right;font-weight:400"><select class="dbsel" id="insttypsel"><option value="">Typ instituce: vše</option></select></span></h2>
     <div class="desc">Filtruj instituce podle typu — města, obce, úřady, ministerstva, kraje… Klikni na typ pro otevření filtrovaného seznamu v databázi, nebo vyber typ a vyfiltruj žebříček nejzapojenějších úřadů.</div>
     <div class="grid2" style="margin-top:10px">
       <div><div class="desc" style="font-weight:700;color:var(--ink);margin-bottom:4px">Rozložení podle typu</div><div id="instbreak"><div class="loading"><span class="spin"></span>Načítám orgány…</div></div></div>
       <div><div class="desc" style="font-weight:700;color:var(--ink);margin-bottom:4px">Nejvíce zapojené úřady <span class="small muted">dle počtu agend</span></div><div id="insttop"></div></div>
     </div>
   </div>`;
  // progresivní doplnění (OVM je velký dataset — načítáme až po vykreslení dashboardu)
  ensureOvmTypes().then(ovmAll=>{
    if (!byId('instbreak')) return;   // uživatel mezitím odešel jinam
    const ovm = ovmAll.filter(o=>!o.zaniklo);   // jen aktivní (zaniklé do počtu nepatří)
    const byType = {}; for (const o of ovm){ byType[o._typ] = (byType[o._typ]||0)+1; }
    const types = OVM_TYPES.filter(t=>byType[t]);
    const maxC = Math.max(...types.map(t=>byType[t]));
    byId('insttot').textContent = fmt(ovm.length)+' aktivních orgánů';
    byId('insttypsel').innerHTML = '<option value="">Typ instituce: vše</option>' +
      types.map(t=>`<option value="${esc(t)}">${esc(t)} (${fmt(byType[t])})</option>`).join('');
    byId('instbreak').innerHTML = types.map(t=>
      `<div class="bar tight"><div class="lbl"><a class="link" href="#/databaze/ovm~${encodeURIComponent(t)}" title="otevřít v databázi">${esc(t)}</a></div><div class="track"><div class="fill" style="width:${Math.round(byType[t]/maxC*100)}%"></div></div><div class="val">${fmt(byType[t])}</div></div>`).join('');
    function drawTop(typ){
      let list = typ ? ovm.filter(o=>o._typ===typ) : ovm;
      list = list.slice().sort((a,b)=>((b.c&&b.c.agend)||0)-((a.c&&a.c.agend)||0)).slice(0,12);
      byId('insttop').innerHTML = table(list, [
        {h:'Úřad', render:o=>link(o.id, o.nazev)},
        {h:dH('Typ','Typ instituce odvozený klasifikací názvu/právní formy. RPP tuto kategorii přímo neeviduje.'), render:o=>`<span class="chip">${esc(o._typ)}</span>`},
        {h:'Agend', cls:'right', render:o=>fmt((o.c&&o.c.agend)||0)},
      ]);
    }
    drawTop('');
    byId('insttypsel').addEventListener('change', e=>drawTop(e.target.value));
  }).catch(()=>{ if (byId('instbreak')) byId('instbreak').innerHTML='<div class="empty">Orgány se nepodařilo načíst.</div>'; });
}

/* ---------- AGENDY ---------- */
async function agendy(arg){
  await ensureNames(); const rows = await load('agendy');
  if (arg) return agendaDetail(rows.find(a=>a.id===arg), rows);
  view.innerHTML = `<div class="pagehdr"><div><h1>Agendy</h1><div class="sub">${fmt(rows.length)} agend veřejné správy</div></div></div>`;
  view.insertAdjacentHTML('beforeend', srcHeader('agendy'));
  await ensureImportance('agendy'); await ensureCategories('agendy');
  const agKat = AGENDA_CAT_NAMES.filter(c=>rows.some(r=>r._kat===c));
  listPage({ rows, exportName:'agendy', note:DUL_BASIS.agendy,
    searchText:r=>r.nazev+' '+r.kod+' '+(r._zakon||''),
    filters:[
      {label:'Kategorie', values:agKat, test:(r,v)=>r._kat===v},
      dulFilter,
    ],
    cols:[
      {h:'Kód', cls:'mono', render:r=>esc(r.kod)},
      {h:'Název', render:r=>link(r.id, r.nazev)},
      {h:dH('Kategorie','Tematická oblast odvozená z názvu agendy (regulární výrazy). RPP tematickou kategorii nemá.'), render:r=>`<span class="chip">${r._kat?esc(r._kat):na()}</span>`},
      {h:dH('Důležitost',DUL_BASIS.agendy.replace(/<[^>]*>/g,'')), render:r=>badgeDul(r._dulezitost)},
      {h:'Ohlašovatel', render:r=>link(r.ohlasovatel)},
      {h:'Činností', cls:'right', render:r=>fmt(r.c.cinnosti)},
      {h:'ISVS', cls:'right', render:r=>fmt(r.c.isvs)},
      {h:'Služeb', cls:'right', render:r=>fmt(r.c.sluzby)},
      {h:'Orgánů', cls:'right', render:r=>fmt(r.c.ovm)},
    ]});
}
async function agendaDetail(a, rows){
  if (!a) { view.innerHTML='<div class="empty">Agenda nenalezena.</div>'; return; }
  const sluzby = await load('sluzby');
  const aServices = sluzby.filter(s=>s.agenda===a.id);
  const opr = await load('opravneni');
  // tok: z-agendy (zdroj, dává) → do-agendy (příjemce, bere)
  const bere = opr.filter(o=>o['do']===a.id), dava = opr.filter(o=>o['z']===a.id);
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/agendy">Agendy</a> › ${esc(a.kod)}</div>
    ${srcHeader('agendy')}
    <div class="ehdr">
      <div><span class="codez">${esc(a.id)}</span><h1>${esc(a.nazev)} ${a.registr?badgeRegistr():''} ${ageBadge(a.platnost_od)}</h1>
        <div class="meta">
          <div>Ohlašovatel (gestor)<b>${link(a.ohlasovatel)}</b></div>
          <div>Platnost od<b>${a.platnost_od?esc(a.platnost_od):na()}</b></div>
          <div title="Stav stanoviska gestora k tomu, jak má agenda v RPP vyplněné SLUŽBY (souhlasné/nesouhlasné/chybí). Součást procesu ohlášení a schvalování agendy — vypovídá o úplnosti popisu služeb, ne o jejich obsahu.">Stanovisko ke službám${INFO_ICON}<b>${a.stanovisko_sluzby?esc(a.stanovisko_sluzby):na()}</b></div>
          <div title="Stav stanoviska gestora k tomu, jak má agenda v RPP vyplněné ÚDAJE (souhlasné/nesouhlasné/chybí). Indikuje, zda je katalog údajů agendy odsouhlasen v rámci ohlášení agendy.">Stanovisko k údajům${INFO_ICON}<b>${a.stanovisko_udaje?esc(a.stanovisko_udaje):na()}</b></div>
        </div></div>
      <div class="miniwrap">
        <div class="mini"><b>${fmt(a.c.cinnosti)}</b><span>činností</span></div>
        <div class="mini"><b>${fmt(a.c.ovm)}</b><span>orgánů</span></div>
        <div class="mini"><b>${fmt(a.c.isvs)}</b><span>ISVS</span></div>
        <div class="mini"><b>${fmt(a.c.sluzby)}</b><span>služeb</span></div>
      </div>
    </div>
    <div class="grid2">
      <div>
        <div class="card"><h2>Činnosti <span class="badge grey">${fmt(a.c.cinnosti)}</span></h2>
          <div class="desc">Činnosti agendy s odkazem na § eSbírky (UC6). Volitelný výkon = obec se může rozhodnout, zda činnost vykonává.</div>
          ${table(a.cinnosti.slice(0,200), [
            {h:'Kód',cls:'mono',render:c=>esc(c.kod)},
            {h:'Název',render:c=>esc(c.nazev)},
            {h:'§ (eSbírka)',render:c=>parLink(c)},
            {h:'Výkon',render:c=>c.vol?'<span class="badge warn">volitelný</span>':'<span class="badge ok">povinný</span>'},
          ])}
        </div>
        <div class="card"><h2>Informační systémy <span class="badge grey">${fmt(a.c.isvs)}</span></h2>
          ${a.isvs.length? table(a.isvs.map(id=>({id})), [
            {h:'ID',cls:'mono',render:r=>esc(r.id)},
            {h:'Systém',render:r=>link(r.id)},
            {h:'',render:r=>`<a class="link" href="#/dopady/${encodeURIComponent(r.id)}">⚠ dopad</a>`},
          ]) : '<div class="empty">Bez navázaného ISVS.</div>'}
        </div>
        <div class="card"><h2>Služby <span class="badge grey">${fmt(aServices.length)}</span></h2>
          ${aServices.length? table(aServices.slice(0,100), [
            {h:'Služba',render:s=>link(s.id, s.nazev)},
            {h:'Typ',render:s=>esc((s.typ||'').trim()||'—')},
            {h:'Klienti',render:s=>(s.klienti||[]).map(k=>`<span class="chip">${esc(k)}</span>`).join('')},
          ]) : '<div class="empty">Žádné služby.</div>'}
        </div>
      </div>
      <div>
        <div class="card"><h2>Toky údajů</h2>
          <div class="desc">Oprávnění mezi agendami (princip only-once). Směr: <b>zdroj (poskytuje) → příjemce (čte/zapisuje)</b>. Úroveň přístupu: <b>R</b>=čte, <b>W</b>=zapisuje (editor).</div>
          <div class="kv"><span>← Čte / bere z jiných agend</span><b>${fmt(bere.length)}</b></div>
          ${bere.slice(0,10).map(o=>`<div class="kv"><span>← čte z${o.z_reg?' '+badgeRegistr():''}</span><b>${link(o['z'])} ${rwBadges(o.rw)}</b></div>`).join('')}
          <div class="kv" style="margin-top:6px"><span>→ Poskytuje / dává jiným agendám</span><b>${fmt(dava.length)}</b></div>
          ${dava.length? dava.slice(0,10).map(o=>`<div class="kv"><span>→ poskytuje</span><b>${link(o['do'])} ${rwBadges(o.rw)}</b></div>`).join('')
              : `<div class="desc" style="margin-top:4px;font-style:italic">Tato agenda data jiným agendám neposkytuje — je primárně <b>konzument</b> (čte z registrů). Počet agend čtoucích z ní odráží evidenci v RPP a může být neúplný (k ověření). <span class="muted">Např. krizové řízení jen čte ze základních registrů.</span></div>`}
          ${(a.editor_of&&a.editor_of.length)? `<div class="kv" style="margin-top:8px"><span>${badgeEditor()} editor registru</span><b>${a.editor_of.map(id=>link(id)).join(', ')}</b></div>`:''}
          ${a.registr? `<div class="kv" style="margin-top:8px"><span>${badgeRegistr()}</span><b>Tuto agendu čte ${fmt(a.edited_by_cnt)} editorů; pro ostatní je ke čtení.</b></div>`:''}
        </div>
        <div class="card"><h2>Kdo agendu vykonává (role / kategorie OVM) <span class="badge grey">${fmt((a.kat_roles||[]).length)}</span></h2>
          <div class="desc">Role na úrovni vlády z RPP (vykonávající kategorie OVM) — kdo se účastní řešení agendy. <span class="muted">RPP eviduje výkon agendy, nikoli kompetenční roli (výkon vs. dohled/koordinace) — tu RPP principiálně nezná.</span></div>
          ${(a.kat_roles&&a.kat_roles.length)? renderRoles(a.kat_roles) : '<div class="empty">Kategorie OVM neuvedeny.</div>'}
          ${(a.kat_roles&&a.kat_roles.length)? `<div id="aradial" style="height:300px;margin-top:10px;border-radius:12px;background:radial-gradient(circle at 50% 42%,#112c57,#060f24);border:1px solid #0c1f44"></div><div class="legend"><span class="small">paprskový graf · centrum = agenda · paprsky = role/kategorie OVM dle úrovně</span></div>`:''}
        </div>
        <div class="card"><h2>Vykonávající orgány <span class="badge grey">${fmt(a.c.ovm)}</span></h2>
          <div class="desc">Řazeno dle úrovně (ústřední → kraj → obec). ${a.c.ovm>a.ovm_sample.length?`Zobrazen vzorek ${a.ovm_sample.length} z ${fmt(a.c.ovm)}.`:''}</div>
          <div id="aovmfilter" class="toolbar" style="gap:6px;flex-wrap:wrap;margin:6px 0"></div>
          <div id="aovmlist"></div>
        </div>
        <div class="card"><h2>Akce</h2>
          <div class="kv"><span>🔺 Rozpad na vazby (trojúhelník)</span><a class="link" href="#/rozpad/${encodeURIComponent(a.id)}">činnosti × hráči × hřiště →</a></div>
          <div class="kv"><span>🎯 Znalostní vrstva (CROP)</span><a class="link" href="#/znalostni/${encodeURIComponent(a.id)}">co potřebuji k rozhodnutí →</a></div>
          <div class="kv"><span>Zobrazit v grafu</span><a class="link" href="#/graf/${encodeURIComponent(a.id)}">🕸️ graf</a></div>
          <div class="kv"><span>Dopadová analýza</span><a class="link" href="#/dopady">⚠ dopady</a></div>
        </div>
      </div>
    </div>`;
  setupAgendaOvm(a);
  setupAgendaRadial(a);
}
/* B10 — vykonávající orgány v detailu agendy: filtr dle typu + řazení dle úrovně + subsumace obcí. */
function setupAgendaOvm(a){
  const fbox = byId('aovmfilter'), lbox = byId('aovmlist'); if (!fbox||!lbox) return;
  const items = (a.ovm_sample||[]).map((id,i)=>({ id, t: OVM_ABBR2TYPE[(a.ovm_t||[])[i]||'nd']||'Neurčeno', lvl: OVM_ABBR_LEVEL[(a.ovm_t||[])[i]||'nd']??7 }));
  if (!items.length){ lbox.innerHTML='<div class="empty">—</div>'; return; }
  const counts={}; items.forEach(x=>counts[x.t]=(counts[x.t]||0)+1);
  const present = Object.keys(counts).sort((x,y)=>(OVM_ABBR_LEVEL[Object.keys(OVM_ABBR2TYPE).find(k=>OVM_ABBR2TYPE[k]===x)]??7)-(OVM_ABBR_LEVEL[Object.keys(OVM_ABBR2TYPE).find(k=>OVM_ABBR2TYPE[k]===y)]??7));
  const LOCAL=new Set(['Obce','Městské části','Města a městyse']);
  let cur='Ústřední';
  fbox.innerHTML = [`<button class="btn" data-t="Ústřední">Ústřední úroveň</button>`,`<button class="btn" data-t="">Vše (${items.length})</button>`]
    .concat(present.map(t=>`<button class="btn" data-t="${esc(t)}">${esc(t)} (${counts[t]})</button>`)).join('');
  function draw(){
    let list = items;
    if (cur==='Ústřední') list = items.filter(x=>x.lvl<=2);
    else if (cur) list = items.filter(x=>x.t===cur);
    // subsumace: pokud zobrazujeme „Vše", obce/města sbalíme do souhrnu
    let note='';
    if (!cur){ const loc=list.filter(x=>LOCAL.has(x.t)); if(loc.length){ note=`<div class="desc">+ subsumováno ${loc.length} obcí/měst/MČ (rozbal filtrem výše).</div>`; list=list.filter(x=>!LOCAL.has(x.t)); } }
    lbox.innerHTML = (list.slice(0,80).map(x=>`<div class="kv"><span><span class="chip">${esc(x.t)}</span></span><b>${link(x.id)}</b></div>`).join('') || '<div class="empty">Žádné orgány tohoto typu ve vzorku.</div>')+note;
    fbox.querySelectorAll('button').forEach(b=>b.style.cssText = (b.dataset.t===cur?'padding:5px 11px;background:var(--navy);color:#fff;border-color:var(--navy)':'padding:5px 11px'));
  }
  fbox.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ cur=b.dataset.t; draw(); }));
  draw();
}
/* E20 — paprskový (radial) graf: centrum = agenda, paprsky = role/kategorie OVM dle úrovně. */
function setupAgendaRadial(a){
  const host = byId('aradial'); if (!host || !window.cytoscape || !(a.kat_roles&&a.kat_roles.length)) return;
  const els=[{data:{id:'A',label:(a.nazev||'').slice(0,34),o:0}}];
  const order=['ústřední','krajská','obecní','jiná'];
  const g={}; a.kat_roles.forEach(r=>{(g[r.lvl]=g[r.lvl]||[]).push(r);});
  order.filter(l=>g[l]).forEach(l=>{
    const lid='L_'+l; els.push({data:{id:lid,label:l,o:1,col:ROLE_COL[l]}}); els.push({data:{id:'A>'+lid,source:'A',target:lid}});
    g[l].slice(0,8).forEach((r,i)=>{ const rid='R_'+l+i; els.push({data:{id:rid,label:r.nazev.slice(0,26),o:2,col:ROLE_COL[l]}}); els.push({data:{id:lid+'>'+rid,source:lid,target:rid}}); });
  });
  cytoscape({ container:host, elements:els, wheelSensitivity:0.2,
    style:[
      {selector:'node',style:{'background-color':e=>e.data('col')||(e.data('o')===0?'#ffffff':'#64748b'),'label':'data(label)','font-size':'9px','font-weight':600,'color':'#eaf2ff','text-outline-width':2,'text-outline-color':'#06122b','text-wrap':'wrap','text-max-width':'80px','text-valign':'bottom','text-margin-y':3,'width':e=>e.data('o')===0?44:e.data('o')===1?28:16,'height':e=>e.data('o')===0?44:e.data('o')===1?28:16,'border-width':2,'border-color':'rgba(255,255,255,.25)'}},
      {selector:'node[o=0]',style:{'background-color':'#ffffff','border-color':'#00d8ff','color':'#bfe9ff'}},
      {selector:'edge',style:{'width':1.4,'line-color':'rgba(150,200,255,.45)','curve-style':'bezier'}},
    ],
    layout:{name:'concentric', concentric:n=>3-n.data('o'), levelWidth:()=>1, minNodeSpacing:24} });
}

/* ---------- ISVS ---------- */
async function isvs(arg){
  await ensureNames(); const rows = await load('isvs');
  if (arg) return isvsDetail(rows.find(i=>i.id===arg));
  const umist = [...new Set(rows.map(r=>r.umisteni).filter(Boolean))];
  const sec = [...new Set(rows.map(r=>r.bezuroven).filter(Boolean))];
  const et = [...new Set(rows.map(r=>r.etapa).filter(Boolean))];
  await ensureImportance('isvs'); await ensureCategories('isvs');
  const isTyp = OVM_TYPES.filter(t=>rows.some(r=>r._spravce_typ===t));
  const agendovych = rows.filter(r=>r.c.agend>0).length;
  view.innerHTML = `<div class="pagehdr"><div><h1>Informační systémy (ISVS)</h1><div class="sub">${fmt(rows.length)} ISVS v registru · z toho <b>${fmt(agendovych)} agendových</b> (navázaných na agendu — srovnatelné s číslem DIA) · řazeno dle kritičnosti</div></div></div>`;
  view.insertAdjacentHTML('beforeend', srcHeader('isvs'));
  listPage({ rows, exportName:'isvs', note:DUL_BASIS.isvs,
    searchText:r=>r.nazev+' '+(r.spravce_nazev||'')+' '+(r.rodina||''),
    filters:[
      {label:'Druh', values:['agendové (navázané na agendu)','neagendové'], test:(r,v)=>v.startsWith('agendové')?r.c.agend>0:r.c.agend===0},
      {label:'Typ správce', values:isTyp, test:(r,v)=>r._spravce_typ===v},
      {...dulFilter, label:'Kritičnost'},
      {label:'Bezpečnost', values:[...sec,'neuvedeno'], test:(r,v)=> v==='neuvedeno' ? !r.bezuroven : r.bezuroven===v},
      {label:'Role', values:['registr','ISZR (sdílené rozhraní)','editor','čtenář'], test:(r,v)=>v==='registr'?r.registr:v.startsWith('ISZR')?r.iszr:v==='editor'?r.editor:(!r.registr&&!r.iszr&&!r.editor)},
      {label:'Umístění', values:umist, test:(r,v)=>r.umisteni===v},
      {label:'Etapa', values:et, test:(r,v)=>r.etapa===v},
    ],
    cols:[
      {h:'Název', render:r=>{const b=badgeRole(r);return link(r.id, r.nazev)+(b?' '+b:'');}},
      {h:dH('Rodina','Produktová rodina rozpoznaná ze slovníku známých produktů (GINIS, KEO…) nebo z přesné shody názvu u ≥2 instalací. Nepřepisuje zdroj; RPP pole „rodina" nemá. Ojedinělé názvy rodinu nedostanou.'), render:r=>r.rodina?`<span class="chip" title="${r.rodina_slovnik?'ze slovníku produktů':'shoda názvu u '+r.rodina_pocet+' instalací'}">${esc(r.rodina)}${r.rodina_pocet>1?` ·${r.rodina_pocet}`:''}</span>`:'<span class="muted">—</span>'},
      {h:dH('Typ správce','Typ instituce správce odvozený klasifikací názvu/právní formy orgánu. RPP tento typ přímo neeviduje.'), render:r=>`<span class="chip">${esc(r._spravce_typ||'—')}</span>`},
      {h:dH('Kritičnost',DUL_BASIS.isvs.replace(/<[^>]*>/g,'')), render:r=>badgeDul(r._dulezitost)},
      {h:'Bezp. úroveň (dopad)', render:r=>badgeSec(r.bezuroven)},
      {h:'Umístění', render:r=>esc(r.umisteni||'—')},
      {h:'Agend', cls:'right', render:r=>`<span class="muted" title="rozsah působnosti — informativní, ne kritičnost">${fmt(r.c.agend)}</span>`},
    ]});
}
async function isvsDetail(i){
  if (!i){ view.innerHTML='<div class="empty">Systém nenalezen.</div>'; return; }
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/isvs">Systémy</a> › ${esc(i.ident||i.id)}</div>
    ${srcHeader('isvs')}
    <div class="ehdr"><div><span class="codez">${esc(i.id)}</span><h1>${esc(i.nazev)} ${badgeRole(i)}</h1>
      <div class="meta">
        <div>Správce<b>${link(i.spravce)}</b></div>
        <div title="Provozovatel ISVS (kdo systém technicky provozuje). V RPP nepovinné — vyplněno jen u části systémů.">Provozovatel<b>${i.provozovatel?link(i.provozovatel):'<span class="badge grey">neuvedeno</span>'}</b></div>
        <div>Bezpečnostní úroveň (dopad)<b>${badgeSec(i.bezuroven)}</b></div>
        <div>Rodina produktu ${dvd('Produktová rodina rozpoznaná ze slovníku známých produktů nebo z přesné shody názvu u ≥2 instalací. RPP pole „rodina" nemá.')}<b>${i.rodina?esc(i.rodina)+(i.rodina_pocet>1?` (${i.rodina_pocet} instalací)`:''):'—'}</b></div>
        <div>Umístění<b>${esc(i.umisteni||'—')}</b></div>
        <div>Etapa<b>${esc(i.etapa||'—')}</b></div>
      </div></div>
      <div class="miniwrap"><div class="mini"><b>${fmt(i.c.agend)}</b><span>agend</span></div>
        <div class="mini"><a class="link" style="color:#7ef0ff" href="#/dopady/${encodeURIComponent(i.id)}">⚠</a><span>dopad</span></div></div>
    </div>
    <div class="grid2"><div>
      <div class="card"><h2>Charakteristika</h2><p class="small muted" style="line-height:1.6">${esc(i.char||'—')}</p></div>
      <div class="card"><h2>Podporované agendy <span class="badge grey">${fmt(i.c.agend)}</span></h2>
        ${i.agendy.length? table(i.agendy.slice(0,300).map(id=>({id})),[
          {h:'ID',cls:'mono',render:r=>esc(r.id)},{h:'Agenda',render:r=>link(r.id)}]) : '<div class="empty">—</div>'}
      </div></div>
      <div><div class="card"><h2>Parametry</h2>
        <div class="kv"><span>Identifikátor</span><b>${esc(i.ident||'—')}</b></div>
        <div class="kv"><span>Bezp. úroveň (dopad)</span><b>${badgeSec(i.bezuroven)}</b></div>
        <div class="kv"><span>Role vůči registru</span><b>${i.registr?badgeRegistr()+' <span class="muted small">základní registr</span>':i.iszr?badgeIszr()+' <span class="muted small">sdílené rozhraní (není registr)</span>':i.editor?badgeEditor()+' <span class="muted small">zapisuje (W) do registru</span>':'<span class="muted">čtenář (R)</span>'}</b></div>
        <div class="kv"><span>Rodina produktu (rozšíření) ${dvd('Produktová rodina rozpoznaná ze slovníku známých produktů nebo z přesné shody názvu u ≥2 instalací. RPP pole „rodina" nemá.')}</span><b>${i.rodina?esc(i.rodina)+(i.rodina_pocet>1?` · <a class="link" href="#/isvs">${i.rodina_pocet}× nasazeno</a>`:''):'—'}</b></div>
        <div class="kv"><span>Úroveň využití</span><b>${esc(i.vyuziti||'—')}</b></div>
        <div class="kv"><span>Úroveň sdílení</span><b>${esc(i.sdileni||'—')}</b></div>
      </div>
      <div class="card"><h2>Dopadová analýza</h2><div class="desc">Co se stane při výpadku tohoto systému</div>
        <a class="btn neon" href="#/dopady/${encodeURIComponent(i.id)}">⚠ Simulovat výpadek</a></div></div>
    </div>`;
}

/* ---------- OVM ---------- */
async function ovm(arg){
  await ensureNames(); const rows = await load('ovm');
  if (arg) return ovmDetail(rows.find(o=>o.id===arg));
  await ensureOvmTypes(); await ensureImportance('ovm');
  const typyPresent = OVM_TYPES.filter(t=>rows.some(r=>r._typ===t));
  const aktivnich = rows.filter(r=>!r.zaniklo).length, zaniklych = rows.length-aktivnich;
  view.innerHTML = `<div class="pagehdr"><div><h1>Orgány veřejné moci</h1><div class="sub">${fmt(aktivnich)} aktivních${zaniklych?` · ${fmt(zaniklych)} zaniklých (skryto, filtr „Stav“)`:''} · řazeno dle počtu agend</div></div></div>`;
  view.insertAdjacentHTML('beforeend', srcHeader('ovm'));
  listPage({ rows, exportName:'ovm', note:DUL_BASIS.ovm,
    searchText:r=>r.nazev+' '+(r.ico||''),
    filters:[
      {label:'Stav', values:['aktivní','zaniklé'], default:'aktivní',
       test:(r,v)=> v==='aktivní' ? !r.zaniklo : r.zaniklo},
      {label:'Typ instituce', values:typyPresent, test:(r,v)=>r._typ===v},
      dulFilter,
      {label:'Datová schránka', values:['ano','ne'], test:(r,v)=>r.ds===(v==='ano')},
    ],
    cols:[
      {h:'IČO',cls:'mono',render:r=>esc(r.ico||'—')},
      {h:'Název',render:r=>link(r.id, r.nazev)},
      {h:dH('Typ instituce','Typ instituce odvozený klasifikací názvu/právní formy. RPP tuto kategorii přímo neeviduje.'),render:r=>`<span class="chip">${esc(r._typ||'—')}</span>`},
      {h:dH('Důležitost',DUL_BASIS.ovm.replace(/<[^>]*>/g,'')),render:r=>badgeDul(r._dulezitost)},
      {h:'Právní forma',render:r=>naIf(r.forma)},
      {h:'Agend',cls:'right',render:r=>fmt(r.c.agend)},
      {h:'ISVS',cls:'right',render:r=>fmt(r.c.isvs)},
    ]});
}
async function ovmDetail(o){
  if (!o){ view.innerHTML='<div class="empty">Orgán nenalezen.</div>'; return; }
  const isvsRows = await load('isvs');
  const managed = isvsRows.filter(i=>i.spravce===o.id);
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/ovm">Orgány</a> › ${esc(o.ico||'')}</div>
    <div class="ehdr"><div><span class="codez">${esc(o.id)}</span><h1>${esc(o.nazev)}</h1>
      <div class="meta"><div>IČO<b>${esc(o.ico||'—')}</b></div>
        <div>Právní forma<b>${esc(o.forma||'—')}</b></div>
        <div>Datová schránka<b>${o.ds?'ano':'ne'}</b></div>
        <div>Stav<b>${o.zaniklo?`zaniklý${o.ukonceni?' ('+esc(o.ukonceni)+')':''}`:'aktivní'}</b></div></div>
      <div style="margin-top:10px;position:relative">${(o.kategorie||[]).map(k=>`<span class="chip">${esc(k)}</span>`).join('')}</div></div>
      <div class="miniwrap"><div class="mini"><b>${fmt(o.c.agend)}</b><span>agend</span></div>
        <div class="mini"><b>${fmt(o.c.isvs)}</b><span>ISVS</span></div></div>
    </div>
    <div class="grid2"><div>
      <div class="card"><h2>Vykonávané agendy <span class="badge grey">${fmt(o.c.agend)}</span></h2>
        <div class="desc">${o.c.agend>o.agendy_sample.length?`zobrazeno ${o.agendy_sample.length} z ${fmt(o.c.agend)}`:''}</div>
        ${o.agendy_sample.length? table(o.agendy_sample.map(id=>({id})),[
          {h:'ID',cls:'mono',render:r=>esc(r.id)},{h:'Agenda',render:r=>link(r.id)}]) : '<div class="empty">—</div>'}
      </div></div>
      <div><div class="card"><h2>Spravované systémy <span class="badge grey">${fmt(managed.length)}</span></h2>
        ${managed.length? table(managed.slice(0,100),[
          {h:'Systém',render:r=>link(r.id,r.nazev)},{h:'Bezp.',render:r=>badgeSec(r.bezuroven)}]) : '<div class="empty">Žádné spravované ISVS.</div>'}
      </div></div>
    </div>`;
}

/* ---------- SLUŽBY ---------- */
async function sluzby(arg){
  await ensureNames(); const rows = await load('sluzby');
  if (arg) return sluzbaDetail(rows.find(s=>s.id===arg));
  const typy = [...new Set(rows.map(r=>(r.typ||'').trim()).filter(Boolean))];
  await ensureImportance('sluzby'); await ensureCategories('sluzby');
  const slKat = AGENDA_CAT_NAMES.concat(['(bez agendy)']).filter(c=>rows.some(r=>r._kat===c));
  view.innerHTML = `<div class="pagehdr"><div><h1>Služby</h1><div class="sub">${fmt(rows.length)} služeb veřejné správy</div></div></div>`;
  view.insertAdjacentHTML('beforeend', srcHeader('sluzby'));
  listPage({ rows, exportName:'sluzby', note:DUL_BASIS.sluzby,
    searchText:r=>r.nazev,
    filters:[
      {label:'Kategorie', values:slKat, test:(r,v)=>r._kat===v},
      {label:'Typ', values:typy, test:(r,v)=>(r.typ||'').trim()===v},
      dulFilter,
    ],
    cols:[
      {h:'Služba',render:r=>link(r.id, r.nazev)},
      {h:dH('Kategorie','Tematická oblast odvozená z agendy služby. RPP tematickou kategorii nemá.'),render:r=>`<span class="chip">${r._kat?esc(r._kat):na()}</span>`},
      {h:'Agenda',render:r=>r.agenda?link(r.agenda):na()},
      {h:dH('Důležitost',DUL_BASIS.sluzby.replace(/<[^>]*>/g,'')),render:r=>badgeDul(r._dulezitost)},
      {h:'Typ',render:r=>esc((r.typ||'').trim()||'—')},
      {h:'Klienti',render:r=>(r.klienti||[]).map(k=>`<span class="chip">${esc(k)}</span>`).join('')},
      {h:'Úkonů',cls:'right',render:r=>fmt(r.ukony)},
    ]});
}
/* poskytovatel služby může být OVM (orgán-veřejné-moci/…) nebo KATEGORIE OVM
   (kategorie-ovm/…); kategorie znamená „poskytuje orgán spadající do této kategorie
   dle místní příslušnosti". Dřív se zobrazoval jen syrový kód → vypadalo to prázdně. */
function provLink(id){
  if (!id) return '';
  if (id.startsWith('kategorie-ovm/')){
    const nm = (NAMES.kat && NAMES.kat[id]) || id;
    return `<span class="chip" title="Kategorie OVM — poskytovatelem je kterýkoli orgán spadající do této kategorie (dle místní příslušnosti).">${esc(nm)}</span>`;
  }
  return link(id);
}
async function sluzbaDetail(s){
  if (!s){ view.innerHTML='<div class="empty">Služba nenalezena.</div>'; return; }
  const provs = (s.poskytovatele && s.poskytovatele.length) ? s.poskytovatele : (s.poskytovatel?[s.poskytovatel]:[]);
  const provHtml = provs.length
    ? provs.map(provLink).join(' ') + (s.poskytovatelu>provs.length?` <span class="muted small">+${fmt(s.poskytovatelu-provs.length)} dalších (dle místní příslušnosti)</span>`:'')
    : '<span class="badge grey">neuvedeno</span>';
  const uk = s.ukony_list||[];
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/sluzby">Služby</a> › ${esc(s.ident||'')}</div>
    ${srcHeader('sluzby')}
    <div class="ehdr"><div><span class="codez">${esc(s.id)}</span><h1>${esc(s.nazev)}</h1>
      <div class="meta"><div>Agenda<b>${s.agenda?link(s.agenda):'<span class="badge grey">neuvedeno</span>'}</b></div>
        <div>Typ<b>${(s.typ||'').trim()?esc(s.typ.trim()):na()}</b></div>
        <div title="Poskytovatel služby — orgán nebo kategorie orgánů (dle místní příslušnosti).">Poskytovatel<b>${provHtml}</b></div>
        <div>Úkonů<b>${fmt(s.ukony)}</b></div></div></div></div>
    <div class="grid2">
      <div>
        <div class="card"><h2>Popis</h2><p class="small muted" style="line-height:1.6">${esc(s.popis||'—')}</p>
          <div style="margin-top:10px">${(s.klienti||[]).map(k=>`<span class="chip">Klient: ${esc(k)}</span>`).join('')}</div></div>
      </div>
      <div>
        <div class="card"><h2>Úkony <span class="badge grey">${fmt(s.ukony)}</span></h2>
          <div class="desc">Jednotlivé úkony služby (✓ digitální · ◷ vhodný k digitalizaci).${s.ukony>uk.length?` Zobrazeno ${uk.length} z ${fmt(s.ukony)}.`:''}</div>
          ${uk.length? table(uk,[
            {h:'Úkon',render:u=>esc(u.nazev||'—')},
            {h:'Stav',render:u=>u.dig?'<span class="badge ok">✓ digitální</span>':(u.vhod?'<span class="badge warn">◷ vhodný k digitalizaci</span>':'<span class="badge grey">listinný</span>')},
          ]) : '<div class="empty">Bez evidovaných úkonů.</div>'}
        </div>
      </div>
    </div>`;
}

/* ---------- ÚDAJE ---------- */
async function udaje(arg){
  await ensureNames(); const rows = await load('udaje');
  if (arg) return udajDetail(rows.find(u=>u.id===arg));
  await ensureImportance('udaje'); await ensureCategories('udaje');
  const udKat = AGENDA_CAT_NAMES.concat(['(bez agendy)']).filter(c=>rows.some(r=>r._kat===c));
  view.innerHTML = `<div class="pagehdr"><div><h1>Katalog údajů</h1><div class="sub">${fmt(rows.length)} objektů údajů</div></div></div>`;
  view.insertAdjacentHTML('beforeend', srcHeader('udaje'));
  listPage({ rows, exportName:'udaje', note:DUL_BASIS.udaje,
    searchText:r=>r.nazev+' '+r.kod,
    filters:[
      {label:'Kategorie', values:udKat, test:(r,v)=>r._kat===v},
      {...dulFilter, label:'Rozsah'},
    ],
    cols:[
      {h:'Kód',cls:'mono',render:r=>esc(r.kod)},
      {h:'Objekt / subjekt',render:r=>link(r.id, r.nazev)},
      {h:dH('Kategorie','Tematická oblast odvozená z agendy údaje. RPP tematickou kategorii nemá.'),render:r=>`<span class="chip">${r._kat?esc(r._kat):na()}</span>`},
      {h:dH('Rozsah',DUL_BASIS.udaje.replace(/<[^>]*>/g,'')),render:r=>`<span title="pásmo dle počtu dílčích údajů — rozsah, ne sémantická důležitost">${badgeDul(r._dulezitost)}</span>`},
      {h:'Agenda',render:r=>r.agenda?link(r.agenda):na()},
      {h:'Údajů',cls:'right',render:r=>fmt((r.udaje||[]).length)},
    ]});
}
async function udajDetail(u){
  if (!u){ view.innerHTML='<div class="empty">Údaj nenalezen.</div>'; return; }
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/udaje">Údaje</a> › ${esc(u.kod)}</div>
    <div class="ehdr"><div><span class="codez">${esc(u.id)}</span><h1>${esc(u.nazev)}</h1>
      <div class="meta"><div>Agenda<b>${u.agenda?link(u.agenda):na()}</b></div><div>Počet údajů<b>${fmt((u.udaje||[]).length)}</b></div></div></div></div>
    <div class="card"><h2>Jednotlivé údaje</h2>
      ${table((u.udaje||[]),[
        {h:'Kód',cls:'mono',render:d=>esc(d.kod)},
        {h:'Název',render:d=>esc(d.nazev)},
        {h:'Typ',render:d=>esc(d.typ||'—')},
        {h:'Veřejný',render:d=>d.verejny?'<span class="badge ok">veřejný</span>':'<span class="badge grey">neveřejný</span>'},
        {h:'Sdílen na PPDF',render:d=>naIf(d.ppdf)},
      ])}
    </div>`;
}

/* ---------- OPRÁVNĚNÍ / TOKY ---------- */
async function opravneni(arg){
  await ensureNames(); const rows = await load('opravneni');
  await ensureImportance('opravneni'); await ensureCategories('opravneni');
  const opKat = AGENDA_CAT_NAMES.concat(['(bez agendy)']).filter(c=>rows.some(r=>r._kat===c));
  view.innerHTML = `<div class="pagehdr"><div><h1>Oprávnění / Toky údajů</h1><div class="sub">${fmt(rows.length)} oprávnění mezi agendami (princip only-once) · směr zdroj→příjemce, R=čte / W=zapisuje</div></div></div>`;
  view.insertAdjacentHTML('beforeend', srcHeader('opravneni_k_udajum'));
  listPage({ rows, exportName:'opravneni', note:DUL_BASIS.opravneni,
    searchText:r=>nameOf(r['z'])+' '+nameOf(r['do']),
    filters:[
      {label:'Kategorie (příjemce)', values:opKat, test:(r,v)=>r._kat===v},
      dulFilter,
      {label:'Referenční rozhraní', values:['ano','ne'], test:(r,v)=>r.ref===(v==='ano')},
      {label:'Přístup', values:['W (editor)','R (čtení)'], test:(r,v)=>v.startsWith('W')?r.w:!r.w},
      {label:'Zdroj registr', values:['ano','ne'], test:(r,v)=>r.z_reg===(v==='ano')},
    ],
    cols:[
      {h:'Zdroj (poskytuje) – z agendy',render:r=>link(r['z'])+(r.z_reg?' '+badgeRegistr():'')},
      {h:'→',render:()=>'<span class="muted">poskytuje →</span>'},
      {h:'Příjemce (čte/zapisuje) – do agendy',render:r=>link(r['do'])},
      {h:dH('Kategorie','Tematická oblast odvozená z agendy příjemce. RPP tematickou kategorii nemá.'),render:r=>`<span class="chip">${r._kat?esc(r._kat):na()}</span>`},
      {h:dH('Důležitost',DUL_BASIS.opravneni.replace(/<[^>]*>/g,'')),render:r=>badgeDul(r._dulezitost)},
      {h:'Údajů',cls:'right',render:r=>fmt(r.pocet_udaju)},
      {h:'Přístup',render:r=>rwBadges(r.rw)||'—'},
      {h:'Ref.',render:r=>r.ref?'<span class="badge ok">ano</span>':'<span class="badge grey">ne</span>'},
    ]});
}

/* ---------- GRAF VAZEB (cytoscape) ---------- */
function typeOf(id){ const r=routeOf(id); return r==='agendy'?'agenda':r==='isvs'?'isvs':r==='ovm'?'ovm':r==='sluzby'?'sluzba':'agenda'; }
const GCOL={agenda:'#0a1f44', isvs:'#00d8ff', ovm:'#7c5cff', sluzba:'#ff2d8d'};
async function graf(arg){
  await ensureNames();
  const [agendyRows, isvsRows, sluzby, opr] = await Promise.all([load('agendy'),load('isvs'),load('sluzby'),load('opravneni')]);
  const agMap=Object.fromEntries(agendyRows.map(a=>[a.id,a]));
  const isvsMap=Object.fromEntries(isvsRows.map(i=>[i.id,i]));
  let ovmMap=null;
  const score=a=>a.c.isvs+a.c.sluzby+a.c.opr_in+a.c.opr_out;
  const rich=agendyRows.reduce((b,a)=>score(a)>score(b)?a:b, agendyRows[0]);
  const start=(arg&&routeOf(arg))?arg:rich.id;
  view.innerHTML=`<div class="pagehdr"><div><h1>Graf vazeb</h1><div class="sub">Klikni na uzel a graf se rozbalí o jeho sousedy · průzkum vazeb celého registru</div></div>
     <div style="display:flex;gap:8px"><input id="gsearch" class="btn" style="min-width:240px" placeholder="Hledat agendu…">
       <button class="btn" id="glayout" title="Přepnout mezi orbitálním (ego) a tokovým (zleva→doprava) rozložením">⇄ Tok L→R</button>
       <button class="btn" id="greset">↺ Reset</button></div></div>
     <div id="gselbar" class="card" style="padding:10px 14px;margin-bottom:12px;display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap"><span class="muted small" id="ghint"></span><span id="gseldetail"></span></div>
     <div id="cy"></div>
     <div class="legend"><span><i style="background:#0a1f44"></i>agenda</span><span><i style="background:#00d8ff"></i>ISVS</span><span><i style="background:#7c5cff"></i>orgán</span><span><i style="background:#ff2d8d"></i>služba</span><span><i style="background:#00d8ff;height:3px"></i>tok R (čte)</span><span><i style="background:#ff2d8d;height:3px"></i>tok W (zapisuje/editor)</span><span><i style="background:#86ff00;height:3px"></i>gestor</span><span class="small">· šipka = směr toku (zdroj→příjemce)</span></div>`;
  byId('cy').style.background='radial-gradient(circle at 50% 42%, #112c57, #060f24)';
  byId('cy').style.borderColor='#0c1f44';
  const cy=cytoscape({ container:byId('cy'), elements:[], wheelSensitivity:0.2,
    style:[
      {selector:'node',style:{'background-color':e=>GCOL[e.data('t')]||'#64748b','label':'data(label)','font-size':'10px','font-weight':600,'color':'#eaf2ff','text-outline-width':2.5,'text-outline-color':'#06122b','text-valign':'bottom','text-margin-y':4,'text-wrap':'wrap','text-max-width':'88px','width':26,'height':26,'border-width':2,'border-color':'rgba(255,255,255,.25)'}},
      {selector:'node[t="agenda"]',style:{'background-color':'#ffffff','border-color':'#00d8ff','border-width':3,'color':'#bfe9ff','width':34,'height':34}},
      {selector:'node.hub',style:{'width':56,'height':56,'border-width':4,'border-color':'#00d8ff','background-color':'#ffffff'}},
      {selector:'node.gestor',style:{'border-color':'#86ff00','border-width':4}},
      {selector:'node.sel',style:{'border-color':'#86ff00','border-width':4}},
      {selector:'edge',style:{'width':1.6,'curve-style':'bezier','target-arrow-shape':'triangle','arrow-scale':0.8,'opacity':0.75,
        'line-color':e=>GCOL[e.data('t')]||'#64748b','target-arrow-color':e=>GCOL[e.data('t')]||'#64748b'}},
      {selector:'edge[t="flowr"]',style:{'line-color':'#00d8ff','target-arrow-color':'#00d8ff','line-style':'dashed'}},
      {selector:'edge[t="floww"]',style:{'line-color':'#ff2d8d','target-arrow-color':'#ff2d8d','width':2.4}},
      {selector:'edge[t="gestor"]',style:{'line-color':'#86ff00','target-arrow-color':'#86ff00','width':2.6}},
    ],
    layout:{name:'preset'} });
  let gmode='ego';   // D17 — 'ego' (orbitální/cose) | 'flow' (tokové L→R)
  window.__cy=cy;
  const have=new Set(), expanded=new Set();
  function node(id,t){ if(have.has(id))return; have.add(id); cy.add({data:{id,label:(nameOf(id)||id).slice(0,46),t:t||typeOf(id)}}); }
  function edge(s,t,kind){ const id=s+'~'+t; if(cy.getElementById(id).nonempty())return; if(!have.has(s)||!have.has(t))return; cy.add({data:{id,source:s,target:t,t:kind}}); }
  async function expand(id){
    if(expanded.has(id))return; expanded.add(id);
    if(id.startsWith('agenda/')){ const a=agMap[id]; if(!a)return;
      a.isvs.slice(0,6).forEach(x=>{node(x,'isvs');edge(id,x,'isvs');});
      sluzby.filter(s=>s.agenda===id).slice(0,6).forEach(s=>{node(s.id,'sluzba');edge(id,s.id,'sluzba');});
      // D16/D18 — gestor (ohlašovatel) zvýrazněný jako kořen, pak vzorek OVM dle úrovně
      if(a.ohlasovatel){ node(a.ohlasovatel,'ovm'); edge(a.ohlasovatel,id,'gestor'); const gn=cy.getElementById(a.ohlasovatel); if(gn.nonempty()) gn.addClass('gestor'); }
      (a.ovm_sample||[]).slice(0,6).forEach(x=>{node(x,'ovm');edge(id,x,'ovm');});
      // C13 — toky barevně dle R/W (zdroj→příjemce); W = editor (pink), R = čtení (cyan)
      opr.filter(o=>o.z===id).slice(0,6).forEach(o=>{node(o.do,'agenda');edge(id,o.do,o.w?'floww':'flowr');});
      opr.filter(o=>o.do===id).slice(0,6).forEach(o=>{node(o.z,'agenda');edge(o.z,id,o.w?'floww':'flowr');});
    } else if(id.startsWith('isvs/')){ const i=isvsMap[id]; if(!i)return;
      (i.agendy||[]).slice(0,8).forEach(x=>{node(x,'agenda');edge(x,id,'isvs');});
    } else if(id.startsWith('orgán')){ if(!ovmMap){ovmMap=Object.fromEntries((await load('ovm')).map(o=>[o.id,o]));}
      const o=ovmMap[id]; if(!o)return; (o.agendy_sample||[]).slice(0,8).forEach(x=>{node(x,'agenda');edge(x,id,'ovm');});
    } else if(id.startsWith('služba/')){ const s=sluzby.find(s=>s.id===id);
      if(s&&s.agenda){node(s.agenda,'agenda');edge(s.agenda,s.id,'sluzba');} }
  }
  function relayout(){
    if(gmode==='flow'){
      // D17 — tokové rozložení „kdo dává → kdo bere" (breadthfirst otočený do vodorovna)
      cy.layout({name:'breadthfirst',directed:true,animate:true,animationDuration:450,padding:40,spacingFactor:1.05,
        roots:cy.nodes('.hub'), transform:(n,p)=>({x:p.y,y:p.x})}).run();
    } else {
      cy.layout({name:'cose',animate:true,animationDuration:450,idealEdgeLength:105,nodeRepulsion:12000,edgeElasticity:110,gravity:0.25,padding:40,randomize:false}).run();
    }
  }
  // keep only nodes reachable from the current hub (drops the disconnected side after a cut)
  function pruneToHub(){ const hub=cy.nodes('.hub'); if(hub.empty())return;
    const keep=new Set([hub[0].id()]); const q=[hub[0]];
    while(q.length){ const nn=q.pop(); nn.neighborhood('node').forEach(m=>{ if(!keep.has(m.id())){keep.add(m.id());q.push(m);} }); }
    cy.nodes().forEach(nn=>{ if(!keep.has(nn.id())){ have.delete(nn.id()); expanded.delete(nn.id()); nn.remove(); } }); }
  function removeBranch(id){ const n=cy.getElementById(id); if(n.empty()||n.hasClass('hub'))return;
    have.delete(id); expanded.delete(id); n.remove(); pruneToHub(); relayout(); byId('gseldetail').innerHTML=''; }
  function updateSel(id){ cy.nodes().removeClass('sel'); const n=cy.getElementById(id); n.addClass('sel');
    byId('gseldetail').innerHTML=`<b>${esc(nameOf(id))}</b> &nbsp;<a class="link" href="#/${routeOf(id)}/${encodeURIComponent(id)}">detail →</a>`
      + (n.hasClass('hub')?'':` &nbsp;<button class="btn" id="grm" style="padding:4px 10px">✕ odebrat větev</button>`);
    const rm=byId('grm'); if(rm) rm.addEventListener('click',()=>removeBranch(id)); }
  function focus(id){ cy.nodes().removeClass('hub'); cy.getElementById(id).addClass('hub'); cy.animate({center:{eles:cy.getElementById(id)}},{duration:380}); }
  async function reset(centerId){ cy.elements().remove(); have.clear(); expanded.clear();
    node(centerId); await expand(centerId); cy.getElementById(centerId).addClass('hub'); relayout(); updateSel(centerId);
    byId('ghint').innerHTML='Klik na uzel = <b>přesun fokusu + rozbalení</b> · klik na hranu = <b>přeříznout</b> (odpadne odpojená strana) · pravý klik na uzel = <b>odebrat větev</b>'; }
  cy.on('tap','node', async e=>{ const id=e.target.id(); await expand(id); focus(id); relayout(); updateSel(id); });
  cy.on('tap','edge', e=>{ e.target.remove(); pruneToHub(); relayout(); });
  cy.on('cxttap','node', e=>{ removeBranch(e.target.id()); });
  byId('greset').addEventListener('click',()=>reset(start));
  byId('glayout').addEventListener('click',e=>{ gmode = gmode==='ego'?'flow':'ego'; e.target.textContent = gmode==='flow'?'⇄ Ego (orbit)':'⇄ Tok L→R'; relayout(); });
  let t; byId('gsearch').addEventListener('input', e=>{ clearTimeout(t); t=setTimeout(()=>{ const q=e.target.value.toLowerCase(); if(q.length<3)return; const hit=agendyRows.find(a=>a.nazev.toLowerCase().includes(q)); if(hit) reset(hit.id); },300); });
  await reset(start);
}

/* ---------- DOPADY & KASKÁDY ---------- */
const ORDC=['#7a0f3d','#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22d3ee','#7c5cff'];
/* F22/F23 — typ závislosti na výpadku registru:
   • MĚKKÁ: úřad drží lokální kopii záznamů + dostává notifikace (změna/úmrtí/přestěhování)
     → výpadek registru toleruje dny (úřad jede dál). Většina úřadů.
   • TVRDÁ (živá): žádná vlastní DB, životně závislé na živém připojení do ROB/ROS/registru
     vozidel → výpadek = okamžitá ztráta schopnosti. Policie, soudy, IZS/hasiči, checkpointy,
     hraniční/cizinecká kontrola (Lukeš, ř. 467–469). ROB je pilíř celé státní správy. */
const LIVE_RE = /polici|soud|státní zastupitel|hasič|záchran|\bizs\b|hranic|cizineck|checkpoint|krizov|vozidel|silničního provozu/i;
function liveDependent(x){ const n = (x && (x.nazev||x.label)) || x || ''; return LIVE_RE.test(String(n)); }
async function dopady(arg){
  await ensureNames(); const isvsRows = await load('isvs'); const agendyRows = await load('agendy');
  const opr = await load('opravneni');
  const agById = Object.fromEntries(agendyRows.map(a=>[a.id,a]));
  // F22/F23 — KASKÁDA SE ŠÍŘÍ JEN PO ČTECÍCH HRANÁCH (recenze: „máš obráceně směr").
  // Výpadek ZDROJE (z) zasáhne ty, kdo z něj ČTOU (do s úrovní R/H/N). Čistě zápisové (W)
  // oprávnění = editor zapisuje do registru; jeho výpadek kaskádu NEŠÍŘÍ — jen daný registr
  // nedostane aktualizaci z tohoto místa, „zbytek světa" čte dál poslední stav.
  const dependents = {};
  opr.forEach(o=>{
    if(!(o['do']&&o['z'])) return;
    const rw=o.rw||[];
    const reads = rw.length===0 || rw.some(t=>/[RHN]/.test(t));   // R=čte, H=historie, N=notifikace
    if(!reads) return;                                            // čistě W (editor) → nešíří
    (dependents[o['z']]=dependents[o['z']]||[]).push(o['do']);
  });
  // default epicentrum = základní registr (ROB je „pilíř"); jinak ústřední/málo-agendový systém
  let defId;
  if (!arg){
    const reg = isvsRows.find(i=>i.registr && i.bez_rank>=4 && /obyvatel/i.test(i.nazev))
             || isvsRows.find(i=>i.registr && i.bez_rank>=4) || isvsRows.find(i=>i.registr);
    if (reg) defId = reg.id;
    else {
      const topAg = agendyRows.reduce((b,a)=>a.c.opr_out>b.c.opr_out?a:b, agendyRows[0]);
      const cand = isvsRows.filter(i=>(i.agendy||[]).includes(topAg.id) && i.c.agend>=1 && i.c.agend<=15).sort((a,b)=>a.c.agend-b.c.agend);
      defId = (cand[0] || isvsRows.filter(i=>i.c.agend>=1 && i.c.agend<=6)[0] || isvsRows[0]).id;
    }
  }
  const start = arg || defId;
  const sys = isvsRows.find(i=>i.id===start) || isvsRows[0];
  let depth = Math.min(Math.max(window.__dDepth||3,1),7);
  view.innerHTML = `
    <div class="pagehdr"><div><h1>Dopady &amp; kaskády</h1>
      <div class="sub">Simulace výpadku systému a propagace přes oprávnění. Kaskáda <b>nelze počítat čistě mechanicky</b> — rozlišujeme <b>tvrdou (živou)</b> závislost (okamžitý pád) od <b>měkké</b> (lokální kopie + notifikace, systém běží dál). Zvol časový horizont i hloubku.</div></div></div>
    <div class="card"><div class="toolbar">
      <span class="muted small">Co vypadne (systém):</span>
      <input id="dfilter" class="btn" style="min-width:200px" placeholder="🔍 hledat systém podle názvu…">
      <select id="dsel" class="grow"></select>
      <span class="muted small" style="margin-left:8px">Časový horizont:</span>
      <span id="dhorizon" style="display:inline-flex;gap:4px"></span>
      <span class="muted small" style="margin-left:8px">Hloubka kaskády:</span>
      <span id="ddepth" style="display:inline-flex;gap:4px"></span>
    </div></div>
    <div id="dbody"></div>`;
  // #13 — picker s hledáním: 12 tis. systémů se nevejde do roletky, proto filtr podle názvu.
  function buildOptions(q){
    q=(q||'').trim().toLowerCase();
    const all = q ? isvsRows.filter(i=>i.nazev.toLowerCase().includes(q)) : isvsRows;
    const shown = all.slice(0,400);
    if(!shown.some(i=>i.id===start)){ const cur=isvsRows.find(i=>i.id===start); if(cur) shown.unshift(cur); }
    byId('dsel').innerHTML = shown.map(i=>`<option value="${esc(i.id)}" ${i.id===start?'selected':''}>${esc(i.nazev)} · ${i.c.agend} agend</option>`).join('')
      + (all.length>shown.length?`<option disabled>… ${fmt(all.length-shown.length)} dalších — zúžit hledání</option>`:'');
  }
  buildOptions('');
  let _df; byId('dfilter').addEventListener('input', e=>{ clearTimeout(_df); _df=setTimeout(()=>buildOptions(e.target.value),200); });
  byId('dsel').addEventListener('change', e=>{ location.hash = '#/dopady/'+encodeURIComponent(e.target.value); });
  // F22/F23 — časový horizont: okamžitě → padají jen tvrdé (živé) závislosti;
  // s časem se vyčerpají lokální kopie/notifikace a přidají se i měkké.
  const HORIZONS = [['Okamžitě','now'],['1 hodina','1h'],['1 den','1d'],['1 týden','1w']];
  let horizon = window.__dHorizon || '1d';
  function renderDepthCtl(){
    byId('dhorizon').innerHTML = HORIZONS.map(([lbl,v])=>
      `<button class="btn" data-h="${v}" style="padding:6px 12px;${horizon===v?'background:var(--navy);color:#fff;border-color:var(--navy)':''}">${lbl}</button>`).join('');
    byId('dhorizon').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ horizon=b.dataset.h; window.__dHorizon=horizon; draw(); }));
    byId('ddepth').innerHTML = [1,2,3,4,5,'Max'].map(d=>{
      const val = d==='Max'?7:d; const on = (d==='Max'? depth>=7 : depth===d);
      return `<button class="btn" data-d="${val}" style="padding:6px 12px;${on?'background:var(--navy);color:#fff;border-color:var(--navy)':''}">${d}</button>`;
    }).join('');
    byId('ddepth').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ depth=+b.dataset.d; window.__dDepth=depth; draw(); }));
  }
  // Reálná logika (recenze, Lukeš): výpadek zdroje NEZKOSÍ čtenáře automaticky.
  //  • živě (tvrdě) závislé (police/soudy/IZS/checkpointy) → padají hned (žádná vlastní DB).
  //  • ostatní (měkké) → BĚŽÍ DÁL na lokální kopii; jen nedostávají aktualizace → s časem
  //    roste riziko nekonzistence (neověříš nově příchozí osobu, kterou v evidenci nemáš).
  function isHard(aid){ return liveDependent(agById[aid]||aid); }
  // horizont = míra rizika nekonzistence u měkkých (ne binární pád)
  const STALE = {now:0, '1h':0, '1d':1, '1w':2};   // 0 ok · 1 zastarává · 2 riziko nekonzistence
  const staleLvl = STALE[horizon] ?? 1;
  function draw(){
    renderDepthCtl();
    // BFS with parent tracking
    const order={}, parent={};
    (sys.agendy||[]).forEach(a=>{ order[a]=1; parent[a]=sys.id; });
    let frontier=(sys.agendy||[]).slice(), used=Math.min(1,depth);
    for(let d=2; d<=depth; d++){
      const next=[];
      frontier.forEach(ag=>{ (dependents[ag]||[]).forEach(c=>{ if(order[c]==null){ order[c]=d; parent[c]=ag; next.push(c);} }); });
      if(!next.length) break; frontier=next; used=d;
    }
    const impacted=Object.keys(order);
    const hard=impacted.filter(isHard);                              // padají hned (živě závislé)
    const soft=impacted.filter(a=>!isHard(a));                       // běží dál na lokální kopii
    const maxO=impacted.reduce((m,a)=>Math.max(m,order[a]),1);
    const byOrder={}; for(let k=1;k<=maxO;k++) byOrder[k]=[]; impacted.forEach(a=>byOrder[order[a]].push(a));
    const legend = [`<span><i style="background:${ORDC[0]}"></i>epicentrum</span>`].concat(
      Array.from({length:maxO},(_,k)=>`<span><i style="background:${ORDC[(k+1)%ORDC.length]}"></i>${k+1}. řád</span>`)).join('');
    const softState = staleLvl===0
      ? '<span class="badge ok">běží, data aktuální</span>'
      : staleLvl===1 ? '<span class="badge warn">běží, data zastarávají</span>'
      : '<span class="badge bad">běží, riziko nekonzistence</span>';
    byId('dbody').innerHTML = `
      <div class="ban">
        <div><div class="big" style="color:#ff8fa3">${fmt(hard.length)}</div><div class="lab">padá hned (živě závislé)</div></div>
        <div class="sep"></div><div><div class="big" style="color:#86ff00">${fmt(soft.length)}</div><div class="lab">běží dál (lokální kopie)</div></div>
        <div class="sep"></div><div><div class="big">${fmt(impacted.length)}</div><div class="lab">vazebně zasažené celkem</div></div>
        <div class="sep"></div><div><div class="big">${maxO}${maxO<depth?'':(depth>=7?'+':'')}</div><div class="lab">řádů kaskády</div></div>
      </div>
      <div id="cyd"></div>
      <div class="legend">${legend}<span class="small">· klik na uzel = detail · ✦ = živě závislé (padá hned)</span></div>
      ${sys.editor && !sys.registr?`<div class="gap" style="margin-top:14px;border-left:4px solid #ff8fa3;background:#2a1020;color:#ffd9e3">✎ <b>Epicentrum je editor registru.</b> Jeho výpadek znamená, že do registru se z tohoto úřadu <b>nezapisují aktualizace</b> — ostatní systémy fungují dál a čtou poslední platný stav. Kaskáda je proto <b>omezená</b> (nešíří se po zápisových hranách).</div>`:''}
      ${sys.iszr?`<div class="gap" style="margin-top:14px;border-left:4px solid #7ef0ff;background:#0a1f44;color:#dbe9ff">⬡ <b>Epicentrum je sdílené rozhraní ISZR</b> (není registr). Jeho výpadek přeruší zprostředkovaný přístup k registrům — živě připojené systémy bez vlastní kopie jsou zasaženy hned, ostatní jedou na lokální kopii.</div>`:''}
      ${sys.registr?`<div class="gap" style="margin-top:14px;border-left:4px solid #7ef0ff;background:#0a1f44;color:#dbe9ff">⬢ <b>Epicentrum je základní registr.</b> Výpadek <b>automaticky nezkosí</b> navázané systémy — většina drží vlastní kopii kmene a běží dál; jen <b>neověří nově příchozí</b> osobu/subjekt, který v evidenci nemá. Okamžitě padají jen <b>živě připojené</b> (policie, soudy, IZS, checkpointy) bez vlastní DB.</div>`:''}
      <div class="gap" style="margin-top:14px">⚠ <b>Kaskádu nelze počítat jen z hran grafu.</b> Šíří se <b>jen po čtecích (R) hranách</b>; zápisové (W, editor) se nepropagují. Reálný dosah bývá <b>menší</b> (lokální kopie + notifikace), ale i <b>větší</b> (RPP nezachycuje cloudové/živé závislosti). Horizont <b>${esc(HORIZONS.find(h=>h[1]===horizon)?.[0]||horizon)}</b>: živě závislé jsou mimo provoz, měkké ${softState.replace(/<[^>]+>/g,'').toLowerCase()}. Bezp. úroveň epicentra: <b>${esc(sys.bezuroven||'neuvedeno')}</b>.</div>
      <div class="card"><h2>Tabulka dopadů <span class="small muted">(${fmt(impacted.length)} agend, ${maxO} řádů)</span></h2>
        ${table(impacted.sort((a,b)=>order[a]-order[b]).slice(0,300).map(a=>({a})),[
          {h:'Řád',render:r=>`<span class="badge grey" style="background:${ORDC[order[r.a]%ORDC.length]}22;color:${ORDC[order[r.a]%ORDC.length]}">${order[r.a]}. řád</span>`},
          {h:'Agenda',render:r=>link(r.a)+(isHard(r.a)?' ✦':'')},
          {h:'Typ závislosti',render:r=>isHard(r.a)
              ?'<span class="badge bad" title="Živá (tvrdá) závislost — bez vlastní DB, výpadek zdroje = okamžitý pád (policie, soudy, IZS, checkpointy).">živá / tvrdá</span>'
              :'<span class="badge ok" title="Měkká závislost — lokální kopie + notifikace, systém běží dál.">lokální kopie</span>'},
          {h:'Stav v horizontu',render:r=>isHard(r.a)?'<span class="badge bad">mimo provoz</span>':softState},
          {h:'Čte z',render:r=>parent[r.a]===sys.id?'<span class="muted small">— epicentrum</span>':link(parent[r.a])},
          {h:'Služeb',cls:'right',render:r=>fmt((agById[r.a]&&agById[r.a].c.sluzby)||0)},
          {h:'Orgánů',cls:'right',render:r=>fmt((agById[r.a]&&agById[r.a].c.ovm)||0)},
        ])}
      </div>`;
    // graph: parent -> child chain, capped for readability
    const cap={1:18}; const added=new Set([sys.id]);
    const els=[{data:{id:sys.id,label:sys.nazev.slice(0,40),o:0}}];
    for(let k=1;k<=maxO;k++){
      const lim = cap[k]|| (k===1?18:10);
      byOrder[k].slice(0,lim).forEach(a=>{
        if(added.size>110) return;
        added.add(a); els.push({data:{id:a,label:(nameOf(a)||a).slice(0,40),o:k,live:liveDependent(agById[a]||a)?1:0}});
        if(added.has(parent[a])) els.push({data:{id:parent[a]+'>'+a, source:parent[a], target:a}});
      });
    }
    byId('cyd').style.background='radial-gradient(circle at 50% 42%, #112c57, #060f24)';
    byId('cyd').style.borderColor='#0c1f44';
    cytoscape({ container:byId('cyd'), elements:els, wheelSensitivity:0.2,
      style:[
        {selector:'node',style:{'background-color':e=>ORDC[e.data('o')%ORDC.length],'label':'data(label)','font-size':'10px','font-weight':600,'color':'#eaf2ff','text-outline-width':2.5,'text-outline-color':'#06122b','text-wrap':'wrap','text-max-width':'82px','width':e=>e.data('o')===0?54:24,'height':e=>e.data('o')===0?54:24,'text-valign':'bottom','text-margin-y':4,'border-width':2,'border-color':'rgba(255,255,255,.25)'}},
        {selector:'node[live=1]',style:{'border-color':'#ff2d8d','border-width':4}},
        {selector:'edge',style:{'width':1.4,'line-color':'rgba(255,150,150,.55)','curve-style':'bezier','target-arrow-shape':'triangle','target-arrow-color':'rgba(255,150,150,.55)','arrow-scale':0.8}},
      ],
      layout:{name:'concentric', concentric:n=>maxO+1-n.data('o'), levelWidth:()=>1, minNodeSpacing:34} })
      .on('tap','node',e=>{ const id=e.target.id(); const rt=routeOf(id); if(rt) location.hash='#/'+rt+'/'+encodeURIComponent(id); });
  }
  draw();
}

/* ---------- ANALYTIKA ---------- */
async function analytika(){
  const m = await load('meta');
  const cov = m.coverage;
  const mk = (obj,cls)=>{ const mx=Math.max(...Object.values(obj)); return Object.entries(obj).map(([k,v])=>bar(k.trim()||'Neuvedeno',v,mx,cls)).join(''); };
  await ensureNames();
  const fr = m.fillrate||{};
  view.innerHTML = `<div class="pagehdr"><div><h1>Analytika</h1><div class="sub">Předpřipravené sestavy nad RPP daty — podklad pro policy papery</div></div></div>
   ${srcHeader('RPP — kompletní sada')}
   <div class="card" style="border-left:4px solid var(--neon-cyan)">
     <h2>Úplnost dat (fill-rate) — příležitost pro DIA</h2>
     <div class="desc">Děravost klíčových polí je sama o sobě analytický výstup: ukazuje, kde data doplnit, aby vznikl úplný obraz. Podáváme jako <b>analýzu rizik a nástroj pro správce (DIA)</b>, ne jako audit chyb.</div>
     ${bar('Bezpečnostní úroveň uvedena', fr.bezuroven||0, 100, (fr.bezuroven||0)<50?'pink':'')}
     ${bar('Umístění uvedeno', fr.umisteni||0, 100, 'lime')}
     ${bar('Náklady uvedeny', fr.naklady||0, 100, 'grey')}
     <div class="gap" style="margin-top:10px">ℹ Náklady jsou vyplněny jen u ~${fr.naklady||1} % systémů — <b>neporovnatelné</b>, proto podle nich nic neřadíme. Správcem RPP je DIA; fill-rate je governance téma, ne chyba aplikace.</div>
   </div>
   <div class="grid2">
     <div class="card"><h2>Bezpečnostní úroveň ISVS <span class="small muted">škála dopadu (4 = kritická)</span></h2><div class="desc">Uvedeno u ${Math.round((m.counts.isvs-(m.isvs_bezuroven['Neuvedeno']||0))/m.counts.isvs*100)}% systémů. Vyšší úroveň = vyšší dopad (registry = 4).</div>${mk(m.isvs_bezuroven)}</div>
     <div class="card"><h2>Umístění (cloud vs. on-prem)</h2>${mk(m.isvs_umisteni,'lime')}</div>
     <div class="card"><h2>Fáze životního cyklu</h2>${mk(m.isvs_etapa)}</div>
     <div class="card"><h2>Služby podle typu</h2>${mk(m.sluzby_typ,'pink')}</div>
   </div>
   <div class="card"><h2>Nejkritičtější systémy <span class="small muted">dle dopadu (registr · bezp. úroveň · správce)</span></h2>
     <div class="desc">Kritičnost = dopad, ne počet agend. Nahoře základní registry (pilíře státu).</div>
     ${table(m.top_critical,[
       {h:'Systém',render:r=>link(r.id,r.nazev)+(r.registr?' '+badgeRegistr():'')},
       {h:'Důvod',render:r=>`<span class="chip">${esc(r.duvod||'—')}</span>`},
       {h:'Správce',render:r=>esc(r.spravce||'—')},
       {h:'Bezp.',render:r=>badgeSec(r.bezuroven)},
       {h:'Agend',cls:'right',render:r=>`<span class="muted">${fmt(r.agend)}</span>`},
       {h:'',render:r=>`<a class="link" href="#/dopady/${encodeURIComponent(r.id)}">⚠ dopad</a>`}])}
   </div>
   <div class="card"><h2>Hranice RPP — co data principiálně neobsahují</h2>
     <div class="desc">Aby prezentace odpovídala datům, je férové uvést, co RPP nezachycuje (mezery k doplnění z jiných zdrojů / pro diskusi s DIA):</div>
     <div class="kv"><span>Kompetenční role (výkon vs. dohled/koordinace)</span><b>RPP eviduje jen přístup k datům — kompetenční roli je nutné doplnit z činností (§) / kompetenčního zákona.</b></div>
     <div class="kv"><span>Schvalování oprávnění</span><b>RPP zachycuje jen schválená oprávnění; čekající/zablokovaná (i kvůli jednomu úřadu) nejsou vidět — chybějící hrana ≠ neexistující závislost.</b></div>
     <div class="kv"><span>Číselník názvů ISVS</span><b>RPP nemá registrační číselník produktů — sjednocujeme mapovací vrstvou (rodina), bez přepisu zdroje.</b></div>
     <div class="kv"><span>Cloudové a živé závislosti</span><b>Nezachyceny — dopadová analýza je proto indikativní (viz Dopady &amp; kaskády).</b></div>
   </div>`;
}

/* ---------- SROVNÁNÍ ---------- */
const CMP_COLORS = [
  'linear-gradient(90deg,#00d8ff,#7c5cff)',
  'linear-gradient(90deg,#ff2d8d,#ff7eb3)',
  'linear-gradient(90deg,#3ad900,#86ff00)',
  'linear-gradient(90deg,#ff9f1c,#ffd166)',
  'linear-gradient(90deg,#7c5cff,#b39dff)',
  'linear-gradient(90deg,#06d6a0,#83f5d6)',
  'linear-gradient(90deg,#ef476f,#ff8fa3)',
  'linear-gradient(90deg,#118ab2,#5fc7e8)',
];
function cmpBar(label, val, max, color){
  const pct = max ? Math.round(val/max*100) : 0;
  return `<div class="cmpbar"><div class="lbl" title="${esc(label)}">${esc(label)}</div><div class="track"><div class="fill" style="width:${pct}%;background:${color}"></div></div><div class="val">${fmt(val)}</div></div>`;
}
async function srovnani(){
  await ensureNames(); const rows = await load('agendy');
  const MAX = 8;
  let sel = rows.slice(0, Math.min(3, rows.length)).map(a=>a.id);
  const METRICS = [
    ['Počet agendových činností', a=>a.c.cinnosti],
    ['Informační systémy (ISVS)', a=>a.c.isvs],
    ['Poskytované služby veřejné správy', a=>a.c.sluzby],
    ['Vykonávající orgány (OVM)', a=>a.c.ovm],
    ['Oprávnění k údajům (čtení + zápis)', a=>a.c.opr_out+a.c.opr_in],
  ];
  view.innerHTML = `<div class="pagehdr"><div><h1>Srovnání agend</h1><div class="sub">Vyber až ${MAX} agend a porovnej jejich metriky</div></div></div>
    <div class="card">
      <div id="cmpsel" class="cmpsel"></div>
      <button id="cmpadd" class="btn" style="margin-top:12px">+ Přidat agendu</button>
      <div id="cmpout"></div>
    </div>`;
  function renderSelectors(){
    const host = byId('cmpsel');
    host.innerHTML = sel.map((id,i)=>`
      <div class="cmprow">
        <span class="cmpdot" style="background:${CMP_COLORS[i%CMP_COLORS.length]}"></span>
        <select class="grow cmpselbox" data-i="${i}">${rows.map(a=>`<option value="${esc(a.id)}" ${a.id===id?'selected':''}>${esc(a.nazev)}</option>`).join('')}</select>
        ${sel.length>2?`<button class="btnx" data-i="${i}" title="Odebrat">×</button>`:''}
      </div>`).join('');
    host.querySelectorAll('.cmpselbox').forEach(s=>s.addEventListener('change',e=>{ sel[+e.target.dataset.i]=e.target.value; draw(); }));
    host.querySelectorAll('.btnx').forEach(b=>b.addEventListener('click',e=>{ sel.splice(+e.currentTarget.dataset.i,1); renderSelectors(); draw(); }));
    byId('cmpadd').style.display = sel.length>=MAX ? 'none' : '';
  }
  function draw(){
    const ags = sel.map(id=>rows.find(x=>x.id===id)).filter(Boolean);
    if(!ags.length){ byId('cmpout').innerHTML=''; return; }
    byId('cmpout').innerHTML = `<div class="cmpgrid">` + METRICS.map(([lbl,fn])=>{
      const mx = Math.max(...ags.map(fn), 1);
      return `<div class="cmpmetric"><div class="cmptitle">${lbl}</div>${ags.map((a,i)=>cmpBar(a.nazev,fn(a),mx,CMP_COLORS[i%CMP_COLORS.length])).join('')}</div>`;
    }).join('') + `</div>`;
  }
  byId('cmpadd').addEventListener('click',()=>{
    if(sel.length>=MAX) return;
    const used=new Set(sel); const next=rows.find(a=>!used.has(a.id))||rows[0];
    if(next){ sel.push(next.id); renderSelectors(); draw(); }
  });
  renderSelectors(); draw();
}

/* ---------- GAP ANALÝZA: architektura státu ----------
   Hybridní pohled: (A) matice schopností — expertní benchmark CZ vs. referenční
   státy, KOTVENÝ do RPP (CZ systémy se prolinkují na reálné ISVS, pokud v open
   datech existují); (B) přebytek / duplicity — TVRDĚ z RPP dat, jen čísla bez
   hodnocení (kolik paralelních instalací téže produktové rodiny běží a u kolika
   různých správců). RPP NEobsahuje náklady — proto „instalace", ne „výdaje". */
const GAP_MAT = {
  missing:{l:'chybí',    c:'#b91c1c', bg:'#fee2e2'},
  partial:{l:'částečné', c:'#b45309', bg:'#fef3c7'},
  full:   {l:'silné',    c:'#15803d', bg:'#dcfce7'},
  leading:{l:'lídr',     c:'#0369a1', bg:'#e0f2fe'},
};
const GAP_TYPE = {
  'CHYBÍ':        {c:'#b91c1c', bg:'#fee2e2'},
  'FRAGMENTOVÁNO':{c:'#b45309', bg:'#fef3c7'},
  'DOHNAT':       {c:'#92722a', bg:'#fdf6e3'},
  'ADEKVÁTNÍ':    {c:'#15803d', bg:'#dcfce7'},
  'LÍDR':         {c:'#0369a1', bg:'#e0f2fe'},
};
/* Rámec schopností (11 vrstev). cz = zralost; sys = CZ systémy (needle = část názvu
   pro dohledání reálného ISVS v RPP, prázdné = systém není v RPP open datech, např.
   privátní BankID nebo NÚKIB); ex = zahraniční exempláře; gap = typ mezery. */
const CAPABILITIES = [
  {name:'Elektronická identita (eID)', layer:'Identita a autentizace', cz:'partial', gap:'FRAGMENTOVÁNO',
   sys:[{label:'NIA (Národní bod)', needle:'národní bod'},{label:'BankID (privátní)', needle:''},{label:'mojeID', needle:'mojeid'}],
   ex:[{flag:'🇪🇪',name:'ID-kaart'},{flag:'🇩🇰',name:'MitID'},{flag:'🇪🇺',name:'eIDAS2 Wallet'}]},
  {name:'Sběrnice výměny dat (interoperabilita)', layer:'Výměna dat', cz:'partial', gap:'DOHNAT',
   sys:[{label:'ISZR', needle:'systém základních registrů'},{label:'ISSS / eGSB', needle:'sdílené služby'}],
   ex:[{flag:'🇪🇪',name:'X-Road'},{flag:'🇪🇺',name:'OOTS'}]},
  {name:'Základní registry (autentické zdroje)', layer:'Data', cz:'full', gap:'ADEKVÁTNÍ',
   sys:[{label:'Registr obyvatel', needle:'registr obyvatel'},{label:'Registr osob', needle:'právnických osob, podnikajících'},{label:'RÚIAN', needle:'územní identifikace'}],
   ex:[{flag:'🇩🇰',name:'grunddata'},{flag:'🇳🇱',name:'basisregistraties'}]},
  {name:'Once-only + správa souhlasů', layer:'Princip jednoho podání', cz:'missing', gap:'CHYBÍ',
   sys:[{label:'USPPP (zárodek)', needle:'souhlasů a práv'}],
   ex:[{flag:'🇪🇺',name:'OOTS'},{flag:'🇪🇪',name:'Estonsko'}]},
  {name:'Jednotné platby státu (gov pay)', layer:'Transakce', cz:'missing', gap:'CHYBÍ',
   sys:[],
   ex:[{flag:'🇬🇧',name:'GOV.UK Pay'},{flag:'🇸🇬',name:'Singapur'}]},
  {name:'Doručování a notifikace', layer:'Komunikace', cz:'full', gap:'LÍDR',
   sys:[{label:'Datové schránky', needle:'datových schránek'}],
   ex:[{flag:'🇩🇰',name:'Digital Post'},{flag:'🇬🇧',name:'GOV.UK Notify'}]},
  {name:'Jednotný portál a kontaktní místa', layer:'Front-end', cz:'partial', gap:'DOHNAT',
   sys:[{label:'Portál občana', needle:'portál občana'},{label:'Czech POINT', needle:'kontaktních míst'}],
   ex:[{flag:'🇬🇧',name:'GOV.UK'},{flag:'🇸🇬',name:'LifeSG'},{flag:'🇺🇦',name:'Diia'}]},
  {name:'Katalog API / otevřená data', layer:'Data a integrace', cz:'partial', gap:'DOHNAT',
   sys:[{label:'NKOD', needle:'katalog otevřených'}],
   ex:[{flag:'🇸🇬',name:'APEX'},{flag:'🇬🇧',name:'GOV.UK API'}]},
  {name:'Registr agend + procesní modelování', layer:'Znalostní vrstva', cz:'leading', gap:'LÍDR',
   sys:[{label:'RPP', needle:'práv a povinností'}],
   ex:[{flag:'🇪🇺',name:'(málokdo má)'}]},
  {name:'Vládní cloud / sdílená infrastruktura', layer:'Infrastruktura', cz:'partial', gap:'DOHNAT',
   sys:[{label:'eGovernment cloud', needle:'eGovernment cloud'}],
   ex:[{flag:'🇬🇧',name:'UK'},{flag:'🇪🇪',name:'Estonsko'}]},
  {name:'Kyberbezpečnost / ochrana KII', layer:'Bezpečnost', cz:'full', gap:'ADEKVÁTNÍ',
   sys:[{label:'NÚKIB (mimo RPP)', needle:''}],
   ex:[{flag:'🇪🇺',name:'NIS2'}]},
];
async function gap(){
  await ensureNames();
  const isvs = await load('isvs');
  const matChip = k => { const m=GAP_MAT[k]||GAP_MAT.partial; return `<span class="chip" style="background:${m.bg};color:${m.c};border-color:${m.c}33">${m.l}</span>`; };
  const gapChip = g => { const t=GAP_TYPE[g]||GAP_TYPE['DOHNAT']; return `<span class="chip" style="background:${t.bg};color:${t.c};border-color:${t.c}33;font-weight:600">${esc(g)}</span>`; };
  const findIsvs = needle => { if(!needle) return null; const n=needle.toLowerCase(); const hit=isvs.find(i=>i.nazev && i.nazev.toLowerCase().includes(n)); return hit?hit.id:null; };
  const sysChip = s => { const id=findIsvs(s.needle); return id
    ? `<a class="chip" style="text-decoration:none" href="#/isvs/${encodeURIComponent(id)}" title="otevřít v RPP →">${esc(s.label)} ↗</a>`
    : `<span class="chip" title="není samostatně v RPP open datech">${esc(s.label)}</span>`; };

  /* souhrn mezer */
  const byGap = {}; CAPABILITIES.forEach(c=>byGap[c.gap]=(byGap[c.gap]||0)+1);

  /* Sekce B — přebytek/duplicity, čistě z dat */
  const fams = {};
  isvs.forEach(i=>{ if(!i.rodina) return; const f=fams[i.rodina]||(fams[i.rodina]={n:0,spr:new Set()}); f.n++; if(i.spravce) f.spr.add(i.spravce); });
  const spread = Object.entries(fams).map(([rodina,v])=>({rodina,inst:v.n,spravcu:v.spr.size})).filter(x=>x.inst>1).sort((a,b)=>b.inst-a.inst);
  const totRodin = spread.length;
  const totInst  = spread.reduce((s,x)=>s+x.inst,0);
  const maxInst  = spread.length?spread[0].inst:1;

  view.innerHTML = `<div class="pagehdr"><div><h1>Architektura státu — gap analýza</h1>
    <div class="sub">Co v celkové architektuře <b>chybí</b> (vs. referenční státy) a kde v RPP <b>přebývají paralelní systémy</b></div></div></div>

   <div class="card" style="border-left:4px solid #94a3b8;background:#f8fafc">
     <p class="small" style="line-height:1.7;margin:0">
     <b>Jak číst.</b> Pohled má dvě části. <b>(A) Mezery</b> = expertní srovnání schopností státu s referenčními zeměmi
     (Estonsko, Dánsko, UK, Singapur, EU rámec); je to odborný odhad, ne výpočet z RPP — kde ale CZ systém v RPP open datech
     existuje, je <b>proklik přímo na jeho detail</b> (↗). <b>(B) Přebytek</b> = <b>tvrdě z RPP dat, bez hodnocení</b>: kolik
     paralelních instalací téže produktové rodiny běží a u kolika různých správců. <b>RPP neobsahuje náklady</b> — proto
     mluvíme o počtu instalací, ne o výdajích; interpretaci (úspora vs. opodstatněná autonomie samosprávy) necháváme na čtenáři.</p>
   </div>

   <div class="kpis" style="margin-top:6px">
     <div class="kpi"><div class="v" style="color:#b91c1c">${fmt(byGap['CHYBÍ']||0)}</div><div class="l">schopnosti zcela chybí</div></div>
     <div class="kpi"><div class="v" style="color:#b45309">${fmt((byGap['DOHNAT']||0)+(byGap['FRAGMENTOVÁNO']||0))}</div><div class="l">částečné / roztříštěné</div></div>
     <div class="kpi"><div class="v" style="color:#0369a1">${fmt((byGap['LÍDR']||0)+(byGap['ADEKVÁTNÍ']||0))}</div><div class="l">silné / lídr</div></div>
     <div class="kpi"><div class="v">${fmt(totRodin)}</div><div class="l">produkt. rodin &gt;1 instalace</div></div>
     <div class="kpi"><div class="v">${fmt(totInst)}</div><div class="l">systémů v duplicitních rodinách</div></div>
   </div>

   <h2 style="margin:18px 0 6px">A · Matice schopností — co chybí</h2>
   <div class="card" style="padding:0">
     <div style="padding:10px 14px" class="muted small">Zralost: ${matChip('missing')} ${matChip('partial')} ${matChip('full')} ${matChip('leading')} &nbsp;·&nbsp; ↗ = proklik na reálný systém v RPP</div>
     ${table(CAPABILITIES, [
       {h:'Schopnost', render:c=>`<b>${esc(c.name)}</b><div class="muted small">${esc(c.layer)}</div>`},
       {h:'CZ stav', render:c=>matChip(c.cz)},
       {h:'CZ systémy v RPP', render:c=>c.sys.length? c.sys.map(sysChip).join(' ') : '<span class="muted">—</span>'},
       {h:'Zahraniční exemplář', render:c=>c.ex.map(e=>`<span class="chip" title="${esc(e.name)}">${e.flag} ${esc(e.name)}</span>`).join(' ')},
       {h:'Typ mezery', render:c=>gapChip(c.gap)},
     ])}
   </div>

   <h2 style="margin:22px 0 6px">B · Přebytek a duplicity — paralelní instalace téže rodiny</h2>
   <div class="card" style="border-left:4px solid var(--navy)">
     <p class="small muted" style="line-height:1.6;margin-top:0">Seskupeno podle produktové rodiny ${dvd('Produktová rodina je odvozená (⚙) ze slovníku známých produktů nebo z přesné shody názvu u ≥2 instalací. RPP pole „rodina" nemá.')}. <b>Počet instalací</b> = kolik samostatných ISVS téže rodiny je v registru; <b>správců</b> = u kolika různých provozovatelů. Vysoký počet instalací u nízkého počtu produktů je kandidát na sdílenou službu — <b>RPP ale nenese náklady, takže o úspoře nic netvrdíme</b>.</p>
     ${table(spread.slice(0,40), [
       {h:'Produktová rodina', render:r=>`<b>${esc(r.rodina)}</b>`},
       {h:'Instalací', cls:'num', render:r=>cmpBar(r.rodina, r.inst, maxInst, 'var(--navy)')},
       {h:'Různých správců', cls:'num', render:r=>fmt(r.spravcu)},
       {h:'', render:r=>`<a class="link" href="#/databaze/isvs~${encodeURIComponent(r.rodina)}" title="vyhledat v databázi">otevřít →</a>`},
     ])}
     <p class="small muted" style="margin-top:8px">Zobrazeno top 40 z ${fmt(totRodin)} rodin s více než jednou instalací. Plný seznam systémů: <a class="link" href="#/isvs">Systémy (ISVS)</a>.</p>
   </div>

   <div class="card" style="border-left:4px solid #94a3b8"><p class="small muted" style="margin:0;line-height:1.6"><b>Metodická poznámka.</b> Sekce A je odborný benchmark pracovní skupiny — slouží k diskusi, ne jako oficiální hodnocení státu. Vrstvy schopností i zařazení zemí lze připomínkovat (<a class="link" href="mailto:ps07@afcea.cz">ps07@afcea.cz</a>). Sekce B je čistě odvozená z veřejných open dat RPP a žádné neveřejné ani nákladové údaje nepoužívá.</p></div>`;
}

/* ---------- HLEDÁNÍ ---------- */
async function hledat(arg){
  await ensureNames();
  const q = (arg||'').trim();
  view.innerHTML = `<div class="pagehdr"><div><h1>Hledání</h1><div class="sub">Napříč agendami, systémy, orgány, službami a údaji</div></div></div>
    <div class="toolbar"><input class="grow" id="hq" placeholder="Zadej hledaný výraz…" value="${esc(q)}"></div>
    <div id="hout"></div>`;
  const run = async (term)=>{
    term = term.trim().toLowerCase();
    const out = byId('hout');
    if (term.length<2){ out.innerHTML='<div class="empty">Zadej alespoň 2 znaky.</div>'; return; }
    out.innerHTML = '<div class="loading"><span class="spin"></span>Hledám…</div>';
    const [ag,is,ov,sl,ud] = await Promise.all([load('agendy'),load('isvs'),load('ovm'),load('sluzby'),load('udaje')]);
    const grp = (title, items, render)=> items.length? `<div class="searchgroup"><h3>${title} (${fmt(items.length)})</h3>${table(items.slice(0,25),render)}</div>`:'';
    out.innerHTML =
      grp('Agendy', ag.filter(a=>(a.nazev+' '+a.kod).toLowerCase().includes(term)), [{h:'Kód',cls:'mono',render:r=>esc(r.kod)},{h:'Název',render:r=>link(r.id,r.nazev)}]) +
      grp('Systémy (ISVS)', is.filter(i=>i.nazev.toLowerCase().includes(term)), [{h:'Systém',render:r=>link(r.id,r.nazev)},{h:'Správce',render:r=>esc(r.spravce_nazev||'—')}]) +
      grp('Orgány (OVM)', ov.filter(o=>(o.nazev+' '+(o.ico||'')).toLowerCase().includes(term)), [{h:'IČO',cls:'mono',render:r=>esc(r.ico||'')},{h:'Název',render:r=>link(r.id,r.nazev)}]) +
      grp('Služby', sl.filter(s=>s.nazev.toLowerCase().includes(term)), [{h:'Služba',render:r=>link(r.id,r.nazev)},{h:'Agenda',render:r=>link(r.agenda)}]) +
      grp('Údaje', ud.filter(u=>u.nazev.toLowerCase().includes(term)), [{h:'Objekt',render:r=>link(r.id,r.nazev)},{h:'Agenda',render:r=>link(r.agenda)}])
      || '<div class="empty">Nic nenalezeno.</div>';
  };
  byId('hq').addEventListener('input', e=>{ clearTimeout(window.__ht); window.__ht=setTimeout(()=>run(e.target.value),250); });
  if (q) run(q);
}

/* ---------- ABOUT ---------- */
async function about(){
  const m = await load('meta'); const c=m.counts;
  const domains = ['Kyberbezpečnost','Krizové řízení a legislativa','Agentní AI a datová analytika','Cloud a enterprise architektura','Legal tech / právo AI','Bezpečnostní operace (SOC/CSIRT)'];
  view.innerHTML = `<div class="pagehdr"><div><h1>O projektu <span class="badge warn">zkušební verze</span></h1><div class="sub">Průzkumník nad českým Registrem práv a povinností (RPP)</div></div></div>
   <div class="card" style="border-left:4px solid var(--warn);background:#fffdf7">
     <h2>⚠ Zkušební verze — důležité upozornění</h2>
     <p class="small" style="line-height:1.7;margin-bottom:10px">Jedná se o <b>zkušební (testovací) verzi jedné z aplikací projektu kGovernment</b>, který realizuje pracovní skupina <a class="link" href="https://afcea.cz/o-nas-ps07/" target="_blank" rel="noopener">AFCEA Intelligence</a>.</p>
     <p class="small" style="line-height:1.7;margin-bottom:10px">Aplikace vychází <b>výhradně z veřejně dostupných otevřených dat (open data) z Registru práv a povinností</b>, která spravuje a publikuje Digitální a informační agentura (DIA). Nepoužíváme žádná neveřejná ani osobní data.</p>
     <p class="small" style="line-height:1.7;margin-bottom:6px">Cílem této zkušební verze je:</p>
     <ol class="small" style="line-height:1.7;margin:0 0 0 18px">
       <li>v prvé řadě <b>ověřit, zda vyvinutá prezentace informací skutečně odpovídá analyzovaným datům</b>; a</li>
       <li>v druhé řadě <b>poskytnout široké odborné veřejnosti příležitost zapojit se do diskuse o správnosti a úplnosti těchto dat</b>.</li>
     </ol>
   </div>
   <div class="card"><h2>Z čeho vychází</h2>
     <p class="muted small" style="line-height:1.6">Pouze veřejná <b>open data RPP</b> (správce DIA). Stažena kompletní datová sada (56 souborů) a přerestrukturalizována do propojené databáze. Žádná neveřejná data.</p>
     <div class="kpis" style="margin-top:14px">
       <div class="kpi"><div class="v">${fmt(c.agendy)}</div><div class="l">agend</div></div>
       <div class="kpi"><div class="v">${fmt(c.isvs)}</div><div class="l">systémů</div></div>
       <div class="kpi"><div class="v">${fmt(c.ovm)}</div><div class="l">orgánů</div></div>
       <div class="kpi"><div class="v">${fmt(c.sluzby)}</div><div class="l">služeb</div></div>
       <div class="kpi"><div class="v">${fmt(c.opravneni)}</div><div class="l">oprávnění</div></div>
       <div class="kpi"><div class="v">${fmt(c.pusobnost)}</div><div class="l">vazeb</div></div>
     </div>
     <p class="small muted" style="margin-top:10px">Zdroj: <a class="link" href="https://rpp-opendata.egon.gov.cz/odrpp/datovasada/" target="_blank" rel="noopener">rpp-opendata.egon.gov.cz</a> (DIA)</p>
   </div>
   <div class="grid2">
     <div class="card"><h2>Pracovní skupina AFCEA Intelligence (kGovernment)</h2>
       <p class="muted small" style="line-height:1.6">AFCEA Česká pobočka propojuje veřejnou správu, armádu, akademii a soukromý sektor v oblasti ICT a bezpečnosti. Pracovní skupina rozvíjí koncept „knowledge government" — datově a znalostně řízeného státu — a spolupracuje s Centrem pro informovanou společnost (CIS).</p>
       <p class="small muted" style="margin-top:8px">Skupina sdružuje odborníky z oblastí:</p>
       <div style="margin-top:6px">${domains.map(d=>`<span class="chip">${esc(d)}</span>`).join('')}</div>
       <p class="small muted" style="margin-top:10px"><a class="link" href="https://afcea.cz/o-nas-ps07/" target="_blank" rel="noopener">afcea.cz — pracovní skupina</a></p>
     </div>
     <div class="card" style="background:linear-gradient(135deg,#0a1f44,#0e2a5c);color:#fff">
       <h2 style="color:#fff">Vývoj &amp; realizace</h2>
       <p style="color:#bcd0ef;line-height:1.6;font-size:13px">Aplikaci vyvíjí <b style="color:#7ef0ff">Metamatics Ventures</b> — studio zaměřené na agentní umělou inteligenci a aplikovanou inteligenci — jako příspěvek k datově řízené veřejné správě: od ETL nad veřejnými registry přes grafové modely vazeb po analytické nástroje.</p>
       <p class="small" style="margin-top:10px"><a class="link" style="color:#7ef0ff" href="https://metamatics.ventures" target="_blank" rel="noopener">metamatics.ventures</a></p>
     </div>
   </div>
   <div class="card"><h2>Připomínky k datům</h2>
     <p class="small muted" style="line-height:1.6">Našli jste nesoulad mezi zobrazením a daty, nebo nepřesnost v samotných datech RPP? Budeme rádi za zpětnou vazbu — právě ověření správnosti a úplnosti dat je smyslem této zkušební verze.</p>
     <p class="small" style="margin-top:10px">Kontakt: <a class="link" href="mailto:ps07@afcea.cz">ps07@afcea.cz</a></p>
   </div>`;
}

/* ---------- Typologie institucí (OVM) ---------- */
/* Přátelská kategorizace orgánů veřejné moci: města, obce, úřady, ministerstva… */
const OVM_TYPES = ['Ministerstva','Kraje','Města a městyse','Obce','Městské části','Úřady (státní správa)','Soudy a st. zastupitelství','Organizační složky státu','Příspěvkové organizace','Školy a univerzity','Komory a prof. samospráva','Zdravotní pojišťovny','Podniky a firmy','Ostatní','Neurčeno'];
function ovmType(o){
  const n=(o.nazev||''); const f=(o.forma||''); const nl=n.toLowerCase(); const fl=f.toLowerCase();
  if (/^ministerstvo/i.test(n)) return 'Ministerstva';
  if (f==='Kraj' || /^krajský úřad/i.test(n)) return 'Kraje';
  if (/soud|státní zastupitelství/i.test(nl)) return 'Soudy a st. zastupitelství';
  if (f==='Obec' || f==='Městská část, městský obvod' || /^dobrovolný svazek obcí/i.test(n)){
    if (f==='Městská část, městský obvod' || /městská část|městský obvod/i.test(nl)) return 'Městské části';
    if (/^(statutární město|hlavní město|město |městys)/i.test(nl)) return 'Města a městyse';
    return 'Obce';
  }
  if (/úřad/i.test(nl)) return 'Úřady (státní správa)';
  if (/vysoká škola|univerzit|školská/i.test(fl+' '+nl) || /^(základní škola|střední škola|gymnázium|mateřsk|vyšší odborn|konzervatoř)/i.test(n)) return 'Školy a univerzity';
  if (/pojišťovna/i.test(fl+' '+nl)) return 'Zdravotní pojišťovny';
  if (/komora|stavovská|profesní/i.test(fl)) return 'Komory a prof. samospráva';
  if (/^příspěvková organizace|^státní příspěvková organizace/i.test(f)) return 'Příspěvkové organizace';
  if (f==='Organizační složka státu') return 'Organizační složky státu';
  if (/ručením omezeným|akciová společnost|obchodní společnost|podnikající fyzická|komanditní|odštěpný závod|státní podnik|národní podnik/i.test(fl)) return 'Podniky a firmy';
  if (!f) return 'Neurčeno';
  return 'Ostatní';
}
let _ovmTyped = false;
async function ensureOvmTypes(){
  const rows = await load('ovm');
  if (!_ovmTyped){ for (const o of rows) o._typ = ovmType(o); _ovmTyped = true; }
  return rows;
}

/* ---------- Důležitost entit (odvozená kritičnost dle propojení) ---------- */
/* Každá entita dostane pásmo Kritická/Vysoká/Střední/Nízká podle toho, jak
   silně je provázaná (kvantily skóre). Umožní filtrovat „podle důležitosti". */
/* A2 — „důležitost" NESMÍ stát na holém počtu navázaných agend (to je jen rozsah
   působnosti, u obcí důsledek hromadného vyklikávání). Kritičnost počítáme z DOPADU:
   základní registr (whitelist) · bezpečnostní úroveň · ústřednost správce/orgánu. */
const TYPE_LEVEL_JS = {};
for (const ab in OVM_ABBR2TYPE) TYPE_LEVEL_JS[OVM_ABBR2TYPE[ab]] = OVM_ABBR_LEVEL[ab];
function ovmImp(r){ const lvl = TYPE_LEVEL_JS[r.typ||r._typ] ?? 7; return (7-lvl)*100 + Math.min((r.c&&r.c.agend)||0, 50); }
const IMPORTANCE = {
  // agenda: provázanost (toky + systémy + služby) + bonus za registr; ne počet OVM
  agendy:    r => (r.c ? (r.c.isvs||0)+(r.c.sluzby||0)+(r.c.opr_in||0)+(r.c.opr_out||0) : 0)+(r.registr?500:0),
  // ISVS: registr → bezp. úroveň (dopad) → nosné (ústřední) agendy; ne hrubý počet agend
  isvs:      r => (r.registr?1000:0) + (r.bez_rank||0)*100 + Math.min((r.c&&r.c.agend_ustr)||0,30)*2,
  ovm:       r => ovmImp(r),
  sluzby:    r => (r.ukony||0),
  udaje:     r => ((r.udaje||[]).length),
  opravneni: r => (r.pocet_udaju||0) + (r.z_reg?50:0),
};
const DUL_ORDER = ['Kritická','Vysoká','Střední','Nízká'];
const _impTagged = {};
async function ensureImportance(key){
  const rows = await load(key);
  if (_impTagged[key]) return rows;
  const score = IMPORTANCE[key]; if (!score){ _impTagged[key]=true; return rows; }
  const sorted = rows.map(score).sort((a,b)=>a-b);
  const n = sorted.length; const q = p => sorted[Math.min(n-1, Math.floor(p*(n-1)))];
  const p95=q(0.95), p80=q(0.80), p45=q(0.45);
  for (const r of rows){ const s = score(r); r._impscore = s;
    r._dulezitost = (s<=0) ? 'Nízká'
      : (s>=p95 && p95>0) ? 'Kritická'
      : (s>=p80 && p80>0) ? 'Vysoká'
      : (s>=p45 && p45>0) ? 'Střední' : 'Nízká';
  }
  _impTagged[key] = true; return rows;
}
function badgeDul(b){
  const c = b==='Kritická'?'bad':b==='Vysoká'?'warn':b==='Střední'?'cyan':'grey';
  return `<span class="badge ${c}">${esc(b||'—')}</span>`;
}
const dulFilter = { label:'Důležitost', values:DUL_ORDER, test:(r,v)=>r._dulezitost===v };
/* A2 — z čeho se „důležitost / kritičnost" počítá (různě dle typu entity).
   Zobrazujeme jako poznámku nad seznamem, ať je metodika čitelná. */
const DUL_BASIS = {
  agendy:'<b>Důležitost agendy</b> = míra provázanosti (systémy + služby + toky údajů) s bonusem za základní registr. <b>Nestojí na počtu úřadů</b> (ten je u obcí důsledek hromadného vyklikávání).',
  isvs:'<b>Kritičnost</b> = odhad dopadu, lexikograficky: základní registr → bezpečnostní úroveň (4 = kritická) → ústřednost správce → počet nosných (ústředních/registrových) agend. <b>NE</b> hrubý počet agend.',
  ovm:'<b>Důležitost orgánu</b> = úroveň instituce (ústřední → krajská → obecní); doplňkově počet agend.',
  sluzby:'<b>Důležitost služby</b> = počet úkonů, které služba zahrnuje.',
  udaje:'Řazeno dle <b>rozsahu</b> = počtu dílčích údajů v objektu — jde o <b>rozsah, ne sémantickou důležitost</b>. Proto např. „Adresa realizace" (více položek) stojí výš než „Adresa". Sémantickou váhu údaje RPP nezná.',
  opravneni:'<b>Důležitost oprávnění</b> = počet sdílených údajů (+ bonus, je-li zdrojem základní registr).',
};

/* ---------- Kategorizace agend (tematická oblast + právní předpis) ---------- */
const AGENDA_CATS = [
  ['Daně, poplatky a cla',/daň|daně|daňov|poplat|clo|celní|spotřeb|dph|tabák|líh|hazard/],
  ['Dotace, podpora a fondy',/dotac|podpor|fond|grant|příspěvk|investičn pobíd/],
  ['Doprava a vozidla',/doprav|vozidl|silnič|silnic|řidič|pozemních komunik|drážn|želez|letec|plavb|námoř/],
  ['Energetika',/energ|plyn|elektřin|elektroenerg|teplárenstv|jadern|ropn|paliv/],
  ['Životní prostředí',/životní prostřed|ovzduš|odpad|vodn|příod|přírod|ekolog|emis|chemick|ochrana ovzduší|ochrana přírody/],
  ['Zemědělství a potraviny',/zeměděl|rostlin|veterin|potravin|rybář|včela|hnojiv|osiv|půd|vinohrad|chmel|les(?!k)/],
  ['Zdravotnictví a léčiva',/zdrav|léčiv|lékař|lékárn|pacient|nemocnic|hygien|epidem|návykov|ochranné léč/],
  ['Sociální oblast a práce',/sociál|dávk|důchod|zaměstnan|nezaměstnan|pojistné|nemocensk|rodičov|invalid|hmotné nouz/],
  ['Školství, věda a kultura',/škol|vzděláv|student|univerzit|věd|výzkum|kultur|památk|umění|knihovn|sport|mládež/],
  ['Bezpečnost, obrana a justice',/policie|polici|hasič|obran|bezpečnost|zpravodaj|soud|exekut|notář|advokát|mediát|justic|vězeň|trest|krizov|civilní ochran|zbran|sankc/],
  ['Stavebnictví a katastr',/stavebn|staveb|územn|katastr|nemovitost|pozemk|geodez|kartograf/],
  ['Finanční trh a pojišťovnictví',/finanč|bank|pojišť|pojištěn|kapitál|cenných papír|úvěr|platebn|měn/],
  ['Komory a svobodná povolání',/komor|architekt|auditor|daňov porad|tlumočn|znalec|profesn/],
  ['Občan, doklady a matrika',/matrik|občansk průkaz|cestovní doklad|evidence obyvatel|trvalý pobyt|sňatek|narozen|úmrt|státní občanstv|cizinec|cizineck|azyl|uprchl|mezinárodní ochran/],
  ['IT a komunikace',/informačn systém|elektronick komunik|kybernetick|telekomunik|digitáln|datov schránk|audiovizu|televiz|rozhlas/],
  ['Podnikání a živnosti',/živnost|podnik|obchodn rejstřík|hospodářsk soutěž|veřejn zakázk|veřejn podpor|ochrana spotřebitel|trh s výrobk/],
  ['Registry a evidence',/registr|evidenc|seznam|katalog|rejstřík/],
  ['Veřejná správa a samospráva',/veřejn správ|samospráv|obec|kraj|úřad|volb|referend|přestupk|správní řízení/],
];
const AGENDA_CAT_NAMES = AGENDA_CATS.map(c=>c[0]).concat(['Ostatní']);
function agendaText(a){ return (a.nazev+' '+((a.cinnosti||[]).map(c=>c.nazev).join(' '))).toLowerCase(); }
function agendaCategory(a){ const t=agendaText(a); for (const [n,re] of AGENDA_CATS) if (re.test(t)) return n; return 'Ostatní'; }
function agendaLaw(a){
  const n = a.nazev||'';
  let m = n.match(/zákon[a-zěí]*\s*č\.\s*\d+\/\d+\s*Sb\./i); if (m) return m[0].replace(/\s+/g,' ').trim();
  m = n.match(/zákon[a-zěí]*\s+o\s+[^,(;]+/i); if (m) return m[0].trim().replace(/^zákon\w*/i,'Zákon').replace(/\s+/g,' ');
  return '(neuvedeno)';
}
let _agMeta = null;
async function ensureAgendaMeta(){
  if (_agMeta) return _agMeta;
  const ag = await load('agendy'); const map = {};
  for (const a of ag){ a._kat = agendaCategory(a); a._zakon = agendaLaw(a); map[a.id] = a._kat; }
  _agMeta = map; return map;
}
const _catTagged = {};
async function ensureCategories(key){
  const rows = await load(key);
  if (_catTagged[key]) return rows;
  if (key==='ovm'){ await ensureOvmTypes(); _catTagged[key]=true; return rows; }   // typ instituce řeší ensureOvmTypes
  if (key==='agendy'){ await ensureAgendaMeta(); _catTagged[key]=true; return rows; }
  if (key==='isvs'){
    const ovm = await ensureOvmTypes(); const om = {}; for (const o of ovm) om[o.id] = o._typ;
    for (const r of rows) r._spravce_typ = om[r.spravce] || 'Neurčeno';
    _catTagged[key]=true; return rows;
  }
  const map = await ensureAgendaMeta();
  const fk = key==='opravneni' ? 'do' : 'agenda';
  for (const r of rows){ r._kat = map[r[fk]] || '(bez agendy)'; }
  _catTagged[key]=true; return rows;
}

/* ---------- DATABÁZE · prohlížeč a kontrola kvality dat ---------- */
/* Pohled pro kolegu: surové propojené tabulky, fill-rate sloupců a kontrola
   referenční integrity (cizí klíče mířící na neexistující entitu). */
const DB_TABLES = {
  agendy: { label:'Agendy', file:'agendy', sub:'Agendy veřejné správy', searchText:r=>r.nazev+' '+r.kod+' '+r.id+' '+(r._zakon||''), fields:[
    {k:'id',h:'ID',kind:'mono',req:true},
    {k:'kod',h:'Kód',kind:'mono',req:true},
    {k:'nazev',h:'Název',kind:'self',req:true},
    {k:'_kat',h:'Kategorie',kind:'enum'},
    {k:'_zakon',h:'Právní předpis',kind:'longtext'},
    {k:'_dulezitost',h:'Důležitost',kind:'enum',order:DUL_ORDER,badge:'dul'},
    {k:'ohlasovatel',h:'Ohlašovatel',kind:'fk',ref:'ovm',req:true},
    {k:'stanovisko_sluzby',h:'Stanov. služby',kind:'enum'},
    {k:'stanovisko_udaje',h:'Stanov. údaje',kind:'enum'},
    {k:'platnost_od',h:'Platnost od',kind:'text'},
    {k:'isvs',h:'ISVS',kind:'arrfk',ref:'isvs'},
    {k:'sluzby_ids',h:'Služby',kind:'arrfk',ref:'sluzba'},
    {k:'ovm_sample',h:'OVM (vzorek)',kind:'arrfk',ref:'ovm'},
  ]},
  isvs: { label:'Systémy (ISVS)', file:'isvs', sub:'Informační systémy veřejné správy', searchText:r=>r.nazev+' '+r.ident+' '+(r.spravce_nazev||''), fields:[
    {k:'id',h:'ID',kind:'mono',req:true},
    {k:'ident',h:'Ident',kind:'mono'},
    {k:'nazev',h:'Název',kind:'self',req:true},
    {k:'_spravce_typ',h:'Typ správce',kind:'enum'},
    {k:'_dulezitost',h:'Důležitost',kind:'enum',order:DUL_ORDER,badge:'dul'},
    {k:'spravce',h:'Správce',kind:'fk',ref:'ovm',req:true},
    {k:'bezuroven',h:'Bezp. úroveň',kind:'enum'},
    {k:'umisteni',h:'Umístění',kind:'enum'},
    {k:'etapa',h:'Etapa',kind:'enum'},
    {k:'sdileni',h:'Sdílení',kind:'enum'},
    {k:'vyuziti',h:'Využití',kind:'enum'},
    {k:'agendy',h:'Agendy',kind:'arrfk',ref:'agenda'},
  ]},
  ovm: { label:'Orgány (OVM)', file:'ovm', sub:'Orgány veřejné moci', searchText:r=>r.nazev+' '+r.ico+' '+(r.forma||''), fields:[
    {k:'id',h:'ID',kind:'mono',req:true},
    {k:'ico',h:'IČO',kind:'mono',req:true},
    {k:'nazev',h:'Název',kind:'self',req:true},
    {k:'_typ',h:'Typ instituce',kind:'enum'},
    {k:'_dulezitost',h:'Důležitost',kind:'enum',order:DUL_ORDER,badge:'dul'},
    {k:'forma',h:'Forma',kind:'enum'},
    {k:'kategorie',h:'Kategorie',kind:'arrtext'},
    {k:'ds',h:'Dat. schránka',kind:'bool'},
    {k:'vnitrni',h:'Vnitřní',kind:'bool'},
    {k:'agendy_sample',h:'Agendy (vzorek)',kind:'arrfk',ref:'agenda'},
  ]},
  sluzby: { label:'Služby', file:'sluzby', sub:'Služby veřejné správy', searchText:r=>r.nazev+' '+r.ident, fields:[
    {k:'id',h:'ID',kind:'mono',req:true},
    {k:'ident',h:'Ident',kind:'mono'},
    {k:'nazev',h:'Název',kind:'self',req:true},
    {k:'_kat',h:'Kategorie',kind:'enum'},
    {k:'_dulezitost',h:'Důležitost',kind:'enum',order:DUL_ORDER,badge:'dul'},
    {k:'agenda',h:'Agenda',kind:'fk',ref:'agenda',req:true},
    {k:'typ',h:'Typ',kind:'enum'},
    {k:'klienti',h:'Klienti',kind:'arrtext'},
    {k:'poskytovatel',h:'Poskytovatel',kind:'mono'},
    {k:'ukony',h:'Úkonů',kind:'num'},
  ]},
  udaje: { label:'Údaje', file:'udaje', sub:'Objekty/subjekty údajů a jejich položky', searchText:r=>r.nazev+' '+r.kod, fields:[
    {k:'id',h:'ID',kind:'mono',req:true},
    {k:'kod',h:'Kód',kind:'mono',req:true},
    {k:'nazev',h:'Název',kind:'text',req:true},
    {k:'_kat',h:'Kategorie',kind:'enum'},
    {k:'_dulezitost',h:'Důležitost',kind:'enum',order:DUL_ORDER,badge:'dul'},
    {k:'agenda',h:'Agenda',kind:'fk',ref:'agenda',req:true},
    {k:'popis',h:'Popis',kind:'longtext'},
    {k:'udaje',h:'Položek',kind:'arrcount'},
  ]},
  opravneni: { label:'Oprávnění', file:'opravneni', sub:'Oprávnění k přístupu k údajům (toky mezi agendami)', searchText:r=>r.kod+' '+r.id, fields:[
    {k:'id',h:'ID',kind:'mono',req:true},
    {k:'kod',h:'Kód',kind:'mono',req:true},
    {k:'z',h:'Z agendy',kind:'fk',ref:'agenda',req:true},
    {k:'do',h:'Do agendy',kind:'fk',ref:'agenda',req:true},
    {k:'_kat',h:'Kategorie',kind:'enum'},
    {k:'_dulezitost',h:'Důležitost',kind:'enum',order:DUL_ORDER,badge:'dul'},
    {k:'typ',h:'Typ',kind:'longtext'},
    {k:'pocet_udaju',h:'Počet údajů',kind:'num'},
    {k:'rw',h:'R/W',kind:'arrtext'},
    {k:'ref',h:'Ref',kind:'bool'},
  ]},
};
const DB_REF_FILE = {ovm:'ovm', isvs:'isvs', agenda:'agendy', sluzba:'sluzby'};
const DB_REFSETS = {};
async function dbRefSet(ref){
  if (DB_REFSETS[ref]) return DB_REFSETS[ref];
  const rows = await load(DB_REF_FILE[ref]);
  const s = new Set(); for (const r of rows) s.add(r.id);
  DB_REFSETS[ref] = s; return s;
}
const dbEmpty = v => v==null || v==='' || (Array.isArray(v) && v.length===0);
function dbTrunc(s, n){ s=String(s); return s.length>n ? esc(s.slice(0,n))+'…' : esc(s); }
/* one cell -> {html, issue:null|'missing'|'broken'} */
function dbCell(f, r, refsets){
  const v = r[f.k];
  if (dbEmpty(v)){
    if (f.req) return {html:'<span class="qmiss">— chybí —</span>', issue:'missing'};
    return {html:'<span class="qnull">∅</span>', issue:null};
  }
  if (f.badge==='dul') return {html: badgeDul(v), issue:null};
  switch(f.kind){
    case 'self': return {html: link(r.id, v), issue:null};
    case 'fk': {
      const set = refsets[f.ref];
      if (set && !set.has(v)) return {html:`<span class="qbroken" title="cíl neexistuje v tabulce ${f.ref}">${dbTrunc(nameOf(v)||v,40)} ⚠</span>`, issue:'broken'};
      return {html: link(v), issue:null};
    }
    case 'arrfk': {
      const set = refsets[f.ref];
      const broken = set ? v.filter(x=>!set.has(x)).length : 0;
      const head = v.slice(0,2).map(x=>link(x)).join(', ');
      const rest = v.length>2 ? ` <span class="chip">+${fmt(v.length-2)}</span>` : '';
      const warn = broken ? ` <span class="badge bad" title="neplatné odkazy">${broken} ⚠</span>` : '';
      return {html: head+rest+warn, issue: broken?'broken':null};
    }
    case 'arrcount': return {html:`<span class="chip">${fmt(v.length)}×</span>`, issue:null};
    case 'arrtext': return {html: v.slice(0,4).map(x=>`<span class="chip">${esc(String(x).trim())}</span>`).join('')+(v.length>4?` <span class="chip">+${fmt(v.length-4)}</span>`:''), issue:null};
    case 'bool': return {html: v ? '<span class="badge ok">ano</span>' : '<span class="badge grey">ne</span>', issue:null};
    case 'num': return {html: fmt(v), issue:null};
    case 'longtext': return {html: dbTrunc(v,70), issue:null};
    case 'mono': return {html: `<span class="mono">${esc(v)}</span>`, issue:null};
    default: return {html: dbTrunc(v,60), issue:null};
  }
}
/* per-field fill rate + broken-ref counts over the WHOLE dataset */
function dbStats(rows, fields, refsets){
  return fields.map(f=>{
    let filled=0, broken=0;
    for (const r of rows){
      const v = r[f.k];
      if (!dbEmpty(v)) filled++;
      if (!dbEmpty(v)){
        if (f.kind==='fk' && refsets[f.ref] && !refsets[f.ref].has(v)) broken++;
        else if (f.kind==='arrfk' && refsets[f.ref]) broken += v.filter(x=>!refsets[f.ref].has(x)).length;
      }
    }
    return {f, filled, total:rows.length, broken};
  });
}
function dbRowIssues(r, fields, refsets){
  let miss=0, brk=0;
  for (const f of fields){
    const c = dbCell(f, r, refsets);
    if (c.issue==='missing') miss++; else if (c.issue==='broken') brk++;
  }
  return {miss, brk, bad: miss>0||brk>0};
}
async function databaze(arg){
  await ensureNames();
  const meta = await load('meta');
  // DB je „surová" vrstva → u OVM ukazuje celý registr (vč. zaniklých), proto ovm_celkem.
  const tabN = {agendy:meta.counts.agendy, isvs:meta.counts.isvs, ovm:(meta.counts.ovm_celkem||meta.counts.ovm), sluzby:meta.counts.sluzby, udaje:meta.counts.udaje_objekty, opravneni:meta.counts.opravneni};
  // arg může nést přednastavený filtr: "ovm~Obce" → tabulka ovm, filtr Typ instituce = Obce
  let aKey = arg, preFilter = null;
  if (aKey && aKey.includes('~')){ const p = aKey.split('~'); aKey = p[0]; preFilter = decodeURIComponent(p.slice(1).join('~')); }
  const key = (aKey && DB_TABLES[aKey]) ? aKey : 'agendy';
  const spec = DB_TABLES[key];
  const rows = await load(spec.file);
  if (key==='ovm') await ensureOvmTypes();   // doplní _typ (typ instituce)
  await ensureImportance(key);               // doplní _dulezitost (pásmo důležitosti)
  await ensureCategories(key);               // doplní _kat / _zakon / _spravce_typ
  // valid-id sets only for refs this table uses
  const refs = [...new Set(spec.fields.filter(f=>f.ref).map(f=>f.ref))];
  const refsets = {};
  await Promise.all(refs.map(async rf => { refsets[rf] = await dbRefSet(rf); }));

  const stats = dbStats(rows, spec.fields, refsets);
  const totalBroken = stats.reduce((a,s)=>a+s.broken,0);
  const reqStats = stats.filter(s=>s.f.req);
  const missingReq = reqStats.reduce((a,s)=>a+(s.total-s.filled),0);

  // per-column filters for enum & bool sloupce (+ sentinel pro prázdné hodnoty)
  const FILTER_KINDS = new Set(['enum','bool']);
  const filterOpts = spec.fields.filter(f=>FILTER_KINDS.has(f.kind)).map(f=>{
    const vals = new Set(); let hasEmpty=false;
    for (const r of rows){ const v=r[f.k];
      if (dbEmpty(v)){ hasEmpty=true; continue; }
      vals.add(f.kind==='bool' ? (v?'ano':'ne') : String(v));
    }
    let values = [...vals];
    if (f.order) values.sort((a,b)=>{ const ia=f.order.indexOf(a), ib=f.order.indexOf(b); return (ia<0?99:ia)-(ib<0?99:ib); });
    else values.sort((a,b)=>a.localeCompare(b,'cs'));
    return { f, values, hasEmpty };
  });

  const tabs = Object.entries(DB_TABLES).map(([k,t])=>
    `<a class="dbtab ${k===key?'active':''}" href="#/databaze/${k}">${esc(t.label)} <span class="n">${fmt(tabN[k]||'')}</span></a>`).join('');

  view.innerHTML = `
    <div class="pagehdr"><div><h1>Databáze · kontrola kvality</h1>
      <div class="sub">Surové propojené tabulky pro revizi dat · klikací cizí klíče · fill-rate sloupců · referenční integrita</div></div>
      <a class="btn" id="dbexport">↗ Export CSV</a></div>
    <div class="dbtabs">${tabs}</div>
    <div class="card">
      <h2>${esc(spec.label)} <span class="badge grey">${fmt(rows.length)} řádků</span></h2>
      <div class="desc">${esc(spec.sub)}</div>
      <div class="qhealth">
        <div class="qh"><b>${fmt(rows.length)}</b>řádků</div>
        <div class="qh"><b>${fmt(spec.fields.length)}</b>sloupců</div>
        <div class="qh"><b class="${missingReq?'bad':'ok'}">${fmt(missingReq)}</b>chybějících povinných</div>
        <div class="qh"><b class="${totalBroken?'bad':'ok'}">${fmt(totalBroken)}</b>neplatných odkazů (FK)</div>
      </div>
      <div class="qsum">
        ${stats.map(s=>{
          const pct = s.total ? Math.round(s.filled/s.total*100) : 0;
          const cls = pct>=99?'lime':pct>=70?'':pct>=30?'pink':'grey';
          const brk = s.broken ? ` <span class="badge bad">${fmt(s.broken)} ⚠</span>` : '';
          const req = s.f.req ? ' <span class="badge cyan">povinné</span>' : '';
          return `<div class="bar tight"><div class="lbl">${esc(s.f.h)}${req}</div><div class="track"><div class="fill ${cls}" style="width:${pct}%"></div></div><div class="val">${pct}%${brk}</div></div>`;
        }).join('')}
      </div>
    </div>
    <div class="toolbar">
      <input class="grow" id="dbq" placeholder="Hledat v tabulce ${esc(spec.label).toLowerCase()}…">
      ${filterOpts.map(o=>`<select data-col="${esc(o.f.k)}"><option value="">${esc(o.f.h)}: vše</option>${o.hasEmpty?'<option value="__EMPTY__">⊘ (prázdné)</option>':''}${o.values.map(v=>`<option value="${esc(v)}">${esc(v.trim()||v)}</option>`).join('')}</select>`).join('')}
      <label class="tg"><input type="checkbox" id="dbprob"> jen řádky s problémem</label>
      <button class="btn" id="dbclear">✕ Vyčistit</button>
      <span class="count" id="dbc"></span>
    </div>
    <div class="dbgrid" id="dbgrid"></div>
    <div style="text-align:center;margin-top:14px"><button class="btn" id="dbmore" style="display:none">Načíst dalších 100</button></div>`;

  const state = { q:'', limit:100, prob:false, col:{} };
  if (preFilter && filterOpts.some(o=>o.f.k==='_typ')){
    state.col['_typ'] = preFilter;
    const s = view.querySelector('.toolbar select[data-col="_typ"]'); if (s) s.value = preFilter;
  }
  function filtered(){
    let out = rows;
    const q = state.q.trim().toLowerCase();
    if (q) out = out.filter(r => spec.searchText(r).toLowerCase().includes(q));
    for (const o of filterOpts){
      const sel = state.col[o.f.k]; if (!sel) continue;
      const k = o.f.k;
      if (sel==='__EMPTY__') out = out.filter(r => dbEmpty(r[k]));
      else if (o.f.kind==='bool') out = out.filter(r => (r[k]?'ano':'ne')===sel);
      else out = out.filter(r => String(r[k])===sel);
    }
    if (state.prob) out = out.filter(r => dbRowIssues(r, spec.fields, refsets).bad);
    return out;
  }
  function gridHTML(shown){
    if (!shown.length) return '<div class="empty">Nic nenalezeno.</div>';
    const head = '<tr>'+spec.fields.map(f=>`<th>${f.k&&f.k[0]==='_'?dH(f.h):esc(f.h)}</th>`).join('')+'</tr>';
    const body = shown.map(r=>{
      const cells = spec.fields.map(f=>dbCell(f, r, refsets));
      const bad = cells.some(c=>c.issue);
      return `<tr class="${bad?'qbadrow':''}">`+cells.map(c=>`<td>${c.html}</td>`).join('')+'</tr>';
    }).join('');
    return `<div class="tablewrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  }
  function draw(){
    const f = filtered();
    const shown = f.slice(0, state.limit);
    byId('dbgrid').innerHTML = gridHTML(shown);
    byId('dbc').textContent = `${fmt(f.length)} z ${fmt(rows.length)} řádků` + (f.length>shown.length?` · zobrazeno ${fmt(shown.length)}`:'');
    byId('dbmore').style.display = f.length > state.limit ? '' : 'none';
    // CSV export of the current filtered view (flattened)
    window.__dbexport = { name:'databaze-'+key, fields:spec.fields, rows:f };
  }
  byId('dbq').addEventListener('input', e=>{ state.q=e.target.value; state.limit=100; draw(); });
  byId('dbprob').addEventListener('change', e=>{ state.prob=e.target.checked; state.limit=100; draw(); });
  view.querySelectorAll('.toolbar select[data-col]').forEach(s=>s.addEventListener('change', e=>{ state.col[e.target.dataset.col]=e.target.value; state.limit=100; draw(); }));
  byId('dbclear').addEventListener('click', ()=>{
    state.q=''; state.prob=false; state.col={}; state.limit=100;
    byId('dbq').value=''; byId('dbprob').checked=false;
    view.querySelectorAll('.toolbar select[data-col]').forEach(s=>s.value='');
    draw();
  });
  byId('dbmore').addEventListener('click', ()=>{ state.limit+=100; draw(); });
  byId('dbexport').addEventListener('click', ()=>{
    const ex = window.__dbexport; if (!ex) return;
    const flat = v => Array.isArray(v) ? v.join(' | ') : (v==null?'':String(v));
    const head = ex.fields.map(f=>`"${f.h}"`).join(',');
    const body = ex.rows.slice(0,20000).map(r=>ex.fields.map(f=>`"${flat(r[f.k]).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿'+head+'\n'+body], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=ex.name+'.csv'; a.click(); URL.revokeObjectURL(url);
  });
  draw();
}

/* ---------- SQL DOTAZY · spojování tabulek + hledání z jazyka do SQL ---------- */
/* Klientská SQLite (sql.js / WASM) nad RPP daty. Umožní JOINovat tabulky a
   překládá českou otázku do SQL (heuristika, výsledné SQL je editovatelné). */
const SQL_TABLES = {
  agendy: { desc:'Agendy', cols:[['id','TEXT'],['kod','TEXT'],['nazev','TEXT'],['ohlasovatel','TEXT'],['kategorie','TEXT'],['zakon','TEXT'],['dulezitost','TEXT'],['stanovisko_sluzby','TEXT'],['stanovisko_udaje','TEXT'],['platnost_od','TEXT'],['pocet_isvs','INT'],['pocet_sluzby','INT'],['pocet_ovm','INT'],['pocet_cinnosti','INT']],
    val:r=>[r.id,r.kod,r.nazev,r.ohlasovatel,r._kat,r._zakon,r._dulezitost,r.stanovisko_sluzby,r.stanovisko_udaje,r.platnost_od,(r.c&&r.c.isvs)||0,(r.c&&r.c.sluzby)||0,(r.c&&r.c.ovm)||0,(r.c&&r.c.cinnosti)||0] },
  isvs: { desc:'Informační systémy', cols:[['id','TEXT'],['ident','TEXT'],['nazev','TEXT'],['spravce','TEXT'],['spravce_nazev','TEXT'],['spravce_typ','TEXT'],['bezuroven','TEXT'],['umisteni','TEXT'],['etapa','TEXT'],['sdileni','TEXT'],['vyuziti','TEXT'],['dulezitost','TEXT'],['pocet_agend','INT']],
    val:r=>[r.id,r.ident,r.nazev,r.spravce,r.spravce_nazev,r._spravce_typ,r.bezuroven,r.umisteni,r.etapa,r.sdileni,r.vyuziti,r._dulezitost,(r.c&&r.c.agend)||0] },
  ovm: { desc:'Orgány veřejné moci', cols:[['id','TEXT'],['ico','TEXT'],['nazev','TEXT'],['typ','TEXT'],['forma','TEXT'],['dulezitost','TEXT'],['ds','INT'],['vnitrni','INT'],['pocet_agend','INT'],['pocet_isvs','INT']],
    val:r=>[r.id,r.ico,r.nazev,r._typ,r.forma,r._dulezitost,r.ds?1:0,r.vnitrni?1:0,(r.c&&r.c.agend)||0,(r.c&&r.c.isvs)||0] },
  sluzby: { desc:'Služby', cols:[['id','TEXT'],['ident','TEXT'],['nazev','TEXT'],['agenda','TEXT'],['kategorie','TEXT'],['typ','TEXT'],['poskytovatel','TEXT'],['dulezitost','TEXT'],['ukony','INT']],
    val:r=>[r.id,r.ident,r.nazev,r.agenda,r._kat,(r.typ||'').trim(),r.poskytovatel,r._dulezitost,r.ukony||0] },
  udaje: { desc:'Objekty údajů', cols:[['id','TEXT'],['kod','TEXT'],['nazev','TEXT'],['agenda','TEXT'],['kategorie','TEXT'],['dulezitost','TEXT'],['pocet_polozek','INT']],
    val:r=>[r.id,r.kod,r.nazev,r.agenda,r._kat,r._dulezitost,(r.udaje||[]).length] },
  opravneni: { desc:'Oprávnění / toky údajů', cols:[['id','TEXT'],['kod','TEXT'],['z_agenda','TEXT'],['do_agenda','TEXT'],['kategorie','TEXT'],['dulezitost','TEXT'],['pocet_udaju','INT'],['ref','INT']],
    val:r=>[r.id,r.kod,r['z'],r['do'],r._kat,r._dulezitost,r.pocet_udaju||0,r.ref?1:0] },
};
const SQL_EXAMPLES = [
  ['Systémy a jejich správci (JOIN)', "SELECT i.nazev AS system, o.nazev AS spravce, o.typ AS typ_spravce\nFROM isvs i JOIN ovm o ON i.spravce = o.id\nLIMIT 200;"],
  ['Počet systémů podle typu správce', "SELECT o.typ AS typ_spravce, COUNT(*) AS pocet_systemu\nFROM isvs i JOIN ovm o ON i.spravce = o.id\nGROUP BY o.typ ORDER BY pocet_systemu DESC;"],
  ['Služby v kritických agendách', "SELECT s.nazev AS sluzba, a.nazev AS agenda, a.kategorie\nFROM sluzby s JOIN agendy a ON s.agenda = a.id\nWHERE a.dulezitost = 'Kritická'\nLIMIT 200;"],
  ['Toky údajů mezi agendami', "SELECT az.nazev AS z_agendy, ad.nazev AS do_agendy, p.pocet_udaju\nFROM opravneni p\nJOIN agendy az ON p.z_agenda = az.id\nJOIN agendy ad ON p.do_agenda = ad.id\nORDER BY p.pocet_udaju DESC LIMIT 200;"],
  ['Agendy bez navázané služby', "SELECT kod, nazev, kategorie FROM agendy WHERE pocet_sluzby = 0;"],
  ['ISVS bez bezpečnostní úrovně', "SELECT nazev, spravce_nazev FROM isvs\nWHERE bezuroven IS NULL OR bezuroven = '' LIMIT 200;"],
  ['Kolik agend spravuje ministerstvo (JOIN)', "SELECT o.nazev AS ministerstvo, o.pocet_agend\nFROM ovm o WHERE o.typ = 'Ministerstva'\nORDER BY o.pocet_agend DESC;"],
];
let _sqlDb = null, _sqlBuilding = null;
function loadSqlJs(){
  const base = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
  return new Promise((res,rej)=>{
    const init = ()=> window.initSqlJs({locateFile:f=>base+f}).then(res,rej);
    if (window.initSqlJs) return init();
    const s=document.createElement('script'); s.src=base+'sql-wasm.js';
    s.onload=init; s.onerror=()=>rej(new Error('Nepodařilo se načíst SQL engine (sql.js).'));
    document.head.appendChild(s);
  });
}
async function buildSqlDb(){
  if (_sqlDb) return _sqlDb;
  if (_sqlBuilding) return _sqlBuilding;
  _sqlBuilding = (async ()=>{
    const SQL = await loadSqlJs();
    await Promise.all(['agendy','isvs','ovm','sluzby','udaje','opravneni'].flatMap(k=>[ensureImportance(k),ensureCategories(k)]).concat([ensureOvmTypes()]));
    const db = new SQL.Database();
    for (const [name,cfg] of Object.entries(SQL_TABLES)){
      const rows = await load(name);
      db.run(`CREATE TABLE ${name} (${cfg.cols.map(c=>'"'+c[0]+'" '+c[1]).join(', ')});`);
      const ph = cfg.cols.map(()=>'?').join(',');
      const stmt = db.prepare(`INSERT INTO ${name} VALUES (${ph})`);
      db.run('BEGIN');
      for (const r of rows){ stmt.run(cfg.val(r).map(v=>v===undefined?null:v)); }
      db.run('COMMIT'); stmt.free();
    }
    _sqlDb = db; return db;
  })();
  return _sqlBuilding;
}
const deaccent = s => (s||'').normalize("NFD").replace(/[\u0300-\u036f]/g,'').toLowerCase();
function nl2sql(q){
  const s = deaccent(q);
  const has = (...ks)=>ks.some(k=>s.includes(deaccent(k)));
  let table = 'agendy';
  if (has('system','isvs')) table='isvs';
  else if (has('organ','urad','ovm','instituc','ministerstv','obce','obec','mesto','mest','kraj')) table='ovm';
  else if (has('sluzb','sluzeb')) table='sluzby';
  else if (has('udaj')) table='udaje';
  else if (has('opravnen','tok')) table='opravneni';
  else if (has('agend')) table='agendy';
  const where=[];
  const hasKat = ['agendy','sluzby','udaje','opravneni'].includes(table);   // jen tyto tabulky mají sloupec kategorie
  if (hasKat) for (const name of AGENDA_CAT_NAMES){ const key=deaccent(name).split(/[ ,]/)[0]; if (key.length>3 && s.includes(key)){ where.push(`kategorie = '${name.replace(/'/g,"''")}'`); break; } }
  const typMap=[['ministerstv','Ministerstva'],['kraj','Kraje'],['mest','Města a městyse'],['obce','Obce'],['obec','Obce'],['urad','Úřady (státní správa)'],['soud','Soudy a st. zastupitelství'],['skol','Školy a univerzity']];
  for (const [k,v] of typMap){ if (s.includes(k)){ if(table==='ovm') where.push(`typ = '${v}'`); else if(table==='isvs') where.push(`spravce_typ = '${v}'`); break; } }
  if (has('bez bezpe','neuveden','chybi','prazdn') && (table==='isvs')) where.push(`(bezuroven IS NULL OR bezuroven = '')`);
  else if (has('kritick')){ if(table==='isvs' && has('bezpe')) where.push(`bezuroven LIKE '%Kritická%'`); else where.push(`dulezitost = 'Kritická'`); }
  else if (has('nejdulezit','vysok','dulezit')) where.push(`dulezitost IN ('Kritická','Vysoká')`);
  if (has('cloud')) where.push(`umisteni LIKE '%využitím cloud%'`);   // pozor: 'Bez cloud computingu' obsahuje slovo cloud
  const count = has('kolik','pocet','pocty');
  const sel = count ? 'COUNT(*) AS pocet' : '*';
  let sql = `SELECT ${sel} FROM ${table}`;
  if (where.length) sql += '\nWHERE '+where.join(' AND ');
  if (!count) sql += '\nLIMIT 200';
  return sql+';';
}
function sqlCellRender(v){ if (v==null) return '<span class="qnull">∅</span>'; const s=String(v); if (s.includes('/') && routeOf(s)) return link(s); return esc(s); }
function sqlResultHTML(res){
  if (!res || !res.length) return '<div class="empty">Dotaz proběhl úspěšně · 0 řádků.</div>';
  const {columns, values} = res[0];
  const head = '<tr>'+columns.map(c=>`<th>${esc(c)}</th>`).join('')+'</tr>';
  const body = values.slice(0,500).map(row=>'<tr>'+row.map(v=>`<td>${sqlCellRender(v)}</td>`).join('')+'</tr>').join('');
  return `<div class="count" style="margin-bottom:8px">${fmt(values.length)} řádků`+(values.length>500?' · zobrazeno prvních 500':'')+`</div><div class="tablewrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}
async function dotazy(){
  view.innerHTML = `
    <div class="pagehdr"><div><h1>SQL dotazy · spojování tabulek</h1>
      <div class="sub">Spojuj tabulky přes JOIN a ptej se česky — otázka se přeloží do SQL (engine sql.js běží ve tvém prohlížeči nad RPP daty)</div></div></div>
    <div class="card" id="sqlcard"><div class="loading"><span class="spin"></span>Připravuji databázi (sql.js + RPP data)…</div></div>`;
  let db;
  try { db = await buildSqlDb(); }
  catch(e){ byId('sqlcard').innerHTML = '<div class="empty">Chyba: '+esc(e.message)+'</div>'; return; }

  const schemaHTML = Object.entries(SQL_TABLES).map(([n,c])=>
    `<div style="margin-bottom:6px"><b class="mono">${n}</b> <span class="small muted">— ${esc(c.desc)}</span><br><span class="small mono muted">${c.cols.map(x=>x[0]).join(', ')}</span></div>`).join('');

  byId('sqlcard').innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">Zeptej se česky</div>
    <div class="toolbar">
      <input class="grow" id="nlq" placeholder="např. kolik systémů spravují ministerstva · kritické agendy v kategorii daně · ISVS bez bezpečnostní úrovně">
      <button class="btn neon" id="nlrun">Přeložit → SQL → spustit</button>
    </div>
    <div style="font-weight:700;margin:12px 0 6px">SQL dotaz <span class="small muted">(Ctrl+Enter spustí · můžeš upravit)</span></div>
    <textarea id="sqlta" spellcheck="false" style="width:100%;min-height:120px;font-family:ui-monospace,Menlo,monospace;font-size:13px;padding:11px;border:1px solid var(--line);border-radius:11px;outline:none;resize:vertical">SELECT i.nazev AS system, o.nazev AS spravce, o.typ AS typ_spravce
FROM isvs i JOIN ovm o ON i.spravce = o.id
LIMIT 200;</textarea>
    <div class="toolbar" style="margin-top:10px">
      <button class="btn neon" id="sqlrun">▶ Spustit</button>
      <button class="btn" id="sqlexport">↗ Export CSV</button>
      <span class="count" id="sqlmsg"></span>
    </div>
    <div style="font-weight:700;margin:14px 0 6px">Příklady (klikni)</div>
    <div class="dbtabs">${SQL_EXAMPLES.map((e,i)=>`<a class="dbtab" data-ex="${i}" href="javascript:void(0)">${esc(e[0])}</a>`).join('')}</div>
    <details style="margin-top:14px"><summary class="small muted" style="cursor:pointer">Schéma tabulek a klíče pro JOIN</summary>
      <div style="margin-top:8px">${schemaHTML}
        <div class="small muted" style="margin-top:8px">Vazby: <span class="mono">isvs.spravce = ovm.id</span> · <span class="mono">sluzby.agenda = agendy.id</span> · <span class="mono">udaje.agenda = agendy.id</span> · <span class="mono">opravneni.z_agenda / do_agenda = agendy.id</span> · <span class="mono">agendy.ohlasovatel = ovm.id</span></div>
      </div></details>
    <div id="sqlout" style="margin-top:16px"></div>`;

  function exec(){
    const sql = byId('sqlta').value.trim(); if(!sql) return;
    try { const res = db.exec(sql); byId('sqlout').innerHTML = sqlResultHTML(res);
      window.__sqlres = res && res[0]; byId('sqlmsg').textContent='OK'; byId('sqlmsg').style.color='var(--muted)';
    } catch(e){ byId('sqlout').innerHTML=''; byId('sqlmsg').textContent='Chyba: '+e.message; byId('sqlmsg').style.color='#b91c1c'; }
  }
  byId('sqlrun').addEventListener('click', exec);
  byId('sqlta').addEventListener('keydown', e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); exec(); }});
  byId('nlrun').addEventListener('click', ()=>{ const q=byId('nlq').value.trim(); if(!q) return; byId('sqlta').value=nl2sql(q); exec(); });
  byId('nlq').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); byId('nlrun').click(); }});
  view.querySelectorAll('[data-ex]').forEach(a=>a.addEventListener('click', ()=>{ byId('sqlta').value=SQL_EXAMPLES[+a.dataset.ex][1]; exec(); }));
  byId('sqlexport').addEventListener('click', ()=>{
    const r = window.__sqlres; if(!r){ alert('Nejdřív spusť dotaz s výsledkem.'); return; }
    const head = r.columns.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',');
    const body = r.values.map(row=>row.map(v=>`"${(v==null?'':String(v)).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿'+head+'\n'+body],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='sql-vysledek.csv'; a.click(); URL.revokeObjectURL(url);
  });
  exec();   // spustí úvodní ukázkový JOIN
}

/* ---------- PRŮVODCE VERZEMI / NOVINKY ----------
   Interaktivní průvodce změnami nástroje napříč verzemi. Uživatel přepíná verzi
   a proklikává jednotlivé novinky („Krok 1/N → Další"), u každé může skočit přímo
   do aplikace.  ⚠ PŘI KAŽDÉ NOVÉ VERZI / ZMĚNĚ přidej novou položku NAHORU do
   CHANGELOG (nejnovější první) — viz CLAUDE.md. Zvýšení čísla verze automaticky
   zobrazí uživateli „● nové" v menu a při návratu otevře průvodce. */
const CHANGELOG = [
  { ver:'7.0', date:'16. 6. 2026', tag:'Gap analýza — architektura státu (mezery + přebytek)',
    summary:'Nový pohled „Architektura státu — gap analýza" (sekce Analýza). Odpovídá na dvě otázky: co nám v celkové architektuře státu CHYBÍ ve srovnání s vyspělými zeměmi, a kde naopak PŘEBÝVAJÍ paralelní systémy dělající totéž. Je to hybrid: (A) matice 11 schopností (eID, sběrnice dat, registry, once-only, platby, doručování, portál, API/open data, procesní modelování, gov cloud, kyber) porovnaná s Estonskem, Dánskem, UK, Singapurem a EU rámcem — odborný benchmark pracovní skupiny, ale kde CZ systém v RPP existuje, je proklik přímo na jeho detail. (B) přebytek/duplicity čistě z RPP dat, bez hodnocení: kolik paralelních instalací téže produktové rodiny běží a u kolika různých správců. Důležité: RPP nenese náklady, takže mluvíme o počtu instalací, ne o výdajích — interpretaci necháváme na čtenáři.',
    steps:[
      {icon:'🌍', title:'Co nám v architektuře chybí (vs. jiné státy)', body:'Matice schopností porovnává Česko s referenčními zeměmi (Estonsko, Dánsko, UK, Singapur, EU). U každé vrstvy je vidět zralost (chybí / částečné / silné / lídr) a typ mezery. Zcela chybí např. princip once-only se správou souhlasů a jednotné platby státu; naopak lídrem jsme u datových schránek a registru agend (RPP).', route:'#/gap'},
      {icon:'🔗', title:'Kotveno do reálných dat RPP', body:'Tam, kde český systém v open datech RPP skutečně existuje, není jen text — je to proklik (↗) přímo na jeho detail (Registr obyvatel, RÚIAN, datové schránky, Czech POINT, RPP…). Sekce A je odborný odhad k diskusi, ale opírá se o reálné systémy, ne o dojmy.', route:'#/gap'},
      {icon:'♻️', title:'Kde přebýváme — paralelní instalace téže rodiny', body:'Čistě z dat: kolik samostatných instalací téhož produktu běží napříč státem a u kolika různých správců (KEO, Munis, GORDIC, Vita…). Vysoký počet instalací u mála produktů je kandidát na sdílenou službu. RPP ale neobsahuje náklady, takže o úspoře nic netvrdíme — ukazujeme jen čísla.', route:'#/gap'},
    ]},
  { ver:'6.1', date:'16. 6. 2026', tag:'Reálná × odvozená × chybějící data — jasně odlišena',
    summary:'Reakce na připomínku, že se v aplikaci míchala reálná data s odvozenými a s chybějícími. Nově je u každé hodnoty jasně poznat její původ. (1) Smyšlená data jsme odstranili: nástroj už nehádá „rodinu produktu" z části názvu (to dřív slučovalo nesouvisející systémy jen proto, že sdílely první slovo); rodina se nově přiřadí jen ze slovníku známých produktů nebo když se PŘESNĚ stejný název reálně opakuje (≥2 instalace — např. ALIS), jinak zůstane prázdná. (2) Odvozené (analytické) hodnoty zůstávají, ale jsou všude označené značkou „⚙ odvozeno" s vysvětlením, že je dopočítal nástroj, ne zdroj RPP — týká se Důležitosti/Kritičnosti, Kategorie, Rodiny a Typu instituce/správce. (3) Chybějící pole RPP se zobrazují jako „neuvedeno" (kurzívou), odlišeně od nuly i od odvozené hodnoty. Nahoře na každé datové obrazovce je k tomu legenda původu hodnot.',
    steps:[
      {icon:'🧬', title:'Pryč se smyšlenými „rodinami produktů"', body:'Dřív každý systém dostal nějakou rodinu — i tam, kde žádný společný produkt není (nástroj ji uhádl z 1.–2. slova názvu a slučoval nesouvisející systémy). Nově se rodina přiřadí jen ze slovníku známých produktů (GINIS, KEO, VERA…) nebo z přesné shody názvu u ≥2 instalací (reálné rozšíření, např. ALIS). Ojedinělé systémy rodinu nedostanou — nic se nevymýšlí.', route:'#/isvs'},
      {icon:'⚙', title:'Značka „⚙ odvozeno" u všeho, co dopočítává nástroj', body:'Důležitost/Kritičnost, tematická Kategorie, Rodina produktu i Typ instituce/správce nejsou pole RPP — počítá je tento nástroj. Nově to u nich říká značka „⚙ odvozeno" (najetím myší se zobrazí, jak se hodnota počítá). Reálná pole RPP žádnou značku nemají.', route:'#/agendy'},
      {icon:'∅', title:'„neuvedeno" místo nejasné pomlčky', body:'Tam, kde zdroj RPP pole nevyplnil, je teď kurzívou „neuvedeno" — jasně odlišené od nuly i od odvozené hodnoty. Poznáte tak na první pohled, co je chybějící údaj a co spočítaný odhad.', route:'#/sluzby'},
      {icon:'🏷️', title:'Legenda původu hodnot na každé obrazovce', body:'Pod hlavičkou zdroje je nově krátká legenda: přímé pole RPP × ⚙ odvozeno (dopočítal nástroj) × neuvedeno (v RPP nevyplněno). Aby bylo bez ptaní jasné, čím se která hodnota bere.', route:'#/isvs'},
    ]},
  { ver:'6.0', date:'16. 6. 2026', tag:'Připomínky z druhého kola revize',
    summary:'Druhá dávka oprav podle podrobné zpětné vazby. Největší věc: dopadová analýza měla obrácený směr závislosti — výpadek registru jsme nesprávně promítali jako „pád" navázaných systémů. Teď to počítáme tak, jak to ve skutečnosti funguje: většina úřadů drží vlastní kopii kmene a po výpadku registru běží dál (jen neověří nově příchozího), okamžitě padají jen živě připojené systémy (policie, soudy, IZS). Editor registru navíc kaskádu nešíří — jeho výpadek jen znamená, že registr nedostane aktualizaci z toho místa. K tomu řada menších oprav: přesnější rozlišení registr × ISZR, doplněné detaily služeb (úkony, poskytovatel), nové filtry a vysvětlivky.',
    steps:[
      {icon:'🔁', title:'Dopady: opravený směr závislosti', body:'Kaskáda se nově šíří jen po čtecích (R) hranách, ne po zápisových (W). Výpadek základního registru už automaticky „nezkosí" navázané systémy — ty běží dál na lokální kopii a jen nedostávají aktualizace; okamžitě padají pouze živě připojené (policie, soudy, IZS, checkpointy) bez vlastní DB. Banner teď ukazuje „padá hned" vs. „běží dál (lokální kopie)".', route:'#/dopady'},
      {icon:'✎', title:'Editor registru kaskádu nešíří', body:'Když vypadne editor (systém, který do registru zapisuje), neznamená to pád ostatních — registr jen nedostane aktualizaci z tohoto úřadu, zbytek čte dál poslední platný stav. Nástroj na to u takového epicentra zvlášť upozorní.', route:'#/dopady'},
      {icon:'⬡', title:'Registr vs. ISZR — přesnější rozlišení', body:'Část systémů byla dřív označená jako „registr", i když registrem nejsou (Czech POINT, ISDS, ISZR, AISV, FAIS, ISSS) — patří do sdílené infrastruktury ISZR. Nově mají vlastní značku „⬡ ISZR" a „registr" nesou jen skutečné základní registry (ROB, ROS, RÚIAN). V seznamu ISVS na to je i filtr.', route:'#/isvs'},
      {icon:'🧾', title:'Detail služby: úkony, poskytovatel, agenda', body:'Detail služby teď ukazuje jednotlivé úkony (a zda jsou digitální), čitelného poskytovatele (i když je zadaný jako kategorie OVM — např. „Policie ČR") a navázanou agendu. Dřív tam byl jen počet úkonů a syrový kód.', route:'#/sluzby/'+encodeURIComponent('služba/S15024')},
      {icon:'🛡️', title:'Nové filtry: Bezpečnost „neuvedeno" a Kritičnost', body:'V seznamu systémů jde nově filtrovat i systémy bez uvedené bezpečnostní úrovně („neuvedeno") a filtr kritičnosti je správně pojmenovaný (dřív „Důležitost").', route:'#/isvs'},
      {icon:'❓', title:'Z čeho se počítá důležitost / kritičnost', body:'Nad každým seznamem je teď krátká vysvětlivka, podle čeho se pásmo počítá (u systémů dopad, u agend provázanost, u údajů rozsah…). U údajů jsme sloupec přejmenovali na „Rozsah", protože vychází z počtu položek, ne ze sémantické důležitosti.', route:'#/udaje'},
      {icon:'🔍', title:'Hledání v Dopadech a provozovatel ISVS', body:'V dopadové analýze lze epicentrum vyhledat podle názvu (dřív dlouhá roletka). A detail systému nově ukazuje provozovatele (a upozorní, když chybí — v RPP ho má vyplněného jen část systémů).', route:'#/dopady'},
    ]},
  { ver:'5.0', date:'15. 6. 2026', tag:'Sesouhlasení čísel s DIA',
    summary:'Po připomínce „tady nám to nesedí" jsme čísla v dashboardu sesouhlasili s počty, které uvádí DIA / T. Šedivec. Vychytali jsme tři věci: počet OVM teď počítá jen aktivní orgány (zaniklé se nezapočítávají), ISVS rozlišujeme na „celý registr" a „agendové" (to je to číslo ~3,4 tis., které uvádí DIA), a na dashboardu je nová tabulka „Srovnání s čísly DIA", která u každého rozdílu vysvětluje proč. Žádný z rozdílů není chyba v datech — jde o datum snapshotu a o to, co se do počtu zahrnuje.',
    steps:[
      {icon:'🟰', title:'Srovnávací tabulka „naše vs. DIA"', body:'Na dashboardu přibyla tabulka, která porovnává naše čísla s počty DIA (Šedivec) a u každého řádku vysvětluje rozdíl — aktivní vs. vše, agendové IS vs. celý registr, datum snapshotu. Žádné číslo není „špatně"; jen jsme dorovnali definice.', route:'#/dashboard'},
      {icon:'🏛️', title:'OVM = jen aktivní orgány (18 tis., ne 19,5 tis.)', body:'Registr obsahuje i 1 292 zaniklých (zrušených/sloučených) orgánů s datem ukončení. Ty teď do počtu nepatří — headline ukazuje aktivní OVM (~18,3 tis.), což sedí na číslo DIA. Zaniklé jsou v seznamu schované pod filtrem „Stav". (SPUÚ číslo neovlivňují — jsou v samostatné sadě.)', route:'#/ovm'},
      {icon:'🧩', title:'„Agendové IS" vs. celý registr ISVS', body:'Matoucí popisek „Systémy 12 110" byl celý registr ISVS (i provozní/neagendové). Přidali jsme samostatný ukazatel „agendové IS" (~3,6 tis. = navázané na agendu) — to je srovnatelné s číslem DIA ~3,4 tis. V datech přitom nejsou žádné duplicity (12 110 řádků = 12 110 unikátních systémů). Na seznamu ISVS lze filtrovat „agendové / neagendové".', route:'#/isvs'},
      {icon:'📅', title:'Agendy a služby: rozdíl je jen datum', body:'Naše agendy (406) i služby (9 607) jsou z živých open dat (denní aktualizace), proto se mírně liší od konferenčního čísla DIA (405 agend k 20. 5.) a od staršího „Reportu agendy VS" (387). Není to chyba — jen novější výřez.', route:'#/dashboard'},
    ]},
  { ver:'4.0', date:'15. 6. 2026', tag:'Znalostní vrstva — trojúhelník & CROP',
    summary:'Dva nové pohledy, které zhmotňují ontologii znalostní vrstvy (potvrzeno 19. schůzkou PS07): agenda rozbitá na vazby (Vejlupkův trojúhelník činnosti × hráči × hřiště) a redukce registru na to, co aktér potřebuje k rozhodnutí v dané činnosti (Common Relevant Operation Picture).',
    steps:[
      {icon:'🔺', title:'Rozpad agendy na vazby (trojúhelník)', body:'Vyber agendu a appka ji rozloží na pilíře: Činnosti (procesy ze zákona), Hráči (kdo odpovídá/rozhoduje/vykonává) a Hřiště (Prostředky = systémy/údaje · Lokality = působnost · Pravidla = §/oprávnění). Přepínač Struktura / obarvený graf dle ontologických vrstev.', route:'#/rozpad/'+encodeURIComponent('agenda/A338')},
      {icon:'🎯', title:'Znalostní vrstva · CROP', body:'Pro trojici (činnost × aktér × lokalita) nástroj zredukuje celý registr na výřez informací relevantních pro rozhodnutí — právní základ (§), data ke čtení, systémy, spolupracující hráče a úkony. Ukazuje i míru redukce (z tisíců systémů na hrstku relevantních).', route:'#/znalostni/'+encodeURIComponent('agenda/A338')},
      {icon:'🧭', title:'Poctivá hranice dat', body:'Oba pohledy přiznávají, že RPP mapuje zdroje na úrovni agendy — přímo na činnost je vázán jen §. Jemnější vazba „která činnost potřebuje který systém" je cílem znalostní vrstvy / procesního modelování (tendr DIA); RPP k tomu dává páteř.', route:'#/rozpad/'+encodeURIComponent('agenda/A338')},
    ]},
  { ver:'3.0', date:'13. 6. 2026', tag:'Revize 19. schůzky PS07',
    summary:'Velká revize věrnosti datům po recenzi Mirka Lukeše (ISKŘ/HZS), Petra Kučery (RPP zevnitř) a Martina Vlasty (správní právo) — nástroj nyní „rozumí logikám" RPP a je připraven pro DIA jako nástroj analýzy rizik.',
    steps:[
      {icon:'🔁', title:'Opravená polarita čte/zapisuje (R/W)', body:'U toků údajů i v grafu je teď vidět směr zdroj→příjemce a úroveň přístupu: R = čte, W = zapisuje (editor). Krizové řízení (A338) správně jen čte ze základních registrů, nezapisuje do nich.', route:'#/agendy/'+encodeURIComponent('agenda/A338')},
      {icon:'🏛️', title:'Kritičnost dle dopadu, ne dle počtu agend', body:'Žebříček „nejkritičtějších systémů" teď vede základními registry (ROB, ROS, Czech POINT, datové schránky…), ne spisovou službou malé obce. Počet navázaných agend je už jen informativní rozsah působnosti.', route:'#/dashboard'},
      {icon:'🧩', title:'Rodiny produktů (číselníková vrstva)', body:'Tentýž software pod mnoha názvy („KEO", „KEO 4", „KEO X Hosting") je sjednocen do rodin — bez přepisu zdroje. Přibyl žebříček nejrozšířenějších obecních systémů (rozšíření ≠ kritičnost).', route:'#/isvs'},
      {icon:'🎯', title:'Bezpečnostní úroveň = škála dopadu', body:'Místo matoucí zeleno-červené je teď neutrální škála 1→4 s výkladem vyhlášky (úroveň 4 = kritická, typicky registry; nesmí do veřejného cloudu). Najeď myší pro vysvětlení.', route:'#/isvs'},
      {icon:'🕸️', title:'Detail agendy: role, § a paprskový graf', body:'U činností přibyl odkaz na § eSbírky; přibyl paprskový graf „kdo agendu vykonává" (kategorie OVM dle úrovně: ústřední→krajská→obecní) a filtry/řazení/subsumace vykonávajících orgánů.', route:'#/agendy/'+encodeURIComponent('agenda/A338')},
      {icon:'⚠️', title:'Dopady: měkká vs. tvrdá závislost', body:'Kaskáda už není mechanická: rozlišuje měkkou závislost (lokální kopie + notifikace, odolná dny) od tvrdé/živé (policie, soudy, IZS — okamžitý pád). Přibyl časový horizont a ROB jako pilíř státní správy.', route:'#/dopady'},
      {icon:'📊', title:'Úplnost dat a hranice RPP', body:'Analytika ukazuje fill-rate klíčových polí (příležitost pro DIA) a poctivě uvádí, co RPP principiálně neobsahuje (kompetenční role, schvalování oprávnění, cloudové závislosti). Tón sjednocen na „analýza rizik", ne audit chyb.', route:'#/analytika'},
    ]},
  { ver:'2.0', date:'6/2026', tag:'Databáze & SQL',
    summary:'Vrstva pro kontrolu kvality dat a dotazování — surové propojené tabulky, fill-rate, referenční integrita a SQL nad RPP přímo v prohlížeči.',
    steps:[
      {icon:'🧮', title:'Databáze · kontrola kvality', body:'Surové propojené tabulky s klikacími cizími klíči, fill-rate každého sloupce, kontrola referenční integrity (neplatné odkazy) a přepínač „jen řádky s problémem". Export CSV.', route:'#/databaze'},
      {icon:'🔗', title:'SQL dotazy · JOIN', body:'Klientská SQLite (sql.js) přímo v prohlížeči — spojuj tabulky přes JOIN, nebo se zeptej česky a otázka se přeloží do SQL. Připravené příklady i export výsledku.', route:'#/dotazy'},
      {icon:'⭐', title:'Filtr Důležitost napříč entitami', body:'Každá entita dostala pásmo důležitosti (Kritická/Vysoká/Střední/Nízká) a filtr pro rychlé zúžení.', route:'#/agendy'},
      {icon:'🏷️', title:'Tematické a právní kategorie', body:'Agendy, služby a údaje dostaly tematickou oblast (daně, doprava, bezpečnost…) a odvozený právní předpis.', route:'#/agendy'},
    ]},
  { ver:'1.0', date:'6/2026', tag:'Základ — Mapa státu',
    summary:'První verze průzkumníka nad českým Registrem práv a povinností (RPP open data, správce DIA).',
    steps:[
      {icon:'▦', title:'Dashboard', body:'Přehled celého registru: agendy, systémy, orgány, služby, oprávnění a klíčové ukazatele na jedné obrazovce.', route:'#/dashboard'},
      {icon:'📋', title:'Propojené entity', body:'Agendy, informační systémy (ISVS), orgány (OVM), služby, údaje a oprávnění — vše proklikatelné s detaily a vzájemnými vazbami.', route:'#/agendy'},
      {icon:'🕸️', title:'Graf vazeb', body:'Interaktivní ego-graf: klikni na uzel a rozbal jeho sousedy, prozkoumej vazby celého registru.', route:'#/graf'},
      {icon:'⚠️', title:'Dopady & kaskády', body:'Simulace výpadku systému a propagace dopadu přes oprávnění mezi agendami.', route:'#/dopady'},
      {icon:'⚖️', title:'Analytika, srovnání, hledání', body:'Předpřipravené sestavy nad daty, porovnání agend a fulltextové hledání napříč registrem.', route:'#/analytika'},
    ]},
];
function newestVer(){ return CHANGELOG[0].ver; }
function guideSeen(){ try{ return localStorage.getItem('rpp_guide_seen')===newestVer(); }catch(e){ return true; } }
function markGuideSeen(){ try{ localStorage.setItem('rpp_guide_seen', newestVer()); }catch(e){} updateGuideBadge(); }
function updateGuideBadge(){
  const a = document.querySelector('.nav a[data-route="pruvodce"]'); if (!a) return;
  let dot = a.querySelector('.newdot');
  if (!guideSeen()){ if(!dot){ dot=document.createElement('span'); dot.className='newdot'; dot.textContent=' ●'; dot.style.cssText='color:#ff2d8d;font-size:11px'; a.appendChild(dot);} }
  else if (dot){ dot.remove(); }
}
async function pruvodce(arg){
  let idx = CHANGELOG.findIndex(v=>v.ver===arg); if (idx<0) idx=0;
  const v = CHANGELOG[idx];
  if (v.ver===newestVer()) markGuideSeen();
  let step = 0;
  view.innerHTML = `
    <div class="pagehdr"><div><h1>Průvodce novinkami <span class="badge cyan">aktuálně v${esc(newestVer())}</span></h1>
      <div class="sub">Co se v nástroji „mapa státu" změnilo — proklikej si novinky, nebo přepni na starší verzi a porovnej.</div></div></div>
    <div class="dbtabs" id="vertabs">${CHANGELOG.map((x,i)=>`<a class="dbtab ${x.ver===v.ver?'active':''}" href="#/pruvodce/${x.ver}">v${esc(x.ver)} · ${esc(x.tag)}${i===0?' <span class="n">nové</span>':''}</a>`).join('')}</div>
    <div class="card">
      <h2>Verze ${esc(v.ver)} — ${esc(v.tag)} <span class="small muted">${esc(v.date)}</span> <span class="badge grey">${v.steps.length} novinek</span></h2>
      <div class="desc">${esc(v.summary)}</div>
    </div>
    <div class="card" id="stepcard"></div>
    <div class="card"><h2>Všechny novinky verze ${esc(v.ver)}</h2><div id="alllist"></div></div>`;
  function drawStep(){
    const s = v.steps[step]; const n = v.steps.length;
    byId('stepcard').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="muted small">Krok ${step+1} / ${n}</span>
        <span>${v.steps.map((_,i)=>`<span style="display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 2px;background:${i===step?'var(--navy)':'#cdd9e8'};cursor:pointer" data-dot="${i}"></span>`).join('')}</span>
      </div>
      <h2 style="font-size:21px">${esc(s.icon||'')} ${esc(s.title)}</h2>
      <p class="small" style="line-height:1.75;margin:8px 0 16px;max-width:60ch">${esc(s.body)}</p>
      <div class="toolbar">
        <button class="btn" id="sprev" ${step===0?'disabled style=opacity:.4':''}>← Zpět</button>
        ${s.route?`<a class="btn neon" href="${s.route}">Ukázat v aplikaci →</a>`:''}
        <button class="btn" id="snext">${step<n-1?'Další →':'Hotovo ✓'}</button>
      </div>`;
    const p=byId('sprev'); if(p) p.addEventListener('click',()=>{ if(step>0){step--;drawStep();} });
    byId('snext').addEventListener('click',()=>{ if(step<n-1){step++;drawStep();} else { location.hash='#/dashboard'; } });
    byId('stepcard').querySelectorAll('[data-dot]').forEach(d=>d.addEventListener('click',()=>{ step=+d.dataset.dot; drawStep(); }));
  }
  byId('alllist').innerHTML = v.steps.map((s,i)=>`<div class="kv"><span>${esc(s.icon||'')} <a href="javascript:void(0)" class="link" data-step="${i}">${esc(s.title)}</a></span><b>${s.route?`<a class="link" href="${s.route}">ukázat →</a>`:''}</b></div>`).join('');
  byId('alllist').querySelectorAll('[data-step]').forEach(a=>a.addEventListener('click',()=>{ step=+a.dataset.step; drawStep(); byId('stepcard').scrollIntoView({behavior:'smooth',block:'center'}); }));
  drawStep();
}

/* ---------- ZNALOSTNÍ VRSTVA: ontologie hráči × hřiště × činnosti ----------
   Vejlupkův trojúhelník nad RPP (potvrzeno 19. schůzkou PS07, M. Lukeš):
   ČINNOST (proces ze zákona / očekávaná událost) je sjednocující jednotka;
   mapuje se na HRÁČE (kdo odpovídá/rozhoduje/vykonává) a na HŘIŠTĚ
   (PROSTŘEDKY = systémy/údaje · LOKALITY = působnost · PRAVIDLA = §/oprávnění).
   ⚠ Poctivost: RPP mapuje zdroje/orgány na úrovni AGENDY, ne jednotlivé činnosti.
   Na činnost je přímo navázán jen § (právní základ). Jemnější vazba činnost→systém
   je přesně to, co má doplnit znalostní vrstva / procesní modelování (DIA tendr). */
const ONTO = {
  cinnost:    {col:'#f5a623', label:'Činnosti', icon:'⚙', desc:'procesy předepsané zákonem / očekávané události'},
  hrac:       {col:'#7c5cff', label:'Hráči',    icon:'👤', desc:'kdo odpovídá, rozhoduje a vykonává (role / kategorie OVM)'},
  prostredek: {col:'#00d8ff', label:'Prostředky', icon:'🧰', desc:'systémy (ISVS) a datové zdroje (registry/údaje)'},
  lokalita:   {col:'#2ecc71', label:'Lokality', icon:'📍', desc:'kde se činnost odehrává (úroveň působnosti)'},
  pravidlo:   {col:'#ff2d8d', label:'Pravidla', icon:'§', desc:'zákon, § a oprávnění (toky údajů R/W)'},
};
function agShort(a){ let n=(a.nazev||'').replace(/^Zákon\s+č\.\s*/i,'z. ').replace(/,?\s*ve znění pozdějších předpisů.*$/i,''); return a.kod+' · '+(n.length>78?n.slice(0,78)+'…':n); }
function locBandOf(lvl){ return lvl<=1?'ústřední':lvl===2?'krajská':lvl<=5?'obecní / ORP':'jiná'; }
/* rozklad působnosti (vzorek ovm_t) na pásma lokalit */
function ovmBands(a){ const b={}; (a.ovm_t||[]).forEach(t=>{ const lvl=OVM_ABBR_LEVEL[t]??7; const k=locBandOf(lvl); b[k]=(b[k]||0)+1; }); return b; }
/* společný výběr agendy (select 406 agend, řazeno dle kódu) → naviguje hashem */
function agendaPicker(rows, curId, route){
  const opts=rows.slice().sort((x,y)=>x.kod.localeCompare(y.kod,'cs'))
    .map(a=>`<option value="${esc(a.id)}" ${a.id===curId?'selected':''}>${esc(agShort(a))}</option>`).join('');
  return `<select id="agpick" style="min-width:340px;max-width:60vw">${opts}</select>`;
}
function bindAgendaPicker(route){ const s=byId('agpick'); if(s) s.addEventListener('change',e=>{ location.hash='#/'+route+'/'+encodeURIComponent(e.target.value); }); }
function ontoLegend(keys){ return `<div class="legend">`+ (keys||Object.keys(ONTO)).map(k=>`<span><i style="background:${ONTO[k].col}"></i>${ONTO[k].icon} ${ONTO[k].label}</span>`).join('') + `</div>`; }

/* ====================== VIEW 1: ROZPAD AGENDY NA VAZBY ====================== */
async function rozpad(arg){
  await ensureNames();
  const rows = await load('agendy');
  const agMap = Object.fromEntries(rows.map(a=>[a.id,a]));
  const parts = location.hash.replace(/^#\//,'').split('/');   // [route, encId, mode]
  const id = parts[1] ? decodeURIComponent(parts[1]) : null;
  const a = (id && agMap[id]) || agMap['agenda/A338'] || rows[0];
  const mode = parts[2] || 'struct';   // #/rozpad/<id>/<mode>
  view.innerHTML = `
    <div class="pagehdr"><div><h1>Rozpad agendy na vazby</h1>
      <div class="sub">Vejlupkův trojúhelník: <b>činnosti × hráči × hřiště</b> — co s čím v agendě souvisí</div></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${agendaPicker(rows,a.id,'rozpad')}
        <span class="toolbar" style="gap:0;border:1px solid var(--line);border-radius:9px;overflow:hidden">
          <button class="btn" id="mStruct" style="border:0;border-radius:0;${mode!=='graf'?'background:var(--navy);color:#fff':''}">▤ Struktura</button>
          <button class="btn" id="mGraf" style="border:0;border-radius:0;${mode==='graf'?'background:var(--navy);color:#fff':''}">🕸️ Graf</button>
        </span></div></div>
    ${srcHeader('agendy')}
    <div class="crumb"><a href="#/agendy/${encodeURIComponent(a.id)}">${esc(a.kod)} — detail agendy</a> · <a href="#/znalostni/${encodeURIComponent(a.id)}">→ Znalostní vrstva (CROP)</a></div>
    <div id="trojhdr"></div>
    ${ontoLegend()}
    <div id="rozpadbody"><div class="loading"><span class="spin"></span>Načítám…</div></div>`;
  bindAgendaPicker('rozpad');
  byId('mStruct').addEventListener('click',()=>{ location.hash='#/rozpad/'+encodeURIComponent(a.id)+'/struct'; });
  byId('mGraf').addEventListener('click',()=>{ location.hash='#/rozpad/'+encodeURIComponent(a.id)+'/graf'; });
  // trojúhelníkový banner (3 pilíře)
  const bands=ovmBands(a);
  byId('trojhdr').innerHTML = `<div class="grid3 trojban">
    ${trojTile('cinnost', fmt(a.c.cinnosti), 'činností (§ procesy)')}
    ${trojTile('hrac', fmt((a.kat_roles||[]).length), 'rolí / kategorií OVM · '+fmt(a.c.ovm)+' orgánů')}
    ${trojTile('hriste', fmt(a.c.isvs)+'+'+fmt(a.c.opr_in+a.c.opr_out), 'systémů + toků · '+Object.keys(bands).length+' úrovní lokalit')}
  </div>`;
  if (mode==='graf') await rozpadGraf(a, agMap);
  else await rozpadStruct(a);
}
function trojTile(onto, big, small){
  const o = onto==='hriste' ? {col:'#16a085', icon:'🏟️', label:'Hřiště'} : ONTO[onto];
  return `<div class="card" style="border-top:4px solid ${o.col};margin-bottom:0">
    <div style="font-size:26px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:${o.col}">${o.icon} ${big}</div>
    <div style="color:var(--muted);font-size:12px;margin-top:4px"><b style="color:#0f2748">${o.label}</b> · ${small}</div>
  </div>`;
}
async function rozpadStruct(a){
  const [opr, sluzby] = await Promise.all([load('opravneni'), load('sluzby')]);
  const bere = opr.filter(o=>o['do']===a.id), dava = opr.filter(o=>o['z']===a.id);
  const aServices = sluzby.filter(s=>s.agenda===a.id);
  const pars = [...new Set((a.cinnosti||[]).map(c=>c.par).filter(Boolean))];
  const bands = ovmBands(a); const sampleN=(a.ovm_t||[]).length;
  const bandOrder=['ústřední','krajská','obecní / ORP','jiná'];
  byId('rozpadbody').innerHTML = `
  <div class="grid2">
    <div>
      <div class="card" style="border-left:4px solid ${ONTO.cinnost.col}">
        <h2>${ONTO.cinnost.icon} Činnosti <span class="badge grey">${fmt(a.c.cinnosti)}</span></h2>
        <div class="desc">Procesy předepsané zákonem (a očekávané události, které agenda řeší). Na činnost je v RPP přímo navázán <b>§ (právní základ)</b>; ostatní pilíře jsou na úrovni agendy.</div>
        ${table((a.cinnosti||[]).slice(0,200), [
          {h:'Kód',cls:'mono',render:c=>esc(c.kod)},
          {h:'Činnost',render:c=>esc(c.nazev)},
          {h:'§ (eSbírka)',render:c=>parLink(c)},
          {h:'Výkon',render:c=>c.vol?'<span class="badge warn">volitelný</span>':'<span class="badge ok">povinný</span>'},
          {h:'',render:c=>`<a class="link" href="#/znalostni/${encodeURIComponent(a.id)}/${encodeURIComponent(c.kod)}">CROP →</a>`},
        ])}
      </div>
      <div class="card" style="border-left:4px solid ${ONTO.hrac.col}">
        <h2>${ONTO.hrac.icon} Hráči — kdo odpovídá, rozhoduje a vykonává <span class="badge grey">${fmt((a.kat_roles||[]).length)}</span></h2>
        <div class="desc">Role / kategorie OVM dle úrovně (ústřední → krajská → obecní). Gestor agendy: <b>${link(a.ohlasovatel)}</b>.</div>
        ${(a.kat_roles&&a.kat_roles.length)? renderRoles(a.kat_roles) : '<div class="empty">Kategorie OVM neuvedeny.</div>'}
        <div class="kv" style="margin-top:8px"><span>Vykonávajících orgánů celkem</span><b>${fmt(a.c.ovm)}</b></div>
      </div>
    </div>
    <div>
      <div class="card" style="border-left:4px solid ${ONTO.prostredek.col}">
        <h2>${ONTO.prostredek.icon} Hřiště · Prostředky — systémy a data <span class="badge grey">${fmt(a.c.isvs)}</span></h2>
        <div class="desc">Informační systémy (ISVS) podporující agendu a datové toky (princip only-once).</div>
        ${(a.isvs||[]).length? table((a.isvs||[]).slice(0,12).map(id=>({id})),[
          {h:'Systém',render:r=>link(r.id)},
          {h:'',render:r=>`<a class="link" href="#/dopady/${encodeURIComponent(r.id)}">⚠ dopad</a>`},
        ]) : '<div class="empty">Bez navázaného ISVS.</div>'}
        ${(a.isvs||[]).length>12?`<div class="muted small">+ ${fmt(a.isvs.length-12)} dalších systémů</div>`:''}
        <div class="kv" style="margin-top:8px"><span>← Čte / bere z jiných agend</span><b>${fmt(bere.length)}</b></div>
        ${bere.slice(0,6).map(o=>`<div class="kv"><span>← čte z${o.z_reg?' '+badgeRegistr():''}</span><b>${link(o['z'])} ${rwBadges(o.rw)}</b></div>`).join('')}
        <div class="kv" style="margin-top:6px"><span>→ Poskytuje jiným agendám</span><b>${fmt(dava.length)}</b></div>
      </div>
      <div class="card" style="border-left:4px solid ${ONTO.lokalita.col}">
        <h2>${ONTO.lokalita.icon} Hřiště · Lokality — kde se to odehrává</h2>
        <div class="desc">Úroveň působnosti (z ${fmt(sampleN)} vzorku orgánů; celkem ${fmt(a.c.ovm)}).</div>
        ${bandOrder.filter(b=>bands[b]).map(b=>{ const pct=Math.round(bands[b]/sampleN*100);
          return `<div class="bar tight"><div class="lbl">${esc(b)}</div><div class="track"><div class="fill" style="width:${pct}%;background:${ONTO.lokalita.col}"></div></div><div class="val">${pct}%</div></div>`;}).join('') || '<div class="empty">—</div>'}
      </div>
      <div class="card" style="border-left:4px solid ${ONTO.pravidlo.col}">
        <h2>${ONTO.pravidlo.icon} Hřiště · Pravidla — co na hřišti platí</h2>
        <div class="kv"><span>Zákonný rámec</span><b>${esc(a.kod)} ${a.registr?badgeRegistr():''}</b></div>
        <div class="desc" style="margin:4px 0">${esc((a.nazev||'').slice(0,150))}</div>
        <div class="kv"><span>Dotčených § (eSbírka)</span><b>${fmt(pars.length)}</b></div>
        <div style="line-height:2.1">${pars.slice(0,18).map(p=>`<span class="chip">${esc(p)}</span>`).join(' ')}${pars.length>18?` <span class="muted small">+${pars.length-18}</span>`:''}</div>
        <div class="kv" style="margin-top:8px"><span>Oprávnění / toky údajů (pravidla přístupu)</span><b>${fmt(bere.length+dava.length)} <span class="badge cyan">R</span>/<span class="badge pink">W</span></b></div>
        <div class="kv"><span>Služeb / úkonů agendy</span><b>${fmt(aServices.length)}</b></div>
      </div>
    </div>
  </div>
  <div class="card" style="border-left:4px solid #94a3b8">
    <div class="desc"><b>Poctivá poznámka k datům.</b> RPP eviduje vazby na úrovni <b>agendy</b> — ne jednotlivé činnosti. Přímo na činnost je navázán pouze <b>§ (právní základ)</b>. Mapování „která činnost potřebuje který systém / orgán / komoditu" RPP principiálně nezná; je to úkol <b>znalostní vrstvy</b> (procesní modelování agend — chystaný tendr DIA). Krizové „prostředky" (zásoby, zdravotnické/záchranné prostředky) RPP neobsahuje — ty patří do krizové větve znalostní vrstvy.</div>
  </div>`;
}
async function rozpadGraf(a, agMap){
  byId('rozpadbody').innerHTML = `<div id="cyr"></div>
    <div class="muted small" style="margin-top:8px">Uzly jsou obarvené dle ontologické vrstvy. Klik na systém/agendu = detail. Centrum = agenda; satelity = pilíře (Činnosti · Hráči · Prostředky · Lokality · Pravidla).</div>`;
  const host=byId('cyr'); host.style.cssText='height:620px;border-radius:14px;background:radial-gradient(circle at 50% 42%, #112c57, #060f24);border:1px solid #0c1f44';
  if(!window.cytoscape){ host.innerHTML='<div class="empty">Graf nelze načíst.</div>'; return; }
  const opr = await load('opravneni');
  const els=[]; const add=(id,label,onto,cls)=>els.push({data:{id,label,onto},classes:cls||''});
  const link2=(s,t,onto)=>els.push({data:{id:s+'~'+t,source:s,target:t,onto}});
  add(a.id, a.kod, 'cinnost', 'hub');
  // kategorie-hub uzly
  const cats=[['cat:cinnost','cinnost','Činnosti'],['cat:hrac','hrac','Hráči'],['cat:prostredek','prostredek','Prostředky'],['cat:lokalita','lokalita','Lokality'],['cat:pravidlo','pravidlo','Pravidla']];
  cats.forEach(([id,onto,lab])=>{ add(id, lab, onto, 'cat'); link2(a.id,id,onto); });
  (a.cinnosti||[]).slice(0,6).forEach((c,i)=>{ const id='cin:'+c.kod; add(id, (c.nazev||c.kod).slice(0,30), 'cinnost'); link2('cat:cinnost',id,'cinnost'); });
  (a.kat_roles||[]).slice(0,6).forEach(r=>{ const id='role:'+r.id; add(id, (r.nazev||'').slice(0,28), 'hrac'); link2('cat:hrac',id,'hrac'); });
  (a.isvs||[]).slice(0,6).forEach(id=>{ add(id, (nameOf(id)||id).slice(0,30), 'prostredek'); link2('cat:prostredek',id,'prostredek'); });
  Object.keys(ovmBands(a)).forEach(b=>{ const id='loc:'+b; add(id, b, 'lokalita'); link2('cat:lokalita',id,'lokalita'); });
  opr.filter(o=>o['do']===a.id).slice(0,4).forEach(o=>{ if(!agMap[o['z']])return; add(o['z'], (nameOf(o['z'])||o['z']).slice(0,28), 'pravidlo'); link2('cat:pravidlo',o['z'],'pravidlo'); });
  const cy=cytoscape({ container:host, elements:els, wheelSensitivity:0.2,
    style:[
      {selector:'node',style:{'background-color':e=>ONTO[e.data('onto')]?.col||'#64748b','label':'data(label)','font-size':'9px','font-weight':600,'color':'#eaf2ff','text-outline-width':2.5,'text-outline-color':'#06122b','text-valign':'bottom','text-margin-y':4,'text-wrap':'wrap','text-max-width':'96px','width':22,'height':22,'border-width':2,'border-color':'rgba(255,255,255,.25)'}},
      {selector:'node.hub',style:{'background-color':'#ffffff','border-color':'#00d8ff','border-width':4,'color':'#bfe9ff','width':50,'height':50,'font-size':'12px'}},
      {selector:'node.cat',style:{'width':34,'height':34,'font-size':'11px','border-width':3,'border-color':'rgba(255,255,255,.5)'}},
      {selector:'edge',style:{'width':1.8,'curve-style':'bezier','opacity':0.7,'line-color':e=>ONTO[e.data('onto')]?.col||'#64748b','target-arrow-shape':'none'}},
    ],
    layout:{name:'concentric', concentric:n=>n.hasClass('hub')?3:n.hasClass('cat')?2:1, levelWidth:()=>1, minNodeSpacing:42, padding:30} });
  cy.on('tap','node',e=>{ const id=e.target.id(); const rt=routeOf(id); if(rt) location.hash='#/'+rt+'/'+encodeURIComponent(id); });
}

/* ====================== VIEW 2: ZNALOSTNÍ VRSTVA (CROP) ====================== */
/* Pro (činnost, aktér, lokalita) zredukuje registr na výřez informací relevantních
   pro ROZHODNUTÍ v rámci činnosti = Common Relevant Operation Picture. */
async function znalostni(arg){
  await ensureNames();
  const rows = await load('agendy');
  const agMap = Object.fromEntries(rows.map(a=>[a.id,a]));
  const parts = location.hash.replace(/^#\//,'').split('/');   // [route, encId, cinKod]
  const id = parts[1] ? decodeURIComponent(parts[1]) : null;
  const a = (id && agMap[id]) || agMap['agenda/A338'] || rows[0];
  const preCin = parts[2] ? decodeURIComponent(parts[2]) : '';
  const [opr, sluzby] = await Promise.all([load('opravneni'), load('sluzby')]);
  const roleLvls = [...new Set((a.kat_roles||[]).map(r=>r.lvl))];
  const bands = Object.keys(ovmBands(a));
  view.innerHTML = `
    <div class="pagehdr"><div><h1>Znalostní vrstva · CROP</h1>
      <div class="sub">Pro <b>(činnost × aktér × lokalita)</b> zobraz jen ty informace, které potřebuješ k rozhodnutí — Common Relevant Operation Picture</div></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${agendaPicker(rows,a.id,'znalostni')}</div></div>
    ${srcHeader('agendy')}
    <div class="crumb"><a href="#/rozpad/${encodeURIComponent(a.id)}">← Rozpad agendy na vazby</a></div>
    <div class="card"><div class="toolbar" style="gap:14px;flex-wrap:wrap;align-items:flex-end">
      <label style="display:flex;flex-direction:column;gap:3px">${ONTO.cinnost.icon} <b>Činnost</b>
        <select id="selCin" style="min-width:320px"><option value="">— celá agenda —</option>
          ${(a.cinnosti||[]).map(c=>`<option value="${esc(c.kod)}" ${c.kod===preCin?'selected':''}>${esc(c.kod)} · ${esc((c.nazev||'').slice(0,60))}</option>`).join('')}</select></label>
      <label style="display:flex;flex-direction:column;gap:3px">${ONTO.hrac.icon} <b>Aktér</b>
        <select id="selAkt" style="min-width:170px"><option value="">— kterýkoli —</option>
          ${roleLvls.map(l=>`<option value="${esc(l)}">${esc(l)} úroveň</option>`).join('')}</select></label>
      <label style="display:flex;flex-direction:column;gap:3px">${ONTO.lokalita.icon} <b>Lokalita</b>
        <select id="selLok" style="min-width:170px"><option value="">— kdekoli —</option>
          ${bands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join('')}</select></label>
    </div></div>
    <div id="cropout"></div>`;
  bindAgendaPicker('znalostni');
  function draw(){
    const cin = byId('selCin').value, akt = byId('selAkt').value, lok = byId('selLok').value;
    const c = (a.cinnosti||[]).find(x=>x.kod===cin);
    const bere = opr.filter(o=>o['do']===a.id);
    const roles = (a.kat_roles||[]).filter(r=>!akt || r.lvl===akt);
    const aServices = sluzby.filter(s=>s.agenda===a.id);
    const allBands = ovmBands(a); const relOrg = lok? (allBands[lok]||0) : (a.ovm_t||[]).length;
    const chips = [
      `<span class="chip" style="background:${ONTO.cinnost.col};color:#06122b">⚙ ${esc(c?c.kod:'celá agenda')}</span>`,
      `<span class="chip" style="background:${ONTO.hrac.col};color:#fff">👤 ${esc(akt||'kterýkoli aktér')}</span>`,
      `<span class="chip" style="background:${ONTO.lokalita.col};color:#06122b">📍 ${esc(lok||'kdekoli')}</span>`,
    ].join(' ');
    byId('cropout').innerHTML = `
    <div class="card" style="border:2px solid var(--navy);background:linear-gradient(180deg,#f7faff,#fff)">
      <h2>🎯 Relevantní operační obraz pro rozhodnutí</h2>
      <div style="margin:4px 0 10px">${chips}</div>
      <div class="desc">Redukce registru: z <b>${fmt(rows.length)}</b> agend a <b>${fmt(12110)}</b> systémů státu je pro toto rozhodnutí relevantní <b>1 agenda</b>, <b>${fmt((a.isvs||[]).length)}</b> systémů, <b>${fmt(bere.length)}</b> datových toků, <b>${fmt(relOrg)}</b> orgánů (${lok||'všechny úrovně'}).</div>
    </div>
    <div class="grid2">
      <div>
        <div class="card" style="border-left:4px solid ${ONTO.pravidlo.col}">
          <h2>§ Právní základ (vázán přímo na činnost)</h2>
          ${c? `<div class="kv"><span>Činnost</span><b>${esc(c.nazev)}</b></div>
            <div class="kv"><span>Paragraf</span><b>${parLink(c)}</b></div>
            <div class="kv"><span>Výkon</span><b>${c.vol?'<span class="badge warn">volitelný</span>':'<span class="badge ok">povinný</span>'}</b></div>`
            : `<div class="desc">Vyber konkrétní činnost pro § a právní základ. Zákonný rámec agendy: <b>${esc(a.kod)}</b>.</div>`}
          <div class="kv" style="margin-top:6px"><span>Zákon</span><b>${esc((a.nazev||'').slice(0,120))}</b></div>
        </div>
        <div class="card" style="border-left:4px solid ${ONTO.hrac.col}">
          <h2>👤 S kým rozhoduji / spolupracuji <span class="badge grey">${fmt(roles.length)}</span></h2>
          <div class="desc">Hráči ${akt?`na <b>${esc(akt)}</b> úrovni`:'všech úrovní'}, kteří se na činnosti podílejí.</div>
          ${roles.length? renderRoles(roles) : '<div class="empty">Pro zvolenou úroveň nejsou v RPP vykonavatelé.</div>'}
        </div>
      </div>
      <div>
        <div class="card" style="border-left:4px solid ${ONTO.prostredek.col}">
          <h2>🧰 Co potřebuji vědět — datové zdroje <span class="badge grey">${fmt(bere.length)}</span></h2>
          <div class="desc">Údaje, které agenda čte z jiných registrů (princip only-once). To jsou informace dostupné pro rozhodnutí.</div>
          ${bere.length? bere.slice(0,12).map(o=>`<div class="kv"><span>← čte z${o.z_reg?' '+badgeRegistr():''}</span><b>${link(o['z'])} ${rwBadges(o.rw)} ${o.pocet_udaju?`<span class="muted small">${o.pocet_udaju} údajů</span>`:''}</b></div>`).join('') : '<div class="empty">Agenda nečte z jiných registrů (nebo není v RPP evidováno).</div>'}
        </div>
        <div class="card" style="border-left:4px solid ${ONTO.prostredek.col}">
          <h2>🧰 Systémy, do kterých sahám (prostředky) <span class="badge grey">${fmt((a.isvs||[]).length)}</span></h2>
          ${(a.isvs||[]).length? (a.isvs||[]).slice(0,8).map(id=>`<div class="kv"><span>💻</span><b>${link(id)}</b></div>`).join('') : '<div class="empty">—</div>'}
          ${(a.isvs||[]).length>8?`<div class="muted small">+ ${fmt(a.isvs.length-8)} dalších</div>`:''}
        </div>
        <div class="card" style="border-left:4px solid ${ONTO.cinnost.col}">
          <h2>⚙ Čím to konám — služby / úkony <span class="badge grey">${fmt(aServices.length)}</span></h2>
          ${aServices.length? aServices.slice(0,8).map(s=>`<div class="kv"><span>${esc((s.typ||'').trim()||'úkon')}</span><b>${link(s.id,s.nazev)}</b></div>`).join('') : '<div class="empty">—</div>'}
        </div>
      </div>
    </div>
    <div class="card" style="border-left:4px solid #94a3b8"><div class="desc"><b>Jak číst CROP.</b> Jediná vrstva vázaná přímo na <b>činnost</b> je § (právní základ). Datové zdroje, systémy, hráči a lokality jsou v RPP na úrovni <b>agendy</b> a tady se filtrují dle zvoleného aktéra a lokality. Skutečné „pro tuto činnost potřebuji přesně tyto údaje z těchto systémů" je cílový stav <b>znalostní vrstvy</b> (procesní modelování) — RPP k tomu dává páteř, ne hotovou redukci.</div></div>`;
  }
  ['selCin','selAkt','selLok'].forEach(id=>byId(id).addEventListener('change',draw));
  draw();
}

/* ---------- ROUTER ---------- */
const ROUTES = {dashboard,agendy,ovm,isvs,sluzby,udaje,opravneni,graf,dopady,analytika,srovnani,gap,hledat,about,databaze,dotazy,pruvodce,rozpad,znalostni};
function parseHash(){
  const h = location.hash.replace(/^#\//,'') || 'dashboard';
  const parts = h.split('/');
  const route = parts.shift();
  const arg = parts.length ? decodeURIComponent(parts.join('/')) : null;
  return {route, arg};
}
function setActive(route){
  document.querySelectorAll('.nav a[data-route]').forEach(a=>a.classList.toggle('active', a.dataset.route===route));
}
async function render(){
  const {route, arg} = parseHash();
  const fn = ROUTES[route] || dashboard;
  view.innerHTML = '<div class="loading"><span class="spin"></span>Načítám…</div>';
  setActive(route);
  if (window.gtag) gtag('event','page_view',{page_title:route, page_path:location.hash||'#/dashboard', page_location:location.href});
  try { await fn(arg); }
  catch(e){ console.error(e); view.innerHTML = '<div class="empty">Chyba při načítání: '+esc(e.message)+'</div>'; }
  document.querySelector('.content').scrollTo(0,0);
}
window.addEventListener('hashchange', render);

/* global search box */
byId('globalsearch').addEventListener('keydown', e=>{
  if (e.key==='Enter'){ const v=e.target.value.trim(); if(v) location.hash = '#/hledat/'+encodeURIComponent(v); }
});
/* export current list to CSV */
byId('exportbtn').addEventListener('click', ()=>{
  const ex = window.__export;
  if (!ex || !ex.rows || !ex.rows.length){ alert('Export je dostupný na seznamových obrazovkách.'); return; }
  const cols = ex.cols;
  const strip = h => String(h).replace(/<[^>]*>/g,'').replace(/"/g,'""').trim();
  const head = cols.map(c=>`"${strip(c.h)}"`).join(',');
  const body = ex.rows.slice(0,5000).map(r=>cols.map(c=>`"${strip(c.render(r))}"`).join(',')).join('\n');
  const blob = new Blob(['﻿'+head+'\n'+body], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=(ex.name||'export')+'.csv'; a.click(); URL.revokeObjectURL(url);
});

/* logout: clear unlock + return to gate */
(function(){ var b=byId('logoutbtn'); if(b) b.addEventListener('click', function(){
  try{ localStorage.removeItem('rpp_access'); }catch(e){}
  if(window.gtag) gtag('event','logout');
  location.reload();
}); })();

/* novinky: zvýrazni „● nové" v menu; vrátí-li se odemčený uživatel a vyšla nová
   verze, otevři mu rovnou průvodce (jen z výchozí obrazovky, ať nerušíme deep-linky) */
updateGuideBadge();
if (!window.__locked){
  const h = location.hash;
  if (!guideSeen() && (!h || h==='#/' || h==='#/dashboard')){ location.hash = '#/pruvodce'; }
  else { render(); }
}
