"""Read-only one-release stage wire inventory; no Chrome, repo/network writes or area guesses."""
from pathlib import Path,PurePosixPath
from collections import Counter
from hashlib import sha256
import argparse, json, math, re, subprocess, zipfile
from functools import lru_cache
REL='acb51f4ee1c5afa90751dc256d6ad8d900732779'
TREE='5cc36cfd7ef62fc801dc967605260610596d8061'
MANIFEST='web/manifest.json'; MF={'bytes':6458505,'sha256':'e274ee2d3dbfee5ce35dfccd6055bfa1a898e3804bde80b687fd49f890c4079b'}
CAMPAIGN='web/data/campaign.7140da5d3649e4ab.json'
SHELL='HONRO.html'; ENTRY='web/entries/game.b0b1e648c2c03457.js'
SHELL_FACT={'bytes':17379,'sha256':'7f0b08897737d44f4f7d9a436e703b7ec48659fcb121098ea1cffd5b1f93d46d'}
CLOSURE=('web/runtime/campaign.926544619e01a04a.js','web/runtime/load-data.248fb3aada6f16bb.js','web/data/campaign-base.0c57dcfe7c08d421.json','web/data/campaign-shared.8f8343b5c21518d4.json')
RELEASE_DOWNLOAD=Path('/tmp/honro-1513-14712630495/stage24-front6-retained-source-and-generated-delta-no-deploy.zip')
DEFAULT_LOCAL=(
 ('stage42-node-density-baseline/s01.json','web/data/chapter-01.c3917afbdd6737bc.json'),
 ('stage42-node-density-baseline/a01.json','web/data/chapter-01-assets.088719e10e63d482.json'),
 ('stage42-node-density-baseline/s02.json','web/data/chapter-02.5faa275befa85b0d.json'),
 ('stage42-node-density-baseline/a02.json','web/data/chapter-02-assets.ddddf53df4d749c6.json'),
 ('stage42-node-density-baseline/s42.json','web/data/chapter-42.0802015e8ba99d11.json'),
 ('stage42-node-density-baseline/a42.json','web/data/chapter-42-assets.396ec98508d5b8c8.json'),
 ('stage42-node-density-baseline/shared.json',CLOSURE[-1]),
 ('stage42-node-density-baseline/load-data.js',CLOSURE[1]),
 ('stage24-east-native-pair-local/chapter-map.json','web/data/chapter-24.966a29d49ef5b519.json'),
 ('/tmp/honro-stage46-source-14682815519/active-stage46-descriptor.raw.json','web/data/chapter-46-assets-parts.44d5eab7aa305416.json'),
)
FORMAT='acb51 read-only wire closure v1'
def hashb(b):return sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':hashb(b)}
def obj(b):
 def unique(r):
  q=dict(r)
  assert len(q)==len(r),'duplicate decoded JSON keys'
  return q
 return json.loads(b.decode('utf-8','strict'),object_pairs_hook=unique)
def known(name,data,want):
 assert facts(data)==want,(name,facts(data),want)
 return data
def decode_packet(data,encoding):
 val=obj(data)
 if encoding=='json-pool-v1':
  assert type(val) is dict and set(val)=={'version','nodes','root'} and type(val['version']) is int and val['version']==1 and type(val['nodes']) is list
  ahead=[]
  def ref(x):
   if x is None or type(x) is bool:return x
   if type(x) is list:
    assert len(x)==1 and type(x[0]) in (float,int) and math.isfinite(x[0])
    assert type(x[0]) is not int or abs(x[0])<=9007199254740991
    return x[0]
   assert type(x) is int and 0<=x<len(ahead)
   return ahead[x]
  for node in val['nodes']:
   if type(node) is str:ahead.append(node);continue
   assert type(node) is list and node and type(node[0])is int
   if node[0]==0:ahead.append([ref(x)for x in node[1:]])
   else:
    assert node[0]==1 and len(node)%2==1
    d={}
    for k,v in zip(node[1::2],node[2::2]):
     s=ref(k);assert type(s)is str and s not in d
     d[s]=ref(v)
    ahead.append(d)
  val=ref(val['root'])
 else:assert encoding=='json'
 assert type(val)is list and all(type(x)is dict and type(x.get('id'))is str for x in val)
 assert len(val)==len({x['id']for x in val}),'duplicated asset IDs'
 return val
