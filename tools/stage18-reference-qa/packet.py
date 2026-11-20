import sys,re,json,hashlib
from pathlib import Path
from splice import signature,EXPECTED
stock,after,out=map(Path,sys.argv[1:])
def match(expr,s):
 a=set(re.findall(expr,s));assert len(a)==1,(expr,a)
 return a.pop()
def read(root):
 h=(root/'HONRO.html').read_text()
 e=match(r'web/entries/game\.[0-9a-f]{16}\.js',h)
 entry=(root/e).read_text()
 m=match(r'web/data/campaign\.[0-9a-f]{16}\.json',entry)
 doc=json.loads((root/m).read_bytes());p=doc['stages'][17]
 return (h,e,entry,m,doc,p,(root/p).read_bytes())
a,b=read(stock),read(after)
assert a[0].replace(a[1],b[1])==b[0]
# The game entry may also embed name-hashed noncampaign release pieces that
# derive from the compact map source. Require raw active map equality outside 18.
assert a[5]!=b[5],'Stage18 did not flow through default normal build'
def urls(v):
 if isinstance(v,str):
  if v.startswith('web/'):yield v
 elif isinstance(v,list):
  for x in v: yield from urls(x)
 elif isinstance(v,dict):
  for x in v.values(): yield from urls(x)
index=[]
for url in sorted(set(urls(a[4]))-{a[5]}):
 if (stock/url).is_file():
  r=(stock/url).read_bytes();assert r==(after/url).read_bytes(),url
  index.append([url,hashlib.sha256(r).hexdigest()])
b[4]['stages'][17]=a[5]
assert a[4]==b[4],'Global campaign manifest differs outside Stage18 map filename'
old,new=[json.loads(v[6]) for v in (a,b)]
nunits={u['id'] for u in old['units']}
assert len(old['encounters'])==len(new['encounters'])==22
assert [u['id'] for u in old['units'] if u['team']=='enemy']==EXPECTED
assert len([i for g in old['encounters'] for i in g['unitIds'] if i not in nunits])==45
assert new['encounters']==[{**g,'unitIds':[u for u in g['unitIds'] if u in nunits]} for g in old['encounters']]
assert signature(old)==signature(new)
new['encounters']=old['encounters'];assert old==new
(out/'packet-proof.json').write_text(json.dumps({'stage18':[a[5],b[5]],'stage18SHA256':[hashlib.sha256(v[6]).hexdigest() for v in (a,b)],'campaignOtherReferencedFilesChecked':index,'onlyStage18MapURIInManifest':True,'stage18Only45ObsoleteReferences':True,'verifiedStage22MapURI':a[4]['stages'][21]},indent=2))
