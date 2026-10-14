# Release Checklist

This checklist defines the manual actions and pre-flight verifications Satjeet must execute before public release and package publication.

> **Status Notice:** Every item below is currently unchecked (`[ ]`). Automated local verification (`pnpm verify`, packaging dry run) passes locally, but publication, deployment, and public disclosure approvals are exclusively Satjeet-owned human actions.

---

## 1. Local Pre-Flight Status (Verified by Coding Agent)

The following automated prerequisites are verified and passing locally:

- [x] Package build (`tsup`) emits all ESM, CJS, DTS entries and `./dist/styles.css`.
- [x] Bundle size budgets pass with the Phase 4 ratchet (`scripts/size.mjs`).
- [x] Automated test suite (400 tests), property tests (1,000 runs), and mutation testing (90.63% score) pass.
- [x] Automated accessibility audits pass with 0 Axe violations (`jest-axe` and `cypress-axe`).
- [x] `pnpm publish --dry-run` succeeds in `packages/safe-money-ui` with 34 files packed into `dist`.
- [x] `vercel.json` matches PRD §18.5 (`corepack enable && pnpm install --frozen-lockfile`, `pnpm build`, `apps/transfer-demo/dist`).

---

## 2. Release Prerequisites & Action Checklist (Satjeet-Owned)

### Phase A: Repository and Hosting Setup

- [ ] **GitHub Repository:** Confirm the public repository exists at `https://github.com/Satjeet2005/safe-money-ui` and matches local `main`.
- [ ] **Push Commits:** Manually push the reviewed local branch to remote `main`:
  ```bash
  git push origin main
  ```
- [ ] **Connect Vercel:** Log in to Vercel and import the `Satjeet2005/safe-money-ui` repository.
- [ ] **Deploy & Verify Settings:** Ensure Vercel uses root directory `./` and respects `vercel.json`:
  - Build Command: `pnpm build`
  - Output Directory: `apps/transfer-demo/dist`
  - Install Command: `corepack enable && pnpm install --frozen-lockfile`
- [ ] **Live App Sanity Check:** Open the deployed Vercel URL in a browser and verify:
  - Form navigation and review screens load correctly.
  - Chaos Panel toggle opens and presets (e.g. `Lost response`, `Timeout then recover`) function live.
- [ ] **Update Demo Link:** Replace `<DEMO_URL>` placeholder in `README.md` and `docs/STATE.md` with the verified production URL.

---

### Phase B: Walkthrough Video Recording

- [ ] **Record Walkthrough:** Record a 60–90 second walkthrough video in Satjeet's own voice following `docs/WALKTHROUGH_SCRIPT.md`.
- [ ] **Upload & Verify Video:** Host the walkthrough video (e.g. YouTube unlisted or Loom) and verify audio/visual clarity.
- [ ] **Update Video Link:** Replace `<VIDEO_URL>` placeholder in `README.md` and `docs/STATE.md` with the verified video URL.

---

### Phase C: Package Identity & npm Publication

- [ ] **Confirm npm Scope:** Confirm whether to use `@satjeet2005/safe-money-ui` or a different npm scope/package name (Decision D-19 / Action U-05).
- [ ] **Update Package Scope (if modified):** If changing from `@satjeet2005/safe-money-ui`, update `name` in `packages/safe-money-ui/package.json` and all workspace imports/aliases.
- [ ] **Authenticate npm:** Log in to npm via CLI (`npm login`).
- [ ] **Pre-Publish Dry Run:** Run a final packaging check from the package directory:
  ```bash
  cd packages/safe-money-ui
  pnpm publish --dry-run
  ```
- [ ] **Publish Package:** Publish the package with public access:
  ```bash
  cd packages/safe-money-ui
  pnpm publish --access public
  ```

---

### Phase D: Claims, Accessibility, and Final Release Gate

- [ ] **Resolve AI-Assistance Disclosure (Q-AI-001):**
  - **Release Blocker:** `README.md` currently contains the PRD's placeholder Claude attribution to satisfy exact-string claims-checking.
  - Satjeet must review and approve the final attribution wording accurately reflecting the tools used.
  - Update `scripts/claims-check.mjs` `DISCLOSURE_SENTENCES` if Satjeet changes the required first disclosure sentence, keeping the second fictional-brand sentence verbatim.
  - Mark `Q-AI-001` resolved in `docs/OPEN_QUESTIONS.md`.
- [ ] **Verify Metric Markers:** Confirm that all `<!-- metric:KEY -->` markers in `README.md` match `docs/METRICS.md`.
- [ ] **Manual Accessibility Results (`docs/A11Y_MANUAL.md`):**
  - Execute the 6 manual checks on real screen readers (NVDA/VoiceOver), keyboard, and physical mobile phone.
  - Fill the result column for all 6 rows in `docs/A11Y_MANUAL.md`. (Release gate blocks if any result cell is blank).
- [ ] **Usability Check Kit (`docs/USABILITY_CHECK.md`):**
  - Complete participant sessions in WP-36 if conducting the informal study, or confirm documentation accurately states no study results are claimed.
- [ ] **Run Release Claims Gate:** Execute the release-mode claims check:
  ```bash
  pnpm claims:check --release
  ```
  Confirm it exits with code 0 (verifying no `<DEMO_URL>`, `<VIDEO_URL>`, `TODO` markers, or blank manual accessibility rows remain).
