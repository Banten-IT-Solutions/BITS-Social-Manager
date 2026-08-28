import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const REQUIRED = ['WORKER_NAME', 'D1_DATABASE_NAME', 'D1_DATABASE_ID', 'APP_URL', 'APP_DOMAIN'];

const env = { ...process.env };
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trimStart().startsWith('#')) {
      env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const missing = REQUIRED.filter(k => !env[k]);
if (missing.length > 0) {
  console.error(`Missing required variables: ${missing.join(', ')}`);
  console.error('Local: copy .env.example to .env and fill values.');
  console.error('CI: set GitHub Variables at Settings → Secrets and variables → Actions.');
  process.exit(1);
}

const template = readFileSync('wrangler.template.jsonc', 'utf8');
const output = template.replace(/\$\{([A-Za-z0-9_]+)\}/g, (_, key) => {
  const value = env[key];
  if (!value) {
    console.error(`Missing value for \${${key}}`);
    process.exit(1);
  }
  return JSON.stringify(value).slice(1, -1);
});

writeFileSync('wrangler.jsonc', output);

const leftover = output.match(/\$\{[A-Za-z0-9_]+\}/g);
if (leftover) {
  console.error(`Unreplaced placeholders: ${leftover.join(', ')}`);
  process.exit(1);
}

console.log('Generated wrangler.jsonc from wrangler.template.jsonc');
