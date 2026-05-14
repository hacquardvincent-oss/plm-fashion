require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ── SÉCURITÉ & MIDDLEWARE ─────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMITING ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion.' },
});
app.use('/api/auth/login', authLimiter);

// ── ROUTES ────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/materials',   require('./routes/materials'));
app.use('/api/suppliers',   require('./routes/suppliers'));
app.use('/api/costing',     require('./routes/costing'));
app.use('/api/workflows',   require('./routes/workflows'));
app.use('/api/documents',   require('./routes/documents'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/fiches',      require('./routes/fiches'));
app.use('/api/spec-sheets', require('./routes/specsheets'));

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const { pool } = require('../config/database');
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: require('../package.json').version,
    });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable` });
});

// ── ERREURS GLOBALES ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message,
  });
});

// ── DÉMARRAGE ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 PLM Fashion API démarrée sur le port ${PORT}`);
  console.log(`   Environnement : ${process.env.NODE_ENV}`);
  console.log(`   Health check  : http://localhost:${PORT}/health`);
});

module.exports = app;
