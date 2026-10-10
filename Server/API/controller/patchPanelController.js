import ApiError from '../../middleware/ApiError.js';
import patchPanelModel from '../model/patchPanelModel.js';
import portModel from '../model/portModel.js';
import { assertValidRackSlot } from '../model/rackSlotModel.js';

const patchPanelController = {
  async list(req, res, next) {
    try {
      const patchPanels = await patchPanelModel.getAll({ rackId: req.query.rack_id, siteId: req.query.site_id });
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

  /**
   * GET /patch-panels/:id/patchplan
   * Poorten + connection + VLAN (afgeleid van de andere kant) voor de patchplan-pagina.
   */
  async getPatchPlan(req, res, next) {
    try {
      const plan = await patchPanelModel.getPatchPlan(req.params.id);
      if (!plan) throw new ApiError(404, 'Patch panel niet gevonden');
      res.json(plan);
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

      // Poorten meteen aanmaken → leeg patchplan is meteen bruikbaar.
      const n = Number(port_count);
      if (n > 0) {
        await portModel.bulkCreate({
          patchPanelId: patchPanel.id,
          count: n,
          prefix: 'Port ',
          startNumber: 1,
          portType: 'RJ45',
          speed: '',
        });
      }

      const withPorts = await patchPanelModel.getWithPorts(patchPanel.id);
      res.status(201).json(withPorts);
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
