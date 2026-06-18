/* =====================================================================
   feat_dashboard.js — rozšíření RPP Exploreru o 4 strategické pohledy
   pro DIA: oblasti digitálního státu, Gartner kvadranty pozice ČR,
   stupeň digitalizace agend a bezpečnostní úroveň jako dimenze.

   Klasický script, načítaný PO app.js (sdílí globální scope).
   Používá globály z app.js: view, byId, esc, fmt, load, ensureNames,
   nameOf, link, table, bar, srcHeader, badgeSec, badgeRegistr, ROUTES.
   ===================================================================== */
(function(){
  'use strict';

  /* ---- společná demonstrační poznámka ---- */
  const DEMO = '<div class="desc">⚙ Demonstrační režim — ilustrativní/odvozeno; v RPP zatím chybí strukturovaná data.</div>';

  /* Pozor: hodnota „Bez cloud computingu“ obsahuje slovo „cloud“ — proto NESMÍME
     testovat jen /cloud/. Skutečné využití cloudu = „Plně/Částečně s využitím cloud“. */
  function isCloud(umisteni){ return !!umisteni && /s využitím cloud/i.test(umisteni); }

  /* ---------------------------------------------------------------
     KONSTANTA OBLASTI — ~8 klíčových oblastí digitálního státu.
     regexy: heuristické přiřazení ISVS dle názvu/rodiny.
     ficury: funkční požadavky (✓/—/?).
     zahranici: zahraniční inspirace.
     pozice + vyspelost: ODBORNÝ ODHAD pro kvadrant (NE výpočet z RPP).
     --------------------------------------------------------------- */
  const OBLASTI = [
    {
      klic:'identita', nazev:'Elektronická identita', ikona:'🪪',
      popis:'Prokazování totožnosti občana online — národní bod (NIA), identitní prostředky, eIDAS 2.0 a evropská peněženka.',
      regexy:[/identi/i,/\bNIA\b/i,/eIDAS/i,/autenti/i,/přihlaš/i,/totožnost/i,/identitn/i],
      ficury:[
        {nazev:'Národní bod identity (NIA)', ma:true},
        {nazev:'Více úrovní záruky (NÍZKÁ/ZNAČNÁ/VYSOKÁ)', ma:true},
        {nazev:'Mobilní eOP / bankovní identita', ma:true},
        {nazev:'Evropská peněženka (EUDI / eIDAS 2.0)', ma:false},
        {nazev:'Plně bezheslové ověření napříč EU', ma:null},
      ],
      pozice:{x:0.62, y:0.70}, vyspelost:'Vyzyvatel — silná realizace, vize dobíhá EU',
      zahranici:[
        {stat:'Estonsko', system:'eID / Smart-ID', poznamka:'Povinná eID karta od r. 2002, ~99 % využití; etalon pokrytí.'},
        {stat:'Dánsko', system:'MitID', poznamka:'Druhá generace národní identity, plně mobilní, vysoká adopce.'},
        {stat:'EU', system:'eIDAS 2.0 / EUDI Wallet', poznamka:'Cíl: 80 % občanů s digitální peněženkou do r. 2030.'},
      ],
    },
    {
      klic:'dorucovani', nazev:'Elektronické doručování', ikona:'📨',
      popis:'Garantovaný kanál pro komunikaci stát ↔ občan/firma — datové schránky (ISDS) a doručování dokumentů.',
      regexy:[/datov[áa]\s*schr/i,/\bISDS\b/i,/schránk/i,/doručov/i],
      ficury:[
        {nazev:'Datové schránky (ISDS)', ma:true},
        {nazev:'Automatické zřízení pro firmy/OSVČ', ma:true},
        {nazev:'Doručení s právními účinky', ma:true},
        {nazev:'Doručování napříč EU (eDelivery)', ma:false},
        {nazev:'Jednotná doručovací identita občana', ma:null},
      ],
      pozice:{x:0.72, y:0.78}, vyspelost:'Lídr — zralý, plošně využívaný systém',
      zahranici:[
        {stat:'Estonsko', system:'eesti.ee / DigiDoc', poznamka:'Garantované doručení provázané s eID.'},
        {stat:'Rakousko', system:'Elektronische Zustellung', poznamka:'Centrální doručovací box napojený na ID Austria.'},
        {stat:'EU', system:'eDelivery (CEF)', poznamka:'Standard pro přeshraniční doručování dokumentů.'},
      ],
    },
    {
      klic:'registry', nazev:'Základní registry', ikona:'⬢',
      popis:'Páteř státu — ROB, ROS, RÚIAN, RPP a registr práv a povinností. Jediný zdroj pravdy o osobách, osobách právnických a územní identifikaci.',
      regexy:[/registr obyvatel/i,/registr osob/i,/RÚIAN/i,/RUIAN/i,/\bROB\b/i,/\bROS\b/i,/\bRPP\b/i,/práv a povinno/i,/základní registr/i,/referenč/i,/územní identifik/i],
      ficury:[
        {nazev:'Čtyři základní registry (ROB/ROS/RÚIAN/RPP)', ma:true},
        {nazev:'Referenční údaje (jediný zdroj pravdy)', ma:true},
        {nazev:'ISZR jako sdílené rozhraní', ma:true},
        {nazev:'Reklamační/notifikační smyčka pro občana', ma:false},
        {nazev:'Plně živé (real-time) napojení všech editorů', ma:null},
      ],
      pozice:{x:0.78, y:0.82}, vyspelost:'Lídr — architektura na světové úrovni',
      zahranici:[
        {stat:'Estonsko', system:'X-Road registry', poznamka:'Distribuované registry propojené sběrnicí X-Road.'},
        {stat:'Dánsko', system:'CPR / CVR', poznamka:'Centrální registr osob a firem, základ celé e-governmentu.'},
        {stat:'Nizozemsko', system:'Basisregistraties', poznamka:'Systém ~10 základních registrů s povinným využíváním.'},
      ],
    },
    {
      klic:'platby', nazev:'Platby a poplatky', ikona:'💳',
      popis:'Jednotné placení správních poplatků, pokut a plateb státu online — platební brána a provázání s agendami.',
      regexy:[/platb/i,/poplat/i,/pokut/i,/platebn/i,/úhrad/i,/inkas/i],
      ficury:[
        {nazev:'Online platba správního poplatku', ma:true},
        {nazev:'Centrální platební brána státu', ma:false},
        {nazev:'Přehled „co dlužím státu“ na jednom místě', ma:false},
        {nazev:'Automatické párování platby s podáním', ma:false},
        {nazev:'Okamžité platby / QR napříč agendami', ma:null},
      ],
      pozice:{x:0.38, y:0.42}, vyspelost:'Specialista — roztříštěno mezi agendy',
      zahranici:[
        {stat:'Estonsko', system:'Pay by e-service', poznamka:'Platba integrovaná přímo do každé e-služby.'},
        {stat:'Rakousko', system:'EPS / oesterreich.gv.at', poznamka:'Jednotná platební vrstva pro úřední úkony.'},
        {stat:'Singapur', system:'PayNow / GovWallet', poznamka:'Okamžité platby stát↔občan na jedné infrastruktuře.'},
      ],
    },
    {
      klic:'sdileni', nazev:'Sdílení dat / propojený datový fond', ikona:'🔗',
      popis:'Princip „obíhají data, ne občan“ — ISSS / eGSB (Egon Service Bus) jako sběrnice pro výměnu údajů mezi úřady.',
      regexy:[/eGSB/i,/\bISSS\b/i,/propojen/i,/sdílen/i,/datov[ýy] fond/i,/service bus/i,/výměn[ay] (dat|údaj)/i,/Egon/i],
      ficury:[
        {nazev:'Egon Service Bus (ISSS/eGSB)', ma:true},
        {nazev:'Propojený datový fond (PPDF)', ma:true},
        {nazev:'Princip „pouze jednou“ (once-only)', ma:false},
        {nazev:'Souhlasový rámec / přehled využití údajů', ma:false},
        {nazev:'Plošné odstranění peer-to-peer výměn', ma:null},
      ],
      pozice:{x:0.48, y:0.55}, vyspelost:'Vyzyvatel — silná vize, realizace nerovnoměrná',
      zahranici:[
        {stat:'Estonsko', system:'X-Road', poznamka:'Sběrnice pro veškerou výměnu dat, žádné centrální úložiště.'},
        {stat:'Finsko', system:'Suomi.fi Data Exchange', poznamka:'X-Road implementovaná na národní úrovni.'},
        {stat:'EU', system:'Single Digital Gateway / OOTS', poznamka:'Once-Only Technical System pro přeshraniční výměnu.'},
      ],
    },
    {
      klic:'spis', nazev:'Spisová služba', ikona:'🗄️',
      popis:'Elektronická správa dokumentů a spisů úřadů — eSSL, jednotný spisový plán a předávání spisů mezi úřady (NSESSS).',
      regexy:[/spisov/i,/\beSSL\b/i,/elektronick[áa] spis/i,/správ[ay] dokument/i,/oběh dokument/i,/podateln/i],
      ficury:[
        {nazev:'Elektronická spisová služba (eSSL)', ma:true},
        {nazev:'Národní standard (NSESSS)', ma:true},
        {nazev:'Předávání spisů mezi úřady', ma:false},
        {nazev:'Jednotný elektronický spis občana', ma:false},
        {nazev:'Plně bezpapírový oběh napříč státem', ma:null},
      ],
      pozice:{x:0.45, y:0.48}, vyspelost:'Specialista — standard ano, interoperabilita slabší',
      zahranici:[
        {stat:'Dánsko', system:'eDoc / cBrain F2', poznamka:'Jednotná platforma správy spisů napříč ministerstvy.'},
        {stat:'Estonsko', system:'DHX / DVK', poznamka:'Protokol pro výměnu dokumentů mezi úřady.'},
        {stat:'Německo', system:'E-Akte', poznamka:'Federální elektronický spis dle zákona o e-governmentu.'},
      ],
    },
    {
      klic:'uzemni', nazev:'Mapové a územní systémy', ikona:'🗺️',
      popis:'Územní identifikace a geodata — RÚIAN, katastr nemovitostí (ČÚZK), geoportály a digitální technická mapa.',
      regexy:[/RÚIAN/i,/RUIAN/i,/katastr/i,/ČÚZK/i,/CUZK/i,/mapov/i,/územn/i,/geoport/i,/geodat/i,/nemovitost/i,/digitální technická mapa/i,/\bDTM\b/i],
      ficury:[
        {nazev:'RÚIAN (registr územní identifikace)', ma:true},
        {nazev:'Katastr nemovitostí online (ČÚZK)', ma:true},
        {nazev:'Otevřená geodata / WMS služby', ma:true},
        {nazev:'Digitální technická mapa (DTM) plošně', ma:false},
        {nazev:'Jednotný národní geoportál', ma:null},
      ],
      pozice:{x:0.66, y:0.72}, vyspelost:'Lídr — geodata patří k nejlepším v EU',
      zahranici:[
        {stat:'Nizozemsko', system:'Kadaster / PDOK', poznamka:'Otevřená geoplatforma, referenční model pro EU.'},
        {stat:'Švýcarsko', system:'geo.admin.ch', poznamka:'Národní geoportál s tisíci datových vrstev.'},
        {stat:'EU', system:'INSPIRE', poznamka:'Směrnice o sdílení prostorových dat členských států.'},
      ],
    },
    {
      klic:'portaly', nazev:'Portály občana', ikona:'🌐',
      popis:'Jednotné rozhraní k veřejné správě — Portál občana, gov.cz a Czech POINT jako vstupní body k e-službám.',
      regexy:[/portál ob/i,/portal ob/i,/gov\.cz/i,/občan/i,/POINT/i,/jednotn[ýy] portál/i,/eGON/i,/životní situ/i],
      ficury:[
        {nazev:'Portál občana / gov.cz', ma:true},
        {nazev:'Czech POINT (asistovaná místa)', ma:true},
        {nazev:'Personalizovaná schránka „moje úřední věci“', ma:true},
        {nazev:'Životní situace napříč úřady (proaktivně)', ma:false},
        {nazev:'Jeden účet pro veškerý kontakt se státem', ma:null},
      ],
      pozice:{x:0.55, y:0.60}, vyspelost:'Vyzyvatel — sjednocování probíhá',
      zahranici:[
        {stat:'Estonsko', system:'eesti.ee', poznamka:'Jeden portál pro ~99 % státních služeb.'},
        {stat:'Rakousko', system:'oesterreich.gv.at + app', poznamka:'Portál i mobilní aplikace s digitálními doklady.'},
        {stat:'Ukrajina', system:'Diia', poznamka:'Mobilní „stát v kapse“, doklady i služby v jedné aplikaci.'},
      ],
    },
  ];

  function oblastByKlic(k){ return OBLASTI.find(o=>o.klic===k); }

  /* spočítá statistiky oblasti nad isvs.json dle regexů */
  function statsOblast(o, isvs){
    const match = isvs.filter(i=>{
      const txt = (i.nazev||'') + ' ' + (i.rodina||'');
      return o.regexy.some(rx=>rx.test(txt));
    });
    const agSet = new Set();
    let cloud=0, crit=0;
    match.forEach(i=>{
      (i.agendy||[]).forEach(a=>agSet.add(a));
      if (isCloud(i.umisteni)) cloud++;
      if (i.bez_rank===4) crit++;
    });
    return { systems:match, pocet:match.length, agend:agSet.size, cloud, crit };
  }

  /* ---------- malý helper: KPI dlaždice (nelinkovaná) ---------- */
  function kpiTiles(items){
    return `<div class="kpis" style="grid-template-columns:repeat(${items.length},1fr)">`+
      items.map(it=>`<div class="kpi"><div class="v">${it.v}</div><div class="l">${esc(it.l)}</div></div>`).join('')+
      `</div>`;
  }

  /* fíčura ✓ / — / ? */
  function ficuraIkona(ma){
    if (ma===true)  return '<span class="badge ok" title="Oblast tuto funkci v zásadě má.">✓ má</span>';
    if (ma===false) return '<span class="badge warn" title="Funkce zatím chybí nebo není plošná — příležitost pro DIA.">— chybí</span>';
    return '<span class="badge grey" title="Cílový stav / nejasné — vyžaduje strategické rozhodnutí.">? cíl</span>';
  }

  /* =====================================================================
     SVG „MAGIC QUADRANT" — sdílený renderer.
     body = oblasti; focusKlic zvýrazní jednu oblast (pro detail).
     osy: x = Vyspělost / úplnost vize, y = Schopnost realizace.
     ===================================================================== */
  function quadrantSVG(body, focusKlic){
    const W=520, H=420, P=46;          // plátno + okraj
    const ix = x => P + x*(W-2*P);
    const iy = y => (H-P) - y*(H-2*P); // 0 dole, 1 nahoře
    const cx = (W)/2, cy = (H)/2;
    const grid = [];
    for (let g=0; g<=10; g++){
      const gx = P + g/10*(W-2*P), gy = P + g/10*(H-2*P);
      grid.push(`<line x1="${gx}" y1="${P}" x2="${gx}" y2="${H-P}" stroke="#eef2f8" stroke-width="1"/>`);
      grid.push(`<line x1="${P}" y1="${gy}" x2="${W-P}" y2="${gy}" stroke="#eef2f8" stroke-width="1"/>`);
    }
    // 4 kvadranty — popisky
    const quadLbl = (x,y,txt,anchor)=>`<text x="${x}" y="${y}" font-size="11" fill="#94a3b8" font-weight="700" text-anchor="${anchor}" style="text-transform:uppercase;letter-spacing:.06em">${esc(txt)}</text>`;
    const dots = body.map(o=>{
      const px=ix(o.pozice.x), py=iy(o.pozice.y);
      const foc = focusKlic && o.klic===focusKlic;
      const r = foc?9:6;
      const fill = foc?'#ff2d8d':'#0a1f44';
      const stroke = foc?'#ff2d8d':'#00d8ff';
      const lblX = px + (o.pozice.x>0.82? -10 : 10);
      const anchor = o.pozice.x>0.82 ? 'end' : 'start';
      return `<g>
        <circle cx="${px}" cy="${py}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="${foc?1:0.92}"/>
        <text x="${lblX}" y="${py+3.5}" font-size="${foc?11.5:10.5}" fill="${foc?'#ff2d8d':'#0a1730'}" font-weight="${foc?'800':'600'}" text-anchor="${anchor}">${esc(o.ikona+' '+o.nazev)}</text>
      </g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;background:#fff;border:1px solid var(--line);border-radius:12px" role="img" aria-label="Magic quadrant pozice ČR">
      ${grid.join('')}
      <line x1="${cx}" y1="${P}" x2="${cx}" y2="${H-P}" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="${P}" y1="${cy}" x2="${W-P}" y2="${cy}" stroke="#cbd5e1" stroke-width="1.5"/>
      ${quadLbl(P+6, P+16, 'Vyzyvatelé', 'start')}
      ${quadLbl(W-P-6, P+16, 'Lídři', 'end')}
      ${quadLbl(P+6, H-P-8, 'Specialisté', 'start')}
      ${quadLbl(W-P-6, H-P-8, 'Vizionáři', 'end')}
      <text x="${cx}" y="${H-12}" font-size="11" fill="#64748b" text-anchor="middle" font-weight="600">Vyspělost / úplnost vize →</text>
      <text x="14" y="${cy}" font-size="11" fill="#64748b" text-anchor="middle" font-weight="600" transform="rotate(-90 14 ${cy})">Schopnost realizace →</text>
      ${dots}
    </svg>`;
  }

  /* =====================================================================
     1) OBLASTI — přehled + detail (mini-dashboard skupin systémů)
     ===================================================================== */
  async function oblasti(arg){
    await ensureNames();
    const isvs = await load('isvs');
    if (arg) return oblastDetail(arg, isvs);

    // PŘEHLED
    const cards = OBLASTI.map(o=>{
      const s = statsOblast(o, isvs);
      return `<a class="card" href="#/oblasti/${encodeURIComponent(o.klic)}" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:10px;transition:.15s">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:30px;line-height:1">${o.ikona}</span>
          <h2 style="margin:0;font-size:16px">${esc(o.nazev)}</h2>
        </div>
        <div class="desc" style="margin:0;min-height:48px">${esc(o.popis)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="chip" title="Počet ISVS přiřazených této oblasti (heuristicky dle názvu).">💻 ${fmt(s.pocet)} systémů</span>
          <span class="chip" title="Počet unikátních agend napojených na systémy oblasti.">📋 ${fmt(s.agend)} agend</span>
          ${s.crit?`<span class="chip" style="background:var(--navy);color:#7ef0ff">⬢ ${s.crit} kritických</span>`:''}
        </div>
        <div style="color:var(--neon-pink);font-weight:700;font-size:13px;margin-top:2px">otevřít →</div>
      </a>`;
    }).join('');

    view.innerHTML = `
      <div class="pagehdr"><div><h1>Oblasti digitálního státu</h1>
        <div class="sub">Mini-dashboardy klíčových skupin systémů — od identity po portály občana</div></div></div>
      ${srcHeader('isvs')}
      <div class="desc">Navigační kostra <b>oblast → systém</b>. Každá oblast sdružuje informační systémy RPP podle účelu a ukazuje, jak je ČR v dané oblasti vybavená — kolik systémů, agend, kolik běží v cloudu a kolik je kritických. Rozpad systémů do oblastí je <b>orientační</b> (heuristika dle názvu a charakteristiky systému).</div>
      <div class="grid2" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${cards}</div>
    `;
  }

  function oblastDetail(klic, isvs){
    const o = oblastByKlic(klic);
    if (!o){ view.innerHTML = '<div class="empty">Oblast nenalezena. <a class="link" href="#/oblasti">Zpět na přehled</a></div>'; return; }
    const s = statsOblast(o, isvs);

    // KPI
    const kpis = kpiTiles([
      {v:fmt(s.pocet),  l:'Systémů v oblasti'},
      {v:fmt(s.agend),  l:'Napojených agend'},
      {v:fmt(s.cloud),  l:'V cloudu'},
      {v:fmt(s.crit),   l:'Kritická úroveň (4)'},
    ]);

    // tabulka systémů (omez na rozumný počet)
    const rows = s.systems.slice().sort((a,b)=>(b.bez_rank||0)-(a.bez_rank||0)).slice(0,80);
    const sysTable = table(rows, [
      {h:'Systém', render:r=>link(r.id, r.nazev) + (r.registr?' '+badgeRegistr():'')},
      {h:'Správce', render:r=>esc(r.spravce_nazev||'')},
      {h:'Bezp. úroveň', render:r=>badgeSec(r.bezuroven)},
      {h:'Umístění', render:r=>{
        const c = isCloud(r.umisteni);
        return `<span class="badge ${c?'warn':'grey'}" title="${esc(r.umisteni||'neuvedeno')}">${c?'☁ cloud':'🖥 bez cloudu'}</span>`;
      }},
    ]);

    // fíčury
    const ficTable = `<div style="display:flex;flex-direction:column;gap:8px">`+
      o.ficury.map(f=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:7px 10px;border:1px solid var(--line);border-radius:9px">
        <span>${esc(f.nazev)}</span>${ficuraIkona(f.ma)}</div>`).join('')+`</div>`;

    // zahraničí
    const zahTable = table(o.zahranici, [
      {h:'Stát', render:r=>`<b>${esc(r.stat)}</b>`},
      {h:'Systém', render:r=>esc(r.system)},
      {h:'Poznámka', render:r=>`<span class="small">${esc(r.poznamka)}</span>`},
    ]);

    view.innerHTML = `
      <div class="crumb"><a href="#/oblasti">Oblasti</a> › ${esc(o.nazev)}</div>
      <div class="pagehdr"><div><h1>${o.ikona} ${esc(o.nazev)}</h1>
        <div class="sub">Mini-dashboard oblasti · pozice ČR · zahraniční inspirace</div></div></div>
      ${srcHeader('isvs')}
      <div class="desc">${esc(o.popis)}</div>
      ${kpis}

      <div class="grid2">
        <div class="card">
          <h2>Systémy v oblasti <span class="small muted">(${fmt(s.pocet)} · zobrazeno ${fmt(rows.length)})</span></h2>
          <div class="desc">Přiřazení systémů do oblasti je <b>orientační</b> — odvozeno heuristicky z názvu a charakteristiky systému, nikoli z formálního číselníku RPP.</div>
          ${s.pocet?sysTable:'<div class="empty">Pro tuto oblast se nepodařilo heuristicky přiřadit žádný systém.</div>'}
        </div>
        <div class="card">
          <h2>Fíčury (funkční požadavky)</h2>
          <div class="desc">Co oblast má (✓), co chybí (—) nebo je teprve cílem (?). Odborný odhad, ne výpočet z RPP.</div>
          ${ficTable}
        </div>
      </div>

      <div class="card">
        <h2>Pozice ČR <span class="small muted">— magic quadrant</span></h2>
        ${DEMO}
        <div class="grid2" style="align-items:center">
          <div>${quadrantSVG(OBLASTI, o.klic)}</div>
          <div>
            <div class="kv"><span>Oblast</span><b>${esc(o.nazev)}</b></div>
            <div class="kv"><span>Vyspělost (odhad)</span><b>${esc(o.vyspelost)}</b></div>
            <div class="kv"><span>Vize / úplnost (x)</span><b>${Math.round(o.pozice.x*100)} %</b></div>
            <div class="kv"><span>Realizace (y)</span><b>${Math.round(o.pozice.y*100)} %</b></div>
            <div class="desc" style="margin-top:10px">Růžový bod = tato oblast. Souřadnice jsou <b>odborný odhad</b> pracovní skupiny, nikoli výpočet z dat RPP. Plnou svodku všech oblastí najdete v sekci <a class="link" href="#/kvadranty">Kvadranty</a>.</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Zahraniční inspirace</h2>
        <div class="desc">Kam se posunout — referenční systémy ze států, které danou oblast řeší vyspěleji.</div>
        ${zahTable}
      </div>

      <div class="desc">Souvisí: <a class="link" href="#/digitalizace">stupeň digitalizace agend</a> · <a class="link" href="#/bezpecnost">bezpečnostní úroveň systémů</a>.</div>
    `;
  }

  /* =====================================================================
     2) KVADRANTY — svodka pozice ČR (Gartner magic quadrant)
     ===================================================================== */
  async function kvadranty(){
    await ensureNames();
    const isvs = await load('isvs');

    const svodka = table(OBLASTI.slice().sort((a,b)=>(b.pozice.x+b.pozice.y)-(a.pozice.x+a.pozice.y)), [
      {h:'Oblast', render:o=>`<a class="link" href="#/oblasti/${encodeURIComponent(o.klic)}">${esc(o.ikona+' '+o.nazev)}</a>`},
      {h:'Pozice (odhad)', render:o=>esc(o.vyspelost)},
      {h:'Srovnání se zahraničím', render:o=>`<span class="small">${esc((o.zahranici[0]?o.zahranici[0].stat+': '+o.zahranici[0].system:'')+(o.zahranici[1]?' · '+o.zahranici[1].stat:''))}</span>`},
      {h:'Kam se posunout', render:o=>{
        const chyb = o.ficury.filter(f=>f.ma===false).map(f=>f.nazev);
        return chyb.length?`<span class="small">${esc(chyb[0])}${chyb.length>1?' (+'+(chyb.length-1)+')':''}</span>`:'<span class="muted small">drobné dolaďování</span>';
      }},
    ]);

    view.innerHTML = `
      <div class="pagehdr"><div><h1>Kvadranty — pozice ČR</h1>
        <div class="sub">Svodka vyspělosti oblastí digitálního státu (styl „magic quadrant“)</div></div></div>
      ${DEMO}
      <div class="card">
        <h2>Magic quadrant digitálního státu ČR</h2>
        <div class="desc"><b>Odborný odhad</b> pracovní skupiny — <b>NE</b> výpočet z dat RPP. Osa <b>x</b> = vyspělost a úplnost vize, osa <b>y</b> = schopnost realizace. Pravý horní kvadrant = „Lídři“ (silná vize i realizace).</div>
        <div class="grid2" style="align-items:start">
          <div>${quadrantSVG(OBLASTI, null)}</div>
          <div>
            <h2 style="font-size:15px;margin-top:0">Jak číst kvadranty</h2>
            <div class="desc" style="line-height:1.7">
              <b>Lídři</b> (vpravo nahoře) — zralé systémy plošně využívané (registry, doručování, geodata).<br>
              <b>Vyzyvatelé</b> (vlevo nahoře) — dobrá realizace, vize ještě dobíhá EU.<br>
              <b>Vizionáři</b> (vpravo dole) — jasná vize, realizace zaostává.<br>
              <b>Specialisté</b> (vlevo dole) — roztříštěné nebo úzce zaměřené (platby, spis).
            </div>
            <div class="desc">Tentýž graf zaměřený na jednu oblast najdete v jejím detailu jako kartu „Pozice ČR“.</div>
          </div>
        </div>
      </div>
      <div class="card">
        <h2>Svodka oblastí</h2>
        <div class="desc">Seřazeno dle celkové vyspělosti (x+y). „Kam se posunout“ = nejbližší chybějící fíčura oblasti.</div>
        ${svodka}
      </div>
      <div class="desc">Příležitost pro DIA: posunout „Specialisty“ a „Vizionáře“ (platby, spis, sdílení dat) doprava nahoru — k lídrům. Detaily v sekci <a class="link" href="#/oblasti">Oblasti</a>.</div>
    `;
    // potlač lint: isvs je k dispozici pro budoucí provázání
    void isvs;
  }

  /* =====================================================================
     3) DIGITALIZACE — stupeň digitalizace agend (vstup + ISSS)
     stavy: A bez vstupu · B vstup bez ISSS · C plně napojeno
     ===================================================================== */
  async function digitalizace(){
    await ensureNames();
    const agendy = await load('agendy');
    const isvs = await load('isvs');

    // index ISVS dle id (pro test napojení na ISSS / eGSB)
    const isvsById = {};
    isvs.forEach(i=>{ isvsById[i.id] = i; });

    function maVstup(a){
      // ≥1 služba iniciovaná klientem ≈ agenda má vstup/formulář.
      // proxy: agenda má vůbec nějaké služby (c.sluzby) NEBO sluzby_ids.
      return (a.c && a.c.sluzby>0) || (a.sluzby_ids && a.sluzby_ids.length>0);
    }
    function maISSS(a){
      // napojení na ISSS/eGSB ≈ má systém centrálně sdílený, nebo registr/iszr.
      const ids = a.isvs || [];
      return ids.some(id=>{
        const i = isvsById[id]; if (!i) return false;
        return (i.sdileni && /centrálně sdílen/i.test(i.sdileni)) || i.registr || i.iszr || (i.sdileni && /sdílený mezi/i.test(i.sdileni));
      });
    }
    function stav(a){
      if (!maVstup(a)) return 'A';
      if (!maISSS(a))  return 'B';
      return 'C';
    }

    const enr = agendy.map(a=>({ a, st:stav(a), min:nameOf(a.ohlasovatel) }));
    const cA = enr.filter(x=>x.st==='A').length;
    const cB = enr.filter(x=>x.st==='B').length;
    const cC = enr.filter(x=>x.st==='C').length;
    const total = enr.length;
    const pctC = total?Math.round(cC/total*100):0;
    const maxStav = Math.max(cA,cB,cC,1);

    // donut (SVG) rozložení A/B/C
    const donut = (()=>{
      const data = [
        {l:'C — plně napojeno', v:cC, col:'#22c55e'},
        {l:'B — vstup bez ISSS', v:cB, col:'#f59e0b'},
        {l:'A — bez vstupu', v:cA, col:'#94a3b8'},
      ];
      const R=70, r=44, cx=90, cy=90; let acc=0; const C=2*Math.PI*((R+r)/2); const sw=R-r;
      const segs = data.map(d=>{
        const frac = total?d.v/total:0; const len=frac*C; const off=acc*C; acc+=frac;
        return `<circle cx="${cx}" cy="${cy}" r="${(R+r)/2}" fill="none" stroke="${d.col}" stroke-width="${sw}" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;
      }).join('');
      const legend = data.map(d=>`<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="width:12px;height:12px;border-radius:3px;background:${d.col};display:inline-block"></span><span class="small">${esc(d.l)} — <b>${fmt(d.v)}</b> (${total?Math.round(d.v/total*100):0} %)</span></div>`).join('');
      return `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        <svg viewBox="0 0 180 180" width="180" height="180">${segs}
          <text x="90" y="84" text-anchor="middle" font-size="26" font-weight="800" fill="#0a1730">${pctC} %</text>
          <text x="90" y="104" text-anchor="middle" font-size="11" fill="#64748b">plně digit.</text>
        </svg>
        <div>${legend}</div>
      </div>`;
    })();

    const badgeStav = st => st==='C'
      ? '<span class="badge ok" title="Plně digitalizováno — vstup/formulář i napojení na centrální sdílení (ISSS/eGSB).">C — plně</span>'
      : st==='B'
      ? '<span class="badge warn" title="Má vstup/formulář, ale chybí napojení na ISSS/eGSB (centrální sdílení).">B — vstup bez ISSS</span>'
      : '<span class="badge grey" title="Bez digitalizovaného vstupu (agenda nemá služby iniciované klientem).">A — bez vstupu</span>';

    view.innerHTML = `
      <div class="pagehdr"><div><h1>Stupeň digitalizace agend</h1>
        <div class="sub">Vstup (formulář) + napojení na propojený datový fond (ISSS / eGSB)</div></div></div>
      ${srcHeader('agendy + isvs')}
      ${DEMO}
      <div class="desc"><b>Heuristika (orientační):</b> „má vstup“ ≈ agenda má alespoň jednu službu (typicky iniciovanou klientem). „Napojeno na ISSS“ ≈ agenda využívá systém s centrálním sdílením, nebo základní registr / sdílenou infrastrukturu ISZR (proxy pro Egon Service Bus). Toto je <b>páteřní metrika pro DIA</b> — kolik agend stát skutečně dotáhl „od papíru k propojeným datům“.</div>

      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi"><div class="v">${fmt(cA)}</div><div class="l">A — bez vstupu</div></div>
        <div class="kpi"><div class="v">${fmt(cB)}</div><div class="l">B — vstup bez ISSS</div></div>
        <div class="kpi"><div class="v">${fmt(cC)}</div><div class="l">C — plně napojeno</div></div>
        <div class="kpi"><div class="v">${pctC} %</div><div class="l">Plně digitalizováno</div></div>
      </div>

      <div class="grid2">
        <div class="card"><h2>Rozložení stavů</h2>${donut}</div>
        <div class="card"><h2>Žebříček (počet agend)</h2>
          ${bar('C — plně napojeno', cC, maxStav, 'ok')}
          ${bar('B — vstup bez ISSS', cB, maxStav, 'warn')}
          ${bar('A — bez vstupu', cA, maxStav, '')}
        </div>
      </div>

      <div class="card">
        <h2>Odchylky / poznámky</h2>
        <div class="desc" style="line-height:1.7">
          <b>Peer-to-peer místo ISSS:</b> některé agendy (typicky <b>ČÚZK / katastr</b>) si data vyměňují přímými vazbami mimo Egon Service Bus — heuristika je pak může podhodnotit (stav B), přestože fakticky digitalizované jsou.<br>
          <b>Více systémů na jednu agendu:</b> rozsáhlé agendy (typicky <b>sociální oblast / MPSV</b>) mají desítky napojených ISVS; napojení na ISSS u jednoho z nich stačí ke stavu C, ale neříká nic o zbytku.<br>
          <b>Závěr:</b> jde o <b>orientační</b> ukazatel směru, ne o auditní hodnotu. Skutečný stav je nutné ověřit per agendu.
        </div>
      </div>

      <div class="card">
        <h2>Agendy podle stupně digitalizace</h2>
        <div id="digtbl"></div>
      </div>
    `;

    // filtrovatelná tabulka (vlastní, lehká — listPage funguje jen přes view.appendChild)
    const cols = [
      {h:'Agenda', render:r=>link(r.a.id, r.a.kod+' — '+r.a.nazev)},
      {h:'Ministerstvo', render:r=>esc(r.min)},
      {h:'Služeb', cls:'right', render:r=>fmt((r.a.c&&r.a.c.sluzby)||0)},
      {h:'Systémů', cls:'right', render:r=>fmt((r.a.c&&r.a.c.isvs)||0)},
      {h:'Stupeň', render:r=>badgeStav(r.st)},
    ];
    const host = byId('digtbl');
    const state = { q:'', st:'', limit:120 };
    host.innerHTML = `<div class="toolbar">
        <input class="grow" id="dq" placeholder="Filtrovat podle názvu / kódu / ministerstva…">
        <select id="dfs"><option value="">Stupeň: vše</option><option value="A">A — bez vstupu</option><option value="B">B — vstup bez ISSS</option><option value="C">C — plně napojeno</option></select>
        <span class="count" id="dc"></span>
      </div><div id="dgrid"></div>
      <div style="text-align:center;margin-top:12px"><button class="btn" id="dmore" style="display:none">Načíst dalších 120</button></div>`;
    function filt(){
      let rows = enr;
      const q = state.q.trim().toLowerCase();
      if (q) rows = rows.filter(r=>((r.a.kod+' '+r.a.nazev+' '+r.min).toLowerCase().includes(q)));
      if (state.st) rows = rows.filter(r=>r.st===state.st);
      return rows;
    }
    function draw(){
      const rows = filt(); const shown = rows.slice(0, state.limit);
      byId('dgrid').innerHTML = table(shown, cols);
      byId('dc').textContent = `${fmt(rows.length)} agend`+(rows.length>shown.length?` · zobrazeno ${fmt(shown.length)}`:'');
      byId('dmore').style.display = rows.length>state.limit?'':'none';
    }
    byId('dq').addEventListener('input', e=>{ state.q=e.target.value; state.limit=120; draw(); });
    byId('dfs').addEventListener('change', e=>{ state.st=e.target.value; state.limit=120; draw(); });
    byId('dmore').addEventListener('click', ()=>{ state.limit+=120; draw(); });
    draw();
  }

  /* =====================================================================
     4) BEZPECNOST — bezpečnostní úroveň jako plnohodnotná dimenze
     ===================================================================== */
  async function bezpecnost(){
    await ensureNames();
    const isvs = await load('isvs');
    const m = await load('meta');

    const total = isvs.length;
    const sec = m.isvs_bezuroven || {};
    const neuv = sec['Neuvedeno'] || isvs.filter(i=>!i.bez_rank).length;
    const pctMissing = total?Math.round(neuv/total*100):0;
    const order = ['1. Nízká','2. Střední','3. Vysoká','4. Kritická'];
    const maxSec = Math.max(...order.map(k=>sec[k]||0), neuv, 1);

    // ČERVENÝ ALARM: kritické (registr nebo bez_rank>=3) ZÁROVEŇ v cloudu
    const alarm = isvs.filter(i=>{
      const krit = i.registr || (i.bez_rank>=3);
      return krit && isCloud(i.umisteni);
    }).sort((a,b)=>(b.bez_rank||0)-(a.bez_rank||0));

    const alarmTable = table(alarm.slice(0,60), [
      {h:'Systém', render:r=>link(r.id, r.nazev) + (r.registr?' '+badgeRegistr():'')},
      {h:'Správce', render:r=>esc(r.spravce_nazev||'')},
      {h:'Bezp. úroveň', render:r=>badgeSec(r.bezuroven)},
      {h:'Umístění', render:r=>`<span class="badge bad" title="${esc(r.umisteni||'')}">☁ ${esc(r.umisteni||'cloud')}</span>`},
    ]);

    view.innerHTML = `
      <div class="pagehdr"><div><h1>Bezpečnostní úroveň systémů</h1>
        <div class="sub">Úroveň dopadu (1–4) jako plnohodnotná dimenze, ne „dobré/špatné“</div></div></div>
      ${srcHeader('isvs')}
      <div class="desc"><b>Pozor na výklad:</b> bezpečnostní úroveň 4 = <b>nejvyšší DOPAD</b> (kritičnost systému), <b>NE</b> „nejhůře zabezpečeno“. Úroveň stanovuje správce podle dopadů; vyšší číslo = přísnější požadavky. <b>Úroveň 4 nesmí do veřejného cloudu</b> (jen Státní tiskárna cenin).</div>

      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi"><div class="v">${fmt(total)}</div><div class="l">Systémů celkem</div></div>
        <div class="kpi"><div class="v">${fmt(sec['4. Kritická']||0)}</div><div class="l">Kritická (úroveň 4)</div></div>
        <div class="kpi"><div class="v">${pctMissing} %</div><div class="l">Úroveň neuvedena</div></div>
        <div class="kpi"><div class="v">${fmt(alarm.length)}</div><div class="l">Kritické v cloudu ⚠</div></div>
      </div>

      <div class="grid2">
        <div class="card"><h2>Rozložení bezpečnostních úrovní</h2>
          <div class="desc">Škála dopadu 1 → 4. Neutrální gradient (ne zeleno-červená) — úroveň není „známka“.</div>
          ${order.map(k=>`<div style="display:flex;align-items:center;gap:10px;margin:6px 0">${badgeSec(k)}${bar(k.replace(/^\d\.\s*/,''), sec[k]||0, maxSec, k==='4. Kritická'?'bad':'')}</div>`).join('')}
          <div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span class="badge grey">neuvedeno</span>${bar('Neuvedeno', neuv, maxSec, 'warn')}</div>
        </div>
        <div class="card"><h2>Mezera v datech = příležitost pro DIA</h2>
          ${DEMO}
          <div class="desc" style="line-height:1.7">U <b>${pctMissing} %</b> systémů (${fmt(neuv)}) chybí v RPP bezpečnostní úroveň. Bez ní nelze řídit riziko ani plánovat migraci do cloudu. <b>Doplnit úroveň u kritické infrastruktury je rychlá výhra pro DIA</b> — zlepší přehled o dopadech jediným polem na systém.</div>
          <div class="desc">Provázanost: <a class="link" href="#/kriticnost">formulář kritérií kritičnosti</a> · <a class="link" href="#/zavislosti">mapa závislostí</a> · <a class="link" href="#/oblasti">oblasti digitálního státu</a>.</div>
        </div>
      </div>

      <div class="card" style="border-color:#ef4444">
        <h2 style="color:#b91c1c">⚠ Červený alarm — kritická infrastruktura v cloudu</h2>
        <div class="desc">Systémy, které jsou <b>zároveň</b> kritické (základní registr nebo úroveň dopadu ≥ 3) <b>a</b> umístěné (zčásti) v cloudu. Úroveň 4 do veřejného cloudu <b>nepatří</b> — jen do Státní tiskárny cenin. Tento seznam je vstup pro prioritizaci kontroly a případné migrace.</div>
        ${alarm.length?alarmTable:'<div class="empty">Žádný kritický systém v cloudu — dobrá zpráva.</div>'}
        ${alarm.length>60?`<div class="desc">Zobrazeno prvních 60 z ${fmt(alarm.length)}.</div>`:''}
      </div>

      <div class="card"><h2>Systémy podle bezpečnostní úrovně</h2><div id="sectbl"></div></div>
    `;

    // filtrovatelná tabulka systémů dle úrovně
    const cols = [
      {h:'Systém', render:r=>link(r.id, r.nazev) + (r.registr?' '+badgeRegistr():'')},
      {h:'Správce', render:r=>esc(r.spravce_nazev||'')},
      {h:'Bezp. úroveň', render:r=>badgeSec(r.bezuroven)},
      {h:'Umístění', render:r=>{const c=isCloud(r.umisteni);return `<span class="badge ${c?'warn':'grey'}">${c?'☁ cloud':'🖥 bez'}</span>`;}},
      {h:'Etapa', render:r=>esc(r.etapa||'')},
    ];
    const host = byId('sectbl');
    const state = { q:'', lvl:'', limit:120 };
    host.innerHTML = `<div class="toolbar">
        <input class="grow" id="sq" placeholder="Filtrovat podle názvu / správce…">
        <select id="slvl"><option value="">Úroveň: vše</option>
          <option value="1">1 — Nízká</option><option value="2">2 — Střední</option>
          <option value="3">3 — Vysoká</option><option value="4">4 — Kritická</option>
          <option value="0">neuvedeno</option></select>
        <span class="count" id="sc"></span>
      </div><div id="sgrid"></div>
      <div style="text-align:center;margin-top:12px"><button class="btn" id="smore" style="display:none">Načíst dalších 120</button></div>`;
    function filt(){
      let rows = isvs;
      const q = state.q.trim().toLowerCase();
      if (q) rows = rows.filter(r=>((r.nazev||'')+' '+(r.spravce_nazev||'')).toLowerCase().includes(q));
      if (state.lvl!=='') rows = rows.filter(r=>String(r.bez_rank||0)===state.lvl);
      return rows;
    }
    function draw(){
      const rows = filt(); const shown = rows.slice(0, state.limit);
      byId('sgrid').innerHTML = table(shown, cols);
      byId('sc').textContent = `${fmt(rows.length)} systémů`+(rows.length>shown.length?` · zobrazeno ${fmt(shown.length)}`:'');
      byId('smore').style.display = rows.length>state.limit?'':'none';
    }
    byId('sq').addEventListener('input', e=>{ state.q=e.target.value; state.limit=120; draw(); });
    byId('slvl').addEventListener('change', e=>{ state.lvl=e.target.value; state.limit=120; draw(); });
    byId('smore').addEventListener('click', ()=>{ state.limit+=120; draw(); });
    draw();
  }

  /* ---------- registrace rout ---------- */
  Object.assign(ROUTES, { oblasti, kvadranty, digitalizace, bezpecnost });
})();
