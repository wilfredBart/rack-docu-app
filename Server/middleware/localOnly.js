import ApiError from './ApiError.js';

/**
 * Laat enkel requests door die van de server zelf komen (localhost/127.0.0.1).
 * Gebruikt voor de admin-recovery pagina — geen token, geen login nodig,
 * de beveiliging komt van fysieke/lokale toegang tot de server.
 */
export default function localOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;

  const isLocal =
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1';

  if (!isLocal) {
    return next(new ApiError(403, 'Deze pagina is enkel bereikbaar vanaf de server zelf'));
  }

  next();
}
