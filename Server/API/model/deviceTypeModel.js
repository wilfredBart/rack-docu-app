import pool from '../../config/database.js';

const deviceTypeModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM device_types ORDER BY name ASC');
    return rows;
  },

  /**
   * Zoekt case-insensitive of een type al bestaat (dus "Server" en "server"
   * worden als hetzelfde beschouwd), ongeacht de database-collation-instelling.
   */
  async findByNameCaseInsensitive(name) {
    const [rows] = await pool.query(
      'SELECT * FROM device_types WHERE LOWER(name) = LOWER(?)',
      [name]
    );
    return rows[0];
  },

  async create(name) {
    const [result] = await pool.query(
      'INSERT INTO device_types (name) VALUES (?)',
      [name]
    );
    const [rows] = await pool.query('SELECT * FROM device_types WHERE id = ?', [result.insertId]);
    return rows[0];
  },
};

export default deviceTypeModel;
