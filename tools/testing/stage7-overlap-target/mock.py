import tempfile,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
cfg=json.load(open(Path(__file__).with_name('config.json')))
with tempfile.TemporaryDirectory() as t:
 p=Path(t)
 for v in cfg['views']:
  for variant in ['baseline','candidate']:
   r=dict(ok=True,commit=cfg[variant],battleUnchanged=True,sourceUnchanged=True,storage=[],errors=[],requestedDPR=v['dpr'],officialDPR=min(v['dpr'],1.7),bodyPose={'x':0,'y':0,'scale':3.13},camera={'x':0,'y':0,'scale':1},width=140,height=30,worldWidth=10,rimGroups=[{'id':'root-floor','segments':[]}],terrainSHA='terrain',unitsSHA='units',sourceStageSHA='stage',sourceSymbolSHA='source')
   (p/f"{variant}-{v['name']}.json").write_text(json.dumps(r))
   for suffix in ['','-body-mask','-foreground-mask','-terrain-mask','-readabilityOff-mask','-rimOnly-mask','-allowedEdit-mask','-caps-mask']:
    mask=suffix in ['-foreground-mask','-allowedEdit-mask','-caps-mask'];img=Image.new('RGBA',(140,30),(0,0,0,0) if mask else ((19,30,40,255) if suffix=='-readabilityOff-mask' else (20,30,40,255)))
    if suffix in ['-foreground-mask','-allowedEdit-mask']:ImageDraw.Draw(img).rectangle((45,10,55,20),fill=(255,255,255,255))
    if suffix=='-caps-mask':img.putpixel((120,10),(255,255,255,255));img.putpixel((52,15),(255,255,255,255))
    if variant=='candidate' and suffix in ['','-body-mask','-terrain-mask','-readabilityOff-mask']:img.putpixel((50,15),(21,30,40,255))
    img.save(p/f"{variant}-{v['name']}{suffix}.png")
 cmd=['python',str(Path(__file__).with_name('check.py')),t];subprocess.run(cmd,check=True)
 for suffix,xy,color in [('',(100,15),(100,30,40,255)),('-body-mask',(50,15),(21,30,40,0)),('-body-mask',(52,15),(21,30,40,255))]:
  f=p/f'candidate-left-native{suffix}.png';im=Image.open(f);saved=im.copy();im.putpixel(xy,color);im.save(f);assert subprocess.run(cmd,capture_output=True).returncode!=0;saved.save(f)
 f=p/'candidate-left-native.json';r=json.loads(f.read_text());r['unitsSHA']='tampered';f.write_text(json.dumps(r));assert subprocess.run(cmd,capture_output=True).returncode!=0
print('PASS valid edit, outside Scene/cap changes, final alpha mutation and gameplay tampering rejection')
