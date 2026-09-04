import ApiError from '../../middleware/ApiError.js';
import deviceTypeModel from '../model/deviceTypeModel.js';

const deviceTypeController = {
  /**
   * GET /device-types
   */
  async list(req, res, next) {
    try {
      const types = await deviceTypeModel.getAll();
      res.json(types);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /device-types
   * Permanent, geldt voor alle klanten (het is een gedeelde lijst,
   * geen per-klant instelling). Elke ingelogde gebruiker mag toevoegen —
   * zelfde toegangsniveau als de meeste andere "aanmaken"-acties in de app.
   *
   * Voorkomt near-duplicates zoals "Server" / "server" / "Server " via een
   * expliciete case-insensitive check, i.p.v. enkel te vertrouwen op de
   * UNIQUE-constraint (die afhankelijk is van de database-collation).
   */
  async create(req, res, next) {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        throw new ApiError(400, 'Naam is verplicht');
      }

      const trimmedName = name.trim();

      const existing = await deviceTypeModel.findByNameCaseInsensitive(trimmedName);
      if (existing) {
        throw new ApiError(409, `Dit type bestaat al (als "${existing.name}")`);
      }

      const type = await deviceTypeModel.create(trimmedName);
      res.status(201).json(type);
    } catch (err) {
      next(err);
    }
  },
};

export default deviceTypeController;
