// scripts/claims-check.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const FORBIDDEN_PHRASES = [
  { name: 'WCAG compliant', regex: /\bwcag\s+compliant\b/i },
  { name: 'WCAG 2.2 AA compliance', regex: /\bwcag\s*2\.2\s*aa\s+compliance\b/i },
  { name: 'fully accessible', regex: /\bfully\s+accessible\b/i },
  { name: 'production-ready', regex: /\bproduction[- ]ready\b/i },
  { name: 'bank-grade', regex: /\bbank[- ]grade\b/i },
  { name: 'secure', regex: /\bsecure\b/i },
  { name: 'bulletproof', regex: /\bbulletproof\b/i },
  { name: 'zero bugs', regex: /\bzero\s+bugs\b/i },
  { name: 'battle-tested', regex: /\bbattle[- ]tested\b/i },
  { name: 'used by', regex: /\bused\s+by\b/i },
  { name: 'customers', regex: /\bcustomers?\b/i },
  { name: 'improved conversion', regex: /\bimproved\s+conversion\b/i },
  { name: 'reduced incidents', regex: /\breduced\s+incidents\b/i },
  {
    name: 'users (except "end user")',
    regex: /\b(?<!end\s+)users\b/i,
  },
  {
    name: 'Revolut (prohibited except in docs/OUTREACH.md)',
    regex: /\brevolut\b/i,
    allowedIn: ['docs/OUTREACH.md'],
  },
];

export const DISCLOSURE_SENTENCES = [
  'This project was built with AI coding assistance (Gemini Flash, by Google). The design decisions, review and testing were directed by the author, and the test-first order is visible in the commit history.',
  'Northwind Pay is a fictional brand. This is an independent project and is not affiliated with, endorsed by or sponsored by any bank, payments company or employer.',
];

export function parseMetricsTable(metricsContent) {
  const metrics = new Map();
  const lines = metricsContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) {
      continue;
    }
    const parts = trimmed
      .split('|')
      .map((p) => p.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    if (parts.length >= 2) {
      const key = parts[0];
      const value = parts[1];
      if (key && key !== 'key' && !key.includes('---') && !key.startsWith('#')) {
        metrics.set(key, value);
      }
    }
  }
  return metrics;
}

