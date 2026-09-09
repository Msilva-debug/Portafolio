import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');
const envPath = resolve(rootDir, '.env');
const outputPath = resolve(rootDir, 'public/portfolio-config.json');

function parseEnv(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((values, line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        return values;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      return { ...values, [key]: value };
    }, {});
}

function readEnv() {
  try {
    return parseEnv(readFileSync(envPath, 'utf8'));
  } catch {
    return {};
  }
}

const env = { ...readEnv(), ...process.env };
const projectSlugs = (env['PORTFOLIO_PROJECT_SLUGS'] || '')
  .split(',')
  .map((slug) => slug.trim())
  .filter(Boolean);

function normalizeEnvKey(value) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const projectApplications = projectSlugs.reduce((applications, slug) => {
  const envSlug = normalizeEnvKey(slug);
  const url = (env[`PORTFOLIO_APP_URL_${envSlug}`] || '').trim();
  const links = /^https?:\/\//i.test(url) ? [{ label: 'Aplicación', url }] : [];

  return links.length > 0 ? { ...applications, [slug]: links } : applications;
}, {});

const config = {
  projectsBaseUrl: env['PORTFOLIO_PROJECTS_BASE_URL'] || '',
  projectSlugs,
  projectApplications,
};

mkdirSync(resolve(rootDir, 'public'), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);