def assembling(head,path,read,active):
 descriptor=obj(head) if '-parts.' in path else None
 if descriptor is None:return head,[],None,[]
 assert set(descriptor)=={'$honroJsonParts','bytes','sha256','parts'} and type(descriptor['$honroJsonParts'])is int and descriptor['$honroJsonParts']==1
 stem=PurePosixPath(path).name.split('-parts.')[0]
 seen=[];todo=[];rows=[]
 for i,p in enumerate(descriptor['parts']):
  assert set(p)=={'path','bytes','sha256'}
  name=p['path'];ref={k:p[k] for k in ('bytes','sha256')}
  assert re.fullmatch(r'web/data/'+re.escape(stem)+rf'-part-{i:03d}\.[0-9a-f]{{16}}\.bin',name)
  assert name not in seen and active[name]==ref
  seen.append(name);b=read(name)
  if b is None:todo.append(name)
  else:rows.append(known(name,b,ref))
 total={k:descriptor[k]for k in ('bytes','sha256')}
 assert sum(p['bytes']for p in descriptor['parts'])==total['bytes']
 if todo:return None,seen,total,todo
 return known(path+' aggregate',b''.join(rows),total),seen,total,[]
def tags(active,pat):
 x=[p for p in active if re.fullmatch(pat,p)];assert len(x)==1,(pat,x);return x[0]
def arrangement(man,camp):
 active={v['path']:{k:v[k] for k in ('bytes','sha256')}for v in man['files']}
 assert len(active)==len(man['files'])==810
 assert all(re.fullmatch(r'web/(runtime|entries|data|styles|fonts|graphics)/[\w.-]+',p)and re.fullmatch(r'[a-f0-9]{64}',r['sha256'])for p,r in active.items())
 assert (man['project'],man['gameEntry'])==(CAMPAIGN,ENTRY)
 assert (camp['base'],camp['shared'])==CLOSURE[-2:] and camp['assetEncodings']['shared']=='json'
 assert all(len(camp[k])==50 for k in ('stages','stageLibraries','catalog'))
 assert len(set(camp['stages']))==len(set(camp['stageLibraries']))==50
 assert all(not p for p in camp['assetPaths']['stages']+camp['assetPaths']['stageLibraries']+[camp['assetPaths']['base'],camp['assetPaths']['shared']])
 assert len(set(camp['libraryOrder']))==len(camp['libraryOrder'])
 c11=tags(active,r'web/data/HONRO_STAGE11_COMPACT_DATA\.[\da-f]{16}\.json')
 w11=tags(active,r'web/runtime/HONRO_STAGE11_COMPACT_DATA\.[\da-f]{16}\.js')
 c2=tags(active,r'web/data/HONRO_ACT2_COMPACT_PACKAGES-parts\.[\da-f]{16}\.json')
 w2=tags(active,r'web/runtime/HONRO_ACT2_COMPACT_PACKAGES\.[\da-f]{16}\.js')
 phased=tags(active,r'web/data/HONRO_ACT23_V4_PHASE_B_STAGES\.[\da-f]{16}\.json')
 baseline=[*CLOSURE,ENTRY,CAMPAIGN]
 assert all(p in active for p in baseline)
 out=[]
 for i in range(1,51):
  a=i-1;declared=camp['catalog'][a];m,p=camp['stages'][a],camp['stageLibraries'][a]
  assert declared['metadata']['stageId']==i and declared['id']==f'stage-{i}'
  assert re.fullmatch(rf'web/data/chapter-{i:02d}\.[\da-f]{{16}}\.json',m)
  assert re.fullmatch(rf'web/data/chapter-{i:02d}-assets(?:-parts)?\.[\da-f]{{16}}\.json',p)
  enc=camp['assetEncodings']['stageLibraries'][a]
  assert enc in ('json','json-pool-v1')
  role=([w11,c11] if i==11 else [w2,c2,phased] if 12<=i<=20 else [])
  out.append({'stage':i,'actShard':f'Act{a//10+1}','catalogID':declared['id'],'map':m,'packet':p,'encoding':enc,'transport':'split'if '-parts.' in p else 'standalone','boundFacts':{k:active[k]for k in (m,p,*role)},'compactActiveAliases':role,
              'loadability':'NOT_RUN','density':'HOLD_BODY_OWNER_NOT_YET_SIGNED','normalRoleBoundary':'Canonical runtime selection, not mere packet registration'})
 return active,out
