# Rack-Doc-App — bouwplan

Levend document. **Eén stap tegelijk.** Wie een stap afwerkt, vinkt af (`[x]`), zet de datum, en schuift “Huidige stap” op.

Repo: https://github.com/wilfredBart/rack-docu-app

---

## Huidige stap

**0.1 — Routes en navigatie rechtzetten**

Status: `open`  
Laatst bijgewerkt: 2026-09-04

Als deze klaar is → **0.2 Frontend API-helpers**.

---

## Afspraak

- We bouwen niet vooruit op een open stap (geen rack-pagina zolang overview geen site/locatie/rack kan aanmaken).
- Elke PR / sessie raakt bij voorkeur **één** genummerde stap.
- Extra ideeën komen onder [Backlog / niet vergeten](#fase-4--niet-vergeten-randzaken), niet tussendoor in de huidige stap.

---

## Domein (niet wijzigen zonder overleg)

```
Klant → Site → Locatie → Rack → Device / Patch panel / Cable mgmt → Poorten → Verbindingen
```

Dit is een **beheertool voor techniekers**, geen klantenportaal.

- Klant-overview = command center (overzicht + boom opbouwen).
- Rack-pagina = inhoud in U-slots.
- Patchplan = verbindingen tussen poorten.

---

## Fase 0 — Fundament

- [x ] **0.1** Routes en nav rechtzetten
  - `/` = klantenlijst
  - `/klanten/:klantId` = overview
  - Dode header-links weg (`/klanten`, `/patchplan` zonder klant)
  - `/racks/:id` nog niet als losse route; later onder de klant
- [ ] **0.2** Frontend API-helpers voor `sites`, `locations`, `racks` (naast bestaande `customers.js`)
- [ ] **0.3** `GET /customers/:id/overview`
  - Geen N+1 loop
  - Payload: klant + `stats` + sites → locations → racks
  - Counts: sites, locations, racks, devices, patch_panels
  - Per rack: `height_u`, `occupied_u`, `device_count`

---

## Fase 1 — Klant-overview

Bestaande `Dashboard.jsx` mag vervangen worden. **Geen device-CRUD, geen patchplan-editor.**

- [ ] **1.1** Header: breadcrumb (Klanten / naam), titel, empty state bij 0 sites
- [ ] **1.2** KPI-rij (sites, locaties, racks, devices, patch panels) — cijfers = DB
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

Niet blokkerend voor 1–3. Oppakken wanneer het pijn doet.

- [ ] **4.1** Linux-case in imports (`customerRoute` vs `Customerroute`, enz.) — nodig vóór Linux-deploy
- [ ] **4.2** `users.role` (admin vs user) op gevoelige acties (delete)
- [ ] **4.3** Extra klantvelden (contact, telefoon) — DB heeft nu alleen `name`
- [ ] **4.4** Klantenlijst-zoekfilter: al aanwezig, laten staan
- [ ] **4.5** Soft-delete / audit: niet nu

---

## Log

| Datum      | Stap | Wie            | Notitie                           |
| ---------- | ---- | -------------- | --------------------------------- |
| 2026-09-04 | plan | Grok + Wilfred | Roadmap aangemaakt; start bij 0.1 |

---

## Hoe bijwerken

1. Vink de afgewerkte stap: `- [ ]` → `- [x]`
2. Zet **Huidige stap** op het volgende nummer
3. Rij in het log
4. Commit, bv. `docs: vink 0.1 af, start 0.2`
