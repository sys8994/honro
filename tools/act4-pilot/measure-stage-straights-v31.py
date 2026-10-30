"""Root-authorized v3.1 whole-stage unique natural support diagnostic/gate input.
Old projected-window v3 reports are never overwritten.
"""
import argparse,importlib.util,json,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
sp=importlib.util.spec_from_file_location('metric',ROOT/'tools/act4-pilot/measure-support-straights.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--out',required=True);a=p.parse_args();source=pathlib.Path(a.source);raw=source.read_bytes();s=json.loads(raw)
seen=set();rows=[]
for f in s['surfaces']:
 if f['id'] in seen:raise ValueError('Duplicate support id: '+f['id'])
 seen.add(f['id'])
 if f.get('material')=='wood':continue
 ps=[(x*.7,y*.7) for x,y in f['top']];L,runs=m.measure(ps)
 lengths={str(k):sum(r['length'] for r in runs if r['length']>=k) for k in [40,80,160]}
 rows.append(dict(id=f['id'],lengthReferenceCSS=L,straightReferenceCSS=lengths,ratio80=lengths['80']/L if L else None))
L=sum(r['lengthReferenceCSS'] for r in rows);straight={str(k):sum(r['straightReferenceCSS'][str(k)] for r in rows) for k in [40,80,160]};ratio=straight['80']/L
report=dict(definitionVersion='v3.1-root-authorized-whole-stage-unique-supports',source=str(source),sourceSHA256=hashlib.sha256(raw).hexdigest(),status='TOP-CONTOUR MEASUREMENT ONLY; final image/art/play acceptance separate',referenceScale=.7,scope='Each authored natural support id counted exactly once over its entire fixed physical top. No viewport clipping or repeated camera denominator. No natural-flat exclusions. Timber material excluded only as frozen material exception.',thresholds=dict(targetExclusive=.2,hardMaxExclusive=.3),lengthReferenceCSS=L,straightReferenceCSS=straight,ratio80=ratio,targetMet=ratio<.2,hardCapMet=ratio<.3,rows=rows)
out=pathlib.Path(a.out);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['source','lengthReferenceCSS','ratio80','targetMet','hardCapMet']}))
