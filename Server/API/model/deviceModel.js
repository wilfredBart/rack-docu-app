import pool from '../../config/database.js';

const deviceModel = {
  /**
   * Haalt alle devices op, optioneel gefilterd op rack_id.
   * GET /devices?rack_id=7
   */
  async getAll({ rackId } = {}) {
    let sql = 'SELECT * FROM devices';
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
    const [rows] = await pool.query('SELECT * FROM devices WHERE id = ?', [id]);
    return rows[0];
  },

  /**
   * Haalt een device op met de naam van zijn device_type erbij (join),
   * handig zodat je niet apart device_types moet opvragen in de frontend.
   */
  async getByIdWithType(id) {
    const [rows] = await pool.query(
      `SELECT devices.*, device_types.name AS device_type_name
       FROM devices
       JOIN device_types ON devices.device_type_id = device_types.id
       WHERE devices.id = ?`,
      [id]
    );
    return rows[0];
  },

  async create({
    rackId,
    deviceTypeId,
    label,
    manufacturer,
    model,
    serialNumber,
    macAddress,
    rackPosition,
    rackUnits,
    notes,
  }) {
    const [result] = await pool.query(
      `INSERT INTO devices
        (rack_id, device_type_id, label, manufacturer, model, serial_number, mac_address, rack_position, rack_units, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rackId,
        deviceTypeId,
        label,
        manufacturer,
        model,
        serialNumber,
        macAddress,
        rackPosition,
        rackUnits ?? 1,
        notes,
      ]
    );
    return this.getById(result.insertId);
  },

  async update(id, {
    deviceTypeId,
    label,
    manufacturer,
    model,
    serialNumber,
    macAddress,
    rackPosition,
    rackUnits,
    notes,
  }) {
    await pool.query(
      `UPDATE devices
       SET device_type_id = ?, label = ?, manufacturer = ?, model = ?,
           serial_number = ?, mac_address = ?, rack_position = ?, rack_units = ?, notes = ?
       WHERE id = ?`,
      [deviceTypeId, label, manufacturer, model, serialNumber, macAddress, rackPosition, rackUnits, notes, id]
    );
    return this.getById(id);
  },

  /**
   * Let op: verwijdert via ON DELETE CASCADE ook de ports van dit device.
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM devices WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Device inclusief zijn ports, handig voor patch plan weergave.
   */
  async getWithPorts(id) {
    const device = await this.getById(id);
    if (!device) return null;

    const [ports] = await pool.query(
      'SELECT * FROM ports WHERE device_id = ? ORDER BY name ASC',
      [id]
    );

    return { ...device, ports };
  },
};

export default deviceModel;
