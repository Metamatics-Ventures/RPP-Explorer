/* RPP Explorer — feat_zdroje.js
   Samostatný feature modul. Načítá se PO app.js, sdílí global scope (view, esc, fmt,
   load, ensureNames, nameOf, link, table, bar, srcHeader, badgeSec, badgeRegistr, ROUTES …).
   Přidává 4 obrazovky:
     #/esbirka      — Změna 10: napojení na e-Sbírku jako druhý datový zdroj + křížová validace
     #/dokumentace  — Změna 16: rámec pro agentní vytěžování DSP (bezpečnostní „krabička")
     #/prilezitosti — Změna 19: semafor mezer „kde můžeme být lepší" napříč dimenzemi
     #/zeptejse     — Změna 20: ad-hoc dotazování nad daty v přirozeném jazyce (heuristika)
   Žádná reálná citlivá data — jen veřejná open data RPP + rámce/pravidla.
*/
(function(){
  'use strict';

  /* ---------- sdílené drobné pomůcky (lokální, ať nekolidují) ---------- */
  var ELI = 'https://www.e-sbirka.cz/eli';
  function pct(part, whole){ return whole ? Math.round(part/whole*100) : 0; }
  function eliHref(eli){ return ELI + String(eli||'').replace(/^\/eli/, ''); }
  /* demonstrační odznak — VŽDY zřetelně označí, že jde o koncept/ilustraci, ne o reálné pole RPP */
  function demoBadge(t){
    return '<span class="badge warn" title="'+esc(t||'Demonstrační / koncepční pohled — ne reálná data RPP. Ukazuje, jak by nástroj fungoval, kdyby data existovala.')+'">⚗ demonstrace</span>';
  }
  function secNote(){
    return '<div class="desc small" style="margin-top:10px;border-left:3px solid var(--neon-cyan);padding:8px 12px;background:#f1f7fb;border-radius:0 8px 8px 0">'
      + '🔒 <b>Bezpečnost:</b> tento nástroj pracuje výhradně nad <b>veřejnými otevřenými daty RPP</b>. '
      + 'Žádná citlivá data (zejm. dokumentace skutečného provedení — DSP) se sem nenahrávají ani neposílají do veřejného LLM.'
      + '</div>';
  }
  /* tříbarevný semafor indikátor */
  var SEM = {
    ok:   'background:#dff3e6;color:#1c7c43;border-color:#bfe6cd',
    warn: 'background:#fdf0d5;color:#9a6b00;border-color:#f3dfa8',
    bad:  'background:#fbe0e0;color:#a32626;border-color:#f0c2c2',
    grey: 'background:#eef1f6;color:#64748b;border-color:#dfe5ee'
  };
  function dot(state, label, tip){
    return '<span class="badge" style="'+SEM[state]+'" title="'+esc(tip||'')+'">'+esc(label)+'</span>';
  }

  /* ================================================================== */
  /* 1) #/esbirka — e-Sbírka jako druhý datový zdroj + křížová validace */
  /* ================================================================== */
  async function esbirka(){
    await ensureNames();
    var agendy = await load('agendy');

    // metrika pokrytí § (eli) na úrovni agend a činností
    var rows = agendy.map(function(a){
      var cs = a.cinnosti || [];
      var withEli = cs.filter(function(c){ return c.eli; }).length;
      var withPar = cs.filter(function(c){ return c.par; }).length;
      return {
        id: a.id, kod: a.kod, nazev: a.nazev, registr: a.registr,
        ohlasovatel: a.ohlasovatel,
        cin: cs.length, withEli: withEli, withPar: withPar,
        cov: cs.length ? withEli/cs.length : 0,
        firstEli: (cs.find(function(c){ return c.eli; })||{}).eli || null
      };
    });

    var totAg = rows.length;
    var totCin = rows.reduce(function(s,r){ return s+r.cin; }, 0);
    var totEli = rows.reduce(function(s,r){ return s+r.withEli; }, 0);
    var agWithEli = rows.filter(function(r){ return r.withEli>0; }).length;
    var agNoEli = rows.filter(function(r){ return r.cin>0 && r.withEli===0; });
    var agNoCin = rows.filter(function(r){ return r.cin===0; });

    // pilotní úzká množina (dle zadání: začít pilotně) — agendy základních registrů + pár s nesouladem
    var pilot = rows.filter(function(r){ return r.registr; }).slice(0, 6);

    // „nesoulady k prověření" — demonstrační kandidáti
    var kandidati = agNoEli
      .sort(function(x,y){ return y.cin - x.cin; })
      .slice(0, 12);

    view.innerHTML =
      '<div class="pagehdr"><div><h1>Napojení na e-Sbírku zákonů</h1>'
      + '<div class="sub">Změna 10 · druhý datový zdroj · křížová validace RPP proti právnímu základu</div></div></div>'
      + srcHeader('RPP — agendy + činnosti (pole §/eli)')

      + '<div class="card"><div class="desc">'
      + 'RPP se u každé činnosti odkazuje na konkrétní ustanovení zákona (paragraf <span class="mono">§</span> + odkaz '
      + '<span class="mono">eli</span> do <a class="link" href="https://www.e-sbirka.cz/" target="_blank" rel="noopener">e-Sbírky</a>). '
      + 'Tím vzniká <b>druhý datový zdroj</b>: vedle „co RPP tvrdí" lze sáhnout na „co říká zákon". '
      + 'Nástroj se tak posouvá od pouhého <i>zobrazování</i> RPP k jeho <b>validaci proti právnímu základu</b> — '
      + 'práce, kterou DIA ručně u stovek agend nezvládne.'
      + '</div>'
      + '<div class="kpis" style="margin-top:12px">'
        + '<div class="kpi"><div class="v">'+fmt(agWithEli)+' / '+fmt(totAg)+'</div><div class="l">agend má vazbu na §</div></div>'
        + '<div class="kpi"><div class="v">'+pct(agWithEli,totAg)+' %</div><div class="l">pokrytí agend</div></div>'
        + '<div class="kpi"><div class="v">'+fmt(totEli)+' / '+fmt(totCin)+'</div><div class="l">činností s odkazem na §</div></div>'
        + '<div class="kpi"><div class="v">'+pct(totEli,totCin)+' %</div><div class="l">pokrytí činností</div></div>'
        + '<div class="kpi"><div class="v" style="color:#a32626">'+fmt(agNoEli.length)+'</div><div class="l">agend bez jediné vazby na § (mezera)</div></div>'
      + '</div></div>'

      // pilotní množina
      + '<div class="card"><h2>Pilotní množina — základní registry '+demoBadge('Úzká startovní množina pro pilotní křížovou validaci.')+'</h2>'
      + '<div class="desc">Dle doporučení začínáme <b>pilotně na úzké množině</b> nejdůležitějších agend (základní registry), '
      + 'kde má kontrola proti zákonu největší hodnotu. U každé je vidět pokrytí § a přímý prokliky do e-Sbírky.</div>'
      + table(pilot.length ? pilot : rows.slice(0,6), covCols())
      + '</div>'

      // koncept křížové validace
      + '<div class="card"><h2>Koncept křížové validace RPP × e-Sbírka '+demoBadge()+'</h2>'
      + '<div class="desc">Až bude napojení živé, lze automaticky porovnávat tři roviny RPP proti zákonné úpravě a hlásit nesoulady:</div>'
      + '<div class="grid2" style="margin-top:8px">'
        + valBox('📦 Rozsah dat', 'RPP eviduje, jaké údaje agenda zpracovává. Zákon (§) vymezuje, jaké údaje <i>smí</i>. '
            + 'Nesoulad → údaj zpracovávaný nad rámec zmocnění, nebo naopak zmocnění bez evidence v RPP.')
        + valBox('🔑 Rozsah oprávnění', 'Toky/oprávnění v RPP (kdo čte/zapisuje) vs. zákonné zmocnění k přístupu. '
            + 'Nesoulad → přístup k registru bez opory v §, nebo zmocnění, které se v RPP nepromítlo.')
        + valBox('📢 Rozsah publikace', 'Co je deklarováno jako zveřejňované/poskytované vs. publikační povinnost daná zákonem. '
            + 'Nesoulad → chybějící publikace tam, kde ji zákon ukládá.')
        + valBox('🧭 Vazba na §', 'Každá činnost by měla mít oporu v konkrétním ustanovení. '
            + 'Činnost/agenda bez vazby na § je kandidát k doplnění (viz tabulka níže).')
      + '</div></div>'

      // nesoulady k prověření
      + '<div class="card"><h2>Ilustrativní „nesoulady k prověření" '+demoBadge('Kandidáti odvození z chybějící vazby na § — k ručnímu ověření, ne automatický verdikt.')+'</h2>'
      + '<div class="desc">Agendy, jejichž činnosti <b>nemají v RPP žádnou vazbu na konkrétní §</b> — typický kandidát k doplnění '
      + 'právního základu (nebo k ověření, zda chybí v RPP, či v e-Sbírce). Řazeno dle počtu „osiřelých" činností.</div>'
      + (kandidati.length
          ? table(kandidati, [
              {h:'Agenda', render:function(r){ return link(r.id, r.kod+' — '+r.nazev) + (r.registr?' '+badgeRegistr():''); }},
              {h:'Ohlašovatel', render:function(r){ return '<span class="muted small">'+esc(nameOf(r.ohlasovatel))+'</span>'; }},
              {h:'Činností', cls:'right', render:function(r){ return fmt(r.cin); }},
              {h:'S vazbou na §', cls:'right', render:function(r){ return dot('bad','0 / '+r.cin, 'Žádná činnost agendy nemá v RPP vyplněný odkaz na § (eli).'); }},
              {h:'Status', render:function(){ return '<span class="chip">kandidát k doplnění §</span>'; }}
            ])
          : '<div class="empty">Všechny agendy s činnostmi mají alespoň jednu vazbu na §.</div>')
      + (agNoCin.length ? '<div class="desc small" style="margin-top:8px">Pozn.: dalších <b>'+fmt(agNoCin.length)+'</b> agend nemá v RPP evidované žádné činnosti — mimo rozsah této kontroly.</div>' : '')
      + '</div>'

      // limit + bezpečnost
      + '<div class="card"><h2>Limit metody (B. Urbanec)</h2>'
      + '<div class="desc">Křížová validace zachytí jen vazby <b>přímo evidované</b> v RPP. '
      + 'Zákonnou úpravu, která se v RPP nepromítla vůbec (žádný §, žádná činnost), tímto způsobem '
      + '<b>nezachytíme</b> — nelze validovat to, co v datech není. Proto je výstupem „kandidát k prověření", '
      + 'ne automatický verdikt; a proto dává smysl začít pilotně tam, kde je datový základ nejúplnější.</div>'
      + secNote()
      + '</div>';

    window.__export = { name:'esbirka_pokryti_paragrafu', rows: rows, cols: covCols() };

    function covCols(){
      return [
        {h:'Agenda', render:function(r){ return link(r.id, r.kod+' — '+r.nazev) + (r.registr?' '+badgeRegistr():''); }},
        {h:'Činností', cls:'right', render:function(r){ return fmt(r.cin); }},
        {h:'S vazbou na §', cls:'right', render:function(r){ return fmt(r.withEli); }},
        {h:'Pokrytí', render:function(r){
            var p = Math.round(r.cov*100);
            var st = p>=80?'ok':(p>=40?'warn':'bad');
            return dot(st, p+' %', p+' % činností agendy má v RPP odkaz na konkrétní §.');
          }},
        {h:'e-Sbírka', render:function(r){
            return r.firstEli
              ? '<a class="link" href="'+esc(eliHref(r.firstEli))+'" target="_blank" rel="noopener" title="otevřít první navázaný § v e-Sbírce">otevřít § →</a>'
              : '<span class="muted">—</span>';
          }}
      ];
    }
  }
  function valBox(t, b){
    return '<div style="border:1px solid var(--line);border-radius:10px;padding:12px 14px;background:#fafcff">'
      + '<div style="font-weight:700;margin-bottom:4px">'+esc(t)+'</div>'
      + '<div class="small" style="line-height:1.6;color:var(--muted)">'+b+'</div></div>';
  }

  /* ================================================================== */
  /* 2) #/dokumentace — rámec pro agentní vytěžování DSP (krabička)     */
  /* ================================================================== */
  async function dokumentace(){
    // čistě explainer/architektonická stránka — žádná data nejsou nutná
    function pravidlo(ic, t, b){
      return '<div class="kv" style="align-items:flex-start"><span style="min-width:26px;font-size:16px">'+ic+'</span>'
        + '<b style="font-weight:500"><span style="font-weight:700">'+esc(t)+'</span> — '+b+'</b></div>';
    }

    view.innerHTML =
      '<div class="pagehdr"><div><h1>Rámec pro agentní vytěžování dokumentace (DSP)</h1>'
      + '<div class="sub">Změna 16 · architektonický směr (P3) · bezpečnostní oddělení zón</div></div></div>'

      // problém
      + '<div class="card"><h2>Problém: dokumentace skutečného provedení (DSP) prakticky neexistuje</h2>'
      + '<div class="desc">DSP ve strukturované, vytěžitelné podobě <b>skoro u žádného systému neexistuje</b>. '
      + 'To, co existuje, je obvykle <b>původní dokumentace</b> plus série <b>přírůstkových změnových listů</b> — '
      + 'nikdy ne udržované „úplné znění". Aktuální stav systému je tak nutné rekonstruovat skládáním změn, '
      + 'což je přesně typ úlohy vhodný pro <b>agentní (AI) vytěžování</b>. '
      + 'Zároveň jde o <b>citlivý obsah</b> (architektura, rozhraní, slabiny) — nesmí opustit bezpečné prostředí.</div></div>'

      // architektura dvou zón — inline SVG
      + '<div class="card"><h2>Architektura: dvě zóny + jednosměrná filtrační brána</h2>'
      + '<div class="desc">Klíčem je <b>fyzické a logické oddělení</b> dvou prostředí. Mezi nimi je <b>jednosměrná brána</b> '
      + '— ven smí pouze schválený, filtrovaný extrakt; dovnitř nic citlivého neuniká a ven neuniká nic nefiltrovaného.</div>'
      + zoneSvg()
      + '<div class="grid2" style="margin-top:12px">'
        + '<div style="border:2px solid #bfe6cd;border-radius:12px;padding:14px;background:#f4fbf6">'
          + '<div style="font-weight:800;color:#1c7c43;margin-bottom:6px">🌐 VEŘEJNÁ zóna</div>'
          + '<div class="small" style="line-height:1.6">Tento nástroj (RPP Explorer), open data RPP, e-Sbírka, publikovatelné extrakty. '
          + 'Dostupné komukoli, hostováno běžně (cloud/CDN). Obsahuje <b>jen to, co smí být veřejné</b>.</div>'
        + '</div>'
        + '<div style="border:2px solid #a32626;border-radius:12px;padding:14px;background:#fdf5f5">'
          + '<div style="font-weight:800;color:#a32626;margin-bottom:6px">🔒 Izolovaná „KRABIČKA"</div>'
          + '<div class="small" style="line-height:1.6"><b>On-premise</b> agentní systém. <b>NE</b> veřejný cloud, '
          + '<b>NE</b> univerzální/veřejný LLM. Zde leží DSP, původní dokumentace i změnové listy a probíhá zde veškeré vytěžování. '
          + 'Z krabičky ven vede <b>jediná</b> cesta — přes filtrační bránu.</div>'
        + '</div>'
      + '</div></div>'

      // pipeline
      + '<div class="card"><h2>Pipeline vytěžování</h2>'
      + '<div class="desc">Tok od zdrojů po publikovatelný extrakt. Vše vlevo od brány zůstává v krabičce.</div>'
      + pipelineSvg()
      + '</div>'

      // pravidla publikace
      + '<div class="card"><h2>Pravidla filtrační brány — co smí ven jako open data</h2>'
      + '<div class="kv-list">'
        + pravidlo('✅', 'Smí ven', 'existence systému a jeho účel, vazba na agendu/§, kategorie a typ rozhraní (bez detailu), '
            + 'agregované metriky pokrytí a kvality, metadata správce (která už jsou veřejná v RPP).')
        + pravidlo('⛔', 'Zůstává interní', 'konkrétní endpointy, IP/porty, schémata databází, autentizační mechanismy, '
            + 'verze komponent, známé chyby/slabiny, interní procesy a kontakty, cokoli použitelné k útoku.')
        + pravidlo('🛡️', 'Obrana proti analýze zranitelností', 'extrakt nesmí umožnit poskládat „mapu útoku". '
            + 'Granularita se záměrně snižuje (např. „REST rozhraní" ano, „verze a parametry" ne); citlivé detaily se agregují nebo vypouští.')
        + pravidlo('➡️', 'Jednosměrnost', 'brána propouští pouze schválený extrakt směrem ven. '
            + 'Žádný veřejný požadavek nesmí iniciovat čtení uvnitř krabičky; žádný univerzální LLM nevidí citlivý vstup.')
        + pravidlo('👤', 'Lidské schválení', 'každý extrakt před publikací schvaluje odpovědná osoba (čtyři oči). '
            + 'Agent připraví návrh, člověk rozhoduje o zveřejnění.')
        + pravidlo('🧾', 'Auditovatelnost', 'každá publikace je logovaná (co, kdy, kdo schválil, z jakého zdroje), aby šlo zpětně doložit, '
            + 'že ven šel jen filtrovaný obsah.')
      + '</div>'
      + secNote()
      + '<div class="desc small" style="margin-top:8px">Tato stránka je <b>rámec a pravidla</b> — neobsahuje žádná reálná citlivá data ani DSP.</div>'
      + '</div>';

    function zoneSvg(){
      return '<div style="overflow-x:auto"><svg viewBox="0 0 720 220" width="100%" style="max-width:720px;display:block;margin:6px auto" font-family="Inter,Arial,sans-serif">'
        + '<rect x="8" y="20" width="300" height="180" rx="14" fill="#fdf5f5" stroke="#a32626" stroke-width="2"/>'
        + '<text x="158" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="#a32626">🔒 KRABIČKA (on-prem)</text>'
        + '<rect x="34" y="62" width="118" height="40" rx="8" fill="#fff" stroke="#e3b9b9"/><text x="93" y="86" text-anchor="middle" font-size="11" fill="#7a2020">DSP + dok.</text>'
        + '<rect x="164" y="62" width="118" height="40" rx="8" fill="#fff" stroke="#e3b9b9"/><text x="223" y="86" text-anchor="middle" font-size="11" fill="#7a2020">změnové listy</text>'
        + '<rect x="34" y="118" width="248" height="58" rx="8" fill="#fff" stroke="#e3b9b9"/>'
        + '<text x="158" y="142" text-anchor="middle" font-size="11" font-weight="700" fill="#7a2020">agentní vytěžování</text>'
        + '<text x="158" y="160" text-anchor="middle" font-size="10" fill="#a05050">interní model, ne veřejný LLM</text>'
        // brána
        + '<rect x="318" y="78" width="84" height="64" rx="10" fill="#fff7e6" stroke="#9a6b00" stroke-width="2"/>'
        + '<text x="360" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="#9a6b00">FILTR</text>'
        + '<text x="360" y="120" text-anchor="middle" font-size="9" fill="#9a6b00">brána ➡</text>'
        + '<text x="360" y="134" text-anchor="middle" font-size="9" fill="#9a6b00">jednosměrná</text>'
        + '<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#9a6b00"/></marker></defs>'
        + '<line x1="282" y1="110" x2="316" y2="110" stroke="#9a6b00" stroke-width="2" marker-end="url(#arr)"/>'
        + '<line x1="402" y1="110" x2="436" y2="110" stroke="#9a6b00" stroke-width="2" marker-end="url(#arr)"/>'
        // veřejná zóna
        + '<rect x="438" y="20" width="274" height="180" rx="14" fill="#f4fbf6" stroke="#1c7c43" stroke-width="2"/>'
        + '<text x="575" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="#1c7c43">🌐 VEŘEJNÁ zóna</text>'
        + '<rect x="462" y="66" width="226" height="40" rx="8" fill="#fff" stroke="#bfe6cd"/><text x="575" y="90" text-anchor="middle" font-size="11" fill="#1c7c43">RPP Explorer · open data</text>'
        + '<rect x="462" y="120" width="226" height="56" rx="8" fill="#fff" stroke="#bfe6cd"/>'
        + '<text x="575" y="144" text-anchor="middle" font-size="11" font-weight="700" fill="#1c7c43">publikovatelný extrakt</text>'
        + '<text x="575" y="162" text-anchor="middle" font-size="10" fill="#3a8a5e">jen filtrovaný, schválený obsah</text>'
        + '</svg></div>';
    }
    function pipelineSvg(){
      var steps = [
        ['1) Zdroje','původní dok. +\nzměnové listy','#a32626','#fdf5f5'],
        ['2) Vytěžení','agent v krabičce\nskládá změny','#a32626','#fdf5f5'],
        ['3) Strukturovaný popis','jednotný model\nsystému','#9a6b00','#fff7e6'],
        ['4) Filtr / brána','odebrání citlivých\ndetailů + schválení','#9a6b00','#fff7e6'],
        ['5) Publikovatelný extrakt','do veřejné zóny\n(open data)','#1c7c43','#f4fbf6']
      ];
      var w = 132, gap = 18, h = 84, x = 6, y = 18, svgW = steps.length*(w+gap);
      var s = '<div style="overflow-x:auto"><svg viewBox="0 0 '+svgW+' 120" width="100%" style="min-width:680px;display:block;margin:6px auto" font-family="Inter,Arial,sans-serif">';
      s += '<defs><marker id="arr2" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#64748b"/></marker></defs>';
      steps.forEach(function(st, i){
        var bx = x + i*(w+gap);
        s += '<rect x="'+bx+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10" fill="'+st[3]+'" stroke="'+st[2]+'" stroke-width="2"/>';
        s += '<text x="'+(bx+w/2)+'" y="'+(y+26)+'" text-anchor="middle" font-size="11.5" font-weight="800" fill="'+st[2]+'">'+esc(st[0])+'</text>';
        st[1].split('\n').forEach(function(ln, k){
          s += '<text x="'+(bx+w/2)+'" y="'+(y+46+k*15)+'" text-anchor="middle" font-size="10" fill="#475569">'+esc(ln)+'</text>';
        });
        if (i < steps.length-1){
          s += '<line x1="'+(bx+w)+'" y1="'+(y+h/2)+'" x2="'+(bx+w+gap)+'" y2="'+(y+h/2)+'" stroke="#64748b" stroke-width="2" marker-end="url(#arr2)"/>';
        }
      });
      return s + '</svg></div>';
    }
  }

  /* ================================================================== */
  /* 3) #/prilezitosti — semafor mezer „kde můžeme být lepší"          */
  /* ================================================================== */
  /* Rozšiřitelnost: dimenze jsou definované deklarativně v poli DIMENZE.
     Přidání nové dimenze = přidat objekt {klic, label, tip, demo?, eval(i)->'ok'|'warn'|'bad'}.
     Skóre připravenosti = průměr bodů přes všechny dimenze (ok=2, warn=1, bad=0). */
  var DIMENZE = [
    { klic:'bezp', label:'Bezp. úroveň', tip:'Má systém v RPP vyplněnou bezpečnostní úroveň (dopad)?',
      eval:function(i){ return i.bez_rank ? 'ok' : 'bad'; } },
    { klic:'cloud', label:'Umístění', tip:'Kritické systémy (úroveň 4) by neměly být ve veřejném cloudu.',
      eval:function(i){
        var cloud = /cloud/i.test(i.umisteni||'') && !/Bez/i.test(i.umisteni||'');
        if (i.bez_rank>=4 && cloud) return 'bad';   // kritický v cloudu = červená
        if (cloud) return 'warn';
        return i.umisteni ? 'ok' : 'warn';
      } },
    { klic:'sdileni', label:'Sdílení / ISSS', tip:'Je systém napojený na sdílení mezi OVM (centrálně/sdíleně)? Individuální = nižší interoperabilita.',
      eval:function(i){
        var s = i.sdileni||'';
        if (/Centrálně|více orgány/i.test(s)) return 'ok';
        if (/Individuální/i.test(s)) return 'warn';
        return 'bad';
      } },
    { klic:'dok', label:'Dokumentace', tip:'DSP / strukturovaná dokumentace skutečného provedení — v RPP zatím není evidováno (demonstrační dimenze).',
      demo:true, eval:function(){ return 'bad'; } },
    { klic:'api', label:'API', tip:'Strojově čitelné rozhraní (API) — v RPP zatím není evidováno (demonstrační dimenze).',
      demo:true, eval:function(){ return 'warn'; } }
  ];

  function readinessScore(i){
    var v = { ok:2, warn:1, bad:0 };
    var sum = 0, max = DIMENZE.length*2;
    DIMENZE.forEach(function(d){ sum += v[d.eval(i)]; });
    return { pct: Math.round(sum/max*100), sum:sum, max:max };
  }

  async function prilezitosti(){
    await ensureNames();
    var isvs = await load('isvs');

    // zaměřit primárně na kritické / významné systémy + ty s rolí registru
    var kandidati = isvs.filter(function(i){ return i.bez_rank>=3 || i.registr || i.iszr; });
    // doplň reprezentativní vzorek dalších, pokud by bylo málo
    var rows = kandidati.map(function(i){
      var sc = readinessScore(i);
      // počet mezer (warn+bad) — pro řazení dle dopadu
      var gaps = DIMENZE.reduce(function(s,d){ var st=d.eval(i); return s + (st==='ok'?0:1); }, 0);
      // dopad = kritičnost × mezery (kritický systém s nejvíc mezerami = nahoře)
      var dopad = (i.bez_rank||1) * gaps + (i.registr?3:0);
      return { i:i, sc:sc, gaps:gaps, dopad:dopad };
    });

    // agregace semaforu napříč všemi systémy (ne jen kritickými) — pro „celkový obraz"
    var agg = {};
    DIMENZE.forEach(function(d){ agg[d.klic] = { ok:0, warn:0, bad:0 }; });
    isvs.forEach(function(i){ DIMENZE.forEach(function(d){ agg[d.klic][d.eval(i)]++; }); });

    // žebříček největších příležitostí
    var top = rows.slice().sort(function(a,b){ return b.dopad - a.dopad; }).slice(0, 20);

    var cols = [
      {h:'Systém', render:function(r){ return link(r.i.id, r.i.nazev) + (r.i.registr?' '+badgeRegistr():''); }},
      {h:'Bezp.', render:function(r){ return badgeSec(r.i.bezuroven); }}
    ].concat(DIMENZE.map(function(d){
      return { h: d.label + (d.demo?' ⚗':''), render:function(r){
        var st = d.eval(r.i);
        var lbl = st==='ok'?'OK':(st==='warn'?'?':'✗');
        return dot(st, lbl, (d.demo?'[demonstrační] ':'')+d.tip);
      }};
    })).concat([
      {h:'Skóre připravenosti', render:function(r){
        var st = r.sc.pct>=66?'ok':(r.sc.pct>=33?'warn':'bad');
        return bar(r.sc.pct+' %', r.sc.pct, 100, st==='bad'?'pink':(st==='warn'?'':''));
      }}
    ]);

    view.innerHTML =
      '<div class="pagehdr"><div><h1>Kde můžeme být lepší — semafor mezer</h1>'
      + '<div class="sub">Změna 19 · akční pohled napříč dimenzemi · příležitosti ke zlepšení</div></div></div>'
      + srcHeader('RPP — ISVS (bezp. úroveň, umístění, sdílení)')

      + '<div class="card"><div class="desc">'
      + 'Pro každý (zejména kritický) systém vyhodnocujeme „semafor" připravenosti napříč dimenzemi: '
      + 'bezpečnostní úroveň, umístění (cloud vs. on-prem), sdílení/interoperabilita, dokumentace a API. '
      + '<span style="white-space:nowrap">'+dot('ok','OK','splněno')+' '+dot('warn','?','mezera / neuvedeno')+' '+dot('bad','✗','chybí / riziko')+'</span> '
      + 'Cílem není „nálepkovat", ale ukázat DIA, <b>kam investovat a co metodicky vymáhat</b>.</div></div>'

      // metodický princip — hlavní „prodejní" výstup
      + '<div class="card" style="border-left:4px solid var(--neon-cyan)"><h2>Metodický princip — proč to ukazujeme i bez dat</h2>'
      + '<div class="desc">Některé dimenze (umístění, bezp. úroveň, dokumentace, API) jsou v RPP <b>z velké části nevyplněné</b> '
      + 'nebo se neevidují vůbec (⚗). Přesto je <b>záměrně zobrazujeme</b>: nástroj tak ukazuje, '
      + '<b>jak užitečný by pohled byl, kdyby data existovala</b> — a tím <b>tvoří poptávku po jejich doplnění</b>. '
      + 'To je hlavní výstup pro DIA: ne „máme hotovo", ale „tady je hodnota, doplňte data a získáte ji". '
      + 'Pohled je <b>rozšiřitelný</b> — přidání nové dimenze je jeden záznam v konfiguraci (váha, vyhodnocení, popis).</div></div>'

      // agregace
      + '<div class="card"><h2>Celkový obraz napříč všemi systémy <span class="small muted">'+fmt(isvs.length)+' systémů</span></h2>'
      + '<div class="desc">Kolik systémů je v každé dimenzi „zelených / žlutých / červených". Žlutá i červená = příležitost.</div>'
      + '<div class="tablewrap"><table><thead><tr><th>Dimenze</th><th class="right">🟢 OK</th><th class="right">🟡 mezera</th><th class="right">🔴 chybí</th><th>Poměr</th></tr></thead><tbody>'
      + DIMENZE.map(function(d){
          var a = agg[d.klic];
          return '<tr><td>'+esc(d.label)+(d.demo?' '+demoBadge('Demonstrační dimenze — v RPP se zatím neeviduje.'):'')+'</td>'
            + '<td class="right">'+fmt(a.ok)+'</td><td class="right">'+fmt(a.warn)+'</td><td class="right">'+fmt(a.bad)+'</td>'
            + '<td>'+miniBar(a.ok,a.warn,a.bad)+'</td></tr>';
        }).join('')
      + '</tbody></table></div></div>'

      // žebříček příležitostí
      + '<div class="card"><h2>Největší příležitosti ke zlepšení '
      + '<span class="small muted">kritické systémy s nejvíc mezerami nahoře</span></h2>'
      + '<div class="desc">Řazeno dle <b>dopadu</b> = bezpečnostní úroveň (kritičnost) × počet mezer (+ bonus za roli registru). '
      + 'Nahoře jsou systémy, kde se zlepšení nejvíc vyplatí.</div>'
      + table(top, cols)
      + '</div>'
      + '<div class="card">' + secNote() + '</div>';

    window.__export = { name:'prilezitosti_semafor', rows: top, cols: cols };
  }
  function miniBar(ok, warn, bad){
    var tot = ok+warn+bad || 1;
    function seg(v, c){ var w = Math.round(v/tot*100); return w? '<span style="display:inline-block;height:10px;width:'+w+'%;background:'+c+'"></span>':''; }
    return '<div style="display:flex;width:160px;height:10px;border-radius:5px;overflow:hidden;border:1px solid var(--line)">'
      + seg(ok,'#3aa05e') + seg(warn,'#e0a82e') + seg(bad,'#cc4b4b') + '</div>';
  }

  /* ================================================================== */
  /* 4) #/zeptejse — ad-hoc dotazování v přirozeném jazyce (heuristika) */
  /* ================================================================== */
  var PRIKLADY = [
    'Kolik systémů spravuje Ministerstvo vnitra',
    'Které kritické systémy jsou v cloudu',
    'Kolik agend nemá napojený žádný systém',
    'Nejrozšířenější systém',
    'Kolik je kritických systémů',
    'Kolik systémů je v cloudu',
    'Které agendy spravuje Ministerstvo financí'
  ];

  async function zeptejse(){
    await ensureNames();

    view.innerHTML =
      '<div class="pagehdr"><div><h1>Zeptejte se dat</h1>'
      + '<div class="sub">Změna 20 · ad-hoc dotazování nad daty v přirozeném jazyce</div></div></div>'

      + '<div class="card"><div class="desc">'
      + 'Napište dotaz běžnou češtinou. Nástroj použije <b>lehký jazykový parser</b> (heuristiku přes klíčová slova) '
      + 'a namapuje dotaz na předpřipravenou agregaci nad daty RPP. <b>Nejde o plný LLM</b> — proto u každé odpovědi '
      + 'transparentně ukážeme, <b>z jakých dat a jakým výpočtem</b> vznikla (důvěryhodnost pro státní použití). '
      + 'Potřebujete-li úplnou volnost dotazů, použijte <a class="link" href="#/dotazy">SQL konzoli · JOIN</a> — '
      + 'tohle je její jednodušší přirozenojazyčná nadstavba.</div>'
      + '<div class="toolbar" style="margin-top:12px">'
        + '<input class="grow" id="qq" placeholder="Např.: kolik systémů spravuje Ministerstvo vnitra" autocomplete="off">'
        + '<button class="btn neon" id="qgo">Zeptat se →</button>'
      + '</div>'
      + '<div style="margin-top:8px">'+ PRIKLADY.map(function(p){
          return '<button class="chip" data-ex="'+esc(p)+'" style="cursor:pointer;margin:0 4px 6px 0">'+esc(p)+'</button>';
        }).join('') + '</div>'
      + '</div>'

      + '<div id="qans"></div>'
      + '<div class="card">' + secNote() + '</div>';

    var inp = byId('qq');
    function run(q){ inp.value = q; answer(q); }
    byId('qgo').addEventListener('click', function(){ answer(inp.value); });
    inp.addEventListener('keydown', function(e){ if(e.key==='Enter') answer(inp.value); });
    Array.prototype.forEach.call(view.querySelectorAll('[data-ex]'), function(b){
      b.addEventListener('click', function(){ run(b.dataset.ex); });
    });
  }

  /* ---- heuristický parser + agregace ---- */
  async function answer(qRaw){
    var host = byId('qans'); if (!host) return;
    var q = (qRaw||'').trim();
    if (!q){ host.innerHTML = ''; return; }
    host.innerHTML = '<div class="card"><div class="loading"><span class="spin"></span>Počítám…</div></div>';
    var ql = q.toLowerCase();

    try {
      var res = await dispatch(ql);
      host.innerHTML = renderAnswer(q, res);
    } catch(e){
      host.innerHTML = '<div class="card"><div class="empty">Chyba při zpracování: '+esc(e.message)+'</div></div>';
    }
  }

  function findMinistry(ql){
    // najdi v dotazu název ministerstva/úřadu podle slovníku OVM
    if (!NAMES.ovm) return null;
    var best = null;
    for (var id in NAMES.ovm){
      var nm = String(NAMES.ovm[id]||'').toLowerCase();
      if (nm.length < 6) continue;
      if (ql.indexOf(nm) !== -1){ if (!best || nm.length>best.nm.length) best = {id:id, nm:nm, full:NAMES.ovm[id]}; }
    }
    if (best) return best;
    // zkus klíčová slova „ministerstvo X"
    var m = ql.match(/ministerstv[ao]\s+([a-záčďéěíňóřšťúůýž]+)/);
    if (m){
      var kw = m[1];
      for (var id2 in NAMES.ovm){
        var nm2 = String(NAMES.ovm[id2]||'').toLowerCase();
        if (nm2.indexOf('ministerstvo')!==-1 && nm2.indexOf(kw)!==-1) return {id:id2, nm:nm2, full:NAMES.ovm[id2]};
      }
    }
    return null;
  }

  async function dispatch(ql){
    var isCount = /(kolik|počet|kolikr)/.test(ql);
    var isCloud = /cloud/.test(ql);
    var isKrit  = /(kritick|úroveň 4|uroven 4|nejdůležit)/.test(ql);
    var isBezSys = /(bez systému|bez systemu|nemá.*systém|nema.*system|žádný systém|zadny system|nenapojen)/.test(ql);
    var isNejvic = /(nejrozšíř|nejrozsir|nejvíc instal|nejvic instal|nejčastěj|nejcastej|největší systém|nejvetsi system|nejpoužívan)/.test(ql);

    // 1) nejrozšířenější systém (rodina)
    if (isNejvic){
      var isvs = await load('isvs');
      var fam = {};
      isvs.forEach(function(i){ var r=i.rodina; if(r){ fam[r]=(fam[r]||0)+1; } });
      var arr = Object.keys(fam).map(function(k){ return {rodina:k, pocet:fam[k]}; }).sort(function(a,b){ return b.pocet-a.pocet; });
      return {
        kind:'table',
        text: arr.length ? ('Nejrozšířenější produktová rodina je <b>'+esc(arr[0].rodina)+'</b> s <b>'+fmt(arr[0].pocet)+'</b> instalacemi.') : 'Žádné rodiny nenalezeny.',
        how: 'Seskupení ISVS podle pole <span class="mono">rodina</span> a spočítání instalací na rodinu (sestupně).',
        src: 'isvs.json',
        rows: arr.slice(0,15),
        cols: [{h:'Produktová rodina',render:function(r){return esc(r.rodina);}},{h:'Instalací',cls:'right',render:function(r){return fmt(r.pocet);}}]
      };
    }

    // 2) kritické systémy v cloudu
    if (isKrit && isCloud){
      var isvs2 = await load('isvs');
      var hit = isvs2.filter(function(i){ return i.bez_rank>=4 && /cloud/i.test(i.umisteni||'') && !/Bez/i.test(i.umisteni||''); });
      return {
        kind:'table',
        text: 'V cloudu je <b>'+fmt(hit.length)+'</b> kritických systémů (úroveň 4). '
          + (hit.length? 'Kritické systémy by ve veřejném cloudu být neměly — kandidáti k prověření.' : 'Žádný kritický systém není v cloudu — v pořádku.'),
        how: 'Filtr ISVS: <span class="mono">bez_rank ≥ 4</span> A <span class="mono">umisteni</span> obsahuje „cloud" a není „Bez cloud computingu".',
        src: 'isvs.json',
        rows: hit.slice(0,50),
        cols: sysCols()
      };
    }

    // 3) kolik kritických systémů
    if (isKrit && isCount){
      var isvs3 = await load('isvs');
      var krit = isvs3.filter(function(i){ return i.bez_rank>=4; });
      return {
        kind:'table',
        text: 'Kritických systémů (bezpečnostní úroveň 4) je <b>'+fmt(krit.length)+'</b>.',
        how: 'Počet ISVS s <span class="mono">bez_rank = 4</span> („4. Kritická").',
        src: 'isvs.json',
        rows: krit.slice(0,50),
        cols: sysCols()
      };
    }

    // 4) kolik systémů je v cloudu
    if (isCloud && isCount){
      var isvs4 = await load('isvs');
      var cl = isvs4.filter(function(i){ return /cloud/i.test(i.umisteni||'') && !/Bez/i.test(i.umisteni||''); });
      return {
        kind:'metric',
        text: 'V cloudu (plně nebo částečně) je <b>'+fmt(cl.length)+'</b> systémů z '+fmt(isvs4.length)+' ('+pct(cl.length,isvs4.length)+' %).',
        how: 'Počet ISVS, jejichž <span class="mono">umisteni</span> obsahuje „cloud" a není „Bez cloud computingu".',
        src: 'isvs.json'
      };
    }

    // 5) agendy bez napojeného systému
    if (isBezSys){
      var agendy = await load('agendy');
      var bez = agendy.filter(function(a){ return !(a.isvs && a.isvs.length); });
      return {
        kind:'table',
        text: 'Žádný napojený informační systém nemá <b>'+fmt(bez.length)+'</b> agend z '+fmt(agendy.length)+' ('+pct(bez.length,agendy.length)+' %).',
        how: 'Filtr agend, kde pole <span class="mono">isvs</span> je prázdné (žádný navázaný ISVS).',
        src: 'agendy.json',
        rows: bez.slice(0,60),
        cols: [
          {h:'Agenda',render:function(a){return link(a.id, a.kod+' — '+a.nazev)+(a.registr?' '+badgeRegistr():'');}},
          {h:'Ohlašovatel',render:function(a){return '<span class="muted small">'+esc(nameOf(a.ohlasovatel))+'</span>';}}
        ]
      };
    }

    // 6) dotazy vázané na ministerstvo / úřad
    var min = findMinistry(ql);
    if (min){
      var wantsAgendy = /agend/.test(ql);
      var wantsSys = /(systém|system|isvs)/.test(ql) || (!wantsAgendy);
      if (wantsAgendy && !/(systém|system|isvs)/.test(ql)){
        var agendyM = await load('agendy');
        var ag = agendyM.filter(function(a){ return a.ohlasovatel===min.id; });
        return {
          kind:'table',
          text: '<b>'+esc(min.full)+'</b> je ohlašovatelem <b>'+fmt(ag.length)+'</b> agend.',
          how: 'Filtr agend, kde <span class="mono">ohlasovatel</span> = vybraný orgán ('+esc(min.id)+').',
          src: 'agendy.json',
          rows: ag.slice(0,60),
          cols: [{h:'Agenda',render:function(a){return link(a.id, a.kod+' — '+a.nazev)+(a.registr?' '+badgeRegistr():'');}}]
        };
      }
      var isvsM = await load('isvs');
      var sys = isvsM.filter(function(i){ return i.spravce===min.id; });
      return {
        kind:'table',
        text: '<b>'+esc(min.full)+'</b> spravuje <b>'+fmt(sys.length)+'</b> informačních systémů (ISVS).',
        how: 'Filtr ISVS, kde <span class="mono">spravce</span> = vybraný orgán ('+esc(min.id)+').',
        src: 'isvs.json',
        rows: sys.slice(0,60),
        cols: sysCols()
      };
    }

    // neznámý dotaz → návrhy
    return { kind:'unknown' };
  }

  function sysCols(){
    return [
      {h:'Systém',render:function(i){return link(i.id, i.nazev)+(i.registr?' '+badgeRegistr():'');}},
      {h:'Bezp.',render:function(i){return badgeSec(i.bezuroven);}},
      {h:'Umístění',render:function(i){return esc(i.umisteni||'—');}},
      {h:'Správce',render:function(i){return '<span class="muted small">'+esc(i.spravce_nazev||nameOf(i.spravce))+'</span>';}}
    ];
  }

  function renderAnswer(q, res){
    if (res.kind==='unknown'){
      return '<div class="card"><h2>Dotazu nerozumím</h2>'
        + '<div class="desc">Lehký parser tomuto dotazu nerozuměl. Zkuste některou z podporovaných otázek '
        + '(přeformulujte pomocí klíčových slov jako „kolik", „cloud", „kritické", název ministerstva, „bez systému"):</div>'
        + '<div style="margin-top:8px">'+ PRIKLADY.map(function(p){
            return '<button class="chip" data-ex2="'+esc(p)+'" style="cursor:pointer;margin:0 4px 6px 0">'+esc(p)+'</button>';
          }).join('') + '</div>'
        + '<div class="desc small" style="margin-top:8px">Pro libovolný dotaz použijte <a class="link" href="#/dotazy">SQL konzoli →</a></div>'
        + '</div>'
        + bindUnknown();
    }
    var html = '<div class="card"><h2>Odpověď</h2>'
      + '<div class="desc" style="font-size:15px;color:var(--ink)">'+res.text+'</div>'
      + '<div class="desc small" style="margin-top:10px;background:#f1f5fb;border:1px solid var(--line);border-radius:8px;padding:8px 12px">'
      + '🔍 <b>Jak vzniklo:</b> '+res.how+' &nbsp;·&nbsp; <b>Zdroj:</b> <span class="mono">'+esc(res.src)+'</span> (RPP open data, DIA)</div>';
    if (res.rows && res.cols){
      html += '<div style="margin-top:12px">'+ table(res.rows, res.cols) +'</div>';
      window.__export = { name:'zeptejse_'+(q.slice(0,24).replace(/\W+/g,'_')), rows: res.rows, cols: res.cols };
    }
    html += '</div>';
    return html;
  }
  // po vykreslení „unknown" je třeba znovu navázat kliky na nové chipy
  function bindUnknown(){
    setTimeout(function(){
      Array.prototype.forEach.call(document.querySelectorAll('[data-ex2]'), function(b){
        b.addEventListener('click', function(){
          var inp = byId('qq'); if(inp){ inp.value = b.dataset.ex2; } answer(b.dataset.ex2);
        });
      });
    }, 0);
    return '';
  }

  /* ---------- registrace rout ---------- */
  Object.assign(ROUTES, { esbirka: esbirka, dokumentace: dokumentace, prilezitosti: prilezitosti, zeptejse: zeptejse });

})();
