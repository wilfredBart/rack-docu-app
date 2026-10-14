# AUDIT — rack-docu-app

Datum: 2026-10-11 · Stand: `main` = `origin/main` = `9ba185f` ("patchplan rework + vlan beheer vanaf dashboard")

`ROADMAP.md` is **niet aangepast**. Dit document is een momentopname van wat er echt in de code zit, plus een to-do per fase.

**Niet nagekeken:** de meeste controllers/models behalve auth, connections, ports en customers; `Rack/` (behalve imports), `Dashboard.jsx`, `Vlans.jsx`, alle CSS; ongecommitte wijzigingen; de database zelf.

---

## 1. Status per onderdeel

| Onderdeel | Af? | Opmerking |
| --- | --- | --- |
| Klant → site → locatie → rack (flow) | **Ja** | Routes, API en pagina's bestaan. Extra klantvelden (contact, telefoon) ontbreken nog. |
| Visual rack | **Grotendeels** | Elevatie met slots + drag (`@dnd-kit`), devices / patch panels / cable management, poorten, VLAN per poort. Open: mobiel, mini-overzicht verbindingen in detailpaneel. |
| Patchplannen: engineer-flow | **Ja** | Plan per device/panel, verbinding aanmaken / bewerken / verwijderen in `PatchPlan/index.jsx`. |
| Patchplannen: baas-tabel + print | **Nee** | Geen tabel met alle verbindingen per site/klant, geen endpoint daarvoor. Print-layout niet nagekeken. |
| Schematische netwerktekening | **Nee** | Bestaat niet. Data (racks, poorten, connections) is er wel. De animatie in `Header.jsx` is decoratie. |
| Login / registreren | **Nee, niet afgewerkt** | Zie sectie 3. |

---

## 2. Roadmap loopt achter op de code

- **3B (verbindingen beheren) is grotendeels gebouwd** maar staat open in de roadmap: `Client/src/api/connections.js` bestaat; `ConnectModal`, `EditConnectionModal` en verwijderen zitten in `PatchPlan/index.jsx`.
- De "Huidige stand" van fase 3 noemt `PatchPanelFace`, `PatchCard` en filterchips. `PatchPlan/index.jsx` importeert die niet meer (enkel tabel). Mogelijk dode code, niet gecontroleerd of `Rack/` ze gebruikt.
- Logtabel: `2026-09–10` is een typo, auteur "(codebase)" is geen auteur, fase 2b is achteraf toegevoegd, nummering in fase 4 loopt door elkaar.

---

## 3. Bevindingen

### Veiligheid
1. **Open registratie + geen rolcontrole.** `POST /auth/register` is publiek en de UI toont "Klik hier om te registreren". `middleware/authorize.js` bestaat maar **geen enkele route gebruikt het**. Elke zelf-geregistreerde "user" kan dus klanten, racks, verbindingen verwijderen. De comment in `authController` verwijst naar `userController.updateRole`, die niet bestaat.
2. **`localOnly` en reverse proxy.** De check leest `req.ip`. Achter nginx/Caddy op dezelfde machine zonder correcte `trust proxy` lijkt elke request lokaal → `/auth/recovery-reset` (wachtwoord resetten zonder login) wordt dan publiek bereikbaar. Relevant voor Linux-deploy.
3. Geen multi-tenant: elke ingelogde gebruiker ziet alle klanten (bewust "later" in de roadmap).
4. Query-cache wordt niet geleegd bij uitloggen.
5. Token zit in `localStorage` (via redux-persist). Aanvaardbaar voor een intern tool, wel bewust zo houden.

