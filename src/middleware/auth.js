const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    // Fallback: token en query param (pour les téléchargements directs <a href>)
    const token = (header && header.startsWith('Bearer '))
      ? header.split(' ')[1]
      : req.query.token ?? null;
    if (!token) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!result.rows.length || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou désactivé' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé — droits insuffisants' });
  }
  next();
};

module.exports = { authenticate, authorize };
