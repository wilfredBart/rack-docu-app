# ROADMAP — rack-docu-app

Dit is een **beheertool voor techniekers**, geen klantenportaal.

| Pagina | Rol |
| --- | --- |
| **Klantenlijst** | Alle klanten; startpunt |
| **Klant-overview** | Command center: sites → locaties → racks opbouwen |
| **Rack-pagina** | Visuele elevatie: devices, patch panels, cable management in U-slots + poorten/VLAN's |
| **Patchplan (engineer)** | Per device/patch panel: wat is er gepatcht? (vanuit de rack) |
| **Patchplan (overzicht)** | Alle verbindingen in tabelvorm: afprinten / doorsturen naar de klant |
| **VLAN's** | Definities per klant (nummer, naam, kleur); toewijzing gebeurt op device-poorten |

---

## Productprincipes (afgesproken)

1. **Navigatie is contextueel** — geen globale pills voor Overzicht/Patchplan. Breadcrumb + knoppen op de pagina zelf.
2. **Twee patchplan-views, twee rollen**
   - **Engineer:** in de rack op een device / patch panel klikken → patchplan van **dat** item.
   - **Baas / projectleider:** alle verbindingen (per site of klant) in **één tabel** → printen / doorsturen naar de klant.
3. **VLAN's** hangen aan **device-poorten** (access/trunk). Patch-panel-poorten erven VLAN via de connection.
4. **Klant-overview** blijft vrij van device-CRUD en patchplan-editor; die horen op rack / patchplan.

---

## Fase 0 — Fundament

- [x] **0.1** Routes en nav rechtzetten
- [x] **0.2** Frontend API-helpers (`sites.js`, `locations.js`, `racks.js`)
- [x] **0.3** `GET /customers/:id/overview`

---

## Fase 1 — Klant-overview

Route: `/klanten/:klantId` · `Dashboard.jsx`  
**Geen device-CRUD, geen patchplan-editor.**

- [x] **1.1** Header: breadcrumb (Klanten / naam), titel, empty state bij 0 sites
- [x] **1.2** KPI-rij (sites, locaties, racks, devices, patch panels) — cijfers = DB
- [x] **1.3** Sitelijst links: zoeken, selectie, stad + rack-count
- [x] **1.4** Geselecteerde site: adres, aanmaken / bewerken / verwijderen (cascade-waarschuwing)
- [x] **1.5** Locatiekaarten: toevoegen / bewerken / verwijderen
- [x] **1.6** Rack-rijen: naam, U, bezettingsbalk, toevoegen / bewerken / verwijderen, openen → rack-pagina
- [x] **1.7** Navigatie contextueel (`Navigation.jsx`: geen globale Overzicht-/Patchplan-pills)
- [x] **1.8** UI-opschoning dashboard (2026-10-10)
  - Dubbele “Nieuwe site”-knop bovenaan weg; alleen icoon-knop in Sites-sidebar (zelfde stijl als bewerken/verwijderen)
  - VLAN- en Patchplan-links van het dashboard gehaald → horen op de rack-pagina (visuele representatie)

**Fase 1 klaar als:** nieuwe klant → site → locatie → rack aanmaken zonder de API met de hand te slaan.

---

## Fase 2 — Rack-pagina

Route: `/klanten/:klantId/racks/:rackId`  
API: `GET /racks/:id/contents` + slot-validatie.

- [x] **2.1** Elevation-view: `height_u` van boven naar beneden
- [x] **2.2** Devices in slots (type, label, U; overlap onmogelijk)
- [x] **2.3** Patch panels in slots
- [x] **2.4** Cable management in slots
- [x] **2.5** Device / panel / cable: toevoegen, verplaatsen, verwijderen
- [x] **2.6** Device-detail: manufacturer, model, serial, MAC, notes
- [x] **2.7** Poorten op device én patch panel (aanmaken / hernoemen / bulk)
- [x] **2.8** `Rack.jsx` opgesplitst + generieke item-type-CRUD (`itemTypes/`)
- [x] **2.9** VLAN toewijzen op device-poorten (per poort + bereik; access/trunk)
- [x] **2.10** Contextknoppen op rack: VLAN's + Patchplan (naast Device / Patch / Cable)

**Fase 2 klaar als:** een rack toont hardware + poorten + VLAN-toewijzing, met overlap-validatie en CRUD via dezelfde view.

---

## Fase 2b — VLAN-beheer (afgerond, stond niet in oude roadmap)

