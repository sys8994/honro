"""One standard build against exact current published Stage41 source; no write to refs."""
import json,hashlib,os,re,subprocess,sys,zipfile
from pathlib import Path
from shared import P,sha,fact,need,mk,INSERT
D=Path(__file__).resolve().parent
MF='web/manifest.json'; REL='shared/runtime/act5-edge-art.js'
SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
def git(root,*a):return subprocess.check_output(['git','-C',str(root),*a],timeout=90).decode().strip()
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def read(root,k):
 p=root/k
 need(not k.startswith('/') and '..' not in Path(k).parts and not p.is_symlink(),('unsafe file',k))
 return p.read_bytes()
def save(w,name,d):(w/'out'/name).write_text(json.dumps(d,indent=2)+'\n')
def pre(w):
 r=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA'];a=P['release'];base=a['head']
 need(P['enabled'] and not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'disabled or non-read-only runner')
 need((os.getenv('GITHUB_REPOSITORY'),os.getenv('GITHUB_EVENT_NAME'),os.getenv('GITHUB_REF'))==('sys8994/honro','push',P['qaRef']),
      'unexpected repo/event/QA branch')
 need(a['pages']['head']==base and a['pages']['conclusion']=='success' and git(r,'rev-list','--parents','-1','HEAD').split()==[h,base]
      and git(r,'rev-parse',base+'^{tree}')==a['tree'] and not git(r,'status','--porcelain'),'expected clean direct QA child of actual master')
 fs={'A\t.github/workflows/stage41-west-normal-onebuild.yml',*('A\t'+str(D.relative_to(r)/n) for n in
       ('PINS.json','shared.py','guard.py','capture.py','observer.json'))}
 need(set(git(r,'diff','--no-renames','--name-status',base,h).splitlines())==fs,'not add-only transport')
 for k in ('A','B'):git(r,'worktree','add','--detach',str(w/k),base)
 s=read(w/'A',REL);need(stamp(s)==P['stockSource'],'wrong exact renderer source A')
 q=b"||(b.honroStage===46&&['a5-left-cliff','a5-right-cliff']"
 fix=b'||('+INSERT[2:].replace(b'"',b"'")+b')'
 need(s.count(q)==1,'source target ambiguous')
 new=s.replace(q,fix+q,1)
 need(stamp(new)==P['candidateSource'] and new.replace(fix,b'',1)==s,'not exact reviewed source B')
 need(stamp(read(w/'A',MF))=={**a['manifest'],'git':P['parentManifestGit']},'A manifest not the live release')
 (w/'B'/REL).write_bytes(new)
 need(git(w/'B','diff','--name-status')=='M\t'+REL,'non-target source changed')
 save(w,'SOURCE.json',{'base':base,'tree':a['tree'],'head':h,'path':REL,'old':P['stockSource'],'candidate':P['candidateSource'],'diagnostic':P['diagnostic']})
def inventory(m):
 d={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
 need(len(d)==len(m['files'])==810,'unexpected active manifest size')
 return d
def built(w):
 a,b=w/'A',w/'B';m,n=(json.loads(read(t,MF))for t in (a,b)); A,B=map(inventory,(m,n))
 need(stamp(read(b,REL))==P['candidateSource'] and stamp(read(a,REL))==P['stockSource'],'source drift after build')
 paths=git(b,'diff','--name-only').splitlines()
 need(REL in paths and all(k in SHELL or k==REL or k.startswith('web/')for k in paths),'build edited unrelated source')
 old,new=P['runtime'],P['candidateRuntime']
 need(fact(read(a,old))==A[old] and B[new]==P['compiledCandidate'] and read(b,new)==mk(read(a,old)),
      'normal compile did not exactly produce already reviewed response substitution')
 need(m['project']==n['project'] and A[m['project']]==B[n['project']],'campaign manifest changed')
 c=json.loads(read(a,m['project'])); maps=c['stages']; packs=c['stageLibraries']
 need(len(maps)==len(set(maps))==len(packs)==len(set(packs))==50
      and maps[40]=='web/data/chapter-41.deb88737d28c9104.json'
      and packs[40]=='web/data/chapter-41-assets.138e4fcb5537cad7.json','exact 50-map/asset authority differs')
 pairs=[(old,new)]+[(m[k].split('?')[0],n[k].split('?')[0])for k in ('gameEntry','workshopEntry','playtest')]
 need(len({x for x,_ in pairs})==len({y for _,y in pairs})==4 and all(x!=y for x,y in pairs),'expected exact four changed output names')
 need(A.keys()-B.keys()=={x for x,_ in pairs} and B.keys()-A.keys()=={y for _,y in pairs}
      and all(A[k]==B[k]for k in A.keys()&B.keys()),'other active outputs changed')
 need(all(A[k]==B[k] and fact(read(a,k))==fact(read(b,k))==A[k]for k in maps+packs),'other maps/asset byte drift')
 def normal(s):
  for x,y in pairs:s=s.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
  return s
 need(all(normal(read(b,k))==read(a,k)for k in SHELL) and all(normal(read(b,y))==read(a,x)for x,y in pairs[1:]),'bootstrap change beyond names')
 need([x for x,y in zip(m['common'],n['common'])if x!=y]==[old] and m['gameOnly']==n['gameOnly'],'other runtime slot changed')
 paths=sorted({y for _,y in pairs}|SHELL|{MF}); need(len(paths)==8,'unexpected product closure')
 need(all(fact(read(b,k))==B[k]for k in set(B)&set(paths)),'output checksum mismatch')
 must=sorted((set(P['route'])-{old})|{new,'HONRO.html',n['gameEntry'].split('?')[0]})
 save(w,'GRAPH.json',{'activeAssetsAnd50MapsExact':True,'orderedModulesExactOutsideAct5':True,'mapCount':50,'assetPacketCount':50,
      'repacked':[[old,new]],'allRenamedPaths':pairs,'mustObserveB':must,'B':{**B,**{k:fact(read(b,k))for k in SHELL|{MF}}}})
def seal(w):
 o=w/'out';b=w/'B';h=json.loads((o/'BROWSER.json').read_bytes());g=json.loads((o/'GRAPH.json').read_bytes())
 need(h['status']=='PASS_NORMAL_B_TWO_ACTUAL_EXACT_REVIEWED_FRAMES_NOT_DEPLOYED','only successful actual normal B')
 paths=sorted({y for _,y in g['allRenamedPaths']}|SHELL|{MF}); d=o/'B-generated-for-held-release';d.mkdir()
 z=d/'B-EXACT-NORMAL-GENERATED-NO-DEPLOY.zip'
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED)as f:
  files={}
  for k in paths:
   v=read(b,k);need(fact(v)==g['B'][k],'post-browser compiled bytes drift')
   files[k]=stamp(v);f.writestr(k,v)
 (d/'SEAL.json').write_text(json.dumps({'status':h['status'],'authorPath':REL,'author':P['candidateSource'],'base':P['release']['head'],
         'noDeployAuthorized':True,'requiresPublishedRetention':True,'files':files,'zip':fact(z.read_bytes()),
         'browser':fact((o/'BROWSER.json').read_bytes()),'graph':fact((o/'GRAPH.json').read_bytes())},indent=2)+'\n')
if __name__=='__main__':{'pre':pre,'built':built,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
