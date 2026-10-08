// Turns the ADMIN_EMAIL / ADMIN_PASSWORD secrets into a salted PBKDF2 hash the
// admin login can check against, so the raw credentials never reach the bundle.
//
// CI:     node scripts/hash-admin-credentials.mjs >> "$GITHUB_ENV"
// Local:  ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/hash-admin-credentials.mjs > .env.local
import { pbkdf2Sync, randomBytes } from "node:crypto";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must both be set.");
  process.exit(1);
}

// Keep in sync with src/admin/auth.ts.
const iterations = 600000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(`${email}\n${password}`, salt, iterations, 32, "sha256");

console.log(`VITE_ADMIN_SALT=${salt.toString("hex")}`);
console.log(`VITE_ADMIN_HASH=${hash.toString("hex")}`);
console.log(`VITE_ADMIN_ITERATIONS=${iterations}`);
