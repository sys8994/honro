import sys,json,re,hashlib,copy
from pathlib import Path
base=Path(sys.argv[1]); r=json.loads((Path(__file__).parent/'recipe.json').read_text())
name='stage46-exterior-body.json'; src=base/'original'/name; r1=base/'candidate'/name
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert h(src)==r['source'] and h(r1)==r['r1'],(h(src),h(r1))
a=json.loads(src.read_bytes());b=json.loads(r1.read_bytes());result=copy.deepcopy(a)
def owner(j):
 n=j['vector']['root']
 while not all(c.get('tag')=='path' for c in n['children']):n=n['children'][0]
 return n['children']
def d(n):return ' '.join(n.get('dParts',[n.get('d','')]))
def rings(s):return re.findall('M[^M]*',s)
A,B,R=map(owner,[a,b,result]);ret=[i for i,n in enumerate(A) if not any(d(n)==d(o) for o in A[i+1:])]
for j,i in enumerate(ret):
 idx=set(r['retain'].get(str(i),[]))
 if not idx:continue
 X,Y=map(rings,[d(A[i]),d(B[j])]);assert len(X)==len(Y)
 seq=[Y[k].rstrip()+' ' if k in idx else z for k,z in enumerate(X)]
 if 'd' in R[i]:R[i]['d']=''.join(seq)
 else:
  sizes=[len(rings(s)) for s in R[i]['dParts']];n=0;assert sum(sizes)==len(seq)
  for k,t in enumerate(sizes):R[i]['dParts'][k]=''.join(seq[n:n+t]);n+=t
raw=json.dumps(result,separators=(',',':'),ensure_ascii=False).encode()
assert hashlib.sha256(raw).hexdigest()==r['r3']
Path(sys.argv[2]).write_bytes(raw)
