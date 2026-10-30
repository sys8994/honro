from pathlib import Path
import xml.etree.ElementTree as E, subprocess,os,json,csv
D=Path('art/stone-cover-density-v2'); ns='{http://www.w3.org/2000/svg}';r=E.parse(D/'split.svg');b={x[0]:list(map(float,x[1:]))for x in csv.reader(open(D/'split-bounds.csv')) if len(x)==5}; drop=[];keep={};palette={'7':'#596354','6':'#59676c','5':'#4c5e64','4':'#596354','3':'#3c4d54','2':'#303e44','1':'#303e44'}
for g in r.iter(ns+'g'):
 if not g.get('id','').startswith('layer-path'):continue
 k=g.get('id')[-1]; keep[k]=[]
 for p in g.findall(ns+'path'):
  x,y,w,h=b[p.get('id')];tiny=w*h<500 and not(max(w,h)>50 and max(w,h)/max(1,min(w,h))>4)
  if k!='7' and tiny:drop.append({'id':p.get('id'),'layer':k,'bounds':[x,y,w,h]})
  else:keep[k].append(p.get('id'))
a=[]
if drop:a+=['select-by-id:'+','.join(p['id']for p in drop),'delete-selection','select-clear']
for k,ids in keep.items():
 a+=['select-by-id:'+','.join(ids),'path-combine','object-set-attribute:style,fill:'+palette[k],'select-clear']
a+=['export-filename:'+str(D/'art-master.svg'),'export-do'];(D/'edit-actions.txt').write_text(';'.join(a));env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/stone-cover-profile','XDG_CACHE_HOME':'/tmp/stone-cover-cache'}
p=subprocess.run(['inkscape',str(D/'split.svg'),'--batch-process','--actions='+ ';'.join(a)],env=env,capture_output=True,text=True);assert p.returncode==0,p.stderr
(D/'art-edit-report.json').write_text(json.dumps({'source':'stage35 old-wall-final.svg already optimized','scope':'Intentional visual redesign, not fidelity-preserving optimization','removedComponents':drop,'retainedComponents':{k:len(v)for k,v in keep.items()},'palette':palette,'selectionRule':'Interior source subpaths bbox area <500source px2, except longthin structural seams; base silhouette retained. Native Inkscape split/delete/combine and recolor. Final visual inspection required.'},indent=2));print('removed',len(drop),'retained',sum(map(len,keep.values())))
# A second inspected art pass merges adjacent stone-face colors and shadow colors.
# Union is native Inkscape, not a hand-authored geometry replacement.
import shutil
shutil.copyfile(D/'art-master.svg',D/'first-pass-speckle-cleaned.svg')
a2='select-by-id:path7,path151;object-set-attribute:style,fill:#566058;select-clear;select-by-id:path6,path5;object-set-attribute:style,fill:#53636a;path-union;select-clear;select-by-id:path249;object-set-attribute:style,fill:#45555b;select-clear;select-by-id:path331,path436;object-set-attribute:style,fill:#35434a;path-union;export-filename:'+str(D/'art-master.svg')+';export-do'
(D/'merge-actions.txt').write_text(a2)
p=subprocess.run(['inkscape',str(D/'art-master.svg'),'--batch-process','--actions='+a2],env=env,capture_output=True,text=True);assert p.returncode==0,p.stderr
report=json.loads((D/'art-edit-report.json').read_text());report['secondPass']={'reason':'First pass left overly busy internal stone facets at actual1.1camera; retain main stones with four quieter role colors','palette':['#566058','#53636a','#45555b','#35434a'],'nativeUnions':[['path6','path5'],['path331','path436']],'noFurtherApproximation':'Existing optimized contours retained; after redesign no additional geometric simplification needed for current engine budget.'};(D/'art-edit-report.json').write_text(json.dumps(report,indent=2))
