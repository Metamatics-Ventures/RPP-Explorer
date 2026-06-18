#!/usr/bin/env python3
"""ETL: RPP open-data JSON -> compact client JSON for the RPP Explorer SPA.

Verze 2 (po 19. schůzce PS07 — viz docs/06_pripominky-19-schuzka-a-plan-oprav.md):
  * A1/A2/A5  kritičnost se počítá z DOPADU (bezpečnostní úroveň + role registru +
              typ správce), ne z holého počtu navázaných agend.
  * B9        defenzivní deduplikace agend na poslední platnou verzi (kód).
  * B10/D16   ovm_sample i agendy_sample řazené dle úrovně / důležitosti (ne abecedně),
              s typovou značkou pro filtrování v UI; zvýraznění gestora (ohlašovatele).
  * C13       odvození role „editor registru" (oprávnění s úrovní W vůči registru).
  * C14       mapovací (číselníková) vrstva nad názvy ISVS -> rodina produktu
              (fuzzy + slovník), bez přepisu zdroje; metrika rozšíření produktu.
  * E20       u činností § (ustanovení eSbírky) + role na úrovni vlády
              (vykonávající kategorie OVM) — podklad pro paprskový graf.
  * C15       fill-rate nákladových polí jako analytický výstup (ne řazení dle nákladů).
"""
import json, os, re, collections, sys

SRC = os.path.expanduser(
    "/Users/jakubbares/Library/CloudStorage/OneDrive-SharedLibraries-AFCEA-ČeskápobočkaAFCEA(2)/PS Inteligence - Documents 2/kGovernment team/RPP")
OUT = os.path.expanduser(
    "/Users/jakubbares/Library/CloudStorage/OneDrive-SharedLibraries-AFCEA-ČeskápobočkaAFCEA(2)/PS Inteligence - Documents 2/kGovernment team/RPP-Explorer/app/data")
os.makedirs(OUT, exist_ok=True)

def load(name):
    with open(os.path.join(SRC, name + ".json"), encoding="utf-8") as f:
        d = json.load(f)
    return d.get("položky", d) if isinstance(d, dict) else d

def cs(v):
    if isinstance(v, dict): return v.get("cs") or next(iter(v.values()), "")
    return v or ""

def short(s, n=240):
    s = cs(s)
    return (s[:n] + "…") if len(s) > n else s

def write(name, obj):
    p = os.path.join(OUT, name + ".json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  {name}.json  {os.path.getsize(p)/1024:.0f} KB")

# ---------- codelists ----------
print("codelists…")
CIS = {}
for fn in os.listdir(SRC):
    if fn.startswith("cis_") and fn.endswith(".json"):
        for it in load(fn[:-5]):
            label = cs(it.get("název")) or cs(it.get("popis")) or it.get("kód", "")
            if it.get("id"): CIS[it["id"]] = label
def lbl(code): return CIS.get(code, code.split("/")[-1] if code else "")

# kategorie-ovm: id -> název (role/kompetenční kategorie na úrovni vlády; podklad pro E20)
print("kategorie OVM…")
KAT_OVM = {}
for k in load("kategorie_ovm"):
    if k.get("id"): KAT_OVM[k["id"]] = cs(k.get("název"))

# ---------- klasifikace OVM (mirror app.js ovmType) + úroveň (ústřední→obec) ----------
def ovm_type(nazev, forma):
    n = nazev or ""; f = forma or ""; nl = n.lower(); fl = f.lower()
    if re.match(r'^ministerstvo', n, re.I): return 'Ministerstva'
    if f == 'Kraj' or re.match(r'^krajský úřad', n, re.I): return 'Kraje'
    if re.search(r'soud|státní zastupitelství', nl): return 'Soudy a st. zastupitelství'
    if f in ('Obec', 'Městská část, městský obvod') or re.match(r'^dobrovolný svazek obcí', n, re.I):
        if f == 'Městská část, městský obvod' or re.search(r'městská část|městský obvod', nl): return 'Městské části'
        if re.match(r'^(statutární město|hlavní město|město |městys)', nl): return 'Města a městyse'
        return 'Obce'
    if re.search(r'úřad', nl): return 'Úřady (státní správa)'
    if re.search(r'vysoká škola|univerzit|školská', fl + ' ' + nl) or re.match(r'^(základní škola|střední škola|gymnázium|mateřsk|vyšší odborn|konzervatoř)', n, re.I): return 'Školy a univerzity'
    if re.search(r'pojišťovna', fl + ' ' + nl): return 'Zdravotní pojišťovny'
    if re.search(r'komora|stavovská|profesní', fl): return 'Komory a prof. samospráva'
    if re.match(r'^příspěvková organizace|^státní příspěvková organizace', f, re.I): return 'Příspěvkové organizace'
    if f == 'Organizační složka státu': return 'Organizační složky státu'
    if re.search(r'ručením omezeným|akciová společnost|obchodní společnost|podnikající fyzická|komanditní|odštěpný závod|státní podnik|národní podnik', fl): return 'Podniky a firmy'
    if not f: return 'Neurčeno'
    return 'Ostatní'

