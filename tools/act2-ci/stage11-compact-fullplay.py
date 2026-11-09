"""Stage11 compact production-browser normal-input driver.

Run ONLY against the parent-provided preview URL/id. A fresh Chromium context
owns its own localStorage. One declared prelaunch setup creates a synthetic
through-10 profile, prepares level12 through real camp APIs, then App.launch(11).
After launch evaluate is guarded read-only; all play uses keyboard/mouse UI.
This is agent automation, not human play or a natural campaign completion.
"""
import argparse
import hashlib
import json
import lzma
from pathlib import Path
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/act4-ci'))
from precise_aim import aim_with_joystick

SETUP = r"""async seed => {
 const a=HonroApp,C=HONRO_CORE;
 if(a.engine)throw Error('Prelaunch setup requires no existing battle');
 await HonroCampaignLoader.ensureStage(11);
 const p=HonroProfileStore.fresh();p.cleared??={};
 for(let i=1;i<=10;i++)p.cleared[i]={visits:1,rounds:5};
 p.recruited=HonroStageRules.stageParty(11);p.party=[...p.recruited];p.lastStage=11;p.settings.debugMode=false;
 const allocations={archer:{AP04:1,AP02:2,AP01:2,AP03:1,A14:1,A02:4,A11:1,A09:4,A05:4},mage:{M07:1,M10:4,M03:3,M11:3,MP01:3,MP02:2,MP04:2,MP03:1},knight:{S03:4,S05:3,S01:1,S09:3,SP01:3,SP02:3,SP04:2},occultist:{O07:1,O08:3,O02:4,O11:3,OP01:3,OP02:2,OP03:2,OP04:1}};
 const training=[];
 for(const cls of p.recruited){const h=p.heroes[cls];h.xp=HonroProgression.xpAt(HonroProgression.plan(11).entryLevel);
  for(const[id,rank]of Object.entries(allocations[cls]))while((h.ranks[id]||0)<rank){if(!C.train(h,id))throw Error(cls+'/'+id+': '+C.trainReason(h,id));training.push({cls,id});}
  let count=0;while(C.pointsLeft(h,cls)>0){if(++count>1000||!C.investStat(h,cls))throw Error('Camp stat allocation failed');}
 }
 p.loadouts={...p.loadouts,archer:['A01','A02','A09','A05'],mage:['M01','M10','M03','M11'],knight:['S00','S03','S05','S09'],occultist:['O01','O02','O08','O11']};
 for(const cls of p.recruited){C.sanitizeLoadout(p,cls);if(C.pointsSpent(p.heroes[cls],cls)!==C.pointsEarned(p.heroes[cls]))throw Error('Unspent/invalid camp points');}
 if(p.honroBattle||p.cleared[11])throw Error('Entry fixture already contains stage11 progress');
 const prepared=JSON.parse(JSON.stringify(p));a.debugMode=false;a.profile=p;a.normalProfile=p;a.stageId=11;
 if(!a.persist())throw Error('Fresh isolated profile could not be saved');
 a.launch(11);
 return{prepared,training,seedLabel:seed,seedHandling:'No PRNG is replaced and Engine seed/rng are never assigned; observe canonical UI entry RNG',scope:'synthetic through-10 level12 camp-prepared entry; not campaign-earned growth'};
}"""


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--url', required=True)
    ap.add_argument('--preview-id', required=True, help='Parent-provided preview/source identity; recorded verbatim')
    ap.add_argument('--html-sha256', help='If provided, require exact served HTML bytes before launch')
    ap.add_argument('--run-dir', required=True)
    ap.add_argument('--seed', type=int, default=38612, help='Run label only; canonical Game RNG is observed, never changed')
    ap.add_argument('--strategy', choices=['cohesive', 'flank', 'advance-fire'], default='cohesive')
    ap.add_argument('--round-limit', type=int, default=20)
    ap.add_argument('--time-limit', type=int, default=1800)
    ap.add_argument('--headed', action='store_true')
    ap.add_argument('--allow-visible-items', action='store_true', help='Opt-in only when an actual Game item UI exists; no direct Engine.item')
    ap.add_argument('--entry-only', action='store_true', help='Entry diagnostic only; cannot pass full play')
    args = ap.parse_args()
    out = Path(args.run_dir)
    out.mkdir(parents=True, exist_ok=False)
    snapshots = out / 'storage-snapshots'
    snapshots.mkdir()
    observer = (ROOT / 'tools/act2-ci/stage11-compact-observe.js').read_text(encoding='utf-8')
    base_planner = (ROOT / 'tools/act4-ci/normal-shot-plan.js').read_text(encoding='utf-8')
    # Adapter changes only the candidate set in a local read-only function.
    # Never replace battle units or engine skills to filter a planner.
    old = 'const visible = b.units.filter(v => v.side === 1 && !v.dead && inView(v));'
    new = 'const visible = b.units.filter(v => v.side === 1 && !v.dead && inView(v) && query.ids.includes(v.id));'
    assert base_planner.count(old) == 1
    planner = 'query => {const search=(' + base_planner.replace(old, new).replace('!skill || skill.passive', '!skill || !(skill.damage > 0) || skill.passive') + ');return search(query.onlyFacing);}'
    result = {'passed': False, 'complete': False, 'releaseApproved': False,
              'scope': 'agent-driven real Chromium normal UI inputs from declared synthetic level12 entry; not human play',
              'previewId': args.preview_id, 'url': args.url, 'strategy': args.strategy,
              'seedLabel': args.seed, 'seedHandling': 'canonical Game RNG observed; no Math.random/Engine RNG replacement', 'limits': {'round': args.round_limit, 'seconds': args.time_limit},
              'itemPolicy': 'actual UI clicks only if --allow-visible-items; default excludes inventory and uses normal equipped skills',
              'errors': [], 'controllerFailures': [], 'navigationDiagnostics': [], 'entryDiagnosticPassed': False,
              'inputContract': {'prelaunch': 'one SETUP evaluate; fresh synthetic profile, real camp API training and App.launch(11)',
                                'afterLaunch': 'guarded read-only evaluate; keyboard/mouse UI commands only',
                                'forbidden': ['Engine.fire/item/move/jump/wait/select direct commands', 'actor/battle/profile writes', 'teleport/refill/enemy deletion/completion flags'],
                                'humanPlay': False}}
    for name in ['stage11-compact-fullplay.py', 'stage11-compact-observe.js']:
        data = (ROOT / 'tools/act2-ci' / name).read_bytes()
        (out / name).write_bytes(data)
        result[name + 'Sha256'] = hashlib.sha256(data).hexdigest()
    result['reusedHelpers'] = {n: hashlib.sha256((ROOT / 'tools/act4-ci' / n).read_bytes()).hexdigest()
                               for n in ['precise_aim.py', 'normal-shot-plan.js']}
    events = (out / 'events.jsonl').open('x', encoding='utf-8')
    count = 0
    started = time.monotonic()
    try:
        with sync_playwright() as w:
            browser = w.chromium.launch(headless=not args.headed)
            context = browser.new_context(viewport={'width': 1440, 'height': 900})
            p = context.new_page()
            p.on('pageerror', lambda error: result['errors'].append(str(error)))
            response = context.request.get(args.url)
            assert response.ok, response.status
            html = response.body()
            result['htmlSha256'] = hashlib.sha256(html).hexdigest()
            (out / 'preview.html').write_bytes(html)
            if args.html_sha256:
                assert result['htmlSha256'] == args.html_sha256, 'Preview HTML SHA mismatch'
            p.goto(args.url, wait_until='domcontentloaded')
            p.wait_for_function('window.HonroApp && window.HonroCampaignLoader', timeout=60000)
            # The only permitted live state-writing evaluate, before battle.
            setup = p.evaluate(SETUP, args.seed)
            (out / 'entry-setup.json').write_text(json.dumps(setup, ensure_ascii=False, indent=2), encoding='utf-8')
            p.wait_for_function('HonroApp.engine?.b?.honroStage===11', timeout=60000)

            def read(function, argument=None):
                return p.evaluate('''arg=>{const before=JSON.stringify({battle:HonroApp.engine.b,profile:HonroApp.profile});const answer=(''' + function + ''')(arg);if(JSON.stringify({battle:HonroApp.engine.b,profile:HonroApp.profile})!==before)throw Error('QA read mutated battle/profile');return answer;}''', argument)

            def query(mode='state', **kw):
                return read(observer, {'mode': mode, 'strategy': args.strategy, **kw})

            def state():
                return query()

            def record(step, **extra):
                nonlocal count
                count += 1
                row = {'step': step, 'seq': count, 'time': time.time(), 'state': state(), **extra}
                if step in ['entry', 'final'] or step.startswith(('shot-', 'item-', 'interaction-')):
                    raw = read('()=>localStorage.getItem("honro-first-act-profile-1")')
                    if raw is not None:
                        data = raw.encode('utf-8')
                        path = snapshots / f'{count:04d}.json.xz'
                        path.write_bytes(lzma.compress(data))
                        row['storageSnapshot'] = {'file': str(path), 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
                events.write(json.dumps(row, ensure_ascii=False) + '\n')
                events.flush()
                print(json.dumps({'step': step, 'round': row['state']['round'], 'goal': row['state'].get('goal'), 'enemies': row['state']['enemies']}, ensure_ascii=False), flush=True)
                return row

            def ready():
                for _ in range(160):
                    s = state()
                    if s['phase'] in ['won', 'lost']:
                        return False
                    if s['dialogue']:
                        record('dialogue-visible', body=p.locator('body').inner_text()[:3000])
                        p.wait_for_timeout(350)
                        p.keyboard.press('Enter')
                    elif s['modal']:
                        raise RuntimeError('Unexpected modal blocks normal UI; not dismissed by state write')
                    elif s['can'] and s['side'] == 0 and s['phase'] == 'aim' and s['grounded']:
                        return True
                    p.wait_for_timeout(300)
                raise TimeoutError('Normal App did not reach actionable ground state')

            def pulse(direction, milliseconds):
                key = 'ArrowRight' if direction > 0 else 'ArrowLeft'
                p.keyboard.down(key)
                try:
                    p.wait_for_timeout(milliseconds)
                finally:
                    p.keyboard.up(key)

            def fine_walk(dx):
                # Same normal joystick gesture as aiming, horizontally latched
                # into moveAim. Lower axis magnitude avoids keyboard latency
                # overshooting the closely spaced authored graph samples.
                box = p.locator('#joystick').bounding_box()
                if not box:
                    raise RuntimeError('Normal movement joystick unavailable')
                x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
                radius = min(box['width'], box['height']) * .41
                direction = 1 if dx > 0 else -1
                speed = min(.45, max(.035, abs(dx) / 220))
                duration = max(35, min(150, abs(dx) / speed * .55))
                p.mouse.move(x, y)
                p.mouse.down()
                try:
                    p.mouse.move(x + direction * (max(.18 * radius, 8) + 1), y)
                    # Horizontal movement has its own 0.10 hysteresis and
                    # exponent1.1; the vertical aiming swipe curve differs.
                    p.mouse.move(x + direction * radius * (.10 + .90 * speed ** (1 / 1.1)), y)
                    p.wait_for_timeout(duration)
                finally:
                    p.mouse.move(x, y)
                    p.mouse.up()

            # External controller memory only. Preserve the model's authored
            # route/index across input pulses and support changes; no game
            # object/global receives this cache or an injected nav receipt.
            navigation_cache = {}

            def navigation():
                info = query('navigation', summaryOnly=True)
                if info.get('blocked') or not info.get('goal'):
                    return info
                s, goal = info['state'], info['goal']
                cached = navigation_cache.get(s['active'])
                changed = (cached is None or cached['goal'].get('id') != goal.get('id')
                           or ((cached['goal']['x'] - goal['x']) ** 2 + (cached['goal']['y'] - goal['y']) ** 2) ** .5 > 180
                           or cached['enemy'] != info['enemy']
                           or cached['index'] >= len(cached['links']) and (info['enemy'] or not cached['links'] or ((s['x'] - cached['links'][-1]['point']['x']) ** 2 + (s['y'] - cached['links'][-1]['point']['y']) ** 2) ** .5 > 70))
                if changed:
                    full = query('navigation')
                    if full.get('blocked'):
                        return full
                    cached = {'goal': goal, 'enemy': info['enemy'], 'links': full['links'], 'index': 0}
                    navigation_cache[s['active']] = cached
                links = cached['links']
                while cached['index'] < len(links):
                    link = links[cached['index']]
                    # A jump edge is completed only on its real destination
                    # support. Ordinary edges keep the model's foot tolerance.
                    point = link['point']
                    reached = s['grounded'] and abs(s['x'] - point['x']) < 13 and abs(s['y'] - point['y']) < 35
                    if link.get('jump'):
                        reached = reached and s['support'] == link['jump']['support']
                    if not reached:
                        break
                    cached['index'] += 1
                info.update(next=links[cached['index']] if cached['index'] < len(links) else None,
                            atGoal=cached['index'] >= len(links), routeIndex=cached['index'], routeLinks=len(links))
                return info

            def move_once():
                nav = navigation()
                s = nav['state']
                if not s['can'] or (s.get('moveLeft') or 0) < 15 or s['retreat']:
                    return False
                if nav.get('blocked') or not nav.get('next'):
                    record('navigation-stop', navigation=nav)
                    return False
                link = nav['next']
                point = link['from'] if link.get('jump') else link['point']
                if link.get('jump') and abs(s['x'] - point['x']) < 16 and abs(s['y'] - point['y']) < 40:
                    landing = link['jump']
                    p.keyboard.press('Control')
                    launch_state = state()
                    record('jump-command-observed', accepted=not launch_state['grounded'], destination=landing)
                    if launch_state['grounded']:
                        return False
                    for _ in range(70):
                        q = state()
                        if q['active'] != s['active'] or not q['can']:
                            break
                        dx = landing['x'] - q['x']
                        if abs(dx) > 5:
                            pulse(1 if dx > 0 else -1, 45)
                        else:
                            p.wait_for_timeout(60)
                        q = state()
                        if q['grounded'] and abs(q['x'] - landing['x']) < 35 and q['support'] == landing['support']:
                            break
                    record('jump-input', navigation=nav)
                    return True
                dx = point['x'] - s['x']
                if abs(dx) <= 6:
                    record('navigation-stall', navigation=nav)
                    return False
                fine_walk(dx)
                p.wait_for_timeout(80)
                after = state()
                record('move-input', navigation=nav)
                if abs(after['x'] - s['x']) < 2:
                    result['navigationDiagnostics'].append({'kind': 'route pulse blocked', 'round': s['round'], 'actor': s['active'], 'navigation': nav})
                    if after['grounded'] and after['can'] and (after.get('moveLeft') or 0) > 250 and abs(dx) > 30:
                        # Same ordinary jump-recovery input used by the model
                        # route walker, not an asserted teleport/reachability.
                        p.keyboard.press('Control')
                        launch_state = state()
                        record('jump-recovery-command-observed', accepted=not launch_state['grounded'])
                        if launch_state['grounded']:
                            return False
                        for _ in range(35):
                            q = state()
                            if q['active'] != s['active'] or not q['can']:
                                break
                            if abs(point['x'] - q['x']) > 8:
                                fine_walk(point['x'] - q['x'])
                            else:
                                p.wait_for_timeout(60)
                            q = state()
                            if q['grounded']:
                                break
                        record('jump-recovery-input', navigation=nav)
                        return abs(state()['x'] - s['x']) >= 2
                    return False
                return True

            def plan(only_facing=False):
                s = state()
                return read(planner, {'onlyFacing': only_facing, 'ids': s['targetIds']})

            def fire(choice):
                before = state()
                desired = -1 if choice['angle'] > 90 else 1
                if before['facing'] != desired:
                    pulse(desired, 45)
                    p.wait_for_timeout(150)
                    # Facing input changes position. Replan at the new location.
                    choice = query('utility', allowSummon=args.strategy == 'cohesive') if choice.get('utility') else plan(True)['best']
                    if not choice:
                        return False
                p.keyboard.press('Digit' + str(choice['idx'] + 1))
                p.wait_for_timeout(150)
                aimed = aim_with_joystick(p, choice['angle'], state)
                record('aim-input', choice=choice, aim=aimed)
                if not aimed['passed']:
                    raise RuntimeError('Normal joystick failed to converge without movement/context change')
                aligned = state()
                safe = query('utility', angle=aligned['angle'], allowSummon=args.strategy == 'cohesive') if choice.get('utility') else query('safe-shot', choice=choice)
                if not safe:
                    record('shot-envelope-rejected', choice=choice)
                    return False
                before = state()
                p.keyboard.down('Space')
                try:
                    p.wait_for_function('HonroApp.charging && HonroApp.chargePower(performance.now())>=1', timeout=8000, polling=16)
                finally:
                    p.keyboard.up('Space')
                p.wait_for_timeout(120)
                launch = read('id=>({shots:HonroApp.engine.b.shots,last:HonroApp.engine.b.lastShots?.[id]})', before['active'])
                record('shot-input', choice=choice, actual=launch)
                if launch['shots'] != before['shots'] + 1 or not launch['last'] or launch['last']['skill'] != choice['id'] or abs(launch['last']['power'] - 1) > 1e-9 or abs(launch['last']['angle'] - aligned['angle']) > .1:
                    raise RuntimeError('Actual normal-input launch did not match selected skill/angle/full charge')
                p.wait_for_timeout(500)
                return True

            entry = state()
            assert entry['width'] == 6200 and entry['height'] == 3200 and entry['compactRevision'] == 1
            assert entry['enemies'] == 17 and len(entry['health']) == 4, 'Expected current compact17+3 candidate'
            assert entry['round'] == 1 and not entry['done'] and all(h['level'] == 12 for h in entry['health'])
            source = query('source')
            data = json.dumps(source, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
            (out / 'entry-source.json.xz').write_bytes(lzma.compress(data))
            result['entrySourceSha256'] = hashlib.sha256(data).hexdigest()
            result['initialEngineSeed'] = entry['seed']
            result['initialEngineRng'] = entry['rng']
            result['browserVersion'] = browser.version
            result['itemUiAtEntry'] = p.locator('[data-action="items"]').count() > 0
            record('entry')
            p.screenshot(path=str(out / 'entry.png'))
            if args.entry_only:
                assert ready(), 'Entry dialogue did not settle into normal UI'
                interacted = False
                for _ in range(35):
                    s = state()
                    if s['goal'] != '11.thread':
                        interacted = bool(s['done'].get('11.thread'))
                        break
                    marker = s.get('marker')
                    if marker and abs(s['x'] - marker['x']) < 170 and abs(s['y'] - marker['y']) < 150:
                        p.keyboard.press('e')
                        p.wait_for_timeout(250)
                        record('interaction-entry-input')
                        ready()
                    elif not move_once():
                        break
                result['entryInputProof'] = {'threadCompletedByNormalInputs': interacted,
                                              'initial': {'x': entry['x'], 'y': entry['y'], 'dialogue': entry['dialogue']},
                                              'after': state()}
                assert interacted, 'Normal movement/E did not finish the entry thread step'
                result['entryDiagnosticPassed'] = not result['errors']
                result['stopReason'] = 'entry diagnostic only; no full-play claim'
            else:
                result['entryDiagnosticPassed'] = True
                for turn in range(200):
                    if time.monotonic() - started > args.time_limit:
                        result['stopReason'] = 'bounded browser wall-clock budget; incomplete'
                        break
                    if not ready():
                        break
                    s = state()
                    if s['round'] > args.round_limit:
                        result['stopReason'] = 'comparison round limit exceeded; incomplete'
                        break
                    if any(h['dead'] for h in s['health']):
                        result['stopReason'] = 'required companion dead'
                        break
                    if s['retreat']:
                        # AP03 post-shot retreat is move/end-only. A second
                        # Space press is correctly rejected by the Game, so
                        # finish this ordinary action through the normal key.
                        record('normal-retreat-end-input')
                        p.keyboard.press('f')
                        p.wait_for_timeout(600)
                        continue
                    hero = next(h for h in s['health'] if h['id'] == s['active'])
                    if args.allow_visible_items and args.strategy == 'cohesive' and hero['hp'] < hero['maxHp'] * .33 and s['items'].get('heal', 0) > 0:
                        button = p.locator('[data-action="items"]')
                        if not button.count():
                            raise RuntimeError('Controller/UI boundary: normal heal-item button absent; Engine.item injection forbidden')
                        button.first.click()
                        p.locator('[data-action="use-item"][data-item="heal"]').click()
                        record('item-input', before=hero)
                        continue
                    # Normal E is tried at the authored marker before movement.
                    if s.get('marker') and abs(s['x'] - s['marker']['x']) < 170 and abs(s['y'] - s['marker']['y']) < 150:
                        p.keyboard.press('e')
                        p.wait_for_timeout(250)
                        after = state()
                        record('interaction-input')
                        if after.get('goal') != s.get('goal') or after['dialogue']:
                            continue
                    # Avoid spending a useful turn sniping optional foes behind
                    # the party. Graph navigation uses mandatory target IDs and
                    # gives gather priority after the required spirits are dead.
                    for _ in range(35):
                        nav = navigation()
                        if nav.get('atGoal') or nav.get('blocked') or not state()['can']:
                            break
                        if nav.get('enemy') and nav['distance'] < {'archer':750,'mage':650,'knight':220,'occultist':650}[s['cls']]:
                            break
                        if not move_once():
                            break
                    if not state()['can'] or state()['active'] != s['active']:
                        continue
                    if not state()['grounded']:
                        if not ready() or state()['active'] != s['active']:
                            continue
                    arrived = state()
                    if arrived.get('marker') and abs(arrived['x'] - arrived['marker']['x']) < 170 and abs(arrived['y'] - arrived['marker']['y']) < 150:
                        p.keyboard.press('e')
                        p.wait_for_timeout(250)
                        after = state()
                        record('interaction-after-move-input')
                        if after.get('goal') != arrived.get('goal') or after['dialogue']:
                            continue
                    if not state()['gather']:
                        utility = query('utility', allowSummon=args.strategy == 'cohesive')
                        if utility and fire(utility):
                            continue
                        assessment = plan()
                        if not assessment['visible'] and state()['targetIds']:
                            # Existing normal camera wheel gesture, never a
                            # scene.x/y/scale assignment or focus method call.
                            box = p.locator('#battlecanvas').bounding_box()
                            if box:
                                p.mouse.move(box['x'] + box['width'] * .5, box['y'] + box['height'] * .45)
                                p.mouse.wheel(0, 800)
                                p.wait_for_timeout(350)
                                record('camera-wheel-input')
                                assessment = plan()
                        choice = assessment['best']
                        if choice and fire(choice):
                            continue
                    record('normal-end-action', turn=turn)
                    p.keyboard.press('f')
                    p.wait_for_timeout(600)
                final = state()
                result['final'] = final
                result['complete'] = final['phase'] == 'won'
                physical = final['physical']
                original_spawns = [v for v in final['enemyUnits'] if v.get('source') in ['reviewed.11.beast-spirit','reviewed.11.north-pair']]
                result['requiredSpawnCounts'] = {k: sum(v.get('source') == k for v in original_spawns) for k in ['reviewed.11.beast-spirit','reviewed.11.north-pair']}
                result['passed'] = bool(result['complete'] and final['round'] <= args.round_limit and final['gathered'] and len(final['health']) == 4 and all(not h['dead'] and h['hp'] > 0 and h['grounded'] for h in final['health']) and all(final['done'].get(k) for k in ['11.thread','11.entry-threat','11.exit-threat','11.exit','11.north']) and physical.get('release',{}).get('distance',0) >= 40 and physical.get('release',{}).get('attached') and any(physical.get('north',{}).get('ended',{}).values()) and result['requiredSpawnCounts'] == {'reviewed.11.beast-spirit':1,'reviewed.11.north-pair':2} and not result['errors'])
            record('final')
            p.screenshot(path=str(out / 'final.png'))
            result['servedResources'] = p.evaluate('()=>performance.getEntriesByType("resource").map(v=>v.name)')
            context.close()
            browser.close()
    except Exception as error:
        result['controllerFailures'].append({'exception': type(error).__name__, 'message': str(error)})
        result['stopReason'] = 'normal-input controller/validation failed; not bypassed'
    finally:
        events.close()
        if result['controllerFailures'] or result['errors']:
            result['passed'] = False
        result['wallSeconds'] = time.monotonic() - started
        (out / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(result, ensure_ascii=False), flush=True)
    return 0 if result['passed'] or args.entry_only and result['entryDiagnosticPassed'] and not result['errors'] and not result['controllerFailures'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
