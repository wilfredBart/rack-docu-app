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

  /**
   * Klant + stats + boom (sites → locations → racks) in 3 queries, geen N+1.
   * occupied_u = som van rack_units van devices + patch panels + cable management.
   */
  async getOverview(id) {
    const customer = await this.getById(id);
    if (!customer) return null;

    const [[stats]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM sites WHERE customer_id = ?) AS sites,
         (SELECT COUNT(*) FROM locations l
            INNER JOIN sites s ON s.id = l.site_id
            WHERE s.customer_id = ?) AS locations,
         (SELECT COUNT(*) FROM racks r
            INNER JOIN locations l ON l.id = r.location_id
            INNER JOIN sites s ON s.id = l.site_id
            WHERE s.customer_id = ?) AS racks,
         (SELECT COUNT(*) FROM devices d
            INNER JOIN racks r ON r.id = d.rack_id
            INNER JOIN locations l ON l.id = r.location_id
            INNER JOIN sites s ON s.id = l.site_id
            WHERE s.customer_id = ?) AS devices,
         (SELECT COUNT(*) FROM patch_panels p
            INNER JOIN racks r ON r.id = p.rack_id
            INNER JOIN locations l ON l.id = r.location_id
            INNER JOIN sites s ON s.id = l.site_id
            WHERE s.customer_id = ?) AS patch_panels`,
      [id, id, id, id, id]
    );

    const [rows] = await pool.query(
      `SELECT
         s.id AS site_id,
         s.name AS site_name,
         s.street AS site_street,
         s.house_number AS site_house_number,
         s.postal_code AS site_postal_code,
         s.city AS site_city,
         s.country AS site_country,
         s.created_at AS site_created_at,
         loc.id AS location_id,
         loc.name AS location_name,
         loc.description AS location_description,
         loc.created_at AS location_created_at,
         r.id AS rack_id,
         r.name AS rack_name,
         r.height_u,
         r.notes AS rack_notes,
         r.created_at AS rack_created_at,
         COALESCE(occ.occupied_u, 0) AS occupied_u,
         COALESCE(occ.device_count, 0) AS device_count
       FROM sites s
       LEFT JOIN locations loc ON loc.site_id = s.id
       LEFT JOIN racks r ON r.location_id = loc.id
       LEFT JOIN (
         SELECT rack_id,
                SUM(units) AS occupied_u,
                SUM(device_flag) AS device_count
         FROM (
           SELECT rack_id, COALESCE(rack_units, 1) AS units, 1 AS device_flag FROM devices
           UNION ALL
           SELECT rack_id, COALESCE(rack_units, 1) AS units, 0 AS device_flag FROM patch_panels
           UNION ALL
           SELECT rack_id, COALESCE(rack_units, 1) AS units, 0 AS device_flag FROM cable_management
         ) occupancy_parts
         GROUP BY rack_id
       ) occ ON occ.rack_id = r.id
       WHERE s.customer_id = ?
       ORDER BY s.name ASC, loc.name ASC, r.name ASC`,
      [id]
    );

    return {
      id: customer.id,
      name: customer.name,
      created_at: customer.created_at,
      stats: {
        sites: Number(stats.sites) || 0,
        locations: Number(stats.locations) || 0,
        racks: Number(stats.racks) || 0,
        devices: Number(stats.devices) || 0,
        patch_panels: Number(stats.patch_panels) || 0,
      },
      sites: nestOverviewRows(rows),
    };
  },
};

function nestOverviewRows(rows) {
  const sites = [];
  const siteMap = new Map();

  for (const row of rows) {
    let site = siteMap.get(row.site_id);
    if (!site) {
      site = {
        id: row.site_id,
        name: row.site_name,
        street: row.site_street,
        house_number: row.site_house_number,
        postal_code: row.site_postal_code,
        city: row.site_city,
        country: row.site_country,
        created_at: row.site_created_at,
        rack_count: 0,
        locations: [],
        _locMap: new Map(),
      };
      siteMap.set(row.site_id, site);
      sites.push(site);
    }

    if (!row.location_id) continue;

    let loc = site._locMap.get(row.location_id);
    if (!loc) {
      loc = {
        id: row.location_id,
        name: row.location_name,
        description: row.location_description,
        created_at: row.location_created_at,
        racks: [],
      };
      site._locMap.set(row.location_id, loc);
      site.locations.push(loc);
    }

    if (!row.rack_id) continue;

    loc.racks.push({
      id: row.rack_id,
      name: row.rack_name,
      height_u: row.height_u,
      notes: row.rack_notes,
      created_at: row.rack_created_at,
      occupied_u: Number(row.occupied_u) || 0,
      device_count: Number(row.device_count) || 0,
    });
    site.rack_count += 1;
  }

  for (const site of sites) {
    delete site._locMap;
  }

  return sites;
}

export default customerModel;