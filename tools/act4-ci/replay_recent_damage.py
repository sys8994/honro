"""Read original normal saves and check QA memory; no browser or game inputs.

Usage: python tools/act4-ci/replay_recent_damage.py PATH_TO_STAGE31_ARTIFACT
The emitted report is offline decision evidence, not gameplay completion.
"""
import hashlib
import json
import lzma
from pathlib import Path
import sys
from recent_damage import RecentIncomingDamage


def replay(root):
    events = [json.loads(line) for line in (root / 'tactical-v8-events.jsonl').read_text().splitlines()]
    records = [event['storageSnapshot'] for event in events if event.get('storageSnapshot', {}).get('ok')]
    memory, verified, readings = RecentIncomingDamage(), [], []
    for record in records:
        name = Path(record['path']).name
        raw = lzma.decompress((root / 'storage-snapshots' / (name + '.xz')).read_bytes())
        sha = hashlib.sha256(raw).hexdigest()
        assert sha == record['sha256'], name
        assert len(raw) == record['bytes'], name
        profile = json.loads(raw)
        battle = profile['honroBattle']
        verified.append({'file': name, 'sha256': sha, 'bytes': len(raw)})
        # Mid-enemy saves are not complete response observations. Normal profile
        # saves can lag the accompanying screen, so use their own serial/HP.
        if battle['side'] != 0:
            continue
        health = [u for u in battle['units'] if u['side'] == 0 and not u.get('summoned')]
        peaks = memory.observe(battle['teamEnds'][1], health)
        readings.append({'file': name, 'round': battle['round'], 'enemyTeamEnds': battle['teamEnds'][1],
                         'phase': battle['phase'], 'active': battle['active'],
                         'heroes': {u['id']: {'hp': u['hp'], 'maxHp': u['maxHp'], 'shield': u.get('shield', 0),
                                    'observedDamage': peaks[u['id']],
                                    'critical': u['hp'] + u.get('shield', 0) <= max(u['maxHp'] * .35, peaks[u['id']] * 1.35)} for u in health}})
    chosen = {r['file']: r for r in readings if r['file'] in ['0014.json', '0028.json', '0074.json']}
    assert len(chosen) == 3, 'Expected original run41746180178 checkpoints'
    assert chosen['0014.json']['heroes']['occultist']['observedDamage'] == 930
    assert chosen['0014.json']['heroes']['occultist']['critical']
    assert chosen['0028.json']['heroes']['occultist']['observedDamage'] == 0
    assert not chosen['0028.json']['heroes']['occultist']['critical']
    assert chosen['0074.json']['heroes']['mage']['observedDamage'] == 0
    assert not chosen['0074.json']['heroes']['mage']['critical']
    return {'passed': True, 'scope': 'Offline read-only QA memory replay, not live Continue or gameplay completion',
            'sourceRun': 41746180178, 'verifiedOriginalSaves': verified, 'checkpoints': list(chosen.values()),
            'observations': readings}


if __name__ == '__main__':
    print(json.dumps(replay(Path(sys.argv[1])), indent=2))
