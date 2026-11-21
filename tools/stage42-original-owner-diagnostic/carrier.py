"""Read-only, previous rejected source forensic diagnostic. No release or replacement candidate."""
import argparse,base64,hashlib,io,json,os,re,sys,time,traceback
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'stage42-native-observer-pilot'))
import pilot as p
from recipes import R,apply,ASSET
AUTH=json.loads((HERE/'AUTH.json').read_bytes())
POS=('min-east','z094-east')
GROUP=('A','P','H')
ARCHIVE=('first','hit')
EXPECTED_PARENT='bbb0b171482f28470b82c18ba24edba1ace6eb7f'
BRANCH='refs/heads/qa/stage42-original-owner-diagnostic'
OLD={'PINS.json':'fcffb42af2f93761381f7329b69305571dc10f68ba8767dd9d66bb5440c1685d',
 'native.js':'e80cf7a83065fef0fba5df2e548c29effb3706d3d8da1d723092c5b3c3d5c2b5',
 'scene.js':'db4207aa70d2aceef7e6ff8da5d93f10b8267aaf0f3aa61c844a5e14db89a6f6',
 'pilot.py':'8c369c647700ce6c606e46b8aa462f447bc59b277dc9a1574710a3a5816916b2'}
if not __debug__:raise RuntimeError('strict guard requires assertions')

def secure(repo):
 p.secure(repo,False)
 h=os.environ['GITHUB_SHA']; g=lambda *s:p.git(repo,*s).decode().strip()
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',BRANCH)
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert AUTH['qaSource']==EXPECTED_PARENT and AUTH['plannedRef']==BRANCH
 assert h==g('rev-parse','HEAD') and g('rev-list','--parents','-n1',h).split()==[h,EXPECTED_PARENT]
 assert g('rev-list','--parents','-n1',EXPECTED_PARENT).split()==[EXPECTED_PARENT,p.R2]
 assert g('rev-list','--parents','-n1',p.R2).split()==[p.R2,p.R1]
 assert g('rev-list','--parents','-n1',p.R1).split()==[p.R1,p.BASE]
 names={'A\t.github/workflows/stage42-original-owner-diagnostic.yml',
        *('A\ttools/stage42-original-owner-diagnostic/'+n for n in ('carrier.py','AUTH.json','RECIPE.json','recipes.py'))}
 assert set(g('diff','--no-renames','--name-status',EXPECTED_PARENT,h).splitlines())==names
 assert not g('status','--porcelain=v1','--untracked-files=all')
 for n,v in OLD.items():assert p.sha(p.git(repo,'show',EXPECTED_PARENT+':tools/stage42-native-observer-pilot/'+n))==v
 return h

def roles(get):
 known=p.closure(get);a=get(ASSET);pack={k:apply(a,k)for k in GROUP}
 for k,w in pack.items():assert p.fact(w)=={m:R[k][m]for m in ('bytes','sha256')}
 for field in ('ownerSurfaceValueSHA256','ownerWallValueSHA256','ownerOriginalVectorSHA256','ownerValueSHA256'):
  a,p_,h=(AUTH['ownerLaws'][k][field]for k in GROUP)
  if field=='ownerSurfaceValueSHA256':assert a==p_==h
  if field=='ownerWallValueSHA256':assert a!=p_ and a==h
  if field=='ownerOriginalVectorSHA256':assert a==p_ and a!=h
  if field=='ownerValueSHA256':assert len({a,p_,h})==3
 assert AUTH['ownerLaws']['A']=={k:p.PIN[k]for k in AUTH['ownerLaws']['A']}
 return known,pack

