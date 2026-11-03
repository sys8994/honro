# Stage40 local placement and two-angle finale card

Status: registered local prototype, not gameplay/fun/release acceptance.
Parent reviewed scope: existing approved42enemy finale; no stats/HP/count nerfs.
Source before correction: nativef0406082 / canonicalf18ac467, product unchanged
since connected-deck activation2533269c. Full roles trial endedR25 with41/42
removed, boss645HP, mage casualty,3livingheroes/4livingresidents. It failed20R
regardless of hero loss. Hero casualty alone is not an invented rejection gate.

## Cause evidence

`stage40-roles-01/turns.jsonl` shows knight x1049R10,366R11,202R12,
755R13 on dock; mage remained around2055–2084 front dock. The rear occupied
support while the front lost damage output. R20 still had boss2567HP. Last
survivors crowd departure stair aroundx1920–1970 and the friendly-fire-aware
planner repeatedly refuses shots through the knight. Eight stationary noncast
turns remain. Previous target-lock run put mage on actual lower return deck,
where it survived and attacked; that is an existing second physical firing
angle, not a proposed transport or invented platform.

These observations do not establish impossible difficulty or an unavoidable
mage death. Existing ranged retreat, healing radius, current available skills,
warning response and route choices all matter. All prior failures stay intact.

## Exact local product correction

Only `shared/act4-finale-author.mjs`, dock-left slots:
- final40-dock-left-1 possessedArcher x290 ->1290 (x630 rejected by exact compiled-body check).
- final40-dock-left-2 possessedArcher x420 ->930.
Both use the same approved40-dock supportPoint, retaining IDs, types, stats,
role, group membership, activation radius and total42/major1/mid2. No other
actor moves, no terrain/art/escort/story or objective edits. New positions are
staggered behind/between existing close defenders, rather than at the extreme
western retreat edge. Expected effect: shorter necessary rear chase and a more
compact overlapping flank, not fewer attacks or guaranteed survival.

## Independent checks before whole-stage comparison

1. Prove exactly two authored positions differ and all other stage40 data and
   Stage31–39 remain unchanged. Verify count/HP/loadout/armor invariants.
2. Compile current authored scene, verify the two exact support contacts and
   full-body separation on actual terrain. Keep any rejected slot evidence.
3. Prove ordinary step/drop path from dock via departure stair to existing
   return deck. Then prove safe full-cast lines from lower deck toward major
   boss with knight on upper approach. Explicit pose fixtures are not natural
   arrival or browser acceptance.
4. Only after these checks register one changed-cause full diagnostic. Preserve
   legal original profile and all outcomes.18–20R includes combat AND return.
5. Final coherent-source browser inputs, return/roster/settlement/reload,
   viewport/readability and strategy/fun review remain mandatory. No production.

The bounded body-slot probe rejected630: normal compiler displaced it to470.
Recorded actual radii are24/25/32, so the nominal70 gaps are insufficient.
The same-support probe found1290 body-clear;930 was already exact. These are
now the two prototype slots. Compare all other compiled actor coordinates too.

## Registered integrated controller (deck comparison)

Native fixtures demonstrate existing dock drop to the return deck, three safe
full-projectile boss firing lanes, and a normal jump/land/climb retreat before
visible high tide. Continuous left walking and long held-left jumping failed
by passing below the ascending one-way stair; their logs are retained. The
chosen sequence walks to2350, jumps, waits30frames, walks to2140, releases to
land on departure stair, then climbs to a dry role-specific refuge. No terrain,
actor stats, recovery rules or hidden item were changed. Rear-archer pressure
fixture confirms both archers still fire; the930 archer can retreat far west,
so compact placement is not assumed to solve all chase costs.

One integrated normal-entry comparison uses the same prepared profile, exact
42enemy placement, current-observed warning retreat and full-path cast screen.
The native adapter uses App.defend, never Engine.wait/item. If combat clears
within20R it saves that exact checkpoint and continues normal return controls,
production minimap input/observer, existing dialogue/interact, settlement and
reload. Any return budget overrun remains a failure. Canvas/DOM are doubled,
so this is functional diagnostic evidence, not visual/fun/browser acceptance.
