#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function genHex(len = 32) {
  return crypto.randomBytes(len).toString('hex');
}

const args = process.argv.slice(2);
const write = args.includes('--write') || args.includes('-w');
const envPath = path.join(process.cwd(), '.env');

let env = {};
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) env[m[1]] = m[2];
  });
}

const secrets = {};
if (!env.JWT_KEY) secrets.JWT_KEY = genHex(32);
if (!env.EXPRESS_SESSION_SECRET) secrets.EXPRESS_SESSION_SECRET = genHex(32);

if (Object.keys(secrets).length === 0) {
  console.log('All secrets already present in .env');
  Object.keys(env).forEach(k => {
    if (k === 'MONGODB_URI') console.log(`${k}=...`);
    else console.log(`${k}=${env[k]}`);
  });
  process.exit(0);
}

console.log('Generated secrets:');
Object.entries(secrets).forEach(([k,v]) => console.log(`${k}=${v}`));

if (write) {
  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath,'utf8').split(/\r?\n/) : [];
  const map = {};
  lines.forEach(l => {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) map[m[1]] = m[2];
  });
  Object.assign(map, secrets);
  const out = Object.keys(map).map(k => `${k}=${map[k]}`).join('\n') + '\n';
  fs.writeFileSync(envPath, out, { encoding: 'utf8', flag: 'w' });
  console.log('.env updated with generated secrets');
} else {
  console.log('\nRun `node tools/generate-secrets.js --write` to write these to .env');
}