def audit_net(ev,arm,pack):
 raw=ev.receipt();req=raw['requests'];wire=raw['served']
 visible=[w for w in req if w['path'] not in p.MEDIA_PINS];sounds=[w for w in req if w['path'] in p.MEDIA_PINS]
 actual_non=[];selected=[];audio=[]
 for w in visible:
  if w['state']!='BODY_EXACT':continue
  f=w['actualBody'];k=w['path'];row=(k,w['status'],f['bytes'],f['sha256'])
  if k==ASSET:
   selected.append(row);assert f==p.fact(pack)
   f=p.PIN['file'][ASSET];row=(k,w['status'],f['bytes'],f['sha256'])
  actual_non.append(row)
 actual_non.sort();signature=p.sha(p.canon(actual_non))
 for w in sounds:
  k=w['path'];h=w['sampling'].get('headers',{});rid=h.get('wireID');entry=wire.get(rid) or {}
  size=p.MEDIA_PINS[k]['bytes']
  # Audio is deliberately separate from the actual nonmedia receipt. Require
  # the observed browser metadata and exact issued bytes, not audible playback
  # or a declared terminal event. Unknown is never called delivered/canceled.
  trusted=(w['start'] and w['method']=='GET' and w['resource']=='media' and w['range']=='bytes=0-'
   and h.get('url')==ev.origin+k and h.get('status')==206 and h.get('contentLength')==str(size)
   and h.get('contentRange')==f'bytes 0-{size-1}/{size}' and entry.get('path')==k
   and entry.get('status')==206 and entry.get('range')=='bytes=0-'
   and entry.get('body')==p.MEDIA_PINS[k] and entry.get('socket') in ('WRITTEN','PEER_CLOSED'))
  audio.append({'path':k,'wireID':rid,'headersAndIssuedExact':trusted,'browserTerminal':w['state'],
                'actualBodyIfSeen':w.get('actualBody'),'browserFailure':w.get('failure')})
 aids=[q['wireID']for q in audio if q['headersAndIssuedExact']]
 ids=[q['wireID']for q in visible if q['state']=='BODY_EXACT']+aids
 missing=sorted(set(p.PIN['required'])-{q['path']for q in visible if q['state']=='BODY_EXACT'})
 exactly=(not raw['errors'] and not raw['serverViolations'] and len(visible)==282 and
  (len(actual_non),signature)==p.R1_NONMEDIA and len(selected)==1 and not missing
  and Counter(x['path']for x in sounds)==Counter(p.MEDIA_PINS.keys())
  and len(aids)==2 and len(set(ids))==len(ids) and set(ids)==set(wire))
 return raw,{'scope':'strict nonmedia; audio response/issuance observed separately, terminal may remain HOLD',
  'arm':arm,'valid':exactly,'nonmediaBodyCount':len(actual_non),'normalizedSHA':signature,'activeMissing':missing,
  'exactFixtureRequest':selected,'audio':audio,'fullAudioTerminalVerified':all(x['browserTerminal'] in
    ('BODY_EXACT','CANCELED_PERMITTED_UNREAD_BODY')for x in audio) and len(audio)==2}

def saveimage(out,filename,b):
 from PIL import Image
 (out/filename).write_bytes(b)
 with Image.open(io.BytesIO(b))as im:
  im.load();dim=im.size;assert im.format=='PNG'
  return {**p.fact(b),'path':filename,'size':list(dim),'rgba':p.sha(im.convert('RGBA').tobytes())}

def visit(browser,get,known,pack,arm,m,n,out,row,emit):
 # Browser and launcher read genuine compiled current renderer. Variants only
 # alter the one signed fixture response on separate ephemeral loopback hosts.
 effective={**known,ASSET:p.fact(pack)}
 with p.wire(lambda key:pack if key==ASSET else get(key),effective)as (origin,read,snapshot):
  body(browser,effective,pack,arm,m,n,origin,read,snapshot,out,row,emit)

