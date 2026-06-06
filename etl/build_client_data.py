#!/usr/bin/env python3
"""ETL: RPP open-data JSON -> compact client JSON for the RPP Explorer SPA."""
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

# ---------- core entities ----------
print("agendy, isvs, ovm, sluzby, udaje, opravneni…")
agendy = load("agendy"); isvs = load("isvs"); ovm = load("ovm")
sluzby = load("sluzby"); udaje = load("udaje"); opravneni = load("opravneni_k_udajum")

# name maps
agenda_name = {a["id"]: cs(a.get("název")) for a in agendy}
ovm_name = {o["id"]: cs(o.get("název")) for o in ovm}
isvs_name = {i["id"]: cs(i.get("název")) for i in isvs}
sluzba_name = {s["id"]: cs(s.get("název")) for s in sluzby}

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

# opravneni flows
opr_out = collections.defaultdict(int)   # z-agendy -> count
opr_in = collections.defaultdict(int)    # do-agendy -> count
for o in opravneni:
    if o.get("z-agendy"): opr_out[o["z-agendy"]] += 1
    if o.get("do-agendy"): opr_in[o["do-agendy"]] += 1

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

# ---------- build agendy ----------
out_agendy = []
for a in agendy:
    aid = a["id"]
    cinnosti = [{"kod": c.get("kód-činnosti"), "nazev": cs(c.get("název-činnosti")),
                 "popis": short(c.get("popis-činnosti"), 160),
                 "vol": bool(c.get("volitelný-výkon"))}
                for c in (a.get("činnosti") or [])]
    out_agendy.append({
        "id": aid, "kod": a.get("kód"), "nazev": cs(a.get("název")),
        "ohlasovatel": a.get("ohlašovatel"),
        "stanovisko_sluzby": (a.get("má-stanovisko-ke-službám") or {}).get("stanovisko"),
        "stanovisko_udaje": (a.get("má-stanovisko-k-údajům") or {}).get("stanovisko"),
        "platnost_od": a.get("platnost-od"),
        "cinnosti": cinnosti,
        "isvs": isvs_by_agenda.get(aid, []),
        "sluzby_ids": sluzby_by_agenda.get(aid, []),
        "ovm_sample": sorted(ag_ovm.get(aid, set()))[:60],
        "c": {"cinnosti": len(cinnosti), "isvs": len(isvs_by_agenda.get(aid, [])),
              "sluzby": len(sluzby_by_agenda.get(aid, [])), "ovm": len(ag_ovm.get(aid, set())),
              "udaje": udaje_by_agenda.get(aid, 0),
              "opr_in": opr_in.get(aid, 0), "opr_out": opr_out.get(aid, 0)},
    })
out_agendy.sort(key=lambda x: x["nazev"])
write("agendy", out_agendy)

# ---------- build isvs ----------
out_isvs = []
for i in isvs:
    spr = (i.get("správa-isvs") or {}).get("správce-isvs")
    out_isvs.append({
        "id": i["id"], "ident": i.get("identifikátor"), "nazev": cs(i.get("název")),
        "char": short(i.get("charakteristika"), 280),
        "spravce": spr, "spravce_nazev": ovm_name.get(spr, ""),
        "bezuroven": lbl(i.get("bezpečnostní-úroveň")) if i.get("bezpečnostní-úroveň") else None,
        "umisteni": lbl(i.get("umístění")) if i.get("umístění") else None,
        "etapa": lbl(i.get("aktuální-typ-etapy")) if i.get("aktuální-typ-etapy") else None,
        "sdileni": lbl(i.get("úroveň-sdílení")) if i.get("úroveň-sdílení") else None,
        "vyuziti": lbl(i.get("úroveň-využití")) if i.get("úroveň-využití") else None,
        "agendy": i.get("agendy") or [],
        "c": {"agend": len(i.get("agendy") or [])},
    })
