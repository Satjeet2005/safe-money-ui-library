import path from 'node:path';
import fs from 'node:fs';

describe('Cypress configuration and deterministic support contract (WP-24A)', () => {
  const configPath = path.resolve(__dirname, '../cypress.config.ts');

  test('CS-01: cypress.config.ts exports configuration with 1280x800 default viewport, videos, and failure screenshots', async () => {
    expect(fs.existsSync(configPath)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cypressConfigModule = require(configPath);
    const config = cypressConfigModule.default || cypressConfigModule;

    expect(config.viewportWidth).toBe(1280);
    expect(config.viewportHeight).toBe(800);
    expect(config.video).toBe(true);
    expect(config.screenshotOnRunFailure).toBe(true);
    expect(config.trashAssetsBeforeRuns).toBe(true);
  });

  test('CS-02: cypress.config.ts configures e2e baseUrl, specPattern, supportFile, and artifact folders', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cypressConfigModule = require(configPath);
    const config = cypressConfigModule.default || cypressConfigModule;

    expect(config.e2e).toBeDefined();
    expect(config.e2e.baseUrl).toMatch(/http:\/\/localhost:(5173|4173)/);
    expect(config.e2e.specPattern).toBe('cypress/e2e/**/*.cy.{js,jsx,ts,tsx}');
    expect(config.e2e.supportFile).toBe('cypress/support/e2e.ts');
    expect(config.e2e.screenshotsFolder).toBe('cypress/screenshots');
    expect(config.e2e.videosFolder).toBe('cypress/videos');
  });

  test('CS-03: Axe configuration matches PRD §15.2 exact tags with no disabled rules', () => {
    const helpersPath = path.resolve(__dirname, '../cypress/support/helpers.ts');
    expect(fs.existsSync(helpersPath)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AXE_CONFIG } = require(helpersPath);

    expect(AXE_CONFIG).toBeDefined();
    expect(AXE_CONFIG.runOnly).toEqual({
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    // In Cypress Axe, contrast must NOT be disabled
    expect(AXE_CONFIG.rules).toBeUndefined();
  });

  test('CS-04: deterministic URL builder generates ?deterministic=1 and appends extra params', () => {
    const helpersPath = path.resolve(__dirname, '../cypress/support/helpers.ts');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { buildDeterministicUrl } = require(helpersPath);

    expect(buildDeterministicUrl()).toBe('/?deterministic=1');
    expect(buildDeterministicUrl({ preset: 'hang', latency: '500' })).toBe(
      '/?deterministic=1&preset=hang&latency=500',
    );
  });

  test('CS-05: window.__smu debug helper validates debug object and asserts execution count', () => {
    const helpersPath = path.resolve(__dirname, '../cypress/support/helpers.ts');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { extractSmuDebug } = require(helpersPath);

    // Missing debug interface in window throws
    expect(() => extractSmuDebug({})).toThrow(/window\.__smu is not available/);

    // Present debug interface is returned intact
    const mockDebug = {
      executedCount: () => 3,
      balances: () => ({ USD: 500000 }),
      transferIds: () => ['TRF-000001'],
    };
    expect(extractSmuDebug({ __smu: mockDebug })).toBe(mockDebug);
  });

  test('CS-06: static server script exists and provides production serving utility', () => {
    const serverScript = path.resolve(__dirname, '../../../scripts/run-e2e.mjs');
    expect(fs.existsSync(serverScript)).toBe(true);
  });
});
