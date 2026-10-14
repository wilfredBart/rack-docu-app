# ROADMAP — rack-docu-app

Herschreven op 2026-10-11 op basis van `AUDIT.md` (bewijs en details per punt staan daar). De geschiedenis staat in `CHANGELOG.md`.

Dit is een **beheertool voor techniekers**, geen klantenportaal.

| Pagina | Rol | Status |
| --- | --- | --- |
| **Klantenlijst** | Alle klanten; startpunt | af |
| **Klant-overview** | Command center: sites → locaties → racks opbouwen | af |
| **Rack-pagina** | Visuele elevatie: devices, patch panels, cable management in U-slots + poorten/VLAN's | grotendeels af |
| **Patchplan (engineer)** | Per device/patch panel: wat is er gepatcht? Verbindingen beheren | af, nog valideren |
| **Patchplan (overzicht)** | Alle verbindingen in tabelvorm: afprinten / doorsturen naar de klant | **niet gebouwd** |
| **VLAN's** | Definities per klant (nummer, naam, kleur); toewijzing op device-poorten | af |
| **Netwerkschema** | Schematische tekening van racks, devices en verbindingen | **niet gebouwd** |

---

## Productprincipes (afgesproken)

1. **Navigatie is contextueel** — geen globale pills voor Overzicht/Patchplan. Breadcrumb + knoppen op de pagina zelf.
2. **Twee patchplan-views, twee rollen**
   - **Engineer:** in de rack op een device / patch panel klikken → patchplan van **dat** item.
   - **Baas / projectleider:** alle verbindingen (per site of klant) in **één tabel** → printen / doorsturen naar de klant.
3. **VLAN's** hangen aan **device-poorten** (access/trunk). Patch-panel-poorten erven VLAN via de connection.
4. **Klant-overview** blijft vrij van device-CRUD en patchplan-editor; die horen op rack / patchplan.

---

## Af (niet meer aanraken)

- **Fase 0** Fundament: routes/nav, API-helpers, `GET /customers/:id/overview`
- **Fase 1** Klant-overview (1.1–1.8): KPI's, sites, locaties, racks, CRUD, contextuele navigatie
- **Fase 2** Rack-pagina (2.1–2.10): elevatie met slots en drag, devices / patch panels / cable management, poorten, VLAN per poort, generieke `itemTypes/`-CRUD
- **Fase 2b** VLAN-beheer: tabel `vlans`, `ports.port_mode` + `vlan_id`, `connections.status`, VLAN-pagina met kleurpalet
- **3A.1–3A.2** Engineer-flow: Patchplan-knop op rack-detail, `GET /devices/:id/patchplan`, terug naar rack
- **Auth-basis**: login, JWT, protected routes (setup en wachtwoordreset bestaan enkel aan serverkant)

---

## Fase A — Opkuis en fundament (bijna af)

- [x] Dode bestanden uit `Client/` gehaald (16, via knip), `lucide-react` verwijderd
- [x] `Customer*` → `customer*` (3 bestanden) via `git mv`: server start nu ook op Linux (was 4.1)
- [x] Vier overbodige `Server/*.sql` verwijderd; basisschema blijft `createDB.sql` buiten de repo
- [x] Redux blijft (enkel auth); heroverwegen bij Fase D
- [ ] `ROADMAP.new.md` vervangt `ROADMAP.md` (Bart)
- [ ] Alles committen na een laatste test (Bart)

---

## Fase B — Auth afwerken

Doel: wie de server bereikt kan niet zomaar alles wissen.

- [ ] Registratiebeleid beslissen: open / enkel door admin / uitnodiging
- [ ] `authorize('admin')` toepassen op verwijderen en andere gevoelige acties (was 4.2; middleware bestaat, wordt nergens gebruikt)
- [ ] Setup-scherm voor de eerste admin (`/auth/setup-status` + `/auth/setup` bestaan, UI niet)
- [ ] Gebruikersbeheer: controller + routes + UI (`userModel` heeft `getAll`, `updateRole`, `delete` al) (was 4.9)
- [ ] Query-cache legen bij uitloggen
- [ ] Redirect na registratie: `/dashboard` bestaat niet → `/`
- [ ] Beslissen: multi-tenant (users ↔ klanten) nu of later

**Fase B klaar als:** een nieuwe gebruiker geen klanten, racks of verbindingen kan verwijderen zonder admin te zijn.

---

## Fase C — Patchplannen afwerken (+ rack)

Backend en frontend van connections bestaan al (`/connections`, `api/connections.js`, `ConnectModal`, `EditConnectionModal`, verwijderen). Wat ontbreekt is afdwingen, overzicht en print.

### Integriteit eerst

