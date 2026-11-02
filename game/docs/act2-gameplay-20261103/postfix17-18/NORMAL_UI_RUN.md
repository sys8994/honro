# Candidate normal-UI regression integration

Use the parent's unified **fresh gated** integrated build. Do not run a stale standalone generic gate, skip gates, or infer that committed HTML includes the source fixes. Record exact commit, gate receipt, built `HONRO.html`/manifest and runtime SHA256 files before serving.

With that build served on `HONRO_QA_URL`, run separate clean Chromium instances:

```sh
HONRO_STAGE=17 HONRO_QA_OUT=_local/reports/stage17-retained-ui python tools/act2-qa/retained-interactions-ui.py
HONRO_STAGE=18 HONRO_QA_OUT=_local/reports/stage18-retained-ui python tools/act2-qa/retained-interactions-ui.py
```

Install the existing workflow's pinned Playwright1.58 browser dependencies. Always upload each output directory, even on failure. Driver loads the unchanged native-produced profile **before gameplay**, clicks title Continue, then only normal UI hero selectors/E or F. Runtime evaluations only observe. It records immutable fixture hashes, initial/final states, screenshots and page exceptions. Any exception, including screenshot/close errors, fails the receipt.

-17: a destroyed hoist stays dead/HP0 at the same pose, eligible living mage/occultist is selected normally, ordinary E detaches spirit and advances goal.
-18: saved completed/refunded cast is present initially; ordinary F advances action boundary, normal animation finishes bell lift. No cast clearing, HP/position edits or success flags.

These are **regression boundaries**, not chapter clears, independent trials, browser gameplay balance acceptance, or final-art approval. Native candidate regression receipts are adjacent. Baseline cohorts remain untouched.
