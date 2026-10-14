# Manual Accessibility Checklist

> **Facilitator Notice:** This checklist must be manually performed by Satjeet on real devices and assistive technology. All result fields are intentionally left blank until real testing is conducted. Automated Axe checks (`pnpm test:a11y` and `pnpm e2e:a11y`) pass with zero violations, but manual checks are required before making manual screen-reader or device claims (PRD §15.4, §19.1–19.3).

---

## 1. Summary Checklist

| Check                          | How                                                                                                                                     | Result column |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Screen reader happy path       | Complete J1 with NVDA (Windows) or VoiceOver (macOS). Note whether labels, errors, step headings and the sending status were announced. |               |
| Screen reader error path       | Trigger the empty-form error summary and the `INVALID_GROUPING` error.                                                                  |               |
| Screen reader unconfirmed path | Use the `Timeout then recover` preset.                                                                                                  |               |
| 200% and 400% zoom             | Browser zoom; check nothing is cut off.                                                                                                 |               |
| Keyboard only                  | Complete J1 without a mouse.                                                                                                            |               |
| Phone                          | Real phone, portrait; check the numeric keyboard appears for the amount field.                                                          |               |

---

## 2. Detailed Verification Records

### Check 1: Screen Reader Happy Path

- **Procedure:** Open the transfer demo in a supported browser with NVDA (Windows) or VoiceOver (macOS). Navigate through the complete happy path journey (J1): select source account, recipient, and transfer amount; navigate to the Review screen; inspect review details; confirm the transfer; verify result announcement.
- **Key observations to verify:**
  - Form labels and field hints are announced clearly.
  - Step headings (`h1` / `h2`) announce context on navigation.
  - Form field focus transitions naturally through interactive elements.
  - Submitting state announces progress / polite status without disorienting the user.
  - Success screen announces transfer ID, debited amount, and credited amount.
- **Assistive technology & version:**
- **Browser & version:**
- **Operating system:**
- **Result (Pass / Fail):**
- **Notes & observations:**

---

### Check 2: Screen Reader Error Path

- **Procedure:** Open the transfer form with a screen reader active. Submit the form while empty to trigger multiple validation errors (`EMPTY_RECIPIENT`, `EMPTY_AMOUNT`). Then enter an amount with invalid group separators for the selected locale (e.g. `1,23,45` under `en-US`) to trigger `INVALID_GROUPING`.
- **Key observations to verify:**
  - `ErrorSummary` container receives focus and announces the error count via `role="alert"`.
  - Error links in `ErrorSummary` navigate and move focus to the corresponding invalid input fields.
  - Field-level `aria-invalid="true"` and `aria-describedby` error messages are announced upon focus.
- **Assistive technology & version:**
- **Browser & version:**
- **Operating system:**
- **Result (Pass / Fail):**
- **Notes & observations:**

---

### Check 3: Screen Reader Unconfirmed Path

- **Procedure:** Open the Chaos panel, select the `Timeout then recover` preset, and initiate a transfer. Wait for the client-side timeout to trigger. Inspect the unconfirmed result screen. Select "Retry sending" to recover.
- **Key observations to verify:**
  - Timeout failure state announces clearly as unconfirmed rather than a terminal failure.
  - Accessible banner explains the situation and provides actionable options.
  - Retry button is clearly labeled and accessible via keyboard navigation.
  - Successful recovery announces confirmation details without duplicate transfer side effects.
- **Assistive technology & version:**
- **Browser & version:**
- **Operating system:**
- **Result (Pass / Fail):**
- **Notes & observations:**

---

### Check 4: 200% and 400% Zoom

- **Procedure:** Using desktop browser zoom controls (Ctrl/Cmd + `+`), scale the application to 200% and 400% zoom levels in full-screen and windowed viewports.
- **Key observations to verify:**
  - Layout reflows into a single column without horizontal scrolling at 400% zoom (1280px viewport width base).
  - Text remains legible without overlapping adjacent elements or being clipped.
  - Form inputs, buttons, account selectors, and the Chaos panel remain fully interactive and visible.
  - Banners, error summaries, and modal/drawer panels remain fully accessible.
- **Browser & version:**
- **Operating system:**
- **Result (Pass / Fail):**
- **Notes & observations:**

---

### Check 5: Keyboard Only

- **Procedure:** Complete the transfer flow from form entry to confirmation using only the keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Arrow` keys). Do not touch the mouse or trackpad.
- **Key observations to verify:**
  - All interactive elements receive a clearly visible focus indicator (`:focus-visible`).
  - Focus order follows a logical reading and execution sequence.
  - No keyboard traps occur anywhere in the flow or within the Chaos panel.
  - Dropdown selectors (recipients, accounts, format) and buttons respond to `Space` and `Enter`.
  - "Skip to main content" or initial step focus behaves predictably.
- **Browser & version:**
- **Operating system:**
- **Result (Pass / Fail):**
- **Notes & observations:**

---

### Check 6: Phone (Real Device)

- **Procedure:** Open the deployed application on a physical smartphone (iOS Safari or Android Chrome) in portrait orientation. Tap into the transfer amount field.
- **Key observations to verify:**
  - Virtual keyboard automatically appears in numeric mode (`inputMode="decimal"`).
  - Touch targets meet minimum size recommendations (at least 44×44 CSS pixels).
  - Viewport does not trigger unwanted horizontal scrolling or aggressive auto-zoom on input focus.
  - Step headings, review tables, and action buttons fit comfortably within mobile portrait bounds.
- **Device & model:**
- **Operating system & version:**
- **Browser & version:**
- **Result (Pass / Fail):**
- **Notes & observations:**
