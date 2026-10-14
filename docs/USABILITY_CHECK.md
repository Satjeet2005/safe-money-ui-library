# Usability Check Kit (Informal Facilitator Kit)

> **Scope & Disclosure:** This document is an informal, qualitative usability check kit designed for 5–8 participants in Phase 6 (WP-36). It is not a statistically representative scientific study and does not claim real-world conversion, commercial readiness, or user research metrics (PRD §19.1–19.3, §20). All participant slots, observation notes, and responses are intentionally left empty for Satjeet to fill after facilitating real sessions.

---

## 1. Facilitator Instructions

### Preparation

1. Open the transfer demo in a standard desktop browser (either local development build via `pnpm dev` at `http://localhost:5173/` or the public demo URL).
2. Ensure a clean state: reset the session by clearing browser session storage or opening a new incognito/private browsing window.
3. Verify the Chaos panel is in default state (all faults off, latency normal).
4. Provide the participant with a physical keyboard and mouse or trackpad.

### Facilitator Briefing Script (Read verbatim to participant)

> "Thank you for helping test this prototype. We are testing a fictional money transfer interface called Northwind Pay to see how clearly it communicates and handles transfers. We are testing the software, not you. There are no right or wrong actions. Please think aloud as you work through each task, explaining what you are looking at and what you expect to happen. If you encounter any unexpected behavior, please tell me."

### Facilitator Rules

- Do not coach, guide, or steer the participant toward specific buttons or fields.
- If the participant asks "Is this right?", respond neutrally: "What would you normally do here?"
- Observe participant hesitation, confusion, and path choices silently without intervening unless the application hangs.
- At the end of each task, ask the three post-task questions neutrally and write down the participant's exact words.
- Closing: Thank the participant simply without soliciting compliments or leading feedback: "Thank you for your time and feedback. This concludes our session."

### Privacy Guardrails

- **Permitted fields:** First name and age band only.
- **Strictly prohibited:** Do not collect or record email addresses, phone numbers, full dates of birth, home addresses, government IDs, banking credentials, or employer information.

---

## 2. Participant Tasks

### Task 1: Send a Normal Transfer

- **Neutral prompt to participant:** "Please send a transfer from your account to an existing recipient of your choice."
- **Expected workflow:**
  1. From the Send form, select a recipient from the dropdown.
  2. Enter an amount within the available source account balance.
  3. Select "Continue to review".
  4. Inspect the review screen details.
  5. Select "Confirm transfer".
  6. Reach the success screen and view confirmation details.

### Task 2: Recover from the "Lost Response" Preset

- **Neutral prompt to participant:** "In the application, open the 'Chaos mode' panel at the top, select the preset labeled 'Lost response', and attempt to send a transfer. If something happens, proceed as you normally would to resolve it."
- **Expected workflow:**
  1. Click the "Chaos mode" button in the header.
  2. Select the "Lost response" preset button.
  3. Close the Chaos panel or proceed to the transfer form.
  4. Fill and submit a transfer.
  5. The submission encounters a network loss and displays an unconfirmed result banner explaining that the status is unknown.
  6. The participant chooses an action (e.g. selects "Retry sending" or "I'll check later").
  7. Successful retry resolves without double-debiting.

### Task 3: Enter "1.234" with German (de-DE) Number Format

- **Neutral prompt to participant:** "On the transfer form, select the German (de-DE) number format, type the characters '1.234' into the transfer amount field, and observe how the amount is interpreted."
- **Expected workflow:**
  1. On the Send form, locate the "Number format" selector and choose `de-DE (1.234,56)`.
  2. Focus the amount field and type `1.234`.
  3. Observe that in `de-DE`, the period `.` functions as a thousand grouping separator rather than a decimal mark (resulting in 1,234.00 major units rather than 1.234).
  4. Observe whether the live formatted preview aids comprehension.

---

## 3. Post-Task Questions (Per Task)

> **Notice regarding question wording (logged as Q-WP28-001 in `docs/OPEN_QUESTIONS.md`):** The PRD specifies asking questions after each task without fixing exact question strings. The following three neutral, open-ended questions are proposed pending Satjeet's final confirmation:

1. **Expectation:** _"What did you expect to happen?"_
2. **Clarity:** _"Was anything confusing or unexpected? Please describe it."_
3. **Effort:** _"How easy or difficult was this task, and what influenced your answer?"_

---

## 4. Participant Session Records

Age bands: `18–24` · `25–34` · `35–44` · `45–54` · `55–64` · `65+`

---

### Participant 1

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

### Participant 2

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

### Participant 3

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

### Participant 4

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

### Participant 5

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

### Participant 6 (Optional)

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

### Participant 7 (Optional)

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

### Participant 8 (Optional)

- **First Name:**
- **Age Band:**
- **Date & Device:**

#### Task 1: Normal Transfer

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 2: Lost Response Recovery

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

#### Task 3: German Number Format (`1.234`)

- **Outcome:** [ ] Completed independently [ ] Completed with difficulty [ ] Not completed
- **Observations:**
- **Q1 (Expectations):**
- **Q2 (Confusion/Unexpected):**
- **Q3 (Ease/Difficulty):**

---

## 5. Synthesis & Findings Summary (To be filled by Satjeet in WP-36)

| Task                      | Total Attempts | Completed Independently | Completed with Difficulty | Not Completed | Key Themes / Findings |
| ------------------------- | -------------- | ----------------------- | ------------------------- | ------------- | --------------------- |
| 1. Normal Transfer        |                |                         |                           |               |                       |
| 2. Lost Response Recovery |                |                         |                           |               |                       |
| 3. German Number Format   |                |                         |                           |               |                       |

### Actionable Takeaways & Next Steps

- _To be documented by Satjeet following session execution._
