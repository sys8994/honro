"""Whole-stage denominator cannot depend on camera multiplicity/cropping."""
import json,pathlib,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory() as d:
 d=pathlib.Path(d);base=json.loads((root/'tools/act4-pilot/layouts/stage31.json').read_text())
 def run(s,name,ok=True):
  source=d/(name+'.json');out=d/(name+'-result.json');source.write_text(json.dumps(s));r=subprocess.run(['python',str(root/'tools/act4-pilot/measure-stage-straights-v31.py'),'--source',str(source),'--out',str(out)],capture_output=True)
  assert (r.returncode==0)==ok,r.stderr
  return json.loads(out.read_text()) if ok else None
 a=run(base,'baseline');base['cameraViews']*=20;base['cameraViews'].append({'id':'arbitrary-crop','x':0,'y':0,'w':1,'h':1});b=run(base,'duplicate-cameras')
 assert a['ratio80']==b['ratio80'] and a['lengthReferenceCSS']==b['lengthReferenceCSS']
 base['surfaces'].append(base['surfaces'][0]);run(base,'duplicate-support',False)
print('PASS camera/crop denominator invariance and duplicate-support rejection; no art acceptance claim')
