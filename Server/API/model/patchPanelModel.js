import pool from '../../config/database.js';

const patchPanelModel = {
  /**
   * Haalt alle patch panels op, optioneel gefilterd op rack_id.
   * GET /patch-panels?rack_id=7
   */
  async getAll({ rackId } = {}) {
    let sql = 'SELECT * FROM patch_panels';
    const params = [];

    if (rackId) {
      sql += ' WHERE rack_id = ?';
      params.push(rackId);
    }

    sql += ' ORDER BY rack_position ASC';

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
};

export default patchPanelModel;
