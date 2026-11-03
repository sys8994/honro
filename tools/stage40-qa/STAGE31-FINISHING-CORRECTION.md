# Stage31 low-HP finishing diagnosis

Original whole run41721169502 failed atR21 with one enemy on2HP. Its normal
saved continuation41733826155 walked the knight from5956.75 to6339.68 against
the enemy at6507.38, without jumps, HP changes or teleportation. It then made
no shots throughR23. Both original source and final save confirm zero enemy
shield. Exact candidate checks ran, but trajectory checks remained zero.

This is a QA decision defect: shotImpactValue caps damage at remaining HP plus
shield and the NPC shotViable value policy requires net greater than2. A lone
2HP enemy therefore cannot produce any accepted finishing hit, even if the
physical prediction would directly hit it safely. That is not a demonstrated
terrain barrier or justification to reduce enemy HP. Original failures stay
failed and all originals are retained.

Only the QA planner and its settled-angle validation gain the same narrow
exception: exactly one living hostile, remaining HP plus shield in(0,2],
direct predicted hit on that target, no terrain endpoint, sufficient predicted
damage to finish, positive net and exactly zero predicted friendly damage/risk.
The existing trajectory ally checks, three-angle robustness, affordability,
actual joystick/charge/release and normal20R objective bound remain. No product
runtime, save, live state or gate criterion is changed. Pure negative tests
cover misses, walls, partial hits, friendly risk, shields and multiple enemies.

Focused proof must replay the exact original save with the unchanged original
product and normal inputs, then verify the actual hit and ordinary boarding.
It cannot retroactively turn the old R21 whole run into a20R pass. A future
fresh whole run must disclose this QA correction separately from the two
product corridor changes. No stale incoming-damage-memory policy change is
bundled.
