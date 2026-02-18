import Database from 'better-sqlite3';
import { ProxyHost, CreateProxyHostDto, UpdateProxyHostDto, Certificate, CreateCertificateDto } from 'shared';

const db = new Database('/data/proxy-manager.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS proxy_hosts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    target_url TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    ssl_enabled INTEGER DEFAULT 0,
    certificate_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (certificate_id) REFERENCES certificates(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    provider TEXT DEFAULT 'letsencrypt',
    cert_path TEXT NOT NULL,
    key_path TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

export const getAllProxyHosts = (): ProxyHost[] => {
  const stmt = db.prepare('SELECT * FROM proxy_hosts ORDER BY id DESC');
  const rows = stmt.all() as any[];
  return rows.map(row => ({
    id: row.id,
    domain: row.domain,
    targetUrl: row.target_url,
    enabled: row.enabled === 1,
    sslEnabled: row.ssl_enabled === 1,
    certificateId: row.certificate_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const getProxyHostById = (id: number): ProxyHost | null => {
  const stmt = db.prepare('SELECT * FROM proxy_hosts WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    domain: row.domain,
    targetUrl: row.target_url,
    enabled: row.enabled === 1,
    sslEnabled: row.ssl_enabled === 1,
    certificateId: row.certificate_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const createProxyHost = (data: CreateProxyHostDto): ProxyHost => {
  const stmt = db.prepare(`
    INSERT INTO proxy_hosts (domain, target_url, enabled, ssl_enabled, certificate_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.domain,
    data.targetUrl,
    data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    data.sslEnabled !== undefined ? (data.sslEnabled ? 1 : 0) : 0,
    data.certificateId || null
  );
  return getProxyHostById(result.lastInsertRowid as number)!;
};

export const updateProxyHost = (id: number, data: UpdateProxyHostDto): ProxyHost | null => {
  const existing = getProxyHostById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (data.domain !== undefined) {
    updates.push('domain = ?');
    values.push(data.domain);
  }
  if (data.targetUrl !== undefined) {
    updates.push('target_url = ?');
    values.push(data.targetUrl);
  }
  if (data.enabled !== undefined) {
    updates.push('enabled = ?');
    values.push(data.enabled ? 1 : 0);
  }
  if (data.sslEnabled !== undefined) {
    updates.push('ssl_enabled = ?');
    values.push(data.sslEnabled ? 1 : 0);
  }
  if (data.certificateId !== undefined) {
    updates.push('certificate_id = ?');
    values.push(data.certificateId);
  }

  if (updates.length === 0) return existing;

  updates.push("updated_at = datetime('now')");
  values.push(id);

  const stmt = db.prepare(`UPDATE proxy_hosts SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getProxyHostById(id);
};

export const deleteProxyHost = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM proxy_hosts WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export const getAllCertificates = (): Certificate[] => {
  const stmt = db.prepare('SELECT * FROM certificates ORDER BY id DESC');
  const rows = stmt.all() as any[];
  return rows.map(row => ({
    id: row.id,
    domain: row.domain,
    provider: row.provider,
    certPath: row.cert_path,
    keyPath: row.key_path,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  }));
};

export const getCertificateById = (id: number): Certificate | null => {
  const stmt = db.prepare('SELECT * FROM certificates WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    domain: row.domain,
    provider: row.provider,
    certPath: row.cert_path,
    keyPath: row.key_path,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
};

export const getCertificateByDomain = (domain: string): Certificate | null => {
  const stmt = db.prepare('SELECT * FROM certificates WHERE domain = ?');
  const row = stmt.get(domain) as any;
  if (!row) return null;
  return {
    id: row.id,
    domain: row.domain,
    provider: row.provider,
    certPath: row.cert_path,
    keyPath: row.key_path,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
};

export const createCertificate = (data: CreateCertificateDto, certPath: string, keyPath: string, expiresAt: string): Certificate => {
  const stmt = db.prepare(`
    INSERT INTO certificates (domain, provider, cert_path, key_path, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.domain,
    data.provider || 'letsencrypt',
    certPath,
    keyPath,
    expiresAt
  );
  return getCertificateById(result.lastInsertRowid as number)!;
};

export const deleteCertificate = (id: number): boolean => {
  const stmt = db.prepare('DELETE FROM certificates WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export default db;
