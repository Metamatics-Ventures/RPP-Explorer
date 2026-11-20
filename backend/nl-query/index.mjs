/* RPP Explorer — NL→SQL backend (API Gateway HTTP API → Lambda → Amazon Bedrock).
   Claude dostane SCHÉMA databáze RPP a sám napíše SQLite SELECT, který odpovídá na
   otázku (žádný regex, žádný pevný katalog — model je kreativní nad schématem a umí
   joinovat tabulky, prefixy písmen apod.). SQL se vrátí klientovi a spustí se v
   prohlížeči nad sql.js. Model: Claude Haiku 4.5 přes EU inferenční profil (datová rezidence v EU).
   Účet 472542740583, eu-north-1; region, model a tabulka jdou z proměnných prostředí (infra/). */
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { createRequire } from "module";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const __dir = fileURLToPath(new URL(".", import.meta.url));
const initSqlJs = require("./sql-wasm.js");

// Prázdná validační DB se schématem RPP (jen struktura, žádná data) — slouží k ověření
// vygenerovaného SQL přes PREPARE: chytí neexistující/nejednoznačné sloupce i syntaxi.
const DDL = [
  "CREATE TABLE agendy(id TEXT,kod TEXT,nazev TEXT,ohlasovatel TEXT,kategorie TEXT,zakon TEXT,dulezitost TEXT,stanovisko_sluzby TEXT,stanovisko_udaje TEXT,platnost_od TEXT,pocet_isvs INT,pocet_sluzby INT,pocet_ovm INT,pocet_cinnosti INT)",
  "CREATE TABLE isvs(id TEXT,ident TEXT,nazev TEXT,spravce TEXT,spravce_nazev TEXT,spravce_typ TEXT,bezuroven TEXT,umisteni TEXT,etapa TEXT,sdileni TEXT,vyuziti TEXT,dulezitost TEXT,pocet_agend INT)",
  "CREATE TABLE ovm(id TEXT,ico TEXT,nazev TEXT,typ TEXT,forma TEXT,dulezitost TEXT,ds INT,vnitrni INT,pocet_agend INT,pocet_isvs INT)",
  "CREATE TABLE sluzby(id TEXT,ident TEXT,nazev TEXT,agenda TEXT,kategorie TEXT,typ TEXT,poskytovatel TEXT,dulezitost TEXT,ukony INT)",
  "CREATE TABLE udaje(id TEXT,kod TEXT,nazev TEXT,agenda TEXT,kategorie TEXT,dulezitost TEXT,pocet_polozek INT)",
  "CREATE TABLE opravneni(id TEXT,kod TEXT,z_agenda TEXT,do_agenda TEXT,kategorie TEXT,dulezitost TEXT,pocet_udaju INT,ref INT)",
  "CREATE TABLE vykon(agenda TEXT,typ_ovm TEXT,pocet_ovm INT)",
];
let _SQL = null, _vdb = null;
async function validationDb(){
  if (_vdb) return _vdb;
  _SQL = _SQL || await initSqlJs({ locateFile: f => __dir + f });
  const db = new _SQL.Database(); DDL.forEach(s => db.run(s)); _vdb = db; return db;
}
function checkSql(db, sql){
  if (!sql || typeof sql !== "string") return "prázdný SQL";
  const s = sql.trim().replace(/;+\s*$/, "");
  if (s.indexOf(";") !== -1) return "více příkazů / středník není povolen";
  if (!/^\s*(select|with)\b/i.test(s)) return "musí to být SELECT";
  if (/\b(insert|update|delete|drop|alter|attach|detach|pragma|create|replace|vacuum)\b/i.test(s)) return "zakázané klíčové slovo (jen čtení)";
  if ((s.match(/\bselect\b/gi) || []).length > 3) return "příliš mnoho vnořených SELECT (max 3) — zjednoduš na JOIN+GROUP BY";
  try { const st = db.prepare(s); st.free(); return null; } catch(e){ return String(e.message || e); }
}
function collectErrors(db, d){
  const errs = [];
  (d.charts || []).forEach((c,i) => { const e = checkSql(db, c && c.sql); if (e) errs.push({ loc:`charts[${i}] „${c&&c.title||''}"`, sql:c&&c.sql, error:e }); });
  (d.stats || []).forEach((x,i) => { const e = checkSql(db, x && x.sql); if (e) errs.push({ loc:`stats[${i}] „${x&&x.label||''}"`, sql:x&&x.sql, error:e }); });
  if (d.table) { const e = checkSql(db, d.table.sql); if (e) errs.push({ loc:"table", sql:d.table.sql, error:e }); }
  return errs;
}

const REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "eu-north-1";
const MODEL = process.env.BEDROCK_MODEL || "eu.anthropic.claude-haiku-4-5-20251001-v1:0";
const client = new BedrockRuntimeClient({ region: REGION, maxAttempts: 5 });

// ---- DynamoDB log (dotazy + zpětná vazba) ----
const FB_TABLE = process.env.FEEDBACK_TABLE || "mapastatu-prod-feedback";
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || REGION, maxAttempts: 3 });
function s(v){ return (v==null || v==="") ? undefined : { S: String(v).slice(0, 4000) }; }
async function putEvent(obj){
  const item = {}; for (const k in obj){ const a = s(obj[k]); if (a) item[k]=a; }
  if (!item.id) item.id = { S: randomUUID() };
  try { await ddb.send(new PutItemCommand({ TableName: FB_TABLE, Item: item })); }
  catch(e){ console.error("ddb put failed", e?.message); }
}

const ALLOW = new Set([
  "https://mapastatu.cz", "https://www.mapastatu.cz",
  "http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080",
]);
function cors(origin) {
  const o = ALLOW.has(origin) ? origin : "https://mapastatu.cz";
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Vary": "Origin",
    "content-type": "application/json; charset=utf-8",
  };
}

/* Schéma odpovídá tabulkám sql.js v aplikaci (SQL_TABLES v app.js). */
const SCHEMA = `Databáze RPP (SQLite, POUZE ČTENÍ). 7 tabulek:

agendy(id TEXT, kod TEXT, nazev TEXT, ohlasovatel TEXT→ovm.id, kategorie TEXT, zakon TEXT, dulezitost TEXT, stanovisko_sluzby TEXT, stanovisko_udaje TEXT, platnost_od TEXT, pocet_isvs INT, pocet_sluzby INT, pocet_ovm INT, pocet_cinnosti INT)
isvs(id TEXT, ident TEXT, nazev TEXT, spravce TEXT→ovm.id, spravce_nazev TEXT, spravce_typ TEXT, bezuroven TEXT, umisteni TEXT, etapa TEXT, sdileni TEXT, vyuziti TEXT, dulezitost TEXT, pocet_agend INT)   -- informační systémy
ovm(id TEXT, ico TEXT, nazev TEXT, typ TEXT, forma TEXT, dulezitost TEXT, ds INT, vnitrni INT, pocet_agend INT, pocet_isvs INT)   -- orgány veřejné moci (úřady)
sluzby(id TEXT, ident TEXT, nazev TEXT, agenda TEXT→agendy.id, kategorie TEXT, typ TEXT, poskytovatel TEXT, dulezitost TEXT, ukony INT)
udaje(id TEXT, kod TEXT, nazev TEXT, agenda TEXT→agendy.id, kategorie TEXT, dulezitost TEXT, pocet_polozek INT)   -- objekty údajů
opravneni(id TEXT, kod TEXT, z_agenda TEXT→agendy.id, do_agenda TEXT→agendy.id, kategorie TEXT, dulezitost TEXT, pocet_udaju INT, ref INT)   -- datové toky mezi agendami
vykon(agenda TEXT→agendy.id, typ_ovm TEXT, pocet_ovm INT)   -- VÝKON agendy dle typu OVM: kolik OVM daného typu agendu skutečně vykonává (1 řádek = 1 kombinace agenda × typ OVM)

JOINY (klíče):
- isvs.spravce = ovm.id  (který úřad systém spravuje)
- agendy.ohlasovatel = ovm.id  (který úřad agendu ohlašuje — GESTOR, jde o ohlášení, ne o výkon)
- vykon.agenda = agendy.id ; vykon.typ_ovm má stejné hodnoty jako ovm.typ (viz níže)
- sluzby.agenda = agendy.id ; udaje.agenda = agendy.id
- opravneni.z_agenda = agendy.id (zdroj) ; opravneni.do_agenda = agendy.id (příjemce)

DŮLEŽITÉ ROZLIŠENÍ — OHLÁŠENÍ vs. VÝKON:
- agendy.ohlasovatel = JEDEN úřad, který agendu OHLAŠUJE (gestor, organický zápis v RPP) — např. „kdo ohlásil agendu X".
- tabulka vykon = kdo agendu skutečně VYKONÁVÁ, agregováno dle TYPU OVM (ne jednotlivě) — např. „které typy úřadů vykonávají agendu X", „kolik obcí vykonává agendu Y", „která agenda má nejvíc vykonávajících ministerstev". Na otázky o VÝKONU (ne o ohlášení/gestorovi) používej VŽDY tabulku vykon, nikdy jen agendy.ohlasovatel.
- vykon NEobsahuje jednotlivé OVM (jen typy a počty) — na „které konkrétní obce agendu vykonávají" odpověz, že appka eviduje jen vzorek/výkon dle typu, ne kompletní seznam přes SQL.

HODNOTY SLOUPCŮ:
- dulezitost (ve všech tabulkách): 'Kritická' | 'Vysoká' | 'Střední' | 'Nízká'. „Kritický systém / důležitý systém" = isvs.dulezitost='Kritická'.
- isvs.bezuroven (bezpečnostní úroveň dle vyhlášky): '4. Kritická' | '3. Vysoká' | '2. Střední' | '1. Nízká', nebo NULL/'' = neuvedeno.
- isvs.umisteni: 'Bez cloud computingu' | 'Plně s využitím cloud computingu' | 'Částečně s využitím cloud computingu'. POZOR: „v cloudu" = umisteni LIKE '%využitím cloud%' (řetězec 'Bez cloud computingu' také obsahuje slovo „cloud").
- ovm.typ a isvs.spravce_typ: 'Ministerstva' | 'Kraje' | 'Města a městyse' | 'Obce' | 'Městské části' | 'Úřady (státní správa)' | 'Soudy a st. zastupitelství' | 'Organizační složky státu' | 'Příspěvkové organizace' | 'Školy a univerzity' | 'Zdravotní pojišťovny' | 'Komory a prof. samospráva' | 'Podniky a firmy' | 'Ostatní'.
- Názvy ministerstev mají tvar 'Ministerstvo <oblast>' (např. 'Ministerstvo vnitra', 'Ministerstvo financí').
- isvs.etapa (fáze životního cyklu, PŘESNÉ hodnoty): 'Rozvoj a provoz' | 'Vznik a provoz' | 'Zánik a archivace'. „ve fázi zánik/archivace" = isvs.etapa = 'Zánik a archivace'.
- isvs.sdileni: 'Centrálně sdílený' | 'Sdílený mezi více orgány veřejné moci' | 'Individuální'.
- isvs.vyuziti: 'Všechny OVM' | 'Seznamem OVM nebo seznamem kategorií OVM' | 'Pouze správce IS'.

POČETNÍ SLOUPCE (jsou předpočítané, používej je místo COUNT přes joiny, kde to jde):
- agendy: pocet_isvs, pocet_sluzby, pocet_ovm, pocet_cinnosti  (POZOR: agendy NEMAJÍ sloupec „pocet_udaje" ani „pocet_udaju").
- isvs: pocet_agend ; ovm: pocet_agend, pocet_isvs ; sluzby: ukony ; udaje: pocet_polozek ; opravneni: pocet_udaju.

ZDRAVÝ ROZUM:
- „ministerstva začínající na V" = ovm.typ='Ministerstva' AND ovm.nazev LIKE 'Ministerstvo V%'.
- „systémy na ministerstvech začínajících na V" → JOIN isvs i ON i.spravce = o.id, kde o.typ='Ministerstva' AND o.nazev LIKE 'Ministerstvo V%'.
- „začínající na písmeno X / na X" → LIKE 'X%' (u ministerstev 'Ministerstvo X%'). SQLite LIKE je case-insensitive pro ASCII.
- Vždy vracej čitelné názvy (sloupec nazev), ne jen id; u JOINů vracej i název protějšku (např. i.nazev AS system, o.nazev AS ministerstvo).
- „kolik obcí/krajů/ministerstev vykonává agendu X" nebo „které typy úřadů agendu X vykonávají" → JOIN vykon v ON v.agenda = a.id, filtruj v.typ_ovm, řaď dle v.pocet_ovm. NEPOUŽÍVEJ pro tohle agendy.ohlasovatel (to je jen gestor).`;

