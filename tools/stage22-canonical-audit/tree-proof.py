"""Estimate the exact Git tree without writing the Git index/object database."""
import argparse,hashlib,json,subprocess
from pathlib import Path
STEPS=('shared','data','campaign.json')

def tree_hash(rows):
 def key(r):return (r['path']+('/' if r['type']=='tree' else '')).encode()
 data=b''.join((r['mode'].lstrip('0')+' '+r['path']).encode()+b'\0'+bytes.fromhex(r['sha']) for r in sorted(rows,key=key))
 return hashlib.sha1(b'tree '+str(len(data)).encode()+b'\0'+data).hexdigest()

def predict(snapshots,new,expect):
 for stage in snapshots:assert tree_hash(stage['leaves'])==stage['top']
 for target,s in zip(STEPS,snapshots):
  match=[a for a in s['leaves'] if a['path']==target]
  assert len(match)==1
  if target!='campaign.json':
   n=STEPS.index(target);assert match[0]['sha']==snapshots[n+1]['top']
  else:assert match[0]['sha']==expect
 for target,s in reversed(list(zip(STEPS,snapshots))):
  new=tree_hash([{**r,'sha':new} if r['path']==target else r for r in s['leaves']])
 return new
if __name__=='__main__':
 import sys
 wd,summary,out=map(Path,sys.argv[1:4])
 data=json.loads(summary.read_text())
 def git(*args):return subprocess.check_output(['git','-C',str(wd),*args])
 root=git('rev-parse','HEAD^{tree}').decode().strip()
 assert root=='016a8f2ace84f0290a0d7d89c7f7e7f45612b09d'
 selected=root;snapshots=[]
 for key in STEPS:
  rows=[]
  for item in git('ls-tree','-z',selected).split(b'\0'):
   if not item:continue
   meta,name=item.split(b'\t',1);mode,kind,sha=meta.decode().split()
   rows.append(dict(path=name.decode(),mode=mode,type=kind,sha=sha))
  snapshots.append(dict(top=selected,leaves=rows))
  selected=next(q['sha'] for q in rows if q['path']==key)
 assert selected==data['oldGitBlob']
 assert predict(snapshots,selected,selected)==root
 expect=predict(snapshots,data['newGitBlob'],selected)
 out.write_text(json.dumps(dict(oldRootTree=root,expectedProductTree=expect,changedPath='shared/data/campaign.json',oldRawBlob=selected,newRawBlob=data['newGitBlob'],method='Pure object SHA1 reconstruction of exactly product root/shared/data path; no commit or object writes'),indent=2)+'\n')
