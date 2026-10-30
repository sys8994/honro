"""Combine stage39 native bank candidate with the separately authored exact-profile ledge."""
import copy,json
from pathlib import Path
f=Path('_local/reports/stage39-bank-v4/candidate-project.json');p=json.loads(f.read_text());s=p['stages'][0];old=copy.deepcopy(s);d=json.load(open('art/stage39-upper-ledge-v4/terrain-delta.json'));a=json.load(open('art/stage39-upper-ledge-v4/world-asset.json'));t=next(t for t in s['terrains']if t['id']==d['id']);assert t==d['original']or t==d['changed'];s['terrains']=[d['changed']if t['id']==d['id']else t for t in s['terrains']];e=next(e for e in s['elements']if e['id']==d['elementChanged']['id']);e['assetId']=a['id'];p['library']=[v for v in p['library']if v['id']!=a['id']]+[a]
for k in ['units','events','encounters','objectives','environment','initialState']:assert s[k]==old[k],k
f.write_text(json.dumps(p,separators=(',',':')));print('39 native upper ledge combined; other gameplay fields unchanged')