const SYSTEM = `Jsi expert na SQLite a datové dashboardy. Dostaneš schéma databáze RPP a otázku uživatele (česky). Navrhni KOMPLETNÍ DASHBOARD, který otázku zodpoví — VŽDY odpověz JEN voláním nástroje emit_dashboard.

Dashboard MUSÍ obsahovat:
- answer_cs: jedna krátká česká věta, která přímo odpovídá na otázku.
- charts: PŘESNĚ 2 hlavní grafy (vedle sebe). Každý: { title, type ('bar' nebo 'donut'), sql }. SQL každého grafu vrací PŘESNĚ 2 sloupce: 1. textový POPISEK, 2. ČÍSELNOU hodnotu; seřaď sestupně dle hodnoty a dej LIMIT 12. Grafy mají osvětlovat TÉMA otázky (rozpady, srovnání) — použij stejný filtr/rozsah jako otázka, kde to dává smysl.
- stats: PŘESNĚ 6 klíčových čísel (malé dlaždice). Každé: { label, sql, suffix (volitelně, např. '%') }. SQL vrací JEDINÉ číslo (COUNT/SUM/AVG/MAX…). Statistiky se vážou k tématu otázky.
- table: hlavní výpis řádků, který je přímou odpovědí na otázku: { title, sql }. SQL vrací čitelné sloupce (názvy, ne jen id), LIMIT 500.

Buď kreativní nad schématem, joinuj podle uvedených klíčů a používej zdravý rozum (prefixy písmen přes LIKE, čitelné názvy, vhodné rozpady).

PRAVIDLA SQL (DŮLEŽITÉ — dodržuj přesně, jinak dotaz selže):
- Každý sql je PŘESNĚ JEDEN platný SQLite SELECT (NIKDY INSERT/UPDATE/DELETE/DROP/ALTER/ATTACH/PRAGMA; žádné středníky uprostřed / více příkazů).
- Používej VÝHRADNĚ sloupce a tabulky uvedené ve schématu, PŘESNÝMI českými názvy (kategorie — NE „kategoria"; dulezitost; pocet_isvs…). NEVYMÝŠLEJ sloupce (žádné pocet_udaje u agend, žádný rozpočet/IP/verze/telefon — ty v datech NEJSOU; když dotaz žádá neexistující pole, vrať nejbližší smysluplný dostupný pohled).
- V dotazech s JOINem VŽDY kvalifikuj KAŽDÝ sloupec aliasem tabulky (i.dulezitost, o.nazev, a.kod) — sloupce jako dulezitost/nazev/kategorie/id existují ve více tabulkách a bez aliasu skončí chybou „ambiguous column".
- NIKDY nepoužívej korelované poddotazy ani vnořené IN (SELECT … WHERE = vnější_alias.sloupec) — to je extrémně pomalé a zablokuje to prohlížeč. Použij prosté JOIN + GROUP BY. Drž dotazy levné a jednoduché.
- Když přiřazuješ tabulce alias, používej ho pak důsledně (nepiš o.nazev, když jsi ovm nepojmenoval jako o).
- Pořadí klauzulí: SELECT → FROM → [JOIN] → [WHERE] → [GROUP BY] → [ORDER BY] → [LIMIT]. GROUP BY NIKDY po ORDER BY/LIMIT.
- Grafový sql: 2 sloupce (popisek, číslo), ORDER BY číslo DESC, LIMIT 12.
- Statistický sql: vrací JEDNO číslo a je to SAMOSTATNÝ dotaz. Tvar: SELECT COUNT(*) | SUM(sloupec) | AVG(sloupec) | MAX(sloupec) FROM tabulka [JOIN …] [WHERE …]. VE STATISTICE: žádné GROUP BY, žádné poddotazy. Nejraději BEZ aliasů (SELECT COUNT(*) FROM isvs WHERE dulezitost='Kritická'); pokud alias použiješ, MUSÍŠ ho v témže dotazu definovat (FROM isvs i).
- TOP-N podle počtu: použij PŘEDPOČÍTANÝ sloupec přímo, bez GROUP BY a bez JOINu. Např. „10 systémů s nejvíce agendami" → SELECT nazev AS system, pocet_agend FROM isvs ORDER BY pocet_agend DESC LIMIT 10. „úřady dle počtu agend" → SELECT nazev, pocet_agend FROM ovm ORDER BY pocet_agend DESC LIMIT 10. GROUP BY použij jen u skutečného rozpadu (kolik X v každé skupině).
- Tabulkový sql: čitelné názvy, LIMIT 500.

${SCHEMA}

PŘÍKLAD pro otázku „Co za kritické systémy jsou na ministerstvech začínajících na V?":
- charts[0] (bar) „Kritické systémy podle ministerstva": SELECT o.nazev AS ministerstvo, COUNT(*) AS pocet FROM isvs i JOIN ovm o ON i.spravce=o.id WHERE o.typ='Ministerstva' AND o.nazev LIKE 'Ministerstvo V%' AND i.dulezitost='Kritická' GROUP BY o.nazev ORDER BY pocet DESC LIMIT 12;
- charts[1] (donut) „Podle bezpečnostní úrovně": SELECT COALESCE(NULLIF(i.bezuroven,''),'Neuvedeno') AS uroven, COUNT(*) AS pocet FROM isvs i JOIN ovm o ON i.spravce=o.id WHERE o.typ='Ministerstva' AND o.nazev LIKE 'Ministerstvo V%' AND i.dulezitost='Kritická' GROUP BY uroven ORDER BY pocet DESC LIMIT 12;
- stats: „Kritických systémů" SELECT COUNT(*) FROM isvs i JOIN ovm o ON i.spravce=o.id WHERE o.typ='Ministerstva' AND o.nazev LIKE 'Ministerstvo V%' AND i.dulezitost='Kritická'; „Dotčených ministerstev" SELECT COUNT(DISTINCT o.id) …; „V cloudu" SELECT COUNT(*) … AND i.umisteni LIKE '%využitím cloud%'; „Bezp. úroveň 4" SELECT COUNT(*) … AND i.bezuroven LIKE '4.%'; „Bez bezp. úrovně" SELECT COUNT(*) … AND (i.bezuroven IS NULL OR i.bezuroven=''); „Pokrytých agend (součet)" SELECT SUM(i.pocet_agend) …
- table „Kritické systémy na ministerstvech na V": SELECT i.nazev AS system, i.bezuroven AS bezpecnostni_uroven, i.umisteni AS umisteni, o.nazev AS ministerstvo FROM isvs i JOIN ovm o ON i.spravce=o.id WHERE o.typ='Ministerstva' AND o.nazev LIKE 'Ministerstvo V%' AND i.dulezitost='Kritická' ORDER BY o.nazev, i.nazev LIMIT 500;`;