- [ ] Beslissen hoe "poort in gebruik" in de database afgedwongen wordt. Twee losse `UNIQUE` op `from_port_id` en `to_port_id` volstaan niet: dezelfde poort kan als `from` in de ene en als `to` in een andere verbinding staan. Nu: geen enkele uniekheid op `connections`. Ook `CHECK (from_port_id <> to_port_id)` (was 4.7)
- [ ] Server-validatie in `POST` / `PUT /connections`: poorten bestaan, zijn vrij, horen bij dezelfde klant

### 3B — Verbindingen beheren (UI gebouwd, valideren)

- [ ] Nieuwe verbinding, bewerken en verwijderen doorlopen en testen
- [ ] Status-LED's in sync met `connections.status` (niet nagekeken)

### 3C — Baas-flow (overzichtstabel + print)

- [ ] **3C.1** Endpoint: alle verbindingen per site of klant met details (nu geeft `GET /connections` kale rijen, enkel filter op `rack_id`)
- [ ] **3C.2** Tabel: site / rack / van (device + poort) → kabel → naar (device + poort) / VLAN / status / label
- [ ] **3C.3** Filters: site, rack, VLAN, status
- [ ] **3C.4** Printvriendelijke layout met legende
- [ ] **3C.5** (Optioneel later) Export CSV / PDF

### Rack en opruimen

- [ ] **3A.3** (Optioneel) mini-overzicht van verbindingen in het rack-detailpaneel
- [ ] **3D** Dode stubs en "open via dashboard"-empty states wegwerken; patchplan-link op rack expliciet kiezen (overzicht of eerste panel)
- [ ] `Rack.jsx` opruimen (~370 regels, 12 props naar `RackItemDetailPanel`): `portForm` en `newTypeName` lokaal, `selectedItem` in de URL
- [ ] Mobiel: rack-elevatie + detailpaneel bruikbaar houden (was 4.12)

**Fase C klaar als:** engineer kan vanuit de rack verbindingen beheren zonder dubbel gebruik van poorten; baas kan alle verbindingen in tabelvorm printen.

---

## Fase D — Schematische netwerktekening (nieuw)

Het derde oorspronkelijke doel van het project. Data (racks, poorten, verbindingen) is er; de tekening niet.

- [ ] Scope: per site, per klant of per rack?
- [ ] Library kiezen (bv. React Flow) of zelf SVG
- [ ] Automatische layout of handmatig plaatsen (posities opslaan = nieuwe tabel)
- [ ] Editor-state (posities, selectie, zoom, undo): store kiezen (Redux, Zustand of lokaal)
- [ ] Wat tonen: devices, patch panels, verbindingen, VLAN-kleuren, status-LED's
- [ ] Export (PNG/PDF) en printbaar

---

## Fase E — Deploy en randzaken

Oppakken net voor productie of wanneer het pijn doet.

- [ ] Linux-test (server start sinds Fase A; `createDB.sql` staat buiten de repo en moet apart mee)
- [ ] Reverse proxy: `trust proxy` instellen en `localOnly` testen. Zonder dit lijkt elke request lokaal en wordt `/auth/recovery-reset` publiek
- [ ] Indexes op foreign keys (was 4.6): `sites(customer_id)`, `locations(site_id)`, `racks(location_id)`, `devices(rack_id)`, `devices(device_type_id)`, `patch_panels(rack_id)`, `cable_management(rack_id)`, `ports(device_id)`, `ports(patch_panel_id)`, `connections(from_port_id)`, `connections(to_port_id)`
- [ ] Label uniek per rack (was 4.8): `UNIQUE (rack_id, label)` op `devices` en `patch_panels`
- [ ] Extra klantvelden: contact, telefoon (was 4.3; DB heeft nu enkel `name`)
- [ ] Breadcrumbs consistenter: rack → site → klant waar mogelijk (was 4.10)
- [ ] Empty states en foutmeldingen nalopen, bv. patchplan zonder `siteId` (was 4.11)
- [ ] `deviceTypeRoute` heeft enkel list en create; update/delete beslissen
- Niet nu: soft-delete / audit (was 4.5)

---

## Later / ideeën (niet gepland)

Niet commitment, wel vastgelegd zodat ze niet vergeten raken.

- Multi-tenant strikt (zie Fase B)
- Offline / PWA voor op de werkvloer
- Foto's per rack of per device
- Import bestaande patchlijsten (CSV)

---

## Werkwijze

Per puntje:

1. De AI bouwt de code voor het puntje en levert die aan.
2. De AI werkt meteen **deze `ROADMAP.md`** bij (`- [ ]` → `- [x]`) en voegt een rij toe aan **`CHANGELOG.md`** (Datum, Stap, Wie, Notitie).
3. De AI geeft de exacte `git`-commando's mee. Zelf kopiëren; de AI pusht niet.
4. Bart test lokaal.
5. Pas als Bart "ok" zegt, worden de commando's uitgevoerd.
6. Bij de start van het volgende puntje: eerst nagaan dat de vorige commit ook echt op GitHub staat, niet enkel het vinkje.
