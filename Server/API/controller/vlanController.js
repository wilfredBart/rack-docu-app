import ApiError from '../../middleware/ApiError.js';
import vlanModel from '../model/vlanModel.js';

// Vaste kleurensleutels (zelfde lijst als Client/src/pages/PatchPlan/vlanColors.js).
// Bewust geen LED-tinten (groen/amber/rood/cyaan): die zijn gereserveerd voor status.
export const VLAN_COLORS = ['indigo', 'violet', 'orchid', 'pink', 'sky', 'sand', 'slate', 'mauve'];

function parseBody(body) {
  const vlanNumber = Number(body.vlan_number);
  if (!Number.isInteger(vlanNumber) || vlanNumber < 1 || vlanNumber > 4094) {
    throw new ApiError(400, 'vlan_number moet een geheel getal tussen 1 en 4094 zijn');
  }
  if (!body.name || !String(body.name).trim()) throw new ApiError(400, 'Naam is verplicht');

  const color = body.color ?? 'indigo';
  if (!VLAN_COLORS.includes(color)) {
    throw new ApiError(400, `color moet een van deze waarden zijn: ${VLAN_COLORS.join(', ')}`);
  }

  return {
    vlanNumber,
    name: String(body.name).trim(),
    color,
    description: body.description ? String(body.description).trim() : null,
  };
}

const vlanController = {
  /**
   * GET /vlans?customer_id=3
   */
  async list(req, res, next) {
    try {
      if (!req.query.customer_id) throw new ApiError(400, 'customer_id is verplicht als query param');
      const vlans = await vlanModel.getAll({ customerId: req.query.customer_id });
      res.json(vlans);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /vlans
   * Body: { customer_id, vlan_number, name, color, description }
   * Dubbele (klant, vlan_number) geeft 409 via de errorHandler (ER_DUP_ENTRY).
   */
  async create(req, res, next) {
    try {
      if (!req.body.customer_id) throw new ApiError(400, 'customer_id is verplicht');
      const vlan = await vlanModel.create({
        customerId: req.body.customer_id,
        ...parseBody(req.body),
      });
      res.status(201).json(vlan);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /vlans/:id
   */
  async update(req, res, next) {
    try {
      const existing = await vlanModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'VLAN niet gevonden');

      const vlan = await vlanModel.update(req.params.id, parseBody(req.body));
      res.json(vlan);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /vlans/:id
   */
  async remove(req, res, next) {
    try {
      const existing = await vlanModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'VLAN niet gevonden');

      await vlanModel.delete(req.params.id);
      res.status(200).json({ message: `VLAN ${existing.vlan_number} (${existing.name}) werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default vlanController;