const SQL_PROP = { type: "string" };
const TOOL = {
  toolSpec: {
    name: "emit_dashboard",
    description: "Vrať kompletní dashboard (2 grafy + 6 statistik + tabulka) jako sadu SQLite SELECTů.",
    inputSchema: { json: {
      type: "object",
      properties: {
        answer_cs: { type: "string", description: "Krátká česká věta odpovídající na otázku." },
        title: { type: "string" },
        charts: { type: "array", description: "Přesně 2 grafy.", items: { type: "object", properties: {
          title: { type: "string" }, type: { type: "string", enum: ["bar","donut"] }, sql: SQL_PROP,
        }, required: ["title","type","sql"] } },
        stats: { type: "array", description: "Přesně 6 statistik.", items: { type: "object", properties: {
          label: { type: "string" }, sql: SQL_PROP, suffix: { type: "string" },
        }, required: ["label","sql"] } },
        table: { type: "object", properties: { title: { type: "string" }, sql: SQL_PROP }, required: ["title","sql"] },
      },
      required: ["answer_cs","charts","stats","table"],
    } },
  },
};

export const handler = async (event) => {
  const headers = event.headers || {};
  const origin = headers.origin || headers.Origin || "";
  const method = event.requestContext?.http?.method || "POST";
  if (method === "OPTIONS") return { statusCode: 204, headers: cors(origin), body: "" };

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {}
  const path = event.rawPath || event.requestContext?.http?.path || "/";

  // ---- zpětná vazba (👍/👎 + volitelný komentář) z celé aplikace ----
  if (path.endsWith("/feedback")) {
    const rating = body.rating === "up" ? "up" : body.rating === "down" ? "down" : "";
    if (!rating) return { statusCode: 400, headers: cors(origin), body: JSON.stringify({ error: "Chybí rating." }) };
    await putEvent({ type: "feedback", ts: new Date().toISOString(), rating, comment: body.comment,
      route: body.route, ref: body.ref, context: body.context, session: body.session,
      origin, ua: headers["user-agent"] || headers["User-Agent"] });
    return { statusCode: 200, headers: cors(origin), body: JSON.stringify({ ok: true }) };
  }

  const question = (body.question || "").toString().slice(0, 600);
  if (!question.trim()) return { statusCode: 400, headers: cors(origin), body: JSON.stringify({ error: "Prázdný dotaz." }) };

  try {
    const vdb = await validationDb();
    const messages = [{ role: "user", content: [{ text: question }] }];
    let d = null, repaired = 0, remaining = 0;
    for (let round = 0; round < 3; round++) {
      const resp = await client.send(new ConverseCommand({
        modelId: MODEL,
        system: [{ text: SYSTEM }],
        messages,
        inferenceConfig: { maxTokens: 2000, temperature: 0 },
        toolConfig: { tools: [TOOL], toolChoice: { tool: { name: "emit_dashboard" } } },
      }));
      const msg = resp.output?.message;
      const tu = (msg?.content || []).find((b) => b.toolUse);
      if (!tu || !tu.toolUse?.input) {
        if (d) break;  // měli jsme předchozí pokus
        return { statusCode: 502, headers: cors(origin), body: JSON.stringify({ error: "Model nevrátil dashboard." }) };
      }
      d = tu.toolUse.input;
      const errs = collectErrors(vdb, d);
      if (!errs.length) { remaining = 0; break; }      // vše validní → hotovo
      remaining = errs.length;
      if (round === 2) break;                            // dál už neopravujeme
      repaired++;
      // pošli modelu chyby zpět a nech ho opravit (tool-result repair turn)
      messages.push(msg);
      messages.push({ role: "user", content: [{ toolResult: {
        toolUseId: tu.toolUse.toolUseId,
        status: "error",
        content: [{ text: "Validace SQL proti schématu RPP našla chyby. Oprav VŠECHNY uvedené dotazy a vrať CELÝ dashboard znovu (stejná struktura, stejné názvy/části) přes nástroj emit_dashboard. Dodrž přesné názvy sloupců, kvalifikuj aliasy v JOINu a u TOP-N použij předpočítané sloupce.\n\n" +
          errs.map((e) => `• ${e.loc}: ${e.error}\n  SQL: ${e.sql}`).join("\n") }],
      } }] });
    }
    const queryId = randomUUID();
    await putEvent({ id: queryId, type: "nl_query", ts: new Date().toISOString(), question,
      sql: (d && d.table && d.table.sql) || "", answer: (d && d.answer_cs) || "",
      repaired: String(repaired || 0), remaining: String(remaining || 0), session: body.session, origin });
    return { statusCode: 200, headers: cors(origin), body: JSON.stringify({ dashboard: d, queryId, model: `Claude Haiku 4.5 (Bedrock, ${REGION})`, repaired: repaired || undefined, remaining: remaining || undefined }) };
  } catch (e) {
    return { statusCode: 502, headers: cors(origin), body: JSON.stringify({ error: String(e?.message || e) }) };
  }
};
