Dit is een **beheertool voor techniekers**, geen klantenportaal.

- Klant-overview = command center (overzicht + boom opbouwen).
- Rack-pagina = inhoud in U-slots.
- Patchplan = verbindingen tussen poorten.

---

## Fase 0 — Fundament

- [x] **0.1** Routes en nav rechtzetten
- [x] **0.2** Frontend API-helpers (`sites.js`, `locations.js`, `racks.js`)
- [x] **0.3** `GET /customers/:id/overview`

---

## Fase 1 — Klant-overview

Bestaande `Dashboard.jsx` mag vervangen worden. **Geen device-CRUD, geen patchplan-editor.**

- [x] **1.1** Header: breadcrumb (Klanten / naam), titel, empty state bij 0 sites
  - Gebruikt `fetchCustomerOverview`
  - Oude nested site-kaarten verwijderd (komen terug in 1.3–1.6)
- [x] **1.2** KPI-rij (sites, locaties, racks, devices, patch panels) — cijfers = DB
- [ ] **1.3** Sitelijst links: zoeken, selectie, stad + rack-count
- [ ] **1.4** Geselecteerde site: adres, aanmaken / bewerken / verwijderen (cascade-waarschuwing)
- [ ] **1.5** Locatiekaarten: toevoegen / bewerken / verwijderen
- [ ] **1.6** Rack-rijen: naam, U, bezettingsbalk, toevoegen / bewerken / verwijderen
  - Knop “Openen” mag naar een stub tot fase 2
- [ ] **1.7** Knop “Patchplan” per site → `/klanten/:klantId/patchplan?siteId=` (nog geen echte data)

**Fase 1 klaar als:** nieuwe klant → site → locatie → rack aanmaken zonder de API met de hand te slaan.

---

## Fase 2 — Rack-pagina

Route: `/klanten/:klantId/racks/:rackId`  
API (bestaat): `GET /racks/:id/contents` + slot-validatie.

- [ ] **2.1** Elevation-view: `height_u` van boven naar beneden
- [ ] **2.2** Devices in slots (type, label, U; overlap onmogelijk)
- [ ] **2.3** Patch panels in slots
- [ ] **2.4** Cable management in slots
- [ ] **2.5** Device / panel / cable: toevoegen, verplaatsen, verwijderen
- [ ] **2.6** Device-detail: manufacturer, model, serial, MAC, notes
- [ ] **2.7** Poorten op device én patch panel (aanmaken / hernoemen)

---

## Fase 3 — Patchplan

Huidige `PatchPlan.jsx` is een stub → vervangen, niet uitbreiden.

- [ ] **3.1** Lijst verbindingen per site (from-port → to-port, kabeltype, label)
- [ ] **3.2** Nieuwe verbinding: twee poorten kiezen (niet dezelfde, niet al in gebruik)
- [ ] **3.3** Eerst betrouwbare tabel; visualisatie daarna
- [ ] **3.4** Stub verwijderen

---

## Fase 4 — Niet vergeten (randzaken)

Niet blokkerend voor 1–3. Oppakken wanneer het pijn doet of net voor productie.

- [ ] **4.1** Linux-case in imports (`customerRoute` vs `Customerroute`, enz.) — nodig vóór Linux-deploy
- [ ] **4.2** `users.role` (admin vs user) op gevoelige acties (delete)
- [ ] **4.3** Extra klantvelden (contact, telefoon) — DB heeft nu alleen `name`
- [ ] **4.4** Klantenlijst-zoekfilter: al aanwezig, laten staan
- [ ] **4.5** Soft-delete / audit: niet nu
- [ ] **4.6** Indexes toevoegen op foreign keys  
      Doel: snellere queries als de data groeit.  
      Tabellen/kolommen:  
      `sites(customer_id)`, `locations(site_id)`, `racks(location_id)`,  
      `devices(rack_id)`, `devices(device_type_id)`,  
      `patch_panels(rack_id)`, `cable_management(rack_id)`,  
      `ports(device_id)`, `ports(patch_panel_id)`,  
      `connections(from_port_id)`, `connections(to_port_id)`
- [ ] **4.7** Connection integrity constraints  
      Doel: voorkomen dat één poort in meerdere verbindingen zit en dat een poort met zichzelf verbonden wordt.  
      Toe te voegen:
  - `UNIQUE (from_port_id)`
  - `UNIQUE (to_port_id)`
  - `CHECK (from_port_id <> to_port_id)`
- [ ] **4.8** Label uniek per rack  
      Doel: binnen één rack mag een device- of patch-panel-label niet dubbel voorkomen.  
      Toe te voegen:
  - `UNIQUE (rack_id, label)` op `devices`
  - `UNIQUE (rack_id, label)` op `patch_panels`

---

## Log

| Datum      | Stap | Wie            | Notitie                                                               |
| ---------- | ---- | -------------- | --------------------------------------------------------------------- |
| 2026-09-04 | plan | Grok + Wilfred | Roadmap aangemaakt; start bij 0.1                                     |
| 2026-09-04 | 0.1  | Grok           | Nav contextueel; `/klanten` redirect; dode `/racks/:id` link disabled |
| 2026-09-04 | 0.2  | Grok           | API-helpers sites / locations / racks                                 |
| 2026-09-04 | 0.3  | Grok           | `GET /customers/:id/overview` + `fetchCustomerOverview`               |
| 2026-09-04 | 1.1  | Grok           | Overview header + empty state; oude site-kaarten weg                  |
| 2026-09-05 | docs | Grok + Wilfred | Afspraak aangescherpt + 4.6 / 4.7 / 4.8 (DB-verbeteringen) toegevoegd |
| 2026-09-05 | 1.2  | Grok           | KPI-rij toegevoegd (sites, locaties, racks, devices, patch panels)    |

---

## Hoe bijwerken

1. Vink de afgewerkte stap: `- [ ]` → `- [x]`
2. Zet **Huidige stap** op het volgende nummer
3. Rij in het log
4. Commit, bv. `docs: vink 1.1 af, start 1.2`
