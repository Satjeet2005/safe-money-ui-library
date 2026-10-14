# Implementation Action Plan: Sleek, Accessible UI & Motion System for `safe-money-ui`

> **Document Type:** Deterministic Engineering Action Plan for the Coding Agent  
> **Target Package:** `apps/transfer-demo` & `safe-money-ui` Reference Implementation  
> **Brand Identity:** **Northwind Pay** (Fictional Simulation)  
> **Design Direction:** **Direction A: Warm Ledger & Tinted Diagnostic Console** (from `docs/VISUAL_DESIGN_RESEARCH.md`)  
> **Aesthetic Bar:** Sleek, minimal, high-trust financial craft; crisp tabular alignment; beautiful, restrained, zero-blocking motion; strict WCAG 2.2 Level AA accessibility compliance.

---

## Overview & Execution Protocol

This action plan provides **complete, concrete, implementation-ready specifications** for the coding agent. You do not need to invent design tokens, guess layout proportions, infer state styling, or hallucinate animation curves. Every CSS custom property, HTML/JSX element structure, class name, border treatment, hex color code, font stack, animation timing function, ARIA role, and responsive breakpoint is defined below.

### Core Implementation Rules

1. **Fictional Brand Only:** Use strictly **Northwind Pay**. Do not introduce real payment logos, real banking brand names, or corporate styling.
2. **Simulation Honesty:** Maintain the persistent **Simulated Environment Disclosure** in the header. Never simulate live SWIFT/SEPA banking telemetry or fake streaming server logs.
3. **Epistemic State Clarity:**
   - **`Succeeded`:** Solid emerald left border (`4px solid #047857`), mint background (`#ECFDF5`), circular checkmark icon (`✓`).
   - **`Rejected`:** Solid crimson left border (`4px solid #B91C1C`), rose background (`#FEF2F2`), octagonal stop/cross icon (`⊘` / `✕`).
   - **`Unconfirmed / Uncertain`:** **Dashed amber perimeter border (`2px dashed #B45309`)** + solid left bar (`#B45309`), parchment amber background (`#FFFBEB`), warning diamond icon (`◆`). **Never style an unconfirmed outcome with green success graphics or terminal failure red.**
4. **Sleek, Simple, Beautiful Motion:** Animations must feel crisp, subtle, and premium (durations between `80ms` and `200ms`). Transitions must use physical decelerate curves (`cubic-bezier(0, 0, 0.2, 1)`) and standard utility curves (`cubic-bezier(0.2, 0, 0, 1)`). Banners and error summaries render instantaneously (`0ms`) or fade gently; buttons lock immediately (`0ms`) with an elegant dual-arc SVG spinner. Everything must collapse cleanly under `@media (prefers-reduced-motion: reduce)`.
5. **Zero Test Breakage:** All existing Cypress test selectors (`data-testid`, field names, exact button text, ARIA roles) must be preserved verbatim. Style enhancements must wrap existing elements or add class names without altering input IDs or button text nodes.
6. **Zero External Dependencies:** Use plain CSS (via CSS custom properties). Do not install Tailwind, Sass, CSS-in-JS, external web font links, or third-party animation libraries.

---

## Phase 1: CSS Design Tokens, Typography & Base Stylesheet

### 1.1 Target File: `apps/transfer-demo/src/styles/tokens.css` (or main stylesheet)

Create or update the foundational design tokens. Ensure every variable is declared in `:root`:

