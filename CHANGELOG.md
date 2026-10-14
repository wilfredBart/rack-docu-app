# CHANGELOG — rack-docu-app

Geschiedenis van de roadmap-stappen. Verhuisd uit `ROADMAP.md` op 2026-10-11 (daar staat nu enkel nog wat gepland is).
Nieuwe rij toevoegen per afgewerkt puntje: **Datum, Stap, Wie, Notitie**.

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
| 2026-09/10 (datum onduidelijk) | 2b / 2.9 | (codebase) | VLAN-migratie, VLAN-pagina, port VLAN/mode, patchplan read-only UI (face + cards + status) |
| 2026-10-10 | 1.8 + 2.10 | Grok + Wilfred | Dashboard: dubbele site-knop weg, add-site icoon zoals edit/delete; VLAN/Patchplan van dashboard naar rack-knoppen |
| 2026-10-10 | roadmap | Grok + Wilfred | ROADMAP volledig bijgewerkt: productprincipes, fase 2b VLAN, fase 3 herwerkt (3A engineer / 3B connections / 3C baas-tabel+print), fase 5 ideeën |
| 2026-10-10 | 3A.1–3A.2 | Grok | Engineer-flow: Patchplan-knop op rack-detail (device + panel); `GET /devices/:id/patchplan`; `site_id` op rack; patchplan-pagina opent panel/device direct + terug naar rack |
| 2026-10-11 | audit | Claude + Bart | `AUDIT.md`: roadmap tegenover code gelegd. Bevindingen o.a.: 3B-UI bestaat al (niet als zodanig gemarkeerd), 3C niet gestart, open registratie + geen rolcontrole, drie hoofdletter-mismatches in `Customer*` |
| 2026-10-11 | opkuis (Fase A) | Claude + Bart | 16 ongebruikte bestanden uit `Client/` gehaald (knip), `lucide-react` verwijderd, 4 losse `Server/*.sql` via `git rm`, `Customer*` → `customer*` via `git mv` (4.1). Server- en clienttest in orde. Nog niet gecommit |
| 2026-10-11 | roadmap | Claude + Bart | ROADMAP herschreven in fases A–E (`ROADMAP.new.md`); log verhuisd naar dit bestand |
