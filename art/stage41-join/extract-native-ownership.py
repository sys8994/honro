#!/usr/bin/env python3
"""Stage41 candidate only: existing native rock contours + Inkscape Booleans.
No source art, runtime, collision, palette, or hand-authored contour changes.
Run from repo root: python art/stage41-join/extract-native-ownership.py
"""
from pathlib import Path
import json, hashlib, os, subprocess, sys, copy
import xml.etree.ElementTree as E
from svgpathtools import parse_path
ROOT=Path.cwd(); O=ROOT/'art/stage41-join'; O.mkdir(exist_ok=True)
NS='http://www.w3.org/2000/svg'; E.register_namespace('',NS)
westfile=ROOT/'shared/assets/environment/act5/camp-west-geology.json'
sourcefile=ROOT/'shared/assets/environment/act5/near-import.json'
W=json.loads(westfile.read_text())['vector']; S=next(a['vector'] for a in json.loads(sourcefile.read_text()) if a['id']==41)
westOld='M-1400 -500H300V560L190 650Q200 720 300 750V1200H-1400Z'
sourceWestHole='M0 0H300V560L190 650Q200 720 300 750V827H0Z'
sourceFrame='M-10000 -10000H10000V10000H-10000Z'
sourceEastKeep='M0 0H1902V350H1796V428H1838V438Q1841 456 1820 466Q1790 476 1790 488Q1794 505 1820 514V530H1902V827H0Z'
overlay='M300 428H1838V438H300ZM300 514H1902V529H300ZM0 545Q35 546 70 548L130 555L220 562L280 566L300 557V565L280 574L220 570L130 563L70 556Q35 550 0 545Z'
# These are verbatim existing native contours, not newly drawn polygon edges.
rows=W['root']['children'][0]['children'][0]['children'][0]['children']
def extract(k,i):
 n=rows[k];p=parse_path(n.get('d') or ' '.join(n['dParts'])).continuous_subpaths()[i]
 return p.scaled(1.1).translated(complex(-1300,-100)).d()+' Z'
upper=extract(5,48);lower=extract(6,57)
props=parse_path(S['clips']['b'][0]).scaled(1.0010526315789474,0.998792270531401).d()
def svg(name,paths):
 r=E.Element('{'+NS+'}svg',viewBox='0 540 430 320',width='860',height='640')
 for i,d in enumerate(paths):E.SubElement(r,'{'+NS+'}path',id='p'+str(i),d=d,fill='#000000',**{'fill-rule':'nonzero'})
 f=O/(name+'.svg');E.ElementTree(r).write(f,encoding='utf-8',xml_declaration=True);return f
runs=[]
def readpaths(f):return [p.get('d')for p in E.parse(f).findall('.//{'+NS+'}path')if p.get('d')]
def boolean(name,paths,op):
 inp=svg(name+'-input',paths);out=O/(name+'-native.svg')
 env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'}
 head=Path('/tmp/honro-inkscape-headless-init.so')
 if head.exists():env['LD_PRELOAD']=str(head)
 actions=f'select-all;path-{op};select-clear;export-plain-svg;export-filename:{out};export-do'
 p=subprocess.run(['inkscape',str(inp),'--batch-process','--actions='+actions],capture_output=True,text=True,env=env);p.check_returncode()
 if not out.exists():raise RuntimeError(p.stdout+p.stderr)
 runs.append({'name':name,'operation':op,'input':inp.name,'output':out.name});return readpaths(out)
svg('native-upper-contour',[upper]);svg('native-lower-contour',[lower]);svg('original-west',[westOld])
protected=boolean('protected-native-props-and-overlay',[props,overlay],'union')
upperAdded=boolean('upper-outside-old-west',[upper,westOld],'difference')
lowerAdded=boolean('lower-outside-old-west',[lower,westOld],'difference')
# Parent explicitly requested the smallest upper-rock candidate first. Lower is diagnostic only.
allowed=boolean('upper-addition-with-protection',[' '.join(upperAdded),' '.join(protected)],'difference')
west=boolean('west-final',[westOld,' '.join(allowed)],'union')
oldSource=boolean('source-west-old',[sourceFrame,sourceWestHole],'difference')
oldSource=boolean('source-main-original',[' '.join(oldSource),sourceEastKeep],'intersection')
sourceMain=boolean('source-main-final',[' '.join(oldSource),' '.join(allowed)],'difference')
# Closed-boundary ownership check. This must be empty: protected pixels cannot change owner.
violations=boolean('protected-loss-check',[' '.join(allowed),' '.join(protected)],'intersection')
if violations:raise AssertionError('New ownership overlaps protected source props/overlay')
# Shape-preserving simplification; original/native source files remain separate.
optimizations={}
for stem in ['west-final','source-main-final']:
 native=O/(stem+'-native.svg');opt=O/(stem+'-optimized.svg')
 if opt.exists():raise RuntimeError('Candidate exists; do not overwrite prior evidence')
 cmd=[sys.executable,str(ROOT/'tools/terrain-node-optimizer/optimize_svg.py'),str(native),str(opt),'--epsilon','.05','--render-widths','860,1720','--max-mean-error','.0005','--max-changed-fraction','.002']
 env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'}
 if Path('/tmp/honro-inkscape-headless-init.so').exists():env['LD_PRELOAD']='/tmp/honro-inkscape-headless-init.so'
 p=subprocess.run(cmd,capture_output=True,text=True,env=env);p.check_returncode();optimizations[stem]=json.loads(opt.with_suffix('.svg.report.json').read_text())
result={'version':1,'status':'candidate awaiting production-screen review','coordinates':'original stage41 near-asset coordinates; no runtime transform baked','west':readpaths(O/'west-final-optimized.svg'),'sourceMain':readpaths(O/'source-main-final-optimized.svg'),'eastChanged':False,'sourceOverlayUnchanged':True,'addedWestRegion':allowed,'protectedSource':protected,'method':'native west outer contour root/0/0/0/5 subpath48 minus old west ownership, minus exact original props and existing source overlay; union with old west; same region subtracted from old sourceMain via Inkscape Boolean','sourceHashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()for p in[westfile,sourcefile]},'lowerCandidate':{'included':False,'reason':'parent requested smallest upper-rock candidate first','outsideOldWestNonempty':bool(lowerAdded)},'checks':{'protectedSourceLossEmpty':not violations,'westOptimizationAccepted':optimizations['west-final']['accepted'],'sourceOptimizationAccepted':optimizations['source-main-final']['accepted']}}
(O/'ownership-mask.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(O/'boolean-report.json').write_text(json.dumps({'operations':runs,'notes':['No collision/source asset/runtime changes','Lower rock is not added','West addition replaces old nonwalk body pixels but excludes native props and source overlay','Visual/native source-rock preservation is pending parent scene review']},indent=2)+'\n')
print(json.dumps({'json':str(O/'ownership-mask.json'),'checks':result['checks'],'lowerCandidate':result['lowerCandidate']},ensure_ascii=False))
