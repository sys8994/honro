"""Auxiliary fixed-physical-window/actor-scale diagnostic. Does not replace frozen v3 gate."""
import argparse,importlib.util,json,pathlib,hashlib,math
ROOT=pathlib.Path(__file__).resolve().parents[2]
sp=importlib.util.spec_from_file_location('metric',ROOT/'tools/act4-pilot/measure-support-straights.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--out',required=True);a=p.parse_args()
source=pathlib.Path(a.source);raw=source.read_bytes();spec=json.loads(raw);rows=[]
for w,h in [(1280,720),(390,844)]:
 for view in spec['cameraViews']:
  # Deliberately identical physical crop at all three scales. This is NOT the full current viewport.
  region=[view['x']-w/(2*.7),view['y']-h/(2*.7),w/.7,h/.7];results=[]
  for zoom,z in [('minimum',max(w/6800,3.75/66)),('normal-policy',.7),('maximum',1.65)]:
   total=straight=0
   for f in spec['surfaces']:
    if f.get('material')=='wood':continue
    projected=[((x-region[0])*z,(y-region[1])*z) for x,y in f['top']]
    # Convert actual projected coordinates into fixed reference CSS units before all geometric operations.
    ref=[(x*.7/z,y*.7/z) for x,y in projected]
    for part in m.pieces(ref,w,h):
     length,runs=m.measure(part);total+=length;straight+=sum(r['length'] for r in runs if r['length']>=80)
   results.append(dict(zoom=zoom,scale=z,lengthReferenceCSS=total,straightReferenceCSS=straight,ratio=None if total==0 else straight/total))
  values=[r['ratio'] for r in results if r['ratio'] is not None];delta=max(values)-min(values) if values else 0
  assert delta<1e-9,(view['id'],delta)
  rows.append(dict(viewportAtReference=[w,h],camera=view['id'],physicalRegion=region,results=results,maxRatioDelta=delta))
report=dict(status='AUXILIARY ONLY. Frozen v3 failure/blocked results unchanged; no acceptance claim.',source=str(source),sourceSHA256=hashlib.sha256(raw).hexdigest(),method='Fixed physical window defined at normal-policy scale0.7; project at each zoom then normalize to reference CSS units before clipping/resampling/RDP/run extraction. All thresholds remain original numeric values in reference units; 30% criterion unchanged. This separates zoom-dependent measurement units from actual shape.',actorHeightWorld=92,actorHeightSource="shared/map/units.js and actual pilot Engine bodies",actorHeightReferenceCSS=64.4,straightThresholdActorHeights=80/64.4,referenceScale=.7,thresholds=dict(runLengthReferenceCSS=80,chordErrorReferenceCSS=2,rdpReferenceCSS=3,hardMaxExclusive=.3),rows=rows)
out=pathlib.Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
print(json.dumps(dict(out=str(out),maxRatioDelta=max(r['maxRatioDelta'] for r in rows),fixedWindowRatios=[r['results'][1]['ratio'] for r in rows])))
