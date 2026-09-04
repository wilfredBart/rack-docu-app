import ApiError from '../../middleware/ApiError.js';
import cableManagementModel from '../model/cableManagementModel.js';
import { assertValidRackSlot } from '../model/rackSlotModel.js';

const cableManagementController = {
  async list(req, res, next) {
    try {
      const items = await cableManagementModel.getAll({ rackId: req.query.rack_id });
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const item = await cableManagementModel.getById(req.params.id);
      if (!item) throw new ApiError(404, 'Cable management item niet gevonden');
      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { rack_id, label, type, rack_position, rack_units, notes } = req.body;

      if (!rack_id) throw new ApiError(400, 'rack_id is verplicht');
      if (rack_position === undefined || rack_position === null) {
        throw new ApiError(400, 'rack_position is verplicht');
      }

      await assertValidRackSlot({
        rackId: rack_id,
        position: rack_position,
        units: rack_units ?? 1,
      });

      const item = await cableManagementModel.create({
        rackId: rack_id,
        label,
        type,
        rackPosition: rack_position,
        rackUnits: rack_units,
        notes,
      });

      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await cableManagementModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Cable management item niet gevonden');

      const { label, type, rack_position, rack_units, notes } = req.body;

      const position = rack_position ?? existing.rack_position;
      const units = rack_units ?? existing.rack_units;

      await assertValidRackSlot({
        rackId: existing.rack_id,
        position,
        units,
        excludeType: 'cable_management',
        excludeId: existing.id,
      });

      const item = await cableManagementModel.update(req.params.id, {
        label,
        type,
        rackPosition: position,
        rackUnits: units,
        notes,
      });

      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const existing = await cableManagementModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Cable management item niet gevonden');

      const label = existing.label ?? `#${existing.id}`;

      await cableManagementModel.delete(req.params.id);
      res.status(200).json({ message: `Cable management: ${label} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default cableManagementController;
