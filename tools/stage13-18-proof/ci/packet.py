import sys,re,json,hashlib
from pathlib import Path
from splice import plan
from range import change
stock,after,out=map(Path,sys.argv[1:])
def match(expr,s):
 a=set(re.findall(expr,s));assert len(a)==1,(expr,a)
 return a.pop()
def docs(root):
 h=(root/'HONRO.html').read_text()
 e=match(r'web/entries/game\.[0-9a-f]{16}\.js',h)
 entry=(root/e).read_text()
 m=match(r'web/data/campaign\.[0-9a-f]{16}\.json',entry)
 doc=json.loads((root/m).read_bytes())
 return (h,e,entry,m,doc)
a,b=docs(stock),docs(after)
assert a[0].replace(a[1],b[1])==b[0]
am,bm=a[4],b[4]
a13,b13=am['stageLibraries'][12],bm['stageLibraries'][12]
a18,b18=am['stages'][17],bm['stages'][17]
assert a13!=b13 and a18!=b18
old,new=(stock/a13).read_bytes(),(after/b13).read_bytes()
assert change(old,match_body=False)[0]==new,'Default built Stage13 library differs beyond exact range metadata'
old18,new18=(stock/a18).read_bytes(),(after/b18).read_bytes()
assert plan(old18,'compiled-fixture')[0]==new18,'Default built Stage18 map differs beyond exact 45 references'
def urls(v):
 if isinstance(v,str):
  if v.startswith('web/'):yield v
 elif isinstance(v,list):
  for x in v:yield from urls(x)
 elif isinstance(v,dict):
  for x in v.values():yield from urls(x)
index=[]
for url in sorted(set(urls(am))-{a13,a18}):
 if (stock/url).is_file():
  r=(stock/url).read_bytes()
  assert r==(after/url).read_bytes(),url
  index.append([url,hashlib.sha256(r).hexdigest()])
bm['stageLibraries'][12]=a13
bm['stages'][17]=a18
assert am==bm,'Manifest difference outside Stage13 asset + Stage18 map'
p=lambda files,roots:[[f,hashlib.sha256((r/f).read_bytes()).hexdigest()] for f,r in zip(files,roots)]
(out/'packet.json').write_text(json.dumps({'stage13Assets':p([a13,b13],[stock,after]),'stage18Maps':p([a18,b18],[stock,after]),'stage13Map':am['stages'][12],'stage22Map':am['stages'][21],'otherManifestReferencedFilesExact':index},indent=2))
