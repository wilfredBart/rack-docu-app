import pool from '../../config/database.js';

const siteModel = {
  /**
   * Haalt alle sites op, optioneel gefilterd op customer_id.
   * Gebruikt via: GET /sites?customer_id=5
   */
  async getAll({ customerId } = {}) {
    let sql = 'SELECT * FROM sites';
    const params = [];

    if (customerId) {
      sql += ' WHERE customer_id = ?';
      params.push(customerId);
    }

    sql += ' ORDER BY name ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * Haalt één site op via id.
   */
  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [id]);
    return rows[0];
  },

  /**
   * Maakt een nieuwe site aan, gekoppeld aan een klant.
   */
  async create({ customerId, name, street, houseNumber, postalCode, city, country }) {
    const [result] = await pool.query(
      `INSERT INTO sites (customer_id, name, street, house_number, postal_code, city, country)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, name, street, houseNumber, postalCode, city, country]
    );
    return this.getById(result.insertId);
  },

  /**
   * Werkt een bestaande site bij.
   */
  async update(id, { name, street, houseNumber, postalCode, city, country }) {
    await pool.query(
      `UPDATE sites
       SET name = ?, street = ?, house_number = ?, postal_code = ?, city = ?, country = ?
       WHERE id = ?`,
      [name, street, houseNumber, postalCode, city, country, id]
    );
    return this.getById(id);
  },

  /**
   * Verwijdert een site.
   * Let op: als er nog locations gekoppeld zijn, gaat dat via ON DELETE CASCADE
   * automatisch mee weg (net als sites zelf t.o.v. customers).
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM sites WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Haalt een site op inclusief zijn locations (join), handig voor detailweergave.
   */
  async getWithLocations(id) {
    const site = await this.getById(id);
    if (!site) return null;

    const [locations] = await pool.query(
      'SELECT * FROM locations WHERE site_id = ? ORDER BY name ASC',
      [id]
    );

    return { ...site, locations };
  },
};

export default siteModel;
