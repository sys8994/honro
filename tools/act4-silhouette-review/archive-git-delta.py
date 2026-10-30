"""Immutable tracked Git delta with deletion/mode/SHA proof and exact temporary-index replay."""
import subprocess,json,zipfile,hashlib,os,tempfile,sys
from pathlib import Path
base,target,destination=sys.argv[1:];run=lambda *args,**kw:subprocess.check_output(['git',*args],**kw);head=run('rev-parse',target).decode().strip();base=run('rev-parse',base).decode().strip();tree=run('rev-parse',head+'^{tree}').decode().strip();bt=run('rev-parse',base+'^{tree}').decode().strip();z=Path(destination);z.parent.mkdir(parents=True,exist_ok=True);entries=[]
def entry(ref,path):
 raw=run('ls-tree','-z',ref,'--',path)
 if not raw:return None
 left,name=raw.rstrip(b'\0').split(b'\t',1);mode,typ,oid=left.decode().split();return {'mode':mode,'type':typ,'gitBlob':oid}
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as f:
 for raw in run('diff','--name-only','-z','--no-renames',base,head).split(b'\0'):
  if not raw:continue
  path=raw.decode();old=entry(base,path);new=entry(head,path);row={'path':path,'operation':'delete' if new is None else 'add' if old is None else 'modify','before':old,'after':new}
  if new:
   data=run('cat-file','blob',new['gitBlob']);row.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest());info=zipfile.ZipInfo('files/'+path);info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=(int(new['mode'],8)&0xffff)<<16;f.writestr(info,data)
  entries.append(row)
 manifest={'format':'honro-git-tracked-delta-v1','baseCommit':base,'baseTree':bt,'targetCommit':head,'targetTree':tree,'source':'immutable Git objects only, never live worktree','uncommittedFilesIncluded':False,'apply':'On exact base tree, apply files entries preserving modes; remove delete entries; verify SHA and exact target Git tree. Mode120000 stores symlink target bytes.','entries':entries};f.writestr('MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
# Replay bytes in temporary index; real worktree/index stay untouched.
with zipfile.ZipFile(z) as f,tempfile.TemporaryDirectory(prefix='honro-delta-verify-') as tmp:
 env={**os.environ,'GIT_INDEX_FILE':tmp+'/index'};subprocess.run(['git','read-tree',base],env=env,check=True);lines=[]
 for e in entries:
  if e['after']:
   data=f.read('files/'+e['path']);assert hashlib.sha256(data).hexdigest()==e['sha256'];oid=run('hash-object','--stdin',input=data).decode().strip();assert oid==e['after']['gitBlob'];lines.append(f"{e['after']['mode']} {oid}\t{e['path']}\n")
  else:lines.append(f"0 {'0'*40}\t{e['path']}\n")
 subprocess.run(['git','update-index','--index-info'],input=''.join(lines).encode(),env=env,check=True);actual=run('write-tree',env=env).decode().strip();assert actual==tree
r={'path':str(z),'sha256':hashlib.sha256(z.read_bytes()).hexdigest(),'bytes':z.stat().st_size,'base':base,'baseTree':bt,'HEAD':head,'tree':tree,'changedPaths':len(entries),'deletions':sum(e['operation']=='delete' for e in entries),'archiveBlobSHAAndTemporaryIndexExactTreeReplay':True};z.with_suffix('.receipt.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
