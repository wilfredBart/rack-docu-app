import pool from '../../config/database.js';

const vlanModel = {
  /**
   * Alle VLAN's van één klant, met het aantal poorten dat ze gebruikt.
   * GET /vlans?customer_id=3
   */
  async getAll({ customerId }) {
    const [rows] = await pool.query(
      `SELECT vlans.*, COUNT(ports.id) AS port_count
       FROM vlans
       LEFT JOIN ports ON ports.vlan_id = vlans.id
       WHERE vlans.customer_id = ?
       GROUP BY vlans.id
       ORDER BY vlans.vlan_number ASC`,
      [customerId]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM vlans WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ customerId, vlanNumber, name, color, description }) {
    const [result] = await pool.query(
      `INSERT INTO vlans (customer_id, vlan_number, name, color, description)
       VALUES (?, ?, ?, ?, ?)`,
      [customerId, vlanNumber, name, color, description ?? null]
    );
    return this.getById(result.insertId);
  },

  async update(id, { vlanNumber, name, color, description }) {
    await pool.query(
      `UPDATE vlans
       SET vlan_number = ?, name = ?, color = ?, description = ?
       WHERE id = ?`,
      [vlanNumber, name, color, description ?? null, id]
    );
    return this.getById(id);
  },

  /**
   * Let op: poorten die deze VLAN gebruikten worden via ON DELETE SET NULL
   * gewoon "zonder VLAN" — er verdwijnt geen enkele poort of connection.
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM vlans WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Klant waartoe een device behoort (device → rack → locatie → site → klant).
   * Gebruikt om te voorkomen dat een poort een VLAN van een andere klant krijgt.
   */
  async getCustomerIdForDevice(deviceId) {
    const [rows] = await pool.query(
      `SELECT sites.customer_id
       FROM devices
       JOIN racks ON devices.rack_id = racks.id
       JOIN locations ON racks.location_id = locations.id
       JOIN sites ON locations.site_id = sites.id
       WHERE devices.id = ?`,
      [deviceId]
    );
    return rows[0]?.customer_id ?? null;
  },
};

export default vlanModel;