```css
/* ==========================================================================
   NORTHWIND PAY DESIGN SYSTEM TOKENS (Direction A: Warm Ledger)
   ========================================================================== */
:root {
  /* Surface & Canvas Tokens */
  --nw-bg-canvas: #f7f6f2; /* Warm stone neutral background */
  --nw-surface-primary: #ffffff; /* Crisp white primary card surface */
  --nw-surface-console: #eef2f6; /* Cool technical slate diagnostic console */
  --nw-surface-console-group: #f8fafc; /* Subtle inner fieldset card surface */
  --nw-surface-subtle: #f9fafb; /* Read-only row or secondary block fill */

  /* Text & Ink Tokens (WCAG 2.2 AAA Contrast) */
  --nw-text-primary: #111827; /* Near-black slate ink (17.74:1 on white) */
  --nw-text-secondary: #374151; /* Deep slate for secondary labels (10.31:1) */
  --nw-text-muted: #4b5563; /* Accessible muted gray for hints (7.56:1) */
  --nw-text-inverse: #ffffff; /* White text on dark buttons */

  /* Structural & Control Borders (WCAG 2.2 SC 1.4.11 >= 3:1) */
  --nw-border-subtle: #d1d5db; /* 1px divider and outer card border */
  --nw-border-console: #cbd5e1; /* Slate border for diagnostic console */
  --nw-border-control: #6b7280; /* 1px border for inputs/buttons (4.83:1 on white) */
  --nw-border-control-console: #64748b; /* 1px border for console switches (4.23:1) */

  /* Primary Interactive Brand Accent */
  --nw-action-primary: #0f4c81; /* Northwind Slate Blue (8.86:1 on white) */
  --nw-action-primary-hover: #0b3961; /* Hover state darkening (11.85:1) */
  --nw-action-primary-active: #082845; /* Active/pressed state */
  --nw-focus-ring: #0f4c81; /* High-contrast focus outline */

  /* Semantic Outcome: Succeeded (Confirmed) */
  --nw-status-success-bg: #ecfdf5; /* Mint surface */
  --nw-status-success-text: #065f46; /* Deep emerald text (7.29:1) */
  --nw-status-success-border: #047857; /* 4px accent bar & icon fill (5.21:1) */
  --nw-status-success-badge-bg: #d1fae5; /* Completed tag fill */

  /* Semantic Outcome: Rejected (Failed / Error) */
  --nw-status-error-bg: #fef2f2; /* Rose surface */
  --nw-status-error-text: #991b1b; /* Deep crimson text (7.60:1) */
  --nw-status-error-border: #b91c1c; /* 4px accent bar & invalid input border (6.47:1) */
  --nw-status-error-badge-bg: #fee2e2; /* Rejected tag fill */

  /* Semantic Outcome: Uncertain / Unconfirmed (Lost response / Timeout / Corrupt) */
  --nw-status-uncertain-bg: #fffbeb; /* Warm parchment amber */
  --nw-status-uncertain-text: #78350f; /* Deep umber-brown text (8.75:1) */
  --nw-status-uncertain-border: #b45309; /* 2px dashed border & 4px bar (4.84:1) */
  --nw-status-uncertain-badge-bg: #fde68a; /* Unconfirmed tag fill */

  /* Semantic In-Flight / Informational */
  --nw-status-pending-bg: #eff6ff; /* Calm blue tint */
  --nw-status-pending-text: #1e3a8a; /* Deep navy text (9.52:1) */
  --nw-status-pending-border: #1d4ed8; /* Blue border (6.16:1) */

  /* Chaos Diagnostic Active Selection */
  --nw-chaos-active-bg: #eef2ff; /* Indigo-slate diagnostic tint */
  --nw-chaos-active-text: #312e81; /* Deep indigo text (10.22:1) */
  --nw-chaos-active-border: #4338ca; /* Active preset border (7.07:1) */

  /* Typography Stacks */
  --nw-font-sans:
    Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    sans-serif;
  --nw-font-mono:
    ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace;

  /* Spacing Scale (4px Base Unit) */
  --nw-space-1: 4px;
  --nw-space-2: 8px;
  --nw-space-3: 12px;
  --nw-space-4: 16px;
  --nw-space-5: 20px;
  --nw-space-6: 24px;
  --nw-space-8: 32px;
  --nw-space-10: 40px;

  /* Radii */
  --nw-radius-sm: 4px; /* Badges, tags, checkboxes */
  --nw-radius-md: 6px; /* Buttons, inputs, preset cards, banners */
  --nw-radius-lg: 8px; /* Outer cards, console frame */

  /* Shadows (Subtle, Restrained Micro-Elevation) */
  --nw-shadow-card: 0 1px 3px rgba(17, 24, 39, 0.05), 0 1px 2px rgba(17, 24, 39, 0.03);
  --nw-shadow-card-hover:
    0 4px 6px -1px rgba(17, 24, 39, 0.07), 0 2px 4px -1px rgba(17, 24, 39, 0.04);
  --nw-shadow-dropdown:
    0 10px 15px -3px rgba(17, 24, 39, 0.08), 0 4px 6px -2px rgba(17, 24, 39, 0.04);

  /* Motion & Easing Tokens */
  --nw-duration-instant: 0ms;
  --nw-duration-fast: 120ms;
  --nw-duration-base: 160ms;
  --nw-duration-moderate: 200ms;
  --nw-duration-spinner: 800ms;
  --nw-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --nw-ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --nw-ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
}

/* Reduced Motion Fallback */
@media (prefers-reduced-motion: reduce) {
  :root {
    --nw-duration-fast: 0ms;
    --nw-duration-base: 0ms;
    --nw-duration-moderate: 0ms;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 1.2 Base Styles & Tabular Numeric Reset

Add the global typographic rules and focus outline utility:

```css
body {
  margin: 0;
  padding: 0;
  background-color: var(--nw-bg-canvas);
  color: var(--nw-text-primary);
  font-family: var(--nw-font-sans);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Tabular Numerals on all monetary and quantitative data */
.nw-tabular,
.nw-amount-input,
.nw-money-display,
.nw-rate-display,
.nw-balance-display,
.nw-history-amount {
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings:
    'tnum' 1,
    'lnum' 1;
}

/* Universal Accessible Focus Ring (WCAG 2.2 SC 2.4.13) */
:focus-visible {
  outline: 2px solid var(--nw-focus-ring) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 2px var(--nw-surface-primary) !important;
}

/* Button & Interactive Resets */
button,
input,
select,
textarea {
  font-family: inherit;
  font-size: inherit;
  box-sizing: border-box;
}

button {
  cursor: pointer;
}

button:disabled,
input:disabled,
select:disabled {
  cursor: not-allowed;
}
```

---

## Phase 2: Page Shell, Responsive Two-Column Grid & Header Architecture

### 2.1 Component: `apps/transfer-demo/src/screens/TransferFlow.tsx` (or top layout)

Refactor the root layout into a responsive grid that strictly maintains a `7:5` desktop balance (`max-width: 1200px`) and collapses cleanly to `1fr` on tablet/mobile (`< 1024px`).

#### DOM / JSX Structure

```tsx
<div className="nw-app-shell">
  {/* Global Header Bar */}
  <header className="nw-header">
    <div className="nw-header-inner">
      <div className="nw-brand-cluster">
        <svg
          className="nw-brand-logo"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 6 15 12 12 18 9 12" fill="currentColor" />
        </svg>
        <span className="nw-brand-name">Northwind Pay</span>
        <span className="nw-brand-divider" aria-hidden="true">
          /
        </span>
        <span className="nw-brand-subtitle">Safe-Submit Transfer Demo</span>
      </div>

      <div className="nw-simulation-badge-group">
        <span className="nw-sim-badge" role="note">
          SIMULATION ONLY
        </span>
        <span className="nw-sim-text">
          Browser-only simulation. Fictional accounts—no real money transferred.
        </span>
      </div>
    </div>
  </header>

  {/* Mobile Active Chaos Indicator (Visible on < 1024px) */}
  <div className="nw-mobile-chaos-banner">
    <span className="nw-mobile-chaos-status">
      <strong>Chaos Mode:</strong> {activeChaosLabel}
    </span>
    <a href="#chaos-console" className="nw-mobile-chaos-jump">
      Configure &darr;
    </a>
  </div>

  {/* Main 2-Column Responsive Workspace */}
  <main className="nw-workspace-container">
    {/* Left Column: Primary User Task & Account Ledger (7fr) */}
    <section className="nw-col-primary">
      <div className="nw-card nw-transfer-card">
        {/* Step Progress Bar */}
        <nav className="nw-step-indicator" aria-label="Transfer Progress">
          <ol className="nw-step-list">
            <li className={step === 'form' ? 'nw-step-item is-active' : 'nw-step-item is-complete'}>
              <span className="nw-step-num">1</span>
              <span className="nw-step-label">Details</span>
            </li>
            <li
              className={
                step === 'review'
                  ? 'nw-step-item is-active'
                  : step === 'result'
                    ? 'nw-step-item is-complete'
                    : 'nw-step-item'
              }
            >
              <span className="nw-step-num">2</span>
              <span className="nw-step-label">Review</span>
            </li>
            <li className={step === 'result' ? 'nw-step-item is-active' : 'nw-step-item'}>
              <span className="nw-step-num">3</span>
              <span className="nw-step-label">Result</span>
            </li>
          </ol>
        </nav>

        {/* Active Screen Container with Opacity Cross-Fade */}
        <div className="nw-step-content-viewport">
          {step === 'form' && <SendForm />}
          {step === 'review' && <Review />}
          {step === 'result' && <Result />}
        </div>
      </div>

      {/* Account Summary & Recent Activity Ledger */}
      <AccountSummary />
    </section>

    {/* Right Column: Diagnostic Simulation Console (5fr) */}
    <aside className="nw-col-console" id="chaos-console" aria-labelledby="chaos-heading">
      <ChaosPanel />
    </aside>
  </main>
</div>
```

#### CSS Implementation

```css
/* Layout Shell */
.nw-app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.nw-header {
  background-color: var(--nw-surface-primary);
  border-bottom: 1px solid var(--nw-border-subtle);
  position: sticky;
  top: 0;
  z-index: 40;
}
.nw-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.nw-brand-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nw-brand-logo {
  color: var(--nw-action-primary);
  flex-shrink: 0;
}
.nw-brand-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--nw-text-primary);
}
.nw-brand-divider {
  color: var(--nw-border-subtle);
}
.nw-brand-subtitle {
  font-size: 13px;
  color: var(--nw-text-muted);
}
.nw-simulation-badge-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nw-sim-badge {
  background-color: #e2e8f0;
  color: #334155;
  border: 1px solid #94a3b8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: var(--nw-radius-sm);
}
.nw-sim-text {
  font-size: 12px;
  color: var(--nw-text-muted);
}

