// Validation "fail-fast" des variables sensibles au démarrage.
// Évite de booter avec un JWT_SECRET placeholder ou un admin par défaut (faille immédiate).

const PLACEHOLDERS = [
  'changez_ce_secret',
  'change_me',
  'changeme',
  'your_secret_here',
  'secret',
];

function isPlaceholder(value) {
  if (!value) return true;
  const low = String(value).toLowerCase().trim();
  return PLACEHOLDERS.some((p) => low === p || low.includes(p));
}

function fail(msg) {
  console.error(`\n❌ Configuration invalide : ${msg}`);
  console.error("   Corrigez les variables d'environnement puis relancez.\n");
  process.exit(1);
}

// Vérifie l'environnement. Lève (process.exit 1) si un secret requis est absent/faible.
function checkEnv() {
  if (!process.env.DATABASE_URL) fail('DATABASE_URL manquante.');

  const secret = process.env.JWT_SECRET;
  if (!secret) fail('JWT_SECRET manquante.');
  if (isPlaceholder(secret)) {
    fail('JWT_SECRET utilise une valeur placeholder — définissez un secret unique et aléatoire.');
  }
  if (secret.length < 16) fail('JWT_SECRET trop court (< 16 caractères).');

  if (process.env.NODE_ENV === 'production' && process.env.ADMIN_PASSWORD === 'Admin1234!') {
    fail('ADMIN_PASSWORD par défaut interdit en production.');
  }
}

module.exports = { checkEnv, isPlaceholder };