Route: `/klanten/:klantId/vlans` · migratie: `Server/vlans_migration.sql`

- [x] **2b.1** Tabel `vlans` (per klant: nummer, naam, kleur, omschrijving) + uniek `(customer_id, vlan_number)`
- [x] **2b.2** `ports.port_mode` (access/trunk) + `ports.vlan_id`
- [x] **2b.3** API: CRUD `/vlans`, bulk `PUT /ports/vlan`
- [x] **2b.4** Frontend-pagina VLAN's + kleurpalet (`vlanColors.js`)
- [x] **2b.5** `connections.status` (actief / niet_getest / defect) voor LED's in patchplan

---

## Fase 3 — Patchplan

### Huidige stand (lees-only UI bestaat al deels)

- Route: `/klanten/:klantId/patchplan?siteId=&panel=`
- API: `GET /patch-panels/:id/patchplan` (poorten + connection + afgeleide VLAN)
- UI: panel-chips per site, visuele `PatchPanelFace` (LED's), filterchips, `PatchCard`-lijst
- **Ontbreekt:** verbindingen aanmaken/bewerken in de UI, engineer-flow vanuit rack, baas-tabel + print

Backend connection-CRUD bestaat al (`/connections`: list, get, create, update, delete) — **frontend API-helper en UI nog niet**.

### 3A — Engineer-flow (per device / panel)

Doel: op de rack een item aanklikken → direct het patchplan van **dat** item.

- [ ] **3A.1** Vanuit rack-detail (device of patch panel): actie “Patchplan” / klik → navigatie naar patchplan gefilterd op dat item  
  - Voorstel route: `/klanten/:klantId/patchplan?siteId=&panel=` of `?device=` (device-view kan later; start met panel)
- [ ] **3A.2** Patchplan-pagina: als je vanuit een specifiek panel/device komt, dat item meteen selecteren (geen “kies eerst een site”-dead end)
- [ ] **3A.3** (Optioneel) Mini-overzicht van verbindingen in het rack-detailpaneel zelf (zonder de pagina te verlaten)

### 3B — Verbindingen beheren

- [ ] **3B.1** Frontend API-helper `api/connections.js` (list / create / update / delete)
- [ ] **3B.2** Nieuwe verbinding: twee poorten kiezen (niet dezelfde, niet al in gebruik), kabeltype, label, status
- [ ] **3B.3** Verbinding bewerken (label, type, status) en verwijderen
- [ ] **3B.4** Status-LED's blijven in sync met `connections.status`

### 3C — Baas-flow (overzichtstabel + print)

Doel: alle patches in één keer zien, afdrukken en doorsturen naar de klant.

- [ ] **3C.1** Overzichtspagina of tab: **tabel** met alle verbindingen van een site (of klant)  
  Kolommen bv.: site / rack / van (device+poort) → kabel → naar (device+poort) / VLAN / status / label
- [ ] **3C.2** Filters: site, rack, VLAN, status
- [ ] **3C.3** Printvriendelijke layout (`@media print` of aparte print-view) — geen chrome, wel legende
- [ ] **3C.4** (Optioneel later) Export CSV / PDF

### 3D — Opruimen

- [ ] **3D.1** Dode stubs / “Open via dashboard”-empty states wegwerken zodra 3A+3C bestaan
- [ ] **3D.2** Patchplan-link op rack: naar overzicht (3C) of naar eerste panel van die site — expliciet kiezen

**Fase 3 klaar als:** engineer kan vanuit de rack het patchplan van een item openen én verbindingen beheren; baas kan alle verbindingen in tabelvorm printen/doorsturen.

---

## Fase 4 — Randzaken (niet blokkerend voor 1–3)

Oppakken wanneer het pijn doet of net voor productie.

### Database / integriteit

- [ ] **4.1** Linux-case in imports (`Customerroute` vs `customerRoute`, enz.) — nodig vóór Linux-deploy
- [ ] **4.6** Indexes op foreign keys  
  `sites(customer_id)`, `locations(site_id)`, `racks(location_id)`,  
  `devices(rack_id)`, `devices(device_type_id)`,  
  `patch_panels(rack_id)`, `cable_management(rack_id)`,  
  `ports(device_id)`, `ports(patch_panel_id)`,  
  `connections(from_port_id)`, `connections(to_port_id)`
- [ ] **4.7** Connection integrity constraints  
  - `UNIQUE (from_port_id)`  
  - `UNIQUE (to_port_id)`  
  - `CHECK (from_port_id <> to_port_id)`
- [ ] **4.8** Label uniek per rack  
  - `UNIQUE (rack_id, label)` op `devices`  
  - `UNIQUE (rack_id, label)` op `patch_panels`

### Auth / gebruikers

- [ ] **4.2** `users.role` (admin vs user) afdwingen op gevoelige acties (delete)
- [x] **4.2.1** Auth-basis: login, JWT, protected routes, setup eerste admin, password reset (bestaat)
- [ ] **4.9** Gebruikersbeheer in de UI (uitnodigen / rollen) — nu alleen via DB/scripts

### Data-model uitbreidingen

- [ ] **4.3** Extra klantvelden (contact, telefoon) — DB heeft nu alleen `name`
- [ ] **4.4** Klantenlijst-zoekfilter: al aanwezig, laten staan
- [ ] **4.5** Soft-delete / audit: niet nu

### UX / polish

- [ ] **4.10** Breadcrumbs consistenter (rack → site → klant waar mogelijk)
- [ ] **4.11** Empty states en foutmeldingen nalopen (patchplan zonder `siteId`, enz.)
- [ ] **4.12** Mobiel: rack-elevatie + detailpaneel bruikbaar houden

---

## Fase 5 — Later / ideeën (niet gepland)

Niet commitment, wel vastgelegd zodat ze niet vergeten raken.

- Device-specifiek patchplan (nu vooral panel-gecentreerd in de API)
- Visuele kabeltekening tussen racks
- Multi-tenant strikt (users ↔ klanten-koppeling)
- Offline / PWA voor op de werkvloer
- Foto's per rack of per device
- Import bestaande patchlijsten (CSV)

---

## Log

| Datum | Stap | Wie | Notitie |
| --- | --- | --- | --- |
| 2026-09-04 | plan | Grok + Wilfred | Roadmap aangemaakt; start bij 0.1 |
| 2026-09-04 | 0.1 | Grok | Nav contextueel; `/klanten` redirect; dode `/racks/:id` link disabled |
| 2026-09-04 | 0.2 | Grok | API-helpers sites / locations / racks |
| 2026-09-04 | 0.3 | Grok | `GET /customers/:id/overview` + `fetchCustomerOverview` |
| 2026-09-04 | 1.1 | Grok | Overview header + empty state; oude site-kaarten weg |
| 2026-09-05 | docs | Grok + Wilfred | Afspraak aangescherpt + 4.6 / 4.7 / 4.8 (DB-verbeteringen) toegevoegd |
| 2026-09-05 | 1.2–1.6 | Grok | KPI's, sitelijst, site/locatie/rack CRUD |
| 2026-09-20 | 1.7 | Claude + Wilfred | Globale nav-pills weg; patchplan site-specifiek |
| 2026-09-23 | 2.1–2.7 | GitHub Copilot | Elevatie, devices/panels/cable, detail, poorten |
| 2026-09-27 | 2.8 | Claude | `Rack.jsx` gesplitst + generieke `itemTypes/` CRUD |
| 2026-09–10 | 2b / 2.9 | (codebase) | VLAN-migratie, VLAN-pagina, port VLAN/mode, patchplan read-only UI (face + cards + status) |
| 2026-10-10 | 1.8 + 2.10 | Grok + Wilfred | Dashboard: dubbele site-knop weg, add-site icoon zoals edit/delete; VLAN/Patchplan van dashboard naar rack-knoppen |
| 2026-10-10 | roadmap | Grok + Wilfred | ROADMAP volledig bijgewerkt: productprincipes, fase 2b VLAN, fase 3 herwerkt (3A engineer / 3B connections / 3C baas-tabel+print), fase 5 ideeën |

---

## Hoe bijwerken

Werkwijze per puntje (instructies voor AI):

1. AI bouwt de code voor het puntje en levert die aan.
2. AI werkt **deze ROADMAP.md** meteen mee bij:
   - `- [ ]` → `- [x]` voor het afgewerkte punt
   - nieuwe rij in de logtabel (**Datum, Stap, Wie, Notitie**)
3. AI geeft de exacte `git add / commit / push`-commands mee — zelf te kopiëren, AI pusht niet.
4. Jij test lokaal.
5. Pas als jij "ok" zegt: voer je de gegeven commands uit.
6. **Bij de start van elk volgend puntje** checkt de AI eerst of de vorige commit ook echt op GitHub staat (en niet enkel het vinkje) vóór er verder gebouwd wordt.
