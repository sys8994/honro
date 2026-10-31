#!/usr/bin/env python3
"""Compare resolved chapter 1–30 stage inputs/assets, allowing bundle repartition."""
import json,pathlib,sys
A=pathlib.Path('.');B=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/honro-act4-rc-qa')
def read(b,p):return json.loads((b/p).read_text())
def manifest(b):return read(b,read(b,'web/manifest.json')['project'])
def packet(base,path,encoding):
 v=read(base,path)
 if encoding!='json-pool-v1':return v
 nodes=v['nodes']
 def expand(ref):
  if ref is None or isinstance(ref,bool):return ref
  if isinstance(ref,list):return ref[0]
  node=nodes[ref]
  if isinstance(node,str):return node
  if node[0]==0:return [expand(x) for x in node[1:]]
  return {expand(node[i]):expand(node[i+1]) for i in range(1,len(node),2)}
 return expand(v['root'])
a,b=manifest(A),manifest(B)
def strings(x):
 if isinstance(x,str):yield x
 elif isinstance(x,dict):
  for v in x.values():yield from strings(v)
 elif isinstance(x,list):
  for v in x:yield from strings(v)
def resolved(base,m,i):
 stage=read(base,m['stages'][i]);lib={x['id']:x for x in [*packet(base,m['shared'],m['assetEncodings']['shared']),*packet(base,m['stageLibraries'][i],m['assetEncodings']['stageLibraries'][i])]};todo=[s for s in strings(stage) if s in lib];seen={}
 while todo:
  k=todo.pop()
  if k in seen:continue
  seen[k]=lib[k];todo.extend(s for s in strings(lib[k]) if s in lib and s not in seen)
 return stage,seen
for i in range(30):
 old,oa=resolved(A,a,i);new,na=resolved(B,b,i);assert old==new,f'chapter {i+1}: stage changed';assert oa==na,f'chapter {i+1}: resolved asset changed/missing: {set(oa)^set(na)}'
print('PASS 1–30 compiled stage data and reachable resolved assets; bundle repartition allowed')
