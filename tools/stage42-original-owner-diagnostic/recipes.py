"""Offline validation and lexical replay only. No I/O except explicit local inputs."""
import copy, hashlib, json, re, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
def sha(x): return hashlib.sha256(x.encode('utf-8') if isinstance(x,str) else x).hexdigest()
def canon(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
if not __debug__:raise RuntimeError('immutable preflight requires enabled assertions')
raw_recipe=(HERE/'RECIPE.json').read_bytes()
assert sha(raw_recipe)=='77a0b830051e1cc25c9d8f6679eb426767a99fc2ffc6a07176588ed9323dc7b4'
R=json.loads(raw_recipe)
assert R['enabled'] is False
ASSET='web/data/chapter-42-assets.396ec98508d5b8c8.json'
MAP='web/data/chapter-42.0802015e8ba99d11.json'
CAMPAIGN='web/data/campaign.7140da5d3649e4ab.json'
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def check(b,r): assert fact(b)=={k:r[k]for k in ('bytes','sha256')}
def P_leaf(a):return a[0]['edgeWall']['vector']['root']['children'][1]['children'][0]['children'][0]['children'][0]['children']
def H_leaf(a):return a[0]['vector']['root']['children'][0]['children']
def guarded_H(a):return {**{k:a[k]for k in ('edgeWall','edgeSurface','params','bounds','anchor')},
                         'allVectorClips':a['vector']['clips'],'originalPropsB':a['vector']['root']['children'][1]}
def validate_A(raw):
 check(raw,R['A'])
 a=json.loads(raw)
 assert [n['id']for n in a]==['act5:near:42'] and len(H_leaf(a))==16
 assert a[0]['params']['sourceSha256']==R['H']['sourceOrigin']
 assert a[0]['vector']['root']['children'][0]['clipPath']=='a'
 assert sha(a[0]['vector']['clips']['a'][0])==R['H']['clipA']
 assert {k:sha(canon(v)) for k,v in guarded_H(a[0]).items()}==R['H']['protected']
 return a
def apply(raw,kind):
 assert kind in ('A','P','H')
 stock=validate_A(raw)
 if kind=='A':return raw
 expect=copy.deepcopy(stock); patch=[]
 if kind=='P':
  rows=R['P']['rows']
  assert [(i,j)for i,j,*_ in rows]==[(22,1),(22,2),(23,2)]
  assert sum(len(e)for *_,e in rows)==35
  for i,j,oh,nh,edits in rows:
   old=P_leaf(stock)[i]['dParts'][j]
   assert sha(old)==oh
   prev=-1; new=old
   for at,right,s,literal in edits:
    assert prev<at==right<=len(old) and sha(old[at:right])==s
    assert re.fullmatch(r'[Mm][MmZzLlQqHhVvCcSsTtAa0-9.,eE +\-]*',literal)
    prev=at
   for at,right,s,literal in reversed(edits):new=new[:at]+literal+new[right:]
   assert sha(new)==nh
   P_leaf(expect)[i]['dParts'][j]=new;patch.append((old,new))
 else:
  rows=R['H']['rows']
  assert [i for i,*_ in rows]==list(range(2,16))
  assert sum(len(row[3])for row in rows)==987 and sum(len(row[4])for row in rows)==432
  for i,oh,nh,drops,hooks in rows:
   old=H_leaf(stock)[i]['d'];assert sha(old)==oh
   rings=re.findall(r'[Mm][^Mm]*',old);assert ''.join(rings)==old
   gone,move=dict(drops),dict(hooks)
   assert len(gone)==len(drops) and len(move)==len(hooks)
   assert all(0<=j<len(rings) and sha(rings[j])==h for j,h in gone.items())
   assert all(0<j<len(rings) and j not in gone and j-1 in gone and rings[j][0]=='m' and
           re.fullmatch(r'M-?[0-9]+(?:\.[0-9]+)? -?[0-9]+(?:\.[0-9]+)?',m) for j,m in move.items())
   new=''.join(move.get(j,'')+r for j,r in enumerate(rings) if j not in gone)
   assert sha(new)==nh
   H_leaf(expect)[i]['d']=new;patch.append((old,new))
 ans=raw
 for old,new in patch:
  assert ans.count(canon(old))==1
  ans=ans.replace(canon(old),canon(new),1)
 check(ans,R[kind]);assert json.loads(ans)==expect
 undone=ans
 for old,new in reversed(patch):
  assert undone.count(canon(new))==1
  undone=undone.replace(canon(new),canon(old),1)
 assert undone==raw
 return ans
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('offline selfcheck only: python recipes.py STOCK HISTORICAL_P_BODY REJECTED_H_PACKET')
 a,p0,h0=[Path(k).read_bytes()for k in sys.argv[1:]]
 assert sha(p0)==R['P']['stockBodySource']
 arb={k:apply(a,k)for k in ('A','P','H')}
 assert json.loads(arb['P'])[0]['edgeWall']==json.loads(p0)
 assert arb['H']==h0
 try:apply(a+b' ','H')
 except AssertionError:pass
 else:raise AssertionError('mutated stock accepted')
 print(json.dumps({k:fact(v)for k,v in arb.items()},indent=2))