out_isvs.sort(key=lambda x: -x["c"]["agend"])
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
    out_ovm.append({
        "id": oid, "ico": o.get("ičo"), "nazev": cs(o.get("název")),
        "forma": lbl(o.get("právní-forma")) if o.get("právní-forma") else None,
        "kategorie": kats,
        "ds": bool(o.get("datové-schránky")),
        "vnitrni": bool(o.get("vnitřní-organizační-jednotka")),
        "agendy_sample": sorted(ovm_ag.get(oid, set()))[:60],
        "c": {"agend": len(ovm_ag.get(oid, set())), "isvs": isvs_by_ovm.get(oid, 0)},
    })
out_ovm.sort(key=lambda x: -x["c"]["agend"])
write("ovm", out_ovm)

# ---------- build sluzby ----------
out_sluzby = []
for s in sluzby:
    posk = None
    mp = s.get("místní-příslušnost") or []
    if mp: posk = mp[0].get("poskytovatel-k-místní-příslušnosti")
    out_sluzby.append({
        "id": s["id"], "ident": s.get("identifikátor"), "nazev": cs(s.get("název")),
        "popis": short(s.get("popis"), 200), "agenda": s.get("agenda"),
        "typ": lbl(s.get("typ-služby")) if s.get("typ-služby") else None,
        "klienti": [lbl(k) for k in (s.get("klienti") or [])],
        "poskytovatel": posk, "ukony": len(s.get("úkony") or []),
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
for o in opravneni:
    fields = o.get("údaje") or []
    rw = sorted({f.get("úroveň-přístupu") for f in fields if f.get("úroveň-přístupu")})
    out_opr.append({
        "id": o["id"], "kod": o.get("kód"), "z": o.get("z-agendy"), "do": o.get("do-agendy"),
        "typ": lbl(o.get("typ-oprávnění")) if o.get("typ-oprávnění") else None,
        "pocet_udaju": len(fields), "rw": rw, "ref": bool(o.get("je-realizováno-na-referenčním-rozhraní")),
    })
write("opravneni", out_opr)

# ---------- names + ciselniky ----------
write("names", {"agenda": agenda_name, "ovm": ovm_name, "isvs": isvs_name, "sluzba": sluzba_name})

# ---------- meta / dashboard aggregates ----------
def dist(items, key):
    c = collections.Counter((it.get(key) or "Neuvedeno") for it in items)
    return dict(c.most_common())
coverage_with = sum(1 for a in out_agendy if a["c"]["isvs"] > 0)
meta = {
    "generated_note": "RPP open data (DIA)", "src_count": 56,
    "counts": {"agendy": len(out_agendy), "isvs": len(out_isvs), "ovm": len(out_ovm),
               "sluzby": len(out_sluzby), "udaje_objekty": len(out_udaje),
               "udaje_polozky": sum(len(u["udaje"]) for u in out_udaje),
               "opravneni": len(out_opr), "pusobnost": n},
    "coverage": {"with_isvs": coverage_with, "without_isvs": len(out_agendy) - coverage_with,
                 "pct": round(100 * coverage_with / len(out_agendy))},
    "isvs_bezuroven": dist(out_isvs, "bezuroven"),
    "isvs_umisteni": dist(out_isvs, "umisteni"),
    "isvs_etapa": dist(out_isvs, "etapa"),
    "sluzby_typ": dict(collections.Counter(s["typ"] or "Neuvedeno" for s in out_sluzby).most_common(8)),
    "top_critical": [{"id": i["id"], "nazev": i["nazev"], "spravce": i["spravce_nazev"],
                      "agend": i["c"]["agend"], "bezuroven": i["bezuroven"]} for i in out_isvs[:12]],
    "top_ovm": [{"id": o["id"], "nazev": o["nazev"], "agend": o["c"]["agend"]} for o in out_ovm[:12]],
}
write("meta", meta)
print("ETL done.")
