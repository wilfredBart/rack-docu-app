import ApiError from '../../middleware/ApiError.js';
import locationModel from '../model/locationModel.js';

const locationController = {
  /**
   * GET /locations
   * GET /locations?site_id=12
   */
  async list(req, res, next) {
    try {
      const locations = await locationModel.getAll({ siteId: req.query.site_id });
      res.json(locations);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /locations/:id
   */
  async getOne(req, res, next) {
    try {
      const location = await locationModel.getById(req.params.id);
      if (!location) throw new ApiError(404, 'Location niet gevonden');
      res.json(location);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /locations/:id/racks
   */
  async getOneWithRacks(req, res, next) {
    try {
      const location = await locationModel.getWithRacks(req.params.id);
      if (!location) throw new ApiError(404, 'Location niet gevonden');
      res.json(location);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /locations
   */
  async create(req, res, next) {
    try {
      const { site_id, name, description } = req.body;

      if (!site_id) throw new ApiError(400, 'site_id is verplicht');
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const location = await locationModel.create({ siteId: site_id, name, description });
      res.status(201).json(location);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /locations/:id
   */
  async update(req, res, next) {
    try {
      const existing = await locationModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Location niet gevonden');

      const { name, description } = req.body;
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const location = await locationModel.update(req.params.id, { name, description });
      res.json(location);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /locations/:id
   */
  async remove(req, res, next) {
    try {
      const existing = await locationModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Location niet gevonden');

      const locationName = existing.name;

      await locationModel.delete(req.params.id);
      res.status(200).json({ message: `Location: ${locationName} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default locationController;