### Deploy / integriteit
6. **Hoofdlettergevoelige imports (roadmap 4.1) bevestigd.** `index.js` → `customerRoute.js` (bestand: `Customerroute.js`); `Customerroute.js` → `customerController.js` (bestand: `Customercontroller.js`); `Customercontroller.js` → `customerModel.js` (bestand: `Customermodel.js`). Werkt op Windows (`ignorecase = true`), server start niet op Linux.
7. **Basisschema staat buiten de repo**: `D:\Code\SQL scripts\createDB.sql` (alle 12 tabellen + demodata, begint met `DROP DATABASE`). Voor `customers`, `connections` en `ports` komt het exact overeen met de levende database (`SHOW CREATE TABLE`, 2026-10-11); de andere tabellen niet vergeleken. Bart houdt het bewust daar. Gevolg: wie de repo kloont heeft geen schema. `connections` heeft geen uniekheid op de poorten (4.7 blijft open).
8. **`POST /connections` valideert weinig**: enkel aanwezigheid van velden en `from ≠ to`. "Poort niet in gebruik" wordt alleen in de UI gefilterd. Twee losse `UNIQUE` op `from_port_id` en `to_port_id` sluiten niet uit dat dezelfde poort als `from` in de ene en als `to` in een andere verbinding staat.
9. `GET /connections` geeft kale rijen, enkel filterbaar op `rack_id`; voor de baas-tabel is een nieuw endpoint nodig.

### Dode / kapotte code
10. `Client/src/pages/Register.jsx` — **kapot en ongebruikt**: afgebroken regel (`login(res.d` midden in de code) en import van `../context/AuthContext` (bestaat niet).
11. `Client/src/pages/ResetPassword.jsx` — ongebruikt; roept `/auth/reset-password` aan (bestaat niet op de server) en navigeert naar `/login` (bestaat niet). Waarschijnlijk horen `Server/scripts/reset-password.js`, `password_reset_columns.sql` en `drop_reset_columns.sql` bij die oude aanpak (niet geverifieerd).
12. `Client/eslint.config.js` — eslint staat niet in de dependencies; gelint wordt met `oxlint`.
13. `components/Register.jsx` (de actieve) navigeert na registratie naar `/dashboard`; die route bestaat niet, werkt enkel via de wildcard-redirect naar `/`.
14. `/auth/setup-status` en `/auth/setup` bestaan op de server maar worden niet gebruikt door `Auth`, `Login`, `Register` of `App`. Eerste admin maken gaat dus buiten de UI.
15. Verdacht, nog te controleren met `knip`: `PatchCard.jsx`, `PatchPanelFace.jsx`, `UI/TableAAA.jsx`, `Server/public/style.css` (enkel `/css` wordt gepubliceerd), `deviceTypeRoute` heeft geen update/delete.
16. Alle routes dragen een overbodige `authenticate` (index.js doet het al globaal). Onschadelijk.

### Dependencies
- **Server:** alle zes gebruikt (bcrypt, cors, dotenv, express, jsonwebtoken, mysql2).
- **Client, verdacht:** `lucide-react` (alle gelezen bestanden gebruiken `react-icons`); `@types/react` en `@types/react-dom` in een JS-project.
- **Redux Toolkit + react-redux + redux-persist** worden enkel voor auth gebruikt (één slice: `token`, `user`, `isAuthenticated`); alle serverdata loopt via React Query. Werkt correct maar is drie pakketten voor ~25 regels state. Keuze, geen fout.

Controle:

```powershell
cd "D:\Code\Rack-Doc-App - v1.0\Client"
Get-ChildItem src -Recurse -Include *.js,*.jsx | Select-String "lucide-react"
npx knip
```

---

## 4. To-do per fase

