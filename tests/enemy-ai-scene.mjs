/** Debug view of one enemy decision: plays stage <id> (heroes pass) until <enemy> is about to
 * decide, then renders terrain, units, the chosen target and every trajectory the shot search
 * tried, coloured by outcome. usage: node tests/enemy-ai-scene.mjs <stage> <enemyId> <out.svg> [round] */
import {writeFileSync} from 'node:fs';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';
const [stage, enemyId, out, roundArg] = process.argv.slice(2);
const g = await guidanceRuntime(), C = g.HONRO_CORE, STEP = 1 / 120;
const map = g.HONRO_PROJECT.stages.find(s => s.metadata.stageId === +stage);
const b = g.HonroMaps.createBattle(map, g.HONRO_PROJECT); g.HonroStageRules?.sanitizeStageBattle?.(b);
const e = new C.Engine(b, () => {}, true);
const wantRound = +(roundArg || 0);
let found = false;
for (let r = 0; r < 8 && !found; r++) {
  for (let i = 0; i < 12 && b.side === 0; i++) { try { e.finishAction(true); } catch {} for (let k = 0; k < 240 && b.side === 0 && b.phase !== 'aim'; k++) e.tick(STEP); }
  for (let guard = 0; b.side !== 0 && guard < 60 * 120; guard++) {
    const u = e.active;
    if (u?.id === enemyId && r >= wantRound && !u.aiMove && (process.env.BEFORE ? u.lastAct !== b.round : u.lastAct === b.round) && !b.projectiles.length && b.phase === 'enemy') { found = true; break; }
    e.planningBudget(4); try { e.tick(STEP); e.tick(STEP); } finally { e.planningBudget(); }
  }
}
if (!found) { console.log('enemy turn not reached'); process.exit(1); }
const u = e.active, target = C.targetFor(e, u);
if (process.env.BEFORE) { console.log('at', Math.round(u.x), Math.round(u.y), 'move', Math.round(u.moveLeft), 'range'); for (const o of C.debugMoveOptions(e, u, target)) console.log(JSON.stringify(o)); }
const tries = [];
const pr = e.predict.bind(e);
e.predict = (...a) => { const r = pr(...a); tries.push({ angle: a[2], power: a[3], skill: a[1].id, hit: r }); return r; };
const skills = u.loadout.map(id => C.SKILLS[id]).filter(s => s && !s.passive && e.manaCost(s, u) <= u.focus);
const choice = C.finishPlanning(C.chooseEnemyShotSteps(e, u, target, skills));
if (process.env.TRIES) for (const t of tries) console.log(t.skill, Math.round(t.angle), t.power.toFixed(2), 'hit', t.hit.unit || '-', Math.round(t.hit.x), Math.round(t.hit.y), 'pts', (t.hit.points || []).length, 'terrain', t.hit.terrain || '');
const v = C.shotViable(e, u, choice.skill, target, choice.aim.angle, choice.aim.power);
console.log(JSON.stringify({ enemy: u.id, role: u.role, pos: [Math.round(u.x), Math.round(u.y)], target: target.id, tpos: [Math.round(target.x), Math.round(target.y)], skills: skills.map(s => s.id), choice: { skill: choice.skill.id, angle: Math.round(choice.aim.angle), power: +choice.aim.power.toFixed(2), score: Math.round(choice.aim.score) }, viable: v.ok, reason: v.reason, miss: Math.round(v.miss), tries: tries.length }));
if (process.env.BRUTE) { const sk = skills[0]; let ok = 0, best = null; for (let a = 95; a <= 178; a += 1) for (let pw = .08; pw <= 1.001; pw += .02) { const h = pr(u, sk, a, pw, target, false); if (h.unit === target.id || C.shotImpactValue(e, u, sk, h).enemyDamage > 0) { ok++; best = best || [a, +pw.toFixed(2)]; } } console.log('brute lanes', ok, 'first', best, 'seeds', JSON.stringify(e.shotSeeds(u, sk, target).map(x => [Math.round(x.angle), +x.power.toFixed(2)]))); }
// render
const xs = [u.x, target.x], pad = 500, x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(u.y, target.y) - 700, y1 = Math.max(u.y, target.y) + 300;
const poly = t => t.vertices ? t.vertices.map(p => `${p.x},${p.y}`).join(' ') : `${t.x},${t.y} ${t.x + t.w},${t.y} ${t.x + t.w},${t.y + t.h} ${t.x},${t.y + t.h}`;
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" width="1400" height="${Math.round(1400 * (y1 - y0) / (x1 - x0))}"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#1d2430"/>`;
for (const t of b.terrain) if (!t.broken) svg += `<polygon points="${poly(t)}" fill="${t.oneWay ? '#3b4a3c' : '#4b5563'}" stroke="#8a96a8" stroke-width="1"/>`;
for (const tr of tries) { const pts = [...(tr.hit.points || []), { x: tr.hit.x, y: tr.hit.y }]; const col = tr.hit.unit === target.id ? '#4ade80' : tr.hit.unit ? '#facc15' : '#f87171'; svg += `<polyline points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2" opacity=".45"/>`; }
for (const w of b.units) if (!w.dead) svg += `<rect x="${w.x - w.r}" y="${w.y - w.h}" width="${w.r * 2}" height="${w.h}" fill="${w.id === u.id ? '#f97316' : w.id === target.id ? '#22d3ee' : w.side === 1 ? '#b91c1c' : '#2563eb'}"/>`;
svg += `<text x="${x0 + 20}" y="${y0 + 40}" font-size="30" fill="#fff">${u.id} → ${target.id}: ${v.ok ? 'OK' : v.reason} (${tries.length} tries)</text></svg>`;
writeFileSync(out, svg);