/* Mobile Chaos Quick Banner (< 1024px) */
.nw-mobile-chaos-banner {
  display: none;
  background-color: var(--nw-surface-console);
  border-bottom: 1px solid var(--nw-border-console);
  padding: 8px 16px;
  font-size: 13px;
  justify-content: space-between;
  align-items: center;
}
.nw-mobile-chaos-jump {
  color: var(--nw-action-primary);
  text-decoration: underline;
  font-weight: 600;
}

/* Main Workspace Grid */
.nw-workspace-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 24px 24px 48px;
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(360px, 5fr);
  gap: 24px;
  align-items: start;
}

/* Card Foundation */
.nw-card {
  background-color: var(--nw-surface-primary);
  border: 1px solid var(--nw-border-subtle);
  border-radius: var(--nw-radius-lg);
  box-shadow: var(--nw-shadow-card);
  padding: 24px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

/* Step Progress Indicator */
.nw-step-indicator {
  border-bottom: 1px solid var(--nw-border-subtle);
  padding-bottom: 16px;
  margin-bottom: 24px;
}
.nw-step-list {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 24px;
}
.nw-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--nw-text-muted);
}
.nw-step-item.is-active {
  color: var(--nw-action-primary);
  font-weight: 600;
}
.nw-step-item.is-complete {
  color: var(--nw-text-secondary);
}
.nw-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid currentColor;
  font-size: 12px;
}
.nw-step-item.is-active .nw-step-num {
  background-color: var(--nw-action-primary);
  color: var(--nw-text-inverse);
  border-color: var(--nw-action-primary);
}