### Fase A — Opkuis en fundament
- [x] `npx knip` draaien en resultaat doornemen (2026-10-11: 16 ongebruikte bestanden, 1 ongebruikte dependency, 23 ongebruikte exports)
- [x] Dode bestanden verplaatst naar `D:\Code\Rack-Doc-App - v1.0 - archief\` (zelfde mappenstructuur): `pages/Register.jsx`, `pages/ResetPassword.jsx`, `PatchCard.jsx`, `PatchPanelFace.jsx`, `patchplan.css`, `RackDeleteModals.jsx`, `RackFormModals.jsx`, `useRackMutations.js`, `rack-cabinet.css`, `components/Navigation.jsx`, `UI/Button.jsx`, `UI/TableAAA.jsx`, `eslint.config.js`, `tmp/app.js`, `tmp/main.js`, `tmp/rack.js`. Rack-stijlen staan inline in `index.css`, de twee .css-bestanden waren niet geladen. Archief pas wissen na test.
- [x] Test na opkuis: `npm run dev` + doorklikken (door Bart in orde bevonden, 2026-10-11)
- [x] `npm uninstall lucide-react` gedaan
- [x] Lege map `Client/tmp/` verwijderd
- [ ] 23 ongebruikte exports (vooral `fetch...`-helpers in `src/api/`, plus `ROW_HEIGHT`, `maxFitAt`): bewust laten staan
- [x] Redux: blijft zoals het is (enkel auth). Serverdata blijft bij React Query. Gebruik heroverwegen bij Fase D of bij cross-page UI-state (besluit Bart, 2026-10-11)
- [x] Bestandsnamen/imports rechtzetten: `Customer*` → `customer*` (3 bestanden, 3 imports) via `git mv` — gestaged als 3x R100 (2026-10-11), nog niet gecommit; servertest in orde
- [x] Basisschema: bestaat al als `createDB.sql` buiten de repo en blijft daar (besluit Bart, 2026-10-11)
- [x] De vier losse `Server/*.sql` (`users_table`, `vlans_migration`, `password_reset_columns`, `drop_reset_columns`) verwijderd via `git rm` (gestaged, nog niet gecommit; terug te halen met `git restore`). Archiefmap en `Client/tmp/` (staat in git) mogen weg
- [x] `ROADMAP.new.md` en `CHANGELOG.md` geschreven (2026-10-11). Open (Bart): vergelijken, `ROADMAP.new.md` hernoemen naar `ROADMAP.md`, daarna alles committen

### Fase B — Auth afwerken
- [ ] Registratiebeleid beslissen (open / enkel door admin / uitnodiging)
- [ ] `authorize('admin')` toepassen op verwijderen (en gevoelige acties)
- [ ] Setup-scherm voor eerste admin (`/auth/setup-status` + `/auth/setup`)
- [ ] Gebruikersbeheer in de UI (rollen wijzigen)
- [ ] Query-cache legen bij uitloggen
- [ ] Register-redirect na registratie rechtzetten (`/dashboard` → `/`)
- [ ] Beslissen over multi-tenant (gebruiker ↔ klant)

### Fase C — Patchplannen afwerken (+ visual rack)
- [ ] Beslissen hoe "poort in gebruik" op DB-niveau afgedwongen wordt (constraint/trigger/aparte tabel)
- [ ] Server-validatie in `POST /connections` (poorten bestaan, vrij, zelfde klant)
- [ ] Endpoint: alle verbindingen per site/klant met details (van/naar, VLAN, status, label)
- [ ] Baas-tabel met filters (site, rack, VLAN, status)
- [ ] Print-layout met legende (en later CSV/PDF)
- [ ] Dode patchplan-componenten opruimen of herbruiken
- [ ] Rack: mini-overzicht verbindingen in detailpaneel, mobiel bruikbaar
- [ ] `Rack.jsx` opruimen (~370 regels, 12 props naar `RackItemDetailPanel`): `portForm` en `newTypeName` lokaal in het paneel/formulier, `selectedItem` in de URL (`?item=device-12`)

### Fase D — Schematische netwerktekening (nieuw)
- [ ] Scope: per site, per klant, of per rack?
- [ ] Library kiezen (bv. React Flow) of zelf SVG
- [ ] Automatische layout of handmatig plaatsen (posities opslaan = nieuwe tabel)
- [ ] Editor-state (posities, selectie, zoom, undo): store kiezen (Redux, Zustand of lokaal) — hier valt de Redux-vraag opnieuw
- [ ] Wat tonen: devices, patch panels, verbindingen, VLAN-kleuren, status-LED's
- [ ] Export (PNG/PDF) en printbaar

### Fase E — Deploy en randzaken
- [ ] Linux-test (na fase A)
- [ ] Reverse proxy + `trust proxy` + `localOnly` testen
- [ ] Indexes op foreign keys (4.6), unieke labels per rack (4.8)
- [ ] Extra klantvelden (contact, telefoon)
- [ ] Breadcrumbs en foutmeldingen nalopen (4.10, 4.11)
