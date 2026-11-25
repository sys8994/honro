"""Measure real controls at selected steep edges of the exterior chapters."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

import browser as base
from cold_resume import storage_hash
from exterior_audit import capture, open_stage
from mobile_seams import POINTER_EVENTS, move
from second_pass import FOOT, sample_walk


def movement(ctx, page, mobile, goal):
    before = page.evaluate(FOOT)
    direction = 1 if goal > before['x'] else -1
    if mobile:
        move(ctx, page, direction, '([goal,dir])=>(HonroApp.engine.active.x-goal)*dir>=0',
             [goal, direction], timeout=8500)
    else:
        sample_walk(page, direction, goal, 6000)
    page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)', timeout=6500)
    after = page.evaluate(FOOT)
    assert abs(after['x'] - goal) <= 95, (before, goal, after)
    return after


def route(browser, args, stage, mobile):
    label = f'{stage}-' + ('touch' if mobile else 'pc')
    evidence = {'stage': stage, 'interface': 'touch' if mobile else 'keyboard', 'status': 'FAIL', 'errors': []}
    context, page = open_stage(browser, stage, mobile)
    page.on('pageerror', lambda exc: evidence['errors'].append(str(exc)))
    try:
        storage = storage_hash(base.saved_bytes(page))
        page.evaluate(POINTER_EVENTS)
        evidence['entry'] = page.evaluate(FOOT)
        if stage == 55:
            before = movement(context, page, mobile, 1270)
            assert before['support'] == 'west-ring-descent', before
            if mobile:
                page.locator('#jump').tap(timeout=5000)
            else:
                page.keyboard.press('Control')
            page.wait_for_function('y=>HonroApp.engine.active.y<y-35', arg=before['y'], timeout=4000)
            evidence['lift'] = page.evaluate(FOOT)
            after = movement(context, page, mobile, 1490)
            assert after['support'] == 'arrival-core-terrace' and after['y'] - before['y'] > 30, after
        else:
            left, right, support = {
                51: (1010, 1280, 'mountain-main'),
                59: (1465, 1700, 'finale-cutout-west-terrace'),
                60: (5890, 6185, 'return-cutout-near-body'),
            }[stage]
            before = movement(context, page, mobile, left)
            after = movement(context, page, mobile, right)
            assert before['support'] == after['support'] == support and abs(after['y'] - before['y']) >= 65
            if stage == 59:
                evidence['climbedBack'] = movement(context, page, mobile, 1505)
                assert evidence['climbedBack']['support'] == support and evidence['climbedBack']['y'] < after['y']
        evidence.update(before=before, after=after, storageUnchanged=storage == storage_hash(base.saved_bytes(page)))
        evidence['frame'] = capture(page, args.out, label, {
            'x': (before['x'] + after['x']) / 2, 'y': (before['y'] + after['y']) / 2 - 100,
            'scale': .82 if mobile else .90})
        evidence['touches'] = page.evaluate('window.seamTouches??[]')
        if mobile:
            assert len(evidence['touches']) >= 4 and all(e['trusted'] and e['type'] == 'touch'
                                                          for e in evidence['touches'])
        assert evidence['storageUnchanged'] and not evidence['errors']
        evidence['status'] = 'PASS'
    except Exception as error:
        evidence.update(error=str(error), last=page.evaluate(FOOT))
        page.screenshot(path=args.out / f'{label}-failure.png')
    finally:
        context.close()
    return label, evidence


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--stages', type=int, nargs='+', choices=(51, 55, 59, 60), default=[51, 55, 59, 60])
    opts = parser.parse_args()
    base.ROOT = opts.build.resolve()
    opts.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        with playwright.chromium.launch(executable_path='/usr/bin/chromium',
                                        args=['--no-sandbox', '--disable-dev-shm-usage']) as chromium:
            for part in opts.stages:
                for touch in (False, True):
                    tag, result = route(chromium, opts, part, touch)
                    (opts.out / f'{tag}.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
                    print(tag, result['status'], result.get('error', ''), flush=True)
