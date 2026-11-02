/* Read-only candidate search. Approximate roots/screens never authorize a shot:
   every selected launch is confirmed by production prediction at all three angles. */
onlyFacing => {
  const started = performance.now(), app = HonroApp, e = app.engine, b = e.b, u = e.active, C = HONRO_CORE;
  const snapshot = JSON.stringify(b), sc = app.scene, rect = sc.canvas.getBoundingClientRect();
  const lo = sc.world(0, 0), hi = sc.world(rect.width, rect.height);
  const inView = v => v.x >= Math.min(lo.x, hi.x) && v.x <= Math.max(lo.x, hi.x) && v.y >= Math.min(lo.y, hi.y) && v.y - v.h <= Math.max(lo.y, hi.y);
  const visible = b.units.filter(v => v.side === 1 && !v.dead && inView(v));
  const allies = b.units.filter(v => v.side === 0 && !v.dead && v.id !== u.id);
  const metrics = { screens: 0, exact: 0, trajectory: 0, rootEvaluations: 0 };
  const legal = a => Number.isFinite(a) && a >= -84.8 && a <= 264.8 && Math.abs(a - 90) >= .2 && (!onlyFacing || (a > 90 ? -1 : 1) === u.facing);
  const intersects = (a, z, hero) => {
    const bounds = [hero.x - hero.r - 18, hero.x + hero.r + 18, hero.y - hero.h - 18, hero.y + 18];
    let lo = 0, hi = 1;
    for (const [v, d, min, max] of [[a.x, z.x - a.x, bounds[0], bounds[1]], [a.y, z.y - a.y, bounds[2], bounds[3]]]) {
      if (Math.abs(d) < 1e-9) { if (v < min || v > max) return false; continue; }
      let t0 = (min - v) / d, t1 = (max - v) / d;
      if (t0 > t1) [t0, t1] = [t1, t0];
      lo = Math.max(lo, t0); hi = Math.min(hi, t1); if (lo > hi) return false;
    }
    return true;
  };
  function fixedPowerRoots(skill, target) {
    const v = e.velocity(u, skill, 0, 1), speed2 = v.vx * v.vx + v.vy * v.vy;
    const aim = e.damageAim(target, .52);
    function solve(originAngle) {
      const origin = e.projectileOrigin(u, skill, originAngle);
      const sample = { ...origin, wind: skill.wind, gravityScale: skill.gravity ?? 1, skill: skill.id, mode: skill.mode };
      const force = e.acceleration({ ...sample, vx: 0, vy: 0 });
      const k = force.x - e.acceleration({ ...sample, vx: 1, vy: 0 }).x;
      if (!Number.isFinite(k) || k < -1e-8) return [];
      function residual(t) {
        metrics.rootEvaluations++;
        const F = k < 1e-7 ? t : -Math.expm1(-k * t) / k;
        const Q = k < 1e-7 ? t * t / 2 : (t - F) / k;
        const vx = (aim.x - origin.x - force.x * Q) / F, vy = (aim.y - origin.y - force.y * Q) / F;
        let angle = Math.atan2(-vy, vx) * 180 / Math.PI; if (angle < -90) angle += 360;
        return { error: vx * vx + vy * vy - speed2, angle };
      }
      const roots = []; let lastT = .025, last = residual(lastT);
      for (let t = .1; t <= 12; t += .1) {
        const next = residual(t);
        if (last.error * next.error <= 0) {
          let left = lastT, right = t, a = last;
          for (let n = 0; n < 24; n++) { const mid = (left + right) / 2, q = residual(mid); if (a.error * q.error <= 0) right = mid; else { left = mid; a = q; } }
          roots.push(residual((left + right) / 2).angle);
        }
        lastT = t; last = next;
      }
      return roots;
    }
    let roots = solve(aim.x >= u.x ? 20 : 160);
    for (let n = 0; n < 2; n++) roots = roots.map(a => solve(a).sort((x, y) => Math.abs(x - a) - Math.abs(y - a))[0]).filter(Number.isFinite);
    return roots;
  }
  const candidates = [];
  for (const target of [...visible].sort((a, z) => Math.abs(a.x - u.x) - Math.abs(z.x - u.x)).slice(0, 4)) {
    for (let idx = 0; idx < u.loadout.length; idx++) {
      const id = u.loadout[idx], skill = C.SKILLS[id];
      if (!skill || skill.passive || ['O13', 'S08'].includes(id) || !e.skillAllowed(skill, u) || e.cooldownLeft(u, id) > 0 || !e.canAfford(skill, u, 1) || skill.mode === 'charge' || id === 'S00' && Math.hypot(target.x - u.x, target.y - u.y) > 160) continue;
      const roots = fixedPowerRoots(skill, target), seeds = e.shotSeeds(u, skill, target).map(z => z.angle);
      const angles = new Set([...roots.flatMap(a => [0, -.4, .4, -1, 1].map(d => a + d)), ...seeds]);
      const right = target.x >= u.x;
      for (const a of [-65, -35, -5, 25, 50, 70, 86]) angles.add(right ? a : 180 - a);
      const radius = e.effective(skill, u).radius || 0;
      for (const angle of angles) {
        if (!legal(angle)) continue;
        metrics.screens++;
        const hit = e.aiPredict(u, skill, angle, 1, target);
        const distance = Math.hypot(hit.x - target.x, hit.y - (target.y - target.h * .52));
        const enemyHit = b.units.some(v => !v.dead && v.side === 1 && v.id === hit.unit);
        const score = hit.unit === target.id ? 300 : radius > 0 && distance < radius ? 200 + (1 - distance / radius) * 50 : enemyHit ? 160 : 0;
        if (score > 0) candidates.push({ id, idx, angle, power: 1, target: target.id, screenScore: score, skill, targetUnit: target });
      }
    }
  }
  candidates.sort((a, z) => z.screenScore - a.screenScore);
  // Keep both low and high arcs for each target/skill before nearby variants.
  // Three offsets of one blocked low arc must not crowd out a clear high arc.
  const groups = new Map();
  for (const q of candidates) {
    const key = q.idx + ':' + q.target;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }
  const ordered = [...groups.values()].sort((a, z) => a[0].idx - z[0].idx || Math.abs(a[0].targetUnit.x - u.x) - Math.abs(z[0].targetUnit.x - u.x));
  const shortlist = [], variants = [];
  for (const group of ordered) {
    const arcs = [];
    for (const q of group) {
      if (arcs.every(v => Math.abs(v.angle - q.angle) >= 4)) arcs.push(q);
      else variants.push(q);
    }
    shortlist.push(...arcs.slice(0, 2));
  }
  // At most four skills × four targets × two distinct arcs. Fine alternatives
  // follow only if every primary arc was rejected by exact validation.
  shortlist.splice(32);
  let best = null;
  for (const [candidateIndex, q] of [...shortlist, ...variants.slice(0, 16)].entries()) {
    if (candidateIndex >= shortlist.length && best) break;
    let robust = Infinity;
    for (const delta of [0, -.2, .2]) {
      const angle = q.angle + delta;
      metrics.exact++;
      const safe = C.shotViable(e, u, q.skill, q.targetUnit, angle, 1), hit = safe.hit;
      if (!safe.ok || safe.risk >= .5) { robust = 0; break; }
      metrics.trajectory++;
      const points = e.predict(u, q.skill, angle, 1, q.targetUnit, true).points || [];
      if (allies.some(v => points.slice(1).some((p, i) => intersects(points[i], p, v)))) { robust = 0; break; }
      const radius = e.effective(q.skill, u).radius || 0, distance = Math.hypot(hit.x - q.targetUnit.x, hit.y - (q.targetUnit.y - q.targetUnit.h * .52));
      robust = Math.min(robust, (hit.unit === q.target ? 300 : radius > 0 && distance < radius ? 200 : 0) + (safe.enemyDamage || 0));
    }
    if (robust > 150 && (!best || robust > best.score)) best = { id: q.id, idx: q.idx, angle: q.angle, power: 1, target: q.target, score: robust, angleTolerance: .2 };
  }
  if (JSON.stringify(b) !== snapshot) throw Error('Planner mutated live battle');
  metrics.ms = performance.now() - started;
  return { best, metrics, visible: visible.map(v => ({ id: v.id, x: v.x, y: v.y, hp: v.hp })), observed: b.units.filter(v => v.side === 1 && inView(v)).map(v => ({ id: v.id, x: v.x, y: v.y, hp: v.hp, dead: v.dead })) };
}
