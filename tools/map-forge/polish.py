"""Rebuild the Stage 1–2 granite palette and fracture marks without touching collision."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATH = ROOT / 'shared/data/campaign.json'
data = json.loads(PATH.read_text(encoding='utf-8'))
for asset in data['library']:
    if not asset['id'].startswith('mockup-granite-'):
        continue
    body, face, side = asset['visual'][:3]
    body.update(fill='#303c37', stroke='#182a2b')
    face.update(fill='#526158', stroke='#384940')
    side.update(fill='#3d4a42')
    points = body['points']
    left, right = min(p['x'] for p in points), max(p['x'] for p in points)
    top, bottom = min(p['y'] for p in points), max(p['y'] for p in points)
    x = lambda t: round(left + (right - left) * t, 3)
    y = lambda t: round(top + (bottom - top) * t, 3)
    asset['visual'] = [body, face, side,
        {'type': 'polyline', 'closed': False, 'points': [
            {'x': x(.32), 'y': y(.18)}, {'x': x(.41), 'y': y(.41)},
            {'x': x(.38), 'y': y(.60)}, {'x': x(.47), 'y': y(.78)}],
         'fill': None, 'stroke': '#182a2b99', 'lineWidth': 1.7, 'alpha': 1},
        {'type': 'polyline', 'closed': False, 'points': [
            {'x': x(.67), 'y': y(.30)}, {'x': x(.60), 'y': y(.48)},
            {'x': x(.66), 'y': y(.57)}],
         'fill': None, 'stroke': '#a0a9975a', 'lineWidth': 1.3, 'alpha': 1}]

# The finale's low altar belongs on the terrain's prop layer so it remains
# visible at the characters' feet. It has no collision or interaction.
for stage in data['stages']:
    for element in stage['elements']:
        if element.get('kind') == 'ritualDais':
            element['layer'] = 'prop'

PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
