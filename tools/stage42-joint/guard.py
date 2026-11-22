"""Normal build-one in isolated worktree; launch blocked until exact QA authorization."""
import base64,gzip,hashlib,json,os,re,subprocess,sys
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
A=P['stock'];H=P['historical'];PR=P['profile'];IDX=P['compilerStageIndex'];M='web/manifest.json';SRC=next(v for v in A['source']if v['file'].endswith('/near-import.json'))
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def rd(r,p):
 q=r/p;assert q.is_file() and not q.is_symlink() and q.resolve().is_relative_to(r.resolve()),p
 return q.read_bytes()
def git(r,*a):return subprocess.check_output(['git','-C',r,*a],text=True,timeout=90).strip()
def save(w,k,v):(w/'out'/k).write_text(json.dumps(v,indent=2)+'\n')
def leaves(v):return v['root']['children'][0]['children']
def edit_range(raw):
 text=raw.decode('utf-8'); dec=json.JSONDecoder();n=0;match=None
 def gap(i):
  while i<len(text) and text[i] in ' \t\r\n':i+=1
  return i
 i=gap(0); assert text[i]=='[';i=gap(i+1)
 while text[i]!=']':
  q,k=dec.raw_decode(text,i);n+=1
  if str(q['id'])=='42':
   assert q['id']==42 and not match
   match=(i,k,q)
  i=gap(k)
  assert text[i] in ',]'
  if text[i]==',':i=gap(i+1)
 assert match and n>=10 and gap(i+1)==len(text)
 left,right,o=match;part=text[left:right]
 before=json.loads(part); v=before['vector']
 ed=(D/'RECIPE.b64').read_bytes();assert fact(ed)['sha256']==P['recipeSHA256']
 recipe=json.loads(gzip.decompress(base64.b64decode(ed.strip(),validate=True)))
 assert [e['i']for e in recipe]==[2,3,4,5,6,7,8,9,10,12,13,14,15]
 for e in recipe:
  k=e['i'];leaf=leaves(v)[k];key='sourcePath'
  assert set(leaf)=={'tag','sourcePath','fill'} and isinstance(leaf[key],str) and leaf['tag']=='path'
  a=leaf[key];b=e['new']
  assert len(a)<=60000 and len(b)<=60000,'preserveCompound must produce a single exact d for both source versions'
  assert fact(a.encode())['sha256']==e['oldSHA256'] and '\n' not in b and b and a!=b
  # Input D strings contain only SVG ASCII grammar; JSON.stringify of D is lexical.
  u=json.dumps(a);r=json.dumps(b)
  assert part.count(u)==1,(k,'canonical path-to-leaf anchor')
  part=part.replace(u,r,1)
  leaf[key]=b
 assert json.loads(part)==before
 newer=(text[:left]+part+text[right:]).encode()
 assert len(newer)<len(raw)
 return newer
