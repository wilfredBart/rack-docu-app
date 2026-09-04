/**
 * Centrale error-handling middleware.
 * Express herkent dit als error-handler dankzij de 4 parameters (err, req, res, next).
 * Moet ALS LAATSTE toegevoegd worden aan de app, na alle routes.
 */
export default function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  let message = err.message || 'Er is iets misgegaan op de server';

  // 1. Specifieke afhandeling voor veelvoorkomende MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Deze waarde bestaat al (duplicate entry)', error: 'Duplicate Entry' });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'Ongeldige referentie: gekoppelde record bestaat niet of wordt nog gebruikt', error: 'Constraint Violated' });
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(400).json({ message: 'Onbekend veld in de query', error: 'Bad Field' });
  }

  if (err.errno === 3819 || err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({ message: 'Ongeldige combinatie van velden (check constraint geschonden)', error: 'Check Constraint Violated' });
  }

  // 2. Schone logging in de terminal:
  // Alleen een volledige stacktrace printen als het een échte serverfout is (500)
  if (status >= 500) {
    console.error(`💥 [SERVER ERROR ${status}]:`, err);
  } else {
    console.warn(`⚠️ [CLIENT WARN ${status}]: ${req.method} ${req.originalUrl} - ${message}`);
  }

  // 3. Stuur 'message' én 'error' terug zodat zowel je frontend als oude code werkt
  res.status(status).json({
    message: message,
    error: message,
    status: status
  });
}