import pool from '../../config/database.js';

const portModel = {
  /**
   * Haalt alle ports op, optioneel gefilterd op device_id of patch_panel_id.
   * GET /ports?device_id=22
   * GET /ports?patch_panel_id=5
   */
  async getAll({ deviceId, patchPanelId } = {}) {
    let sql = 'SELECT * FROM ports';
    const conditions = [];
    const params = [];

    if (deviceId) {
      conditions.push('device_id = ?');
      params.push(deviceId);
    }
    if (patchPanelId) {
      conditions.push('patch_panel_id = ?');
      params.push(patchPanelId);
    }
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id ASC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM ports WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ deviceId, patchPanelId, name, portType, speed }) {
    const [result] = await pool.query(
      `INSERT INTO ports (device_id, patch_panel_id, name, port_type, speed)
       VALUES (?, ?, ?, ?, ?)`,
      [deviceId ?? null, patchPanelId ?? null, name, portType, speed]
    );
    return this.getById(result.insertId);
  },

  /**
   * Maakt in één keer meerdere poorten aan, bv. 48 poorten voor een switch.
   * Namen worden automatisch gegenereerd: "Gi0/1", "Gi0/2", ... op basis van prefix + startNumber.
   */
  async bulkCreate({ deviceId, patchPanelId, count, prefix, startNumber, portType, speed }) {
    const start = startNumber ?? 1;
    const values = [];
    const placeholders = [];

    for (let i = 0; i < count; i++) {
      const portName = `${prefix}${start + i}`;
      placeholders.push('(?, ?, ?, ?, ?)');
      values.push(deviceId ?? null, patchPanelId ?? null, portName, portType, speed);
    }

    const sql = `INSERT INTO ports (device_id, patch_panel_id, name, port_type, speed) VALUES ${placeholders.join(', ')}`;
    const [result] = await pool.query(sql, values);

    const [rows] = await pool.query(
      'SELECT * FROM ports WHERE id >= ? ORDER BY id ASC',
      [result.insertId]
    );
    return rows;
  },

  async update(id, { name, portType, speed }) {
    await pool.query(
      'UPDATE ports SET name = ?, port_type = ?, speed = ? WHERE id = ?',
      [name, portType, speed, id]
    );
    return this.getById(id);
  },

  /**
   * Let op: verwijdert via ON DELETE CASCADE ook de connections
   * die van/naar deze port lopen.
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM ports WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Verwijdert alle poorten van één device of één patch_panel in één keer.
   * Vereist verplicht deviceId of patchPanelId — geen onbeperkte "delete all".
   */
  async bulkDelete({ deviceId, patchPanelId }) {
    let sql = 'DELETE FROM ports WHERE ';
    const params = [];

    if (deviceId) {
      sql += 'device_id = ?';
      params.push(deviceId);
    } else {
      sql += 'patch_panel_id = ?';
      params.push(patchPanelId);
    }

    const [result] = await pool.query(sql, params);
    return result.affectedRows;
  },
};

export default portModel;
