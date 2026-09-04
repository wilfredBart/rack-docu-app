import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ApiError from '../../middleware/ApiError.js';
import userModel from '../model/userModel.js';

const SALT_ROUNDS = 12;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
  );
}

const authController = {
  /**
   * GET /auth/setup-status
   * Publiek endpoint. Frontend gebruikt dit om te weten of het
   * eerste-admin-setup-scherm getoond moet worden.
   */
  async setupStatus(req, res, next) {
    try {
      const hasAdmin = await userModel.hasAdmin();
      res.json({ setupRequired: !hasAdmin });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/setup
   * Maakt de EERSTE admin aan. Werkt enkel als er nog geen enkele
   * admin bestaat — daarna geeft dit endpoint altijd 409, ook als
   * iemand het opnieuw zou proberen aanroepen.
   */
  async setup(req, res, next) {
    try {
      const hasAdmin = await userModel.hasAdmin();
      if (hasAdmin) {
        throw new ApiError(409, 'Setup is al voltooid, er bestaat al een admin');
      }

      const { email, password, name } = req.body;

      if (!email || !email.trim()) throw new ApiError(400, 'Email is verplicht');
      if (!password || password.length < 8) {
        throw new ApiError(400, 'Wachtwoord moet minstens 8 karakters bevatten');
      }
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const existing = await userModel.getByEmail(email);
      if (existing) throw new ApiError(409, 'Er bestaat al een account met dit email-adres');

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await userModel.create({ email, passwordHash, name, role: 'admin' });

      const token = generateToken(user);
      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/register
   * Iedereen kan zichzelf registreren als 'user'. Enkel een admin kan
   * via userController.updateRole iemand tot admin promoveren — dit
   * endpoint accepteert dus GEEN role uit de request body.
   */
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      if (!email || !email.trim()) throw new ApiError(400, 'Email is verplicht');
      if (!password || password.length < 8) {
        throw new ApiError(400, 'Wachtwoord moet minstens 8 karakters bevatten');
      }
      if (!name || !name.trim()) throw new ApiError(400, 'Naam is verplicht');

      const existing = await userModel.getByEmail(email);
      if (existing) throw new ApiError(409, 'Er bestaat al een account met dit email-adres');

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await userModel.create({ email, passwordHash, name, role: 'user' });

      const token = generateToken(user);
      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, 'Email en wachtwoord zijn verplicht');
      }

      const user = await userModel.getByEmail(email);
    
      if (!user) throw new ApiError(401, 'Ongeldige combinatie van email en wachtwoord');

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) throw new ApiError(401, 'Ongeldige combinatie van email en/of wachtwoord');

      const token = generateToken(user);
      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /auth/recovery-reset
   * Wordt ENKEL aangeroepen vanaf de local-only recovery-pagina.
   * Geen token, geen login — de beveiliging is de localOnly-middleware
   * op de route, die enkel requests van de server zelf toelaat.
   */
  async recoveryReset(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !email.trim()) throw new ApiError(400, 'Email is verplicht');
      if (!password || password.length < 8) {
        throw new ApiError(400, 'Wachtwoord moet minstens 8 karakters bevatten');
      }

      const user = await userModel.getByEmail(email);
      if (!user) throw new ApiError(404, 'Geen gebruiker gevonden met dit email-adres');

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      await userModel.resetPasswordByEmail(email, passwordHash);

      res.json({ message: `Wachtwoord van ${email} werd succesvol gewijzigd.` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /auth/me
   * Geeft de ingelogde gebruiker terug op basis van het meegestuurde token.
   */
  async me(req, res, next) {
    try {
      const user = await userModel.getById(req.user.id);
      if (!user) throw new ApiError(404, 'Gebruiker niet gevonden');
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
