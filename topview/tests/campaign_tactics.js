() => {
  const a = HonroApp;
  let e = a.engine, b = e.b;
  const t = HonroTopview.space, st = b.honroStage, hs = b.honroState, loc = u => ({
    x: u.x,
    y: u.y - u.h / 2
  }), dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  const goal = n => t.point(n), alive = u => u && !u.dead && u.hp > 0;
  const marker = id => b.honroMarkers.find(m => m.id === id), unit = id => e.unit(id);
  let trace = window.routeTrace ??= {
    stage: st,
    decisions: [],
    events: []
  };
  if (trace.stage !== st) trace = window.routeTrace = {
    stage: st,
    decisions: [],
    events: []
  };
  function skip() {
    if (!a.dialogue) return;
    HonroStoryStaging?.skipMotion?.(a);
    if (a.dialogue) HonroStory.finish(a, false);
  }
  function go(u, point) {
    if (!point) return false;
    const before = loc(u);
    const dest = t.free(point, u.r);
    if (!dest || dist(before, dest) < 36 || u.moveLeft < 5) return false;
    const route = t.route(before, dest, u.r);
    if (!route.length) return false;
    let traveled = 0;
    for (const p of route) {
      let d = dist(loc(u), p);
      if (d < 1) continue;
      for (let j = 0; j < 75 && d > 2 && u.moveLeft > 3; j++) {
        const v = loc(u), step = e.walkVector(u, p.x - v.x, p.y - v.y, Math.min(1 / 12, d / u.walkSpeed));
        if (step < .05) break;
        traveled += step;
        e.refreshActivation();
        a.missionTick(1 / 120);
        if (a.dialogue || b.phase !== 'aim') return traveled > 0;
        d = dist(loc(u), p);
      }
      if (d > 4) break;
    }
    return traveled > 0;
  }
  function nearest(u, array) {
    return array.filter(alive).sort((l, r) => dist(loc(l), loc(u)) - dist(loc(r), loc(u)))[0];
  }
  function threats(p, r = 780) {
    return b.units.filter(v => alive(v) && v.side === 1 && !v.honroObjectiveTarget && dist(loc(v), p) < r);
  }
  function firingSite(u, who, nearby = 580) {
    const bad = b.units.filter(x => alive(x) && x.id !== u.id && (x.side === 0 || x.honroAlly || x.honroObjectiveTarget)), gt = loc(who), rt = loc(u);
    let best = null;
    const choices = [ rt ];
    for (const radius of [ nearby, nearby * .65, nearby * 1.45 ]) for (let i = 0; i < 14; i++) {
      const a = i * Math.PI / 7;
      choices.push({
        x: gt.x + radius * Math.cos(a),
        y: gt.y + radius * Math.sin(a)
      });
    }
    for (const point of choices) {
      if (dist(point, gt) > nearby * 1.52 || !t.legal(point, u.r) || bad.some(q => dist(loc(q), point) < 110)) continue;
      const copy = {
        ...u,
        x: point.x,
        y: point.y + u.h * .5
      }, from = e.damageAim(copy), to = e.damageAim(who);
      const h = e.collision(from, to, 3, u.id, [], true, [], true, true, HONRO_CORE.SKILLS[u.loadout[0]]);
      if (h?.unit?.id !== who.id) continue;
      const cost = dist(rt, point) + Math.max(0, nearby * .45 - dist(point, gt)) * .8;
      if (!best || cost < best.cost) best = {
        point: point,
        cost: cost
      };
    }
    return best?.point;
  }
  function approach() {
    const u = e.active, at = loc(u), car = unit('objective'), boss = unit('boss');
    let dest, preferred, inter, reason;
    let clearBierRoad = false;
    if (st === 2) {
      const dangers = threats(loc(car), 750);
      const hostile = nearest(car, dangers);
      dest = hostile ? loc(hostile) : t.map.convoy[Math.min((car.tvConvoyStep || 0) + 1, t.map.convoy.length - 1)];
      if (hostile) preferred = hostile;
      reason = '운구로 엄호';
    } else if (st === 3) {
      inter = marker('ledger');
      dest = inter.collected ? null : inter;
      reason = '장부';
    } else if (st === 4) {
      dest = dist(at, loc(car)) > 460 ? loc(car) : null;
      preferred = nearest(car, threats(loc(car), 1700));
      reason = '피란문';
    } else if (st === 5) {
      if (u.cls === 'mage') {
        inter = marker('receiver-5');
        dest = hs.ritual?.active ? null : inter;
      } else {
        dest = {
          x: goal('upperShot').x + 120,
          y: goal('upperShot').y - 180
        };
        if (hs.ritual?.active) preferred = unit('cliff-cleat');
      }
      reason = '낙수';
    } else if (st === 6) {
      const mid = unit('midboss-stage6');
      dest = !hs.rescued ? loc(car) : alive(mid) ? loc(mid) : goal('exit');
      preferred = alive(mid) ? mid : undefined;
      reason = '부상자';
      if (hs.rescued && !alive(mid) && dist(at, loc(car)) > 1050) dest = loc(car);
    } else if (st === 7) {
      inter = b.honroMarkers.find(m => m.action === 'rescue' && !m.collected);
      if (inter) {
        dest = loc(unit(inter.target));
        preferred = nearest(u, HonroObjectives.rescueGuards(b, inter));
      }
      reason = '주민';
    } else if (st === 8) {
      preferred = b.honroQuestTargets.filter(q => q.honroSeal && !q.broken).map(q => unit(q.id)).sort((p, q) => dist(at, loc(p)) - dist(at, loc(q)))[0] || boss;
      dest = loc(preferred);
      const memory = hs.stage8Bier;
      clearBierRoad = !!window.clearBierApproach && preferred === boss && !memory?.completedOnce;
      if (clearBierRoad) {
        const obstruction = (memory?.blockers || []).map(blocker => unit(blocker.id)).find(q => alive(q) && q.side === 1 && q.id !== 'boss');
        preferred = obstruction;
        dest = obstruction ? loc(obstruction) : goal('knotEast');
        if (!obstruction) dest = {x:dest.x - 280, y:dest.y - 180};
      }
      reason = '빈 상여';
    } else if (st === 9) {
      inter = b.honroMarkers.find(m => m.action === 'receiver' && !m.collected);
      dest = inter;
      reason = '받이진';
    } else if (st === 10) {
      if (HonroSodanWithdrawal.ready(b)) dest = goal('exit'); else if (!hs.sodanCoop) {
        preferred = unit('sodan-binding');
        dest = loc(preferred);
      } else {
        preferred = nearest(boss, threats(loc(boss), 1800));
        dest = dist(at, loc(boss)) > 430 ? loc(boss) : null;
      }
      reason = '주박/외문';
    }
    if (dest) {
      let move = {
        x: dest.x,
        y: dest.y
      };
      if (preferred && dest.x === preferred.x && !inter && u.cls !== 'knight') {
        const far = dist(at, move);
        if (far < 560) move = at; else if (far > 0) {
          move = {
            x: move.x + (at.x - move.x) / far * 340,
            y: move.y + (at.y - move.y) / far * 340
          };
        }
      }
      if (inter) {
        const shift = u.cls === 'archer' ? [ -70, -32 ] : u.cls === 'mage' ? [ 70, 32 ] : [ 0, 63 ];
        move = {
          x: move.x + shift[0],
          y: move.y - u.h / 4 + shift[1]
        };
      }
      if (st === 7 && preferred) move = firingSite(u, preferred, u.cls === 'knight' ? 150 : 500) || move;
      if ((st === 8 || st === 10) && preferred && alive(preferred)) move = firingSite(u, preferred, u.cls === 'knight' ? 150 : 560) || move;
      go(u, move);
    }
    if (a.dialogue || !e.canAct() || !a.canInput()) return;
    if (inter && !inter.collected && HonroInteractions.eligibility(a, inter).ok && HonroInteractions.use(a, inter)) {
      trace.decisions.push([ b.round, u.id, inter.id ]);
      return;
    }
    const targets = [ ...alive(preferred) ? [ preferred ] : [], ...threats(loc(u), 1850).sort((x, y) => dist(loc(x), loc(u)) - dist(loc(y), loc(u))) ];
    const skills = u.loadout.map(key => HONRO_CORE.SKILLS[key]).filter(s => s && !s.passive && e.skillAllowed(s, u) && e.canAfford(s, u, 1));
    let best = null;
    for (const target of [ ...new Set(targets) ].slice(0, 5)) {
      const fr = e.damageAim(u), to = e.damageAim(target), ang = Math.atan2(fr.y - to.y, to.x - fr.x) * 180 / Math.PI;
      for (const skill of skills) {
        for (const delta of [ 0, 1.4, -1.4 ]) {
          const p = e.predict(u, skill, ang + delta, 1, target, false), hit = unit(p.unit);
          if (hit?.side === 0 || hit?.honroAlly || hit?.id === 'objective' || !hit) continue;
          if (st === 10 && hit.id === 'boss' && !hs.sodanCoop) continue;
          if (st === 8 && hit.id === 'boss' && (clearBierRoad || b.honroQuestTargets.some(t => t.honroSeal && !t.broken))) continue;
          const score = (hit === preferred ? 300 : 0) + 100 + (1 - hit.hp / hit.maxHp) * 40 + (skill.basic ? 1 : 3) - dist(loc(hit), loc(u)) * .02;
          if (!best || score > best.score) best = {
            score: score,
            ang: ang + delta,
            skill: skill,
            target: hit
          };
          if (hit === target) break;
        }
      }
    }
    if (!best && u.cls === 'knight' && alive(preferred) && dist(loc(u), loc(preferred)) < 240) {
      const from = e.damageAim(u), to = e.damageAim(preferred), ang = Math.atan2(from.y - to.y, to.x - from.x) * 180 / Math.PI;
      const skill = skills.find(s => s.id === 'S00');
      if (skill) best = {
        ang: ang,
        skill: skill,
        target: preferred
      };
    }
    if (best && e.fire(best.skill.id, best.ang, 1)) {
      trace.decisions.push([ b.round, u.id, best.skill.id, best.target.id ]);
      return;
    }
    a.defend();
    trace.decisions.push([ b.round, u.id, 'defend', reason ]);
  }
  let s = 0;
  const start = performance.now();
  while (s++ < 550 && performance.now() - start < 280) {
    if (a.dialogue) {
      skip();
      if (a.dialogue) break;
    }
    if (a.modal.classList.contains('open') || a.done || a.screen !== 'battle' || [ 'won', 'lost' ].includes(b.phase)) {
      if ([ 'won', 'lost' ].includes(b.phase) && !a.done && !a.dialogue) a.outcome();
      break;
    }
    if (HonroSodanWithdrawal.frame(a, 1 / 120)) continue;
    if (HonroStory.turnPaused(a)) break;
    if (e.canAct() && a.canInput() && st === 10 && HonroSodanWithdrawal.ready(b) && alive(unit('boss')) && !HonroTopview.atExit(b, unit('boss'), goal('exit'))) {
      // Keep the current hero's turn open to escort the channeler while she walks.
      // Passing immediately would hand every step along this road to the enemy.
      go(e.active, goal('exit'));
      e.tick(1 / 60);
      a.missionTick(1 / 60);
      continue;
    }
    if (e.canAct() && a.canInput()) {
      const before = b.shot;
      approach();
      if (a.dialogue) continue;
      if (e.canAct() && a.canInput() && before === b.shot && e.active?.retreat) a.defend();
    }
    e.planningBudget(5);
    e.tick(1 / 120);
    if (!a.dialogue) a.missionTick(1 / 120);
    e.planningBudget();
  }
  return {
    st: st,
    round: b.round,
    phase: b.phase,
    screen: a.screen,
    done: a.done,
    notice: a.dialogue?.title,
    modal: a.modalKind,
    reason: b.winnerReason,
    cast: b.units.length,
    active: b.active,
    bier: st === 8 ? {
      state: hs.stage8Bier?.status,
      entries: Object.keys(hs.stage8Bier?.entries || {}),
      warnings: Object.keys(hs.stage8Bier?.warnings || {}),
      blockers: hs.stage8Bier?.blockers?.map(x => x.id)
    } : undefined,
    escort: st === 10 ? {
      hp: unit('boss').hp,
      range: Math.round(dist(loc(unit('boss')), goal('exit'))),
      phase: hs.sodanWithdrawal?.phase,
      hold: hs.coopHold
    } : undefined,
    car: unit('objective') && [ Math.round(unit('objective').x), Math.round(unit('objective').y), unit('objective').hp, unit('objective').tvConvoyStep ],
    heroes: e.heroesAlive().map(h => [ h.id, Math.round(h.hp), Math.round(h.x), Math.round(h.y) ]),
    objectives: st === 7 ? b.honroMarkers.filter(m => m.action === 'rescue').map(m => [ m.id, m.collected, unit(m.target).hp, HonroObjectives.rescueGuards(b, m).map(v => v.id) ]) : undefined,
    out: trace.decisions.slice(-2),
    actions: trace.decisions.length,
    flags: Object.keys(hs.flags).filter(k => k.startsWith('event:'))
  };
};
