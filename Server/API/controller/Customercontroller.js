import ApiError from '../../middleware/ApiError.js';
import customerModel from '../model/customerModel.js';

const customerController = {
  /**
   * GET /customers
   */
  async list(req, res, next) {
    try {
      const customers = await customerModel.getAll();
      res.json(customers);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /customers/:id
   */
  async getOne(req, res, next) {
    try {
      const customer = await customerModel.getById(req.params.id);
      if (!customer) throw new ApiError(404, 'Klant niet gevonden');
      res.json(customer);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /customers/:id/sites
   */
  async getOneWithSites(req, res, next) {
    try {
      const customer = await customerModel.getWithSites(req.params.id);
      if (!customer) throw new ApiError(404, 'Klant niet gevonden');
      res.json(customer);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /customers/:id/overview
   */
  async getOverview(req, res, next) {
    try {
      const overview = await customerModel.getOverview(req.params.id);
      if (!overview) throw new ApiError(404, 'Klant niet gevonden');
      res.json(overview);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /customers
   */
  async create(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        throw new ApiError(400, 'Naam is verplicht');
      }
      const customer = await customerModel.create({ name });
      res.status(201).json(customer);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /customers/:id
   */
  async update(req, res, next) {
    try {
      const existing = await customerModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Klant niet gevonden');

      const { name } = req.body;
      if (!name || !name.trim()) {
        throw new ApiError(400, 'Naam is verplicht');
      }

      const customer = await customerModel.update(req.params.id, { name });
      res.json(customer);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /customers/:id
   */
  async remove(req, res, next) {
    try {
      const existing = await customerModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Klant niet gevonden');

      const customerName = existing.name;

      await customerModel.delete(req.params.id);
      res.status(200).json({ message: `Klant: ${customerName} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default customerController;