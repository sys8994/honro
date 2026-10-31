#!/usr/bin/env python3
"""Summarize observed shots and HP deltas from retained raw snapshots; no predictions."""
import argparse,json,hashlib
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('run');ap.add_argument('--output',required=True);args=ap.parse_args();root=Path(args.run);events=root/'events.jsonl';seen={};last_hp={};last_input=None;rows=[]
for line in events.open(encoding='utf8'):
 e=json.loads(line)
 if 'input' in e:last_input=e['input']
 if 'snapshot' not in e or 'sha256' not in e:continue
 path=root/(e['sha256']+'.json')
 if not path.exists():continue
 b=json.loads(path.read_text()).get('honroBattle') or {};units=b.get('units',[])
 hp={u['id']:u.get('hp') for u in units};delta={k:round(hp[k]-v,3) for k,v in last_hp.items() if k in hp and hp[k] is not None and v is not None and hp[k]!=v}
 for actor,shot in (b.get('lastShots') or {}).items():
  if actor not in ('archer','mage','knight','occultist'):continue
  clean={k:shot.get(k) for k in ('skill','angle','power','wind')}
  if clean!=seen.get(actor):
   rows.append({'type':'observed-shot','round':b.get('round'),'actor':actor,'actual':clean,'lastInputAtSnapshot':last_input,'snapshot':e['sha256'],'time':e['time'],'plannedAnglePower':'not logged; no numeric plan claimed'})
   seen[actor]=clean
 if delta:rows.append({'type':'hp-delta-since-previous-snapshot','round':b.get('round'),'delta':delta,'lastInputAtSnapshot':last_input,'snapshot':e['sha256'],'time':e['time'],'attribution':'not inferred'})
 last_hp=hp
out={'scope':'observed raw storage snapshots; HP deltas are not automatically attributed to shots','sourceLogSha256':hashlib.sha256(events.read_bytes()).hexdigest(),'rows':rows};Path(args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('rows',len(rows))
