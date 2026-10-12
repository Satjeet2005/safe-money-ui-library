// scripts/size.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

export const BUDGETS = {
  money: 6144, // 6 KB (6,144 bytes)
  submit: 4096, // 4 KB (4,096 bytes)
  boundary: 1024, // 1 KB (1,024 bytes)
  react: 6144, // 6 KB (6,144 bytes)
  app: 204800, // 200 KB (204,800 bytes)
};

export function measureEsmGzip(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath);
  const compressed = zlib.gzipSync(content, { level: 9 });
  return compressed.length;
}

export function findFilesByExtension(dirPath, ext) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesByExtension(fullPath, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

export function measureAppJsSum(distDir) {
  const jsFiles = findFilesByExtension(distDir, '.js');
  if (jsFiles.length === 0) {
    return null;
  }
  let totalBytes = 0;
  for (const file of jsFiles) {
    const stat = fs.statSync(file);
    totalBytes += stat.size;
  }
  return totalBytes;
}

export function checkBudgets(options = {}) {
  const root = options.rootDir || REPO_ROOT;
  const libDist = path.join(root, 'packages/safe-money-ui/dist');
  const appDist = path.join(root, 'apps/transfer-demo/dist');

  const libraryEntries = ['money', 'submit', 'boundary', 'react'];
  const results = [];
  let hasFailure = false;

  for (const entry of libraryEntries) {
    const mjsPath = path.join(libDist, entry, 'index.mjs');
    const jsPath = path.join(libDist, entry, 'index.js');
    const targetFile = fs.existsSync(mjsPath) ? mjsPath : fs.existsSync(jsPath) ? jsPath : null;

    const measuredBytes = targetFile ? measureEsmGzip(targetFile) : null;
    const budget = BUDGETS[entry];
    const passed = measuredBytes !== null ? measuredBytes <= budget : true;

    if (measuredBytes !== null && !passed) {
      hasFailure = true;
    }

    results.push({
      target: `./${entry}`,
      type: 'library (gzip level 9)',
      measured: measuredBytes,
      budget,
      passed,
      status: measuredBytes === null ? 'not measured' : passed ? 'PASS' : 'FAIL (OVER BUDGET)',
    });
  }

  const appBytes = measureAppJsSum(appDist);
  const appBudget = BUDGETS.app;
  const appPassed = appBytes !== null ? appBytes <= appBudget : true;

  if (appBytes !== null && !appPassed) {
    hasFailure = true;
  }

  results.push({
    target: 'App JavaScript, combined',
    type: 'app (.js bundle sum)',
    measured: appBytes,
    budget: appBudget,
    passed: appPassed,
    status: appBytes === null ? 'not measured' : appPassed ? 'PASS' : 'FAIL (OVER BUDGET)',
  });

  return {
    results,
    passed: !hasFailure,
  };
}

export function runCli() {
  const { results, passed } = checkBudgets();

  console.log('\n--- Bundle Size Verification (scripts/size.mjs) ---');
  console.log('Target'.padEnd(30) + 'Measured'.padEnd(16) + 'Budget'.padEnd(16) + 'Status');
  console.log('-'.repeat(75));

  let measuredCount = 0;
  for (const item of results) {
    const measuredStr = item.measured !== null ? `${item.measured} B` : 'not measured';
    const budgetStr = `${item.budget} B`;
    console.log(
      item.target.padEnd(30) + measuredStr.padEnd(16) + budgetStr.padEnd(16) + item.status,
    );
    if (item.measured !== null) {
      measuredCount++;
    }
  }
  console.log('-'.repeat(75));

  if (measuredCount === 0) {
    console.log(
      'Phase 0 note: No eligible build artifacts exist yet. All targets reported as "not measured".',
    );
  } else if (measuredCount < results.length) {
    console.log(`Partial measurement: ${measuredCount} of ${results.length} targets measured.`);
  }

  if (!passed) {
    console.error('\nError: One or more targets exceeded their bundle budget.');
    process.exit(1);
  } else {
    console.log('\nBundle size verification passed.');
    process.exit(0);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli();
}
