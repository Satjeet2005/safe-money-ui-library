# Walkthrough Video Script (60–90 seconds)

This script is written for Satjeet to record in his own voice alongside a screen recording of the application and terminal.

Target duration: **60 to 90 seconds**.
Speaking tone: Plain, conversational, confident, and technically precise.

---

## Script Overview

| Time          | Beat                                                             | On screen                         |
| ------------- | ---------------------------------------------------------------- | --------------------------------- |
| **0:00–0:10** | Thesis                                                           | README top                        |
| **0:10–0:30** | Happy path: recipient, `1,234.56`, review, confirm               | Demo, J1                          |
| **0:30–1:00** | Chaos: `Lost response`, unconfirmed screen, `Try again` recovery | Demo, J5                          |
| **1:00–1:15** | Evidence: `pnpm verify` and mutation score                       | Terminal                          |
| **1:15–1:30** | Limitation and next steps                                        | README "What this does not prove" |

---

## Detailed Spoken Script

### Beat 1: The Thesis (0:00–0:10 · ~10 seconds)

**On screen:** Top of `README.md` in browser or editor, showing the title, thesis, and badges.

**Spoken voiceover:**

> "Hi, I'm Satjeet. safe-money-ui explores a core thesis: a payment interface can be built so that malformed input, rapid double-clicks, slow networks, lost responses, and bad payloads never cause a false success or duplicate debit—and every claim is verifiable in minutes."

---

### Beat 2: Happy Path Journey (0:10–0:30 · ~20 seconds)

**On screen:** The reference transfer demo running locally at `localhost:5173`. Select recipient Mateo Alvarez, enter amount `1,234.56` USD, click Review, and then click Confirm.

**Spoken voiceover:**

> "Here on the transfer form, amount inputs use exact minor units and locale formatting rather than standard number inputs. Entering 1,234.56 validates against live balance and fee limits. Navigating to Review snapshots the transfer parameters, and confirming sends the payment to our simulated service, showing immediate confirmation and updating account activity."

---

### Beat 3: Lost Response & Idempotent Recovery (0:30–1:00 · ~30 seconds)

**On screen:** Open the Chaos panel. Click the `Lost response` preset. Initiate another transfer. The UI displays the unconfirmed screen: "We couldn't confirm this transfer". Click `Try again`. The result changes to "Transfer sent". Point to the Recent activity section showing exactly one new `Completed` row, with the balance debited only once.

**Spoken voiceover:**

> "Now let's break it using the Chaos panel. I'll select the 'Lost response' preset. Here, the server executes the transfer, but the network drops the confirmation back to the browser.
>
> Instead of falsely claiming failure or assuming success, the UI transitions to an unconfirmed state. Clicking 'Try again' reuses the identical idempotency key. The server detects the existing record and returns the confirmed transfer without charging the account a second time. In Recent activity, we see exactly one completed transfer row, and the account balance was debited only once."

---

### Beat 4: Verification & Mutation Testing (1:00–1:15 · ~15 seconds)

**On screen:** Switch to terminal window. Run `pnpm verify` (or show completed green summary) and highlight `docs/METRICS.md` with the Stryker mutation score.

**Spoken voiceover:**

> "Everything is backed by automated tests. Running pnpm verify checks strict types, linting, bundle budgets, accessibility audits, and property tests. In mutation testing with Stryker, our tests achieved a mutation score of 90.63%, verifying that our assertions catch subtle boundary logic mutations."

---

### Beat 5: Limitation and Next Steps (1:15–1:30 · ~15 seconds)

**On screen:** Scroll to the "What this does not prove" section in `README.md`.

**Spoken voiceover:**

> "To be clear about limitations: the service is a client simulation, exchange rates are fictional, and there is no real money or authentication involved.
>
> As a next step, I would connect this client state machine to a production payment backend with distributed locking, server-side idempotency storage, and webhook reconciliation."

---

## Production Notes for Recording

1. **Resolution:** 1080p or 1440p screen capture at 60fps.
2. **Audio:** Clear microphone with minimal background noise; speak naturally without rushing.
3. **Cursor:** Smooth mouse movements; keep the cursor near active inputs and buttons.
4. **Window layout:**
   - Chrome on left with demo app running on port 5173.
   - Terminal window ready with `pnpm verify` output or live run.
5. **Deterministic setup:** Ensure the demo is reset or run with clean storage before recording.
