# Independent Stage31 comparison

Failure run41598201867 at0b58fe989f92e3ec775deb93f38252c71811f02b
has the runtime of nativef3bc6183 (canonical9b2ba731), plus QA-only files.
Passing run41595651979 at74265f8722a7ba74ab6ebc16f0015c9ce9ce6c35
matches native461bc895. Both fullplay drivers SHA256
183a1995b04398c3a8c175b7c0ac633f468a7d4d175126c2540d5d5e56216e64,
precise-aim helpers4385177fdf3fdfb874ad7381045652ec69e2fd9f75ab698550f5a4ca70748980,
and entry fixtures e7be3773e82ea36afcd09bd881b9e490b4fe11a672f570dfa9fdb296ac47985d
are identical. Both enter with seed/rng19388, identical34 enemies, hero HP and
positions. Failure source runtime digest locally reported by its owner is
ff7e81c4cd8c0fb221ff0c1d7b10bcbafe244f2b8e14de7e75ce592a8e159718;
passing CI receipt records
c7367c91e8046a595eed4b552f382a09254035123bb754e5c2223f106b5386a8.

Early choices are identical, but actual first A01 pointer aim is
74.18583872296554 versus74.18961831305194. At launch8 the first observed
precast enemy HP sum divergence is9861 versus9860. These are different actual
browser trajectories, even with identical seed and scripts. Passing combat
clearsR16 and boards/winsR17. Failure remains at247 enemyHP and38shots fromR16
toR19: mage holds lower flank with no shot, knight/occultist approach then
survival-retreat, and archer defends. Watchdog stops on mage repeated coarse
position/HP signatures; it is not a battle lost/dead terminal state.

The failure is retained. This demonstrates a route/formation/survival planner
stall, but does not isolate or exonerate the Stage6 source change. The sources
also differ in narrowly guarded Stage40 port work. Static predicates and small
legacy pilot fixtures are not whole-runtime equivalence proof.

## Bounded causal A/B design, not yet executed

Use two source-identical Stage31 builds differing ONLY in the Stage6 pursuit
wrapper and its explicit integration hooks. Record exact source and served
runtime hashes. Use the same original entry fixture, seed19388, browser
version, viewport and resources. Do not replace the failed release gate.

First replay one frozen finite UI input sequence with controlled browser clock
and identical pointer coordinates/key-down/up timestamps. Advance animation
frames deterministically; do not write actor positions, HP, RNG, story or
objective flags. Compare unrounded world/hero/enemy/projectile/RNG state at
entry, each settled cast and team boundary. A first divergence identifies the
call boundary for investigation. If none occurs, conclude only equivalence
for that bounded sequence, not universal Stage6 isolation.

Separately exercise Stage31 with the wrapper loaded but inactive, recording
wrapper calls and assertions that Stage6-only paths remain inactive. This is
instrumented diagnostic evidence, not human/natural browser acceptance. Do
not change watchdog, stats, target limits, or input policy merely to obtain a
green gate. Any demonstrated controller defect gets a causal focused test
before a separately registered normal run.

Sources: failed ZIP SHA256
9e9b68ff50e174b9c3e7d053b1cfc8418ce489905321019c01a99ae5a80de04e;
passing artifact13215393920, extracted with verified original SHA by
run41604196596 into inspection artifact13216067325. Original records remain.

## Executed bounded pair41605698346

Exact Stage6 source9b2ba731 was built twice. A is unchanged, actual runtime
ff7e81c4cd8c0fb221ff0c1d7b10bcbafe244f2b8e14de7e75ce592a8e159718.
B omits only stage6-pursuit.js and has runtime
2915ae53cca3b58e1a188886b2d42431c8c1c1559576a25fba35ba325a0f7ec8.
Other integration and campaign data remain identical. A source diff is empty.
The fixed-clock pair executes32 identical input records/eight actual casts,
with9 unrounded state checkpoints from seed19388 entry toR2 enemy phase.
All recorded units/projectiles/RNG/queue/event state match exactly. No wrapper
effect is observed for this bounded sequence. It does not test lateR19, the
entire Stage6 integration, universal equivalence, or full-stage acceptance.
Artifact13216573302 SHA256
c6d06e884bc840b7d3b659a217049dd15929fed02bd32c83cd1b938ada0ea16a
was verified before inspection. Its two complete state series and source diffs
are preserved in records/stage31-wrapper-ab-41605698346.json.xz.
