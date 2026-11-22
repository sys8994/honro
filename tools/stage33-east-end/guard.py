"""Disabled normal QA carrier. Authored Stage33 East only; exact released stock A plus one isolated normal B."""
import contextlib,hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes()); SRC=P['source']; M='web/manifest.json'
E=(D/'EDITS.json').read_bytes()
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=90,text=True).strip()
def rd(r,k):
 p=r/k;need(p.is_file() and p.resolve().is_relative_to(r.resolve()),('unsafe path',k))
 return p.read_bytes()
def save(w,k,o):(w/'out'/k).write_text(json.dumps(o,indent=2)+'\n')
def rows(e):return e['vector']['root']['children'][0]['children'][0]['children']
def clip(e):return e['vector']['clips']['native-source-alpha']
def apply_records(records):
 need(stamp(E)==P['recipe'],'wrong signed source recipe')
 lookup={a['id']:a for a in records};need(len(lookup)==len(records),'duplicate owner')
 for q in json.loads(E):
  x=lookup[q['id']]; rr=rows(x)
  need(clip(x)==[q['oldClip']] and len(rr)==q['oldCount'] and rr[-1]['d']==q['oldLastPath'],'declared base source or compiled owner changed')
  clip(x)[0]=q['newClip'];rr.extend(q['paint'])
 return records
def compile_source(raw):
 old=json.loads(raw); expected=json.loads(raw); apply_records(expected['assets'])
 # Byte splice only named existing source D/clip and its last path's JSON group closure.
 for q in json.loads(E):
  o=json.dumps(q['oldClip']).encode();p=json.dumps(q['newClip']).encode()
  need(raw.count(o)==1,'unique lexical clip anchor')
  raw=raw.replace(o,p,1)
  needle=json.dumps(q['oldLastPath']).encode()
  need(raw.count(needle)==1,'unique original last path')
  k=raw.index(needle)+len(needle)
  r=re.search(rb'\n( *)\}\n( *)\]',raw[k:k+1600]);need(r and len(r[1])==len(r[2])+2,'no array group close')
  insert=k+r.end(1)+1
  payload=[]
  for v in q['paint']:
   s=json.dumps(v,indent=2).replace('\n','\n'+r[1].decode())
   payload.append(r[1]+s.encode())
  raw=raw[:insert]+b',\n'+b',\n'.join(payload)+raw[insert:]
 need(json.loads(raw)==expected,'lexical patch changed additional source data')
 return raw
def pre(w):
 a=P['release'];base=a['head'];repo=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA']
 need(P['enabled']is True and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'disabled or unexpectedly credentialed')
 dep=a['pages'];need(dep['head']==base and dep['branch']=='master' and dep['conclusion']=='success'
     and all(type(dep[k])is int and dep[k]>0 for k in ('run','job')),'current actual Pages receipt not bound')
 files={'.github/workflows/stage33-east-end-onebuild.yml',*(str(D.relative_to(repo)/n)for n in ('PINS.json','EDITS.json','guard.py','capture.py','observer.json'))}
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'wrong repo/event/ref')
 need(git(repo,'rev-list','--parents','-1','HEAD').split()==[h,base] and git(repo,'rev-parse',base+'^{tree}')==a['tree']
      and not git(repo,'status','--porcelain=v1')
      and set(git(repo,'diff','--no-renames','--name-status',base,h).splitlines())=={'A\t'+n for n in files},'unexpected QA child')
 need(stamp(rd(repo,M))=={**a['manifest'],'git':a['manifestGit']},'wrong exact released manifest')
 old=rd(repo,SRC);need(stamp(old)==P['stock'],'wrong current exact source')
 new=compile_source(old);need(stamp(new)==P['candidate'],'wrong intended edited lexical source')
 B=w/'B';git(repo,'worktree','add','--detach',str(B),base); (B/SRC).write_bytes(new)
 need(git(B,'diff','--name-status')=='M\t'+SRC,'other source changed')
 save(w,'SOURCE.json',{'head':h,'release':a,'source':SRC,'before':P['stock'],'candidate':P['candidate'],'twoSourceOwners':True})