def body(browser,known,pack,arm,mode,pose,origin,read,snapshot,out,row,emit):
 name=pose['name'];auth=AUTH['pinnedA'][name]
 ctx=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block',reduced_motion='reduce')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script(p.INIT)
 errors=[];ev=p.Ledger(known,origin,read,snapshot,errors)
 ctx.route(re.compile(r'^https?://(?!'+re.escape(urlsplit(origin).netloc+'/')+r')'),lambda route:route.abort())
 for e,f in [('request',ev.request),('response',ev.response),('requestfinished',ev.finished),
              ('requestfailed',ev.failed),('pageerror',lambda x:errors.append(['page error',str(x)]))]:page.on(e,f)
 row.update(status='INIT',frames={},cache={},errors=errors)
 installed=False
 def collect_net():
  try:row['network'],row['networkScope']=audit_net(ev,arm,pack)
  except Exception as e:errors.append(['network accounting exception',repr(e)])
 def rendering(phase,c,q):
  val=page.evaluate(p.SCENE,{'op':'paint','css':c['css'],'backing':c['backing'],'center':c['center'],'pose':q})
  row['cache'][phase]=val
  return val
 def park(q):return page.evaluate(p.SCENE,{'op':'park','css':p.PIN['css'],'pose':q})
 try:
  nav=page.goto(origin+p.SHELL,wait_until='domcontentloaded',timeout=50000)
  assert nav and nav.url==origin+p.SHELL and nav.status==200 and not nav.from_service_worker and nav.body()==read(p.SHELL)
  q=nav.request;assert q.method=='GET' and q.frame==page.main_frame and q.is_navigation_request()and not q.redirected_from and not q.redirected_to
  row['navigation']=p.fact(nav.body());assert row['navigation']==p.PIN['file'][p.SHELL]
  collect_net();emit()
  page.wait_for_function(p.READY,timeout=45000)
  page.evaluate(p.ENTRY);canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  law={**p.PIN,**AUTH['ownerLaws'][arm]}
  row['provider']=page.evaluate(p.SCENE,{'op':'prepare','law':law})
  assert row['provider']=={**auth['provider'],'ownerSHA':law['ownerValueSHA256']}
  prime={'requested':[3250,1430.5,.55]};rendering('prime',park(prime),prime)
  row['decode']=page.evaluate(p.DECODE);assert row['decode']['number']>0 and row['decode']['font']=='loaded' and not row['decode']['bad']
  view=park(pose);assert view==auth['camera'];row['camera']=view;collect_net();emit()
  if mode=='N':
   try:installed=page.evaluate(p.NATIVE,{'op':'install','pose':{**pose,'matrix':auth['matrix']},'backing':view['backing'],'center':view['center']})
   except Exception as e:row.setdefault('observerErrors',[]).append(['install',repr(e)])
  for phase in p.PHASES:
   if installed:
    try:page.evaluate(p.NATIVE,{'op':'phase','phase':phase})
    except Exception as e:row.setdefault('observerErrors',[]).append(['phase',phase,repr(e)])
   rendering(phase,view,pose)
   if phase in ARCHIVE:
    key=f'{mode}-{arm}-{name}-{phase}'
    raw=base64.b64decode(page.evaluate(p.RAW),validate=True)
    fr=row['frames'].setdefault(phase,{})
    fr['raw']=saveimage(out,key+'-raw.png',raw);emit()
    fr['dom']=saveimage(out,key+'-dom.png',canvas.screenshot(animations='disabled',timeout=30000));emit()
    assert fr['raw']['size']==view['backing'] and fr['dom']['size'][0]==1440 and fr['dom']['size'][1] in (769,770)
    assert base64.b64decode(page.evaluate(p.RAW),validate=True)==raw
   if installed:
    try:row['cache'][phase]['observerBinding']=page.evaluate(p.NATIVE,{'op':'commit'})
    except Exception as e:row.setdefault('observerErrors',[]).append(['commit',phase,repr(e)])
   collect_net()
  if installed:
   row['observer']=page.evaluate(p.NATIVE,{'op':'finish'})
   p.save(out/f'{mode}-{arm}-{name}-native.json',row['observer']);installed=False
  end=time.monotonic()+8
  while True:
   collect_net()
   if row.get('networkScope',{}).get('valid') or errors or time.monotonic()>=end:break
   page.wait_for_timeout(100)
  assert ev.blobs<=set(page.evaluate('()=>Array.from(__s42PilotImages.blobs)'))
  assert not errors and row.get('networkScope',{}).get('valid'),('strict nonmedia scope failed',row.get('networkScope'))
  row['status']='CAPTURED_NONMEDIA_EXACT'
 except Exception as e:row.update(status='HOLD',error=[repr(e),traceback.format_exc()])
 finally:
  if installed:
   try:row['observer']=page.evaluate(p.NATIVE,{'op':'finish'});p.save(out/f'{mode}-{arm}-{name}-native.json',row['observer'])
   except Exception as e:row.setdefault('observerErrors',[]).append(['finish',repr(e)])
  try:ctx.close()
  finally:emit()

