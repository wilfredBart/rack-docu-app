-- VLAN's + patchplan-status — eenmalig uitvoeren op de rackmanager database.
-- Controleer eerst of customers.id en devices.id INT zijn (anders het type hieronder aanpassen).

-- 1) VLAN-definities, per klant. Kleur = sleutel uit het vaste palet (zie Client/src/pages/PatchPlan/vlanColors.js).
CREATE TABLE vlans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  vlan_number SMALLINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'indigo',
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vlans_customer_number (customer_id, vlan_number),
  CONSTRAINT fk_vlans_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 2) Toewijzing per poort van een actief device (switch, AP, firewall, ...).
--    vlan_id = access/untagged (bij een trunk: de native VLAN). Patch panel-poorten erven hun VLAN via connections.
ALTER TABLE ports
  ADD COLUMN port_mode ENUM('access', 'trunk') NULL,
  ADD COLUMN vlan_id INT NULL,
  ADD CONSTRAINT fk_ports_vlan FOREIGN KEY (vlan_id) REFERENCES vlans(id) ON DELETE SET NULL;

-- 3) Status van een patch (LED in het patchplan). Bestaande connections starten als 'niet_getest'.
ALTER TABLE connections
  ADD COLUMN status ENUM('actief', 'niet_getest', 'defect') NOT NULL DEFAULT 'niet_getest';
