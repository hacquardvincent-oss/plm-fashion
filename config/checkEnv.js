// Validation "fail-fast" des variables sensibles au démarrage.
// Évite de booter avec un JWT_SECRET placeholder ou un admin par défaut (faille immédiate).

// Placeholders connus. Match EXACT uniquement (+ préfixe "changez" du .env.example) :
// pas de match par sous-chaîne, pour ne jamais rejeter un vrai secret qui contiendrait
// par hasard le mot "secret".
const EXACT_PLACEHOLDERS = ['changeme', 'change_me', 'your_secret_here', 'secret', 'password'];

function isPlaceholder(value) {
  if (!value) return true;
  const low = String(value).toLowerCase().trim();
  if (low.startsWith('changez')) return true; // ex. "changez_ce_secret..." du .env.example
  return EXACT_PLACEHOLDERS.includes(low);
}

function fail(msg) {
  console.error(`\n❌ Configuration invalide : ${msg}`);
  console.error("   Corrigez les variables d'environnement puis relancez.\n");
  process.exit(1);
}

// Vérifie l'environnement. Fatal (exit 1) uniquement sur les cas qui empêchent un
// fonctionnement sûr : JWT_SECRET absent ou placeholder, ADMIN_PASSWORD par défaut en prod.
// La longueur insuffisante est un simple AVERTISSEMENT (ne bloque pas un déploiement existant).
function checkEnv() {
  const secret = process.env.JWT_SECRET;
  if (!secret) fail('JWT_SECRET manquante.');
  if (isPlaceholder(secret)) {
    fail('JWT_SECRET utilise une valeur placeholder — définissez un secret unique et aléatoire.');
  }
  if (secret.length < 16) {
    console.warn('⚠️  JWT_SECRET court (< 16 caractères) — un secret plus long est recommandé.');
  }

  if (process.env.NODE_ENV === 'production' && process.env.ADMIN_PASSWORD === 'Admin1234!') {
    fail('ADMIN_PASSWORD par défaut interdit en production.');
  }
}

module.exports = { checkEnv, isPlaceholder };
