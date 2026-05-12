const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users — admin seulement
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_active, last_login_at, created_at
       FROM users ORDER BY last_name, first_name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/users — créer un utilisateur
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, supplier_id } = req.body;
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mot de passe trop court (min. 8 caractères)' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, supplier_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, email, first_name, last_name, role, is_active, created_at`,
      [email.toLowerCase().trim(), hash, first_name, last_name, role, supplier_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', authorize('admin'), async (req, res) => {
  try {
    const allowed = ['first_name', 'last_name', 'role', 'is_active', 'supplier_id'];
    const updates = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'Aucun champ valide' });
    const sets = updates.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE users SET ${sets} WHERE id = $1
       RETURNING id, email, first_name, last_name, role, is_active`,
      [req.params.id, ...updates.map(k => req.body[k])]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
