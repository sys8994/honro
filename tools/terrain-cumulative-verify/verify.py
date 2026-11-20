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
 stage_ids=[1,2,3,7,12,13,14,15,18,21,22,28,33,36,38,41,46]
 leaves={i:{k:seen[manifest[k][i-1]] for k in ('stages','stageLibraries')} for i in stage_ids}
 return {'entry':seen[entry],'campaign':seen[main],'htmlSHA256':sha(html),'reachableCount':len(seen),'reachablePathsSHA256':sha('\n'.join(sorted(seen)).encode()),'selected':leaves,'reachable':seen,'referenceDocument':manifest}
def main():
 base,target,out=map(Path,sys.argv[1:])
 a,b=map(references,(base,target))
 try:
  # Final C is the independently verified normal App used in the prior stage22/13/18/21 receipts.
  assert b['entry']['sha256']=='3b3ba95261b2b7588447e1b9ee5db8fee4bdb72692e5153a356054fd26b660b0',b['entry']
  expected={
   (13,'stageLibraries'):'020145b2013aecef5eef8187ffe2e16c4db5ab202c93b484809efa4ec762b395',
   (18,'stages'):'3de327a62316f5707210c4db4ca189d2e4396e1f5c6631d1adab6000f46e9e2f',
   (21,'stages'):'9b3c8adba281f3b6a0cb21bfdb6b76b862a312044675370d079dec23f2d014a1',
   (22,'stages'):'a8be99a3221a730acd6692d5c27867e2e46fc6d896404e6092e3948dccd02888'}
  for (i,k),h in expected.items():assert b['selected'][i][k]['sha256']==h,(i,k,b['selected'][i][k])
  compact=[p for p in b['reachable'] if re.fullmatch(r'web/data/HONRO_ACT2_COMPACT_PACKAGES-parts\.[0-9a-f]{16}\.json',p)]
  assert len(compact)==1,compact
  descriptor=json.loads((target/compact[0]).read_bytes())
  assert descriptor['sha256']=='82949dbcdb5bb13b5e4813d8382f837d3ff4baaa85975540a99ff9e2e8f36d89'
  for i in (1,2):assert a['selected'][i]==b['selected'][i],('reference leaf changed',i,a['selected'][i],b['selected'][i])
  allowed={'stages':{18,21,22,28,33},'stageLibraries':{3,12,13,15,28,33,36,38}}
  # Report every actual immutable stage leaf owner. An unfamiliar changed row is a stop, not hidden.
  differences={k:[i for i,(x,y) in enumerate(zip(a['referenceDocument'][k],b['referenceDocument'][k]),1) if x!=y] for k in allowed}
  (out/'packet-owner-diff.json').write_text(json.dumps(differences,indent=2))
  assert all(set(differences[k])<=allowed[k] for k in allowed),differences
 finally:
  for name,v in [('stock',a),('target',b)]:
   v.pop('referenceDocument')
   (out/(name+'-dag.json')).write_text(json.dumps(v,indent=2)+'\n')
if __name__=='__main__':main()