def exact_stock(release_zip):
 with zipfile.ZipFile(release_zip)as z:
  assert z.testzip() is None
  m=obj(known(MANIFEST,z.read(MANIFEST),MF));inv={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
  c=obj(known(CAMPAIGN,z.read(CAMPAIGN),inv[CAMPAIGN]))
  u={p:z.read(p)for p in z.namelist()if p in inv or p==SHELL}
 return m,c,u
def main():
 q=argparse.ArgumentParser()
 q.add_argument('--zip',type=Path,default=RELEASE_DOWNLOAD)
 q.add_argument('--tree',type=Path,help='Existing exact current release checkout; read only. No download.')
 q.add_argument('--out',type=Path,required=True);q.add_argument('--stages',default='all');o=q.parse_args()
 chosen=set(range(1,51))if o.stages=='all'else set(map(int,o.stages.split(',')))
 assert chosen and chosen<=set(range(1,51))
 if o.tree:
  def git(*x):return subprocess.check_output(['git','-C',str(o.tree),*x],timeout=30).decode().strip()
  assert (git('rev-parse','HEAD'),git('rev-parse','HEAD^{tree}'))==(REL,TREE)
  m=obj(known(MANIFEST,(o.tree/MANIFEST).read_bytes(),MF)); inv={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
  c=obj(known(CAMPAIGN,(o.tree/CAMPAIGN).read_bytes(),inv[CAMPAIGN]));local={}
 else:
  m,c,local=exact_stock(o.zip)
 active,allrows=arrangement(m,c);rows=[r for r in allrows if r['stage'] in chosen]
 if not o.tree:
  for f,p in DEFAULT_LOCAL:
   a=Path(f)
   if a.is_file() and p in active:
    b=a.read_bytes()
    if facts(b)==active[p]:local[p]=b
  fixture=Path('audit-loop1-current-plan/remaining-static-fixtures')
  for f in fixture.glob('stage*-*.json'):
   v=re.fullmatch(r'stage(\d+)-(map|assets|desc)\.json',f.name)
   if not v:continue
   d=allrows[int(v[1])-1];p=d['map'if v[2]=='map'else 'packet'];b=f.read_bytes()
   if facts(b)==active[p]:local[p]=b
 @lru_cache(maxsize=12)
 def read(p):
  if o.tree:
   base=o.tree.resolve();f=(base/p).resolve()
   assert f.is_relative_to(base) and f.is_file(), p
   b=f.read_bytes()
  else:b=local.get(p)
  return known(p,b,active[p]) if b is not None else None
 def bootstrap():
  check={}
  sf=(o.tree/SHELL).read_bytes() if o.tree else local[SHELL]
  known(SHELL,sf,SHELL_FACT)
  assert sf.count(('src="'+ENTRY+'"').encode())==1
  entry=read(ENTRY);wrapper=read(CLOSURE[0])
  assert entry and wrapper and ('prefetchProject("'+CAMPAIGN+'")').encode()in entry
  assert ('loadCampaign("'+CAMPAIGN+'"').encode()in wrapper
  assert b'HonroStage11Compact,HonroAct2Compact'in wrapper
  for p in [*CLOSURE,ENTRY,CAMPAIGN]:
   b=read(p)
   check[p]=active[p] if b is not None else {'status':'BODY_NOT_LOCAL'}
  check[SHELL]=SHELL_FACT
  return check
 boot=bootstrap()
 if o.tree:
  known(MANIFEST,(o.tree/MANIFEST).read_bytes(),MF)
  assert known(CAMPAIGN,(o.tree/CAMPAIGN).read_bytes(),active[CAMPAIGN])
 shared=read(CLOSURE[-1]);decoded_shared=decode_packet(shared,'json') if shared is not None else []
 shared_ids={x['id']for x in decoded_shared}
 @lru_cache(maxsize=12)
 def checken(p):
  b=read(p)
  if b is None:return False
  result,_,_,_=assembling(b,p,read,active);return result is not None
 for row in rows:
  m=row['map'];p=row['packet']
  b=read(m);h=read(p)
  row.update(mapBytesVerified=b is not None,packetHeaderVerified=h is not None)
  if b is not None:
   stage=obj(b)
   assert (stage['metadata']['stageId'],stage['id'])==(row['stage'],row['catalogID'])
   row['playBoundsDeclared']=(stage.get('playBounds') or {})
   row['terrainBoundsDeclared']=(stage.get('terrainBounds') or {})
  if h is not None:
   a,parts,agg,miss=assembling(h,p,read,active)
   row.update(binaryParts=parts,aggregate=agg,partsMissing=miss)
   if a is not None:
    bundle=decode_packet(a,row['encoding'])
    row.update(packetAggregateVerified=True,assetCount=len(bundle),packetWireBytes=len(a))
    assert not ({x['id']for x in bundle}&shared_ids)
    if b is not None and shared is not None:
     asset_ids={x['id']for x in bundle}|shared_ids
     miss=sorted({x['assetId']for x in stage['elements'] if x.get('assetId')}-asset_ids)
     row.update(placementUnknown=miss,staticRegistration='VERIFIED'if not miss else 'HOLD_UNKNOWN_PLACEMENT')
     if row['compactActiveAliases']:
      row.update(overrideBytesVerified=all(checken(p) for p in row['compactActiveAliases']),staticRegistration='BASE_PACKET_ONLY_COMPACT_OVERRIDE_SEPARATE')
  if o.tree:
   assert row.get('mapBytesVerified')and row.get('packetAggregateVerified')
   allneeded={m,p,*parts}
   if row['compactActiveAliases']:
    scope=row['compactActiveAliases'];wrap,pkg,*stageList=scope
    assert pkg.encode() in read(wrap)
    b=read(pkg);assert b is not None
    packed,pp,agg,pending=assembling(b,pkg,read,active)
    assert packed is not None and not pending
    allneeded.update([*scope,*pp]);root=obj(packed);n=row['stage']
    if len(scope)==3:
     assert obj(read(stageList[0]))==list(range(12,21)) and sorted(map(int,root))==list(range(12,21))
     root=root[str(n)]
    stage=root['stage'];original=root['source']
    assert stage['metadata']['stageId']==n and original['metadata']['stageId']==n and type(root['mapRevision']) is int
    assert all(type(x.get('id'))is str for x in root['assets'])
    row['compactWitness']={'width':stage['width'],'height':stage['height'],'revision':root['mapRevision'],
         'status':stage['metadata'].get('compactStatus'),'packageAssetIDs':[a['id']for a in root['assets']],'stageID':stage['id'],'origin':'official compact bytes'}
   row['requiredExactHTTP']=sorted(allneeded|{CAMPAIGN,ENTRY,*CLOSURE})
   row['activeDeclaredDimensions']=[stage['width'],stage['height']]
  row['density']='MEASURE_SEPARATELY_FROM_SIGNED_ACTIVE_BODY_RECIPE'
 summary={'format':FORMAT,'release':REL,'tree':TREE,'pagesRun':44918541021,'manifest':MF,'active':len(active),'stages':len(rows),'sourceMappingsVerified':len(allrows),
          'encodings':dict(Counter(x['encoding']for x in rows)),'splitStages':[x['stage']for x in rows if x['transport']=='split'],
          'mapBytesVerified':sum(x.get('mapBytesVerified',False)for x in rows),'packetDecodedVerified':sum(x.get('packetAggregateVerified',False)for x in rows),
          'bootAuthorityExactKnownBytes':boot,'trueChromeCases':0,'bodyDensityFreshCases':0,'shards':{f'Act{i}':[s for s in range((i-1)*10+1,i*10+1)]for i in range(1,6)},
          'rows':rows}
 r=obj((Path(__file__).resolve().parent/'BODY-REFERENCE.json').read_bytes())
 assert r['release']==REL
 for role in r['cases']+[r['partialStage46']]:
  assert all(active[k]==v for k,v in role['wire'].items())
 summary['BODYReferenceOnly']=r
 o.out.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