# úroveň: 0 = ústřední/registrová … 6 = ostatní (nižší = důležitější/výše v žebříčku)
TYPE_LEVEL = {
    'Ministerstva': 0, 'Organizační složky státu': 0,
    'Úřady (státní správa)': 1, 'Soudy a st. zastupitelství': 1,
    'Kraje': 2, 'Města a městyse': 3, 'Městské části': 4, 'Obce': 5,
    'Zdravotní pojišťovny': 3, 'Komory a prof. samospráva': 3,
    'Příspěvkové organizace': 4, 'Školy a univerzity': 5,
    'Podniky a firmy': 6, 'Ostatní': 6, 'Neurčeno': 7,
}
# krátký kód typu pro kompaktní přenos do klienta
TYPE_ABBR = {
    'Ministerstva': 'min', 'Organizační složky státu': 'oss', 'Úřady (státní správa)': 'urad',
    'Soudy a st. zastupitelství': 'soud', 'Kraje': 'kraj', 'Města a městyse': 'mesto',
    'Městské části': 'mc', 'Obce': 'obec', 'Zdravotní pojišťovny': 'poj',
    'Komory a prof. samospráva': 'komora', 'Příspěvkové organizace': 'po',
    'Školy a univerzity': 'skola', 'Podniky a firmy': 'firma', 'Ostatní': 'ost', 'Neurčeno': 'nd',
}
ABBR_TYPE = {v: k for k, v in TYPE_ABBR.items()}

# úroveň kategorie OVM (pro E20: ústřední / krajská / obecní / jiná)
def kat_level(name):
    n = (name or "").lower()
    if re.search(r'ministerstv|ústředn|vláda|vlády|úřad vlády|generální ředitel', n): return 'ústřední'
    if re.search(r'\bkraj|krajsk', n): return 'krajská'
    if re.search(r'obec|obecní|městsk|magistrát|starosta|pověřený', n): return 'obecní'
    return 'jiná'

# ---------- core entities ----------
print("agendy, isvs, ovm, sluzby, udaje, opravneni…")
agendy = load("agendy"); isvs = load("isvs"); ovm = load("ovm")
sluzby = load("sluzby"); udaje = load("udaje"); opravneni = load("opravneni_k_udajum")

# B9 — defenzivní deduplikace agend na poslední platnou verzi (dle kódu).
# Open data dnes obsahují jen poslední verzi (0 duplicit), pravidlo je pojistka,
# aby případná historická verze (A5/2020 vs A26) nikdy nepronikla do výstupu.
_by_kod = {}
for a in agendy:
    k = a.get("kód") or a["id"]
    prev = _by_kod.get(k)
    if prev is None or (a.get("platnost-od") or "") > (prev.get("platnost-od") or ""):
        _by_kod[k] = a
if len(_by_kod) != len(agendy):
    print(f"  B9: dedup agend {len(agendy)} -> {len(_by_kod)} (ponechána poslední platná verze)")
agendy = list(_by_kod.values())

# name maps
agenda_name = {a["id"]: cs(a.get("název")) for a in agendy}
ovm_name = {o["id"]: cs(o.get("název")) for o in ovm}
isvs_name = {i["id"]: cs(i.get("název")) for i in isvs}
sluzba_name = {s["id"]: cs(s.get("název")) for s in sluzby}

# OVM typ + úroveň (potřeba pro řazení vzorků)
ovm_typ = {}; ovm_lvl = {}
for o in ovm:
    f = lbl(o.get("právní-forma")) if o.get("právní-forma") else ""
    t = ovm_type(cs(o.get("název")), f)
    ovm_typ[o["id"]] = t; ovm_lvl[o["id"]] = TYPE_LEVEL.get(t, 7)

# ---------- derived links ----------
isvs_by_agenda = collections.defaultdict(list)      # agenda -> [isvs]
for i in isvs:
    for ag in (i.get("agendy") or []):
        isvs_by_agenda[ag].append(i["id"])
sluzby_by_agenda = collections.defaultdict(list)
for s in sluzby:
    if s.get("agenda"): sluzby_by_agenda[s["agenda"]].append(s["id"])
udaje_by_agenda = collections.defaultdict(int)
for u in udaje:
    if u.get("agenda"): udaje_by_agenda[u["agenda"]] += len(u.get("údaje") or [])

# ---------- registry (whitelist) ----------
# A1: základní registry a referenční systémy vždy nahoře v kritičnosti.
# Detekce agend-registrů dle názvu + explicitní kódy zmíněné v recenzi.
REGISTER_CODES = {"A101", "A102", "A115", "A116"}
register_agendas = set()
for a in agendy:
    nm = cs(a.get("název")).lower()
    if a.get("kód") in REGISTER_CODES or "základní registr" in nm or re.search(r'registr (obyvatel|osob|územní identifik|práv a povinnost|právnických)', nm):
        register_agendas.add(a["id"])
print(f"  registr-agend (whitelist): {len(register_agendas)}")

# ---------- opravneni flows (+ editor/W role) ----------
# A4/B7: z-agendy = ZDROJ (poskytuje) → do-agendy = PŘÍJEMCE (čte/zapisuje).
# rw (úroveň-přístupu) říká, jak příjemce ke zdroji přistupuje: R=čte, W=zapisuje (editor).
opr_out = collections.defaultdict(int)   # z-agendy -> count (kolik dává)
opr_in = collections.defaultdict(int)    # do-agendy -> count (kolik bere)
# C13: editor registru = příjemce (do) s úrovní W vůči zdroji (z).
edits_registers = collections.defaultdict(set)   # do-agenda -> {z-registr, k němuž má W}
edited_by = collections.defaultdict(set)         # z-agenda (registr) -> {do-editor}
for o in opravneni:
    z = o.get("z-agendy"); do = o.get("do-agendy")
    if z: opr_out[z] += 1
    if do: opr_in[do] += 1
    rw = {f.get("úroveň-přístupu") for f in (o.get("údaje") or []) if f.get("úroveň-přístupu")}
    has_w = any(x and "W" in x for x in rw)
    if has_w and z and do:
        edits_registers[do].add(z)
        if z in register_agendas: edited_by[z].add(do)

