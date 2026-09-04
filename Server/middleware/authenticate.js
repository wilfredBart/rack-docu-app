import jwt from 'jsonwebtoken';
import ApiError from './ApiError.js';

/**
 * Verifieert het JWT token uit de Authorization header ("Bearer <token>").
 * Zet bij succes req.user = { id, email, role }.
 */
export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return next(new ApiError(401, 'Niet ingelogd'));

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new ApiError(401, 'Ongeldige of verlopen sessie'));
  }
}
