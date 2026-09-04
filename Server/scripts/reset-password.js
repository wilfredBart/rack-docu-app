/**
 * Genereert een wachtwoord-reset-link, rechtstreeks op de server.
 * Geen email, geen SMTP — enkel terminal-toegang tot de server is nodig.
 *
 * GEBRUIK:
 *   node scripts/reset-password.js jouw@email.be
 *
 * Het script print een link. Open die link in de browser om via de
 * bestaande reset-pagina een nieuw wachtwoord in te stellen.
 * De link is 1 uur geldig en kan maar 1 keer gebruikt worden.
 *
 * VEILIGHEID: dit script raakt UITSLUITEND het reset_token_hash en
 * reset_token_expires veld van de opgegeven user aan. Geen enkele
 * andere data (customers, sites, racks, ...) wordt aangeraakt.
 */
import 'dotenv/config';
import crypto from 'crypto';
import pool from '../config/database.js';
import userModel from '../API/model/userModel.js';

const email = process.argv[2];

if (!email) {
  console.error('Gebruik: node scripts/reset-password.js <email>');
  process.exit(1);
}

async function main() {
  const user = await userModel.getByEmail(email);

  if (!user) {
    console.error(`Geen gebruiker gevonden met email: ${email}`);
    process.exit(1);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 uur geldig

  await userModel.setResetToken(user.id, tokenHash, expiresAt);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

  console.log('========================================');
  console.log(`Reset-link voor ${user.email} (${user.role}):`);
  console.log('');
  console.log(resetUrl);
  console.log('');
  console.log('Geldig gedurende 1 uur, werkt maar 1 keer.');
  console.log('========================================');

  process.exit(0);
}

main().catch((err) => {
  console.error('Er ging iets mis:', err.message);
  process.exit(1);
});
