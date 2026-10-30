#!/usr/bin/env python3
"""검증된 기준표 base와 JSON patch로 전체 기준표를 복원한다."""
import argparse,copy,hashlib,json,pathlib
p=argparse.ArgumentParser();p.add_argument('base');p.add_argument('patch');p.add_argument('output');a=p.parse_args()
base=pathlib.Path(a.base).read_bytes();patch=json.loads(pathlib.Path(a.patch).read_text());assert hashlib.sha256(base).hexdigest()==patch['baseSha256'],'Base SHA mismatch'
data=json.loads(base)
for op in patch['operations']:
 parts=[v.replace('~1','/').replace('~0','~') for v in op['path'].split('/')[1:]]
 if not parts:
  assert op['op']=='replace';data=copy.deepcopy(op['value']);continue
 parent=data
 for k in parts[:-1]:parent=parent[int(k)] if isinstance(parent,list) else parent[k]
 key=parts[-1]
 if isinstance(parent,list):
  if op['op']=='add':parent.insert(len(parent) if key=='-' else int(key),copy.deepcopy(op['value']))
  elif op['op']=='remove':parent.pop(int(key))
  elif op['op']=='replace':parent[int(key)]=copy.deepcopy(op['value'])
  else:raise ValueError(op['op'])
 else:
  if op['op']=='remove':del parent[key]
  elif op['op'] in ('add','replace'):parent[key]=copy.deepcopy(op['value'])
  else:raise ValueError(op['op'])
canon=json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode();assert hashlib.sha256(canon).hexdigest()==patch['targetCanonicalSha256'],'Target SHA mismatch'
pathlib.Path(a.output).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print('Verified target',len(data['stages']),'stages')
