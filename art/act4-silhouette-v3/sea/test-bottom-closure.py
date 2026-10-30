"""Verify structured export-bottom cleanup does not move meaningful native interior controlpoints."""
from pathlib import Path
import json,xml.etree.ElementTree as E
from svgpathtools import parse_path
D=Path(__file__).parent;fixture=json.load(open(D/'bottom-closure-before.json'));outerFixture=json.load(open(D/'bottom-outer-before.json'));report=[]
for key,d in fixture.items():
 n,side=key.split('/');file=D/f'bank{n}'/f'play-{side}'/'ground-master.svg';new=parse_path(next(e.get('d')for e in E.parse(file).getroot().iter()if e.get('id')=='path1'));old=parse_path(d);assert len(old)==len(new);assert next(e.get('d')for e in E.parse(file).getroot().iter()if e.get('id')=='path7')==outerFixture[key];changed=0;protected=0
 for a,b in zip(old,new):
  assert type(a)==type(b)
  for name in['start','control1','control2','control','end']:
   if not hasattr(a,name):continue
   x=getattr(a,name);y=getattr(b,name);expected=x+40j if x.imag>720 else x
   assert abs(y-expected)<1e-7,(key,name,x,y,expected)
   if x.imag>720:changed+=1
   else:protected+=1
 report.append({'source':key,'protectedInteriorControlpoints':protected,'bottomClosureControlpointsExtended':changed,'extensionSourcePx':40,'thresholdSourceY':720,'outerCollisionPath7Untouched':True})
print(json.dumps(report,indent=2));(D/'bottom-closure-regression.json').write_text(json.dumps(report,indent=2))
