/* RPP Explorer — SPA. Vanilla JS, hash router, lazy JSON, Cytoscape graph. */
'use strict';
const view = document.getElementById('view');
const DATA = {};
const NAMES = {};

/* ---------- utils ---------- */
const esc = s => (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => (n == null ? '' : Number(n).toLocaleString('cs-CZ'));
const byId = i => document.getElementById(i);
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
function badgeSec(level){
  if (!level) return '<span class="badge grey">neuvedeno</span>';
  const l = level.toLowerCase();
  let c = 'grey';
  if (l.includes('vysok') || l.includes('kritick')) c = 'ok';
  else if (l.includes('střed')) c = 'warn';
  else if (l.includes('nízk')) c = 'bad';
  return `<span class="badge ${c}">${esc(level)}</span>`;
}

/* ---------- generic list page ---------- */
function listPage(opts){
  // opts: {rows, cols, searchText(r), filters:[{label,values,test(r,v)}], exportName}
  const state = { q:'', limit:150, f:{} };
  const tools = (opts.filters||[]).map((fl,i)=>`<select data-f="${i}"><option value="">${esc(fl.label)}: vše</option>${fl.values.map(v=>`<option>${esc(v)}</option>`).join('')}</select>`).join('');
  view.querySelector('.content,#view'); // noop
  const host = document.createElement('div');
  host.innerHTML = `<div class="toolbar">
      <input class="grow" id="lq" placeholder="Filtrovat podle názvu / kódu…">
      ${tools}
      <span class="count" id="lc"></span>
    </div><div id="ltable"></div>
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
   <div class="kpis">
     <a class="kpi" href="#/agendy"><div class="v">${fmt(c.agendy)}</div><div class="l">Agendy</div></a>
     <a class="kpi" href="#/isvs"><div class="v">${fmt(c.isvs)}</div><div class="l">Systémy (ISVS)</div></a>
     <a class="kpi" href="#/ovm"><div class="v">${fmt(c.ovm)}</div><div class="l">Orgány (OVM)</div></a>
     <a class="kpi" href="#/sluzby"><div class="v">${fmt(c.sluzby)}</div><div class="l">Služby</div></a>
     <a class="kpi" href="#/opravneni"><div class="v">${fmt(c.opravneni)}</div><div class="l">Oprávnění k údajům</div></a>
     <div class="kpi"><div class="v">${fmt(c.pusobnost)}</div><div class="l">Vazby působnosti</div></div>
   </div>
   <div class="grid2">
     <div>
       <div class="card">
         <h2>Bezpečnostní úroveň systémů <span class="badge ${pctLevel<50?'bad':'ok'}">${pctLevel}% uvedeno</span></h2>
         <div class="desc">Zásadní mezera v datech: většina ISVS nemá v RPP uvedenou bezpečnostní úroveň</div>
         <div class="cov">
           <div class="donut" style="background:conic-gradient(var(--neon-cyan) ${pctLevel}%, #e6eaf0 0)"><div class="num"><b>${pctLevel}%</b><span>má úroveň</span></div></div>
           <div style="flex:1;min-width:240px">
             ${Object.entries(sec).map(([k,v])=>bar(k,v,maxSec, k==='Neuvedeno'?'grey':(k.includes('Kritická')||k.includes('Vysoká'))?'':(k.includes('Nízká')?'pink':''))).join('')}
           </div>
         </div>
       </div>
       <div class="card">
         <h2>Nejkritičtější systémy <span class="small muted">dle počtu navázaných agend</span></h2>
         <div class="desc">Kandidáti pro dopadovou analýzu — pozn.: zahrnuje i obecné systémy (GINIS apod.)</div>
         ${table(m.top_critical, [
            {h:'Systém', render:r=>link(r.id, r.nazev)},
            {h:'Správce', render:r=>esc(r.spravce||'—')},
            {h:'Agend', cls:'right', render:r=>fmt(r.agend)},
            {h:'Bezp.', render:r=>badgeSec(r.bezuroven)},
            {h:'', render:r=>`<a class="link" href="#/dopady/${encodeURIComponent(r.id)}">⚠ dopad</a>`},
         ])}
       </div>
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
  ensureOvmTypes().then(ovm=>{
    if (!byId('instbreak')) return;   // uživatel mezitím odešel jinam
    const byType = {}; for (const o of ovm){ byType[o._typ] = (byType[o._typ]||0)+1; }
    const types = OVM_TYPES.filter(t=>byType[t]);
    const maxC = Math.max(...types.map(t=>byType[t]));
    byId('insttot').textContent = fmt(ovm.length)+' orgánů';
    byId('insttypsel').innerHTML = '<option value="">Typ instituce: vše</option>' +
      types.map(t=>`<option value="${esc(t)}">${esc(t)} (${fmt(byType[t])})</option>`).join('');
    byId('instbreak').innerHTML = types.map(t=>
      `<div class="bar tight"><div class="lbl"><a class="link" href="#/databaze/ovm~${encodeURIComponent(t)}" title="otevřít v databázi">${esc(t)}</a></div><div class="track"><div class="fill" style="width:${Math.round(byType[t]/maxC*100)}%"></div></div><div class="val">${fmt(byType[t])}</div></div>`).join('');
    function drawTop(typ){
      let list = typ ? ovm.filter(o=>o._typ===typ) : ovm;
      list = list.slice().sort((a,b)=>((b.c&&b.c.agend)||0)-((a.c&&a.c.agend)||0)).slice(0,12);
      byId('insttop').innerHTML = table(list, [
        {h:'Úřad', render:o=>link(o.id, o.nazev)},
        {h:'Typ', render:o=>`<span class="chip">${esc(o._typ)}</span>`},
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
  await ensureImportance('agendy'); await ensureCategories('agendy');
  const agKat = AGENDA_CAT_NAMES.filter(c=>rows.some(r=>r._kat===c));
  listPage({ rows, exportName:'agendy',
    searchText:r=>r.nazev+' '+r.kod+' '+(r._zakon||''),
    filters:[
      {label:'Kategorie', values:agKat, test:(r,v)=>r._kat===v},
      dulFilter,
    ],
    cols:[
      {h:'Kód', cls:'mono', render:r=>esc(r.kod)},
      {h:'Název', render:r=>link(r.id, r.nazev)},
      {h:'Kategorie', render:r=>`<span class="chip">${esc(r._kat||'—')}</span>`},
      {h:'Důležitost', render:r=>badgeDul(r._dulezitost)},
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
    <div class="ehdr">
      <div><span class="codez">${esc(a.id)}</span><h1>${esc(a.nazev)}</h1>
        <div class="meta">
          <div>Ohlašovatel<b>${link(a.ohlasovatel)}</b></div>
          <div>Platnost od<b>${esc(a.platnost_od||'—')}</b></div>
          <div>Stanovisko služby<b>${esc(a.stanovisko_sluzby||'—')}</b></div>
          <div>Stanovisko údaje<b>${esc(a.stanovisko_udaje||'—')}</b></div>
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
          ${table(a.cinnosti.slice(0,200), [
            {h:'Kód',cls:'mono',render:c=>esc(c.kod)},
            {h:'Název',render:c=>esc(c.nazev)},
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
          <div class="desc">Oprávnění mezi agendami (princip only-once)</div>
          <div class="kv"><span>Bere z jiných agend</span><b>${fmt(bere.length)}</b></div>
          ${bere.slice(0,8).map(o=>`<div class="kv"><span>← bere z</span><b>${link(o['z'])}</b></div>`).join('')}
          <div class="kv" style="margin-top:6px"><span>Dává jiným agendám</span><b>${fmt(dava.length)}</b></div>
          ${dava.slice(0,8).map(o=>`<div class="kv"><span>→ dává</span><b>${link(o['do'])}</b></div>`).join('')}
        </div>
        <div class="card"><h2>Vykonávající orgány <span class="badge grey">${fmt(a.c.ovm)}</span></h2>
          <div class="desc">${a.c.ovm>a.ovm_sample.length?`zobrazeno ${a.ovm_sample.length} z ${fmt(a.c.ovm)}`:''}</div>
          ${a.ovm_sample.map(id=>`<div class="kv"><span>${esc(id.split('/')[1])}</span><b>${link(id)}</b></div>`).join('') || '<div class="empty">—</div>'}
        </div>
        <div class="card"><h2>Akce</h2>
          <div class="kv"><span>Zobrazit v grafu</span><a class="link" href="#/graf/${encodeURIComponent(a.id)}">🕸️ graf</a></div>
          <div class="kv"><span>Dopadová analýza</span><a class="link" href="#/dopady">⚠ dopady</a></div>
        </div>
      </div>
    </div>`;
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Informační systémy (ISVS)</h1><div class="sub">${fmt(rows.length)} systémů · řazeno dle kritičnosti</div></div></div>`;
  listPage({ rows, exportName:'isvs',
    searchText:r=>r.nazev+' '+(r.spravce_nazev||''),
    filters:[
      {label:'Typ správce', values:isTyp, test:(r,v)=>r._spravce_typ===v},
      dulFilter,
      {label:'Bezpečnost', values:sec, test:(r,v)=>r.bezuroven===v},
      {label:'Umístění', values:umist, test:(r,v)=>r.umisteni===v},
      {label:'Etapa', values:et, test:(r,v)=>r.etapa===v},
    ],
    cols:[
      {h:'Název', render:r=>link(r.id, r.nazev)},
      {h:'Typ správce', render:r=>`<span class="chip">${esc(r._spravce_typ||'—')}</span>`},
      {h:'Důležitost', render:r=>badgeDul(r._dulezitost)},
      {h:'Správce', render:r=>esc(r.spravce_nazev||'—')},
      {h:'Bezpečnost', render:r=>badgeSec(r.bezuroven)},
      {h:'Umístění', render:r=>esc(r.umisteni||'—')},
      {h:'Etapa', render:r=>esc(r.etapa||'—')},
      {h:'Agend', cls:'right', render:r=>fmt(r.c.agend)},
    ]});
}
async function isvsDetail(i){
  if (!i){ view.innerHTML='<div class="empty">Systém nenalezen.</div>'; return; }
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/isvs">Systémy</a> › ${esc(i.ident||i.id)}</div>
    <div class="ehdr"><div><span class="codez">${esc(i.id)}</span><h1>${esc(i.nazev)}</h1>
      <div class="meta">
        <div>Správce<b>${link(i.spravce)}</b></div>
        <div>Bezpečnostní úroveň<b>${esc(i.bezuroven||'neuvedeno')}</b></div>
        <div>Umístění<b>${esc(i.umisteni||'—')}</b></div>
        <div>Etapa<b>${esc(i.etapa||'—')}</b></div>
        <div>Úroveň sdílení<b>${esc(i.sdileni||'—')}</b></div>
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
        <div class="kv"><span>Bezpečnost</span><b>${badgeSec(i.bezuroven)}</b></div>
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Orgány veřejné moci</h1><div class="sub">${fmt(rows.length)} orgánů · řazeno dle počtu agend</div></div></div>`;
  listPage({ rows, exportName:'ovm',
    searchText:r=>r.nazev+' '+(r.ico||''),
    filters:[
      {label:'Typ instituce', values:typyPresent, test:(r,v)=>r._typ===v},
      dulFilter,
      {label:'Datová schránka', values:['ano','ne'], test:(r,v)=>r.ds===(v==='ano')},
    ],
    cols:[
      {h:'IČO',cls:'mono',render:r=>esc(r.ico||'—')},
      {h:'Název',render:r=>link(r.id, r.nazev)},
      {h:'Typ',render:r=>`<span class="chip">${esc(r._typ||'—')}</span>`},
      {h:'Důležitost',render:r=>badgeDul(r._dulezitost)},
      {h:'Právní forma',render:r=>esc(r.forma||'—')},
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
        <div>Datová schránka<b>${o.ds?'ano':'ne'}</b></div></div>
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
  listPage({ rows, exportName:'sluzby',
    searchText:r=>r.nazev,
    filters:[
      {label:'Kategorie', values:slKat, test:(r,v)=>r._kat===v},
      {label:'Typ', values:typy, test:(r,v)=>(r.typ||'').trim()===v},
      dulFilter,
    ],
    cols:[
      {h:'Služba',render:r=>link(r.id, r.nazev)},
      {h:'Kategorie',render:r=>`<span class="chip">${esc(r._kat||'—')}</span>`},
      {h:'Agenda',render:r=>link(r.agenda)},
      {h:'Důležitost',render:r=>badgeDul(r._dulezitost)},
      {h:'Typ',render:r=>esc((r.typ||'').trim()||'—')},
      {h:'Klienti',render:r=>(r.klienti||[]).map(k=>`<span class="chip">${esc(k)}</span>`).join('')},
      {h:'Úkonů',cls:'right',render:r=>fmt(r.ukony)},
    ]});
}
async function sluzbaDetail(s){
  if (!s){ view.innerHTML='<div class="empty">Služba nenalezena.</div>'; return; }
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/sluzby">Služby</a> › ${esc(s.ident||'')}</div>
    <div class="ehdr"><div><span class="codez">${esc(s.id)}</span><h1>${esc(s.nazev)}</h1>
      <div class="meta"><div>Agenda<b>${link(s.agenda)}</b></div>
        <div>Typ<b>${esc((s.typ||'').trim()||'—')}</b></div>
        <div>Poskytovatel<b>${link(s.poskytovatel)}</b></div>
        <div>Úkonů<b>${fmt(s.ukony)}</b></div></div></div></div>
    <div class="card"><h2>Popis</h2><p class="small muted" style="line-height:1.6">${esc(s.popis||'—')}</p>
      <div style="margin-top:10px">${(s.klienti||[]).map(k=>`<span class="chip">Klient: ${esc(k)}</span>`).join('')}</div></div>`;
}

/* ---------- ÚDAJE ---------- */
async function udaje(arg){
  await ensureNames(); const rows = await load('udaje');
  if (arg) return udajDetail(rows.find(u=>u.id===arg));
  await ensureImportance('udaje'); await ensureCategories('udaje');
  const udKat = AGENDA_CAT_NAMES.concat(['(bez agendy)']).filter(c=>rows.some(r=>r._kat===c));
  view.innerHTML = `<div class="pagehdr"><div><h1>Katalog údajů</h1><div class="sub">${fmt(rows.length)} objektů údajů</div></div></div>`;
  listPage({ rows, exportName:'udaje',
    searchText:r=>r.nazev+' '+r.kod,
    filters:[
      {label:'Kategorie', values:udKat, test:(r,v)=>r._kat===v},
      dulFilter,
    ],
    cols:[
      {h:'Kód',cls:'mono',render:r=>esc(r.kod)},
      {h:'Objekt / subjekt',render:r=>link(r.id, r.nazev)},
      {h:'Kategorie',render:r=>`<span class="chip">${esc(r._kat||'—')}</span>`},
      {h:'Důležitost',render:r=>badgeDul(r._dulezitost)},
      {h:'Agenda',render:r=>link(r.agenda)},
      {h:'Údajů',cls:'right',render:r=>fmt((r.udaje||[]).length)},
    ]});
}
async function udajDetail(u){
  if (!u){ view.innerHTML='<div class="empty">Údaj nenalezen.</div>'; return; }
  view.innerHTML = `
    <div class="crumb"><a href="#/dashboard">Dashboard</a> › <a href="#/udaje">Údaje</a> › ${esc(u.kod)}</div>
    <div class="ehdr"><div><span class="codez">${esc(u.id)}</span><h1>${esc(u.nazev)}</h1>
      <div class="meta"><div>Agenda<b>${link(u.agenda)}</b></div><div>Počet údajů<b>${fmt((u.udaje||[]).length)}</b></div></div></div></div>
    <div class="card"><h2>Jednotlivé údaje</h2>
      ${table((u.udaje||[]),[
        {h:'Kód',cls:'mono',render:d=>esc(d.kod)},
        {h:'Název',render:d=>esc(d.nazev)},
        {h:'Typ',render:d=>esc(d.typ||'—')},
        {h:'Veřejný',render:d=>d.verejny?'<span class="badge ok">veřejný</span>':'<span class="badge grey">neveřejný</span>'},
        {h:'Sdílen na PPDF',render:d=>esc(d.ppdf||'—')},
      ])}
    </div>`;
}

/* ---------- OPRÁVNĚNÍ / TOKY ---------- */
async function opravneni(arg){
  await ensureNames(); const rows = await load('opravneni');
  await ensureImportance('opravneni'); await ensureCategories('opravneni');
  const opKat = AGENDA_CAT_NAMES.concat(['(bez agendy)']).filter(c=>rows.some(r=>r._kat===c));
  view.innerHTML = `<div class="pagehdr"><div><h1>Oprávnění / Toky údajů</h1><div class="sub">${fmt(rows.length)} oprávnění mezi agendami (princip only-once)</div></div></div>`;
  listPage({ rows, exportName:'opravneni',
    searchText:r=>nameOf(r['z'])+' '+nameOf(r['do']),
    filters:[
      {label:'Kategorie (příjemce)', values:opKat, test:(r,v)=>r._kat===v},
      dulFilter,
      {label:'Referenční rozhraní', values:['ano','ne'], test:(r,v)=>r.ref===(v==='ano')},
    ],
    cols:[
      {h:'Zdroj (dává) – z agendy',render:r=>link(r['z'])},
      {h:'→',render:()=>'<span class="muted">dává →</span>'},
      {h:'Příjemce (bere) – do agendy',render:r=>link(r['do'])},
      {h:'Kategorie',render:r=>`<span class="chip">${esc(r._kat||'—')}</span>`},
      {h:'Důležitost',render:r=>badgeDul(r._dulezitost)},
      {h:'Údajů',cls:'right',render:r=>fmt(r.pocet_udaju)},
      {h:'Přístup',render:r=>(r.rw||[]).map(x=>`<span class="badge ${x==='W'?'pink':'cyan'}">${esc(x)}</span>`).join(' ')||'—'},
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
     <div style="display:flex;gap:8px"><input id="gsearch" class="btn" style="min-width:260px" placeholder="Hledat agendu…">
       <button class="btn" id="greset">↺ Reset</button></div></div>
     <div id="gselbar" class="card" style="padding:10px 14px;margin-bottom:12px;display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap"><span class="muted small" id="ghint"></span><span id="gseldetail"></span></div>
     <div id="cy"></div>
     <div class="legend"><span><i style="background:#0a1f44"></i>agenda</span><span><i style="background:#00d8ff"></i>ISVS</span><span><i style="background:#7c5cff"></i>orgán</span><span><i style="background:#ff2d8d"></i>služba</span><span class="small">· velikost dle propojení · šipka = směr toku</span></div>`;
  byId('cy').style.background='radial-gradient(circle at 50% 42%, #112c57, #060f24)';
  byId('cy').style.borderColor='#0c1f44';
  const cy=cytoscape({ container:byId('cy'), elements:[], wheelSensitivity:0.2,
    style:[
      {selector:'node',style:{'background-color':e=>GCOL[e.data('t')]||'#64748b','label':'data(label)','font-size':'10px','font-weight':600,'color':'#eaf2ff','text-outline-width':2.5,'text-outline-color':'#06122b','text-valign':'bottom','text-margin-y':4,'text-wrap':'wrap','text-max-width':'88px','width':26,'height':26,'border-width':2,'border-color':'rgba(255,255,255,.25)'}},
      {selector:'node[t="agenda"]',style:{'background-color':'#ffffff','border-color':'#00d8ff','border-width':3,'color':'#bfe9ff','width':34,'height':34}},
      {selector:'node.hub',style:{'width':56,'height':56,'border-width':4,'border-color':'#00d8ff','background-color':'#ffffff'}},
      {selector:'node.sel',style:{'border-color':'#86ff00','border-width':4}},
      {selector:'edge',style:{'width':1.6,'curve-style':'bezier','target-arrow-shape':'triangle','arrow-scale':0.8,'opacity':0.75,
        'line-color':e=>GCOL[e.data('t')]||'#64748b','target-arrow-color':e=>GCOL[e.data('t')]||'#64748b'}},
      {selector:'edge[t="flow"]',style:{'line-color':'#86ff00','target-arrow-color':'#86ff00','line-style':'dashed'}},
    ],
    layout:{name:'preset'} });
  window.__cy=cy;
  const have=new Set(), expanded=new Set();
  function node(id,t){ if(have.has(id))return; have.add(id); cy.add({data:{id,label:(nameOf(id)||id).slice(0,46),t:t||typeOf(id)}}); }
  function edge(s,t,kind){ const id=s+'~'+t; if(cy.getElementById(id).nonempty())return; if(!have.has(s)||!have.has(t))return; cy.add({data:{id,source:s,target:t,t:kind}}); }
  async function expand(id){
    if(expanded.has(id))return; expanded.add(id);
    if(id.startsWith('agenda/')){ const a=agMap[id]; if(!a)return;
      a.isvs.slice(0,6).forEach(x=>{node(x,'isvs');edge(id,x,'isvs');});
      sluzby.filter(s=>s.agenda===id).slice(0,6).forEach(s=>{node(s.id,'sluzba');edge(id,s.id,'sluzba');});
      (a.ovm_sample||[]).slice(0,6).forEach(x=>{node(x,'ovm');edge(id,x,'ovm');});
      opr.filter(o=>o.z===id).slice(0,6).forEach(o=>{node(o.do,'agenda');edge(id,o.do,'flow');});
      opr.filter(o=>o.do===id).slice(0,6).forEach(o=>{node(o.z,'agenda');edge(o.z,id,'flow');});
    } else if(id.startsWith('isvs/')){ const i=isvsMap[id]; if(!i)return;
      (i.agendy||[]).slice(0,8).forEach(x=>{node(x,'agenda');edge(x,id,'isvs');});
    } else if(id.startsWith('orgán')){ if(!ovmMap){ovmMap=Object.fromEntries((await load('ovm')).map(o=>[o.id,o]));}
      const o=ovmMap[id]; if(!o)return; (o.agendy_sample||[]).slice(0,8).forEach(x=>{node(x,'agenda');edge(x,id,'ovm');});
    } else if(id.startsWith('služba/')){ const s=sluzby.find(s=>s.id===id);
      if(s&&s.agenda){node(s.agenda,'agenda');edge(s.agenda,s.id,'sluzba');} }
  }
  function relayout(){ cy.layout({name:'cose',animate:true,animationDuration:450,idealEdgeLength:105,nodeRepulsion:12000,edgeElasticity:110,gravity:0.25,padding:40,randomize:false}).run(); }
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
  let t; byId('gsearch').addEventListener('input', e=>{ clearTimeout(t); t=setTimeout(()=>{ const q=e.target.value.toLowerCase(); if(q.length<3)return; const hit=agendyRows.find(a=>a.nazev.toLowerCase().includes(q)); if(hit) reset(hit.id); },300); });
  await reset(start);
}

/* ---------- DOPADY & KASKÁDY ---------- */
const ORDC=['#7a0f3d','#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22d3ee','#7c5cff'];
async function dopady(arg){
  await ensureNames(); const isvsRows = await load('isvs'); const agendyRows = await load('agendy');
  const opr = await load('opravneni');
  const agById = Object.fromEntries(agendyRows.map(a=>[a.id,a]));
  // zdroj (z) → [příjemci (do), kteří od něj berou]; výpadek zdroje zasáhne jeho příjemce
  const dependents = {}; opr.forEach(o=>{ if(o['do']&&o['z']){ (dependents[o['z']]=dependents[o['z']]||[]).push(o['do']); }});
  // default: a foundational system — supports few agendas, but ones that many others read from (base register)
  let defId;
  if (!arg){
    const topAg = agendyRows.reduce((b,a)=>a.c.opr_out>b.c.opr_out?a:b, agendyRows[0]);
    const cand = isvsRows.filter(i=>(i.agendy||[]).includes(topAg.id) && i.c.agend>=1 && i.c.agend<=15).sort((a,b)=>a.c.agend-b.c.agend);
    defId = (cand[0] || isvsRows.filter(i=>i.c.agend>=1 && i.c.agend<=6)[0] || isvsRows[0]).id;
  }
  const start = arg || defId;
  const sys = isvsRows.find(i=>i.id===start) || isvsRows[0];
  const options = isvsRows.slice(0,400).map(i=>`<option value="${esc(i.id)}" ${i.id===start?'selected':''}>${esc(i.nazev)} · ${i.c.agend} agend</option>`).join('');
  let depth = Math.min(Math.max(window.__dDepth||3,1),7);
  view.innerHTML = `
    <div class="pagehdr"><div><h1>Dopady &amp; kaskády <span class="badge bad">domeček z karet</span></h1>
      <div class="sub">Simulace výpadku systému a propagace přes oprávnění (zasažená agenda přestane dávat data agendám, které od ní berou). Vyber, kolik řádů kaskády zobrazit.</div></div></div>
    <div class="card"><div class="toolbar">
      <span class="muted small">Co vypadne (systém):</span>
      <select id="dsel" class="grow">${options}</select>
      <span class="muted small" style="margin-left:8px">Hloubka kaskády:</span>
      <span id="ddepth" style="display:inline-flex;gap:4px"></span>
    </div></div>
    <div id="dbody"></div>`;
  byId('dsel').addEventListener('change', e=>{ location.hash = '#/dopady/'+encodeURIComponent(e.target.value); });
  function renderDepthCtl(){
    byId('ddepth').innerHTML = [1,2,3,4,5,'Max'].map(d=>{
      const val = d==='Max'?7:d; const on = (d==='Max'? depth>=7 : depth===d);
      return `<button class="btn" data-d="${val}" style="padding:6px 12px;${on?'background:var(--navy);color:#fff;border-color:var(--navy)':''}">${d}</button>`;
    }).join('');
    byId('ddepth').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ depth=+b.dataset.d; window.__dDepth=depth; draw(); }));
  }
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
    const maxO=impacted.reduce((m,a)=>Math.max(m,order[a]),1);
    const byOrder={}; for(let k=1;k<=maxO;k++) byOrder[k]=[]; impacted.forEach(a=>byOrder[order[a]].push(a));
    const svcCount=impacted.reduce((s,a)=>s+((agById[a]&&agById[a].c.sluzby)||0),0);
    const ovmSet=new Set(); impacted.forEach(a=>{const o=agById[a]; if(o)(o.ovm_sample||[]).forEach(x=>ovmSet.add(x));});
    const legend = [`<span><i style="background:${ORDC[0]}"></i>epicentrum</span>`].concat(
      Array.from({length:maxO},(_,k)=>`<span><i style="background:${ORDC[(k+1)%ORDC.length]}"></i>${k+1}. řád</span>`)).join('');
    byId('dbody').innerHTML = `
      <div class="ban">
        <div><div class="big">${fmt(impacted.length)}</div><div class="lab">zasažených agend</div></div>
        <div class="sep"></div><div><div class="big">${fmt(svcCount)}</div><div class="lab">zasažených služeb</div></div>
        <div class="sep"></div><div><div class="big">${fmt(ovmSet.size)}+</div><div class="lab">dotčených orgánů</div></div>
        <div class="sep"></div><div><div class="big">${maxO}${maxO<depth?'':(depth>=7?'+':'')}</div><div class="lab">řádů kaskády</div></div>
      </div>
      <div id="cyd"></div>
      <div class="legend">${legend}<span class="small">· klik na uzel = detail</span></div>
      <div class="gap" style="margin-top:18px">⚠ <b>Mezera ve standardu:</b> RPP nezachycuje cloudové závislosti systémů — reálný dosah může být <b>větší</b>. Bezpečnostní úroveň epicentra: <b>${esc(sys.bezuroven||'neuvedeno')}</b>.</div>
      <div class="card"><h2>Tabulka dopadů <span class="small muted">(${fmt(impacted.length)} agend, ${maxO} řádů)</span></h2>
        ${table(impacted.sort((a,b)=>order[a]-order[b]).slice(0,300).map(a=>({a})),[
          {h:'Řád',render:r=>`<span class="badge grey" style="background:${ORDC[order[r.a]%ORDC.length]}22;color:${ORDC[order[r.a]%ORDC.length]}">${order[r.a]}. řád</span>`},
          {h:'Agenda',render:r=>link(r.a)},
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
        added.add(a); els.push({data:{id:a,label:(nameOf(a)||a).slice(0,40),o:k}});
        if(added.has(parent[a])) els.push({data:{id:parent[a]+'>'+a, source:parent[a], target:a}});
      });
    }
    byId('cyd').style.background='radial-gradient(circle at 50% 42%, #112c57, #060f24)';
    byId('cyd').style.borderColor='#0c1f44';
    cytoscape({ container:byId('cyd'), elements:els, wheelSensitivity:0.2,
      style:[
        {selector:'node',style:{'background-color':e=>ORDC[e.data('o')%ORDC.length],'label':'data(label)','font-size':'10px','font-weight':600,'color':'#eaf2ff','text-outline-width':2.5,'text-outline-color':'#06122b','text-wrap':'wrap','text-max-width':'82px','width':e=>e.data('o')===0?54:24,'height':e=>e.data('o')===0?54:24,'text-valign':'bottom','text-margin-y':4,'border-width':2,'border-color':'rgba(255,255,255,.25)'}},
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Analytika</h1><div class="sub">Předpřipravené sestavy nad RPP daty — podklad pro policy papery</div></div></div>
   <div class="grid2">
     <div class="card"><h2>Bezpečnostní úroveň ISVS</h2><div class="desc">Mezera v datech (only ${Math.round((m.counts.isvs-(m.isvs_bezuroven['Neuvedeno']||0))/m.counts.isvs*100)}% uvedeno)</div>${mk(m.isvs_bezuroven)}</div>
     <div class="card"><h2>Umístění (cloud vs. on-prem)</h2>${mk(m.isvs_umisteni,'lime')}</div>
     <div class="card"><h2>Fáze životního cyklu</h2>${mk(m.isvs_etapa)}</div>
     <div class="card"><h2>Služby podle typu</h2>${mk(m.sluzby_typ,'pink')}</div>
   </div>
   <div class="card"><h2>Nejkritičtější systémy (blast radius)</h2>
     ${table(m.top_critical,[
       {h:'Systém',render:r=>link(r.id,r.nazev)},{h:'Správce',render:r=>esc(r.spravce||'—')},
       {h:'Agend',cls:'right',render:r=>fmt(r.agend)},{h:'Bezpečnost',render:r=>badgeSec(r.bezuroven)},
       {h:'',render:r=>`<a class="link" href="#/dopady/${encodeURIComponent(r.id)}">⚠ dopad</a>`}])}
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
const IMPORTANCE = {
  agendy:    r => (r.c ? (r.c.isvs||0)+(r.c.sluzby||0)+(r.c.ovm||0) : 0),
  isvs:      r => (r.c ? (r.c.agend||0) : 0),
  ovm:       r => (r.c ? (r.c.agend||0) : 0),
  sluzby:    r => (r.ukony||0),
  udaje:     r => ((r.udaje||[]).length),
  opravneni: r => (r.pocet_udaju||0),
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
  const tabN = {agendy:meta.counts.agendy, isvs:meta.counts.isvs, ovm:meta.counts.ovm, sluzby:meta.counts.sluzby, udaje:meta.counts.udaje_objekty, opravneni:meta.counts.opravneni};
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
    const head = '<tr>'+spec.fields.map(f=>`<th>${esc(f.h)}</th>`).join('')+'</tr>';
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

/* ---------- ROUTER ---------- */
const ROUTES = {dashboard,agendy,ovm,isvs,sluzby,udaje,opravneni,graf,dopady,analytika,srovnani,hledat,about,databaze,dotazy};
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

if (!window.__locked) render();