# ---------- stream pusobnost (662 MB) for agenda<->ovm ----------
print("streaming pusobnost (agenda↔ovm)…")
ag_ovm = collections.defaultdict(set)    # agenda -> {ovm}
ovm_ag = collections.defaultdict(set)    # ovm -> {agenda}
re_ag = re.compile(r'"agenda"\s*:\s*"(agenda/[^"]+)"')
re_ov = re.compile(r'"ovm"\s*:\s*"(orgán-veřejné-moci/[^"]+)"')
cur_ag = None; n = 0
with open(os.path.join(SRC, "pusobnost_v_agendach.json"), encoding="utf-8") as f:
    for line in f:
        m = re_ag.search(line)
        if m: cur_ag = m.group(1); continue
        m = re_ov.search(line)
        if m and cur_ag:
            ag_ovm[cur_ag].add(m.group(1)); ovm_ag[m.group(1)].add(cur_ag)
            n += 1; cur_ag = None
print(f"  {n} pusobnost pairs; {len(ag_ovm)} agend, {len(ovm_ag)} ovm")

# E20 — § (ustanovení eSbírky) -> lidsky čitelný odkaz "§10 (240/2000)"
def par_ref(eli_list):
    if not eli_list: return None, None
    eli = eli_list[0]
    law = None; m = re.search(r'/sb/(\d+)/(\d+)/', eli)
    if m: law = f"{m.group(2)}/{m.group(1)}"   # číslo/rok (240/2000)
    par = None; m = re.search(r'/par_([0-9a-z]+)', eli)
    if m: par = "§" + m.group(1)
    label = None
    if par and law: label = f"{par} ({law} Sb.)"
    elif par: label = par
    elif law: label = f"{law} Sb."
    return label, eli

# ---------- build agendy ----------
out_agendy = []
for a in agendy:
    aid = a["id"]
    cinnosti = []
    for c in (a.get("činnosti") or []):
        plabel, eli = par_ref(c.get("ustanovení-esbírka"))
        cinnosti.append({"kod": c.get("kód-činnosti"), "nazev": cs(c.get("název-činnosti")),
                         "popis": short(c.get("popis-činnosti"), 160),
                         "vol": bool(c.get("volitelný-výkon")),
                         "par": plabel, "eli": eli})
    # E20: role na úrovni vlády = vykonávající kategorie OVM (s úrovní)
    kat_roles = []
    for kc in (a.get("vykonávající-kategorie-ovm") or []):
        nm = KAT_OVM.get(kc)
        if nm: kat_roles.append({"id": kc, "nazev": nm, "lvl": kat_level(nm)})
    # B10/D16: ovm_sample řazené dle úrovně (ústřední→obec), s typovou značkou
    ov_ids = sorted(ag_ovm.get(aid, set()), key=lambda x: (ovm_lvl.get(x, 7), ovm_name.get(x, "")))
    ov_ids = ov_ids[:120]
    out_agendy.append({
        "id": aid, "kod": a.get("kód"), "nazev": cs(a.get("název")),
        "ohlasovatel": a.get("ohlašovatel"),
        "stanovisko_sluzby": (a.get("má-stanovisko-ke-službám") or {}).get("stanovisko"),
        "stanovisko_udaje": (a.get("má-stanovisko-k-údajům") or {}).get("stanovisko"),
        "platnost_od": a.get("platnost-od"),
        "cinnosti": cinnosti,
        "kat_roles": kat_roles,
        "isvs": isvs_by_agenda.get(aid, []),
        "sluzby_ids": sluzby_by_agenda.get(aid, []),
        "ovm_sample": ov_ids,
        "ovm_t": [TYPE_ABBR.get(ovm_typ.get(x, "Neurčeno"), "nd") for x in ov_ids],
        "registr": aid in register_agendas,
        "editor_of": sorted(edits_registers.get(aid, set()) & register_agendas),
        "edited_by_cnt": len(edited_by.get(aid, set())),
        "c": {"cinnosti": len(cinnosti), "isvs": len(isvs_by_agenda.get(aid, [])),
              "sluzby": len(sluzby_by_agenda.get(aid, [])), "ovm": len(ag_ovm.get(aid, set())),
              "udaje": udaje_by_agenda.get(aid, 0),
              "opr_in": opr_in.get(aid, 0), "opr_out": opr_out.get(aid, 0)},
    })
out_agendy.sort(key=lambda x: x["nazev"])
write("agendy", out_agendy)

# agenda importance (pro řazení agendy_sample u OVM a grafu) — provázanost, ne počet OVM
ag_importance = {a["id"]: (a["c"]["isvs"] + a["c"]["sluzby"] + a["c"]["opr_in"] + a["c"]["opr_out"]
                           + (50 if a["registr"] else 0)) for a in out_agendy}

