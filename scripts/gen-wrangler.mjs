/**
 * Generator wrangler.jsonc dari wrangler.template.jsonc.
 *
 * Sumber nilai ${VAR}:
 *  - lokal : file .env di root project (salin dari .env.example)
 *  - CI    : process.env (diisi GitHub Secrets oleh workflow)
 *
 * Dipakai oleh `npm run cf:config` — dipanggil otomatis sebelum dev/build/deploy.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const REQUIRED = [
  "WORKER_NAME",
  "D1_DATABASE_NAME",
  "D1_DATABASE_ID",
  "APP_URL",
  "APP_DOMAIN",
];

// 1. Kumpulkan env: process.env + .env (lokal)
const env = { ...process.env };
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trimStart().startsWith("#")) {
      env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

// 2. Validasi kelengkapan — gagal cepat dengan pesan jelas
const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length > 0) {
  console.error(
    `✗ Variabel konfigurasi belum diset: ${missing.join(", ")}\n` +
      "  Lokal : salin .env.example ke .env lalu isi nilainya.\n" +
      "  CI    : isi GitHub Secrets di Settings → Secrets and variables.",
  );
  process.exit(1);
}

// 3. Substitusi placeholder (JSON-escape agar nilai aman)
const template = readFileSync("wrangler.template.jsonc", "utf8");
const output = template.replace(/\$\{([A-Za-z0-9_]+)\}/g, (_, key) => {
  const value = env[key];
  if (!value) {
    console.error(`✗ Variabel \${${key}} kosong di environment`);
    process.exit(1);
  }
  return JSON.stringify(value).slice(1, -1);
});

writeFileSync("wrangler.jsonc", output);

// 4. Safety net: placeholder tersisa = typo nama variabel
const leftover = output.match(/\$\{[A-Za-z0-9_]+\}/g);
if (leftover) {
  console.error(`✗ Placeholder belum tersubstitusi: ${leftover.join(", ")}`);
  process.exit(1);
}

console.log("✓ wrangler.jsonc digenerate dari wrangler.template.jsonc");
