/* RPP Explorer — feature modul „Kritičnost & odolnost agend".
 * Klasický script načítaný PO app.js, sdílí global scope (view, esc, fmt, load,
 * ensureNames, nameOf, link, badgeSec, badgeRegistr, ROUTES, …).
 *
 * Změny 03 (formulář kritických agend), 04 (mapování na ISVS), 05 (kritéria dle
 * vyhlášky) a 18 („stát, který se nedá vypnout"). Toto je PRVNÍ zápisový/sběrový
 * tok v dosud read-only aplikaci — stav se ukládá výhradně klientsky do
 * localStorage (žádný backend, žádné odesílání dat).
 *
 * Schéma localStorage (klíč `rpp_kriticnost`):
 *   { [agendaId]: { doba, dopad, offline, kriteria:{[klic]:true}, ts } }
 *     doba    : '4h' | 'den' | 'tyden' | 'mesic' | null   (max. tolerovaná doba nedostupnosti)
 *     dopad   : 'nizky' | 'stredni' | 'vysoky' | 'kriticky' | null
 *     offline : true | false   (musí běžet vždy i v krizovém/offline režimu)
 *     kriteria: mapa zaškrtnutých kritérií dle vyhlášky (klíče z KRITERIA_VYHLASKA)
 *     ts      : ISO timestamp poslední změny záznamu
 */