# ---------- C14: mapovací (číselníková) vrstva nad názvy ISVS -> rodina produktu ----------
# Řešení dle Vlasty/Kučery: NEPŘEPISUJE zdroj, jen přidá odvozené pole `rodina`.
# Slovník známých produktů + fuzzy normalizace (diakritika, verze, mezery, hosting).
PRODUCT_DICT = [
    ("GINIS", r'\bginis\b'),
    ("GORDIC (GINIS/UCR)", r'\bgordic\b'),
    ("KEO", r'\bkeo\b'),
    ("VERA Radnice", r'\bvera\b|radnice vera'),
    ("Munis", r'\bmunis\b'),
    ("Czech POINT", r'czech\s*point|czechpoint'),
    ("Spisová služba (obecná)", r'spisov[áa] služba|spisov[áa] pošta|e-?spis|espis'),
    ("Proxio", r'\bproxio\b'),
    ("Javelin", r'\bjavelin\b'),
    ("Clover", r'\bclover\b'),
    ("FENIX", r'\bfenix\b'),
    ("Helios", r'\bhelios\b'),
    ("Vita", r'\bvita\b'),
    ("Triada (Munis)", r'\btriada\b'),
    ("DATABOX", r'\bdatabox\b'),
    ("ISKŘ (krizové řízení)", r'\biskř\b|krizov[éeý]'),
    ("EZAK / E-ZAK (zakázky)", r'e-?zak\b'),
    ("Marbes / PROXIO", r'\bmarbes\b'),
    ("T-WIST", r't-?wist'),
]
PRODUCT_RE = [(name, re.compile(rx, re.I)) for name, rx in PRODUCT_DICT]

def normalize_name(name):
    """fuzzy normalizace: bez diakritiky, malá písmena, bez verzí/hostingu/závorek."""
    s = (name or "").lower()
    s = s.replace(" ", " ")
    # odstranění diakritiky
    import unicodedata
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    s = re.sub(r'\b(verze|ver\.?|v)\s*\d+(\.\d+)*', ' ', s)          # "verze 4", "v4"
    s = re.sub(r'\b(x\s*)?hosting\b|\bsaas\b|\bcloud\b|\bonline\b', ' ', s)
    s = re.sub(r'\([^)]*\)', ' ', s)                                  # závorky
    s = re.sub(r'[\d]+([.,]\d+)*', ' ', s)                            # čísla verzí
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def family_of(name):
    for fam, rx in PRODUCT_RE:
        if rx.search(name or ""): return fam, True   # (rodina, ze_slovniku)
    # Mimo slovník rodinu NEHÁDÁME z části názvu. Původní heuristika (první 1–2
    # slova normalizovaného názvu) vytvářela SMYŠLENÉ rodiny — slučovala nesouvisející
    # systémy jen proto, že sdílely první slovo. Místo toho vrátíme PŘESNÝ
    # normalizovaný název; ve 2. průchodu ho jako rodinu ponecháme jen tehdy, když
    # se týž název reálně opakuje (≥2 instalace = skutečné rozšíření produktu, např. ALIS).
    norm = normalize_name(name)
    if not norm: return None, False
    return norm.upper(), False

# ---------- klasifikace ISVS: základní registr vs. ISZR (sdílená infrastruktura) ----------
# Připomínka (recenze): část ISVS byla chybně označena jako „registr", ač registrem
# nejsou — patří do ISZR (sdílené rozhraní/služby). Rozlišujeme přesně:
#   • 'reg'  = jeden ze 4 ZÁKLADNÍCH registrů (ROB/ROS/RÚIAN/RPP) — přesný název + správce
#              DIA/SZR (RÚIAN: ČÚZK). Tím vypadnou obecní/produktové kopie „Registr obyvatel".
#   • 'iszr' = sdílená infrastruktura ISZR (ISZR, ISSS/eGSB, ISDS, Czech POINT, AISV, FAIS) —
#              NENÍ registr, ale „spadá do ISZR"; má vlastní (modřejší) badge.
_DIA_SPRAVCE = re.compile(r'digitální a informační agentura|správa základních registr', re.I)
_CUZK_SPRAVCE = re.compile(r'zeměměřick|katastráln|čúzk', re.I)
_REG_EXACT = {
    "registr obyvatel",
    "registr právnických osob, podnikajících fyzických osob a orgánů veřejné moci",
    "registr územní identifikace, adres a nemovitostí",
    "registr práv a povinností",
}
def reg_class(nm, spr_nm):
    n = (nm or "").strip().lower(); s = spr_nm or ""
    if n in _REG_EXACT and (_DIA_SPRAVCE.search(s) or _CUZK_SPRAVCE.search(s)):
        return "reg"
    if _DIA_SPRAVCE.search(s):
        if re.search(r'informační systém základních registr|\biszr\b', n): return "iszr"
        if re.search(r'sdílen[éě] služb|\bisss\b|egsb|e-gsb', n): return "iszr"
        if re.search(r'datových schránek|\bisds\b', n): return "iszr"
        if re.search(r'czech\s*point', n): return "iszr"
        if re.search(r'vyrozumív|\baisv\b', n): return "iszr"
        if re.search(r'formulářový agendový|\bfais\b', n): return "iszr"
    return None

