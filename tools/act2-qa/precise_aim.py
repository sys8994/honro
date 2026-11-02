"""Bounded closed-loop normal pointer input; runtime reads are observation only."""
import time

MAX_ATTEMPTS = 3
TIME_BUDGET = 20
RELEASED = '!HonroApp.stickPointer && HonroApp.stick.x===0 && HonroApp.stick.y===0'
POSITION_KEYS = ('x', 'y', 'moveLeft')
CONTEXT_KEYS = ('active', 'facing', 'round', 'side', 'phase', 'shots',
                'health', 'enemyHpSum', 'enemyUnits', 'dialogue')


def _position_unchanged(before, current):
    return all(abs((current.get(k) or 0) - (before.get(k) or 0)) < .001
               for k in POSITION_KEYS)


def _changed(before, current):
    changed = [k for k in CONTEXT_KEYS if current.get(k) != before.get(k)]
    changed += [k for k in POSITION_KEYS
                if abs((current.get(k) or 0) - (before.get(k) or 0)) >= .001]
    changed += [k for k in ('can', 'grounded') if not current.get(k)]
    return changed


def aim_with_joystick(page, target, state):
    before = state()
    after = before
    box = page.locator('#joystick').bounding_box()
    if not box:
        return {'passed': False, 'reason': 'joystick not visible'}
    x = box['x'] + box['width'] / 2
    y = box['y'] + box['height'] / 2
    radius = .41 * min(box['width'], box['height'])
    samples, attempts = [], []
    context_changes = _changed(before, before)
    positions_unchanged = True
    released = page.evaluate(RELEASED)
    deadline = time.monotonic() + TIME_BUDGET

    def observe():
        nonlocal context_changes, positions_unchanged
        q = state()
        context_changes = sorted(set(context_changes + _changed(before, q)))
        positions_unchanged &= _position_unchanged(before, q)
        return q

    for attempt_index in range(MAX_ATTEMPTS):
        if context_changes or not released or time.monotonic() >= deadline:
            break
        # Recheck before every new gesture; never retry a changed battle context.
        after = observe()
        if context_changes:
            break
        attempt = {'before': after, 'samples': [], 'released': False}
        attempts.append(attempt)
        page.mouse.move(x, y)
        try:
            page.mouse.down()
            delta = target - after['angle']
            if abs(delta) > .04:
                direction = 1 if delta * after['facing'] > 0 else -1
                # Crossing the real gesture start threshold is required to latch
                # aimOnly. Immediately reduce to the measured fine displacement.
                page.mouse.move(x, y - direction * (max(.18 * radius, 8) + 1))
                speed = min(.8 if attempt_index == 0 else .012,
                            max(.004, abs(delta) / 25))
                page.mouse.move(x, y - direction * radius * (.12 + .88 * speed ** (1 / 1.35)))
            for _ in range(500):
                q = observe()
                delta = target - q['angle']
                sample = {k: q.get(k) for k in (*POSITION_KEYS, 'active', 'facing', 'round', 'can', 'grounded')}
                sample.update(angle=q['angle'], delta=delta, contextChanges=list(context_changes), attempt=attempt_index + 1)
                samples.append(sample)
                attempt['samples'].append(sample)
                if context_changes or abs(delta) <= .04 or time.monotonic() >= deadline:
                    break
                # At .004, 62 degrees/sec input is ~.25 degrees/sec: less
                # release-latency drift than the previous .012 floor (~.74).
                speed = min(.8 if attempt_index == 0 else .012,
                            max(.004, abs(delta) / 25))
                direction = 1 if delta * q['facing'] > 0 else -1
                displacement = radius * (.12 + .88 * speed ** (1 / 1.35))
                page.mouse.move(x, y - direction * displacement)
                page.wait_for_timeout(35)
        finally:
            try:
                page.mouse.move(x, y)
            finally:
                page.mouse.up()
        # Two neutral observations make release drift visible. Every observation
        # is compared with the ORIGINAL context, not a rebased retry context.
        after = observe()
        released = page.evaluate(RELEASED)
        attempt['releaseState'] = after
        if not context_changes and released:
            page.wait_for_timeout(100)
            after = observe()
            released = page.evaluate(RELEASED)
        attempt.update(after=after, released=released, contextChanges=list(context_changes))
        if context_changes or not released or abs(after['angle'] - target) <= .1:
            break
        # Only an angle miss may reach the next bounded correction attempt.

    passed = bool(released and not context_changes and positions_unchanged
                  and abs(after['angle'] - target) <= .1)
    return {'passed': passed, 'target': target, 'actual': after['angle'],
            'unchangedPositionAndMovement': positions_unchanged,
            'unchangedContext': not context_changes, 'contextChanges': context_changes,
            'released': released, 'attempts': attempts, 'samples': samples,
            'before': before, 'after': after}