/* Responsive Collapse (< 1024px) */
@media (max-width: 1023px) {
  .nw-header-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 16px;
  }
  .nw-mobile-chaos-banner {
    display: flex;
  }
  .nw-workspace-container {
    grid-template-columns: 1fr;
    padding: 16px 16px 32px;
    gap: 20px;
  }
}
```

---

## Phase 3: Transfer Step 1 — Form (`SendForm.tsx`) & Hero Money Input

### 3.1 Error Summary & Validation Presentation

When validation fails, `ErrorSummary` appears at the top of the form with `role="alert"` and receives keyboard focus immediately (`element.focus()`).

```tsx
{
  hasErrors && (
    <div className="nw-error-summary" tabIndex={-1} role="alert" ref={errorSummaryRef}>
      <h2 className="nw-error-summary-title">There is a problem</h2>
      <ul className="nw-error-summary-list">
        {errors.map((err) => (
          <li key={err.field}>
            <a href={`#field-${err.field}`}>{err.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```css
.nw-error-summary {
  background-color: var(--nw-status-error-bg);
  border: 1px solid var(--nw-status-error-border);
  border-left: 4px solid var(--nw-status-error-border);
  border-radius: var(--nw-radius-md);
  padding: 16px 20px;
  margin-bottom: 24px;
}
.nw-error-summary-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--nw-status-error-text);
}
.nw-error-summary-list {
  margin: 0;
  padding-left: 20px;
  color: var(--nw-status-error-text);
}
.nw-error-summary-list a {
  color: var(--nw-status-error-text);
  font-weight: 600;
  text-decoration: underline;
}
```

### 3.2 Form Controls & Hero Money Input

Style `SendForm` inputs with clear vertical rhythm (`16px` margin), dedicated `<label>` tags, and the hero money input with an affixed currency pill and localized format preview.

```tsx
<div className="nw-form-group">
  <label htmlFor="field-recipient" className="nw-label">Recipient</label>
  <select id="field-recipient" name="recipient" className="nw-select">
    {recipients.map(r => <option key={r.id} value={r.id}>{r.name} ({r.account})</option>)}
  </select>
</div>

<div className="nw-form-group">
  <label htmlFor="field-fromAccount" className="nw-label">From account</label>
  <select id="field-fromAccount" name="fromAccount" className="nw-select">
    {accounts.map(a => (
      <option key={a.id} value={a.id}>
        {a.name} &mdash; Available: {a.formattedBalance} {a.currency}
      </option>
    ))}
  </select>
</div>

<div className="nw-form-group">
  <label className="nw-label">Number format locale</label>
  <div className="nw-segmented-control" role="radiogroup" aria-label="Number format locale">
    {['en-US', 'de-DE', 'pl-PL', 'en-IN'].map(locale => (
      <label key={locale} className={`nw-segment-label ${selectedLocale === locale ? 'is-selected' : ''}`}>
        <input
          type="radio"
          name="numberLocale"
          value={locale}
          checked={selectedLocale === locale}
          onChange={() => handleLocaleChange(locale)}
          className="nw-sr-only"
        />
        <span className="nw-segment-text nw-tabular">{locale}</span>
      </label>
    ))}
  </div>
</div>

<div className={`nw-form-group ${amountError ? 'has-error' : ''}`}>
  <label htmlFor="field-amount" className="nw-label">Transfer amount</label>
  <div className="nw-money-input-wrapper">
    <span className="nw-currency-affix">{sourceCurrency}</span>
    <input
      id="field-amount"
      name="amount"
      type="text"
      inputMode="decimal"
      className="nw-amount-input nw-tabular"
      placeholder="0.00"
      aria-describedby="amount-hint-preview"
      aria-invalid={!!amountError}
    />
  </div>
  <div id="amount-hint-preview" className="nw-amount-hint nw-tabular">
    <span>Formatted preview: <strong>{liveFormattedAmount || '0.00'} {sourceCurrency}</strong></span>
  </div>
  {amountError && (
    <p className="nw-field-error" id="amount-error">
      <span aria-hidden="true">&#9888; </span>{amountError}
    </p>
  )}
</div>

<button type="submit" className="nw-btn nw-btn-primary nw-btn-block">
  Review transfer
</button>
```

```css
/* Form Elements */
.nw-form-group {
  margin-bottom: 20px;
}
.nw-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--nw-text-primary);
  margin-bottom: 6px;
}
.nw-select {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  background-color: var(--nw-surface-primary);
  border: 1px solid var(--nw-border-control);
  border-radius: var(--nw-radius-md);
  color: var(--nw-text-primary);
}

/* Number Format Segmented Control */
.nw-segmented-control {
  display: flex;
  background-color: var(--nw-surface-console);
  border: 1px solid var(--nw-border-console);
  border-radius: var(--nw-radius-md);
  padding: 3px;
  gap: 4px;
}
.nw-segment-label {
  flex: 1;
  text-align: center;
  padding: 6px 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--nw-text-secondary);
  border-radius: var(--nw-radius-sm);
  cursor: pointer;
  transition: background-color var(--nw-duration-fast) var(--nw-ease-standard);
}
.nw-segment-label.is-selected {
  background-color: var(--nw-surface-primary);
  color: var(--nw-action-primary);
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.08);
}

/* Hero Money Input */
.nw-money-input-wrapper {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--nw-border-control);
  border-radius: var(--nw-radius-md);
  background-color: var(--nw-surface-primary);
  transition: border-color var(--nw-duration-fast) var(--nw-ease-standard);
}
.nw-money-input-wrapper:focus-within {
  border-color: var(--nw-action-primary);
  outline: 2px solid var(--nw-focus-ring);
  outline-offset: 1px;
}
.has-error .nw-money-input-wrapper {
  border-color: var(--nw-status-error-border);
  border-width: 2px;
}
.nw-currency-affix {
  display: flex;
  align-items: center;
  padding: 0 14px;
  background-color: var(--nw-surface-console);
  border-right: 1px solid var(--nw-border-subtle);
  font-size: 14px;
  font-weight: 700;
  color: var(--nw-text-secondary);
}
.nw-amount-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 14px;
  height: 52px;
  font-size: 24px;
  font-weight: 600;
  color: var(--nw-text-primary);
  outline: none;
}
.nw-amount-hint {
  padding-top: 6px;
  font-size: 13px;
  color: var(--nw-text-muted);
}
.nw-field-error {
  margin: 6px 0 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--nw-status-error-text);
}

/* Buttons */
.nw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 20px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--nw-radius-md);
  border: 1px solid transparent;
  transition:
    background-color var(--nw-duration-fast) var(--nw-ease-standard),
    transform 80ms var(--nw-ease-standard);
  text-decoration: none;
}
.nw-btn:active:not(:disabled) {
  transform: translateY(0.5px);
}
.nw-btn-primary {
  background-color: var(--nw-action-primary);
  color: var(--nw-text-inverse);
}
.nw-btn-primary:hover:not(:disabled) {
  background-color: var(--nw-action-primary-hover);
}
.nw-btn-secondary {
  background-color: var(--nw-surface-primary);
  border-color: var(--nw-border-control);
  color: var(--nw-text-primary);
}
.nw-btn-secondary:hover:not(:disabled) {
  background-color: var(--nw-surface-subtle);
  border-color: var(--nw-text-primary);
}
.nw-btn-block {
  width: 100%;
}
.nw-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

---

## Phase 4: Transfer Step 2 — Review Snapshot & Invalidation Banner

### 4.1 Invalidation Banner Component (`Banner.tsx`)

Render the warning banner when draft details are invalidated by external changes (e.g. cross-tab amount update or rate movement).

```tsx
<div className="nw-banner nw-banner-warning" role="region" aria-live="polite">
  <span className="nw-banner-icon" aria-hidden="true">
    &#9670;
  </span>
  <div className="nw-banner-body">
    <strong className="nw-banner-title">{title}</strong>
    <p className="nw-banner-message">{message}</p>
  </div>
</div>
```

```css
.nw-banner {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: var(--nw-radius-md);
  margin-bottom: 20px;
}
.nw-banner-warning {
  background-color: var(--nw-status-uncertain-bg);
  border: 1px solid var(--nw-status-uncertain-border);
  border-left: 4px solid var(--nw-status-uncertain-border);
  color: var(--nw-status-uncertain-text);
}
.nw-banner-icon {
  font-size: 16px;
  line-height: 1.4;
}
.nw-banner-title {
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}
.nw-banner-message {
  margin: 0;
  font-size: 13px;
}
```

### 4.2 Receipt Snapshot Structure (`Review.tsx`)

```tsx
<div className="nw-review-container">
  <h2 className="nw-screen-title">Review transfer details</h2>
  <p className="nw-screen-subtitle">
    Please check the transfer amounts and exchange rate before confirming.
  </p>

  {/* Review DL List */}
  <dl className="nw-receipt-list">
    <div className="nw-receipt-row">
      <dt>Recipient</dt>
      <dd>
        {recipient.name} &bull; {recipient.account}
      </dd>
    </div>
    <div className="nw-receipt-row">
      <dt>Funding account</dt>
      <dd>{account.name}</dd>
    </div>
    <div className="nw-receipt-row">
      <dt>Amount sent</dt>
      <dd className="nw-tabular">
        {formattedAmount} {currency}
      </dd>
    </div>
    <div className="nw-receipt-row">
      <dt>Transfer fee</dt>
      <dd className="nw-tabular">
        {formattedFee} {currency}
      </dd>
    </div>
    <div className="nw-receipt-row nw-receipt-row-total">
      <dt>Total to debit</dt>
      <dd className="nw-tabular">
        {formattedTotal} {currency}
      </dd>
    </div>
    <div className="nw-receipt-row">
      <dt>Guaranteed exchange rate</dt>
      <dd className="nw-tabular nw-font-mono">{exchangeRateText}</dd>
    </div>
  </dl>

  {/* Highlighted Recipient Gets Callout */}
  <div className="nw-receive-callout">
    <span className="nw-receive-label">Recipient receives</span>
    <span className="nw-receive-amount nw-tabular">
      {formattedReceiveAmount} {destCurrency}
    </span>
  </div>

  {/* Actions */}
  <div className="nw-review-actions">
    <button
      type="button"
      className="nw-btn nw-btn-secondary"
      onClick={onEdit}
      disabled={isSubmitting}
    >
      Edit details
    </button>
    <button
      type="button"
      className="nw-btn nw-btn-primary"
      onClick={onConfirm}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <span className="nw-spinner" aria-hidden="true"></span>
          <span>Submitting...</span>
        </>
      ) : (
        'Confirm transfer'
      )}
    </button>
  </div>
</div>
```

```css
.nw-screen-title {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.015em;
}
.nw-screen-subtitle {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--nw-text-muted);
}
.nw-receipt-list {
  margin: 0 0 20px 0;
  padding: 0;
  border-top: 1px solid var(--nw-border-subtle);
}
.nw-receipt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--nw-border-subtle);
  font-size: 14px;
}
.nw-receipt-row dt {
  color: var(--nw-text-secondary);
}
.nw-receipt-row dd {
  margin: 0;
  font-weight: 600;
  color: var(--nw-text-primary);
  text-align: right;
}
.nw-receipt-row-total {
  font-size: 16px;
  border-top: 2px solid var(--nw-text-primary);
  border-bottom: 2px solid var(--nw-text-primary);
  padding: 14px 0;
}
.nw-receipt-row-total dd {
  font-size: 18px;
  font-weight: 700;
}

/* Recipient Gets Box */
.nw-receive-callout {
  background-color: var(--nw-surface-subtle);
  border: 1px solid var(--nw-border-console);
  border-radius: var(--nw-radius-md);
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.nw-receive-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--nw-text-secondary);
}
.nw-receive-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--nw-text-primary);
}