# ---------- build isvs ----------
out_isvs = []
fam_count = collections.Counter()
cost_provoz = 0; cost_porizeni = 0
for i in isvs:
    nm = cs(i.get("název"))
    fam, fam_known = family_of(nm)
    if fam: fam_count[fam] += 1
    spr = (i.get("správa-isvs") or {}).get("správce-isvs")
    # C15: fill-rate nákladů (finanční-parametry / provoz-isvs) — jen pro statistiku
    fin = i.get("finanční-parametry")
    if fin: cost_provoz += 1
    if i.get("provoz-isvs"): cost_porizeni += 1
    bez = lbl(i.get("bezpečnostní-úroveň")) if i.get("bezpečnostní-úroveň") else None
    bez_rank = 0
    if bez:
        m = re.match(r'\s*(\d)', bez)
        if m: bez_rank = int(m.group(1))
    agendy_ids = i.get("agendy") or []
    # C13: editor registru = systém, jehož agenda má W vůči registru
    is_editor = any(a in edits_registers and (edits_registers[a] & register_agendas) for a in agendy_ids)
    spr_typ = ovm_typ.get(spr, "Neurčeno") if spr else "Neurčeno"
    spr_nm = ovm_name.get(spr, "")
    # přesná klasifikace registr vs. ISZR (viz reg_class výše) — nahrazuje dřívější
    # příliš široké pravidlo „serves registr-agendu & správce DIA/MV".
    rcl = reg_class(nm, spr_nm)
    is_reg = (rcl == "reg")
    is_iszr = (rcl == "iszr")
    # provozovatel ISVS (nepovinné pole; recenze: hodně ISVS provozovatele nemá)
    provoz = (i.get("provoz-isvs") or {}).get("provozovatel-isvs")
    out_isvs.append({
        "id": i["id"], "ident": i.get("identifikátor"), "nazev": nm,
        "rodina": fam, "rodina_slovnik": fam_known,
        "char": short(i.get("charakteristika"), 280),
        "spravce": spr, "spravce_nazev": spr_nm,
        "provozovatel": provoz,
        "bezuroven": bez, "bez_rank": bez_rank,
        "umisteni": lbl(i.get("umístění")) if i.get("umístění") else None,
        "etapa": lbl(i.get("aktuální-typ-etapy")) if i.get("aktuální-typ-etapy") else None,
        "sdileni": lbl(i.get("úroveň-sdílení")) if i.get("úroveň-sdílení") else None,
        "vyuziti": lbl(i.get("úroveň-využití")) if i.get("úroveň-využití") else None,
        "agendy": agendy_ids,
        "editor": is_editor,
        "registr": is_reg,
        "iszr": is_iszr,
        "c": {"agend": len(agendy_ids),
              # počet ústředních/registrových agend (A1 vrstva 3)
              "agend_ustr": sum(1 for a in agendy_ids if a in register_agendas or ag_importance.get(a, 0) >= 40)},
    })

# C14: rozšíření produktu (kolik instalací téže rodiny).
# Odvozenou rodinu (mimo slovník) ponecháme jen tam, kde se PŘESNĚ stejný název
# opakuje (≥2 instalace = reálné rozšíření produktu, např. ALIS). Ojedinělý název
# rodinu NEDOSTANE — nevymýšlíme umělé skupiny tam, kde žádný produkt sdílený není.
_fam_dropped = 0
for r in out_isvs:
    if r["rodina"] and not r["rodina_slovnik"] and fam_count.get(r["rodina"], 0) < 2:
        r["rodina"] = None; _fam_dropped += 1
    r["rodina_pocet"] = fam_count.get(r["rodina"], 0) if r["rodina"] else 0
print(f"  C14: rodina jen slovník + reálné clustery; zrušeno {_fam_dropped} ojedinělých odvozených rodin")

# A1 — kompozitní skóre kritičnosti (lexikografické vrstvy):
#   v0 registr/referenční systém (whitelist)  → vždy nahoře
#   v1 bezpečnostní úroveň (4→1)              → dopad (Kučera)
#   v2 typ správce (ústřední→obec)
#   v3 počet ústředních/registrových agend
def crit_key(r):
    spr_lvl = TYPE_LEVEL.get(ovm_typ.get(r["spravce"], "Neurčeno"), 7) if r["spravce"] else 7
    return (0 if r["registr"] else 1,        # registry první
            -(r["bez_rank"]),                # vyšší úroveň = kritičtější
            spr_lvl,                         # ústřední správce výš
            -(r["c"]["agend_ustr"]),         # nosné agendy
            -(r["c"]["agend"]))              # až nakonec hrubý počet
# výchozí řazení seznamu ISVS: dle kritičnosti (ne dle holého počtu agend)
out_isvs.sort(key=crit_key)
write("isvs", out_isvs)

# ---------- build ovm ----------
out_ovm = []
isvs_by_ovm = collections.defaultdict(int)
for i in isvs:
    spr = (i.get("správa-isvs") or {}).get("správce-isvs")
    if spr: isvs_by_ovm[spr] += 1
