"""Pin launch files to current public Pages before camera-only observation."""
import hashlib,json,os,re,subprocess
from pathlib import Path
from urllib.request import build_opener,HTTPRedirectHandler,Request
HERE=Path(__file__).resolve().parent
OUT=Path(os.environ['STAGE38_PUBLIC'])
P=json.loads((HERE/'PINS.json').read_bytes())
BASE='https://sys8994.github.io/honro/'
LIVE=P['live']['release']
FILES={'.github/workflows/stage38-public-contact.yml',*(f'tools/stage38-public-contact/{n}' for n in ('source.py','capture.py','PINS.json'))}
def git(*a):return subprocess.check_output(['git',*a])
def sha(b):return hashlib.sha256(b).hexdigest()
def measured(b):return {'bytes':len(b),'sha256':sha(b)}
def save(n,d):(OUT/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
def show(rel):return git('show',LIVE+':'+rel)
def check_body(rel,b,want):
    assert measured(b)==want,(rel,measured(b),want)
    return b
def scope():
    prior='eb5c8d054039f94a5a951ea6a8c0d7cfba78dfc2'
    assert git('rev-list','--parents','-n1','HEAD').decode().split()==[os.environ['GITHUB_SHA'],prior]
    assert git('rev-list','--parents','-n1',prior).decode().split()==[prior,LIVE]
    assert set(git('diff','--name-status','--no-renames',prior,'HEAD').decode().splitlines())=={
      'M\t.github/workflows/stage38-public-contact.yml','M\ttools/stage38-public-contact/capture.py','M\ttools/stage38-public-contact/source.py'}
    assert git('rev-parse',LIVE+'^{tree}').decode().strip()==P['live']['tree']
    assert set(git('diff','--name-status','--no-renames',LIVE,'HEAD').decode().splitlines())=={'A\t'+p for p in FILES}
    assert git('status','--porcelain=v1','-z')==b''
    assert git('rev-parse',LIVE+':web/manifest.json').decode().strip()==P['live']['retainedManifestGitBlob']
class DirectOnly(HTTPRedirectHandler):
    def redirect_request(self,*a,**kw): raise RuntimeError('Unexpected redirect from previously pinned Pages pathname')
def source():
    scope()
    shell=check_body('HONRO.html',show('HONRO.html'),P['html'])
    manifest=check_body('web/manifest.json',show('web/manifest.json'),P['manifest'])
    url=BASE+'web/manifest.json'
    with build_opener(DirectOnly).open(Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=30) as r:
        assert (r.status,r.geturl())==(200,url)
        live=check_body('actual Pages manifest',r.read(P['manifest']['bytes']+1),P['manifest'])
    m=json.loads(live);active={f['path']:{'bytes':f['bytes'],'sha256':f['sha256']}for f in m['files']}
    roles=P['roles'];rt=P['runtime'];paths=P['needed']
    assert m['gameEntry']==roles['entry'] and m['project']==roles['campaign']
    assert all(active[rel]==v for rel,v in paths.items())
    data={rel:check_body(rel,show(rel),v) for rel,v in paths.items()}
    entry=data[roles['entry']]
    assert roles['entry'].encode() in shell and roles['campaign'].encode() in entry and roles['campaign'].encode() in data[roles['loader']]
    assert all(('../runtime/'+rt[n].split('/')[-1]).encode() in entry for n in rt if n!='monsterData')
    assert rt['monsterData'].encode() in data[rt['monsterDataLoader']]
    assert b'drawBody' in data[rt['monsterVector']] and b'unitBody' in data[rt['baseRenderer']]
    assert b'HonroAct4TerrainPreview' in data[rt['act4Runtime']] and b'HonroAct4PilotArt' in data[rt['act4Presentation']]
    c=json.loads(data[roles['campaign']]);assert c['stages'][37]==roles['stageMap'] and c['stageLibraries'][37]==roles['descriptor']
    m=json.loads(data[roles['stageMap']]);assert m['metadata']['stageId']==38
    assert all(any(a['id']==r['id'] and a['kind']==r['kind'] and abs(a['x']-r['sourceX'])<1e-6 and abs(a['y']-r['sourceY'])<1e-6 for a in m['units'])
               for r in P['coverage']['actors'].values())
    aggregate(data)
    save('public-source.json',{'release':P['live'],'scope':'Verified anonymous current manifest and exact source closure. Browser HTTP bytes checked separately.','manifestHTTP':{'path':'web/manifest.json','status':200,**P['manifest']},'roles':roles,'runtime':rt})
def aggregate(data):
    d=json.loads(data[P['roles']['descriptor']]); assert d['$honroJsonParts']==1 and len(d['parts'])==2
    assert {p['path']for p in d['parts']}=={r for r in P['needed'] if 'chapter-38-assets-part-' in r}
    b=[]
    for r in d['parts']:b.append(check_body(r['path'],data[r['path']],{k:r[k]for k in ('bytes','sha256')}))
    want={k:d[k] for k in ('bytes','sha256')};check_body('ordered chapter38 aggregate',b''.join(b),want)
    return want
if __name__=='__main__':source()
