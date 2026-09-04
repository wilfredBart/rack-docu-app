import pool from '../../config/database.js';

const locationModel = {
  /**
   * Haalt alle locations op, optioneel gefilterd op site_id.
   * GET /locations?site_id=12
   */
  async getAll({ siteId } = {}) {
    let sql = 'SELECT * FROM locations';
    const params = [];

    if (siteId) {
      sql += ' WHERE site_id = ?';
      params.push(siteId);
    }

    sql += ' ORDER BY name ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM locations WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ siteId, name, description }) {
    const [result] = await pool.query(
      'INSERT INTO locations (site_id, name, description) VALUES (?, ?, ?)',
      [siteId, name, description]
    );
    return this.getById(result.insertId);
  },

  async update(id, { name, description }) {
    await pool.query(
      'UPDATE locations SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    return this.getById(id);
  },

  /**
   * Let op: verwijdert via ON DELETE CASCADE ook de racks (en alles daaronder)
   * die aan deze location hangen.
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM locations WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Location inclusief zijn racks.
   */
  async getWithRacks(id) {
    const location = await this.getById(id);
    if (!location) return null;

    const [racks] = await pool.query(
      'SELECT * FROM racks WHERE location_id = ? ORDER BY name ASC',
      [id]
    );

    return { ...location, racks };
  },
};

export default locationModel;
