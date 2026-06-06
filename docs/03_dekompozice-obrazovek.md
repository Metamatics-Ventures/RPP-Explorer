# 03 — Dekompozice do obrazovek (sitemap & navigace)

## Navigační model

Trvalá levá navigace + globální vyhledávací pole nahoře (vždy dostupné) + drobečková navigace (breadcrumbs). Každý odkaz na entitu je klikací → detail. Princip: **z každého místa se prokliknu kamkoliv**.

```
┌─ Topbar: 🔍 globální hledání ........................ [export] [?] ┐
├─ Sidebar ──────────┬─ Obsah ─────────────────────────────────────┤
│ ▸ Dashboard        │                                              │
│ ▸ Agendy           │   (obrazovka podle výběru)                   │
│ ▸ Orgány (OVM)     │                                              │
│ ▸ Systémy (ISVS)   │                                              │
│ ▸ Služby           │                                              │
│ ▸ Údaje            │                                              │
│ ▸ Oprávnění/Toky   │                                              │
│ ▸ Graf vazeb       │                                              │
│ ▸ Dopady & kaskády │                                              │
│ ▸ Analytika        │                                              │
│ ▸ Srovnání         │                                              │
└────────────────────┴──────────────────────────────────────────────┘
```

## Sitemap

```
/                              Dashboard (přehled + klíčové metriky)
/agendy                        Seznam agend (tabulka + filtry)
/agendy/:id                    Detail agendy
/ovm                           Seznam orgánů
/ovm/:id                       Detail orgánu (profil úřadu)
/isvs                          Seznam informačních systémů
/isvs/:id                      Detail systému
/sluzby                        Seznam služeb
/sluzby/:id                    Detail služby
/udaje                         Katalog údajů (objekty + údaje)
/udaje/:id                     Detail údaje/objektu
/opravneni                     Toky údajů (matice + seznam)
/opravneni/:id                 Detail oprávnění (z-agendy→do-agendy, údaje R/W)
/graf                          Interaktivní průzkumník grafu
/graf?node=:id                 Graf s předvybraným uzlem
/dopady                        Dopadová / kaskádová analýza (domeček z karet)
/dopady?node=:id               Propagace výpadku z konkrétního uzlu
/krizovy-balik                 Sestavení znalostní báze pro scénář (CROP)
/analytika                     Analytické sestavy (pokrytí, kritičnost, digitalizace)
/srovnani                      Srovnání entit vedle sebe
/hledat?q=...                  Výsledky globálního vyhledávání
```

## Tři typy obrazovek

1. **Seznamové (list/index)** — tabulka entit s filtry, řazením, fasetami, exportem. (agendy, ovm, isvs, sluzby, udaje)
2. **Detailní (entity profile)** — karta jedné entity se všemi atributy + záložkami navázaných entit. (`/…/:id`)
3. **Analytické / průřezové** — Dashboard, Analytika, Toky údajů, Graf, Srovnání.

## Společné prvky (na všech obrazovkách)
- **Breadcrumbs** — návrat zpět grafem proklikávání.
- **Klikací odkazy** na navázané entity (resolve `typ/id` → název + link).
- **Resolvované číselníky** — místo kódů lidské popisky, s tooltipem na kód.
- **Export** aktuálního pohledu (CSV/JSON) + deep-link.

## Mapování obrazovka → use cases (z dok. 02)

| Obrazovka | Pokrývá UC |
|---|---|
| Dashboard | UC1, UC4, UC9 (přehledové dlaždice) |
| Seznam + Detail agendy | UC6, UC1 |
| Seznam + Detail OVM | UC5 |
| Seznam + Detail ISVS | UC4, UC10 |
| Seznam + Detail služby | UC9 |
| Katalog údajů | UC3 |
| Toky údajů / Oprávnění | UC2, UC3 |
| Graf vazeb | UC11 |
| Dopady & kaskády | UC13 |
| Krizový balík (CROP) | UC14 |
| Analytika | UC1, UC4, UC9, UC10 |
| Srovnání | UC8 |
| Globální hledání | UC7 |

Detailní rozpad funkcí jednotlivých obrazovek viz dokument **04**.
