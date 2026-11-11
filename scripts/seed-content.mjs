#!/usr/bin/env node
/**
 * Seeds sample Content Plan posts into the LOCAL D1 database only.
 *
 * Idempotent: a post is inserted only when the same account does not already
 * have a post with the same title. Entries whose account (platform + name)
 * does not exist for the user are skipped.
 *
 * Usage:
 *   npm run db:seed:local -- --email you@example.com
 *   node scripts/seed-content.mjs --email you@example.com
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    database: { type: 'string' },
  },
});

const DAY = 24 * 60 * 60;

/** Matches the demo accounts present in local dev (see local D1). */
const samples = [
  {
    platform: 'Instagram',
    account: 'Kopi Senja',
    title: 'Reels: Behind the scenes roasting biji kopi',
    description:
      'Bongkar proses roasting mingguan: suhu, durasi, dan profil rasa. Potong jadi 3 reels pendek.',
    status: 'scheduled',
    offset: 2 * DAY,
  },
  {
    platform: 'TikTok',
    account: 'kopisenja',
    title: 'Menu baru: es kopi susu gula aren',
    description:
      'Perkenalkan menu baru dengan video vertikal 15 detik: tuang espresso, susu, dan gula aren.',
    status: 'scheduled',
    offset: 4 * DAY,
  },
  {
    platform: 'YouTube',
    account: 'SDIT Al-Furqan Official',
    title: 'Video profil sekolah tahun ajaran baru',
    description: 'Tur fasilitas sekolah, kegiatan belajar, dan wawancara singkat guru serta siswa.',
    status: 'scheduled',
    offset: 7 * DAY,
  },
  {
    platform: 'Facebook',
    account: 'SDIT Al-Furqan',
    title: 'Penerimaan peserta didik baru dibuka',
    description:
      'Pengumuman gelombang pertama: jadwal, syarat, dan tautan formulir pendaftaran online.',
    status: 'published',
    offset: -3 * DAY,
  },
  {
    platform: 'LinkedIn',
    account: 'Nurul Imam',
    title: 'Draft: Tips mengelola akun sosial sekolah',
    description:
      'Rangkaian carousel: pemisahan akses admin, password manager, 2FA, dan audit akun lama.',
    status: 'draft',
    offset: null,
  },
];

function die(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function readDotEnv() {
  if (!existsSync('.env')) return {};
  const env = {};
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !line.trimStart().startsWith('#')) {
      env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const email = values.email;
if (!email) die('Missing --email (the app user whose accounts receive the samples).');

const database = values.database ?? readDotEnv().D1_DATABASE_NAME ?? 'bits-social-manager';

const sqlString = value => `'${String(value).replace(/'/g, "''")}'`;

const statements = samples.map(sample => {
  const scheduledAt =
    sample.offset === null ? 'NULL' : `unixepoch() + (${Math.trunc(sample.offset)})`;
  return `INSERT INTO posts (id, user_id, account_id, title, description, scheduled_at, status, created_at, updated_at)
SELECT lower(hex(randomblob(16))), p.user_id, a.id,
       ${sqlString(sample.title)}, ${sqlString(sample.description)},
       ${scheduledAt}, ${sqlString(sample.status)}, unixepoch(), unixepoch()
FROM social_accounts a
JOIN projects p ON a.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email = ${sqlString(email)}
  AND a.platform = ${sqlString(sample.platform)}
  AND a.account_name = ${sqlString(sample.account)}
  AND NOT EXISTS (
    SELECT 1 FROM posts x WHERE x.account_id = a.id AND x.title = ${sqlString(sample.title)}
  )
ORDER BY a.created_at
LIMIT 1;`;
});

const countSql = `SELECT COUNT(*) AS sample_posts FROM posts x
JOIN social_accounts a ON x.account_id = a.id
JOIN projects p ON a.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE u.email = ${sqlString(email)}
  AND x.title IN (${samples.map(sample => sqlString(sample.title)).join(', ')});`;

const sqlFile = join('/tmp/opencode', 'seed-content.sql');
mkdirSync(dirname(sqlFile), { recursive: true });
writeFileSync(sqlFile, `${statements.join('\n\n')}\n\n${countSql}\n`);

try {
  execFileSync('npx', ['wrangler', 'd1', 'execute', database, '--local', '--file', sqlFile], {
    stdio: 'inherit',
  });
} finally {
  rmSync(sqlFile, { force: true });
}

console.log(`\n✔ Sample content seeded for ${email} in local D1 (${database}).`);
