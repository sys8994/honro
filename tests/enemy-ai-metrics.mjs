/** Enemy-turn metrics on real campaign battles (production engine, no browser).
 * Heroes pass their turn; the enemy side plays N rounds at the live 4 ms/frame
 * planning budget. Reports per enemy action: frames to decide, attack vs hold,
 * predictions, plan restarts, and damage dealt to the player's side.
 * usage: node tests/enemy-ai-metrics.mjs [stage ...] [--rounds 3] [--difficulty veteran] [--json out.json] */
import {writeFileSync} from 'node:fs';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';
const args = process.argv.slice(2), opt = (k, d) => args.includes(k) ? args[args.indexOf(k) + 1] : d;
const rounds = +opt('--rounds', 3), jsonOut = opt('--json'), difficulty = opt('--difficulty');
const stages = args.filter((a, i) => /^\d+$/.test(a) && !['--rounds', '--json', '--difficulty'].includes(args[i - 1])).map(Number);
const g = await guidanceRuntime();
const STEP = 1 / 120, FRAME_TICKS = 2;   // ~60 fps with two 120 Hz substeps per frame
const report = {};
for (const id of stages.length ? stages : [3, 9, 15, 21, 27, 33]) {
  const map = g.HONRO_PROJECT.stages.find(s => s.metadata.stageId === id);
  if (!map) continue;
  const b = g.HonroMaps.createBattle(map, g.HONRO_PROJECT); g.HonroStageRules?.sanitizeStageBattle?.(b);
  if (difficulty) b.difficulty = difficulty;
  const e = new g.HONRO_CORE.Engine(b, () => {}, true);
  let preds = 0, predMs = 0, restarts = 0;
  const pr = e.predict.bind(e); e.predict = (...a) => { const t = performance.now(); const r = pr(...a); predMs += performance.now() - t; preds++; return r; };
  const actions = [];
  const heroHp = () => b.units.filter(v => !v.dead && (v.side === 0 || (v.side === 2 && (v.honroAlly || v.id === 'objective')))).reduce((s, v) => s + v.hp + v.shield, 0);
  const cats = {}; let frames = 0, think = 0, t0 = 0, cur = null, start = 0, p0 = 0, m0 = 0, hp0 = 0, lastPlan = null;
  for (let r = 0; r < rounds && !['won', 'lost'].includes(b.phase); r++) {
    // heroes pass
    for (let i = 0; i < 12 && b.side === 0 && !['won', 'lost'].includes(b.phase); i++) { try { e.finishAction(true); } catch {} for (let k = 0; k < 240 && b.side === 0 && b.phase !== 'aim'; k++) e.tick(STEP); }
    let guard = 0;
    while (b.side !== 0 && !['won', 'lost'].includes(b.phase) && guard++ < 60 * 120) {
      e.planningBudget(4);
      try { for (let k = 0; k < FRAME_TICKS; k++) e.tick(STEP); } finally { e.planningBudget(); }
      frames++;
      { const u = e.active; const k = !u ? 'none' : (u.aiMove || u.moveTarget !== undefined) ? 'move' : b.projectiles.length ? 'flight' : e.enemyPlanning ? 'think' : b.phase !== 'enemy' ? 'phase:' + b.phase : 'idle';
        if (k === 'think') think++; cats[k] = (cats[k] || 0) + 1; }
      const act = b.side === 1 ? b.active : null;
      if (act !== cur) {
        if (cur) { const u = e.unit(cur); actions.push({ id: cur, role: u?.role, frames: frames - start, think: think - t0, preds: preds - p0, predMs: Math.round(predMs - m0), damage: Math.round(hp0 - heroHp()), intent: u?.intent, near: u ? Math.round(Math.min(...b.units.filter(v => !v.dead && v.side === 0).map(v => Math.hypot(v.x - u.x, v.y - u.y)))) : 0, dy: u ? Math.round(Math.min(...b.units.filter(v => !v.dead && v.side === 0).map(v => v.y - u.y))) : 0 }); }
        cur = act; start = frames; t0 = think; p0 = preds; m0 = predMs; hp0 = heroHp();
      }
    }
    if (cur) { const u = e.unit(cur); actions.push({ id: cur, role: u?.role, frames: frames - start, think: think - t0, preds: preds - p0, predMs: Math.round(predMs - m0), damage: Math.round(hp0 - heroHp()), intent: u?.intent }); cur = null; }
  }
  const hold = actions.filter(a => /방어|보류|대기|경계/.test(a.intent || ''));
  const s = { actions: actions.length, holdRate: +(hold.length / Math.max(1, actions.length)).toFixed(2), meanFrames: +(actions.reduce((x, a) => x + a.frames, 0) / Math.max(1, actions.length)).toFixed(1), meanThink: +(actions.reduce((x, a) => x + (a.think||0), 0) / Math.max(1, actions.length)).toFixed(1), maxThink: Math.max(0, ...actions.map(a => a.think||0)),
    maxFrames: Math.max(0, ...actions.map(a => a.frames)), preds, predMs: Math.round(predMs), restarts: e.planRestarts, damage: actions.reduce((x, a) => x + Math.max(0, a.damage), 0), phase: b.phase };
  report[id] = { ...s, cats, actions };
  console.log(`stage ${id}: actions ${s.actions} hold ${(s.holdRate * 100).toFixed(0)}% think ${s.meanThink}/${s.maxThink}f turn ${s.meanFrames}/${s.maxFrames}f preds ${s.preds} (${s.predMs}ms) restarts ${s.restarts} heroDamage ${s.damage} ${s.phase} ${JSON.stringify(cats)}`);
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(report, null, 1));
