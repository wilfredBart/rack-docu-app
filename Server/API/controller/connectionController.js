import ApiError from '../../middleware/ApiError.js';
import connectionModel from '../model/connectionModel.js';

const connectionController = {
  /**
   * GET /connections
   * GET /connections?rack_id=7
   */
  async list(req, res, next) {
    try {
      const connections = await connectionModel.getAll({ rackId: req.query.rack_id });
      res.json(connections);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /connections/:id
   * Geeft leesbare details terug (poortnamen + device/patch panel labels).
   */
  async getOne(req, res, next) {
    try {
      const connection = await connectionModel.getByIdWithDetails(req.params.id);
      if (!connection) throw new ApiError(404, 'Connection niet gevonden');
      res.json(connection);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /connections
   */
  async create(req, res, next) {
    try {
      const { from_port_id, to_port_id, cable_label, cable_type } = req.body;

      if (!from_port_id) throw new ApiError(400, 'from_port_id is verplicht');
      if (!to_port_id) throw new ApiError(400, 'to_port_id is verplicht');
      if (from_port_id === to_port_id) {
        throw new ApiError(400, 'from_port_id en to_port_id mogen niet gelijk zijn');
      }

      const connection = await connectionModel.create({
        fromPortId: from_port_id,
        toPortId: to_port_id,
        cableLabel: cable_label,
        cableType: cable_type,
      });

      res.status(201).json(connection);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /connections/:id
   * Enkel cable_label/cable_type aanpasbaar — from/to_port_id niet,
   * daarvoor verwijder je de connection en maak je een nieuwe.
   */
  async update(req, res, next) {
    try {
      const existing = await connectionModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Connection niet gevonden');

      const { cable_label, cable_type } = req.body;

      const connection = await connectionModel.update(req.params.id, {
        cableLabel: cable_label,
        cableType: cable_type,
      });

      res.json(connection);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /connections/:id
   */
  async remove(req, res, next) {
    try {
      const existing = await connectionModel.getById(req.params.id);
      if (!existing) throw new ApiError(404, 'Connection niet gevonden');

      await connectionModel.delete(req.params.id);
      res.status(200).json({ message: `Connection #${req.params.id} werd verwijderd` });
    } catch (err) {
      next(err);
    }
  },
};

export default connectionController;
