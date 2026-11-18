# Whole-cost preparation cwd correction

CI44258579861 stopped before Chrome: the official842 builds succeeded, but subsequent `runtimeEntries` performed repository-relative icon asset reads from the orchestrator's caller directory. A subprocess `cwd` does not change its parent's cwd. No actual cost samples were collected.

The correction changes only the runtime binding segment in prepare.mjs. It saves caller cwd, selects the explicit checkout root before importing/invoking its own shared/build.mjs, asserts that root, and restores caller cwd in finally even on error. Output paths therefore retain their previous caller-relative semantics. Baseline/candidate provenance, helper absence/SHA, all contracts and measurement logic are unchanged. No source/runtime production file changes or SS2 injection.

`test-cwd.mjs` executes the exact corrected segment extracted from prepare.mjs against two separate temporary checkout-shaped fixtures whose runtimeEntries read different relative icon manifests. It also tests a throwing runtime and confirms cwd restoration. These mocks passed locally, as did syntax checking. They do not claim successful official runtime binding or browser execution; those remain for the retried CI.

Regression command: `node tools/testing/stage32-whole-baseline-prep/test-cwd.mjs`.
