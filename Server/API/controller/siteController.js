import ApiError from '../../middleware/ApiError.js';
import siteModel from '../model/siteModel.js';

const siteController = {
  /**
   * GET /sites
   * GET /sites?customer_id=5
   */
  async list(req, res, next) {
    try {
      const sites = await siteModel.getAll({ customerId: req.query.customer_id });
      res.json(sites);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /sites/:id
   */
  async getOne(req, res, next) {
    try {
      const site = await siteModel.getById(req.params.id);
      if (!site) throw new ApiError(404, 'Site niet gevonden');
      res.json(site);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /sites/:id/locations
   */
  async getOneWithLocations(req, res, next) {
    try {
      const site = await siteModel.getWithLocations(req.params.id);
      if (!site) throw new ApiError(404, 'Site niet gevonden');
      res.json(site);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /sites
   */
  async create(req, res, next) {
    try {
      const { customer_id, name, street, house_number, postal_code, city, country } = req.body;

      if (!customer_id) throw new ApiError(400, 'customer_id is verplicht');
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const site = await siteModel.create({
        customerId: customer_id,
        name,
        street,
        houseNumber: house_number,
        postalCode: postal_code,
        city,
        country,
      });

      res.status(201).json(site);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /sites/:id
   */
  async update(req, res, next) {
    try {
      const existing = await siteModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Site niet gevonden');

      const { name, street, house_number, postal_code, city, country } = req.body;
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const site = await siteModel.update(req.params.id, {
        name,
        street,
        houseNumber: house_number,
        postalCode: postal_code,
        city,
        country,
      });

      res.json(site);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /sites/:id
   */
  async remove(req, res, next) {
    try {
      const existing = await siteModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Site niet gevonden');

      const siteName = existing.name;

      await siteModel.delete(req.params.id);
      res.status(200).json({ message: `Site: ${siteName} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default siteController;
