import pool from '../../config/database.js';

const userModel = {
  async getByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  /**
   * Checkt of er al minstens één admin bestaat.
   * Gebruikt door de setup-flow om te weten of het setup-scherm nog nodig is.
   */
  async hasAdmin() {
    const [rows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    return rows.length > 0;
  },

  async getById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  /**
   * Maakt een nieuwe user aan. passwordHash moet al gehasht zijn
   * (gebeurt in de controller via bcrypt) — dit model bevat GEEN hashing-logica,
   * enkel SQL, zoals bij de andere modellen.
   */
  async create({ email, passwordHash, name, role }) {
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, role ?? 'user']
    );
    return this.getById(result.insertId);
  },

  async getAll() {
    const [rows] = await pool.query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY name ASC'
    );
    return rows;
  },

  async updateRole(id, role) {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return this.getById(id);
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Directe wachtwoord-reset via email, GEEN token nodig.
   * Enkel te gebruiken via de local-only recovery pagina — de beveiliging
   * komt daar van localhost-toegang, niet van een token.
   */
  async resetPasswordByEmail(email, passwordHash) {
    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, email]
    );
    return result.affectedRows > 0;
  },
};

export default userModel;
