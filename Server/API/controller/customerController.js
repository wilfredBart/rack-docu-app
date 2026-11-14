import ApiError from '../../middleware/ApiError.js';
import customerModel from '../model/customerModel.js';

const clean = (v) => {
  const t = typeof v === 'string' ? v.trim() : '';
  return t || null;
};

/**
 * Valideert en normaliseert de setup-boom: sites → locations → racks.
 * Gooit een ApiError(400) met een duidelijke melding bij ongeldige input.
 */
function normalizeSetupSites(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ApiError(400, 'Minstens één site is verplicht');
  }

  return input.map((s, si) => {
    const name = clean(s?.name);
    if (!name) throw new ApiError(400, `Site ${si + 1}: naam is verplicht`);

    const locations = (Array.isArray(s.locations) ? s.locations : []).map((l, li) => {
      const locName = clean(l?.name);
      if (!locName) {
        throw new ApiError(400, `Site "${name}", locatie ${li + 1}: naam is verplicht`);
      }

      const racks = (Array.isArray(l.racks) ? l.racks : []).map((r, ri) => {
        const rackName = clean(r?.name);
        if (!rackName) {
          throw new ApiError(400, `Locatie "${locName}", rack ${ri + 1}: naam is verplicht`);
        }
        const raw = r.height_u;
        const height = raw === undefined || raw === null || raw === '' ? 42 : Number(raw);
        if (!Number.isInteger(height) || height < 1 || height > 100) {
          throw new ApiError(400, `Rack "${rackName}": hoogte moet een geheel getal tussen 1 en 100 zijn`);
        }
        return { name: rackName, height_u: height, notes: clean(r.notes) };
      });

      return { name: locName, description: clean(l.description), racks };
    });

    return {
      name,
      street: clean(s.street),
      house_number: clean(s.house_number),
      postal_code: clean(s.postal_code),
      city: clean(s.city),
      country: clean(s.country),
      locations,
    };
  });
}

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
   * GET /customers/:id/patchplans
   * Lijst van alle patchplannen (devices + panels), inclusief lege.
   */
  async listPatchPlans(req, res, next) {
    try {
      const customer = await customerModel.getById(req.params.id);
      if (!customer) throw new ApiError(404, 'Klant niet gevonden');
      const plans = await customerModel.listPatchPlans(req.params.id);
      res.json(plans);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /customers/:id/setup
   * Zet sites → locations → racks van een (nieuwe) klant in één transactie op.
   * Body: { sites: [{ name, street?, ..., locations: [{ name, description?, racks: [{ name, height_u? }] }] }] }
   */
  async setup(req, res, next) {
    try {
      const customer = await customerModel.getById(req.params.id);
      if (!customer) throw new ApiError(404, 'Klant niet gevonden');

      const sites = normalizeSetupSites(req.body?.sites);
      const created = await customerModel.setupTree(customer.id, sites);
      res.status(201).json({ sites: created });
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