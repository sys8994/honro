"""Local-only deterministic Stage46 traced exterior simplification. No repository writes."""
import ast,copy,gzip,hashlib,json,math,re,time,sys
from pathlib import Path
import numpy as np
P=Path(__file__).parent
from primitives import rd, area, subparse
LIMITS=[(-1250,-599),(-601,1),(-1,601),(599,1201),(1199,1801),(1799,2400)]
FACES=[-100,1200,2500,3800]
def sha(b):return hashlib.sha256(b).hexdigest()
def d(n):return ' '.join(n.get('dParts',[n.get('d','')]))
def owner(j):
 n=j['vector']['root']
 while not all(c.get('tag')=='path' for c in n['children']):
  assert len(n['children'])==1 and n['children'][0]['tag']=='g';n=n['children'][0]
 return n

def nums(s):return np.array([float(x) for x in re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',s)]).reshape(-1,2)
def intersects(p):
 if np.array_equal(p[0],p[-1]):p=p[:-1]
 def cr(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
 for a in range(len(p)):
  b=(a+1)%len(p)
  for c in range(a+2,len(p)):
   z=(c+1)%len(p)
   if z==a:continue
   if cr(p[a],p[b],p[c])*cr(p[a],p[b],p[z])<0 and cr(p[c],p[z],p[a])*cr(p[c],p[z],p[b])<0:return True
 return False

def seamset(ps,xs):
 sets={f'x={x}':set() for x in xs}|{f'y={y}':set() for y in FACES}
 for n in ps:
  xy=nums(d(n))
  for x in xs:sets[f'x={x}'].update(xy[xy[:,0]==x,1])
  for y in FACES:sets[f'y={y}'].update(xy[xy[:,1]==y,0])
 return sets

def run(index):
 name='stage46-exterior-body.json' if index==0 else f'stage46-exterior-part-{index}.json'
 raw=(P/'original'/name).read_bytes();source=json.loads(raw);j=copy.deepcopy(source);o=owner(j);orig=o['children'];xs=LIMITS[index];stat={'index':index,'name':name,'source_sha256':sha(raw),'locked':0,'simplified':0,'fallback_original':0,'self_cross_retries':0,'duplicates':[]}
 # Exact overpaint elimination in a common, untransformed opaque parent.
 for n in orig:assert n['opacity']==1 and n['stroke']=='none' and n['fillRule']=='nonzero' and 'transform'not in n
 remove=set()
 for i,n in enumerate(orig):
  for k in range(i+1,len(orig)):
   if d(n)==d(orig[k]):remove.add(i);stat['duplicates'].append([i,k]);break
 o['children']=[n for i,n in enumerate(orig) if i not in remove]
 before=seamset(orig,xs)
 for n in o['children']:
  original_node=copy.deepcopy(n); original_parts=n.get('dParts');parts=[]
  for s in re.findall('M[^M]*',d(n)):
   assert not re.search('[a-df-zA-BD-FH-KN-Y]',s);xy=nums(s);assert np.isfinite(xy).all()
   if any(np.any(np.abs(xy[:,0]-x)<=24) for x in xs) or any(np.any(np.abs(xy[:,1]-y)<=24) for y in FACES):parts.append(s);stat['locked']+=1;continue
   p=subparse(s)
   if len(p)<5:parts.append(s);continue
   k=int(np.linalg.norm(p-p[0],axis=1).argmax());chosen=None
   for epsilon in [16,8,4,2,1,.5,.25]:
    q=np.concatenate((rd(p[:k+1],epsilon)[:-1],rd(p[k:],epsilon)))
    if len(q)<4 or area(p)*area(q)<=0 or abs(area(q)-area(p))>max(abs(area(p))*.15,4):continue
    if intersects(q):stat['self_cross_retries']+=1;continue
    if len(q)>=len(re.findall('[LC]',s))+1:continue
    chosen=q;break
   if chosen is None:parts.append(s);stat['fallback_original']+=1
   else:parts.append('M '+' L '.join(f'{x:.3f},{y:.3f}' for x,y in chosen[:-1])+' Z');stat['simplified']+=1
  if original_parts is not None:
   counts=[q.count('M') for q in original_parts];assert sum(counts)==len(parts)
   packed=[];offset=0
   for count in counts:packed.append(' '.join(parts[offset:offset+count]));offset+=count
   if any(len(q)>60000 for q in packed):n.clear();n.update(original_node)
   else:n['dParts']=packed
  else:
   joined=' '.join(parts)
   if len(joined)<=60000:n['d']=joined
   else:n.clear();n.update(original_node)
 after=seamset(o['children'],xs);stat['seam_locks']={k:before[k]==after[k] for k in before};assert all(stat['seam_locks'].values())
 assert source['vector']['clips']==j['vector']['clips'];assert source['collision']==j['collision']
 # No metadata/geometry outside exact vector root child path list may change.
 a=copy.deepcopy(source);b=copy.deepcopy(j);owner(a)['children']=[];owner(b)['children']=[];assert a==b
 out=json.dumps(j,ensure_ascii=False,separators=(',',':')).encode()
 def metric(obj,bs):
  ps=owner(obj)['children'];s=' '.join(d(n) for n in ps);return {'bytes':len(bs),'gzip_bytes':len(gzip.compress(bs,mtime=0)),'paths':len(ps),'subpaths':s.count('M'),'L':s.count('L'),'C':s.count('C'),'LC':s.count('L')+s.count('C')}
 stat.update(before=metric(source,raw),after=metric(j,out),candidate_sha256=sha(out),clip_exact=True,physics_exact=True,accepted=False,unverified=['Inter-subpath nesting','Actual stock renderer full-stage review','Adjacent mixed candidate/source seam compositing'])
 (P/'candidate'/name).write_bytes(out);(P/f'proof-{index}.json').write_text(json.dumps(stat,indent=2));print(json.dumps(stat),flush=True)
if __name__=='__main__':
 for i in ([int(sys.argv[1])] if len(sys.argv)>1 else range(6)):run(i)