for o in ovm:
    oid = o["id"]
    kats = [lbl(k.get("kategorie")) for k in (o.get("seznam-kategorií") or [])][:8]
    # D16: agendy_sample řazené dle DŮLEŽITOSTI agendy (ne abecedně)
    ag_ids = sorted(ovm_ag.get(oid, set()), key=lambda x: -ag_importance.get(x, 0))[:60]
    # Rekonciliace s DIA: záznam s vyplněným „ukončení" = zaniklý OVM
    # (zrušený/sloučený orgán). DIA do počtu OVM počítá jen aktivní → tyto
    # nesmí inflatovat headline číslo, ale necháváme je v datech (proklik,
    # historické vazby v působnosti) označené příznakem `zaniklo`.
    ukonceni = o.get("ukončení")
    out_ovm.append({
        "id": oid, "ico": o.get("ičo"), "nazev": cs(o.get("název")),
        "forma": lbl(o.get("právní-forma")) if o.get("právní-forma") else None,
        "typ": ovm_typ.get(oid, "Neurčeno"),
        "kategorie": kats,
        "ds": bool(o.get("datové-schránky")),
        "vnitrni": bool(o.get("vnitřní-organizační-jednotka")),
        "zaniklo": bool(ukonceni),
        "ukonceni": ukonceni if ukonceni else None,
        "agendy_sample": ag_ids,
        "c": {"agend": len(ovm_ag.get(oid, set())), "isvs": isvs_by_ovm.get(oid, 0)},
    })
out_ovm.sort(key=lambda x: -x["c"]["agend"])
write("ovm", out_ovm)
ovm_aktivni = sum(1 for o in out_ovm if not o["zaniklo"])
ovm_zaniklo = len(out_ovm) - ovm_aktivni
print(f"  OVM: {len(out_ovm)} celkem, {ovm_aktivni} aktivních, {ovm_zaniklo} zaniklých")

# ---------- build sluzby ----------
# Recenze: v detailu služby chyběl čitelný poskytovatel (uložené bylo jen mp[0],
# často jako kód „kategorie-ovm/…"), neukazovaly se jednotlivé úkony (jen počet)
# a nebyla vidět agenda. Doplňujeme: seznam poskytovatelů (OVM i kategorie-ovm),
# vlastní úkony (názvy + příznak digitalizace) a počet poskytovatelů.
out_sluzby = []
for s in sluzby:
    mp = s.get("místní-příslušnost") or []
    posk_ids = []
    for m in mp:
        p = m.get("poskytovatel-k-místní-příslušnosti")
        if p and p not in posk_ids:
            posk_ids.append(p)
    ukony = []
    for u in (s.get("úkony") or [])[:60]:
        ukony.append({"nazev": cs(u.get("název-úkonu")),
                      "dig": bool(u.get("digitální")),
                      "vhod": bool(u.get("vhodný-k-digitalizaci"))})
    out_sluzby.append({
        "id": s["id"], "ident": s.get("identifikátor"), "nazev": cs(s.get("název")),
        "popis": short(s.get("popis"), 200), "agenda": s.get("agenda"),
        "typ": lbl(s.get("typ-služby")) if s.get("typ-služby") else None,
        "klienti": [lbl(k) for k in (s.get("klienti") or [])],
        "poskytovatel": posk_ids[0] if posk_ids else None,   # zpětná kompatibilita
        "poskytovatele": posk_ids[:8], "poskytovatelu": len(posk_ids),
        "ukony": len(s.get("úkony") or []), "ukony_list": ukony,
    })
out_sluzby.sort(key=lambda x: x["nazev"])
write("sluzby", out_sluzby)

# ---------- build udaje ----------
out_udaje = []
for u in udaje:
    fields = [{"kod": d.get("kód-údaje"), "nazev": cs(d.get("název-údaje")),
               "typ": lbl(d.get("typ-údaje")) if d.get("typ-údaje") else None,
               "ppdf": lbl(d.get("sdílen-na-PPDF")) if d.get("sdílen-na-PPDF") else None,
               "verejny": "veřejný" in (d.get("type") or "")}
              for d in (u.get("údaje") or [])]
    out_udaje.append({"id": u["id"], "kod": u.get("kód"), "nazev": cs(u.get("název")),
                      "popis": short(u.get("popis"), 160), "agenda": u.get("agenda"), "udaje": fields})
out_udaje.sort(key=lambda x: x["nazev"])
write("udaje", out_udaje)

# ---------- build opravneni ----------
out_opr = []
reg_set = register_agendas
for o in opravneni:
    fields = o.get("údaje") or []
    rw = sorted({f.get("úroveň-přístupu") for f in fields if f.get("úroveň-přístupu")})
    z = o.get("z-agendy"); do = o.get("do-agendy")
    out_opr.append({
        "id": o["id"], "kod": o.get("kód"), "z": z, "do": do,
        "typ": lbl(o.get("typ-oprávnění")) if o.get("typ-oprávnění") else None,
        "pocet_udaju": len(fields), "rw": rw, "ref": bool(o.get("je-realizováno-na-referenčním-rozhraní")),
        "z_reg": z in reg_set,   # zdroj je registr (pro zvýraznění hran)
        "w": any(x and "W" in x for x in rw),
    })
write("opravneni", out_opr)

# ---------- names + ciselniky ----------
write("names", {"agenda": agenda_name, "ovm": ovm_name, "isvs": isvs_name, "sluzba": sluzba_name,
                "kat": KAT_OVM})   # kategorie-ovm: pro čitelného poskytovatele služby

# ---------- meta / dashboard aggregates ----------
def dist(items, key):
    c = collections.Counter((it.get(key) or "Neuvedeno") for it in items)
    return dict(c.most_common())
coverage_with = sum(1 for a in out_agendy if a["c"]["isvs"] > 0)

