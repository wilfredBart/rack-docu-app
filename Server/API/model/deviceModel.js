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

  /**
   * Patchplan van één device: elke poort met (indien gepatcht) connection,
   * de andere kant, en de VLAN van deze device-poort (access/trunk native).
   */
  async getPatchPlan(id) {
    const device = await this.getById(id);
    if (!device) return null;

    const [rows] = await pool.query(
      `SELECT
          p.id, p.name, p.port_type, p.speed, p.port_mode,
          c.id AS connection_id, c.cable_label, c.cable_type, c.status,
          op.id AS other_port_id, op.name AS other_port_name, op.port_mode AS other_port_mode,
          COALESCE(od.label, opp.label) AS other_endpoint_label,
          v.id AS vlan_id, v.vlan_number, v.name AS vlan_name, v.color AS vlan_color
       FROM ports p
       LEFT JOIN connections c ON c.from_port_id = p.id OR c.to_port_id = p.id
       LEFT JOIN ports op ON op.id = IF(c.from_port_id = p.id, c.to_port_id, c.from_port_id)
       LEFT JOIN devices od ON op.device_id = od.id
       LEFT JOIN patch_panels opp ON op.patch_panel_id = opp.id
       LEFT JOIN vlans v ON v.id = p.vlan_id
       WHERE p.device_id = ?
       ORDER BY p.id ASC, c.id ASC`,
      [id]
    );

    const seen = new Set();
    const ports = [];
    for (const r of rows) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      ports.push({
        id: r.id,
        name: r.name,
        port_type: r.port_type,
        speed: r.speed,
        port_mode: r.port_mode,
        connection: r.connection_id
          ? {
              id: r.connection_id,
              status: r.status,
              cable_label: r.cable_label,
              cable_type: r.cable_type,
              other_port_id: r.other_port_id,
              other_port_name: r.other_port_name,
              other_port_mode: r.other_port_mode,
              other_endpoint_label: r.other_endpoint_label,
              vlan: r.vlan_id
                ? {
                    id: r.vlan_id,
                    vlan_number: r.vlan_number,
                    name: r.vlan_name,
                    color: r.vlan_color,
                  }
                : null,
            }
          : null,
        vlan: r.vlan_id
          ? {
              id: r.vlan_id,
              vlan_number: r.vlan_number,
              name: r.vlan_name,
              color: r.vlan_color,
            }
          : null,
      });
    }

    return { ...device, ports };
  },
};

export default deviceModel;
