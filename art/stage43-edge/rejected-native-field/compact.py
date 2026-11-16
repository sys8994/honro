from pathlib import Path
import xml.etree.ElementTree as E,re,collections,json,hashlib
root=Path(__file__).parent
raw=root/'whole-native-field.svg';s=raw.read_text();ns='{http://www.w3.org/2000/svg}';tree=E.fromstring(s)
paths=[x for x in tree.iter(ns+'path') if x.get('id','').startswith('whole-')]
records=[]
for p in paths:
 d=p.get('d');nums=list(map(float,re.findall(r'-?\d+(?:\.\d+)?',d)));xs=nums[::2];ys=nums[1::2]
 records.append(dict(d=d,fill=p.get('fill'),id=p.get('id'),box=(min(xs)-4,min(ys)-4,max(xs)+4,max(ys)+4),points=len(xs)))
N=len(records);after=[[] for _ in records];degree=[0]*N
# Conservative dependency graph: any bbox contact is painter-order dependent,
# including same-color pairs. 4sourcepx margin preserves AA at all checked scales.
for j,b in enumerate(records):
 bx=b['box']
 for i in range(j):
  ax=records[i]['box']
  if ax[2]>=bx[0] and bx[2]>=ax[0] and ax[3]>=bx[1] and bx[3]>=ax[1]:after[i].append(j);degree[j]+=1
ready={i for i,d in enumerate(degree) if d==0};batches=[]
while ready:
 groups=collections.defaultdict(list)
 for i in sorted(ready):
  r=records[i];role=r['id'].rsplit('-',1)[0];groups[(role,r['fill'])].append(i)
 key,ids=max(groups.items(),key=lambda kv:len(kv[1]))
 batch=[];chars=pts=0
 for i in ids:
  r=records[i]
  if batch and (chars+len(r['d'])>18000 or pts+r['points']>1200):break
  batch.append(i);chars+=len(r['d']);pts+=r['points']
 batches.append((key,batch))
 for i in batch:ready.remove(i)
 for i in batch:
  for j in after[i]:
   degree[j]-=1
   if degree[j]==0:ready.add(j)
assert sum(len(ids) for _,ids in batches)==N
svg=['<svg xmlns="http://www.w3.org/2000/svg" width="5900" height="3450" viewBox="-2000 200 5900 3450">','<title>Stage43 native field, order-preserving compact candidate</title>','<defs><clipPath id="whole-native-extent"><path d="M-2000 200H3900V3650H-2000Z"/></clipPath></defs><g clip-path="url(#whole-native-extent)">']
for k,((role,fill),ids) in enumerate(batches):
 d=' '.join(records[i]['d'] for i in ids)
 svg.append(f'<path id="compact-{k:03}" data-role="{role}" fill="{fill}" d="{d}"/>')
svg.append('</g></svg>');(root/'whole-native-field-compact.svg').write_text('\n'.join(svg))
stats=dict(raw_sha256=hashlib.sha256(raw.read_bytes()).hexdigest(),raw_visible_paths=N,compound_paths=len(batches),max_path_chars=max(sum(len(records[i]['d'])+1 for i in ids) for _,ids in batches),max_points=max(sum(records[i]['points'] for i in ids) for _,ids in batches),total_points=sum(r['points'] for r in records),dependency_edges=sum(map(len,after)),note='All bbox-overlap original orders retained, including identical color; only separated simultaneously available paths combined. No geometry or precision changes.')
(root/'compact-report.json').write_text(json.dumps(stats,indent=2));print(stats)
