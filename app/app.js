/* RPP Explorer — SPA. Vanilla JS, hash router, lazy JSON, Cytoscape graph. */
'use strict';
const view = document.getElementById('view');
const DATA = {};
const NAMES = {};

/* ---------- utils ---------- */
const esc = s => (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => (n == null ? '' : Number(n).toLocaleString('cs-CZ'));
const byId = i => document.getElementById(i);
async function load(name){
  if (DATA[name]) return DATA[name];
  const r = await fetch('data/' + name + '.json');
  if (!r.ok) throw new Error('Nelze načíst ' + name);
  DATA[name] = await r.json();
  return DATA[name];
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
   </div>`;
}

/* ---------- AGENDY ---------- */
async function agendy(arg){
  await ensureNames(); const rows = await load('agendy');
  if (arg) return agendaDetail(rows.find(a=>a.id===arg), rows);
  view.innerHTML = `<div class="pagehdr"><div><h1>Agendy</h1><div class="sub">${fmt(rows.length)} agend veřejné správy</div></div></div>`;
  listPage({ rows, exportName:'agendy',
    searchText:r=>r.nazev+' '+r.kod,
    cols:[
      {h:'Kód', cls:'mono', render:r=>esc(r.kod)},
      {h:'Název', render:r=>link(r.id, r.nazev)},
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
  const oin = opr.filter(o=>o['do']===a.id), oout = opr.filter(o=>o['z']===a.id);
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
          <div class="kv"><span>Čte z jiných agend</span><b>${fmt(oout.length)}</b></div>
          ${oout.slice(0,8).map(o=>`<div class="kv"><span>← čte</span><b>${link(o['do'])}</b></div>`).join('')}
          <div class="kv" style="margin-top:6px"><span>Jiné agendy čtou odsud</span><b>${fmt(oin.length)}</b></div>
          ${oin.slice(0,8).map(o=>`<div class="kv"><span>→ dává</span><b>${link(o['z'])}</b></div>`).join('')}
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Informační systémy (ISVS)</h1><div class="sub">${fmt(rows.length)} systémů · řazeno dle kritičnosti</div></div></div>`;
  listPage({ rows, exportName:'isvs',
    searchText:r=>r.nazev+' '+(r.spravce_nazev||''),
    filters:[
      {label:'Bezpečnost', values:sec, test:(r,v)=>r.bezuroven===v},
      {label:'Umístění', values:umist, test:(r,v)=>r.umisteni===v},
      {label:'Etapa', values:et, test:(r,v)=>r.etapa===v},
    ],
    cols:[
      {h:'Název', render:r=>link(r.id, r.nazev)},
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Orgány veřejné moci</h1><div class="sub">${fmt(rows.length)} orgánů · řazeno dle počtu agend</div></div></div>`;
  listPage({ rows, exportName:'ovm',
    searchText:r=>r.nazev+' '+(r.ico||''),
    filters:[{label:'Datová schránka', values:['ano','ne'], test:(r,v)=>r.ds===(v==='ano')}],
    cols:[
      {h:'IČO',cls:'mono',render:r=>esc(r.ico||'—')},
      {h:'Název',render:r=>link(r.id, r.nazev)},
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Služby</h1><div class="sub">${fmt(rows.length)} služeb veřejné správy</div></div></div>`;
  listPage({ rows, exportName:'sluzby',
    searchText:r=>r.nazev,
    filters:[{label:'Typ', values:typy, test:(r,v)=>(r.typ||'').trim()===v}],
    cols:[
      {h:'Služba',render:r=>link(r.id, r.nazev)},
      {h:'Agenda',render:r=>link(r.agenda)},
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Katalog údajů</h1><div class="sub">${fmt(rows.length)} objektů údajů</div></div></div>`;
  listPage({ rows, exportName:'udaje',
    searchText:r=>r.nazev+' '+r.kod,
    cols:[
      {h:'Kód',cls:'mono',render:r=>esc(r.kod)},
      {h:'Objekt / subjekt',render:r=>link(r.id, r.nazev)},
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
  view.innerHTML = `<div class="pagehdr"><div><h1>Oprávnění / Toky údajů</h1><div class="sub">${fmt(rows.length)} oprávnění mezi agendami (princip only-once)</div></div></div>`;
  listPage({ rows, exportName:'opravneni',
    searchText:r=>nameOf(r['z'])+' '+nameOf(r['do']),
    filters:[{label:'Referenční rozhraní', values:['ano','ne'], test:(r,v)=>r.ref===(v==='ano')}],
    cols:[
      {h:'Čtenář (z agendy)',render:r=>link(r['z'])},
      {h:'→',render:()=>'<span class="muted">čte od →</span>'},
      {h:'Zdroj (do agendy)',render:r=>link(r['do'])},
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
  const readers = {}; opr.forEach(o=>{ if(o['do']&&o['z']){ (readers[o['do']]=readers[o['do']]||[]).push(o['z']); }}); // zdroj -> [čtenáři]
  // default: a foundational system — supports few agendas, but ones that many others read from (base register)
  let defId;
  if (!arg){
    const topAg = agendyRows.reduce((b,a)=>a.c.opr_in>b.c.opr_in?a:b, agendyRows[0]);
    const cand = isvsRows.filter(i=>(i.agendy||[]).includes(topAg.id) && i.c.agend>=1 && i.c.agend<=15).sort((a,b)=>a.c.agend-b.c.agend);
    defId = (cand[0] || isvsRows.filter(i=>i.c.agend>=1 && i.c.agend<=6)[0] || isvsRows[0]).id;
  }
  const start = arg || defId;
  const sys = isvsRows.find(i=>i.id===start) || isvsRows[0];
  const options = isvsRows.slice(0,400).map(i=>`<option value="${esc(i.id)}" ${i.id===start?'selected':''}>${esc(i.nazev)} · ${i.c.agend} agend</option>`).join('');
  let depth = Math.min(Math.max(window.__dDepth||3,1),7);
  view.innerHTML = `
    <div class="pagehdr"><div><h1>Dopady &amp; kaskády <span class="badge bad">domeček z karet</span></h1>
      <div class="sub">Simulace výpadku systému a propagace přes oprávnění (agenda čte data z dotčené agendy). Vyber, kolik řádů kaskády zobrazit.</div></div></div>
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
      frontier.forEach(ag=>{ (readers[ag]||[]).forEach(z=>{ if(order[z]==null){ order[z]=d; parent[z]=ag; next.push(z);} }); });
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
async function srovnani(){
  await ensureNames(); const rows = await load('agendy');
  const opts = rows.map(a=>`<option value="${esc(a.id)}">${esc(a.nazev)}</option>`).join('');
  view.innerHTML = `<div class="pagehdr"><div><h1>Srovnání agend</h1><div class="sub">Vyber dvě agendy a porovnej metriky</div></div></div>
    <div class="card"><div class="toolbar">
      <select id="cmpA" class="grow">${opts}</select><span class="muted">vs.</span><select id="cmpB" class="grow">${opts}</select>
    </div><div id="cmpout"></div></div>`;
  byId('cmpB').selectedIndex = 1;
  function draw(){
    const a=rows.find(x=>x.id===byId('cmpA').value), b=rows.find(x=>x.id===byId('cmpB').value);
    if(!a||!b) return;
    const metric=(lbl,ka,kb)=>{ const mx=Math.max(ka,kb,1); return `<div style="margin:10px 0"><div class="small muted">${lbl}</div>
      ${bar(a.nazev.slice(0,22),ka,mx)}${bar(b.nazev.slice(0,22),kb,mx,'pink')}</div>`; };
    byId('cmpout').innerHTML = `<div style="margin-top:14px">
      ${metric('Činnosti',a.c.cinnosti,b.c.cinnosti)}
      ${metric('Informační systémy',a.c.isvs,b.c.isvs)}
      ${metric('Služby',a.c.sluzby,b.c.sluzby)}
      ${metric('Vykonávající orgány',a.c.ovm,b.c.ovm)}
      ${metric('Oprávnění (čte/dává)',a.c.opr_out+a.c.opr_in,b.c.opr_out+b.c.opr_in)}
    </div>`;
  }
  byId('cmpA').addEventListener('change',draw); byId('cmpB').addEventListener('change',draw); draw();
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
  const members = [
    ['Tomáš Vejlupek','Iniciátor konceptu kGovernment, facilitace','competitive intelligence (TOVEK)'],
    ['Jakub Bareš','Výkonný předseda iniciativy, strategie','agentní AI (Metamatics / Complexity)'],
    ['Petr Kučera','Cloudové služby a krizové systémy · zdroj dat RPP','enterprise architecture (Power Patterns)'],
    ['Vladimír Rohel','Kyberbezpečnost, procesy veřejné správy','Rada AFCEA ČR (NAKIT)'],
    ['Jaroslav Pejčoch','Krizové řízení a legislativa · místopředseda PS07','krizové systémy (T-SOFT)'],
    ['Vladislav Severa','AI agenti, agentní architektury, KPI státu','autonomní AI agenti (knowdroids.ai)'],
    ['Martin Vlasta','Legal tech, právní aspekty AI','Advokátní asociace pro AI'],
    ['Pavel Maděra','Kyberbezpečnost, krizové řízení',''],
    ['Dominik Regner','Datová analytika pro vyšetřovací složky','(Cogniware)'],
    ['Filip Kasabov','Bezpečnostní operace (SOC / CSIRT)',''],
    ['Miroslav Nečas','Organizační podpora, bezpečnostní scénáře',''],
    ['Tomáš Pokorný','IT a bezpečnost, data-driven rozhodování',''],
  ];
  view.innerHTML = `<div class="pagehdr"><div><h1>O projektu</h1><div class="sub">Průzkumník a znalostní vrstva nad českým Registrem práv a povinností</div></div></div>
   <div class="card"><h2>Z čeho vychází</h2>
     <p class="muted small" style="line-height:1.6">Aplikace pracuje s veřejnými open daty RPP, která spravuje Digitální a informační agentura (DIA). Stažena je kompletní datová sada (56 souborů) a přerestrukturalizována do propojené databáze.</p>
     <div class="kpis" style="margin-top:14px">
       <div class="kpi"><div class="v">${fmt(c.agendy)}</div><div class="l">agend</div></div>
       <div class="kpi"><div class="v">${fmt(c.isvs)}</div><div class="l">systémů</div></div>
       <div class="kpi"><div class="v">${fmt(c.ovm)}</div><div class="l">orgánů</div></div>
       <div class="kpi"><div class="v">${fmt(c.sluzby)}</div><div class="l">služeb</div></div>
       <div class="kpi"><div class="v">${fmt(c.opravneni)}</div><div class="l">oprávnění</div></div>
       <div class="kpi"><div class="v">${fmt(c.pusobnost)}</div><div class="l">vazeb</div></div>
     </div>
     <p class="small muted" style="margin-top:10px">Zdroj: <a class="link" href="https://rpp-opendata.egon.gov.cz/odrpp/datovasada/" target="_blank">rpp-opendata.egon.gov.cz</a> (DIA)</p>
   </div>
   <div class="grid2">
     <div class="card" style="background:linear-gradient(135deg,#0a1f44,#0e2a5c);color:#fff">
       <h2 style="color:#fff">Metamatics Ventures</h2>
       <p style="color:#bcd0ef;line-height:1.6;font-size:13px">Venture studio zaměřené na <b style="color:#7ef0ff">agentní umělou inteligenci</b> a aplikovanou inteligenci. RPP Explorer navrhuje a vyvíjí jako příspěvek k datově řízené veřejné správě v ČR — od ETL nad veřejnými registry přes grafové modely vazeb po analytické nástroje.</p>
       <p class="small" style="margin-top:10px"><a class="link" style="color:#7ef0ff" href="https://metamatics.ventures" target="_blank">metamatics.ventures</a></p>
     </div>
     <div class="card"><h2>Pracovní skupina PS07 kGovernment (AFCEA ČR)</h2>
       <p class="muted small" style="line-height:1.6">AFCEA Česká pobočka propojuje veřejnou správu, armádu, akademii a soukromý sektor v oblasti ICT a bezpečnosti. Skupina PS07 kGovernment rozvíjí koncept „knowledge government" — datově a znalostně řízeného státu — a spolupracuje s Centrem pro informovanou společnost (CIS).</p>
       <p class="small muted" style="margin-top:8px"><a class="link" href="https://afcea.cz/o-nas-ps07/" target="_blank">afcea.cz — PS07</a></p>
     </div>
   </div>
   <div class="card"><h2>Členové pracovní skupiny</h2>
     <div class="grid3">${members.map(mb=>`<div style="border:1px solid var(--line);border-radius:12px;padding:14px"><div style="font-weight:700">${esc(mb[0])}</div><div class="small muted" style="margin-top:3px">${esc(mb[1])}</div>${mb[2]?`<div class="small" style="color:var(--neon-violet);margin-top:4px">${esc(mb[2])}</div>`:''}</div>`).join('')}</div>
     <p class="small muted" style="margin-top:10px">Členové s veřejně známou odborností. Aktuální oficiální složení viz web AFCEA.</p>
   </div>`;
}

/* ---------- ROUTER ---------- */
const ROUTES = {dashboard,agendy,ovm,isvs,sluzby,udaje,opravneni,graf,dopady,analytika,srovnani,hledat,about};
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

render();
