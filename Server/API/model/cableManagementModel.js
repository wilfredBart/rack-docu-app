import pool from '../../config/database.js';

const cableManagementModel = {
  /**
   * Haalt alle cable management items op, optioneel gefilterd op rack_id.
   * GET /cable-management?rack_id=7
   */
  async getAll({ rackId } = {}) {
    let sql = 'SELECT * FROM cable_management';
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
    const [rows] = await pool.query('SELECT * FROM cable_management WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ rackId, label, type, rackPosition, rackUnits, notes }) {
    const [result] = await pool.query(
      `INSERT INTO cable_management (rack_id, label, type, rack_position, rack_units, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rackId, label, type, rackPosition, rackUnits ?? 1, notes]
    );
    return this.getById(result.insertId);
  },

  async update(id, { label, type, rackPosition, rackUnits, notes }) {
    await pool.query(
      `UPDATE cable_management
       SET label = ?, type = ?, rack_position = ?, rack_units = ?, notes = ?
       WHERE id = ?`,
      [label, type, rackPosition, rackUnits, notes, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM cable_management WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

export default cableManagementModel;
