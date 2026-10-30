#!/usr/bin/env python3
"""Scoped material palette trials via actual Inkscape. Never rewrites source packages."""
import os,subprocess,json,hashlib,re,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
S={33:('body-runtime.svg',{'path9':'#4c6070','path8,path7,path6':'#80704a','path5,path4':'#3c5261','path3':'#746443','path2,path1':'#2d4350'},['path8,path7,path6','path5,path4','path2,path1'],['path11','path10']),37:('body-clean.svg',{'path8,path5':'#3b4653','path4,path3':'#303b48'},['path4,path3'],['path11','path10','path9','path7','path6']),39:('body-contact-preserved.svg',{'path7,path6':'#394758','path5,path4':'#303e50'},['path7,path6','path5,path4'],['path11','path10','path9','path8']),40:('body-grid001.svg',{'path7,path4':'#45576a','path3,path2':'#35495b'},['path3,path2'],['path9','path8','path6','path5'])}
env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-density-coast-profile','XDG_CACHE_HOME':'/tmp/honro-density-cache'}
def run(*a):subprocess.run(a,check=True,env=env,stdout=subprocess.DEVNULL)
def paths(f):return {e.get('id'):e for e in E.parse(f).getroot().iter() if e.tag.endswith('path')}
def stats(f):
 ps=paths(f);return {'bytes':f.stat().st_size,'paths':len(ps),'explicitCommandLetters':sum(len(re.findall('[a-zA-Z]',e.get('d',''))) for e in ps.values()),'segments':sum(len(parse_path(e.get('d',''))) for e in ps.values())}
for n,(src,mapping,groups,protected) in S.items():
 old=Path(f'art/stage{n}-vector-production');p=Path(f'art/stage{n}-density-v2');p.mkdir(exist_ok=True);source=old/src;a=json.loads((old/'body-asset.json').read_text());trans=[]
 def walk(node):
  if 'transform'in node:trans.append(node['transform'])
  for c in node.get('children',[]):walk(c)
 walk(a['vector']['root']);assert len(trans)==1,trans
 cfg={'id':f's{n}-density:body','name':a['name']+' 저대비 시험','semanticLayer':'BODY','category':a['category'],'bounds':a['bounds'],'anchor':a['anchor'],'foot':a['reference']['foot'],'transform':trans[0],'bodyClip':a['vector']['clips']['authoredBody'],'params':{**a['params'],'densityRevision':2,'artEdit':'Material-scoped actual Inkscape palette edits; intentional new art master, not fidelity to old palette.'}};cfg['params'].pop('nodeCount',None);(p/'body-config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2))
 actions=';'.join(f'select-clear;select-by-id:{ids};object-set-property:fill,{color}' for ids,color in mapping.items())
 run('inkscape',str(source),'--export-plain-svg','--export-type=svg',f'--export-filename={p}/body-palette.svg',f'--actions={actions}')
 current=p/'body-palette.svg';trials=[]
 for i,g in enumerate(groups):
  trial=p/f'body-union-trial-{i}.svg';run('inkscape',str(current),'--export-plain-svg','--export-type=svg',f'--export-filename={trial}',f'--actions=select-by-id:{g};path-union')
  before,after=stats(current),stats(trial);accept=after['bytes']<before['bytes'] and after['segments']<=before['segments'];
  safety=True
  if accept:
   try:run('python','tools/vector-production/import-svg.py',str(trial),'--config',str(p/'body-config.json'),'--output',f'/tmp/coast-body-{n}-test.json')
   except subprocess.CalledProcessError:safety=False;accept=False
  trials.append({'group':g,'before':before,'after':after,'accepted':accept,'strictImportPassed':safety})
  if accept:current=trial
 final=p/'body-final.svg';final.write_bytes(current.read_bytes())
 try:run('python','tools/vector-production/import-svg.py',str(final),'--config',str(p/'body-config.json'),'--output',str(p/'body-asset.json'))
 except subprocess.CalledProcessError:
  final.write_bytes((p/'body-palette.svg').read_bytes());run('python','tools/vector-production/import-svg.py',str(final),'--config',str(p/'body-config.json'),'--output',str(p/'body-asset.json'));trials.append({'strictImportFallback':'Retain palette master; union output rejected by importer.'})
 for f in p.glob('body-union-trial-*.svg'):f.unlink()
 op,np=paths(source),paths(final)
 protected_exact={k:all(op[k].get(attr)==np[k].get(attr) for attr in ['d','style','fill','transform']) for k in protected};assert all(protected_exact.values())
 report={'source':str(source),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'tool':'Inkscape 1.4 actual headless palette and contiguous draw-stack unions','paletteEdits':mapping,'protectedPathsExact':protected_exact,'unionTrials':trials,'stats':{'existingFinal':stats(source),'palette':stats(p/'body-palette.svg'),'final':stats(final)},'runtimeBytes':{'old':(old/'body-asset.json').stat().st_size,'new':(p/'body-asset.json').stat().st_size},'limits':{'expandedNodes':512,'depth':24,'pathCharacters':60000},'visualApproval':'Pending direct asset normal/max and full scene review'};(p/'body-edit-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(n,report['runtimeBytes'],flush=True)
