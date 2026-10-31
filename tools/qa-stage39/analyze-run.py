"""Convert a recorded event JSONL into an observed per-hero round table.
Positions and movement remaining are samples, not a complete continuous path.
"""
import sys,json,collections
rows=collections.OrderedDict()
for line in open(sys.argv[1],encoding='utf8'):
 z=json.loads(line);s=z['state'];a=s.get('active');r=s.get('round')
 if a not in ('archer','mage','knight','occultist') or s.get('side')!=0:continue
 key=(r,a);q=rows.setdefault(key,{'first':s,'last':s,'shots':[],'events':[]});q['last']=s
 if z['kind']=='fired':
  c=z.get('choice') or {};q['shots'].append(f"{c.get('id')}→{c.get('target')} (hit {c.get('hit') or 'area'})")
 if z['kind'] in ('walk','route-east','drop','jump','route-jump','landing-check','retreat-advance','artillery-evasion','defend-no-shot','defend-low-health'):q['events'].append(z['kind'])
print('| 턴 | 영웅 | 처음 → 마지막 x,y | 처음 → 마지막 지지면 | 잔여 이동 시작 → 마지막 | 발사 목표 | 이동·방어 기록 |')
print('|---:|---|---|---|---|---|---|')
for (r,a),q in rows.items():
 f,l=q['first'],q['last'];xy=lambda x:f"{round(x.get('x') or 0)},{round(x.get('y') or 0)}";move=lambda x:str(round(x.get('moveLeft') or 0));ev=collections.Counter(q['events']);evs=', '.join(f'{k}×{v}' for k,v in ev.items()) or '—';shots=', '.join(q['shots']) or '—'
 print(f"| {r} | {a} | {xy(f)} → {xy(l)} | {f.get('support') or '공중'} → {l.get('support') or '공중'} | {move(f)} → {move(l)} | {shots} | {evs} |")