/* Actions Bar */
.nw-review-actions {
  display: flex;
  gap: 12px;
}
.nw-review-actions .nw-btn-secondary {
  flex: 1;
}
.nw-review-actions .nw-btn-primary {
  flex: 2;
}

/* Dual-Arc SVG Spinner */
.nw-spinner {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: nw-spin var(--nw-duration-spinner) linear infinite;
  display: inline-block;
}
@keyframes nw-spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## Phase 5: Transfer Step 3 — Result (`Result.tsx`) Tri-Modal States

The result component renders one of three distinct cards depending on the controller outcome.

### 5.1 Outcome 1: Succeeded (`Completed`)

```tsx
<div className="nw-result-card nw-result-success">
  <div className="nw-result-header">
    <div className="nw-result-icon" aria-hidden="true">
      &#10003;
    </div>
    <div>
      <span className="nw-status-tag nw-tag-success">Confirmed</span>
      <h2 className="nw-result-title">Transfer completed successfully</h2>
    </div>
  </div>
  <div className="nw-result-details">
    <div className="nw-receipt-row">
      <dt>Transfer Reference</dt>
      <dd>
        <code className="nw-ref-badge">{transferId}</code>
      </dd>
    </div>
    <div className="nw-receipt-row">
      <dt>Amount sent</dt>
      <dd className="nw-tabular">
        {formattedSent} {currency}
      </dd>
    </div>
    <div className="nw-receipt-row">
      <dt>Amount received</dt>
      <dd className="nw-tabular">
        {formattedReceived} {destCurrency}
      </dd>
    </div>
  </div>
  <button type="button" className="nw-btn nw-btn-primary nw-btn-block" onClick={onResetFlow}>
    Start another transfer
  </button>
</div>
```

### 5.2 Outcome 2: Rejected (`Retryable` vs. `Non-Retryable`)

```tsx
<div className="nw-result-card nw-result-rejected">
  <div className="nw-result-header">
    <div className="nw-result-icon" aria-hidden="true">
      &#8856;
    </div>
    <div>
      <span className="nw-status-tag nw-tag-error">
        {isRetryable ? 'Rejected — Temporary issue' : 'Rejected — Action required'}
      </span>
      <h2 className="nw-result-title">Transfer could not be processed</h2>
    </div>
  </div>
  <p className="nw-result-reason">
    <strong>Reason:</strong> {rejectionReason}
  </p>
  <p className="nw-result-subtext">No funds were deducted from your account.</p>
  <div className="nw-review-actions">
    <button type="button" className="nw-btn nw-btn-secondary" onClick={onEditDetails}>
      Edit details
    </button>
    {isRetryable && (
      <button type="button" className="nw-btn nw-btn-primary" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
</div>
```

### 5.3 Outcome 3: Unconfirmed / Uncertain (`Lost response`, `Timeout`, `Bad payload`)

```tsx
<div className="nw-result-card nw-result-unconfirmed">
  <div className="nw-result-header">
    <div className="nw-result-icon" aria-hidden="true">
      &#9670;
    </div>
    <div>
      <span className="nw-status-tag nw-tag-uncertain">Outcome unconfirmed</span>
      <h2 className="nw-result-title">Unable to confirm transfer status</h2>
    </div>
  </div>
  <div className="nw-uncertain-explanation">
    <p>
      The server did not respond in time or returned an unconfirmed response.
      <strong>Your transfer may have completed on the server.</strong>
    </p>
    <p>To prevent double charges, please choose a safe recovery option below:</p>
  </div>
  <div className="nw-review-actions">
    <button type="button" className="nw-btn nw-btn-secondary" onClick={onLeaveUnconfirmed}>
      Leave transfer unconfirmed
    </button>
    <button type="button" className="nw-btn nw-btn-primary" onClick={onSafeRetry}>
      Try again (Safe retry)
    </button>
  </div>
</div>
```