(function(){
  'use strict';

  /* ================= konstanty ================= */

  // Změna 05 — hodnotící kritéria dle vyhlášky o bezpečnostních úrovních
  // informačních systémů (dopadová kritéria). Slouží věcnému správci jako
  // jednoduchý checklist; zaškrtnutá kritéria zpřesňují posouzení dopadu.
  const KRITERIA_VYHLASKA = [
    { klic:'obyvatele',  nazev:'Dopad na velký počet obyvatel (> 125 tis.)',
      popis:'Výpadek zasáhne více než ~125 tisíc osob (práh „většího města / okresu" dle vyhlášky). Klíčové kritérium pro vyšší bezpečnostní úroveň.' },
    { klic:'nepokoje',   nazev:'Riziko nepokojů / ohrožení veřejného pořádku',
      popis:'Nedostupnost může vést k veřejným nepokojům, panice nebo narušení veřejného pořádku.' },
    { klic:'zivot',      nazev:'Ohrožení života nebo zdraví',
      popis:'Výpadek může přímo či nepřímo ohrozit život nebo zdraví osob (IZS, zdravotnictví, krizové řízení).' },
    { klic:'skody',      nazev:'Významné finanční / hospodářské škody',
      popis:'Nedostupnost způsobí významné finanční ztráty státu, obcím nebo subjektům (výběr daní, dávky, platby).' },
    { klic:'verejnasprava', nazev:'Narušení chodu veřejné správy',
      popis:'Výpadek ochromí výkon agend napříč úřady — služby občanům a podnikům se zastaví.' },
    { klic:'utajovane',  nazev:'Ochrana utajovaných informací',
      popis:'Systém zpracovává utajované informace; narušení důvěrnosti/integrity má bezpečnostní dopad.' },
  ];

  const DOBY = [
    { klic:'4h',    label:'4 hodiny' },
    { klic:'den',   label:'1 den' },
    { klic:'tyden', label:'1 týden' },
    { klic:'mesic', label:'1 měsíc' },
  ];
  const DOBA_LABEL = { '4h':'4 hodiny', 'den':'1 den', 'tyden':'1 týden', 'mesic':'1 měsíc' };

  const DOPADY = [
    { klic:'nizky',    label:'nízký',    col:'#94a3b8' },
    { klic:'stredni',  label:'střední',  col:'#5b8fd6' },
    { klic:'vysoky',   label:'vysoký',   col:'#e08b2f' },
    { klic:'kriticky', label:'kritický', col:'#c0392b' },
  ];
  const DOPAD_INFO = {
    nizky:    { label:'nízký',    col:'#94a3b8', crit:false },
    stredni:  { label:'střední',  col:'#5b8fd6', crit:false },
    vysoky:   { label:'vysoký',   col:'#e08b2f', crit:true  },
    kriticky: { label:'kritický', col:'#c0392b', crit:true  },
  };
  // Kritická agenda = dopad vysoký nebo kritický (Změna 04 spouští mapování na ISVS).
  function isCritical(rec){ return !!rec && (rec.dopad==='vysoky' || rec.dopad==='kriticky'); }

  const STORAGE_KEY = 'rpp_kriticnost';

  /* ================= sdílený stav (localStorage) ================= */

  function loadStav(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch(e){ return {}; }
  }
  function saveStav(stav){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stav)); }
    catch(e){ alert('Nepodařilo se uložit do prohlížeče (localStorage). Data se neukládají.'); }
  }
  // získá/založí záznam agendy a označí čas
  function rec(stav, id){
    if (!stav[id]) stav[id] = { doba:null, dopad:null, offline:false, kriteria:{}, ts:null };
    if (!stav[id].kriteria) stav[id].kriteria = {};
    return stav[id];
  }
  function touch(stav, id){ rec(stav,id).ts = new Date().toISOString(); }
  // má záznam jakoukoli vyplněnou hodnotu? (jinak ho nepovažujeme za „označený")
  function hasData(r){
    return !!r && (r.doba || r.dopad || r.offline || (r.kriteria && Object.keys(r.kriteria).some(k=>r.kriteria[k])));
  }

  function exportStav(){
    const blob = new Blob([JSON.stringify(loadStav(), null, 2)], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rpp_kriticnost_'+new Date().toISOString().slice(0,10)+'.json';
    a.click(); URL.revokeObjectURL(url);
  }
  function importStav(){
    const txt = prompt('Vložte JSON s uloženým hodnocením (přepíše stávající data):');
    if (txt==null) return false;
    let obj;
    try { obj = JSON.parse(txt); }
    catch(e){ alert('Neplatný JSON — import zrušen.'); return false; }
    if (typeof obj!=='object' || obj==null || Array.isArray(obj)){ alert('Očekáván objekt { agendaId: {...} } — import zrušen.'); return false; }
    saveStav(obj);
    return true;
  }
  function clearStav(){
    if (!confirm('Opravdu smazat veškeré uložené hodnocení kritičnosti? Tuto akci nelze vrátit zpět.')) return false;
    try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
    return true;
  }

  /* ================= drobné UI helpery ================= */

  function ministerstvo(a){ return nameOf(a.ohlasovatel) || '—'; }

  // panel se třemi globálními tlačítky (Export / Import / Smazat vše) + rerender
  function dataToolbar(rerender){
    const host = document.createElement('span');
    host.style.cssText = 'display:inline-flex;gap:8px;flex-wrap:wrap';
    host.innerHTML =
      `<button class="btn" data-act="export" title="Stáhnout uložené hodnocení jako JSON (záloha / předání kolegovi).">⬇ Export JSON</button>`+
      `<button class="btn" data-act="import" title="Vložit dříve uložený JSON a nahradit jím data v tomto prohlížeči.">⬆ Import</button>`+
      `<button class="btn" data-act="clear" title="Smazat všechna data hodnocení uložená v tomto prohlížeči." style="border-color:#e3b3b3;color:#b23b3b">🗑 Smazat vše</button>`;
    host.querySelector('[data-act=export]').addEventListener('click', exportStav);
    host.querySelector('[data-act=import]').addEventListener('click', ()=>{ if(importStav()) rerender(); });
    host.querySelector('[data-act=clear]').addEventListener('click', ()=>{ if(clearStav()) rerender(); });
    return host;
  }

  // badge se stručným stavem agendy (do tabulky)
  function stavBadge(r){
    if (!hasData(r)) return '<span class="badge grey" title="Zatím neoznačeno.">neoznačeno</span>';
    const parts = [];
    if (r.dopad){ const d=DOPAD_INFO[r.dopad];
      parts.push(`<span class="badge" style="background:${d.col};color:#fff;border-color:${d.col}" title="Posouzený dopad výpadku.">${esc(d.label)}</span>`); }
    if (r.doba){ parts.push(`<span class="badge cyan" title="Max. tolerovaná doba nedostupnosti.">${esc(DOBA_LABEL[r.doba]||r.doba)}</span>`); }
    if (r.offline){ parts.push(`<span class="badge bad" title="Musí běžet vždy — i v krizovém/offline režimu.">⛯ nevypnutelná</span>`); }
    const kc = r.kriteria ? Object.keys(r.kriteria).filter(k=>r.kriteria[k]).length : 0;
    if (kc) parts.push(`<span class="badge pink" title="Počet zaškrtnutých kritérií dle vyhlášky.">${kc}× kritérium</span>`);
    return parts.join(' ');
  }

  // tlačítkový přepínač (jednoklikový, zvýrazní vybranou volbu)
  function choiceBtns(opts, current, dataAttr){
    return opts.map(o=>{
      const on = current===o.klic;
      const col = o.col || 'var(--navy)';
      const style = on
        ? `background:${col};color:#fff;border-color:${col};font-weight:700`
        : `background:#fff;color:var(--ink);border-color:var(--line)`;
      return `<button class="btn" ${dataAttr}="${esc(o.klic)}" style="${style};padding:6px 12px">${esc(o.label)}</button>`;
    }).join(' ');
  }

  /* ================= mapování na ISVS (Změna 04) ================= */

  // vrátí mapu agendaId -> agenda (jen jednou)
  function indexAgendy(agendy){ const m={}; agendy.forEach(a=>m[a.id]=a); return m; }
  function indexIsvs(isvs){ const m={}; isvs.forEach(i=>m[i.id]=i); return m; }

  // sesbírá unikátní systémy napříč zadanými agendami + počet kritických agend na systém
  function systemyKritickych(stav, agIdx, predikat){
    const sysCnt = {};      // isvsId -> počet (kritických) agend
    const sysAgendy = {};   // isvsId -> [agendaId,…]
    Object.keys(stav).forEach(aid=>{
      const r = stav[aid];
      if (!predikat(r)) return;
      const a = agIdx[aid];
      if (!a || !Array.isArray(a.isvs)) return;
      a.isvs.forEach(iid=>{
        sysCnt[iid] = (sysCnt[iid]||0)+1;
        (sysAgendy[iid] = sysAgendy[iid] || []).push(aid);
      });
    });
    return { sysCnt, sysAgendy, pocetSystemu: Object.keys(sysCnt).length };
  }

  // souhrnná karta: dotčené systémy + žebříček systémů nesoucích nejvíc agend
  function mapovaciKarta(nadpis, podtext, stav, agIdx, isvsIdx, predikat){
    const { sysCnt, pocetSystemu } = systemyKritickych(stav, agIdx, predikat);
    const ranked = Object.keys(sysCnt)
      .map(iid=>({ iid, n:sysCnt[iid], it:isvsIdx[iid] }))
      .sort((a,b)=> b.n-a.n || String(a.iid).localeCompare(String(b.iid)));
    const top = ranked.slice(0, 20);

    let body;
    if (!ranked.length){
      body = `<div class="empty">Zatím žádné odpovídající agendy — jakmile nějakou označíte, objeví se zde dotčené systémy a jejich žebříček.</div>`;
    } else {
      const rows = top.map(x=>{
        const it = x.it;
        const nm = it ? link(it.id, it.nazev) : link(x.iid);
        const role = it && it.registr ? ' '+badgeRegistr() : '';
        const sec = it ? ' '+badgeSec(it.bezuroven) : '';
        return `<tr>
          <td>${nm}${role}</td>
          <td style="text-align:center">${sec}</td>
          <td style="text-align:right;font-weight:700;font-variant-numeric:tabular-nums">${fmt(x.n)}</td>
        </tr>`;
      }).join('');
      body =
        `<div style="font-size:13px;margin-bottom:8px">Dotčené systémy celkem: <b>${fmt(pocetSystemu)}</b>`+
        ` <span class="mono">(napříč ${fmt(Object.keys(stav).filter(id=>predikat(stav[id])).length)} označenými agendami)</span></div>`+
        `<div class="tablewrap"><table><thead><tr>`+
        `<th>Systém (ISVS) nesoucí nejvíc agend</th><th style="text-align:center">úroveň</th><th style="text-align:right">agend</th>`+
        `</tr></thead><tbody>${rows}</tbody></table></div>`+
        (ranked.length>top.length?`<div class="muted small" style="margin-top:6px">Zobrazeno ${top.length} z ${ranked.length} systémů (seřazeno dle počtu agend).</div>`:'');
    }
    return `<div class="card" style="margin-top:14px">
      <h2>${esc(nadpis)}</h2>
      <div class="desc small" style="margin:-6px 0 10px">${podtext}</div>
      ${body}</div>`;
  }

  /* ================= OBRAZOVKA 1: #/kriticnost ================= */

  async function kriticnost(){
    await ensureNames();
    const agendy = await load('agendy');
    const isvs = await load('isvs');
    const agIdx = indexAgendy(agendy);
    const isvsIdx = indexIsvs(isvs);

    // seznam ministerstev pro filtr
    const minSet = Array.from(new Set(agendy.map(ministerstvo))).filter(Boolean).sort((a,b)=>a.localeCompare(b,'cs'));

    const ui = { q:'', min:'', limit:120, open:{} };

    view.innerHTML = `
      <div class="pagehdr">
        <div>
          <h1>Kritické agendy — sběrový formulář</h1>
          <div class="sub">Změna 03 + 04 + 05 · analýza rizik a odolnosti · quick win pro DIA</div>
        </div>
      </div>
      <div class="card" style="margin-bottom:14px">
        <div class="desc" style="margin-bottom:0">
          Jednoduchý formulář pro <b>věcné správce agend</b> (ne pro IT): u každé agendy jedním
          kliknutím zvolte, <b>jak dlouho smí být nedostupná</b> a <b>jaký by měl výpadek dopad</b>.
          U závažných agend doplňte <b>kritéria dle vyhlášky</b>. Výsledek je okamžitě k dispozici jako
          podklad pro <b>DIA</b> — předložitelný hasičům (HZS) a Správě státních hmotných rezerv.
          Vše zůstává jen ve vašem prohlížeči (žádné odesílání), zálohu pořídíte tlačítkem Export.
          Návod a metodika: <a class="link" href="#/metodika">otevřít metodiku</a>.
        </div>
      </div>

      <div class="kpis" id="kkpi" style="grid-template-columns:repeat(3,1fr)"></div>

      <div id="kmap"></div>

      <div class="card">
        <div class="toolbar">
          <input class="grow" id="kq" placeholder="Filtrovat agendy podle názvu / kódu…">
          <select id="kmin"><option value="">Ministerstvo: vše</option>${minSet.map(m=>`<option>${esc(m)}</option>`).join('')}</select>
          <span id="ktool"></span>
          <span class="count" id="kc"></span>
        </div>
        <div id="ktable"></div>
        <div style="text-align:center;margin-top:12px"><button class="btn" id="kmore" style="display:none">Načíst dalších 120</button></div>
      </div>
    `;

    byId('ktool').appendChild(dataToolbar(()=>{ ui.open={}; redraw(); }));

    function filtered(){
      let rows = agendy;
      const q = ui.q.trim().toLowerCase();
      if (q) rows = rows.filter(a => (a.nazev+' '+a.kod).toLowerCase().includes(q));
      if (ui.min) rows = rows.filter(a => ministerstvo(a)===ui.min);
      return rows.slice().sort((a,b)=>a.nazev.localeCompare(b.nazev,'cs'));
    }

    function drawKpi(){
      const stav = loadStav();
      const ids = Object.keys(stav).filter(id=>hasData(stav[id]));
      const crit = ids.filter(id=>isCritical(stav[id]));
      const { pocetSystemu } = systemyKritickych(stav, agIdx, isCritical);
      byId('kkpi').innerHTML =
        `<div class="kpi"><div class="v">${fmt(ids.length)}</div><div class="l">Označených agend</div></div>`+
        `<div class="kpi"><div class="v" style="color:#c0392b">${fmt(crit.length)}</div><div class="l">z toho kritických (vysoký/kritický dopad)</div></div>`+
        `<div class="kpi"><div class="v">${fmt(pocetSystemu)}</div><div class="l">Dotčených systémů (ISVS)</div></div>`;
    }

    function drawMap(){
      const stav = loadStav();
      byId('kmap').innerHTML = mapovaciKarta(
        'Mapování kritických agend na systémy (Změna 04)',
        'Unikátní informační systémy (ISVS), na kterých visí agendy označené jako <b>kritické</b> (vysoký/kritický dopad). '+
        'Obrácený pohled „systémy nesoucí nejvíc kritických agend" ukazuje, kde výpadek jednoho systému ochromí nejvíc agend.',
        stav, agIdx, isvsIdx, isCritical);
    }

    function rowHtml(a, stav){
      const r = stav[a.id];
      const open = ui.open[a.id];
      const head = `<tr data-row="${esc(a.id)}" style="cursor:pointer">
        <td class="mono">${esc(a.kod)}</td>
        <td>${link(a.id, a.nazev)}</td>
        <td>${esc(ministerstvo(a))}</td>
        <td>${stavBadge(r)}</td>
        <td style="text-align:center;color:var(--muted)">${open?'▾':'▸'}</td>
      </tr>`;
      if (!open) return head;
      return head + `<tr data-detail="${esc(a.id)}"><td colspan="5" style="background:#f7fafd">${detailHtml(a, stav)}</td></tr>`;
    }

    function detailHtml(a, stav){
      const r = rec(stav, a.id); // bez uložení (čistá kopie z paměti)
      const krit = isCritical(r);
      const checked = k => (r.kriteria && r.kriteria[k]) ? 'checked' : '';

      let mapBlok = '';
      if (krit && Array.isArray(a.isvs) && a.isvs.length){
        const list = a.isvs.slice(0, 40).map(iid=>{
          const it = isvsIdx[iid];
          const nm = it ? link(it.id, it.nazev) : link(iid);
          const role = it && it.registr ? ' '+badgeRegistr() : '';
          return `<span class="chip" style="background:#fff;border:1px solid var(--line)">${nm}${role} ${it?badgeSec(it.bezuroven):''}</span>`;
        }).join(' ');
        mapBlok = `<div style="margin-top:12px">
          <div style="font-weight:700;font-size:13px;margin-bottom:6px">⚠ Dotčené systémy této kritické agendy <span class="muted small">(${fmt(a.isvs.length)} ISVS)</span></div>
          <div style="line-height:2.1">${list}${a.isvs.length>40?` <span class="muted small">+${a.isvs.length-40} dalších</span>`:''}</div>
        </div>`;
      }

      return `<div data-pane="${esc(a.id)}" style="padding:14px 6px">
        <div class="grid2" style="grid-template-columns:1fr 1fr;gap:18px">
          <div>
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">Max. tolerovaná doba nedostupnosti</div>
            <div style="display:flex;gap:7px;flex-wrap:wrap" data-grp="doba">${choiceBtns(DOBY, r.doba, 'data-doba')}</div>
          </div>
          <div>
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">Dopad výpadku</div>
            <div style="display:flex;gap:7px;flex-wrap:wrap" data-grp="dopad">${choiceBtns(DOPADY, r.dopad, 'data-dopad')}</div>
            <div class="muted small" style="margin-top:5px">Volba „vysoký" / „kritický" označí agendu jako <b>kritickou</b> a zapne mapování na systémy.</div>
          </div>
        </div>

        <div style="margin-top:14px;border-top:1px dashed var(--line);padding-top:12px">
          <button class="btn" data-toggle-krit style="padding:6px 12px">📋 Hodnotící kritéria dle vyhlášky ${r.kriteria&&Object.keys(r.kriteria).some(k=>r.kriteria[k])?`<span class="badge pink" style="margin-left:4px">${Object.keys(r.kriteria).filter(k=>r.kriteria[k]).length}</span>`:''}</button>
          <div data-krit style="display:none;margin-top:10px">
            <div class="muted small" style="margin-bottom:8px">Kritéria dopadu dle vyhlášky o bezpečnostních úrovních informačních systémů. Zaškrtněte, co se na agendu vztahuje.</div>
            ${KRITERIA_VYHLASKA.map(k=>`
              <label class="kv" style="cursor:pointer;border-bottom:1px dashed var(--line);align-items:flex-start">
                <span style="flex:1;text-align:left">
                  <input type="checkbox" data-krit-box="${esc(k.klic)}" ${checked(k.klic)} style="margin-right:8px">
                  <b style="color:var(--ink)">${esc(k.nazev)}</b>
                  <div class="muted small" style="margin:2px 0 0 24px">${esc(k.popis)}</div>
                </span>
              </label>`).join('')}
          </div>
        </div>

        <div data-mapblok>${mapBlok}</div>

        ${r.ts?`<div class="muted small" style="margin-top:10px">Naposledy upraveno: ${esc(new Date(r.ts).toLocaleString('cs-CZ'))}</div>`:''}
      </div>`;
    }

    function redrawRow(a){
      // překreslí jen detail řádku (po změně volby), aby se nezavíral seznam
      const stav = loadStav();
      const det = byId('ktable').querySelector(`tr[data-detail="${cssEsc(a.id)}"] > td`);
      if (det){ det.innerHTML = detailHtml(a, stav); bindPane(a, det); }
      // hlavička (badge stavu) + KPI + mapa
      const head = byId('ktable').querySelector(`tr[data-row="${cssEsc(a.id)}"]`);
      if (head){ head.children[3].innerHTML = stavBadge(stav[a.id]); }
      drawKpi(); drawMap();
    }

    function bindPane(a, paneTd){
      const stav0 = loadStav();
      // DOBA
      paneTd.querySelectorAll('[data-doba]').forEach(btn=>btn.addEventListener('click', ()=>{
        const stav = loadStav(); const r = rec(stav, a.id);
        r.doba = (r.doba===btn.dataset.doba) ? null : btn.dataset.doba; // toggle
        touch(stav, a.id); saveStav(stav); redrawRow(a);
      }));
      // DOPAD
      paneTd.querySelectorAll('[data-dopad]').forEach(btn=>btn.addEventListener('click', ()=>{
        const stav = loadStav(); const r = rec(stav, a.id);
        r.dopad = (r.dopad===btn.dataset.dopad) ? null : btn.dataset.dopad; // toggle
        touch(stav, a.id); saveStav(stav); redrawRow(a);
      }));
      // toggle panelu kritérií
      const tgl = paneTd.querySelector('[data-toggle-krit]');
      const box = paneTd.querySelector('[data-krit]');
      if (tgl && box) tgl.addEventListener('click', ()=>{ box.style.display = box.style.display==='none' ? '' : 'none'; });
      // kritéria
      paneTd.querySelectorAll('[data-krit-box]').forEach(cb=>cb.addEventListener('change', ()=>{
        const stav = loadStav(); const r = rec(stav, a.id);
        if (cb.checked) r.kriteria[cb.dataset.kritBox] = true; else delete r.kriteria[cb.dataset.kritBox];
        touch(stav, a.id); saveStav(stav);
        // jen aktualizuj badge stavu + KPI; panel necháme otevřený
        const head = byId('ktable').querySelector(`tr[data-row="${cssEsc(a.id)}"]`);
        if (head){ head.children[3].innerHTML = stavBadge(stav[a.id]); }
        drawKpi();
      }));
      void stav0;
    }

    function redraw(){
      const stav = loadStav();
      const rows = filtered();
      const shown = rows.slice(0, ui.limit);
      byId('ktable').innerHTML =
        `<div class="tablewrap"><table><thead><tr>`+
        `<th>Kód</th><th>Agenda</th><th>Ministerstvo (ohlašovatel)</th><th>Stav označení</th><th></th>`+
        `</tr></thead><tbody>${shown.map(a=>rowHtml(a, stav)).join('')}</tbody></table></div>`;
      byId('kc').textContent = `${fmt(rows.length)} agend` + (rows.length>shown.length?` · zobrazeno ${fmt(shown.length)}`:'');
      byId('kmore').style.display = rows.length>ui.limit ? '' : 'none';

      // toggle řádků
      byId('ktable').querySelectorAll('tr[data-row]').forEach(tr=>tr.addEventListener('click', e=>{
        if (e.target.closest('a')) return; // odkaz na detail agendy nech projít
        const id = tr.dataset.row;
        ui.open[id] = !ui.open[id];
        redraw();
      }));
      // navázání ovládání v otevřených panelech
      shown.forEach(a=>{
        if (!ui.open[a.id]) return;
        const det = byId('ktable').querySelector(`tr[data-detail="${cssEsc(a.id)}"] > td`);
        if (det) bindPane(a, det);
      });
      drawKpi(); drawMap();
    }

    byId('kq').addEventListener('input', e=>{ ui.q=e.target.value; ui.limit=120; redraw(); });
    byId('kmin').addEventListener('change', e=>{ ui.min=e.target.value; ui.limit=120; redraw(); });
    byId('kmore').addEventListener('click', ()=>{ ui.limit+=120; redraw(); });

    redraw();
  }

  /* ================= OBRAZOVKA 2: #/nevypnutelny ================= */

  // demonstrační heuristika kandidátů na „nevypnutelné" agendy
  function kandidatiNevypnutelne(agendy, isvsIdx){
    const out = [];
    agendy.forEach(a=>{
      let score = 0; const duvody = [];
      const sys = Array.isArray(a.isvs) ? a.isvs : [];
      // 1) závisí na základním registru
      const naRegistr = sys.some(iid => isvsIdx[iid] && isvsIdx[iid].registr);
      if (naRegistr){ score += 3; duvody.push('závisí na základním registru'); }
      // 2) čte z registrů (oprávnění „in")
      const oprIn = (a.c && a.c.opr_in) || 0;
      if (oprIn>0){ score += Math.min(2, oprIn>=5?2:1); duvody.push(`čte z registrů (${oprIn}× oprávnění)`); }
      // 3) bezpečnostně kritické systémy (bez_rank >= 3)
      const maxRank = sys.reduce((m,iid)=> isvsIdx[iid] ? Math.max(m, isvsIdx[iid].bez_rank||0) : m, 0);
      if (maxRank>=3){ score += (maxRank>=4?3:2); duvody.push(`napojeno na systém bezp. úrovně ${maxRank}`); }
      if (score>0) out.push({ a, score, duvody, naRegistr, oprIn, maxRank });
    });
    return out.sort((x,y)=> y.score-x.score || x.a.nazev.localeCompare(y.a.nazev,'cs'));
  }

  async function nevypnutelny(){
    await ensureNames();
    const agendy = await load('agendy');
    const isvs = await load('isvs');
    const agIdx = indexAgendy(agendy);
    const isvsIdx = indexIsvs(isvs);
    const minSet = Array.from(new Set(agendy.map(ministerstvo))).filter(Boolean).sort((a,b)=>a.localeCompare(b,'cs'));

    const ui = { q:'', min:'', limit:120 };

    view.innerHTML = `
      <div class="pagehdr">
        <div>
          <h1>Stát, který se nedá vypnout</h1>
          <div class="sub">Změna 18 · dimenze odolnosti / nepřetržitosti · vazba na program Byvoj a AFCEA Digitální suverenita</div>
        </div>
      </div>
      <div class="card" style="margin-bottom:14px">
        <div class="desc" style="margin-bottom:0">
          Rozšiřuje hodnocení o otázku <b>odolnosti</b>: které agendy <b>musí běžet vždy</b> — i v krizovém nebo
          offline režimu? V krizi je státu jedno, jestli mám platný řidičák; ale <b>cizinecký informační systém</b>
          nebo registry pro IZS musí běžet do poslední chvíle. Cílem je vědomě budovat
          „<b>stát, který se nedá vypnout</b>" (program Byvoj / AFCEA Digitální suverenita).
          Označení se sdílí s formulářem <a class="link" href="#/kriticnost">kritických agend</a>.
        </div>
      </div>

      <div class="kpis" id="nkpi" style="grid-template-columns:repeat(3,1fr)"></div>

      <div id="nmap"></div>

      <div class="card" id="ncand"></div>

      <div class="card">
        <div class="toolbar">
          <input class="grow" id="nq" placeholder="Filtrovat agendy podle názvu / kódu…">
          <select id="nmin"><option value="">Ministerstvo: vše</option>${minSet.map(m=>`<option>${esc(m)}</option>`).join('')}</select>
          <span id="ntool"></span>
          <span class="count" id="nc"></span>
        </div>
        <div class="desc small" style="margin:-4px 0 10px">Přepínačem označte agendy, které <b>musí běžet vždy</b>. Ukládá se průběžně do tohoto prohlížeče.</div>
        <div id="ntable"></div>
        <div style="text-align:center;margin-top:12px"><button class="btn" id="nmore" style="display:none">Načíst dalších 120</button></div>
      </div>
    `;

    byId('ntool').appendChild(dataToolbar(()=>redraw()));

    const isOffline = r => !!r && !!r.offline;

    function drawKpi(){
      const stav = loadStav();
      const offIds = Object.keys(stav).filter(id=>isOffline(stav[id]));
      const { pocetSystemu } = systemyKritickych(stav, agIdx, isOffline);
      const cand = kandidatiNevypnutelne(agendy, isvsIdx);
      byId('nkpi').innerHTML =
        `<div class="kpi"><div class="v" style="color:#c0392b">${fmt(offIds.length)}</div><div class="l">Označeno „musí běžet vždy"</div></div>`+
        `<div class="kpi"><div class="v">${fmt(pocetSystemu)}</div><div class="l">Systémová závislost (dotčené ISVS)</div></div>`+
        `<div class="kpi"><div class="v">${fmt(cand.length)}</div><div class="l">Kandidátů z heuristiky RPP</div></div>`;
    }

    function drawMap(){
      const stav = loadStav();
      byId('nmap').innerHTML = mapovaciKarta(
        'Systémová závislost nevypnutelných agend',
        'Informační systémy (ISVS), na kterých visí agendy označené jako <b>„musí běžet vždy"</b> — tyto systémy je třeba zajistit pro nepřetržitý/krizový provoz.',
        stav, agIdx, isvsIdx, isOffline);
    }

    function drawCandidates(){
      const cand = kandidatiNevypnutelne(agendy, isvsIdx).slice(0, 25);
      const stav = loadStav();
      const rows = cand.map((x,i)=>{
        const r = stav[x.a.id];
        const on = isOffline(r);
        return `<tr>
          <td style="text-align:center;color:var(--muted)">${i+1}</td>
          <td class="mono">${esc(x.a.kod)}</td>
          <td>${link(x.a.id, x.a.nazev)} ${x.naRegistr?badgeRegistr():''}</td>
          <td>${esc(ministerstvo(x.a))}</td>
          <td><div class="track" style="display:inline-block;width:90px;height:8px;background:#e8eef7;border-radius:6px;vertical-align:middle;overflow:hidden"><div style="height:100%;width:${Math.min(100, x.score*12)}%;background:linear-gradient(90deg,var(--neon-cyan),#c0392b)"></div></div> <b style="font-variant-numeric:tabular-nums">${x.score}</b></td>
          <td class="muted small">${esc(x.duvody.join('; '))}</td>
          <td style="text-align:center"><button class="btn" data-cand="${esc(x.a.id)}" style="padding:5px 10px;${on?'background:#c0392b;color:#fff;border-color:#c0392b':''}">${on?'✓ označeno':'+ označit'}</button></td>
        </tr>`;
      }).join('');
      byId('ncand').innerHTML = `
        <h2>Rychlá rešerše kandidátů na „nevypnutelné" agendy</h2>
        <div class="desc small" style="margin:-6px 0 10px">
          <span class="badge warn">⚙ odvozeno — demonstrační heuristika</span>
          Skóre se počítá z prerekvizit v RPP: závislost na <b>základním registru</b> (+3),
          <b>čtení z registrů</b> (oprávnění „in", +1–2) a napojení na <b>bezpečnostně kritické systémy</b>
          (úroveň ≥ 3, +2–3). Není to oficiální klasifikace — slouží jako odrazový můstek pro věcného správce.
        </div>
        <div class="tablewrap"><table><thead><tr>
          <th>#</th><th>Kód</th><th>Agenda</th><th>Ministerstvo</th><th>Skóre ⚙</th><th>Důvod</th><th>Označit</th>
        </tr></thead><tbody>${rows}</tbody></table></div>`;
      byId('ncand').querySelectorAll('[data-cand]').forEach(btn=>btn.addEventListener('click', ()=>{
        const stav = loadStav(); const r = rec(stav, btn.dataset.cand);
        r.offline = !r.offline; touch(stav, btn.dataset.cand); saveStav(stav); redraw();
      }));
    }

    function filtered(){
      let rows = agendy;
      const q = ui.q.trim().toLowerCase();
      if (q) rows = rows.filter(a => (a.nazev+' '+a.kod).toLowerCase().includes(q));
      if (ui.min) rows = rows.filter(a => ministerstvo(a)===ui.min);
      return rows.slice().sort((a,b)=>a.nazev.localeCompare(b.nazev,'cs'));
    }

    function drawTable(){
      const stav = loadStav();
      const rows = filtered();
      const shown = rows.slice(0, ui.limit);
      byId('ntable').innerHTML =
        `<div class="tablewrap"><table><thead><tr>`+
        `<th>Kód</th><th>Agenda</th><th>Ministerstvo</th><th>Stav</th><th style="text-align:center">Musí běžet vždy</th>`+
        `</tr></thead><tbody>${shown.map(a=>{
          const r = stav[a.id]; const on = isOffline(r);
          return `<tr>
            <td class="mono">${esc(a.kod)}</td>
            <td>${link(a.id, a.nazev)}</td>
            <td>${esc(ministerstvo(a))}</td>
            <td>${stavBadge(r)}</td>
            <td style="text-align:center"><button class="btn" data-off="${esc(a.id)}" style="padding:5px 12px;${on?'background:#c0392b;color:#fff;border-color:#c0392b':''}">${on?'✓ ANO':'NE'}</button></td>
          </tr>`;
        }).join('')}</tbody></table></div>`;
      byId('nc').textContent = `${fmt(rows.length)} agend` + (rows.length>shown.length?` · zobrazeno ${fmt(shown.length)}`:'');
      byId('nmore').style.display = rows.length>ui.limit ? '' : 'none';
      byId('ntable').querySelectorAll('[data-off]').forEach(btn=>btn.addEventListener('click', ()=>{
        const stav = loadStav(); const r = rec(stav, btn.dataset.off);
        r.offline = !r.offline; touch(stav, btn.dataset.off); saveStav(stav); redraw();
      }));
    }

    function redraw(){ drawKpi(); drawMap(); drawCandidates(); drawTable(); }

    byId('nq').addEventListener('input', e=>{ ui.q=e.target.value; ui.limit=120; drawTable(); });
    byId('nmin').addEventListener('change', e=>{ ui.min=e.target.value; ui.limit=120; drawTable(); });
    byId('nmore').addEventListener('click', ()=>{ ui.limit+=120; drawTable(); });

    redraw();
  }

  /* ================= util: escape pro CSS atribut selektor ================= */
  function cssEsc(s){
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, ch => '\\'+ch);
  }

  /* ================= registrace rout ================= */
  Object.assign(ROUTES, { kriticnost, nevypnutelny });

})();
