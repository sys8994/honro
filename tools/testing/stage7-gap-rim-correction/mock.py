import tempfile,json,subprocess
from pathlib import Path
from PIL import Image
cfg=json.load(open(Path(__file__).with_name('config.json')))
with tempfile.TemporaryDirectory() as t:
 p=Path(t)
 for v in cfg['views']:
  for variant in ['baseline','candidate']:
   r=dict(ok=True,commit=cfg[variant],battleUnchanged=True,sourceUnchanged=True,storage=[],errors=[],requestedDPR=v['dpr'],officialDPR=min(v['dpr'],1.7),worldWidth=10,rimGroups=[{'id':'root-floor','segments':[{'a':{'x':-1 if variant=='baseline' else 0,'y':0},'z':{'x':10,'y':0},'walkable':True}]}],camera={'x':0,'y':0,'scale':1},width=140,height=3,terrainSHA='terrain',unitsSHA='units',sourceStageSHA='stage',sourceSymbolSHA='source')
   (p/f"{variant}-{v['name']}.json").write_text(json.dumps(r))
   for suffix in ['','-body-mask','-foreground-mask','-terrain-mask','-readabilityOff-mask','-rimOnly-mask']:
    color=(0,0,0,0) if suffix=='-foreground-mask' else ((19,30,40,255) if suffix=='-readabilityOff-mask' else ((21,30,40,255) if suffix=='-body-mask' and variant=='candidate' else (20,30,40,255)))
    Image.new('RGBA',(140,3),color).save(p/f"{variant}-{v['name']}{suffix}.png")
 subprocess.run(['python',str(Path(__file__).with_name('check.py')),t],check=True)
 bad=p/'candidate-overview.png';img=Image.open(bad);saved=img.copy();img.putpixel((75,1),(100,30,40,255));img.save(bad);assert subprocess.run(['python',str(Path(__file__).with_name('check.py')),t],capture_output=True).returncode!=0; saved.save(bad)
 f=p/'candidate-reported-left.json';r=json.loads(f.read_text());r['unitsSHA']='tampered';f.write_text(json.dumps(r))
 assert subprocess.run(['python',str(Path(__file__).with_name('check.py')),t],capture_output=True).returncode!=0
print('PASS valid diagnostic contract, real Scene pixel mutation and gameplay mutation rejection')