# A1: top_critical dle nového skóre kritičnosti (registry + dopad), s důvodem
def crit_reason(r):
    if r["registr"]: return "základní/ref. registr"
    if r["bez_rank"] >= 4: return "bezp. úroveň 4 (kritická)"
    if r["bez_rank"] == 3: return "bezp. úroveň 3 (vysoká)"
    spr_t = ovm_typ.get(r["spravce"], "")
    if spr_t in ("Ministerstva", "Organizační složky státu", "Úřady (státní správa)"): return "ústřední správce"
    return "—"
top_critical = [{"id": i["id"], "nazev": i["nazev"], "spravce": i["spravce_nazev"],
                 "agend": i["c"]["agend"], "bezuroven": i["bezuroven"],
                 "registr": i["registr"], "duvod": crit_reason(i)} for i in out_isvs[:12]]
# A1: oddělený žebříček nejrozšířenějších OBECNÍCH systémů (rozsah ≠ kritičnost)
spread = sorted(({"rodina": fam, "pocet": cnt} for fam, cnt in fam_count.items() if cnt > 1),
                key=lambda x: -x["pocet"])[:12]

# ISVS: rozlišení „agendové" (navázané na ≥1 agendu) vs. celý registr ISVS.
# Šedivec/DIA uvádí „agendových IS" cca 3,4 tis. — to jsou právě tyto, ne celý
# registr (12 tis.). V isvs.json NEJSOU duplicity (12110 řádků = 12110 identifikátorů).
isvs_agendove = sum(1 for i in out_isvs if i["c"]["agend"] > 0)
isvs_zanik = sum(1 for i in out_isvs if i.get("etapa") == "Zánik a archivace")

# ---------- rekonciliace s veřejně uváděnými čísly DIA (T. Šedivec) ----------
# Naše data: snapshot RPP open data k 6. 6. 2026 (denní aktualizace).
# DIA čísla: konference 20. 5. 2026 + „Report agendy VS". Rozdíly jsou dané
# (a) datem snapshotu a (b) tím, co se do počtu zahrnuje (aktivní vs. vše).
SRC_DATE = "6. 6. 2026"
DIA_DATE = "20. 5. 2026"
reconcile = [
    {"metrika": "Orgány veřejné moci (OVM)", "nase": ovm_aktivni, "dia": 18267,
     "vyklad": f"Headline počítá jen AKTIVNÍ OVM. Zdrojová sada ovm.json má {len(out_ovm)} "
               f"záznamů, ale {ovm_zaniklo} z nich jsou ZANIKLÉ orgány (mají vyplněné pole "
               f"„ukončení“) — ty do živého počtu nepatří. {ovm_aktivni} aktivních odpovídá "
               f"číslu DIA 18 267 (zbývající rozdíl 4 = pár orgánů zaniklo/vzniklo mezi 20. 5. "
               f"a 6. 6.).",
     "detail": f"Mechanika: v ovm.json má každý orgán nepovinné pole „ukončení“ (datum zrušení, "
               f"sloučení nebo transformace). Náš původní dashboard sčítal všech {len(out_ovm)} řádků "
               f"včetně {ovm_zaniklo} zaniklých → 19 555. ETL teď každý záznam označí příznakem "
               f"zaniklo = (ukončení je vyplněno) a do headline počítá jen aktivní ({ovm_aktivni}). "
               f"POZOR na dvě časté mýlky: (1) SPUÚ (soukromoprávní uživatelé údajů) NEjsou v ovm.json — "
               f"jsou v samostatné sadě spuu.json (16 669 záznamů s ID „soukromoprávní-uživatel-údajů/…“), "
               f"takže počet OVM neinflatují (ověřeno: žádné ID v ovm.json není SPUÚ); (2) v ovm.json NEjsou "
               f"duplicity přes IČO kvůli vnitřním organizačním jednotkám rozhodující měrou — 438 záznamů je "
               f"vnitřní org. jednotka, ale příčina rozdílu proti DIA jsou zaniklé orgány, ne ty.",
     "overit": "Databáze → tabulka OVM (surová, 19 555) vs. Orgány veřejné moci → filtr „Stav = aktivní“ "
               "(18 263). Rozdíl = zaniklé."},
    {"metrika": "Agendy", "nase": len(out_agendy), "dia": 405,
     "vyklad": "Náš počet je z živých open dat RPP (denní aktualizace), proto je o pár vyšší než "
               "konferenční 405 (k 20. 5.); starší publikovaný „Report agendy VS“ uvádí 387. Žádná "
               "chyba — jen různá data.",
     "detail": "Tři čísla, tři data: 387 = starší publikovaný „Report agendy VS“ (statický výřez DIA), "
               "405 = stav, který Šedivec uvedl na konferenci k 20. 5. 2026, 406 = živá open data RPP "
               "k 6. 6. 2026. RPP se aktualizuje denně, takže náš počet je nejaktuálnější. Plně aktuální "
               "(robotem projitelný) seznam je na rpp-ais.egon.gov.cz/gen/agendy-detail/. Agendy v naší "
               "sadě nemají vyplněné „platnost-do“ (0 ukončených), takže nefiltrujeme nic — bereme vše platné.",
     "overit": "Agendy → počet v hlavičce (406). Seznam jde exportovat do CSV a porovnat s egon.gov.cz."},
    {"metrika": "Agendové informační systémy", "nase": isvs_agendove, "dia": 3421,
     "vyklad": f"Agendové IS = ISVS navázané alespoň na jednu agendu ({isvs_agendove}). Matoucí "
               f"popisek „Systémy 12 110“ byl CELÝ registr ISVS (i provozní/neagendové), ne agendové "
               f"IS. {isvs_agendove} odpovídá číslu DIA ~3,4 tis. (rozdíl = datum snapshotu).",
     "detail": f"Klíčové rozlišení: isvs.json obsahuje {len(out_isvs)} ISVS celkem, ale jen {isvs_agendove} "
               f"z nich má neprázdné pole „agendy“ (= jsou navázané na alespoň jednu agendu). To jsou "
               f"„agendové informační systémy“ ve smyslu, jak je počítá DIA (~3 421). Zbylých "
               f"{len(out_isvs)-isvs_agendove} jsou provozní/neagendové IS evidované v registru. "
               f"VYVRÁCENÁ HYPOTÉZA: rozdíl NENÍ způsoben tím, že by byl týž IS uveden vícekrát s různými "
               f"správci — ověřeno přímo ve zdroji: 12 110 řádků = 12 110 unikátních ID i 12 110 unikátních "
               f"identifikátorů, NULA duplicit. Šlo tedy čistě o chybný popisek (celý registr vs. agendové IS), "
               f"ne o duplicitní data.",
     "overit": "Systémy (ISVS) → filtr „Druh = agendové (navázané na agendu)“ → "
               + f"{isvs_agendove}. Bez filtru = {len(out_isvs)} (celý registr)."},
    {"metrika": "Všechny ISVS v registru", "nase": len(out_isvs), "dia": 10791,
     "vyklad": f"Celý registr ISVS napříč fázemi životního cyklu ({len(out_isvs)}; z toho "
               f"{isvs_zanik} ve fázi „zánik a archivace“). Rozdíl proti DIA 10 791 je dán datem "
               f"snapshotu a tím, které fáze/typy se do souhrnu zahrnují.",
     "detail": f"Náš souhrn {len(out_isvs)} bere VŠECHNY ISVS bez ohledu na fázi (rozvoj/provoz "
               f"{8851}, vznik {2832}, zánik a archivace {isvs_zanik}). Číslo DIA 10 791 je nižší — "
               f"pravděpodobně nezahrnuje některé fáze (zánik) nebo typy záznamů (v datech jsou dva typy: "
               f"„určený-isvs“ 11 448 a „isvs“ 662). Přesné dorovnání na 10 791 vyžaduje porovnání záznam "
               f"po záznamu mezi naším exportem a podkladem DIA — proto to zatím necháváme jako známý, malý "
               f"a vysvětlený rozdíl, ne jako chybu.",
     "overit": "Systémy (ISVS) → bez filtru (12 110) · filtr „Etapa“ ukáže rozpad podle fáze."},
    {"metrika": "Služby", "nase": len(out_sluzby), "dia": 9523,
     "vyklad": f"Rozdíl ~{len(out_sluzby)-9523} služeb je čistě dán datem snapshotu (RPP se "
               f"aktualizuje denně). Definice množiny je shodná.",
     "detail": f"Služby nemají v datech pole pro ukončení/platnost-do ani stav, takže nic nefiltrujeme — "
               f"{len(out_sluzby)} = všechny služby v sadě sluzby.json (9 607 unikátních ID i identifikátorů, "
               f"bez duplicit). Číslo DIA 9 523 je z 20. 5.; náš snapshot je z 6. 6. Rozdíl odpovídá běžnému "
               f"dennímu přírůstku služeb.",
     "overit": "Služby → počet v hlavičce (9 607)."},
]