#### Outcome Styling

```css
/* Result Card Common */
.nw-result-card {
  padding: 24px;
  border-radius: var(--nw-radius-md);
  margin-bottom: 20px;
}
.nw-result-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}
.nw-result-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.nw-result-title {
  margin: 4px 0 0 0;
  font-size: 18px;
  font-weight: 700;
}

/* Succeeded */
.nw-result-success {
  background-color: var(--nw-status-success-bg);
  border: 1px solid #a7f3d0;
  border-left: 4px solid var(--nw-status-success-border);
}
.nw-result-success .nw-result-icon {
  background-color: var(--nw-status-success-border);
  color: var(--nw-text-inverse);
}
.nw-result-success .nw-result-title {
  color: var(--nw-status-success-text);
}

/* Rejected */
.nw-result-rejected {
  background-color: var(--nw-status-error-bg);
  border: 1px solid #fecaca;
  border-left: 4px solid var(--nw-status-error-border);
}
.nw-result-rejected .nw-result-icon {
  background-color: var(--nw-status-error-border);
  color: var(--nw-text-inverse);
}
.nw-result-rejected .nw-result-title {
  color: var(--nw-status-error-text);
}

/* Unconfirmed / Uncertain (CRITICAL: 2px Dashed Perimeter) */
.nw-result-unconfirmed {
  background-color: var(--nw-status-uncertain-bg);
  border: 2px dashed var(--nw-status-uncertain-border);
  border-left: 4px solid var(--nw-status-uncertain-border);
}
.nw-result-unconfirmed .nw-result-icon {
  background-color: var(--nw-status-uncertain-border);
  color: var(--nw-text-inverse);
}
.nw-result-unconfirmed .nw-result-title {
  color: var(--nw-status-uncertain-text);
}
.nw-uncertain-explanation {
  font-size: 14px;
  color: var(--nw-status-uncertain-text);
  margin-bottom: 20px;
  line-height: 1.5;
}

/* Status Tags (Sentence-Case, Low-Contrast Fill per GOV.UK) */
.nw-status-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--nw-radius-sm);
}
.nw-tag-success {
  background-color: var(--nw-status-success-badge-bg);
  color: var(--nw-status-success-text);
  border: 1px solid var(--nw-status-success-border);
}
.nw-tag-error {
  background-color: var(--nw-status-error-badge-bg);
  color: var(--nw-status-error-text);
  border: 1px solid var(--nw-status-error-border);
}
.nw-tag-uncertain {
  background-color: var(--nw-status-uncertain-badge-bg);
  color: var(--nw-status-uncertain-text);
  border: 1px dashed var(--nw-status-uncertain-border);
}
.nw-ref-badge {
  background-color: var(--nw-surface-subtle);
  border: 1px solid var(--nw-border-subtle);
  padding: 2px 6px;
  border-radius: var(--nw-radius-sm);
  font-family: var(--nw-font-mono);
  font-size: 12px;
}
```

---

## Phase 6: Account Summary & Activity Ledger (`AccountSummary.tsx`)

### 6.1 DOM & Component Structure

```tsx
<div className="nw-card nw-account-card">
  <div className="nw-account-header">
    <div>
      <span className="nw-account-name">{account.name}</span>
      <span className="nw-account-meta">Simulated Balance</span>
    </div>
    <div className="nw-account-balance nw-tabular">
      {account.formattedBalance} <span className="nw-currency-code">{account.currency}</span>
    </div>
  </div>

  <h3 className="nw-section-heading">Recent activity</h3>
  {history.length === 0 ? (
    <p className="nw-empty-text">No recent transactions in this simulated session.</p>
  ) : (
    <ul className="nw-activity-list">
      {history.map((tx) => (
        <li key={tx.id} className="nw-activity-item">
          <div className="nw-activity-left">
            <strong className="nw-activity-recipient">{tx.recipientName}</strong>
            <span className="nw-activity-ref nw-font-mono">
              {tx.transferId || 'ID: unassigned'}
            </span>
          </div>
          <div className="nw-activity-center">
            {tx.status === 'Completed' ? (
              <span className="nw-status-tag nw-tag-success">&#9679; Completed</span>
            ) : (
              <span className="nw-status-tag nw-tag-uncertain">&#9670; Unconfirmed</span>
            )}
          </div>
          <div className="nw-activity-right nw-tabular">
            -{tx.formattedAmount} {tx.currency}
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
```

```css
.nw-account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--nw-border-subtle);
  margin-bottom: 20px;
}
.nw-account-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--nw-text-primary);
}
.nw-account-meta {
  font-size: 12px;
  color: var(--nw-text-muted);
}
.nw-account-balance {
  font-size: 22px;
  font-weight: 700;
  color: var(--nw-text-primary);
}
.nw-currency-code {
  font-size: 14px;
  color: var(--nw-text-secondary);
}
.nw-section-heading {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
}
.nw-activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.nw-activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--nw-border-subtle);
  font-size: 14px;
}
.nw-activity-left {
  display: flex;
  flex-direction: column;
  flex: 2;
}
.nw-activity-recipient {
  color: var(--nw-text-primary);
}
.nw-activity-ref {
  font-size: 12px;
  color: var(--nw-text-muted);
}
.nw-activity-center {
  flex: 1;
  text-align: center;
}
.nw-activity-right {
  flex: 1;
  text-align: right;
  font-weight: 600;
  color: var(--nw-text-primary);
}
.nw-empty-text {
  font-size: 13px;
  color: var(--nw-text-muted);
  margin: 12px 0;
}
```

---

## Phase 7: Chaos Console (`ChaosPanel.tsx`) UI Implementation

### 7.1 Console Structure & 2x2 Preset Cards

Render `ChaosPanel` on `--nw-surface-console: #EEF2F6` with distinct `<fieldset>` groupings and non-color-only selected states:

```tsx
<div className="nw-chaos-console">
  <div className="nw-chaos-header">
    <div className="nw-chaos-title-group">
      <h2 className="nw-chaos-title">Chaos Simulation Console</h2>
      <span
        className={`nw-chaos-status-pill ${activePreset ? 'is-preset' : isCustom ? 'is-custom' : 'is-default'}`}
      >
        {activePreset
          ? `Preset: ${activePreset}`
          : isCustom
            ? 'Custom fault configuration'
            : 'Normal operation (No faults)'}
      </span>
    </div>
    <p className="nw-chaos-intro">
      Select a preset or toggle faults below, then submit a transfer to test UI resilience.
    </p>
  </div>

  {/* 2x2 Preset Card Grid */}
  <div className="nw-preset-grid" role="radiogroup" aria-label="Chaos failure presets">
    {[
      {
        id: 'slow',
        name: 'Slow network',
        desc: 'Introduces a 3-second latency to test pending submission guards.',
      },
      {
        id: 'timeout',
        name: 'Timeout then recover',
        desc: 'Hangs on first attempt into unconfirmed state, then recovers on retry.',
      },
      {
        id: 'lost',
        name: 'Lost response',
        desc: 'Server completes transfer but response is lost, testing epistemic recovery.',
      },
      {
        id: 'badPayload',
        name: 'Bad payload',
        desc: 'Returns a malformed response to exercise payload validation & recovery.',
      },
    ].map((p) => (
      <div
        key={p.id}
        className={`nw-preset-card ${activePreset === p.name ? 'is-active' : ''}`}
        onClick={() => onSelectPreset(p.name)}
        role="radio"
        aria-checked={activePreset === p.name}
        tabIndex={0}
      >
        <div className="nw-preset-top">
          <strong className="nw-preset-name">{p.name}</strong>
          <span className="nw-preset-indicator" aria-hidden="true">
            {activePreset === p.name ? '✓' : '○'}
          </span>
        </div>
        <p className="nw-preset-desc">{p.desc}</p>
      </div>
    ))}
  </div>

  {/* Group 1: Latency & Network Timing */}
  <fieldset className="nw-chaos-fieldset">
    <legend className="nw-chaos-legend">Network & Latency Faults</legend>
    <div className="nw-control-row">
      <label className="nw-sublabel">Simulated latency:</label>
      <div className="nw-segmented-control nw-segmented-sm">
        {['None', '500 ms', '3 s'].map((lat) => (
          <label
            key={lat}
            className={`nw-segment-label ${selectedLatency === lat ? 'is-selected' : ''}`}
          >
            <input
              type="radio"
              name="latency"
              value={lat}
              checked={selectedLatency === lat}
              onChange={() => onSetLatency(lat)}
              className="nw-sr-only"
            />
            <span>{lat}</span>
          </label>
        ))}
      </div>
    </div>
    <label className="nw-checkbox-label">
      <input
        type="checkbox"
        name="hangRequest"
        checked={hangRequest}
        onChange={(e) => onToggle(e)}
      />
      <span>Request hangs / never responds</span>
    </label>
    <label className="nw-checkbox-label">
      <input
        type="checkbox"
        name="lateResponse"
        checked={lateResponse}
        onChange={(e) => onToggle(e)}
      />
      <span>Late response after timeout (first attempt)</span>
    </label>
    <label className="nw-checkbox-label">
      <input
        type="checkbox"
        name="loseResponse"
        checked={loseResponse}
        onChange={(e) => onToggle(e)}
      />
      <span>Lose response after server completes (first attempt)</span>
    </label>
  </fieldset>

  {/* Group 2: Rejection & Payload Faults */}
  <fieldset className="nw-chaos-fieldset">
    <legend className="nw-chaos-legend">Server Rejection & Payload Integrity</legend>
    <div className="nw-control-row">
      <label htmlFor="chaos-rejection" className="nw-sublabel">
        Server rejection:
      </label>
      <select
        id="chaos-rejection"
        className="nw-select nw-select-sm"
        value={serverRejection}
        onChange={(e) => onSetRejection(e.target.value)}
      >
        <option value="None">None</option>
        <option value="Insufficient funds">Insufficient funds</option>
        <option value="Recipient blocked">Recipient blocked</option>
        <option value="Service unavailable">Service unavailable</option>
      </select>
    </div>
    <label className="nw-checkbox-label">
      <input
        type="checkbox"
        name="malformedResponse"
        checked={malformedResponse}
        onChange={(e) => onToggle(e)}
      />
      <span>Malformed response (every call)</span>
    </label>
    <label className="nw-checkbox-label">
      <input
        type="checkbox"
        name="inconsistentAmounts"
        checked={inconsistentAmounts}
        onChange={(e) => onToggle(e)}
      />
      <span>Valid response with inconsistent amounts</span>
    </label>
  </fieldset>

  {/* Group 3: Quote, Draft & Concurrency Triggers */}
  <fieldset className="nw-chaos-fieldset">
    <legend className="nw-chaos-legend">Quote, Draft & Concurrency Triggers</legend>
    <label className="nw-checkbox-label">
      <input type="checkbox" name="rateMoves" checked={rateMoves} onChange={(e) => onToggle(e)} />
      <span>Rate moves on next quote (+0.5%)</span>
    </label>
    <label className="nw-checkbox-label">
      <input
        type="checkbox"
        name="corruptDraft"
        checked={corruptDraft}
        onChange={(e) => onToggle(e)}
      />
      <span>Corrupt saved draft on next reload</span>
    </label>
    <div className="nw-trigger-buttons">
      <button
        type="button"
        className="nw-btn nw-btn-secondary nw-btn-sm"
        onClick={onSimulateCrossTabEdit}
      >
        &#9889; Simulate edit from another tab
      </button>
      <button
        type="button"
        className="nw-btn nw-btn-secondary nw-btn-sm"
        onClick={onTriggerDoubleClickConfirm}
      >
        &#9889; Double-click Confirm
      </button>
    </div>
  </fieldset>

  {/* Footer Actions */}
  <div className="nw-chaos-footer">
    <button type="button" className="nw-btn nw-btn-secondary nw-btn-sm" onClick={onResetChaos}>
      Reset chaos
    </button>
    <button type="button" className="nw-btn nw-btn-secondary nw-btn-sm" onClick={onCopyLink}>
      {copySuccess ? 'Copied link!' : 'Copy link to this chaos setup'}
    </button>
  </div>
</div>
```

