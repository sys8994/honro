"""Replace only outside-world depth seams with existing registered colour contours.

Native Bezier segments form the alpha mask; one short outside-world contact
bridge rounds the nested band junction without changing source colour paths.
The inside pass-road is unchanged. Short contour junctions are explicitly measured.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SvgPath,Line,CubicBezier,QuadraticBezier
from scipy.optimize import minimize_scalar,brentq
import hashlib,json,os,subprocess,re,io
from PIL import Image
import numpy as np

R=Path(__file__).resolve().parents[2]
A=R/'art/stage45-continuity';O=A/'depth-natural';O.mkdir(exist_ok=True)
COLOR=A/'deep-registered-color.svg'
ALPHA=A/'deep-alpha-optimized.svg'
TERRAIN=R/'shared/data/act5/terrain.mjs'
DEST=R/'shared/assets/environment/act5/stage45-depth-clips.json'
ENV={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source_hashes={str(p.relative_to(R)):sha(p) for p in [COLOR,ALPHA,TERRAIN]}
tree=E.parse(str(COLOR))
def subpath(pid,index):
    p=tree.xpath('//*[local-name()="path" and @id="'+pid+'"]')[0]
    return parse_path(p.get('d')).continuous_subpaths()[index]
def nearest(segment,point):
    q=minimize_scalar(lambda t:abs(segment.point(t)-point),bounds=(0,1),method='bounded')
    return float(q.x),segment.point(q.x)
points=json.loads(subprocess.run(['node','--input-type=module','-e',
    "import {terrain} from './shared/data/act5/terrain.mjs'; console.log(JSON.stringify(terrain[4].lines.find(x=>x[0]==='pass-road')[1]));"],
    cwd=R,capture_output=True,text=True,check=True).stdout)
s=.305*2172/1997
road=[complex(x*1997/1024*s+322,y*1997/1024*s+60) for x,y in points]
junctions=[]
def connector(a,b,label,limit=3):
    length=abs(b-a)
    if length>limit:raise ValueError(f'{label} junction {length} exceeds {limit}')
    junctions.append({'name':label,'from':[a.real,a.imag],'to':[b.real,b.imag],
                      'lengthNative':length,'allowedNative':limit})
    return Line(a,b)

# Existing west root-stratum edge reaches the native left boundary directly.
w=subpath('path5',68)
wt=brentq(lambda t:w[38].point(t).real-road[0].real,0,1)
west=[*w[20:38],w[38].cropped(0,wt)]
segments=[*west,connector(west[-1].end,road[0],'west-contact')]
segments.extend(Line(a,b) for a,b in zip(road,road[1:]))

# Follow nested, existing colour contours to the native right boundary.
# Their small separation comes from independently traced colour bands.
p7=subpath('path7',64);p6=subpath('path6',106)
p4=subpath('path4',102);p3=subpath('path3',99)
# The source's nested bands terminate in two tiny vertical colour steps.
# Round only their outside-world depth-mask join, not colour paths or contact.
# Keep the authored road tangent and rejoin the existing p6 curve at +14 units.
t6=brentq(lambda t:p6[0].point(t).real-(road[-1].real+14),0,1)
q6=p6[0].point(t6)
tangent=(road[-1]-road[-2])/(road[-1].real-road[-2].real)
end_tangent=p6[0].derivative(t6);end_tangent/=end_tangent.real
bridge=CubicBezier(road[-1],road[-1]+tangent*4,q6-end_tangent*4,q6)
segments.append(bridge)
junctions.append({'name':'east-rounded-depth-contact','from':[road[-1].real,road[-1].imag],
                  'to':[q6.real,q6.imag],'lengthNative':abs(q6-road[-1]),
                  'scope':'Outside-world alpha only, authored road tangent to native p6 contour'})
segments.extend([p6[0].cropped(t6,1),*p6[1:10]])
t4,q4=nearest(p4[146],segments[-1].end)
segments.append(connector(segments[-1].end,q4,'east-band-6-4'))
segments.extend([p4[146].cropped(t4,1),p4[147],p4[148]])
segments.append(connector(segments[-1].end,p3[59].start,'east-band-4-3'))
segments.extend(p3[59:76])
assert all(z.real<=road[0].real+1e-6 for seg in west for z in seg.bpoints())
east_start=len(west)+1+len(road)-1
assert all(z.real>=road[-1].real-1e-6 for seg in segments[east_start:] for z in seg.bpoints())
boundary=SvgPath(*segments)
bottom=6000*s+60
segments.extend([Line(segments[-1].end,complex(segments[-1].end.real,bottom)),
                 Line(complex(segments[-1].end.real,bottom),complex(segments[0].start.real,bottom)),
                 Line(complex(segments[0].start.real,bottom),segments[0].start)])
join_error=max(abs(a.end-b.start) for a,b in zip(segments,segments[1:]))
assert join_error<1e-9
# Do not let sub-ulp arithmetic differences insert implicit subpath closures.
# Nine native-coordinate decimal places preserve original controls while sharing joins.
point=lambda z:f'{z.real:.9f},{z.imag:.9f}'
commands=['M'+point(segments[0].start)]
for seg in segments:
    if isinstance(seg,Line):commands.append('L'+point(seg.end))
    elif isinstance(seg,CubicBezier):commands.append('C'+' '.join(map(point,[seg.control1,seg.control2,seg.end])))
    elif isinstance(seg,QuadraticBezier):commands.append('Q'+' '.join(map(point,[seg.control,seg.end])))
    else:raise ValueError('Unexpected native curve')
mask=' '.join(commands)+'Z'
assert mask.count('M')==1 and parse_path(mask).iscontinuous()
original=E.parse(str(ALPHA));root=E.Element('svg',xmlns='http://www.w3.org/2000/svg',
    viewBox=original.getroot().get('viewBox'))
E.SubElement(root,'path',id='alpha',d=' '.join(p.get('d') for p in original.findall('.//{*}path')),fill='#000')
E.SubElement(root,'path',id='depth',d=mask,fill='#000')
inp=O/'deep-input.svg';raw=O/'deep-raw.svg'
E.ElementTree(root).write(str(inp),encoding='utf-8',xml_declaration=True)
done=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process','--actions='+
    f'select-by-id:alpha,depth;path-intersection;select-clear;export-plain-svg;export-filename:{raw};export-do'],
    env=ENV,capture_output=True,text=True)
(O/'inkscape.log').write_text(done.stdout+done.stderr);done.check_returncode()
def read_paths(path):return ' '.join(p.get('d') for p in E.parse(str(path)).findall('.//{*}path'))
# Freeze the old inside-world alpha by an independent native rectangle intersection.
# Outside sections are disjoint and retained as compound nonzero union subpaths.
section_paths=[]
for name,src,left,right in [('west',raw,-2000,road[0].real),
        ('inside',A/'depth-split/deep-raw.svg',road[0].real,road[-1].real),
        ('east',raw,road[-1].real,3000)]:
    r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox=original.getroot().get('viewBox'))
    E.SubElement(r,'path',id='alpha',d=read_paths(src),fill='#000')
    E.SubElement(r,'path',id='section',d=f'M{left} -100H{right}V6000H{left}Z',fill='#000')
    f=O/(name+'-section-input.svg');dest=O/(name+'-section-raw.svg');E.ElementTree(r).write(str(f))
    p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+
        f'select-by-id:alpha,section;path-intersection;select-clear;export-plain-svg;export-filename:{dest};export-do'],env=ENV,capture_output=True,text=True)
    (O/(name+'-section.log')).write_text(p.stdout+p.stderr);p.check_returncode()
    section_paths.append(read_paths(dest))
data=' '.join(section_paths)
assert 'm' not in data
parts=[];part=''
for d in re.findall(r'M[^M]*',data):
    assert len(d)<=60000
    if len(part)+len(d)+1>60000:parts.append(part);part=''
    part+=((' 'if part else '')+d)
if part:parts.append(part)
assert 1<=len(parts)<=32
combined=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox=original.getroot().get('viewBox'))
E.SubElement(combined,'path',d=' '.join(parts),fill='#000')
combined_file=O/'deep-combined-raw.svg';E.ElementTree(combined).write(str(combined_file))
def render_inside(path):
    t=E.parse(str(path));r=t.getroot();r.set('viewBox','322 0 662.46 1510.2');r.set('width','1325');r.set('height','3020')
    q=subprocess.run(['/usr/bin/inkscape','--pipe','--export-type=png','--export-filename=-'],input=E.tostring(r),env=ENV,capture_output=True,check=True)
    return np.array(Image.open(io.BytesIO(q.stdout)).convert('RGBA'))[:,:,3].astype(float)
prior=render_inside(A/'depth-split/deep-raw.svg');candidate=render_inside(combined_file)
delta=abs(prior-candidate)
raster={'cropNative':[322,0,662.46,1510.2],'size':[1325,3020],
        'differentPixels':int((delta!=0).sum()),'maxChannelDelta':float(delta.max()),
        'meanChannelDelta':float(delta.mean())}
# Context-wide tessellation may change edge antialias coverage even for identical
# inside segments. Compare both actual inside intersections under the same clip.
r=E.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox=original.getroot().get('viewBox'))
E.SubElement(r,'path',id='alpha',d=' '.join(parts),fill='#000')
E.SubElement(r,'path',id='inside',d=f'M{road[0].real} -100H{road[-1].real}V6000H{road[0].real}Z',fill='#000')
f=O/'inside-validation-input.svg';dest=O/'inside-validation-raw.svg';E.ElementTree(r).write(str(f))
p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+
    f'select-by-id:alpha,inside;path-intersection;select-clear;export-plain-svg;export-filename:{dest};export-do'],env=ENV,capture_output=True,text=True)
(O/'inside-validation.log').write_text(p.stdout+p.stderr);p.check_returncode()
inside_delta=abs(render_inside(O/'inside-section-raw.svg')-render_inside(dest))
isolated={'differentPixels':int((inside_delta!=0).sum()),'maxChannelDelta':float(inside_delta.max()),
    'meanChannelDelta':float(inside_delta.mean()),'method':'Same native world rectangle intersection on baseline and final compound alpha'}
assert inside_delta.max()==0,('Isolated inside alpha must remain pixel-identical',isolated)
old=json.loads(DEST.read_text());unchanged={k:old[k] for k in ['front','back']}
old['deep']=parts
assert unchanged=={k:old[k] for k in ['front','back']}
assert source_hashes=={str(p.relative_to(R)):sha(p) for p in [COLOR,ALPHA,TERRAIN]}
temporary=DEST.with_suffix('.json.tmp')
temporary.write_text(json.dumps(old,separators=(',',':'))+'\n')
os.replace(temporary,DEST)
report={'sourceHashes':source_hashes,'sourceUnchanged':True,
    'scope':'Outside-world depth alpha only; unchanged native colour curves and inside collision profile',
    'sourceContourReferences':{'west':['path5',68,'segments20..38'],
        'east':[['contact tangent bridge','14 native units outside world'],['path6',106,'segments0..9'],
                ['path4',102,'segments146..148'],['path3',99,'segments59..75']]},
    'insideNativeRoad':[[z.real,z.imag]for z in road],'junctions':junctions,
    'maxFloatingJoinErrorBeforeSerialization':join_error,'serializedSubpaths':1,
    'insideAlphaRasterValidation':isolated,'contextRasterAntialiasDiagnostic':raster,
    'clipCount':len(parts),'maxClipChars':max(map(len,parts)),
    'frontBackUnchanged':True,'outputSha256':sha(DEST),'rawSha256':sha(raw),
    'visualApproval':'PENDING SCENE REVIEW'}
(O/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
