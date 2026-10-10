import ApiError from '../../middleware/ApiError.js';
import deviceModel from '../model/deviceModel.js';
import portModel from '../model/portModel.js';
import { assertValidRackSlot, moveRackItem } from '../model/rackSlotModel.js';

const deviceController = {
  async list(req, res, next) {
    try {
      const devices = await deviceModel.getAll({ rackId: req.query.rack_id });
      res.json(devices);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const device = await deviceModel.getByIdWithType(req.params.id);
      if (!device) throw new ApiError(404, 'Device niet gevonden');
      res.json(device);
    } catch (err) {
      next(err);
    }
  },

  async getOneWithPorts(req, res, next) {
    try {
      const device = await deviceModel.getWithPorts(req.params.id);
      if (!device) throw new ApiError(404, 'Device niet gevonden');
      res.json(device);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /devices/:id/patchplan
   * Poorten + connection + VLAN van dit device (engineer-view).
   */
  async getPatchPlan(req, res, next) {
    try {
      const plan = await deviceModel.getPatchPlan(req.params.id);
      if (!plan) throw new ApiError(404, 'Device niet gevonden');
      res.json(plan);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /devices
   * Valideert nu ook of de opgegeven rack-positie geldig/vrij is,
   * over devices, patch_panels EN cable_management heen.
   */
  async create(req, res, next) {
    try {
      const {
        rack_id,
        device_type_id,
        label,
        manufacturer,
        model,
        serial_number,
        mac_address,
        rack_position,
        rack_units,
        notes,
        port_count,
      } = req.body;

      if (!rack_id) throw new ApiError(400, 'rack_id is verplicht');
      if (!device_type_id) throw new ApiError(400, 'device_type_id is verplicht');
      if (!label || !label.trim()) throw new ApiError(400, 'Label is verplicht');
      if (rack_position === undefined || rack_position === null) {
        throw new ApiError(400, 'rack_position is verplicht');
      }

      await assertValidRackSlot({
        rackId: rack_id,
        position: rack_position,
        units: rack_units ?? 1,
      });

      const device = await deviceModel.create({
        rackId: rack_id,
        deviceTypeId: device_type_id,
        label,
        manufacturer,
        model,
        serialNumber: serial_number,
        macAddress: mac_address,
        rackPosition: rack_position,
        rackUnits: rack_units,
        notes,
      });

      // Patchplan-shell: poorten meteen aanmaken als port_count is meegegeven.
      const n = Number(port_count);
      if (n > 0) {
        await portModel.bulkCreate({
          deviceId: device.id,
          count: n,
          prefix: 'Port ',
          startNumber: 1,
          portType: 'RJ45',
          speed: '',
        });
      }

      const withPorts = await deviceModel.getWithPorts(device.id);
      res.status(201).json(withPorts);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /devices/:id
   * Zelfde validatie, maar sluit zichzelf uit als "conflict"
   * (anders zou je nooit een bestaand device kunnen opslaan zonder
   * dat het botst met zijn eigen huidige positie).
   */
  async update(req, res, next) {
    try {
      const existing = await deviceModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Device niet gevonden');

      const {
        device_type_id,
        label,
        manufacturer,
        model,
        serial_number,
        mac_address,
        rack_position,
        rack_units,
        notes,
      } = req.body;

      if (!label || !label.trim()) throw new ApiError(400, 'Label is verplicht');

      const position = rack_position ?? existing.rack_position;
      const units = rack_units ?? existing.rack_units;

      await assertValidRackSlot({
        rackId: existing.rack_id,
        position,
        units,
        excludeType: 'device',
        excludeId: existing.id,
      });

      const device = await deviceModel.update(req.params.id, {
        deviceTypeId: device_type_id,
        label,
        manufacturer,
        model,
        serialNumber: serial_number,
        macAddress: mac_address,
        rackPosition: position,
        rackUnits: units,
        notes,
      });

      res.json(device);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /{id}/position
   * Body: { rack_position }. Verplaatst enkel de positie (drag & drop in de rack-view).
   */
  async move(req, res, next) {
    try {
      const item = await moveRackItem('device', req.params.id, req.body.rack_position);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const existing = await deviceModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Device niet gevonden');

      const deviceLabel = existing.label;

      await deviceModel.delete(req.params.id);
      res.status(200).json({ message: `Device: ${deviceLabel} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default deviceController;
