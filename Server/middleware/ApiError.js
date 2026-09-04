/**
 * Gebruik: throw new ApiError(404, 'Site niet gevonden');
 * errorHandler pikt de .status automatisch op.
 */
export default class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
