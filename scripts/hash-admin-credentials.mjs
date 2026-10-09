// Turns the ADMIN_EMAIL / ADMIN_PASSWORD secrets into values the admin login
// can check against, so the raw credentials never reach the bundle.
//   K    = PBKDF2-SHA256("email\npassword", salt, 600k)   (never published)
//   HASH = SHA-256(K)                                       (published fingerprint)
// Keep in sync with src/admin/auth.ts.
//
// CI:     node scripts/hash-admin-credentials.mjs >> "$GITHUB_ENV"
// Local:  ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/hash-admin-credentials.mjs > .env.local
import { createHash, pbkdf2Sync, randomBytes } from "node:crypto";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  // Shown as a warning on the GitHub Actions run; the site still deploys without an admin login.
  console.error("::warning::ADMIN_EMAIL and ADMIN_PASSWORD secrets are not set, so the admin panel will show “sign-in isn’t set up”.");
  process.exit(0);
}

// The salt and fingerprint are public, so a weak password can be guessed offline.
const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
if (password.length < 16 || classes < 3) {
  console.error("::warning::ADMIN_PASSWORD is weak. Use at least 16 characters mixing upper/lower case, digits and symbols (a password manager's generator is ideal).");
}

const iterations = 600000;
const salt = randomBytes(16);
const key = pbkdf2Sync(`${email}\n${password}`, salt, iterations, 32, "sha256");

console.log(`VITE_ADMIN_SALT=${salt.toString("hex")}`);
console.log(`VITE_ADMIN_HASH=${createHash("sha256").update(key).digest("hex")}`);
console.log(`VITE_ADMIN_ITERATIONS=${iterations}`);
