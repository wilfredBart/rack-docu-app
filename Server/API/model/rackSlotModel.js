import pool from '../../config/database.js';
import ApiError from '../../middleware/ApiError.js';

const TABLES = [
  { table: 'devices', type: 'device', nameField: 'label' },
  { table: 'patch_panels', type: 'patch_panel', nameField: 'label' },
  { table: 'cable_management', type: 'cable_management', nameField: 'label' },
];

/**
 * Controleert of een rack-positie geldig en vrij is, over devices,
 * patch_panels EN cable_management heen (die delen dezelfde fysieke
 * U-ruimte in een rack, maar zitten in aparte tabellen).
 *
 * Gooit een ApiError als:
 * - de positie buiten de rack-hoogte valt
 * - de positie (deels) al bezet is door een ander item
 *
 * @param {Object} params
 * @param {number} params.rackId
 * @param {number} params.position - rack_position van het nieuwe/bewerkte item
 * @param {number} params.units - rack_units van het nieuwe/bewerkte item
 * @param {string} [params.excludeType] - 'device' | 'patch_panel' | 'cable_management'
 * @param {number} [params.excludeId] - eigen id, om zichzelf niet als conflict te zien bij een update
 */
export async function assertValidRackSlot({ rackId, position, units, excludeType, excludeId }) {
  const pos = Number(position);
  const unitCount = Number(units) || 1;

  if (!Number.isInteger(pos) || pos < 1) {
    throw new ApiError(400, 'rack_position moet een geheel getal zijn, groter dan 0');
  }
  if (!Number.isInteger(unitCount) || unitCount < 1) {
    throw new ApiError(400, 'rack_units moet een geheel getal zijn, groter dan 0');
  }

  const newStart = pos;
  const newEnd = pos + unitCount - 1;

  // Check 1: valt het binnen de hoogte van de rack?
  const [rackRows] = await pool.query('SELECT height_u FROM racks WHERE id = ?', [rackId]);
  const rack = rackRows[0];
  if (rack && newEnd > rack.height_u) {
    throw new ApiError(
      400,
      `Positie ${newStart}-${newEnd}U valt buiten deze rack (hoogte: ${rack.height_u}U)`
    );
  }

  // Check 2: overlapt het met iets dat al in dit rack staat?
  for (const { table, type, nameField } of TABLES) {
    let sql = `SELECT id, ${nameField} AS name, rack_position, rack_units FROM ${table} WHERE rack_id = ?`;
    const params = [rackId];

    if (excludeType === type && excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(sql, params);

    for (const row of rows) {
      const existingStart = row.rack_position;
      const existingEnd = row.rack_position + (row.rack_units ?? 1) - 1;

      const overlaps = newStart <= existingEnd && existingStart <= newEnd;
      if (overlaps) {
        const label = row.name || `#${row.id}`;
        throw new ApiError(
          409,
          `Rackpositie ${newStart}-${newEnd}U is al (deels) bezet door "${label}" (${existingStart}-${existingEnd}U)`
        );
      }
    }
  }
}

// Vaste whitelist: de tabelnaam komt nooit uit user-input.
const MOVABLE_TABLES = {
  device: 'devices',
  patch_panel: 'patch_panels',
  cable_management: 'cable_management',
};

/**
 * Verplaatst één item (device, patch panel of cable management) naar een nieuwe
 * start-U binnen hetzelfde rack. Hoogte (rack_units) en alle andere velden blijven
 * ongewijzigd; het item sluit zichzelf uit bij de overlap-check.
 *
 * @param {'device'|'patch_panel'|'cable_management'} type
 * @param {number|string} id
 * @param {number|string} position - nieuwe rack_position (onderste U van het item)
 * @returns {Promise<Object>} het bijgewerkte item
 */
export async function moveRackItem(type, id, position) {
  const table = MOVABLE_TABLES[type];
  if (!table) throw new ApiError(400, 'Onbekend item-type');

  const [rows] = await pool.query(
    `SELECT id, rack_id, rack_units FROM ${table} WHERE id = ?`,
    [id]
  );
  const existing = rows[0];
  if (!existing) throw new ApiError(404, 'Item niet gevonden');

  await assertValidRackSlot({
    rackId: existing.rack_id,
    position,
    units: existing.rack_units ?? 1,
    excludeType: type,
    excludeId: existing.id,
  });

  await pool.query(`UPDATE ${table} SET rack_position = ? WHERE id = ?`, [Number(position), id]);
  const [updated] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return updated[0];
}
