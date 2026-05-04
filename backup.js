/**
 * Daftarcha — Supabase backup script
 * Запуск: node backup.js
 * Requires: Node 18+
 *
 * Ключ берётся из файла .env (SUPABASE_SERVICE_KEY=...)
 * Получить: Supabase Dashboard → Project Settings → API → service_role
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

// читаем .env без сторонних пакетов
async function loadEnv() {
  try {
    const text = await readFile(join(__dir, '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}

const SUPABASE_URL = 'https://fortxhggcnvbhrapkaul.supabase.co';
const TABLES = ['businesses', 'debts', 'payments', 'admins'];

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

async function fetchTable(table, key) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = v => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

(async () => {
  await loadEnv();
  const KEY = process.env.SUPABASE_SERVICE_KEY || '';

  if (!KEY) {
    console.error('❌  Не найден ключ. Создай файл .env:\n   SUPABASE_SERVICE_KEY=твой_service_role_ключ');
    process.exit(1);
  }

  const ts  = timestamp();
  const dir = join(__dir, 'backups', ts);
  await mkdir(dir, { recursive: true });
  console.log(`\n📦  Daftarcha Backup — ${ts}\n📁  ${dir}\n`);

  let ok = 0;
  for (const table of TABLES) {
    try {
      const rows = await fetchTable(table, KEY);
      await writeFile(join(dir, `${table}.json`), JSON.stringify(rows, null, 2), 'utf8');
      await writeFile(join(dir, `${table}.csv`),  toCSV(rows), 'utf8');
      console.log(`  ✅  ${table.padEnd(14)} ${rows.length} строк`);
      ok++;
    } catch (e) {
      console.error(`  ❌  ${table.padEnd(14)} ${e.message}`);
    }
  }

  console.log(`\n✔  ${ok}/${TABLES.length} таблиц сохранено\n`);
})();