def chart_diff(a,b):
 if a==b:return {'pixels':0,'alpha':0,'maxDelta':0}
 assert len(a)==len(b) and len(a)%4==0
 pix=alpha=md=0
 for k in range(0,len(a),4):
  d=[abs(x-y)for x,y in zip(a[k:k+4],b[k:k+4])]
  pix+=max(d)>0;alpha+=d[-1]>0;md=max(md,max(d))
 return {'pixels':pix,'alpha':alpha,'maxDelta':md}

def bound(ev,pose):
 out=ev.get('observer')or {}
 assert out.get('bound') is True and out.get('untouchedMain')is True and not out.get('errors') and not ev.get('observerErrors')
 events=out['events'];mat=AUTH['pinnedA'][pose['name']]['matrix']
 assert [e['tag']for e in events]==p.TAGS and all(e['phase']=='first'and e['basis']==mat for e in events)
 assert all(len(e['spots'])==3 and len(s['rgba'])==100 for e in events for s in e['spots'])
 return events

def native_diff(A,B):
 rows=[]
 for a,b in zip(A,B):
  assert (a['tag'],a['phase'],a['matrix'],a['basis'])==(b['tag'],b['phase'],b['matrix'],b['basis'])
  changes=[]
  for u,v in zip(a['spots'],b['spots']):
   assert {k:q for k,q in u.items()if k!='rgba'}=={k:q for k,q in v.items()if k!='rgba'}
   changes.append({**chart_diff(u['rgba'],v['rgba']),'anchor':u['anchor'],'world':u['world']})
  rows.append({'ownerEvent':a['tag'],'neighborhoods':changes})
 return rows

def final_diff(out,a,b):
 from PIL import Image,ImageChops
 if a['rgba']==b['rgba']:return {'pixels':0,'alpha':0,'box':None}
 with Image.open(out/a['path'])as m,Image.open(out/b['path'])as n:
  x,y=m.convert('RGBA'),n.convert('RGBA');assert x.size==y.size
  chan=ImageChops.difference(x,y).split()
  mask=ImageChops.lighter(ImageChops.lighter(chan[0],chan[1]),ImageChops.lighter(chan[2],chan[3]))
  return {'pixels':x.width*x.height-mask.histogram()[0],
   'alpha':x.width*x.height-chan[3].histogram()[0],'box':mask.getbbox()}

