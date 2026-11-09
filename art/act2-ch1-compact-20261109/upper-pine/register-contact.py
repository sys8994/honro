"""Localized, native Inkscape contact registration before optimization.

Adds only adjacent existing top wood color in the narrow gap between the
generated top and authored contact, then clips alpha above the real contact.
This is an intentional source/edit operation, NOT a lossless optimizer step.
"""
import base64,copy,hashlib,json,os,subprocess,sys
from pathlib import Path
from xml.etree import ElementTree as E
import numpy as np
from PIL import Image

base,out,exe=[Path(x).resolve()for x in sys.argv[1:4]];out.mkdir(parents=True,exist_ok=True)
if (out/'registered-raw.svg').exists():raise RuntimeError('Refuse to overwrite registered raw')
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
c=json.loads((base/'contract.json').read_text());im=Image.open(base/'source-v2.png').convert('RGBA');w,h=im.size;a=np.asarray(im)[:,:,3]>=128
points=[(p['x']*w/c['imageSize'][0],p['y']*h/c['imageSize'][1])for p in c['upperContactSource']]
def desired(x):
    for(a0,b0),(a1,b1)in zip(points,points[1:]):
        if a0-1e-6<=x<=a1+1e-6:return b0+(b1-b0)*(x-a0)/(a1-a0)
    raise ValueError(x)
xs=sorted(set([q[0]for q in points]+list(np.arange(points[0][0],points[-1][0],4))+[points[-1][0]]))
lower=[];offsets=[]
for x in xs:
    expected=desired(x);ys=np.flatnonzero(a[:,min(w-1,max(0,round(x)))])
    actual=float(ys[0])if len(ys)else expected
    lower.append((x,max(expected+3,actual+3)));offsets.append(actual-expected)
path=lambda ps:'M'+'L'.join(f'{x:.6f},{y:.6f}'for x,y in ps)+'Z'
ribbon=path(points+lower[::-1]);topmask=path([(0,points[0][1]),*points,(w,points[-1][1]),(w,h),(0,h)])
color=E.parse(base/'trace8/native-color.svg').getroot();alpha=E.parse(base/'trace8/native-alpha.svg').getroot()
alpha_path=next(e for e in alpha.iter()if e.tag.split('}')[-1]=='path');paint=next(e for e in color.iter()if e.tag.split('}')[-1]=='path'and 'fefefe'not in e.get('style',''))
wood_style=paint.get('style','fill:#665346')
env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')}
def boolean(first,second,label,action):
    root=E.Element('{'+NS+'}svg',{'width':str(w),'height':str(h),'viewBox':f'0 0 {w} {h}'})
    first,second=copy.deepcopy(first),copy.deepcopy(second);first.set('id','first');second.set('id','second');root.extend([first,second]);inp=out/(label+'-input.svg');dest=out/(label+'.svg');E.ElementTree(root).write(inp,encoding='utf-8',xml_declaration=True)
    args=[str(exe),str(inp),'--batch-process',f'--actions=select-by-id:first,second;{action};export-plain-svg;export-filename:{dest};export-do']
    r=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120);(out/(label+'.log')).write_text(json.dumps(args)+'\n'+r.stdout+r.stderr)
    if r.returncode or not dest.exists():raise RuntimeError('Native '+label+' failed')
    ps=[e for e in E.parse(dest).getroot().iter()if e.tag.split('}')[-1]=='path']
    if len(ps)!=1:raise RuntimeError('Expected one retained alpha compound after '+label)
    return ps[0]
band=E.Element('{'+NS+'}path',{'d':ribbon,'style':'fill:#000000'});mask=E.Element('{'+NS+'}path',{'d':topmask,'style':'fill:#000000'})
united=boolean(alpha_path,band,'alpha-gap-union','path-union')
registered=boolean(united,mask,'alpha-contact-intersection','path-intersection');registered.set('style','fill:#000000');registered.set('id','registered-alpha')
aroot=E.Element('{'+NS+'}svg',{'width':str(w),'height':str(h),'viewBox':f'0 0 {w} {h}'});aroot.append(copy.deepcopy(registered));E.ElementTree(aroot).write(out/'native-alpha.svg',encoding='utf-8',xml_declaration=True)
color.append(E.Element('{'+NS+'}path',{'id':'authored-contact-registration','d':ribbon,'style':wood_style}));E.ElementTree(color).write(out/'native-color.svg',encoding='utf-8',xml_declaration=True)
defs=E.SubElement(color,'{'+NS+'}defs');clip=E.SubElement(defs,'{'+NS+'}clipPath',{'id':'registered-source-alpha','clipPathUnits':'userSpaceOnUse'});clip.append(copy.deepcopy(registered));group=E.SubElement(color,'{'+NS+'}g',{'clip-path':'url(#registered-source-alpha)'})
for e in list(color):
    if e is not group and e.tag.split('}')[-1]in('g','path'):color.remove(e);group.append(e)
E.ElementTree(color).write(out/'registered-raw.svg',encoding='utf-8',xml_declaration=True)
args=[str(exe),str(out/'registered-raw.svg'),'--export-background-opacity=0','--export-filename='+str(out/'registered-raw.png')];r=subprocess.run(args,env=env,capture_output=True,text=True,errors='replace',timeout=120);(out/'render.log').write_text(r.stdout+r.stderr)
if r.returncode:raise RuntimeError('Registration render failed')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report={'scope':'Intentional localized contact registration before optimization; not a lossless raw→optimized claim. Generated art and immutable trace8/raw.svg remain preserved.','sourceImageSha256':sha(base/'source-v2.png'),'originalTraceSha256':sha(base/'trace8/raw.svg'),'registeredRawSha256':sha(out/'registered-raw.svg'),'registrationColor':wood_style,'contactSource':points,'measuredOriginalGapRangePx':[min(offsets),max(offsets)],'newRibbonDepthRangePx':[min(b-desired(x)for x,b in lower),max(b-desired(x)for x,b in lower)],'ribbonPath':ribbon,'nativeAlphaOperations':['path-union with source-derived gap ribbon','path-intersection with authored top half-plane'],'preservedSource':'All source color paths unchanged; one adjacent top-color registration band appended. Trunk/root/holes require delta review.','visualReview':'PENDING'}
(out/'registration.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k]for k in ['registeredRawSha256','measuredOriginalGapRangePx','newRibbonDepthRangePx']}))
