#!/usr/bin/env python3
"""Derive an isolated, non-release design QA world from the fixed 4ebe assembly."""
import copy,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[3];src=R/'_local/act4-rc/world.json';out=R/'_local/act4-rc/design36-two-cluster';out.mkdir(parents=True,exist_ok=True)
raw=src.read_bytes();assert hashlib.sha256(raw).hexdigest()=='2b07f06d90668187b9e53ef94569841f05396dff2d9334e98bff49f415c9b601'
w=json.loads(raw);s=next(x for x in w['stages'] if x['metadata']['stageId']==36);original=copy.deepcopy(s);units={u['id']:u for u in s['units']};assert len(units)==13
placements={'a4-36-b-3':(520,'approved36-entry'),'a4-36-b-1':(620,'approved36-entry'),'a4-36-b-4':(730,'approved36-workshop'),'a4-36-b-2':(840,'approved36-workshop')}
def top(t,x):
 points=t['points'];matches=[]
 for a,b in zip(points,points[1:]):
  if a['x']<=x<=b['x'] and b['x']>a['x']:
   matches.append(a['y']+(b['y']-a['y'])*(x-a['x'])/(b['x']-a['x']))
 assert matches,(t['id'],x);return min(matches)
for uid,(x,support) in placements.items():
 u=units[uid];surface=next(t for t in s['terrains'] if t['id']==support);u['x']=x;u['y']=top(surface,x);u['stageOverrides']['honroEncounterSupport']=support
removed={'a4-36-g-1','a4-36-g-2'};s['units']=[u for u in s['units'] if u['id'] not in removed];s['encounters']=[e for e in s['encounters'] if e['id']!='a4-36-g']
assert len(s['units'])==11 and sum(u['team']=='enemy' for u in s['units'])==7
assert s['design']['act4']['eliteReward36']=={'version':1,'targetId':'a4-36-b-1'}
for u in s['units']:
 old=next(z for z in original['units'] if z['id']==u['id'])
 if u['id'] in placements:
  old['x']=u['x'];old['y']=u['y'];old['stageOverrides']['honroEncounterSupport']=u['stageOverrides']['honroEncounterSupport']
 assert u==old,u['id']
for k in s:
 if k not in ('units','encounters'):assert s[k]==original[k],k
encoded=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();dest=out/'world.json';dest.write_bytes(encoded)
report={'kind':'independent design QA candidate, not release','baseCommit':'4ebe01b0bde5438782a7bd37e5dffdf89984f8ba','baseWorldSha256':hashlib.sha256(raw).hexdigest(),'stage36CandidateSha256':'6636c9580e45f5d539c9a7c7b75d443e9e3346d2f6f15ede6696b5563b45eaaf','worldSha256':hashlib.sha256(encoded).hexdigest(),'removed':sorted(removed),'placements':[{'id':uid,'x':units[uid]['x'],'y':units[uid]['y'],'support':support} for uid,(x,support) in placements.items()],'minInitialHorizontalGap':min(abs(units[uid]['x']-u['x']) for uid in placements for u in s['units'] if u['team']=='player'),'target':'a4-36-b-1','eventsAndTerrainUnchanged':True}
(out/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
