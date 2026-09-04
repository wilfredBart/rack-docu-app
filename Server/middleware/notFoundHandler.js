/**
 * Vangt requests op naar routes die nergens matchen.
 * Zet dit VOOR errorHandler, maar NA al je routers.
 */
export default function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Route niet gevonden: ${req.method} ${req.originalUrl}` });
}
