import hashlib,json, re, sys
from pathlib import Path
from urllib.parse import urlunsplit
def sha(b):return hashlib.sha256(b).hexdigest()
def one(e,s):
 p=set(re.findall(e,s));assert len(p)==1,(e,list(p)[:5]);return p.pop()
ADDR=re.compile(r'^(web/[A-Za-z0-9_.\-/]+)\.([a-f0-9]{16})\.([A-Za-z0-9]+)$')
TOKENS=re.compile(r'["\x27]((?:web/|\.\./runtime/|\./)[A-Za-z0-9_.\-/]+\.[a-f0-9]{16}\.[A-Za-z0-9]+)["\x27]')
def references(root):
 seen={}
 def audit(p):
  if p.startswith(('./','../runtime/')): p='web/runtime/'+p.rsplit('/',1)[-1]
  if p in seen:return
  m=ADDR.fullmatch(p);assert m,p
  located=(root/p).resolve();assert located.is_relative_to(root.resolve())
  raw=located.read_bytes();h=sha(raw);assert h[:16]==m[2],(p,h)
  seen[p]={'path':p,'sha256':h,'bytes':len(raw)}
  def walk(q):
   if isinstance(q,str) and ADDR.fullmatch(q):audit(q)
   elif isinstance(q,list):
    for x in q:walk(x)
   elif isinstance(q,dict):
    for x in q.values():walk(x)
  if p.endswith('.js'):
   for x in TOKENS.findall(raw.decode()):audit(x)
  if p.endswith('.json'):
   q=json.loads(raw);walk(q)
   if isinstance(q,dict) and '$honroJsonParts' in q:
    parts=[]
    for x in q['parts']:
     a=seen[x['path']];assert (a['bytes'],a['sha256'])==(x['bytes'],x['sha256']),x['path'];parts.append((root/x['path']).read_bytes())
    joined=b''.join(parts);assert (len(joined),sha(joined))==(q['bytes'],q['sha256'])
    walk(json.loads(joined))
 html=(root/'HONRO.html').read_bytes()
 entry=one(r'web/entries/game\.[0-9a-f]{16}\.js',html.decode());audit(entry)
 main=one(r'web/data/campaign\.[0-9a-f]{16}\.json',(root/entry).read_text())
 manifest=json.loads((root/main).read_bytes());assert len(manifest['stages'])==50
 stage_ids=[2,4,5,6,8,9,10]
 leaves={i:{k:seen[manifest[k][i-1]] for k in ('stages','stageLibraries')} for i in stage_ids}
 return {'entry':seen[entry],'campaign':seen[main],'htmlSHA256':sha(html),'reachableCount':len(seen),'reachablePathsSHA256':sha('\n'.join(sorted(seen)).encode()),'selected':leaves,'reachable':seen,'referenceDocument':manifest}
