"""Independently derive the previously frozen candidate using exact stock packet bytes and its signed recipe."""
from pathlib import Path
from decimal import Decimal,getcontext
from copy import deepcopy
import re,json,hashlib
getcontext().prec=60
Q=10**22
nums=re.compile(r'[-+]?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?')
groups=re.compile(r'([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)')
I=lambda raw:int(Decimal(raw)*Q)
SEP={'M':2,'L':2,'H':1,'V':1,'C':6,'S':4,'Q':4,'T':2,'A':7,'Z':0}
def plus(x,y): return tuple(a+b for a,b in zip(x,y))
def minus(x,y):return tuple(a-b for a,b in zip(x,y))
def scale(x,k):return tuple(a*k for a in x)
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def endpoint(mode,data,p):
 if mode=='H':return data[0],p[1]
 if mode=='V':return p[0],data[0]
 return tuple(data[-2:])
def rings(d):
 p=M=(0,0);path=[];skip=False;count=0;last=None
 for m in groups.finditer(d):
  op=m[1];mode=op.upper();sep=SEP[mode];v=[Decimal(x)*Q for x in nums.findall(m[2])]
  assert all(int(x)==x for x in v) and (len(v)==0 if not sep else len(v)>=sep and len(v)%sep==0),(op,str(v)[:300])
  v=[int(x)for x in v]
  if op in 'Zz':
   if p!=M:path.append(('Z',(p,M)))
   p=M;last=None;continue
  for k in range(0,len(v),sep):
   typ=mode if k==0 or mode!='M' else 'L';q=v[k:k+sep]
   old=p
   if op.islower():
    if typ=='H':q=[q[0]+p[0]]
    elif typ=='V':q=[q[0]+p[1]]
    elif typ=='A':q=[*q[:-2],*plus(p,q[-2:])]
    else:q=[x+p[i%2]for i,x in enumerate(q)]
   p=endpoint(typ,q,p)
   if typ=='M':
    if count:yield path,count,skip,M,old
    M=p;path=[];count=1;last=None;skip=False;continue
   count+=1
   if typ=='A':skip=True;seg=(old,p)
   elif typ in ('H','V','L'):typ='L';seg=(old,p)
   elif typ=='C':seg=(old,tuple(q[:2]),tuple(q[2:4]),p)
   elif typ=='S':typ='C';seg=(old,minus(scale(old,2),path[-1][1][-2])if last=='C'else old,tuple(q[:2]),p)
   elif typ=='Q':seg=(old,tuple(q[:2]),p)
   elif typ=='T':typ='Q';seg=(old,minus(scale(old,2),path[-1][1][-2])if last=='Q'else old,p)
   else:raise RuntimeError(typ)
   path.append((typ,seg));last=typ
 if count:yield path,count,skip,M,p
sha=lambda x:hashlib.sha256(x).hexdigest()
def fact(x):return {'bytes':len(x),'sha256':sha(x)}
def derive(raw,recipe):
 assert fact(raw)==recipe['before']
 a=json.loads(raw);b=deepcopy(a)
 assert len(a)==1 and a[0]['id']=='act5:near:42'
 def num(i):
  v=format(Decimal(i)/Q,'f');return (v.rstrip('0').rstrip('.') if '.'in v else v) or '0'
 def shape(x):return (x[0],x[1],x[2],x[3])
 findmove=re.compile(r'[Mm]')
 out=raw; records=[]; changes=[]
 for i in (13,14,15):
  n=b[0]['vector']['root']['children'][0]['children'][i];assert n.get('fillRule','nonzero')=='nonzero' and n.get('opacity',1)==1 and n.get('stroke','none')=='none' and n.get('transform') is None and 'dParts' not in n
  d0=n['d']; starts=[m.start() for m in findmove.finditer(d0)]
  assert starts[0]==0
  ds=[d0[a:b]for a,b in zip(starts,starts[1:]+[len(d0)])]
  oriented=list(rings(d0)); assert len(ds)==len(oriented)
  p=recipe['leaves'][i-13];assert p['nearLeaf']==i and sha(d0.encode())==p['dBeforeSHA']
  signed=set(p['removedSubpaths'])
  assert len(signed)==len(p['removedSubpaths']) and signed.issubset(range(len(oriented)))
  keep=[]; expected=[]; anchored=[]
  for j,(code,r) in enumerate(zip(ds,oriented)):
   if j in signed:
    assert not r[2]
    continue
   if code[0]=='m' and (j==0 or j-1 in signed):
    move_nums=list(nums.finditer(code[:next((m.start() for m in re.finditer(r'[LlHhVvCcSsQqTtAaZz]',code)),len(code))]))
    assert len(move_nums)>=2
    nrd=[num(t)for t in r[3]]
    kk=move_nums[1].end()
    # Standard implicit successive moveto pairs become relative line pairs. Separate an explicit lower-case l after changing first M anchor.
    if len(move_nums)>2:tail='l'+code[move_nums[2].start():]
    else:tail=code[kk:]
    code='M'+','.join(nrd)+tail
    anchored.append(j)
   keep.append(code); expected.append(shape(r))
  # Filter never changes absolute commands/implicit closes/hole polarity of remaining contours.
  new=''.join(keep);assert len(new)<=60000 and [shape(x)for x in rings(new)]==expected
  n['d']=new
  enc=lambda s:json.dumps(s,ensure_ascii=False,separators=(',',':')).encode()
  old,newer=enc(d0),enc(new)
  assert out.count(old)==1
  out=out.replace(old,newer,1);changes.append((newer,old))
  records.append({'nearLeaf':i,'dBeforeSHA':sha(d0.encode()),'dAfterSHA':sha(new.encode()),'removedSubpaths':sorted(signed),'removedEnds':sum(oriented[j][1]for j in signed),'retainedAbsoluteContourEquals':len(keep),'reanchoredHeadOnlyIndexes':anchored})
 assert records==recipe['leaves']
 assert sum(len(x['removedSubpaths'])for x in records)==recipe['excludedContours']==1030
 assert sum(x['removedEnds']for x in records)==recipe['excludedEndpoints']==2086
 assert json.loads(out)==b
 inverse=out
 for new,old in reversed(changes):
  assert inverse.count(new)==1; inverse=inverse.replace(new,old,1)
 assert inverse==raw
 assert fact(out)==recipe['derived']
 return out,dict(before=fact(raw),derived=fact(out),wireReverse=fact(inverse),changed='only original near42 three d strings',removedEnds=2086,removedSubpaths=1030,leafReceipts=records)