```css
/* Chaos Console Container */
.nw-chaos-console {
  background-color: var(--nw-surface-console);
  border: 1px solid var(--nw-border-console);
  border-radius: var(--nw-radius-lg);
  padding: 20px;
  box-sizing: border-box;
}
.nw-chaos-header {
  margin-bottom: 16px;
}
.nw-chaos-title-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.nw-chaos-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--nw-text-primary);
}
.nw-chaos-status-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--nw-radius-sm);
}
.nw-chaos-status-pill.is-default {
  background-color: #e2e8f0;
  color: #334155;
  border: 1px solid #cbd5e1;
}
.nw-chaos-status-pill.is-preset {
  background-color: var(--nw-chaos-active-bg);
  color: var(--nw-chaos-active-text);
  border: 1px solid var(--nw-chaos-active-border);
}
.nw-chaos-status-pill.is-custom {
  background-color: var(--nw-chaos-active-bg);
  color: var(--nw-chaos-active-text);
  border: 1px dashed var(--nw-chaos-active-border);
}
.nw-chaos-intro {
  margin: 6px 0 0 0;
  font-size: 13px;
  color: var(--nw-text-secondary);
}

/* 2x2 Preset Grid */
.nw-preset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}
.nw-preset-card {
  background-color: var(--nw-surface-primary);
  border: 1px solid var(--nw-border-control-console);
  border-radius: var(--nw-radius-md);
  padding: 10px 12px;
  cursor: pointer;
  transition: all var(--nw-duration-fast) var(--nw-ease-standard);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.nw-preset-card:hover {
  background-color: #f8fafc;
  border-color: var(--nw-text-primary);
}
.nw-preset-card.is-active {
  background-color: var(--nw-chaos-active-bg);
  border: 2px solid var(--nw-chaos-active-border);
  padding: 9px 11px; /* Compensation for 2px border */
}
.nw-preset-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.nw-preset-name {
  font-size: 13px;
  color: var(--nw-text-primary);
}
.nw-preset-card.is-active .nw-preset-name {
  color: var(--nw-chaos-active-text);
  font-weight: 700;
}
.nw-preset-indicator {
  font-size: 12px;
  font-weight: 700;
  color: var(--nw-text-muted);
}
.nw-preset-card.is-active .nw-preset-indicator {
  color: var(--nw-chaos-active-border);
}
.nw-preset-desc {
  margin: 0;
  font-size: 12px;
  color: var(--nw-text-muted);
  line-height: 1.35;
}

/* Group Fieldsets */
.nw-chaos-fieldset {
  background-color: var(--nw-surface-console-group);
  border: 1px solid var(--nw-border-console);
  border-radius: var(--nw-radius-md);
  padding: 12px 14px;
  margin-bottom: 12px;
}
.nw-chaos-legend {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--nw-text-secondary);
  padding: 0 4px;
}
.nw-control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.nw-sublabel {
  font-size: 13px;
  font-weight: 600;
  color: var(--nw-text-secondary);
}
.nw-segmented-sm .nw-segment-label {
  padding: 4px 8px;
  font-size: 12px;
}
.nw-select-sm {
  height: 34px;
  width: auto;
  font-size: 13px;
}

/* Checkbox Row Ergonomics (>= 32px Touch Target) */
.nw-checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  font-size: 13px;
  color: var(--nw-text-primary);
  cursor: pointer;
}
.nw-checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--nw-action-primary);
}

/* Trigger Buttons & Footer */
.nw-trigger-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.nw-btn-sm {
  min-height: 36px;
  font-size: 13px;
  padding: 0 12px;
}
.nw-chaos-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 16px;
}
```

---

## Phase 8: Sleek, Simple, Beautiful Motion Suite & Animation Polish

To ensure the UI looks exceptionally crafted and responsive while preventing false success impressions, implement these exact transition rules:

```css
/* Step Viewport Cross-Fade */
.nw-step-content-viewport {
  animation: nw-fade-in var(--nw-duration-base) var(--nw-ease-decelerate);
}
@keyframes nw-fade-in {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Instant Render for Errors & Uncertain States (Zero Jitter) */
.nw-error-summary,
.nw-result-unconfirmed,
.nw-result-rejected {
  animation: none !important;
}

/* Subtle Interactive Button Press */
.nw-btn:active:not(:disabled) {
  transform: translateY(0.5px);
}

/* Chaos Preset Active Transition */
.nw-preset-card {
  transition:
    background-color var(--nw-duration-fast) var(--nw-ease-standard),
    border-color var(--nw-duration-fast) var(--nw-ease-standard);
}

/* Recent Activity New Item Highlight */
.nw-activity-item.is-new {
  animation: nw-highlight-row 400ms var(--nw-ease-standard);
}
@keyframes nw-highlight-row {
  from {
    background-color: var(--nw-chaos-active-bg);
  }
  to {
    background-color: transparent;
  }
}
```

---

## Phase 9: Verification Checklist & Selector Guardrails

Before declaring the UI implementation complete, run the following verification checks:

### 9.1 Cypress Selector Guardrails

- [ ] Confirm `input[name="amount"]` retains `id="field-amount"` (or existing Cypress selector).
- [ ] Confirm button texts match existing tests: `"Review transfer"`, `"Confirm transfer"`, `"Try again"`, `"Leave transfer unconfirmed"`, `"Edit details"`, `"Reset chaos"`.
- [ ] Confirm `AccountSummary` renders recipient name and formatted amount strings matching Cypress assertions.
- [ ] Confirm `ChaosPanel` preset clicks trigger the existing Redux action handlers without altering state payload contracts.

### 9.2 Accessibility & Contrast Audit

- [ ] Verify keyboard tab order: `SendForm` inputs -> `Review transfer` button -> `AccountSummary` -> `ChaosPanel`.
- [ ] Test with `filter: grayscale(100%)` in DevTools: verify `Succeeded` (solid emerald + checkmark), `Rejected` (solid crimson + octagon), and `Unconfirmed` (dashed border + diamond) remain 100% distinguishable.
- [ ] Verify `outline: 2px solid #0F4C81` appears clearly on all focused controls.
- [ ] Test under `@media (prefers-reduced-motion: reduce)`: verify all spinner rotations stop and instant transitions apply.

### 9.3 Viewport Inspection

- [ ] Test at `1280 × 800`: verify balanced 2-column layout with no horizontal overflow.
- [ ] Test at `375 × 667`: verify single column layout with Transfer Card above fold and no horizontal clipping.
- [ ] Test at `320px` width: verify `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
