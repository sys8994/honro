from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib,json,os,subprocess
P=Path(os.environ['STAGE26_QA'])
OUT=P/'evidence'; OUT.mkdir(exist_ok=True)
BASE='https://sys8994.github.io/honro/'
release='4416dfb527f810398903d15510ab8ca05a892661'
expected={'HONRO.html':'36d138b95b55bea83ae2580499105e0194e98928','web/manifest.json':'cf62cfd03527fd821f126d7b017f4c363ae09a7d','web/entries/game.340c32a30a66adad.js':'bec78f1a10a8594703cb57ab2b35041191be21ea','web/data/campaign.9840d8f258b12a6d.json':'aed4c6004795df3aba19409bed480cb34f43d7cb','web/data/chapter-26.cc8e0e37503433b3.json':'846ef414bc95659495072ed7dcab9df720f80e09','web/data/chapter-26-assets.a45d6ce39671a754.json':'f0a63c9c7a499a222764eccc6bbb569f1fa2b84a'}
def fetch(item):
 path,blob =item
 result=subprocess.check_output(['curl','--silent','--show-error','--fail','--max-time','30','--write-out','%{http_code} %{url_effective}',BASE+path])
 trailer=f'200 {BASE+path}'.encode()
 assert result.endswith(trailer),path
 d=result[:-len(trailer)]
 git=hashlib.sha1(f'blob {len(d)}\0'.encode()+d).hexdigest()
 assert git==blob,(path,git,blob)
 return {'url':BASE+path,'blob':git,'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest()},d
with ThreadPoolExecutor(max_workers=2) as pool: verified=dict(zip(expected,pool.map(fetch,expected.items())))
rows={k:v[0] for k,v in verified.items()}
assert verified['web/manifest.json'][1]==(P/'manifest.json').read_bytes()
manifest=json.loads((P/'manifest.json').read_bytes()); hashes={v['path']:v for v in manifest['files']}
assert all(path in ('HONRO.html','web/manifest.json') or hashes[path]['sha256']==row['sha256'] and hashes[path]['bytes']==row['bytes'] for path,row in rows.items())
js=verified['web/entries/game.340c32a30a66adad.js'][1].decode()
assert 'game.340c32a30a66adad.js' in verified['HONRO.html'][1].decode() and 'campaign.9840d8f258b12a6d.json' in js
c=json.loads(verified['web/data/campaign.9840d8f258b12a6d.json'][1])
print(c['stages'][25],c['stageLibraries'][25])
for field,token in [('stages','chapter-26.cc8e0e37503433b3.json'),('stageLibraries','chapter-26-assets.a45d6ce39671a754.json')]:
 assert token in str(c[field][25])
(OUT/'RELEASE_SOURCE.json').write_text(json.dumps({'exactCommit':release,'resources':rows,'stage26Map':c['stages'][25],'stage26AssetPacket':c['stageLibraries'][25]}, indent=2))
