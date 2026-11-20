"""Disposable detection and byte-exact Stage18 reference normalization."""
import argparse,json,sys,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from importlib.util import spec_from_file_location,module_from_spec
spec=spec_from_file_location("splice",Path(__file__).resolve().parent/"parser.py"); toolbox=module_from_spec(spec);spec.loader.exec_module(toolbox)
child,array,git_blob,sha256=toolbox.child,toolbox.array,toolbox.git_blob,toolbox.sha256

EXPECTED=['sb-b-left','sb-b-screen','sb-b-spirit-high','sb-c-bat-front','sb-d-lamp','sb-e-front','sb-f-tool-west','sb-g-front','sb-g-bat-high','act2-keeper']
ORDINALS=[4,5,6,8,11,13,16,17,18,22]
EMPTY=['entry-front','entry-rear','entry-roof','court-spirits','west-crown','east-ledge','basin-east','lower-flank','maintenance-watch','keeper-flank','west-crown-air','east-arc-air']
def choose(s,d,scope):
 if scope=='raw-campaign':
  positions=[(i,a) for i,(v,_,a,_,_,_) in enumerate(array(s,child(s,0,'stages'))) if v['metadata']['stageId']==18]
  assert len(positions)==1 and positions[0][0]==17
  return [('stages[17]',positions[0][1],d['stages'][17])]
 if scope=='compact-package':
  return [(k,child(s,0,k),d[k]) for k in ('source','stage')]
 return [('compiled-stage',0,d)]
def signature(st):
 out=[]
 for i,g in enumerate(st['encounters'],1):
  for uid in g['unitIds']:
   if uid in EXPECTED:out.append((uid,i,g['key'],g['behavior']))
 return out
def plan(raw,scope):
 s=raw.decode();d=json.loads(s)
 targets=choose(s,d,scope)
 rep=[];answers=[]
 for label,start,st in targets:
  assert st['metadata']['stageId']==18
  compact=st['initialState'].get('honroAct2CompactRevision',0)==1
  assert (st['width'],st['height'])==((8200,7000) if compact else (13600,9600))
  all_ids={u['id'] for u in st['units']}
  assert len(all_ids)==len(st['units'])
  actual=[u['id'] for u in st['units'] if u['team']=='enemy']
  assert actual==EXPECTED,actual
  groups=list(array(s,child(s,start,'encounters')))
  assert len(groups)==22 and len({g['id'] for g,*_ in groups})==22
  removed=[];changed=0;emptied=[]
  for g,_,p,*_ in groups:
   i=child(s,p,'unitIds')
   items=list(array(s,i))
   drop=[x for x,(uid,*_) in enumerate(items) if uid not in all_ids]
   if not drop:continue
   changed+=1
   removed.extend(items[x][0] for x in drop)
   kept=[x for x in range(len(items)) if x not in drop]
   if not kept:
    emptied.append(g['id'])
    # Preserve leading/trailing whitespace just inside the list.
    rep.append((items[0][2],items[-1][3]))
    continue
   for k in range(len(items)):
    if k not in drop or (k>0 and k-1 in drop):continue
    z=k
    while z+1 in drop:z+=1
    if z+1<len(items):rep.append((items[k][1],items[z][4]+1))
    else:rep.append((items[k-1][4],items[z][3]))
  assert changed==21 and len(removed)==len(set(removed))==45 and emptied==EMPTY
  assert all(e in st['initialState']['honroBellActivation'] and e in st['initialState']['honroEncounterDensityActivation'] for e in emptied)
  answers.append(dict(container=label,dimensions=[st['width'],st['height']],mapCompactMode=compact,groupRows=22,liveEnemyIds=actual,numericGroups=ORDINALS,removedReferences=len(removed),emptyGroupsPreserved=emptied,affectedGroupRows=changed,staleIds=removed))
 parts=[];last=0
 rep.sort()
 for a,b in rep:
  assert a>=last and b>a
  parts.append(s[last:a]);last=b
 parts.append(s[last:]);out=''.join(parts).encode()
 e=json.loads(out);new=choose(out.decode(),e,scope)
 for (_,_,st),(_,_,fixed) in zip(targets,new):
  existing={u['id'] for u in st['units']}
  assert fixed['encounters']==[{**g,'unitIds':[id for id in g['unitIds'] if id in existing]} for g in st['encounters']]
  assert signature(st)==signature(fixed)
  assert [ord for _,ord,*_ in signature(fixed)]==ORDINALS
  fixed['encounters']=st['encounters']
 assert d==e,'Difference outside allowlisted unitIds lists'
 spans=[[len(s[:a].encode()),len(s[:b].encode())] for a,b in rep]
 assert out==b''.join(raw[x:y] for x,y in zip([0]+[b for _,b in spans],[a for a,_ in spans]+[len(raw)]))
 return out,dict(scope=scope,oldRawBytes=len(raw),newRawBytes=len(out),oldGitBlob=git_blob(raw),newGitBlob=git_blob(out),oldSHA256=sha256(raw),newSHA256=sha256(out),preservedOutsideExactSpans=True,containerStats=answers,removedByteSpans=spans)
if __name__=='__main__':
 p=argparse.ArgumentParser()
 p.add_argument('scope',choices=['raw-campaign','compact-package','compiled-fixture']);p.add_argument('source',type=Path);p.add_argument('disposable_output',type=Path);p.add_argument('evidence',type=Path)
 p.add_argument('--expect-blob')
 a=p.parse_args();raw=a.source.read_bytes()
 if a.expect_blob:assert git_blob(raw)==a.expect_blob
 out,result=plan(raw,a.scope)
 a.disposable_output.write_bytes(out)
 a.evidence.write_text(json.dumps(result,indent=2)+'\n')
