import ApiError from './ApiError.js';

/**
 * Gebruik NA authenticate. Beperkt een route tot bepaalde rollen.
 * Voorbeeld: router.delete('/:id', authenticate, authorize('admin'), controller.remove);
 */
export default function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Niet ingelogd'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Je hebt geen rechten voor deze actie'));
    }
    next();
  };
}
