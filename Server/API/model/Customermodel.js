import pool from '../../config/database.js';

const customerModel = {
  /**
   * Haalt alle klanten op.
   */
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    return rows;
  },

  /**
   * Haalt één klant op via id.
   */
  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0];
  },

  /**
   * Maakt een nieuwe klant aan.
   */
  async create({ name }) {
    const [result] = await pool.query(
      'INSERT INTO customers (name) VALUES (?)',
      [name]
    );
    return this.getById(result.insertId);
  },

  /**
   * Werkt een bestaande klant bij.
   */
  async update(id, { name }) {
    await pool.query('UPDATE customers SET name = ? WHERE id = ?', [name, id]);
    return this.getById(id);
  },

  /**
   * Verwijdert een klant.
   * Let op: als er nog sites gekoppeld zijn (FK customer_id), gooit MySQL
   * een ER_ROW_IS_REFERENCED_2 error — die vangt errorHandler netjes af.
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Haalt een klant op inclusief de volledige hiërarchie:
   * Sites -> Locaties -> Racks
   */
  async getWithSites(id) {
    const customer = await this.getById(id);
    if (!customer) return null;

    // 1. Haal alle sites op van deze klant
    const [sites] = await pool.query(
      'SELECT * FROM sites WHERE customer_id = ? ORDER BY name ASC',
      [id]
    );

    // 2. Loop door elke site en haal de locaties op
    for (const site of sites) {
      const [locations] = await pool.query(
        'SELECT * FROM locations WHERE site_id = ? ORDER BY name ASC',
        [site.id]
      );

      // 3. Loop door elke locatie en haal de racks op
      for (const loc of locations) {
        const [racks] = await pool.query(
          'SELECT * FROM racks WHERE location_id = ? ORDER BY name ASC',
          [loc.id]
        );
        loc.racks = racks;
      }

      site.locations = locations;
    }

    return { ...customer, sites };
  },
};

export default customerModel;
