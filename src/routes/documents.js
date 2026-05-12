const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.dxf', '.ai', '.eps',
                     '.xlsx', '.xls', '.docx', '.doc', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`Format non supporté : ${ext}`));
  },
});

// GET /api/documents?entity_type=product&entity_id=xxx
router.get('/', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type et entity_id requis' });
    }
    const result = await query(`
      SELECT d.*, u.first_name || ' ' || u.last_name AS uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON u.id = d.uploaded_by
      WHERE d.entity_type = $1 AND d.entity_id = $2
      ORDER BY d.uploaded_at DESC`,
      [entity_type, entity_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });
    const { entity_type, entity_id, type, notes, is_public } = req.body;
    if (!entity_type || !entity_id || !type) {
      return res.status(400).json({ error: 'entity_type, entity_id et type requis' });
    }

    // Calculer la prochaine version
    const vRes = await query(`
      SELECT COALESCE(MAX(version), 0) + 1 AS next
      FROM documents WHERE entity_type = $1 AND entity_id = $2 AND name = $3`,
      [entity_type, entity_id, req.file.originalname]
    );

    // Archiver la version précédente
    await query(`
      UPDATE documents SET is_current = false
      WHERE entity_type = $1 AND entity_id = $2 AND name = $3`,
      [entity_type, entity_id, req.file.originalname]
    );

    const result = await query(`
      INSERT INTO documents (entity_type, entity_id, type, name, filename,
        storage_path, mime_type, file_size_bytes, version, is_public, uploaded_by, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [entity_type, entity_id, type, req.file.originalname, req.file.filename,
       req.file.path, req.file.mimetype, req.file.size,
       vRes.rows[0].next, is_public === 'true', req.user.id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

// GET /api/documents/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const result = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Document introuvable' });
    const doc = result.rows[0];

    // Vérifier les droits : fournisseurs ne voient que les docs publics
    if (req.user.role === 'fournisseur' && !doc.is_public) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    res.download(doc.storage_path, doc.name);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM documents WHERE id = $1 RETURNING storage_path',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Document introuvable' });
    const fs = require('fs');
    try { fs.unlinkSync(result.rows[0].storage_path); } catch (e) { /* fichier déjà supprimé */ }
    res.json({ message: 'Document supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
