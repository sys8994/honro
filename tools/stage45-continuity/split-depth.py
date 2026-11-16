"""Split existing native alpha at the unchanged pass-road using real Inkscape.

Only artwork clips are produced. The collision source and colour paths are read-only.
All output coordinates remain in each alpha's native coordinate system.
"""
from pathlib import Path
from lxml import etree as E
import hashlib,json,os,re,subprocess,sys

R=Path(__file__).resolve().parents[2]
ART=R/'art/stage45-continuity'
OUT=ART/'depth-split'
OUT.mkdir(exist_ok=True)
NS='{http://www.w3.org/2000/svg}'
ENV={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
terrain=R/'shared/data/act5/terrain.mjs'
initial=ART/'alpha-registered-v2.svg'
deep=ART/'deep-alpha-optimized.svg'
before={str(p.relative_to(R)):sha(p) for p in [terrain,initial,deep]}
result=subprocess.run(['node','--input-type=module','-e',
    "import {terrain} from './shared/data/act5/terrain.mjs'; console.log(JSON.stringify(terrain[4].lines.find(x=>x[0]==='pass-road')[1]));"],
    cwd=R,capture_output=True,text=True,check=True)
road=[[x*1997/1024,y*1997/1024] for x,y in json.loads(result.stdout)]
def extend(x,a,b):return [x,a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0])]
boundary=[extend(-2000,road[0],road[1]),*road,extend(4000,road[-2],road[-1])]
below=[*boundary,[4000,6000],[-2000,6000]]
report={'scope':'Artwork alpha only; unchanged pass-road, source alpha and colour paths',
        'sourceHashes':before,'sourceBoundary':boundary,'sourceBelowPolygon':below,'outputs':{}}
clips={}

def chunks(data):
    # Inkscape Boolean output uses absolute moveto. Never split one subpath.
    if re.search('m',data):raise ValueError('Unexpected relative moveto in native Boolean output')
    subpaths=re.findall(r'M[^M]*',data)
    if not subpaths:raise ValueError('No native closed paths')
    parts=[];part=''
    for subpath in subpaths:
        if len(subpath)>60000:raise ValueError('Single native subpath exceeds 60000')
        if len(part)+len(subpath)+1>60000:parts.append(part);part=''
        part+=((' ' if part else '')+subpath)
    if part:parts.append(part)
    if not 1<=len(parts)<=32:raise ValueError('Native clip count exceeds existing 32 budget')
    return parts

for name,src,s,dx,dy,op in [
    ('front',initial,.63*2172/1997,125,155,'path-intersection'),
    ('back',initial,.63*2172/1997,125,155,'path-difference'),
    ('deep',deep,.305*2172/1997,322,60,'path-intersection')]:
    source=E.parse(str(src));old=source.getroot()
    if any(e.get('transform') for e in old.iter()):raise ValueError('Alpha transforms must already be resolved')
    paths=source.findall('.//{*}path')
    if any('evenodd' in p.get('style','') or p.get('fill-rule')=='evenodd' for p in paths):raise ValueError('Unexpected alpha winding')
    root=E.Element(NS+'svg',nsmap={None:NS[1:-1]},viewBox=old.get('viewBox'))
    for attr in ['width','height']:
        if old.get(attr):root.set(attr,old.get(attr))
    E.SubElement(root,NS+'path',id='alpha',d=' '.join(p.get('d') for p in paths),fill='#000000')
    native=[[x*s+dx,y*s+dy] for x,y in below]
    E.SubElement(root,NS+'path',id='below',d='M'+'L'.join(f'{x:.9f},{y:.9f}' for x,y in native)+'Z',fill='#000000')
    inp=OUT/(name+'-input.svg');raw=OUT/(name+'-raw.svg')
    E.ElementTree(root).write(str(inp),encoding='utf-8',xml_declaration=True)
    actions=f'select-by-id:alpha,below;{op};select-clear;export-plain-svg;export-filename:{raw};export-do'
    done=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process','--actions='+actions],env=ENV,capture_output=True,text=True)
    (OUT/(name+'-inkscape.log')).write_text(done.stdout+done.stderr);done.check_returncode()
    selected=raw;data=' '.join(p.get('d') for p in E.parse(str(raw)).findall('.//{*}path'))
    try:parts=chunks(data)
    except ValueError:
        selected=OUT/(name+'-optimized.svg')
        if selected.exists():raise ValueError('Choose fresh optimization output; refusing overwrite')
        opt=subprocess.run([sys.executable,str(R/'tools/terrain-node-optimizer/optimize_svg.py'),str(raw),str(selected),'--epsilon','0.4','--render-widths','1280'],cwd=R,env=ENV,capture_output=True,text=True)
        (OUT/(name+'-optimization.log')).write_text(opt.stdout+opt.stderr);opt.check_returncode()
        parts=chunks(' '.join(p.get('d') for p in E.parse(str(selected)).findall('.//{*}path')))
    clips[name]=parts
    report['outputs'][name]={'operation':op,'nativeTransform':[s,0,0,s,dx,dy],
        'rawSha256':sha(raw),'selected':str(selected.relative_to(R)),'selectedSha256':sha(selected),
        'clipCount':len(parts),'maxClipChars':max(map(len,parts)),'totalClipChars':sum(map(len,parts))}

after={str(p.relative_to(R)):sha(p) for p in [terrain,initial,deep]}
assert before==after,'Source mutation detected'
report['sourceUnchanged']=True
dest=R/'shared/assets/environment/act5/stage45-depth-clips.json'
dest.write_text(json.dumps(clips,separators=(',',':'))+'\n')
report['output']=str(dest.relative_to(R));report['outputSha256']=sha(dest)
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
