import pool from '../../config/database.js';

const connectionModel = {
  /**
   * Haalt alle connections op, optioneel gefilterd op rack_id
   * (via de ports die aan devices/patch_panels in die rack hangen).
   * GET /connections?rack_id=7
   */
  async getAll({ rackId } = {}) {
    if (!rackId) {
      const [rows] = await pool.query('SELECT * FROM connections');
      return rows;
    }

    const [rows] = await pool.query(
      `SELECT DISTINCT connections.*
       FROM connections
       JOIN ports AS from_p ON connections.from_port_id = from_p.id
       JOIN ports AS to_p ON connections.to_port_id = to_p.id
       LEFT JOIN devices AS from_d ON from_p.device_id = from_d.id
       LEFT JOIN patch_panels AS from_pp ON from_p.patch_panel_id = from_pp.id
       LEFT JOIN devices AS to_d ON to_p.device_id = to_d.id
       LEFT JOIN patch_panels AS to_pp ON to_p.patch_panel_id = to_pp.id
       WHERE from_d.rack_id = ? OR from_pp.rack_id = ? OR to_d.rack_id = ? OR to_pp.rack_id = ?`,
      [rackId, rackId, rackId, rackId]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM connections WHERE id = ?', [id]);
    return rows[0];
  },

  /**
   * Haalt een connection op met leesbare info over beide kanten:
   * poortnaam + naam van het device of patch panel waar die poort aan hangt.
   */
  async getByIdWithDetails(id) {
    const [rows] = await pool.query(
      `SELECT
          connections.*,
          from_p.name AS from_port_name,
          COALESCE(from_d.label, from_pp.label) AS from_endpoint_label,
          to_p.name AS to_port_name,
          COALESCE(to_d.label, to_pp.label) AS to_endpoint_label
       FROM connections
       JOIN ports AS from_p ON connections.from_port_id = from_p.id
       JOIN ports AS to_p ON connections.to_port_id = to_p.id
       LEFT JOIN devices AS from_d ON from_p.device_id = from_d.id
       LEFT JOIN patch_panels AS from_pp ON from_p.patch_panel_id = from_pp.id
       LEFT JOIN devices AS to_d ON to_p.device_id = to_d.id
       LEFT JOIN patch_panels AS to_pp ON to_p.patch_panel_id = to_pp.id
       WHERE connections.id = ?`,
      [id]
    );
    return rows[0];
  },

  async create({ fromPortId, toPortId, cableLabel, cableType }) {
    const [result] = await pool.query(
      `INSERT INTO connections (from_port_id, to_port_id, cable_label, cable_type)
       VALUES (?, ?, ?, ?)`,
      [fromPortId, toPortId, cableLabel, cableType]
    );
    return this.getById(result.insertId);
  },

  async update(id, { cableLabel, cableType }) {
    await pool.query(
      'UPDATE connections SET cable_label = ?, cable_type = ? WHERE id = ?',
      [cableLabel, cableType, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM connections WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

export default connectionModel;
