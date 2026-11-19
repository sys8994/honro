from pathlib import Path
import json,os,sys
from PIL import Image,ImageChops
root,e=map(Path,sys.argv[1:3])
pins={
 'baseline': ['6adcdaaac1d3e85b0a837680e9263ca9a72909fef96f872b9d6b85beedf580a3','f88f26fd857fddd55f700de35f761185b1864c0499cb97effba1b1223d15387e','c42b387304f251c5c2f2328f4173e158c395e9b4a6f90498c268b380338eb24b'],
 'candidate':['a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5','257e6f4f72ac5009a3c1a1e2ca308bb015dfae97dbcb6992bdada4e8b0f6f637','4e3017b97c6aa8601dd465840609301eb8895d3fdda5d627d6369417ae04251c']}
report={'scope':'Actual blank Workshop native visual composition; no mechanics, physics, route gameplay or promotion','pins':pins,'arms':{},'errors':[]}
raw={}
for arm,expected in pins.items():
 path=e/arm/'result.json';r=json.loads(path.read_text()) if path.is_file() else {}
 raw[arm]=r
 rc=int((root/arm/'status').read_text())
 actual=[r.get(k,{}).get('sha256') for k in ('scope_save','detail_manual_save','gate_save')]
 report['arms'][arm]={'exit':rc,'observed':actual,'state':r.get('step'),'detail_count':r.get('full_detail_count'),'gate_route_count':r.get('gate_pointer_count'),'portal':r.get('protected_gate_pixels')}
 if rc or not r.get('pass') or actual!=expected:report['errors'].append({'arm':arm,'rc':rc,'expected':expected,'actual':actual,'error':r.get('error'),'state':r.get('step')})
cams=[{k:v.get('actual') for k,v in raw[arm].get('gate_frames',{}).items()} for arm in pins]
if not cams[0] or cams[0]!=cams[1]:report['errors'].append('mismatched same-camera receipt')
native=set(raw['candidate'].get('gate_frames',{}).get('whole',{}).get('owners',{}))
if not {'new-stage42-margin-bottom','new-stage42-upper-deck-taper','new-stage42-reversible-palisade-ladder','stage42-native-gate-open-prop'}<=native:report['errors'].append('composed named owners not observed in actual overview')
report['c01']=raw['candidate'].get('c01',{}).get('result','disabled')
if os.environ.get('STAGE42_ENABLE_C01','0')=='1' and report['c01']=='disabled':report['errors'].append('requested unchanged C01 evidence missing')
report['direct_owner_calls']={}
for arm,readings in raw.items():
 frame=readings.get('gate_frames',{}).get('direct-west',{})
 actual=frame.get('actual',[]);owners=frame.get('owners',{})
 report['direct_owner_calls'][arm]={'camera':actual,'roles':{n:owners.get(n) for n in ['new-stage42-joined-lower','new-stage42-margin-left']}}
 if not len(actual)==3 or actual[2]<=1.05 or not all(owners.get(n,{}).get('direct',0)>0 for n in ['new-stage42-joined-lower','new-stage42-margin-left']):
   report['errors'].append(arm+' did not prove named direct vector-owner calls above 1.05')
extrema=raw['candidate'].get('legal_device_extremes',{})
report['legal_device_extremes']=extrema
if set(extrema)!={f'{w}x{h}-{c}' for w,h in [(1280,800),(390,844)] for c in ['nw','ne','sw','se']}:
 report['errors'].append('Incomplete true legal-device focus-extrema captures')
report['matched_cameras']=cams[0]
report['pixel_changes']={}
for name in cams[0]:
 paths=[e/arm/f'gate-stock-{name}.png' for arm in pins]
 if not all(p.is_file() for p in paths):continue
 a,b=[Image.open(p).convert('RGB') for p in paths]
 d=ImageChops.difference(a,b)
 report['pixel_changes'][name]={'bounds':d.getbbox(),'changed':sum(any(q) for q in d.getdata())}
report['art_technical_pass']=not report['errors']
report['live_walk']=raw['candidate'].get('live_walk','disabled')
if os.environ.get('STAGE42_ENABLE_LIVE_WALK','0')=='1' and report['live_walk']!='passed-initial-segment-only':
 report['errors'].append('Separate strict live-walk gate did not pass; art receipts remain independently labeled')
report['pass']=not report['errors']
(e/'result.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
if not report['pass']:raise SystemExit(report['errors'])
