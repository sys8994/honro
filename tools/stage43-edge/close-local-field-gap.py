"""Local study: register an adjacent existing facet across a narrow dark gap.
No new painted geometry: the native field is clipped to its original face plus
small convex closure to the two measured ends of an otherwise straight seam.
Not visual approval. Original illustration and gameplay are never modified.
"""
from pathlib import Path
from lxml import etree as E
import importlib.util,os,subprocess,json,copy,hashlib
ROOT=Path(__file__).resolve().parents[2];src=ROOT.parent/'stage43-source-fields-v3';out=ROOT.parent/'stage43-source-fields-v4';out.mkdir(exist_ok=True)
s=importlib.util.spec_from_file_location('field',Path(__file__).with_name('assemble-source-fields.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
cr,rings,pm=m.load_mapped(ROOT.parent/'stage43-trace-side-left-corrected/color-field-preopt.svg','left',True);ring=rings[5920];assert abs(ring['box'][0]-2.6537799043)<.001
points=sorted(set([(z.real,z.imag) for z in ring['points']]+[(0,780.502),(0,802.289)]))
def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
low=[];high=[]
for p in points:
 while len(low)>=2 and cross(low[-2],low[-1],p)<=0:low.pop()
 low.append(p)
for p in reversed(points):
 while len(high)>=2 and cross(high[-2],high[-1],p)<=0:high.pop()
 high.append(p)
hull=low[:-1]+high[:-1];hull.append(hull[0]);harea=abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(hull,hull[1:])))/2
hbounds=[min(x for x,y in hull),min(y for x,y in hull),max(x for x,y in hull),max(y for x,y in hull)]
hd='M'+'L'.join(f'{x:.4f},{y:.4f}' for x,y in hull)+'Z';r=m.root();a=E.parse(str(src/'left-alpha-final.svg'));ad=' '.join(p.get('d') for p in a.findall('.//'+m.NS+'path'));m.path(r,ad,'base');m.path(r,hd,'adjacent-face-closure')
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')}
def run(root,actions,name):
 p=out/(name+'-input.svg');q=out/(name+'.svg');E.ElementTree(root).write(str(p));actions+=['select-clear','export-plain-svg',f'export-filename:{q}','export-do'];z=subprocess.run(['inkscape',str(p),'--batch-process','--actions='+';'.join(actions)],capture_output=True,text=True,env=env);(out/(name+'.log')).write_text(z.stdout+z.stderr);z.check_returncode();return E.parse(str(q))
a=run(r,['select-all','path-union'],'left-alpha');ad=' '.join(p.get('d') for p in a.findall('.//'+m.NS+'path'));acts=[]
for i,p in enumerate(list(cr.findall('.//'+m.NS+'path'))):
 ident=p.get('id');mask=f'mask-{i}';m.path(cr,ad,mask);acts+=['select-clear',f'select-by-id:{ident},{mask}','path-intersection']
c=run(cr,acts,'left-color');t=E.parse(str(src/'color-combined.svg'));g=t.find('.//'+m.NS+'g[@id="field-left"]');g.clear();g.set('id','field-left')
for i,p in enumerate(c.findall('.//'+m.NS+'path')):
 p=copy.deepcopy(p);p.set('id',f'left-final-{i}');g.append(p)
t.write(str(out/'color-combined.svg'))
for n in ['alpha-combined.svg','config.json']:(out/n).write_bytes((src/n).read_bytes())
(out/'local-gap-report.json').write_text(json.dumps({'base':'v3','nativeRingIndex':5920,'nativeRingBounds':ring['box'],'nativeRingArea':abs(ring['area']),'closureArea':harea,'addedClosureAreaUpperBound':harea-abs(ring['area']),'closureBounds':hbounds,'globalAlphaUnchanged':True,'originalGameIllustrationUnchanged':True,'method':'Local mask closure only. Paint is unchanged existing native field; measured seam endpoints and adjacent complete native facet determine closure. No new fill/texture/blur. Needs visual review.'},indent=2));print(out)

# Re-union actual per-field alpha after local registration. Retaining the old
# global union preserved a subpixel internal slit at x0,y781.86..802.29.
r=m.root()
for name,file in [('center',src/'center-alpha-final.svg'),('left',out/'left-alpha.svg'),('right',src/'right-alpha-final.svg')]:
 t=E.parse(str(file));m.path(r,' '.join(p.get('d') for p in t.findall('.//'+m.NS+'path')),name)
run(r,['select-all','path-union'],'alpha-reunion')
(out/'alpha-reunion-report.json').write_text(json.dumps({'oldGlobalAlpha':str(src/'alpha-combined.svg'),'newGlobalAlpha':str(out/'alpha-reunion.svg'),'reason':'actual local alpha changed; old union retained a subpixel slit at x0,y781.86..802.29','status':'west Native line no longer observed; full art remains unapproved'},indent=2))
