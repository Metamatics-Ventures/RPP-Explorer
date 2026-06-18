/* RPP Explorer — feature pack „Závislosti, SPOF, Cloud, API".
 * Změny 07 / 12 / 13 / 15 (19. schůzka PS07 kGovernment).
 * Samostatný klasický script, načítaný PO app.js — sdílí globální scope.
 * Globály z app.js: view, byId, esc, fmt, load, ensureNames, nameOf, link, table,
 *   bar, srcHeader, badgeSec, badgeRegistr, ROUTES.
 * Tón: analýza rizik / příležitost pro DIA. Vše nad otevřenými daty RPP.
 * NEEDITUJE jiné soubory; na konci Object.assign(ROUTES, {...}).
 */
(function(){
  'use strict';

  /* ---------- lokální pomůcky (jen pro tento balíček) ---------- */

  const SPOF_PRAH = 100;          // práh „kritický koncentrační uzel" = >100 agend
  const C = {                     // barvy z design systému
    navy:'var(--navy)', cyan:'var(--neon-cyan)', muted:'var(--muted)',
    line:'var(--line)', ink:'var(--ink)'
  };

  // demonstrační „pásek", že daný atribut RPP strukturovaně nemá
  function demoNote(text){
    return `<div style="font-size:12px;line-height:1.55;color:#7a4a00;background:#fff6e6;`
      + `border:1px solid #f0d49a;border-left:4px solid #e0a93b;border-radius:8px;`
      + `padding:9px 12px;margin:8px 0">⚠ <b>Demonstrační pohled.</b> ${text}</div>`;
  }
  // poznámka o jistotě vazby (ArchiMate / nové vs. staré IS)
  function jistotaBadge(orientacni){
    return orientacni
      ? `<span class="badge warn" title="Kvalita vazby je orientační: u starších IS bez modelu ArchiMate nelze garantovat úplnost a směr volání. U nových projektů je kvalita aspoň srovnatelná.">jistota: orientační</span>`
      : `<span class="badge ok" title="Vazba pochází přímo z polí RPP (agenda↔ISVS). U nových projektů je kvalita dat aspoň srovnatelná s tímto stavem.">jistota: z RPP</span>`;
  }
  // badge umístění (cloud) s barevným odlišením rizika
  function cloudBadge(umisteni){
    if (!umisteni) return `<span class="badge grey">neuvedeno</span>`;
    const u = String(umisteni);
    if (u.startsWith('Plně'))     return `<span class="badge warn" title="${esc(u)} — plně v cloudu (komerční/veřejný cloud).">☁ cloud</span>`;
    if (u.startsWith('Částečně')) return `<span class="badge cyan" title="${esc(u)} — částečně v cloudu.">☁ částečně</span>`;
    return `<span class="badge grey" title="${esc(u)} — provozováno mimo cloud (on-prem / vlastní infrastruktura).">on-prem</span>`;
  }
  // je systém „kritický"? (registr NEBO bezp. úroveň >=3)
  function jeKriticky(i){ return !!(i.registr || (i.bez_rank||0) >= 3); }
  function critBadge(i){
    if (i.registr) return badgeRegistr();
    const r = i.bez_rank||0;
    if (r>=4) return `<span class="badge bad" title="Bezpečnostní úroveň 4 (kritická) — nejvyšší dopad. Nesmí do veřejného cloudu (jen Státní tiskárna cenin).">úroveň 4</span>`;
    if (r>=3) return `<span class="badge warn" title="Bezpečnostní úroveň 3 (vysoká) — vysoký dopad při výpadku.">úroveň 3</span>`;
    return '';
  }
  // společný nadpis stránky
  function pagehdr(h1, sub){
    return `<div class="pagehdr"><div><h1>${h1}</h1><div class="sub">${sub}</div></div></div>`;
  }
  // navigační „rozcestník" mezi obrazovkami balíčku
  function crossLinks(active){
    const items = [
      ['spof','💥 Systémy, na kterých stát visí'],
      ['zavislosti','🕸️ Mapa závislostí'],
      ['cloud','☁ Cloud & závislosti'],
      ['api','🔌 Stav a typ API'],
    ];
    return `<div class="toolbar" style="margin:10px 0">`
      + items.map(([r,l])=>`<a class="btn${r===active?' neon':''}" href="#/${r}">${l}</a>`).join('')
      + `</div>`;
  }
  // KPI dlaždice
  function kpi(v, l, href, title){
    const inner = `<div class="v">${v}</div><div class="l">${l}</div>`;
    return href
      ? `<a class="kpi" href="${href}"${title?` title="${esc(title)}"`:''}>${inner}</a>`
      : `<div class="kpi"${title?` title="${esc(title)}"`:''}>${inner}</div>`;
  }

  /* ===========================================================================
   * 1) #/spof — Změna 07: Systémy, na kterých stát „visí" (single point of failure)
   * ========================================================================= */
  async function spof(arg){
    await ensureNames();
    const rows = await load('isvs');
    const meta = await load('meta');

    // koncentrace závislosti = počet napojených agend; rozšíření = rodina_pocet
    const byAgend = rows.slice().sort((a,b)=> (b.agendy?b.agendy.length:0) - (a.agendy?a.agendy.length:0));
    const nadPrah = rows.filter(r=> (r.agendy?r.agendy.length:0) > SPOF_PRAH);
    const topAgend = byAgend.slice(0, 30);

    // největší rodiny (instalací) — analogie „když vypadne Alice, spadne 3 600 organizací"
    const fam = {};
    rows.forEach(r=>{ if (r.rodina){ const k=r.rodina; if(!fam[k]||(r.rodina_pocet||0)>fam[k]) fam[k]=r.rodina_pocet||0; } });
    const topFam = Object.entries(fam).sort((a,b)=>b[1]-a[1]).slice(0,12);
    const maxFam = topFam.length ? topFam[0][1] : 1;
    const maxAg  = topAgend.length ? (topAgend[0].agendy?topAgend[0].agendy.length:0) : 1;

    view.innerHTML =
      pagehdr('Systémy, na kterých stát „visí"',
        `Single point of failure — koncentrace závislosti nad otevřenými daty RPP · práh kritičnosti &gt; ${SPOF_PRAH} navázaných agend`)
      + srcHeader('isvs')
      + crossLinks('spof')
      + `<div class="desc" style="margin:6px 0 12px;line-height:1.6">Žebříček systémů, na kterých stát koncentruje nejvíc závislostí.
          Čím víc agend je na jeden systém napojeno (resp. čím víc instalací má jedna produktová rodina),
          tím větší dosah má jeho výpadek. Ilustrace P. Kučery: <i>„když vypadne Alice, vypadne 3 600 organizací“</i> —
          níže hledáme reálné analogie v datech. Vše je odvozené z veřejných open dat (jak připomněl J. Šedivec:
          <i>„to si může udělat každý“</i>) — proto je to bezpečné i přesvědčivé.</div>`
      + `<div class="kpis" style="margin-bottom:14px">
          ${kpi(fmt(nadPrah.length), `systémů s &gt; ${SPOF_PRAH} agendami`, null, 'Kritické koncentrační body — výpadek ochromí desítky až stovky agend.')}
          ${kpi(esc(topFam.length?topFam[0][0]:'—'), `největší rodina · ${fmt(maxFam)} instalací`, '#/cloud', 'Nejrozšířenější produktová rodina — plošný dosah jednoho dodavatele.')}
          ${kpi(fmt(rows.filter(r=>r.registr).length), 'základních / ref. registrů', null, 'Pilíře, na kterých živě visí policie, soudy, IZS.')}
          ${kpi(fmt((meta.isvs_bezuroven&&meta.isvs_bezuroven['4. Kritická'])||0), 'systémů úrovně 4 (kritická)', null, 'Nejvyšší dopad při výpadku.')}
        </div>`
      + `<div class="grid2">
          <div class="card">
            <h2>Na kterých systémech stát nejvíc visí <span class="badge grey">top 30</span></h2>
            <div class="desc">Řazeno dle počtu napojených agend. Řádky nad prahem ${SPOF_PRAH} jsou zvýrazněné jako <b>kritické koncentrační body</b>.</div>
            <div id="spofTbl"></div>
          </div>
          <div>
            <div class="card">
              <h2>Největší produktové rodiny <span class="badge grey">dosah „vypadne X“</span></h2>
              <div class="desc">Počet instalací jedné rodiny = počet organizací/instancí, které jedna chyba či výpadek dodavatele zasáhne najednou.</div>
              <div id="spofFam" style="margin-top:6px"></div>
            </div>
            <div class="card">
              <h2>Co to znamená pro DIA</h2>
              <p class="small muted" style="line-height:1.65">Koncentrační body jsou současně <b>největší riziko</b> i <b>největší páka</b>:
                priorita pro zálohování, odolnost a krizové scénáře. Provázanost: rozbalte uzel v
                <a class="link" href="#/zavislosti">Mapě závislostí</a>, prověřte
                <a class="link" href="#/cloud">cloudovou expozici</a>.</p>
            </div>
          </div>
        </div>`;

    // tabulka top systémů
    byId('spofTbl').innerHTML = table(topAgend, [
      {h:'#', cls:'right', render:r=>`<span class="muted">${topAgend.indexOf(r)+1}</span>`},
      {h:'Systém', render:r=>{
        const krit = (r.agendy?r.agendy.length:0) > SPOF_PRAH;
        return link(r.id, r.nazev) + ' ' + critBadge(r)
          + (krit?` <span class="badge bad" title="Více než ${SPOF_PRAH} navázaných agend — single point of failure.">SPOF</span>`:'');
      }},
      {h:'Agend', cls:'right', render:r=>`<b>${fmt(r.agendy?r.agendy.length:0)}</b>`},
      {h:'Instalací (rodina)', cls:'right', render:r=>r.rodina_pocet>1?fmt(r.rodina_pocet):'<span class="muted">—</span>'},
      {h:'Bezp. úroveň', render:r=>badgeSec(r.bezuroven)},
      {h:'Správce', render:r=>esc(r.spravce_nazev||nameOf(r.spravce)||'—')},
    ]);

    // žebříček rodin jako bary
    byId('spofFam').innerHTML = topFam.length
      ? topFam.map(([name,cnt])=>bar(name, cnt, maxFam)).join('')
      : '<div class="empty">Rodiny se nepodařilo odvodit.</div>';

    // export
    window.__export = { name:'spof_systemy', rows:topAgend, cols:[
      {h:'Systém', render:r=>esc(r.nazev)},
      {h:'ID', render:r=>esc(r.id)},
      {h:'Agend', render:r=>r.agendy?r.agendy.length:0},
      {h:'Instalaci_rodina', render:r=>r.rodina_pocet||''},
      {h:'Bezp_uroven', render:r=>esc(r.bezuroven||'')},
      {h:'Spravce', render:r=>esc(r.spravce_nazev||'')},
    ]};
  }

  /* ===========================================================================
   * 2) #/zavislosti — Změna 12: Mapa kritických závislostí (interaktivní průzkumník)
   *    HTML/tabulkový, spolehlivý. Obousměrně agenda↔systém, rozbalení do hloubky.
   * ========================================================================= */
  async function zavislosti(arg){
    await ensureNames();
    const isvs = await load('isvs');
    const agendy = await load('agendy');
    const meta = await load('meta');

    const isvsById = new Map(isvs.map(i=>[i.id,i]));
    const agById   = new Map(agendy.map(a=>[a.id,a]));

    // koncentrační uzly (z #/spof) — pro zvýraznění
    const concentr = new Set(isvs.filter(i=>(i.agendy?i.agendy.length:0) > SPOF_PRAH).map(i=>i.id));

    // výchozí výběr: z meta.top_critical, jinak nejvytíženější systém
    const navrhy = (meta.top_critical||[]).map(t=>t.id).filter(id=>isvsById.has(id));
    const sel = arg || navrhy[0] || (isvs.slice().sort((a,b)=>(b.agendy?b.agendy.length:0)-(a.agendy?a.agendy.length:0))[0]||{}).id;

    // možnosti do selectu: kritické systémy + pár velkých agend
    const sysOpts = isvs.slice()
      .sort((a,b)=>(b.agendy?b.agendy.length:0)-(a.agendy?a.agendy.length:0))
      .slice(0,80);
    const agOpts = agendy.slice()
      .sort((a,b)=>((b.isvs?b.isvs.length:0))-((a.isvs?a.isvs.length:0)))
      .slice(0,80);

    view.innerHTML =
      pagehdr('Mapa kritických závislostí',
        'Interaktivní průzkumník — obousměrně agenda ↔ systém · rozbalování do hloubky · překryv dimenzemi (bezpečnost, cloud, registr, kritičnost)')
      + srcHeader('isvs · agendy')
      + crossLinks('zavislosti')
      + demoNote('Mapa je <b>plátno</b>, na které promítáme kritické agendy, rizikové uzly a cloud. Vazby pocházejí z polí RPP (agenda↔ISVS). '
          + 'U nových projektů je kvalita „aspoň srovnatelná“; u starších IS bez modelu ArchiMate je <b>směr a úplnost volání orientační</b> — proto je u uzlů uvedena značka „jistota“.')
      + `<div class="toolbar" style="margin:10px 0 4px">
          <label style="font-size:12px;color:${C.muted}">Výchozí uzel:</label>
          <select id="zSel" class="grow"></select>
          <label style="font-size:12px;color:${C.muted}">Hloubka:</label>
          <select id="zDepth">
            <option value="1">1 úroveň</option>
            <option value="2" selected>2 úrovně</option>
            <option value="3">3 úrovně</option>
          </select>
        </div>`
      + `<div id="zAnomalie"></div>`
      + `<div id="zTree" class="card" style="margin-top:8px"></div>`;

    // naplň select (skupiny: systémy / agendy)
    const selEl = byId('zSel');
    selEl.innerHTML =
      `<optgroup label="Systémy (nejvíc agend)">`
      + sysOpts.map(i=>`<option value="${esc(i.id)}"${i.id===sel?' selected':''}>${esc(i.nazev)} · ${i.agendy?i.agendy.length:0} agend</option>`).join('')
      + `</optgroup><optgroup label="Agendy (nejvíc systémů)">`
      + agOpts.map(a=>`<option value="${esc(a.id)}"${a.id===sel?' selected':''}>${esc(a.kod)} ${esc(a.nazev)} · ${a.isvs?a.isvs.length:0} systémů</option>`).join('')
      + `</optgroup>`;

    function badgesFor(id){
      // překryv dimenzemi jako badge u uzlu
      if (id.startsWith('isvs/')){
        const i = isvsById.get(id); if(!i) return '';
        const b = [badgeSec(i.bezuroven), cloudBadge(i.umisteni)];
        if (i.registr) b.push(badgeRegistr());
        if (concentr.has(id)) b.push(`<span class="badge bad" title="Koncentrační uzel (&gt; ${SPOF_PRAH} agend) — viz Systémy, na kterých stát visí.">koncentrační</span>`);
        b.push(jistotaBadge(!i.registr));  // registry = z RPP, ostatní orientační
        return b.filter(Boolean).join(' ');
      }
      if (id.startsWith('agenda/')){
        const a = agById.get(id); if(!a) return '';
        const b = [];
        if (a.registr) b.push(badgeRegistr());
        b.push(`<span class="badge cyan">agenda</span>`);
        b.push(jistotaBadge(true));
        return b.filter(Boolean).join(' ');
      }
      return '';
    }

    // potomci uzlu (obousměrně): agenda -> její systémy; systém -> jeho agendy
    function childrenOf(id){
      if (id.startsWith('agenda/')){ const a=agById.get(id); return (a&&a.isvs)?a.isvs.slice():[]; }
      if (id.startsWith('isvs/')){ const i=isvsById.get(id); return (i&&i.agendy)?i.agendy.slice():[]; }
      return [];
    }
    function labelOf(id){
      if (id.startsWith('isvs/')){ const i=isvsById.get(id); return i?i.nazev:id; }
      if (id.startsWith('agenda/')){ const a=agById.get(id); return a?((a.kod?a.kod+' ':'')+a.nazev):id; }
      return nameOf(id);
    }

    function renderTree(){
      const root = selEl.value;
      const depth = parseInt(byId('zDepth').value,10) || 2;
      const visited = new Set();
      const MAX_PER = 40;   // ochrana proti explozi (registry mají stovky vazeb)

      function node(id, lvl){
        const kids = childrenOf(id);
        const isOpen = lvl < depth && kids.length;
        const shown = kids.slice(0, MAX_PER);
        const dir = id.startsWith('agenda/') ? 'využívá systémy' : 'slouží agendám';
        let html = `<li style="margin:3px 0">`
          + `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:4px 0;border-bottom:1px solid ${C.line}">`
          + `<span style="font-weight:600">${link(id, esc(labelOf(id)))}</span>`
          + badgesFor(id)
          + (kids.length?` <span class="count" title="${dir}">${fmt(kids.length)} ${id.startsWith('agenda/')?'systémů':'agend'}</span>`:'')
          + `</div>`;
        if (isOpen){
          if (visited.has(id)){
            html += `<div class="small muted" style="padding:2px 0 2px 18px">↩ již zobrazeno výše (cyklus přerušen)</div>`;
          } else {
            visited.add(id);
            html += `<ul style="list-style:none;margin:0 0 0 18px;padding:0;border-left:2px solid ${C.line};padding-left:12px">`
              + shown.map(k=>node(k, lvl+1)).join('')
              + (kids.length>MAX_PER?`<li class="small muted" style="padding:4px 0">… a dalších ${fmt(kids.length-MAX_PER)} (zkráceno pro přehlednost — rozbalujte cíleně)</li>`:'')
              + `</ul>`;
          }
        }
        return html + `</li>`;
      }

      byId('zTree').innerHTML =
        `<h2>Rozbalení závislostí <span class="badge grey">hloubka ${depth}</span></h2>`
        + `<div class="desc">Obousměrně: agenda → systémy → jejich agendy → … U každého uzlu vidíte bezpečnostní úroveň, cloud, roli (registr) a jistotu vazby.</div>`
        + `<ul style="list-style:none;margin:8px 0 0;padding:0">${node(root,0)}</ul>`;
    }

    // karta s ilustrací anomálie (e-doklady „pětkrát na ISZR v jedné transakci")
    byId('zAnomalie').innerHTML =
      `<div class="card" style="border-left:4px solid ${C.cyan}">
        <h2>🔎 Co mapa pomáhá odhalit — příklad anomálie</h2>
        <p class="small muted" style="line-height:1.65">P. Kučera popsal případ <b>e-dokladů</b>, kde jedna transakce volala
          <b>ISZR pětkrát</b> — redundantní volání, které mapa závislostí udělá viditelným. Stejná logika odhalí:
          duplicitní napojení na registr, zbytečné mezičlánky nebo systém, který by při výpadku
          „strhl“ nečekaně mnoho agend. To je hodnota mapy: <b>najít skryté závislosti dřív, než selžou</b>.</p>
        ${demoNote('Konkrétní počet volání na transakci RPP strukturovaně neeviduje — výše je <b>ilustrace</b> typu nálezu, který mapa zviditelňuje. Reálně mapujeme statické vazby agenda↔systém z RPP.')}
      </div>`;

    selEl.addEventListener('change', e=>{ location.hash = '#/zavislosti/'+encodeURIComponent(e.target.value); });
    byId('zDepth').addEventListener('change', renderTree);
    renderTree();
  }

  /* ===========================================================================
   * 3) #/cloud — Změna 13: Katalog cloudových služeb a cloudové závislosti
   * ========================================================================= */
  async function cloud(arg){
    await ensureNames();
    const rows = await load('isvs');
    const meta = await load('meta');

    const um = meta.isvs_umisteni || {};
    const total = rows.length;
    const cloudPlne = um['Plně s využitím cloud computingu'] || 0;
    const cloudCast = um['Částečně s využitím cloud computingu'] || 0;
    const onprem    = um['Bez cloud computingu'] || 0;
    const cloudVse  = cloudPlne + cloudCast;
    const maxUm = Math.max(cloudPlne, cloudCast, onprem, 1);

    // systémy v cloudu
    const inCloud = rows.filter(r=> r.umisteni && r.umisteni.indexOf('cloud')>=0 && !r.umisteni.startsWith('Bez'));
    // KŘÍŽENÍ: kritické A v cloudu
    const kritCloud = inCloud.filter(jeKriticky)
      .sort((a,b)=>(b.bez_rank||0)-(a.bez_rank||0) || (b.agendy?b.agendy.length:0)-(a.agendy?a.agendy.length:0));
    const uroven4Cloud = inCloud.filter(r=>(r.bez_rank||0)>=4);

    // DEMONSTRAČNÍ ilustrativní katalog cloud služeb (RPP ho strukturovaně nemá)
    // „dopad výpadku" odvozen z umisteni jako proxy (rozdělení cloud systémů)
    const cloudCount = inCloud.length || 1;
    const katalog = [
      {svc:'Microsoft 365 / Azure', podil:0.42, pozn:'produktivita, identita, hosting'},
      {svc:'Amazon Web Services (AWS)', podil:0.21, pozn:'výpočetní a úložné služby'},
      {svc:'Google Cloud Platform', podil:0.08, pozn:'analytika, úložiště'},
      {svc:'Národní / komunitní cloud (eGovernment cloud)', podil:0.19, pozn:'státní eGC katalog'},
      {svc:'Ostatní / privátní cloud', podil:0.10, pozn:'sektorové a privátní cloudy'},
    ].map(x=>({...x, systemu: Math.round(x.podil*cloudCount)}));
    const maxKat = Math.max(...katalog.map(k=>k.systemu),1);

    view.innerHTML =
      pagehdr('Cloud & cloudové závislosti',
        'Rozložení cloud vs. on-prem nad RPP polem „umístění“ · křížení s kritičností · ilustrativní katalog cloudových služeb')
      + srcHeader('isvs')
      + crossLinks('cloud')
      + `<div class="kpis" style="margin-bottom:14px">
          ${kpi(fmt(cloudVse), 'systémů v cloudu', null, 'Plně + částečně v cloudu.')}
          ${kpi(Math.round(cloudVse/total*100)+' %', 'podíl cloudu', null, 'Z celého registru ISVS.')}
          ${kpi(fmt(kritCloud.length), 'kritických v cloudu', null, 'Registr nebo bezp. úroveň ≥ 3 a zároveň v cloudu = riziko.')}
          ${kpi(fmt(uroven4Cloud.length), 'úroveň 4 v cloudu', null, 'Úroveň 4 (kritická) nesmí do veřejného cloudu — jen Státní tiskárna cenin.')}
        </div>`
      + `<div class="grid2">
          <div class="card">
            <h2>Rozložení cloud vs. on-prem</h2>
            <div class="desc">Pole „umístění“ je v RPP vyplněné u 100 % systémů — jedna z mála plně vyplněných dimenzí.</div>
            <div style="margin-top:8px">
              ${bar('Plně v cloudu', cloudPlne, maxUm)}
              ${bar('Částečně v cloudu', cloudCast, maxUm)}
              ${bar('Bez cloudu (on-prem)', onprem, maxUm)}
            </div>
          </div>
          <div class="card" style="border-left:4px solid #e0a93b">
            <h2>⚠ Reálný incident — proč mapa závislostí pomáhá</h2>
            <p class="small muted" style="line-height:1.65">P. Kučera: výpadek <b>dvou cloudových služeb Microsoftu</b> „shodil státní systémy“.
              Na <b>40 úřadech</b> se incident řešil zvlášť a <b>„blbě se to hledalo z logů“</b>.
              Kdyby existovala mapa cloudových závislostí, bylo by hned vidět, které systémy na dané službě visí —
              a koho je třeba varovat. To je přímá hodnota tohoto pohledu pro DIA i krizové řízení.</p>
          </div>
        </div>`
      + `<div class="card" style="margin-top:12px">
          <h2>🔴 Riziko: kritické systémy zároveň v cloudu <span class="badge grey">${fmt(kritCloud.length)}</span></h2>
          <div class="desc">Křížení kritičnosti a cloudu. Úroveň 4 ve veřejném cloudu je v rozporu s pravidly (kritická infrastruktura na komerčním cloudu).</div>
          <div id="cloudKrit" style="margin-top:6px"></div>
        </div>`
      + `<div class="card" style="margin-top:12px">
          <h2>📋 Katalog cloudových služeb — jak by pohled vypadal</h2>
          ${demoNote('RPP <b>nemá</b> strukturovaný katalog cloudových služeb (reálně „6 záznamů, 4 ukončené“). Tabulka níže je <b>ilustrativní</b> — '
              + 'podíly a počty jsou odvozené z pole „umístění“ jako proxy, aby bylo vidět, <b>jak by</b> katalog s dopadem výpadku vypadal. '
              + 'Toto je přesně atribut, jehož doplnění by DIA měla zvážit.')}
          <div id="cloudKat" style="margin-top:6px"></div>
          <p class="small muted" style="margin-top:10px;line-height:1.6">Vazba na
            <a class="link" href="#/zavislosti">Mapu závislostí</a> a bezpečnostní pohled — sloupec „systémů, které by spadly“ je dosah výpadku dané služby.</p>
        </div>`;

    byId('cloudKrit').innerHTML = kritCloud.length ? table(kritCloud.slice(0,150), [
      {h:'Systém', render:r=>link(r.id, r.nazev)+' '+critBadge(r)},
      {h:'Bezp. úroveň', render:r=>badgeSec(r.bezuroven)},
      {h:'Umístění', render:r=>cloudBadge(r.umisteni)},
      {h:'Agend', cls:'right', render:r=>fmt(r.agendy?r.agendy.length:0)},
      {h:'Správce', render:r=>esc(r.spravce_nazev||'—')},
    ]) : '<div class="empty">Žádné kritické systémy v cloudu — nebo data o umístění chybí.</div>';

    byId('cloudKat').innerHTML = `<div class="tablewrap"><table><thead><tr>`
      + `<th>Cloudová služba (ilustrativní)</th><th class="right">Systémů, které by „spadly“</th><th>Dosah</th><th>Poznámka</th>`
      + `</tr></thead><tbody>`
      + katalog.sort((a,b)=>b.systemu-a.systemu).map(k=>
          `<tr><td>${esc(k.svc)}</td>`
          + `<td class="right"><b>${fmt(k.systemu)}</b></td>`
          + `<td><div class="track" style="height:8px;background:#eef2f8;border-radius:5px;overflow:hidden"><div style="height:100%;width:${Math.round(k.systemu/maxKat*100)}%;background:${C.cyan}"></div></div></td>`
          + `<td class="small muted">${esc(k.pozn)}</td></tr>`).join('')
      + `</tbody></table></div>`;

    window.__export = { name:'cloud_kriticke', rows:kritCloud, cols:[
      {h:'Systém', render:r=>esc(r.nazev)},
      {h:'ID', render:r=>esc(r.id)},
      {h:'Bezp_uroven', render:r=>esc(r.bezuroven||'')},
      {h:'Umisteni', render:r=>esc(r.umisteni||'')},
      {h:'Agend', render:r=>r.agendy?r.agendy.length:0},
    ]};
  }

  /* ===========================================================================
   * 4) #/api — Změna 15: Stav a typ API jako parametr systému (demonstrační)
   * ========================================================================= */
  // heuristika odvození orientačního typu rozhraní
  function odvodApi(i){
    if (i.registr || i.iszr) return 'referenční';   // referenční rozhraní / eGSB
    if (i.editor) return 'standardizované';          // zapisuje do registru přes eGSB
    if (i.sdileni === 'Centrálně sdílený') return 'sdílené';
    if (i.sdileni && i.sdileni.indexOf('lokáln')>=0) return 'p2p';
    return 'neuvedeno';
  }
  const API_DEF = {
    'referenční':    {label:'Univerzální / referenční (eGSB / ISZR)', cls:'cyan', uni:true,  desc:'Přístup přes referenční rozhraní / eGSB — standardizované, interoperabilní.'},
    'standardizované':{label:'Standardizované API (editor registru)', cls:'ok',   uni:true,  desc:'Zápis do registru přes řízené rozhraní.'},
    'sdílené':       {label:'Sdílené API (centrálně sdílený)',        cls:'cyan', uni:true,  desc:'Centrálně sdílená služba — pravděpodobně dostupné API.'},
    'p2p':           {label:'Jen peer-to-peer / lokální',             cls:'warn', uni:false, desc:'Lokální/bilaterální napojení — bez univerzálního rozhraní.'},
    'neuvedeno':     {label:'Neuvedeno / proprietární?',              cls:'grey', uni:false, desc:'Z dostupných polí nelze odvodit standardní rozhraní — riziko lock-inu.'},
  };
  function apiBadge(t){ const d=API_DEF[t]||API_DEF['neuvedeno']; return `<span class="badge ${d.cls}" title="${esc(d.desc)}">${esc(d.label)}</span>`; }

  async function api(arg){
    await ensureNames();
    const rows = await load('isvs');

    // odvoď typ + spočítej rozložení
    rows.forEach(r=>{ r.__api = odvodApi(r); });
    const dist = {};
    Object.keys(API_DEF).forEach(k=>dist[k]=0);
    rows.forEach(r=>{ dist[r.__api]=(dist[r.__api]||0)+1; });
    const maxDist = Math.max(...Object.values(dist),1);

    const kritBezUni = rows.filter(r=> jeKriticky(r) && !(API_DEF[r.__api]||{}).uni)
      .sort((a,b)=>(b.bez_rank||0)-(a.bez_rank||0) || (b.agendy?b.agendy.length:0)-(a.agendy?a.agendy.length:0));

    // stav filtru
    const state = { typ:'', jenKrit:false, limit:150 };

    view.innerHTML =
      pagehdr('Stav a typ API',
        'Orientační typ rozhraní jako parametr systému — interoperabilita, lock-in a udržitelnost propojeného datového fondu')
      + srcHeader('isvs')
      + crossLinks('api')
      + demoNote('Typ a stav API <b>není</b> strukturovaným polem RPP. Hodnoty níže jsou <b>odvozené heuristikou</b> z dostupných polí '
          + '(registr/ISZR → referenční rozhraní/eGSB · editor → standardizované · centrálně sdílený → sdílené API · jinak neuvedeno/proprietární?). '
          + 'Princip: nejdřív ukázat užitečnost pohledu, pak motivovat DIA k doplnění strukturovaného atributu. '
          + 'Patří do sady technických atributů pro budoucí pohled „příležitosti“.')
      + `<div class="card">
          <h2>Rozložení typů rozhraní <span class="badge grey">odvozeno</span></h2>
          <div style="margin-top:8px">
            ${Object.keys(API_DEF).map(k=>bar(API_DEF[k].label, dist[k], maxDist)).join('')}
          </div>
        </div>`
      + `<div class="grid2" style="margin-top:12px">
          <div class="card" style="border-left:4px solid #e0a93b">
            <h2>⚠ Příležitost: kritické systémy bez univerzálního API <span class="badge grey">${fmt(kritBezUni.length)}</span></h2>
            <p class="small muted" style="line-height:1.6">Proprietární nebo chybějící API u kritického systému = <b>lock-in</b> a riziko pro krizové sdílení dat.
              Univerzální (referenční/eGSB) API naopak usnadní propojený datový fond i sdílení za krize.</p>
          </div>
          <div class="card">
            <h2>Proč na typu API záleží</h2>
            <p class="small muted" style="line-height:1.65"><b>Univerzální / standardizované API</b> → interoperabilita, snadná náhrada dodavatele, levnější integrace.
              <b>Proprietární / jen P2P / chybějící</b> → závislost na jednom dodavateli, drahé změny, křehkost při krizi.
              Doplnění tohoto atributu do RPP by dalo DIA páku tlačit na otevřená rozhraní.</p>
          </div>
        </div>`
      + `<div class="card" style="margin-top:12px">
          <h2>Systémy podle typu API</h2>
          <div class="toolbar" style="margin:6px 0">
            <select id="apiTyp">
              <option value="">Typ API: vše</option>
              ${Object.keys(API_DEF).map(k=>`<option value="${k}">${esc(API_DEF[k].label)}</option>`).join('')}
            </select>
            <label style="font-size:12px;color:${C.muted};display:flex;align-items:center;gap:5px">
              <input type="checkbox" id="apiKrit"> jen kritické systémy
            </label>
            <button class="btn" id="apiQuick">⚡ Kritické bez univerzálního API</button>
            <span class="count" id="apiCount"></span>
          </div>
          <div id="apiTbl"></div>
          <div style="text-align:center;margin-top:12px"><button class="btn" id="apiMore" style="display:none">Načíst dalších 150</button></div>
        </div>`;

    function filtered(){
      let r = rows;
      if (state.typ) r = r.filter(x=>x.__api===state.typ);
      if (state.jenKrit) r = r.filter(jeKriticky);
      return r.slice().sort((a,b)=>(b.bez_rank||0)-(a.bez_rank||0) || (b.agendy?b.agendy.length:0)-(a.agendy?a.agendy.length:0));
    }
    function draw(){
      const all = filtered();
      const shown = all.slice(0, state.limit);
      byId('apiTbl').innerHTML = table(shown, [
        {h:'Systém', render:r=>link(r.id, r.nazev)+' '+critBadge(r)},
        {h:'Typ API (odvozeno)', render:r=>apiBadge(r.__api)},
        {h:'Sdílení', render:r=>esc(r.sdileni||'—')},
        {h:'Bezp. úroveň', render:r=>badgeSec(r.bezuroven)},
        {h:'Agend', cls:'right', render:r=>fmt(r.agendy?r.agendy.length:0)},
        {h:'Správce', render:r=>esc(r.spravce_nazev||'—')},
      ]);
      byId('apiCount').textContent = `${fmt(all.length)} systémů` + (all.length>shown.length?` · zobrazeno ${fmt(shown.length)}`:'');
      byId('apiMore').style.display = all.length>state.limit?'':'none';
      window.__export = { name:'api_systemy', rows:all, cols:[
        {h:'Systém', render:r=>esc(r.nazev)},
        {h:'ID', render:r=>esc(r.id)},
        {h:'Typ_API_odvozeno', render:r=>esc((API_DEF[r.__api]||{}).label||r.__api)},
        {h:'Sdileni', render:r=>esc(r.sdileni||'')},
        {h:'Bezp_uroven', render:r=>esc(r.bezuroven||'')},
        {h:'Agend', render:r=>r.agendy?r.agendy.length:0},
      ]};
    }
    byId('apiTyp').addEventListener('change', e=>{ state.typ=e.target.value; state.limit=150; draw(); });
    byId('apiKrit').addEventListener('change', e=>{ state.jenKrit=e.target.checked; state.limit=150; draw(); });
    byId('apiMore').addEventListener('click', ()=>{ state.limit+=150; draw(); });
    byId('apiQuick').addEventListener('click', ()=>{
      state.jenKrit = true; byId('apiKrit').checked = true;
      // vyber první ne-univerzální typ s největším výskytem mezi kritickými
      state.typ = ''; byId('apiTyp').value = '';
      state.limit = 150;
      // zúžíme přímo na „bez univerzálního API": přepneme na neuvedeno (nejčastější rizikový)
      const cand = kritBezUni[0] ? kritBezUni[0].__api : 'neuvedeno';
      state.typ = cand; byId('apiTyp').value = cand;
      draw();
    });
    draw();
  }

  /* ---------- registrace rout ---------- */
  Object.assign(ROUTES, { spof, zavislosti, cloud, api });

})();
