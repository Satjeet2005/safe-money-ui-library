import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SIZE_SCRIPT = path.join(REPO_ROOT, 'scripts/size.mjs');
const CLAIMS_SCRIPT = path.join(REPO_ROOT, 'scripts/claims-check.mjs');

describe('Verification Scripts', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smu-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('scripts/size.mjs', () => {
    it('handles empty build outputs honestly without crashing', () => {
      const output = execFileSync('node', [SIZE_SCRIPT], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
      });
      expect(output).toContain('Bundle Size Verification');
      expect(output).toContain('Bundle size verification passed');
    });

    it('measures present ESM artifact using gzip level 9 and enforces budgets', () => {
      const libDist = path.join(tmpDir, 'packages/safe-money-ui/dist');
      fs.mkdirSync(path.join(libDist, 'money'), { recursive: true });

      // Create an artificial uncompressible bundle that exceeds 6144 bytes
      const bigBuffer = Buffer.concat([
        Buffer.from('export const test = "'),
        crypto.randomBytes(7000),
        Buffer.from('";'),
      ]);
      fs.writeFileSync(path.join(libDist, 'money/index.mjs'), bigBuffer);

      const compressedSize = zlib.gzipSync(bigBuffer, { level: 9 }).length;
      expect(compressedSize).toBeGreaterThan(6144);

      let failed = false;
      try {
        execFileSync(
          'node',
          [
            '-e',
            `
            import { checkBudgets } from './scripts/size.mjs';
            const { passed, results } = checkBudgets({ rootDir: ${JSON.stringify(tmpDir)} });
            if (!passed) process.exit(1);
          `,
          ],
          { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
        );
      } catch {
        failed = true;
      }
      expect(failed).toBe(true);
    });

    it('passes when artifacts are under budget', () => {
      const libDist = path.join(tmpDir, 'packages/safe-money-ui/dist');
      fs.mkdirSync(path.join(libDist, 'money'), { recursive: true });

      const smallContent = 'export const test = "small";';
      fs.writeFileSync(path.join(libDist, 'money/index.mjs'), smallContent);

      let passed = false;
      try {
        execFileSync(
          'node',
          [
            '-e',
            `
            import { checkBudgets } from './scripts/size.mjs';
            const { passed } = checkBudgets({ rootDir: ${JSON.stringify(tmpDir)} });
            if (passed) process.exit(0);
            process.exit(1);
          `,
          ],
          { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
        );
        passed = true;
      } catch {
        passed = false;
      }
      expect(passed).toBe(true);
    });
  });

  describe('scripts/claims-check.mjs', () => {
    it('passes against repository documentation in its current state', () => {
      const output = execFileSync('node', [CLAIMS_SCRIPT], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
      });
      expect(output).toContain('All claims checks passed successfully');
    });

    it('detects mismatched metric markers', () => {
      fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, 'docs/METRICS.md'),
        '| key | value | command | date |\n| tests_total | 42 | jest | 2026-10-12 |\n',
      );
      fs.writeFileSync(
        path.join(tmpDir, 'README.md'),
        '<!-- metric:tests_total -->99<!-- /metric -->\n' +
          'This project was built with AI coding assistance (Claude, by Anthropic). The design decisions, review and testing were directed by the author, and the test-first order is visible in the commit history.\n' +
          'Northwind Pay is a fictional brand. This is an independent project and is not affiliated with, endorsed by or sponsored by any bank, payments company or employer.',
      );

      let failed = false;
      try {
        execFileSync(
          'node',
          [
            '-e',
            `
            import { runClaimsCheck } from './scripts/claims-check.mjs';
            const { passed, errors } = runClaimsCheck({ rootDir: ${JSON.stringify(tmpDir)} });
            if (!passed) process.exit(1);
          `,
          ],
          { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
        );
      } catch {
        failed = true;
      }
      expect(failed).toBe(true);
    });

    it('rejects untracked numeric claims with units', () => {
      fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'docs/METRICS.md'), '| key | value | command | date |\n');
      fs.writeFileSync(
        path.join(tmpDir, 'README.md'),
        'We ran 100 tests and achieved 99% coverage.\n' +
          'This project was built with AI coding assistance (Claude, by Anthropic). The design decisions, review and testing were directed by the author, and the test-first order is visible in the commit history.\n' +
          'Northwind Pay is a fictional brand. This is an independent project and is not affiliated with, endorsed by or sponsored by any bank, payments company or employer.',
      );

      let failed = false;
      try {
        execFileSync(
          'node',
          [
            '-e',
            `
            import { runClaimsCheck } from './scripts/claims-check.mjs';
            const { passed, errors } = runClaimsCheck({ rootDir: ${JSON.stringify(tmpDir)} });
            if (!passed) process.exit(1);
          `,
          ],
          { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
        );
      } catch {
        failed = true;
      }
      expect(failed).toBe(true);
    });

    it('rejects forbidden phrases in documentation files', () => {
      fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'docs/METRICS.md'), '| key | value | command | date |\n');
      fs.writeFileSync(
        path.join(tmpDir, 'README.md'),
        'This library is production-ready and fully accessible.\n' +
          'This project was built with AI coding assistance (Claude, by Anthropic). The design decisions, review and testing were directed by the author, and the test-first order is visible in the commit history.\n' +
          'Northwind Pay is a fictional brand. This is an independent project and is not affiliated with, endorsed by or sponsored by any bank, payments company or employer.',
      );

      let failed = false;
      try {
        execFileSync(
          'node',
          [
            '-e',
            `
            import { runClaimsCheck } from './scripts/claims-check.mjs';
            const { passed, errors } = runClaimsCheck({ rootDir: ${JSON.stringify(tmpDir)} });
            if (!passed) process.exit(1);
          `,
          ],
          { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
        );
      } catch {
        failed = true;
      }
      expect(failed).toBe(true);
    });

    it('allows Revolut in docs/OUTREACH.md but rejects it elsewhere', () => {
      fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'docs/METRICS.md'), '| key | value | command | date |\n');
      fs.writeFileSync(
        path.join(tmpDir, 'README.md'),
        'This project was built with AI coding assistance (Claude, by Anthropic). The design decisions, review and testing were directed by the author, and the test-first order is visible in the commit history.\n' +
          'Northwind Pay is a fictional brand. This is an independent project and is not affiliated with, endorsed by or sponsored by any bank, payments company or employer.',
      );
      fs.writeFileSync(
        path.join(tmpDir, 'docs/OUTREACH.md'),
        'I am applying for the Revolut Graduate Programme.',
      );

      let passed = false;
      try {
        execFileSync(
          'node',
          [
            '-e',
            `
            import { runClaimsCheck } from './scripts/claims-check.mjs';
            const { passed } = runClaimsCheck({ rootDir: ${JSON.stringify(tmpDir)} });
            if (passed) process.exit(0);
            process.exit(1);
          `,
          ],
          { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
        );
        passed = true;
      } catch {
        passed = false;
      }
      expect(passed).toBe(true);
    });

    it('rejects placeholders when --release is supplied', () => {
      let failed = false;
      try {
        execFileSync('node', [CLAIMS_SCRIPT, '--release'], {
          cwd: REPO_ROOT,
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch {
        failed = true;
      }
      expect(failed).toBe(true);
    });
  });
});
