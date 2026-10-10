import pool from '../../config/database.js';

const patchPanelModel = {
  /**
   * Haalt alle patch panels op, optioneel gefilterd op rack_id.
   * GET /patch-panels?rack_id=7
   */
  async getAll({ rackId, siteId } = {}) {
    let sql = 'SELECT patch_panels.* FROM patch_panels';
    const conditions = [];
    const params = [];

    // Per site: patch panels van alle racks in alle locaties van die site (+ racknaam voor de keuzelijst).
    if (siteId) {
      sql = `SELECT patch_panels.*, racks.name AS rack_name
             FROM patch_panels
             JOIN racks ON patch_panels.rack_id = racks.id
             JOIN locations ON racks.location_id = locations.id`;
      conditions.push('locations.site_id = ?');
      params.push(siteId);
    }
    if (rackId) {
      conditions.push('patch_panels.rack_id = ?');
      params.push(rackId);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY patch_panels.rack_id ASC, patch_panels.rack_position ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM patch_panels WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ rackId, label, type, manufacturer, model, portCount, rackPosition, rackUnits, notes }) {
    const [result] = await pool.query(
      `INSERT INTO patch_panels
        (rack_id, label, type, manufacturer, model, port_count, rack_position, rack_units, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rackId, label, type, manufacturer, model, portCount, rackPosition, rackUnits ?? 1, notes]
    );
    return this.getById(result.insertId);
  },

  async update(id, { label, type, manufacturer, model, portCount, rackPosition, rackUnits, notes }) {
    await pool.query(
      `UPDATE patch_panels
       SET label = ?, type = ?, manufacturer = ?, model = ?, port_count = ?,
           rack_position = ?, rack_units = ?, notes = ?
       WHERE id = ?`,
      [label, type, manufacturer, model, portCount, rackPosition, rackUnits, notes, id]
    );
    return this.getById(id);
  },

  /**
   * Let op: verwijdert via ON DELETE CASCADE ook de ports van dit patch panel.
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM patch_panels WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Patch panel inclusief zijn ports.
   */
  async getWithPorts(id) {
    const patchPanel = await this.getById(id);
    if (!patchPanel) return null;

    const [ports] = await pool.query(
      'SELECT * FROM ports WHERE patch_panel_id = ? ORDER BY name ASC',
      [id]
    );

    return { ...patchPanel, ports };
  },

  /**
   * Alles wat het patchplan nodig heeft in één call: elke poort van het patch panel
   * met (indien gepatcht) de connection, de andere kant en de VLAN van die andere kant.
   *
   * De VLAN van een patch panel-poort wordt NIET opgeslagen maar afgeleid: het panel is passief,
   * dus we nemen de VLAN van de poort waarmee ze verbonden is (1 hop).
   */
  async getPatchPlan(id) {
    const patchPanel = await this.getById(id);
    if (!patchPanel) return null;

    const [rows] = await pool.query(
      `SELECT
          p.id, p.name, p.port_type, p.speed,
          c.id AS connection_id, c.cable_label, c.cable_type, c.status,
          op.id AS other_port_id, op.name AS other_port_name, op.port_mode AS other_port_mode,
          COALESCE(od.label, opp.label) AS other_endpoint_label,
          v.id AS vlan_id, v.vlan_number, v.name AS vlan_name, v.color AS vlan_color
       FROM ports p
       LEFT JOIN connections c ON c.from_port_id = p.id OR c.to_port_id = p.id
       LEFT JOIN ports op ON op.id = IF(c.from_port_id = p.id, c.to_port_id, c.from_port_id)
       LEFT JOIN devices od ON op.device_id = od.id
       LEFT JOIN patch_panels opp ON op.patch_panel_id = opp.id
       LEFT JOIN vlans v ON v.id = op.vlan_id
       WHERE p.patch_panel_id = ?
       ORDER BY p.id ASC, c.id ASC`,
      [id]
    );

    // Eén rij per poort (bij meerdere connections op dezelfde poort wint de oudste).
    const seen = new Set();
    const ports = [];
    for (const r of rows) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      ports.push({
        id: r.id,
        name: r.name,
        port_type: r.port_type,
        speed: r.speed,
        connection: r.connection_id
          ? {
              id: r.connection_id,
              status: r.status,
              cable_label: r.cable_label,
              cable_type: r.cable_type,
              other_port_id: r.other_port_id,
              other_port_name: r.other_port_name,
              other_port_mode: r.other_port_mode,
              other_endpoint_label: r.other_endpoint_label,
              vlan: r.vlan_id
                ? { id: r.vlan_id, vlan_number: r.vlan_number, name: r.vlan_name, color: r.vlan_color }
                : null,
            }
          : null,
      });
    }

    return { ...patchPanel, ports };
  },
};

export default patchPanelModel;