export function normalizeText(text) {
  return text.replace(/[_*`]/g, '').replace(/\s+/g, ' ').trim();
}

export function checkDisclosures(readmeContent) {
  const errors = [];
  const normalizedReadme = normalizeText(readmeContent);

  for (const sentence of DISCLOSURE_SENTENCES) {
    const normalizedSentence = normalizeText(sentence);
    if (!normalizedReadme.includes(normalizedSentence)) {
      errors.push(`README.md is missing required disclosure sentence:\n  "${sentence}"`);
    }
  }
  return errors;
}

export function checkForbiddenPhrases(filePath, content, relativePath) {
  const errors = [];
  for (const item of FORBIDDEN_PHRASES) {
    if (item.allowedIn && item.allowedIn.includes(relativePath)) {
      continue;
    }
    if (item.regex.test(content)) {
      errors.push(`Forbidden phrase "${item.name}" found in ${relativePath}`);
    }
  }
  return errors;
}

export function checkMetricMarkers(filePath, content, relativePath, metricsMap) {
  const errors = [];
  const markerRegex = /<!-- metric:([A-Za-z0-9_]+) -->([\s\S]*?)<!-- \/metric -->/g;
  let match;

  while ((match = markerRegex.exec(content)) !== null) {
    const key = match[1];
    const displayedValue = match[2].trim();

    if (!metricsMap.has(key)) {
      errors.push(`Unknown metric key "${key}" in ${relativePath}`);
    } else {
      const recordedValue = metricsMap.get(key);
      if (displayedValue !== recordedValue) {
        errors.push(
          `Metric value mismatch for "${key}" in ${relativePath}: displayed "${displayedValue}" !== recorded "${recordedValue}"`,
        );
      }
    }
  }
  return errors;
}

export function checkUntrackedNumericClaims(filePath, content, relativePath) {
  const errors = [];
  // Strip legitimate metric markers first
  const stripped = content.replace(/<!-- metric:[A-Za-z0-9_]+ -->[\s\S]*?<!-- \/metric -->/g, '');

  const unitRegex = /\b(\d+(?:[.,]\d+)?)\s*(%|ms|KB|tests?|runs?|journeys?)\b/gi;
  let match;
  while ((match = unitRegex.exec(stripped)) !== null) {
    errors.push(
      `Untracked numeric claim "${match[0]}" found in ${relativePath}. Numbers with %, ms, KB, tests, runs, or journeys must be enclosed in <!-- metric:KEY -->...<!-- /metric -->`,
    );
  }
  return errors;
}

export function checkReleaseRequirements(rootDir) {
  const errors = [];
  const readmePath = path.join(rootDir, 'README.md');
  const a11yPath = path.join(rootDir, 'docs/A11Y_MANUAL.md');

  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf-8');
    if (content.includes('<DEMO_URL>')) {
      errors.push('Release check: README.md still contains <DEMO_URL> placeholder');
    }
    if (content.includes('<VIDEO_URL>')) {
      errors.push('Release check: README.md still contains <VIDEO_URL> placeholder');
    }
    if (/\bTODO\b/i.test(content)) {
      errors.push('Release check: README.md contains TODO marker');
    }
  }

  if (fs.existsSync(a11yPath)) {
    const a11yContent = fs.readFileSync(a11yPath, 'utf-8');
    const lines = a11yContent.split('\n');
    let emptyResultCount = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('|') &&
        !trimmed.includes('---') &&
        !trimmed.includes('Result column')
      ) {
        const parts = trimmed.split('|').map((p) => p.trim());
        // Column 3 is the result column
        if (parts.length >= 4 && parts[3] === '') {
          emptyResultCount++;
        }
      }
    }
    if (emptyResultCount > 0) {
      errors.push(
        `Release check: docs/A11Y_MANUAL.md has ${emptyResultCount} uncompleted checklist rows`,
      );
    }
  }

  return errors;
}

export function runClaimsCheck(options = {}) {
  const rootDir = options.rootDir || REPO_ROOT;
  const isRelease = options.release || false;
  const allErrors = [];

  const metricsPath = path.join(rootDir, 'docs/METRICS.md');
  if (!fs.existsSync(metricsPath)) {
    allErrors.push('Missing required file: docs/METRICS.md');
    return { passed: false, errors: allErrors };
  }

  const metricsContent = fs.readFileSync(metricsPath, 'utf-8');
  const metricsMap = parseMetricsTable(metricsContent);

  // Files checked for metric markers and untracked numbers:
  const claimsFiles = ['README.md', 'docs/CASE_STUDY.md'];
  for (const relPath of claimsFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    const markerErrors = checkMetricMarkers(fullPath, content, relPath, metricsMap);
    allErrors.push(...markerErrors);

    const untrackedErrors = checkUntrackedNumericClaims(fullPath, content, relPath);
    allErrors.push(...untrackedErrors);
  }

  // Files checked for forbidden phrases:
  const phraseFiles = [
    'README.md',
    'docs/CASE_STUDY.md',
    'docs/WALKTHROUGH_SCRIPT.md',
    'docs/OUTREACH.md',
  ];
  for (const relPath of phraseFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    const phraseErrors = checkForbiddenPhrases(fullPath, content, relPath);
    allErrors.push(...phraseErrors);
  }

  // Disclosures check in README.md:
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');
    const disclosureErrors = checkDisclosures(readmeContent);
    allErrors.push(...disclosureErrors);
  } else {
    allErrors.push('Missing README.md');
  }

  // Release-only checks:
  if (isRelease) {
    const releaseErrors = checkReleaseRequirements(rootDir);
    allErrors.push(...releaseErrors);
  }

  return {
    passed: allErrors.length === 0,
    errors: allErrors,
  };
}

export function runCli() {
  const isRelease = process.argv.includes('--release');
  console.log(
    `\n--- Claims Verification (scripts/claims-check.mjs${isRelease ? ' --release' : ''}) ---`,
  );

  const { passed, errors } = runClaimsCheck({ release: isRelease });

  if (!passed) {
    console.error('\nClaims verification failed with the following errors:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  } else {
    console.log('All claims checks passed successfully.');
    process.exit(0);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli();
}
