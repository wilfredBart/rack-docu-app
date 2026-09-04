import ApiError from '../../middleware/ApiError.js';
import patchPanelModel from '../model/patchPanelModel.js';
import { assertValidRackSlot } from '../model/rackSlotModel.js';

const patchPanelController = {
  async list(req, res, next) {
    try {
      const patchPanels = await patchPanelModel.getAll({ rackId: req.query.rack_id });
      res.json(patchPanels);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const patchPanel = await patchPanelModel.getById(req.params.id);
      if (!patchPanel) throw new ApiError(404, 'Patch panel niet gevonden');
      res.json(patchPanel);
    } catch (err) {
      next(err);
    }
  },

  async getOneWithPorts(req, res, next) {
    try {
      const patchPanel = await patchPanelModel.getWithPorts(req.params.id);
      if (!patchPanel) throw new ApiError(404, 'Patch panel niet gevonden');
      res.json(patchPanel);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { rack_id, label, type, manufacturer, model, port_count, rack_position, rack_units, notes } = req.body;

      if (!rack_id) throw new ApiError(400, 'rack_id is verplicht');
      if (!label || !label.trim()) throw new ApiError(400, 'Label is verplicht');
      if (!port_count) throw new ApiError(400, 'port_count is verplicht');
      if (rack_position === undefined || rack_position === null) {
        throw new ApiError(400, 'rack_position is verplicht');
      }

      await assertValidRackSlot({
        rackId: rack_id,
        position: rack_position,
        units: rack_units ?? 1,
      });

      const patchPanel = await patchPanelModel.create({
        rackId: rack_id,
        label,
        type,
        manufacturer,
        model,
        portCount: port_count,
        rackPosition: rack_position,
        rackUnits: rack_units,
        notes,
      });

      res.status(201).json(patchPanel);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const existing = await patchPanelModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Patch panel niet gevonden');

      const { label, type, manufacturer, model, port_count, rack_position, rack_units, notes } = req.body;
      if (!label || !label.trim()) throw new ApiError(400, 'Label is verplicht');

      const position = rack_position ?? existing.rack_position;
      const units = rack_units ?? existing.rack_units;

      await assertValidRackSlot({
        rackId: existing.rack_id,
        position,
        units,
        excludeType: 'patch_panel',
        excludeId: existing.id,
      });

      const patchPanel = await patchPanelModel.update(req.params.id, {
        label,
        type,
        manufacturer,
        model,
        portCount: port_count,
        rackPosition: position,
        rackUnits: units,
        notes,
      });

      res.json(patchPanel);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const existing = await patchPanelModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Patch panel niet gevonden');

      const patchPanelLabel = existing.label;

      await patchPanelModel.delete(req.params.id);
      res.status(200).json({ message: `Patch panel: ${patchPanelLabel} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default patchPanelController;
