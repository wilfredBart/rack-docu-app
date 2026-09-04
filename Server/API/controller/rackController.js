import ApiError from '../../middleware/ApiError.js';
import rackModel from '../model/rackModel.js';

const rackController = {
  /**
   * GET /racks
   * GET /racks?location_id=3
   */
  async list(req, res, next) {
    try {
      const racks = await rackModel.getAll({ locationId: req.query.location_id });
      res.json(racks);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /racks/:id
   */
  async getOne(req, res, next) {
    try {
      const rack = await rackModel.getById(req.params.id);
      if (!rack) throw new ApiError(404, 'Rack niet gevonden');
      res.json(rack);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /racks/:id/contents
   * Rack inclusief devices, patch panels en cable management.
   */
  async getOneWithContents(req, res, next) {
    try {
      const rack = await rackModel.getWithContents(req.params.id);
      if (!rack) throw new ApiError(404, 'Rack niet gevonden');
      res.json(rack);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /racks
   */
  async create(req, res, next) {
    try {
      const { location_id, name, height_u, notes } = req.body;

      if (!location_id) throw new ApiError(400, 'location_id is verplicht');
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const rack = await rackModel.create({
        locationId: location_id,
        name,
        heightU: height_u,
        notes,
      });

      res.status(201).json(rack);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /racks/:id
   */
  async update(req, res, next) {
    try {
      const existing = await rackModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Rack niet gevonden');

      const { name, height_u, notes } = req.body;
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const rack = await rackModel.update(req.params.id, {
        name,
        heightU: height_u,
        notes,
      });

      res.json(rack);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /racks/:id
   */
  async remove(req, res, next) {
    try {
      const existing = await rackModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Rack niet gevonden');

      const rackName = existing.name;

      await rackModel.delete(req.params.id);
      res.status(200).json({ message: `Rack: ${rackName} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default rackController;
