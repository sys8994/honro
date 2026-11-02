"""Archive already downloaded CI artifacts without promoting bounded UI to clears."""
from pathlib import Path
import json,sys,gzip,hashlib,re,shutil
ROOT=Path(__file__).resolve().parents[2];m=json.loads(Path(sys.argv[1]).read_text());out=ROOT/f'game/docs/act2-gameplay-20261103/browser-evidence/{m["runId"]}';out.mkdir(parents=True,exist_ok=True);rows=[]
for item in m['artifacts']:
 i=item['id'];s=int(re.search(r'-ui-(\d+)-',item['name']).group(1));src=ROOT/f'_local/reports/browser-artifacts/{i}';dst=out/str(s);dst.mkdir(exist_ok=True)
 digest=hashlib.sha256((src.parent/f'{i}.zip').read_bytes()).hexdigest();assert 'sha256:'+digest==item['digest']
 r=json.loads((src/'result.json').read_text());e=json.loads((src/'events.json').read_text());assert r['stage']==s and r['source']==m['source']==(src/'source.txt').read_text().strip()
 for name in ['result.json','events.json']:(dst/(name+'.gz')).write_bytes(gzip.compress((src/name).read_bytes(),mtime=0))
 for name in ['source.txt','served-sha256.txt']:(dst/name).write_bytes((src/name).read_bytes())
 for name in ['initial-normal.png','initial-monsters-overview.png','terminal.png','failure.png','entry-boundary.png']:
  if (src/name).exists():shutil.copyfile(src/name,dst/name)
 fires=sum(x['op']=='fire' for x in e);moves=sum(bool(x['op']=='moved' and x.get('actual') and abs(x['actual']['x']-x['fromX'])+abs(x['actual']['y']-x['fromY'])>=20) for x in e)
 verified=bool(r['passed'] and not r.get('exception') and not r['errors'])
 full=bool(verified and s==19 and r.get('stageCleared') and r.get('final',{}).get('appDone') and r.get('stored',{}).get('cleared',{}).get('19'))
 rows.append({'stage':s,'artifactId':i,'source':m['source'],'zipSha256':digest,'verifiedReceiptPassed':verified,'normalUiStageClear':full,'scope':'Stage19 complete ordinary UI/App persistence or bounded movement/aim/fire observation only; no whole gameplay/fun approval','exception':r.get('exception'),'errors':r['errors'],'round':r.get('final',{}).get('round'),'fires':fires,'actualMoveSegments':moves,'evidenceFiles':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in dst.iterdir()}})
(out/'receipt.json').write_text(json.dumps({'runId':m['runId'],'url':f'https://github.com/sys8994/honro/actions/runs/{m["runId"]}','rows':rows,'finalArtApproval':False,'releaseApproved':False},ensure_ascii=False,indent=2)+'\n');print(json.dumps(rows))