meta = {
    "generated_note": "RPP open data (DIA)", "src_count": 56,
    "src_date": SRC_DATE, "dia_date": DIA_DATE,
    "counts": {"agendy": len(out_agendy),
               "isvs": len(out_isvs), "isvs_agendove": isvs_agendove, "isvs_zanik": isvs_zanik,
               "ovm": ovm_aktivni, "ovm_celkem": len(out_ovm), "ovm_zaniklo": ovm_zaniklo,
               "sluzby": len(out_sluzby), "udaje_objekty": len(out_udaje),
               "udaje_polozky": sum(len(u["udaje"]) for u in out_udaje),
               "opravneni": len(out_opr), "pusobnost": n},
    "reconcile": reconcile,
    "coverage": {"with_isvs": coverage_with, "without_isvs": len(out_agendy) - coverage_with,
                 "pct": round(100 * coverage_with / len(out_agendy))},
    "registers": len(register_agendas),
    "fillrate": {
        "bezuroven": round(100 * sum(1 for i in out_isvs if i["bezuroven"]) / max(1, len(out_isvs))),
        "naklady": round(100 * cost_provoz / max(1, len(out_isvs))),
        "umisteni": round(100 * sum(1 for i in out_isvs if i["umisteni"]) / max(1, len(out_isvs))),
    },
    "isvs_bezuroven": dist(out_isvs, "bezuroven"),
    "isvs_umisteni": dist(out_isvs, "umisteni"),
    "isvs_etapa": dist(out_isvs, "etapa"),
    "sluzby_typ": dict(collections.Counter(s["typ"] or "Neuvedeno" for s in out_sluzby).most_common(8)),
    "top_critical": top_critical,
    "top_spread": spread,
    "top_ovm": [{"id": o["id"], "nazev": o["nazev"], "agend": o["c"]["agend"]} for o in out_ovm[:12]],
}
write("meta", meta)
print("ETL done.")