def report(report,outdir):
 result={};hold=[]
 for po in (q for q in p.PIN['poses']if q['name']in POS):
  n=po['name'];out=result[n]={'role':'forensic only; H remains rejected'};v=report['visits'];read=lambda a,b:v.get(f'{a}/{b}/{n}',{})
  try:
   rows={m:{a:read(m,a)for a in GROUP}for m in ('plain','N')}
   # Frame/source proof and network admission remain separate in the receipt.
   for m in rows:
    for a in rows[m]:
     x=rows[m][a];assert tuple(x['frames'])==ARCHIVE
     if x.get('status')!='CAPTURED_NONMEDIA_EXACT':hold.append([n,m,a,'nonmedia/source admission HOLD'])
   for a in GROUP:
    aa,nn=rows['plain'][a],rows['N'][a]
    assert aa['camera']==nn['camera'] and aa['provider']==nn['provider'] and aa['navigation']==nn['navigation']
    for ph in p.PHASES:
     assert aa['cache'][ph]=={k:v for k,v in nn['cache'][ph].items()if k!='observerBinding'}
     assert aa['cache'][ph]==rows['plain']['A']['cache'][ph],(a,ph,'cache/phase mismatch from current A')
    d=nn['cache'];fi=d['first'];hit=d['hit'];q=fi['after']['tile'];ix,iy=map(int,po['target'].split(':'));rs=po['rs']
    assert fi['before']['tile'] is None and fi['after']['domainRS']==rs and fi['after']['tileBuilds']>fi['before']['tileBuilds']
    assert q=={'size':[516,516],'left':ix*(512/rs),'top':iy*(512/rs)}
    assert hit['after']['tileBuilds']==fi['after']['tileBuilds'] and hit['after']['screenHits']>hit['before']['screenHits']
    for ph in ARCHIVE:
     for kind in ('raw','dom'):
      logo=lambda v:{k:w for k,w in v['frames'][ph][kind].items()if k!='path'}
      assert logo(aa)==logo(nn),(a,ph,kind,'observer perturbation')
      if a=='A':assert logo(aa)['sha256']==AUTH['pinnedA'][n][ph][kind],(ph,kind,'historical R3 A changed')
      if a=='P':assert logo(aa)==logo(rows['plain']['A']),(ph,kind,'past positive P differs from A')
   a,pp,h=(bound(rows['N'][k],po)for k in GROUP)
   out['A_vs_P_native']=native_diff(a,pp)
   assert all(not w['pixels'] for v in out['A_vs_P_native']for w in v['neighborhoods']),'positive historical P native mismatch'
   out['A_vs_rejected_H_native']=native_diff(a,h)
   first=next((x['ownerEvent']for x in out['A_vs_rejected_H_native']if any(q['pixels']for q in x['neighborhoods'])),None)
   out['firstLocalNativeDifference']=first
   if first=='landmark:before':hold.append([n,'unexplained pre-owner readback difference'])
   out['beforeTileToMainAtSampledOwner']=first is not None and first!='landmark:before'
   out['A_vs_rejected_H_finalFrame']={q:{k:final_diff(outdir,rows['plain']['A']['frames'][q][k],
     rows['plain']['H']['frames'][q][k])for k in ('raw','dom')}for q in ARCHIVE}
   final=[v for q in out['A_vs_rejected_H_finalFrame'].values()for v in q.values()]
   if any(v['alpha'] for v in final):
    hold.append([n,'unexplained final-frame alpha/geometry difference; native owner observations remain separate'])
   if any(v['pixels'] for v in final) and not out['beforeTileToMainAtSampledOwner']:
    hold.append([n,'final RGBA differs but no observed native owner explains it at recorded points'])
   out['globalCausalClaim']=False
   out['interpretation']='native difference at recorded support before transfer' if out['beforeTileToMainAtSampledOwner'] else 'not localized at recorded native support'
  except Exception as e:hold.append([n,repr(e)])
 return result,hold

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--repo',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--preflight',action='store_true');ns=ap.parse_args()
 out=ns.out;out.mkdir(exist_ok=True,parents=True)
 proof={'status':'HOLD','base':p.BASE,'scope':'A/P/rejected H, real native two tiles, no product, no release and no optimization',
        'historicalR3Max':AUTH['optionalMaxHistorical'],'historicalR3FullMedia':AUTH['historicalFullMediaTerminal'],'visits':{}}
 def emit():p.save(out/'DIAGNOSTIC.json',proof)
 emit()
 try:
  proof['head']=secure(ns.repo);get=lambda k:p.git(ns.repo,'show',p.BASE+':'+k);known,pack=roles(get)
  proof['preflight']={k:p.fact(v)for k,v in pack.items()};emit()
  if ns.preflight:return
  from playwright.sync_api import sync_playwright
  with sync_playwright()as pw:
   b=pw.chromium.launch(headless=True,args=['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--no-proxy-server','--disable-background-networking'])
   try:
    proof['browser']=b.version;assert b.version==p.PIN['browser']
    for mode in ('plain','N'):
     for arm in GROUP:
      for po in (q for q in p.PIN['poses'] if q['name'] in POS):
       row=proof['visits'][f'{mode}/{arm}/{po["name"]}']={};emit()
       try:visit(b,get,known,pack[arm],arm,mode,po,out,row,emit)
       except Exception as e:row.update(status='HOLD',error=[repr(e),traceback.format_exc()]);emit()
   finally:b.close()
  proof['diagnosis'],proof['issues']=report(proof,out)
  if proof['issues']:raise RuntimeError('HOLD: use separate raw, media, and native evidence; no retry inferred')
  proof['status']='SCOPED_2_TILES_DIAGNOSTIC_COMPLETE_H_REMAINS_REJECTED'
 except Exception as e:proof['error']=[repr(e),traceback.format_exc()];raise
 finally:emit()
if __name__=='__main__':main()
