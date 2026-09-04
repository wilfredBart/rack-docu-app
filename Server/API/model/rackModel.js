import pool from '../../config/database.js';

const rackModel = {
  /**
   * Haalt alle racks op, optioneel gefilterd op location_id.
   * GET /racks?location_id=3
   */
  async getAll({ locationId } = {}) {
    let sql = 'SELECT * FROM racks';
    const params = [];

    if (locationId) {
      sql += ' WHERE location_id = ?';
      params.push(locationId);
    }

    sql += ' ORDER BY name ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM racks WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ locationId, name, heightU, notes }) {
    const [result] = await pool.query(
      `INSERT INTO racks (location_id, name, height_u, notes)
       VALUES (?, ?, ?, ?)`,
      [locationId, name, heightU ?? 42, notes]
    );
    return this.getById(result.insertId);
  },

  async update(id, { name, heightU, notes }) {
    await pool.query(
      'UPDATE racks SET name = ?, height_u = ?, notes = ? WHERE id = ?',
      [name, heightU, notes, id]
    );
    return this.getById(id);
  },

  /**
   * Let op: verwijdert via ON DELETE CASCADE ook devices, patch_panels
   * en cable_management die aan deze rack hangen.
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM racks WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Haalt een rack op inclusief alles wat erin zit: devices, patch panels
   * en cable management. Handig voor de patch plan / rack-visualisatie.
   */
  async getWithContents(id) {
    const rack = await this.getById(id);
    if (!rack) return null;

    const [devices] = await pool.query(
      'SELECT * FROM devices WHERE rack_id = ? ORDER BY rack_position ASC',
      [id]
    );
    const [patchPanels] = await pool.query(
      'SELECT * FROM patch_panels WHERE rack_id = ? ORDER BY rack_position ASC',
      [id]
    );
    const [cableManagement] = await pool.query(
      'SELECT * FROM cable_management WHERE rack_id = ? ORDER BY rack_position ASC',
      [id]
    );

    return {
      ...rack,
      devices,
      patch_panels: patchPanels,
      cable_management: cableManagement,
    };
  },
};

export default rackModel;
