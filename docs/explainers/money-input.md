# Explainer: money-input

## What it does

`packages/safe-money-ui/src/react/MoneyInput.tsx` and `ErrorSummary.tsx` are accessible controlled React UI primitives that provide monetary input, localized formatting on blur, live polite announcements, and error summaries.

## Why it exists

HTML5 `<input type="number">` has severe flaws for payments: it accepts scientific notation (`1e5`), exhibits localized comma bugs, modifies values on mouse scrolling, and lacks currency formatting. `MoneyInput` uses `type="text"` with `inputMode="decimal"` to deliver consistent, accessible numeric entry across desktop and mobile devices.

## How it works

1. Renders an `<input type="text">` with `autoComplete="off"` and `spellCheck="false"`.
2. Sets `inputMode="decimal"` for decimal currencies and `inputMode="numeric"` for zero-decimal currencies like JPY.
3. Preserves raw user text while typing to prevent disruptive cursor jumping.
4. Executes `parseAmount` on every keystroke and emits raw text, parsed `Money`, and validity via `onChange`.
5. Renders a live preview element with `aria-live="polite"` announcing formatted currency when input is valid.
6. Formats the input value to standard localized display only on `blur`.
7. Shows errors only after first blur or when `showErrors=true` is passed by the parent form.
8. Connects error, hint, and preview elements via `aria-describedby` in strict order: error, hint, preview.
9. Sets `aria-invalid="true"` whenever validation errors are active.
10. `ErrorSummary` announces error groups via `role="alert"` and shifts focus smoothly to invalid fields.

## Trade-offs

Formatting on blur is chosen over live keystroke masking. Live masking frequently causes cursor jumping, erratic backspace behavior, and input lockouts on mobile virtual keyboards, whereas formatting on blur allows natural editing while preserving clean final presentation.

## How it is tested

- Component tests in `packages/safe-money-ui/test/react/MoneyInput.test.tsx` verify cases `MI-01` through `MI-10` and `ErrorSummary.test.tsx` (`ES-01` through `ES-04`).
- Automated accessibility tests verify zero Axe violations in `A11Y-03` (`MoneyInput`) and `A11Y-04` (`ErrorSummary`).
- Cypress journeys J1 (happy path keyboard entry) and J2 (invalid input handling) test real browser interactions.

## Questions an interviewer may ask

1. Why does `MoneyInput` format input text on `blur` rather than on every keystroke?
2. How does `MoneyInput` ensure screen readers announce validation feedback without disrupting typing?
3. Why is `type="text"` preferred over `type="number"` for monetary amounts?
