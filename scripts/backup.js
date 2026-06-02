#!/usr/bin/env node
/**
 * Backup PostgreSQL → fichier .sql.gz horodaté
 *
 * Usage :
 *   node scripts/backup.js
 *
 * Variables d'environnement requises :
 *   DATABASE_URL  — postgresql://user:pass@host:port/dbname
 *
 * Options via env :
 *   BACKUP_DIR    — dossier de destination (défaut : ./backups)
 *   BACKUP_KEEP   — nombre de fichiers à conserver (défaut : 7)
 */

require('dotenv').config()
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL manquant')
  process.exit(1)
}

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups')
const KEEP = parseInt(process.env.BACKUP_KEEP || '7', 10)

fs.mkdirSync(BACKUP_DIR, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const filename = `plm-fashion_${stamp}.sql.gz`
const filepath = path.join(BACKUP_DIR, filename)

console.log(`🔄  Backup en cours → ${filename}`)

try {
  execSync(`pg_dump "${DATABASE_URL}" | gzip > "${filepath}"`, { stdio: 'inherit', shell: true })
  const size = (fs.statSync(filepath).size / 1024).toFixed(1)
  console.log(`✅  Backup terminé (${size} KB) : ${filepath}`)
} catch (err) {
  console.error('❌  Échec du backup :', err.message)
  process.exit(1)
}

// Rotation : supprime les fichiers les plus anciens au-delà de KEEP
const files = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.startsWith('plm-fashion_') && f.endsWith('.sql.gz'))
  .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)

files.slice(KEEP).forEach(f => {
  fs.unlinkSync(path.join(BACKUP_DIR, f.name))
  console.log(`🗑️   Supprimé (rotation) : ${f.name}`)
})
