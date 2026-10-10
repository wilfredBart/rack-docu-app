import ApiError from '../../middleware/ApiError.js';
import portModel from '../model/portModel.js';
import vlanModel from '../model/vlanModel.js';

const PORT_MODES = ['access', 'trunk'];

/**
 * Controleert of deze poorten de VLAN mogen krijgen:
 * enkel device-poorten, en enkel een VLAN van dezelfde klant.
 */
async function assertVlanAllowed(ports, vlanId) {
  const vlan = await vlanModel.getById(vlanId);
  if (!vlan) throw new ApiError(404, 'VLAN niet gevonden');

  const customerByDevice = new Map();
  for (const port of ports) {
    if (!port.device_id) {
      throw new ApiError(400, 'Een VLAN kan enkel op een device-poort ingesteld worden (patch panel-poorten erven via de connection)');
    }
    if (!customerByDevice.has(port.device_id)) {
      customerByDevice.set(port.device_id, await vlanModel.getCustomerIdForDevice(port.device_id));
    }
    if (customerByDevice.get(port.device_id) !== vlan.customer_id) {
      throw new ApiError(400, 'Deze VLAN hoort bij een andere klant');
    }
  }
}

const portController = {
  /**
   * GET /ports
   * GET /ports?device_id=22
   * GET /ports?patch_panel_id=5
   */
  async list(req, res, next) {
    try {
      const ports = await portModel.getAll({
        deviceId: req.query.device_id,
        patchPanelId: req.query.patch_panel_id,
      });
      res.json(ports);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /ports/:id
   */
  async getOne(req, res, next) {
    try {
      const port = await portModel.getById(req.params.id);
      if (!port) throw new ApiError(404, 'Port niet gevonden');
      res.json(port);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ports/bulk
   * Maakt meerdere poorten in één keer aan.
   * Body: { device_id: 22, count: 48, prefix: "Gi0/", port_type: "RJ45", speed: "1G" }
   * Optioneel: start_number (default 1)
   */
  async bulkCreate(req, res, next) {
    try {
      const { device_id, patch_panel_id, count, prefix, start_number, port_type, speed } = req.body;

      if (!device_id && !patch_panel_id) {
        throw new ApiError(400, 'device_id of patch_panel_id is verplicht');
      }
      if (device_id && patch_panel_id) {
        throw new ApiError(400, 'Kies enkel device_id OF patch_panel_id, niet beide');
      }
      if (!count || count < 1) {
        throw new ApiError(400, 'count is verplicht en moet groter dan 0 zijn');
      }
      if (count > 500) {
        throw new ApiError(400, 'count mag niet groter zijn dan 500 in één keer');
      }

      const ports = await portModel.bulkCreate({
        deviceId: device_id,
        patchPanelId: patch_panel_id,
        count,
        prefix: prefix ?? 'Port ',
        startNumber: start_number,
        portType: port_type,
        speed,
      });

      res.status(201).json(ports);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ports
   * Een port hoort bij een device OF een patch_panel, niet allebei tegelijk leeg.
   */
  async create(req, res, next) {
    try {
      const { device_id, patch_panel_id, name, port_type, speed } = req.body;

      if (!device_id && !patch_panel_id) {
        throw new ApiError(400, 'device_id of patch_panel_id is verplicht');
      }
      if (device_id && patch_panel_id) {
        throw new ApiError(400, 'Kies enkel device_id OF patch_panel_id, niet beide');
      }
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const port = await portModel.create({
        deviceId: device_id,
        patchPanelId: patch_panel_id,
        name,
        portType: port_type,
        speed,
      });

      res.status(201).json(port);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /ports/:id
   */
  async update(req, res, next) {
    try {
      const existing = await portModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Port niet gevonden');

      const { name, port_type, speed, port_mode, vlan_id } = req.body;
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');
      if (port_mode && !PORT_MODES.includes(port_mode)) {
        throw new ApiError(400, `port_mode moet ${PORT_MODES.join(' of ')} zijn`);
      }
      if (vlan_id) await assertVlanAllowed([existing], vlan_id);

      const port = await portModel.update(req.params.id, {
        name,
        portType: port_type,
        speed,
        portMode: port_mode,
        vlanId: vlan_id,
      });
      res.json(port);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /ports/vlan
   * Body: { port_ids: [1, 2, 3], vlan_id: 4, port_mode: "access" }
   * vlan_id: null wist de VLAN van die poorten. port_mode default "access".
   */
  async bulkSetVlan(req, res, next) {
    try {
      const { port_ids, vlan_id, port_mode } = req.body;

      if (!Array.isArray(port_ids) || port_ids.length === 0) {
        throw new ApiError(400, 'port_ids is verplicht (lijst met poort-id\'s)');
      }
      if (port_ids.length > 500) throw new ApiError(400, 'Maximum 500 poorten in één keer');
      if (port_mode && !PORT_MODES.includes(port_mode)) {
        throw new ApiError(400, `port_mode moet ${PORT_MODES.join(' of ')} zijn`);
      }

      const ports = await portModel.getByIds(port_ids);
      if (ports.length !== new Set(port_ids).size) throw new ApiError(404, 'Een of meer poorten bestaan niet');
      if (vlan_id) await assertVlanAllowed(ports, vlan_id);

      const updated = await portModel.bulkSetVlan(port_ids, {
        vlanId: vlan_id ?? null,
        portMode: vlan_id ? (port_mode ?? 'access') : null,
      });
      res.json({ message: `${updated} poort(en) bijgewerkt`, updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /ports/bulk?device_id=22
   * DELETE /ports/bulk?patch_panel_id=5
   * Verwijdert alle poorten van dat device/patch panel in één keer.
   */
  async bulkRemove(req, res, next) {
    try {
      const { device_id, patch_panel_id } = req.query;

      if (!device_id && !patch_panel_id) {
        throw new ApiError(400, 'device_id of patch_panel_id is verplicht als query param');
      }
      if (device_id && patch_panel_id) {
        throw new ApiError(400, 'Kies enkel device_id OF patch_panel_id, niet beide');
      }

      const deletedCount = await portModel.bulkDelete({
        deviceId: device_id,
        patchPanelId: patch_panel_id,
      });

      res.status(200).json({ message: `${deletedCount} poort(en) werden verwijderd` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /ports/:id
   */
  async remove(req, res, next) {
    try {
      const existing = await portModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Port niet gevonden');

      const portName = existing.name;

      await portModel.delete(req.params.id);
      res.status(200).json({ message: `Port: ${portName} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default portController;
