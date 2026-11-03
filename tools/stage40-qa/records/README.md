# Frozen native failure evidence

`deck-01-failed.json.xz` is one losslessly compressed JSON object containing
protocol.json, entry.json, result.json, analysis.json, final-profile.json and
turns.jsonl from the failed b631d1b1 comparison. These are HONRO game states,
not personal account information. The original run failed: R25,41/42 removed,
no return. Its summary must not be replaced by a later diagnostic outcome.
The original turn logger omitted seven movement-consumed turn rows; retained
result actions and final save preserve their water-recovery outcomes. Do not
invent those omitted rows. The next controller records that branch explicitly.

`upperfix-01-failed.json.xz` retains the native16f88a28 R25 failure:41/42,
all heroes/residents alive, no return. `finishing-01-r18-chain.json.xz` retains
the native3e84de77 normal-entry combatR16 and safe return/settlementR18,
including the unchanged post-settlement harness failure and a separate exact
saved-profile reload proof. No failure is overwritten or presented as a new
combat run. These are native functional diagnostics, not browser/fun approval.