def observe(w):
 A=Path(os.environ['GITHUB_WORKSPACE']);B=w/'B'; ms=[json.loads(rd(t,M))for t in (A,B)]
 cs=[json.loads(rd(t,v['project']))for t,v in zip((A,B),ms)]; pb=cs[1]['stageLibraries'][32];pa=P['packetA'];mp=P['map']
 need(cs[0]['stages']==cs[1]['stages'] and cs[0]['stages'][32]==mp and len(cs[0]['stages'])==50,'compiled map pointers changed')
 need(cs[0]['stageLibraries'][32]==pa and pb!=pa and re.fullmatch(r'web/data/chapter-33-assets\.[a-f0-9]{16}\.json',pb),'wrong Stage33 packet')
 need(cs[0]['stageLibraries'][:32]+cs[0]['stageLibraries'][33:]==cs[1]['stageLibraries'][:32]+cs[1]['stageLibraries'][33:],'other stage packet URI changed')
 need(cs[0].get('compatibility33')==cs[1].get('compatibility33') and rd(A,mp)==rd(B,mp),'retained compatibility/map drift')
 old_packet,new_packet=json.loads(rd(A,pa)),json.loads(rd(B,pb))
 need(apply_records(old_packet)==new_packet,'compiled delta deviates exact two native clips/facets, or deep/lower/other owner drift')
 need(stamp(rd(B,SRC))==P['candidate'],'built source drift')
 routes={}
 for k,t,v,pn in zip('AB',(A,B),ms,(pa,pb)):
  inv={r['path']:{n:r[n]for n in ('bytes','sha256')}for r in v['files']}
  entry=v['gameEntry'].split('?')[0];p=v['project']
  wrapper=re.findall(rb'\.\./runtime/(campaign\.[a-f0-9]{16}\.js)',rd(t,entry))
  need(len(wrapper)==1,'no unique active campaign wrapper')
  u='web/runtime/'+wrapper[0].decode();need(Path(p).name.encode() in rd(t,u),'wrong active campaign wrapper')
  keys={mp,pn,p,entry,u,P['farRaster'],'HONRO.html'}
  routes[k]={n:fact(rd(t,n))for n in sorted(keys)}
  need(all(inv[n]==routes[k][n]for n in keys-{'HONRO.html'}),'wrong build address attachment')
  need(pn.endswith(routes[k][pn]['sha256'][:16]+'.json'),'wrong asset hash URL')
 save(w,'NATIVE-ROUTES.json',{'routes':routes,'mapBytesUnchanged':True,'otherStagePointersUnchanged':True,'unchangedProtectedLowerCompiledOwner':True,'notReleaseApproval':True})
def seal(w):
 A=Path(os.environ['GITHUB_WORKSPACE']);B=w/'B';o=w/'out'
 cap=json.loads(rd(o,'BROWSER.json')); obs=json.loads(rd(o,'NATIVE-ROUTES.json'))
 need(cap['status']=='PASS_STAGE33_ACTUAL_EAST_TWO_POSE_PENDING_ART_REVIEW','actual Stage33 scope failure')
 old,new=(json.loads(rd(r,M)) for r in (A,B))
 ia,ib=({x['path']:fact(rd(t,x['path'])) for x in v['files']}for t,v in ((A,old),(B,new)))
 add=sorted(set(ib)-set(ia)); drop=sorted(set(ia)-set(ib))
 need(0<len(add)<=12 and len(add)==len(drop) and len(ib)==len(ia)==810 and
      all(ia[k]==ib[k] for k in set(ia)&set(ib)), 'unexpected active graph drift')
 need(all(k.startswith(('web/data/chapter-33-assets.','web/data/campaign.','web/runtime/campaign.','web/entries/'))for k in add+drop),'unrelated active asset change')
 need(set(obs['routes']['B'])-{'HONRO.html'}<=set(ib) and all(ib[k]==v for k,v in obs['routes']['B'].items() if k!='HONRO.html'),'verified routes did not seal')
 d=o/'B-generated-pending-art';d.mkdir()
 z=d/'B-EXACT-NORMAL-GENERATED-NO-DEPLOY.zip';files={}
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED)as f:
  for k in [*add,*sorted({M,SRC,'HONRO.html','HONRO_WORKSHOP.html','index.html'})]:
   v=rd(B,k);files[k]=stamp(v);f.writestr(k,v)
 (d/'SEAL.json').write_text(json.dumps({'status':cap['status'],'base':P['release']['head'],'files':files,
   'add':add,'displaced':drop,'zip':fact(z.read_bytes()),'visual':fact(rd(o,'BROWSER.json')),
   'routes':fact(rd(o,'NATIVE-ROUTES.json')),'released':False},indent=2)+'\n')
if __name__=='__main__':{'pre':pre,'observe':observe,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
