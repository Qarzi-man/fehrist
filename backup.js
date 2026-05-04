/**
 * Daftarcha — Supabase backup script
 * Запуск: node backup.js
 * Требует: Node 18+ (встроенный fetch)
 *
 * Нужен SERVICE ROLE KEY (не anon key) — он в Supabase Dashboard:
 * Project Settings → API → service_role (secret)
 */

const SUPABASE_URL = 'https://fortxhggcnvbhrapkaul.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || '';

const TABLES = ['businesses', 'debts', 'payments', 'admins'];

// ─── helpers ────────────────────────────────────────────────────────────────

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${table}] HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    cols.join(','),
    ...rows.map(r => cols.map(c => escape(r[c])).join(',')),
  ].join('\n');
}

// ─── main ────────────────────────────────────────────────────────────────────

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

(async () => {
  if (!SERVICE_KEY) {
    console.error('❌  Укажи SERVICE KEY:\n   SUPABASE_SERVICE_KEY=your_key node backup.js');
    process.exit(1);
  }

  const dir = join(process.cwd(), 'backups', timestamp());
  await mkdir(dir, { recursive: true });
  console.log(`📁  Папка: ${dir}\n`);

  let ok = 0;
  for (const table of TABLES) {
    try {
      const rows = await fetchTable(table);
      await writeFile(join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
      await writeFile(join(dir, `${table}.csv`),  toCSV(rows));
      console.log(`✅  ${table.padEnd(15)} ${rows.length} строк`);
      ok++;
    } catch (e) {
      console.error(`❌  ${table.padEnd(15)} ${e.message}`);
    }
  }

  console.log(`\n${ok}/${TABLES.length} таблиц сохранено → backups/${timestamp().slice(0,10)}`);
})();
