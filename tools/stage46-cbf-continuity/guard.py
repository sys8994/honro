import json,re,subprocess,sys
from pathlib import Path
from verify import sha, references
HERE=Path(__file__).resolve().parent
CONF=json.loads((HERE/'expected.json').read_text())
PRE='52119985ad21a7d3de04245ee146293045edbeba'
TARGET='cbf037199e56c640165dd53d8b00827902260862'
TREES={PRE:'746fafe4563775327f4ce87e65c87ae1d9a0b159',TARGET:'3e01d8685238882ddad3e3ddff46a40a753587d9'}
PATHS={
 'shared/assets/environment/act5/stage42-registered-body.json':'9aa80be2587da8f96a04df14e431cbb825611994',
 'shared/runtime/act5-edge-art.js':'1d0719ff1d56e3c6720f7e7166b3266864a49415',
 'tests/stage42-edge-geology.mjs':'5ce5b702548c658ed4f49c09729113a3b742f84f'}
def git(*a): return subprocess.check_output(['git',*a]).decode().strip()
def source():
 for rev,t in TREES.items():assert git('rev-parse',rev+'^{tree}')==t
 assert git('rev-parse',TARGET+'^')==PRE
 assert git('rev-parse','HEAD^')==TARGET
 for p,v in PATHS.items(): assert git('rev-parse',TARGET+':'+p)==v
 assert git('diff','--name-only',PRE,TARGET).splitlines()==list(PATHS)
 qa=['.github/workflows/stage46-cbf-continuity.yml',*[f'tools/stage46-cbf-continuity/{n}' for n in ('capture.py','expected.json','guard.py','verify.py')]]
 assert git('diff','--name-status',TARGET,'HEAD').splitlines()==['A\t'+p for p in qa]
 p='shared/runtime/act5-edge-art.js'
 assert git('rev-parse',PRE+':'+p)=='09a70bccac0ede6bee32e57d893be6a0d63b51ef'
 a,b=[subprocess.check_output(['git','show',r+':'+p]) for r in (PRE,TARGET)]
 pattern=rb"if\(l\.asset\?\.id==='act5:near:42'\)\{[^\n]+?;\}(?=if\(l\.asset\?\.id==='act5:near:41')"
 k=[list(re.finditer(pattern,s)) for s in (a,b)]
 assert len(k[0])==len(k[1])==1
 assert a[:k[0][0].start()]==b[:k[1][0].start()] and a[k[0][0].end():]==b[k[1][0].end():]
 for u,s in zip(k,(a,b)):assert s[:u[0].start()].count(b'\n')+1==319
 assert b'const s=l.scale??1,a=l.asset.edgeWall.bounds' in k[1][0][0]
 print(json.dumps(dict(base=PRE,target=TARGET,trees=TREES,targetOnly=PATHS,sharedRendererOnly='Stage42 bounds clause line319',qaOnly=qa),indent=2))
def built(root,out):
 g=references(root);m=g.pop('referenceDocument');seen=g['reachable']
 assert len(m['stages'])==len(m['stageLibraries'])==50
 assert g['htmlSHA256']==CONF['expectedTargetHTML']
 for p,x in CONF['expectedTargetLink'].items():
  assert {k:v for k,v in seen[p].items() if k!='path'}==x,('active chain',p)
 a,b=m['stages'][45],m['stageLibraries'][45]
 assert (a,b)==tuple(g['selected'][46][k]['path'] for k in ('stages','stageLibraries'))
 assert {k:v for k,v in seen.items() if Path(k).name.startswith('chapter-46')}==CONF['priorStage46']
 desc=json.loads((root/b).read_bytes());assert desc==CONF['desc']
 parts=b''.join((root/v['path']).read_bytes() for v in desc['parts'])
 assert (len(parts),sha(parts))==(desc['bytes'],desc['sha256'])
 enc=m['assetEncodings']['stageLibraries'][45]
 assert enc=='json-pool-v1',enc
 paths={k:m['assetPaths'][k][45] for k in ('stages','stageLibraries')}
 assert paths=={'stages':[],'stageLibraries':[]},paths
 wrapper=next(p for p in CONF['expectedTargetLink'] if p.startswith('web/runtime/campaign.'))
 assert g['campaign']['path'] in (root/wrapper).read_text()
 record=dict(root=TARGET,htmlSHA256=g['htmlSHA256'],chain=CONF['expectedTargetLink'],stage46=g['selected'][46],assets=CONF['priorStage46'],assembled={'sha256':sha(parts),'bytes':len(parts)},encoding=enc,assetPaths=paths,reachableCount=g['reachableCount'])
 (out/'continued-stage46-graph.json').write_text(json.dumps(record,indent=2)+'\n')
 print(json.dumps(record,indent=2))
if sys.argv[1:]==['source']: source()
elif len(sys.argv)==4 and sys.argv[1]=='built':built(Path(sys.argv[2]),Path(sys.argv[3]))
else:raise SystemExit('source | built ROOT OUT')
