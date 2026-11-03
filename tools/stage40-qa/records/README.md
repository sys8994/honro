# Frozen native failure evidence

`deck-01-failed.json.xz` is one losslessly compressed JSON object containing
protocol.json, entry.json, result.json, analysis.json, final-profile.json and
turns.jsonl from the failed b631d1b1 comparison. These are HONRO game states,
not personal account information. The original run failed: R25,41/42 removed,
no return. Its summary must not be replaced by a later diagnostic outcome.
The original turn logger omitted seven movement-consumed turn rows; retained
result actions and final save preserve their water-recovery outcomes. Do not
invent those omitted rows. The next controller records that branch explicitly.
