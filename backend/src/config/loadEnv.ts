/**
 * Loads environment variables from the one shared secrets file that every
 * APEX project reads, so keys live in a single place.
 *
 * Where the file is: APEX_ENV_FILE if set, otherwise ~/.config/apex/secrets.env
 * (on Termux: /data/data/com.termux/files/home/.config/apex/secrets.env).
 *
 * Precedence, highest first:
 *   1. Variables already in the process environment
 *   2. <PROJECT>__NAME entries in the shared file, applied as NAME for this project
 *   3. Plain NAME entries in the shared file
 *   4. The project's own local .env, kept only as a fallback while you migrate
 * Blank values in the shared file are ignored.
 *
 * Same logic as loadEnv.js in the other repos; no dependencies.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

type Env = Record<string, string | undefined>;

export const ALIASES: Record<string, string> = {
  SUPABASE_PROJECT_URL: 'SUPABASE_URL',
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  TELEGRAM_TOKEN: 'TELEGRAM_BOT_TOKEN',
};

export interface LoadEnvOptions {
  project?: string;
  sharedFile?: string;
  localFile?: string | null;
  env?: Env;
  quiet?: boolean;
}

export interface LoadEnvResult {
  sharedFile: string;
  sharedFound: boolean;
  localFound: boolean;
  applied: number;
}

export function sharedEnvPath(env: Env = process.env): string {
  return env.APEX_ENV_FILE || path.join(os.homedir(), '.config', 'apex', 'secrets.env');
}

export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const raw = m[2];
    const q = raw[0];
    if (q === '"' || q === "'" || q === '`') {
      let body = raw.slice(1);
      while (body.indexOf(q) === -1 && i + 1 < lines.length) body += '\n' + lines[++i];
      const end = body.indexOf(q);
      let val = end === -1 ? body : body.slice(0, end);
      if (q === '"') val = val.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"');
      out[key] = val;
    } else {
      // An unquoted value that starts with # is a comment, so the value is blank.
      out[key] = raw.startsWith('#') ? '' : raw.replace(/\s+#.*$/, '').trim();
    }
  }
  return out;
}

function readIfPresent(file: string): string | null {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export function loadEnv(options: LoadEnvOptions = {}): LoadEnvResult {
  const env: Env = options.env || process.env;
  const project = options.project ? String(options.project).toUpperCase() : '';
  const sharedFile = options.sharedFile || sharedEnvPath(env);
  const localFile = options.localFile === undefined ? path.resolve(process.cwd(), '.env') : options.localFile;
  const log = options.quiet ? (_msg: string): void => undefined : (msg: string): void => console.log(`[env] ${msg}`);

  const merged: Record<string, string> = {};
  const localText = localFile ? readIfPresent(localFile) : null;
  if (localText !== null) Object.assign(merged, parseEnv(localText));

  const sharedText = readIfPresent(sharedFile);
  if (sharedText !== null) {
    const shared = parseEnv(sharedText);
    for (const [k, v] of Object.entries(shared)) {
      if (v === '' || k.includes('__')) continue;
      merged[k] = v;
    }
    if (project) {
      const prefix = `${project}__`;
      for (const [k, v] of Object.entries(shared)) {
        if (v !== '' && k.startsWith(prefix)) merged[k.slice(prefix.length)] = v;
      }
    }
    try {
      if (process.platform !== 'win32' && (fs.statSync(sharedFile).mode & 0o077)) {
        log(`warning: ${sharedFile} is readable by other users, run: chmod 600 "${sharedFile}"`);
      }
    } catch {
      // stat failure is not fatal
    }
  }

  for (const [alias, canonical] of Object.entries(ALIASES)) {
    if (merged[canonical] === undefined && merged[alias] !== undefined) merged[canonical] = merged[alias];
    if (merged[alias] === undefined && merged[canonical] !== undefined) merged[alias] = merged[canonical];
  }

  let applied = 0;
  for (const [k, v] of Object.entries(merged)) {
    if (env[k] === undefined) {
      env[k] = v;
      applied++;
    }
  }

  log(`${sharedText !== null ? `shared file ${sharedFile}` : `no shared file at ${sharedFile}`}`
    + `${localText !== null ? ', plus local .env fallback' : ''}; ${applied} variables set`);
  return { sharedFile, sharedFound: sharedText !== null, localFound: localText !== null, applied };
}
