const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = (header && header.startsWith('Bearer '))
      ? header.split(' ')[1]
      : req.query.token ?? null;
    if (!token) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Essaie la requête enrichie avec organization, fallback sur la requête simple
    let userRow
    try {
      const result = await query(
        `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
                u.organization_id, o.name AS organization_name, o.slug AS organization_slug, o.plan AS organization_plan
         FROM users u
         LEFT JOIN organizations o ON o.id = u.organization_id
         WHERE u.id = $1`,
        [decoded.userId]
      )
      userRow = result.rows[0]
    } catch {
      // La table organizations n'existe pas encore (migration en attente)
      const result = await query(
        'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      )
      userRow = result.rows[0]
    }
    if (!userRow || !userRow.is_active) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou désactivé' });
    }
    req.user = userRow;
    req.orgId = userRow.organization_id ?? null;
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
