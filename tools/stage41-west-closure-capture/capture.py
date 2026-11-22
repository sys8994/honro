"""Four real Stage41 screenshots from current anonymous app. Only B's exact common18 response changes."""
import base64,hashlib,io,json,math,os,subprocess,sys,urllib.request
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
O=json.loads((D/'observer.json').read_bytes())
L='https://sys8994.github.io/honro/'
M='web/manifest.json'
KEY=b'||b.honroStage===46&&["a5-left-cliff","a5-right-cliff"]'
INSERT=b'||b.honroStage===41&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==="campaign"&&b.honroAuthoredId==="stage-41"&&group.id==="a5-lower-road"&&p.x===250&&z.x===250&&p.y===2785&&z.y===2343.75&&b.terrain?.some(t=>t.id===group.id&&!t.broken&&t.oneWay===false&&t.honroAct5Painted===true)'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def mk(b):
 need(fact(b)==P['route'][P['runtime']] and b.count(KEY)==1,'exact common18 bytes/one uniquely identified source insertion required')
 z=b.replace(KEY,INSERT+KEY,1);need(z.replace(INSERT,b'',1)==b,'nonlocal or irreversible JS update')
 if P['compiledCandidate']:need(fact(z)==P['compiledCandidate'],'expected B compiled exact patch differs')
 return z
def bind():
 need(P['enabled'] is True,'Capture is disabled until coordinator approves exact pinned master.')
 need(not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'anonymous only')
 a=P['release'];g=lambda *args:subprocess.check_output(['git',*args],timeout=30,text=True).strip()
 need((os.getenv('GITHUB_REPOSITORY'),os.getenv('GITHUB_EVENT_NAME'),os.getenv('GITHUB_REF'))==('sys8994/honro','push',P['qaRef']), 'wrong exact QA ref')
 h=os.environ['GITHUB_SHA']; c=a['head']; repo=Path(os.environ['GITHUB_WORKSPACE'])
 need(g('rev-list','--parents','-1','HEAD').split()==[h,c] and g('rev-parse',c+'^{tree}')==a['tree'] and a['pages']['head']==c and a['pages']['conclusion']=='success','wrong pinned live parent')
 allowed={'.github/workflows/stage41-west-closure-capture.yml',*(str(D.relative_to(repo)/x) for x in ('capture.py','observer.json','PINS.json'))}
 need(set(g('diff','--no-renames','--name-status',c,h).splitlines())=={'A\t'+x for x in allowed} and not g('status','--porcelain'),'must be an exact add-only QA child')
 need(g('rev-parse',c+':shared/runtime/act5-edge-art.js')==P['stockSourceGit'] and fact((repo/M).read_bytes())==a['manifest'],'published source or manifest drift')
 return a
def fetch(p,pin):
 q=urllib.request.Request(L+p,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO anonymous render proof'})
 with urllib.request.urlopen(q,timeout=45) as r:
  need(r.geturl()==L+p and r.status==200,'public route not exact: '+p)
  b=r.read(pin['bytes']+1)
 need(fact(b)==pin,'public bytes differ: '+p)
 return b
OBS="""()=>{
 const b=HonroApp.engine.b,stage=HONRO_PROJECT.stages.find(x=>x.id==='stage-41');
 if(!stage||b.honroStage!==41||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-41')throw Error('not canonical Stage41');
 const match=(x)=>x.walkable===false&&x.a.x===250&&x.z.x===250&&x.a.y===2785&&x.z.y===2343.75;
 const g=HonroTerrainReadability.prepare(b).groups.find(g=>g.id==='a5-lower-road'),t=b.terrain.find(t=>t.id==='a5-lower-road'),q=HonroEdgeClosureQA;
 const a=HONRO_PROJECT.library.find(a=>a.id==='act5:near:41');
 if(!g||!t||t.broken||t.honroAct5Painted!==true||!q)throw Error('missing native outlined ground, original physical object, or painted owner');
 return {sourceClosure:g.segments.filter(match).length, omitted:q.removed.filter(x=>x.id===g.id&&match(x)).length,
  otherOmissions:q.removed.filter(x=>!(x.id===g.id&&match(x))),walks:g.segments.filter(x=>x.walkable),kept:q.keptWalkableCount,
  physics:HONRO_CORE.poly(t),walkableRemoved:q.walkableRemoved,oneWay:!!t.oneWay};
}"""
def png(b):
 from PIL import Image
 with Image.open(io.BytesIO(b))as im:
  im.load();return im.convert('RGBA')
def main(out):
 a=bind();out.mkdir(parents=True,exist_ok=True)
 q={'release':a,'status':'HOLD','scope':'Actual current Stage41 anonymous West A/B; one intercepted QA-only compiled response in B; no product build/release','views':{}}
 def save():(out/'BROWSER.json').write_text(json.dumps(q,indent=2)+'\n')
 save()
 try:
  r=a['shellAndEntry'];needed={**P['route'],'HONRO.html':r['shell'],r['entryPath']:r['entry']}
  public=json.loads(fetch(M,a['manifest']))
  idx={e['path']:{k:e[k]for k in ('bytes','sha256')}for e in public['files']}
  need(all(idx[k]==v for k,v in needed.items() if k!='HONRO.html'),'pinned runtime/Stage41 wire not active on Pages')
  needle=P['runtime'];before=fetch(needle,needed[needle]);after=mk(before)
  from playwright.sync_api import sync_playwright
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['browser']=br.version
   need(br.version=='151.0.7922.34','unexpected proof browser')
   try:
    for d in P['imageViews']:
     key=d['key'];q['views'][key]={}
     for arm in ('A','B'):
      W,H=d['dims']; c=br.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
      v=q['views'][key][arm]={'seen':{},'substitutions':0,'warnings':[]}
      try:
       p=c.new_page();responses={}
       p.on('pageerror',lambda e:v['warnings'].append(str(e)))
       p.on('response',lambda r:responses.setdefault(r.url,r) if r.url in {L+k for k in needed} else None)
       p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
       if arm=='B':
        def route(h):
         r0=h.fetch(max_redirects=0); b0=r0.body()
         need(r0.status==200 and r0.url==L+needle and b0==before,'B exact original response missing')
         v['substitutions']+=1
         h.fulfill(status=200,body=after,headers={'content-type':'application/javascript; charset=utf-8','cache-control':'no-store'})
        p.route(L+needle,route,times=1)
       nav=p.goto(L+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
       need(nav and nav.status==200 and nav.url==L+'HONRO.html' and not nav.from_service_worker,'bad actual shell navigation')
       p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
       p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
       p.evaluate(O['LAUNCH'],41)
       p.locator('#battlecanvas').wait_for(state='visible')
       p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
       args={'id':41,'mapId':'stage-41','name':'west','dx':-1,'dy':0,'ordinary':None,'readback':False,'fixedNow':O['PHASE']}
       s=p.evaluate(O['FROZEN'],args);dd=None
       try:
        dd=p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
       except Exception as e:v['warnings'].append(repr(e))
       img=base64.b64decode(p.evaluate(O['CANVAS']),validate=True); name=f'{key}-{arm}-actual-west-raw.png'
       (out/name).write_bytes(img);v['PNG']={'path':name,**fact(img)};save()
       v['pose']=s['meta'];v['native']=p.evaluate(OBS);v['decoded']=dd
       need(v['pose']['actual']==d['actual'] and list(png(img).size)==v['pose']['backing'],'wrong actual West camera')
       for k,pin in needed.items():
        x=responses.get(L+k); need(x and x.status==200 and not x.from_service_worker,('expected genuine HTTP route did not load',k))
        got=fact(x.body());need(got==(fact(after)if arm=='B'and k==needle else pin),('unexpected served bytes',k,got))
        v['seen'][k]=got
       need(v['substitutions']==int(arm=='B') and not v['warnings'] and dd is not None and dd['registered']>0 and not dd['failed'],
            ('actual render loading or single substitution failed',v['warnings'],dd))
      except Exception as e:v['error']=repr(e)
      finally:c.close();save()
     x,y=(q['views'][key][i]for i in 'AB')
     if any('error' in w for w in (x,y)):continue
     t,u=x['native'],y['native']
     need(x['pose']==y['pose'] and t['sourceClosure']==u['sourceClosure']==1 and t['omitted']==0 and u['omitted']==1 and
          t['walkableRemoved']==u['walkableRemoved']==0 and len(t['walks'])>0 and all(t[k]==u[k]for k in t if k!='omitted'),
          'wrong physical, prepared path or isolated native omission')
     ia,ib=(png((out/i['PNG']['path']).read_bytes())for i in (x,y))
     va,vb=ia.tobytes(),ib.tobytes();z=x['pose']['actual']['scale'];s=x['pose']['viewport']
     cx=(250-s['left'])*z; y0=(2343.75-s['top'])*z; y1=(2785-s['top'])*z
     stat={'target':0,'outside':0,'outsideMaxRGB':0,'alpha':0,'rect':[cx-3,y0-3,cx+3,y1+3],'focalColumns':[]}
     cols={}
     for i in range(0,len(va),4):
      if va[i:i+4]==vb[i:i+4]:continue
      px=i//4%ia.width;py=i//4//ia.width
      stat['alpha']+=va[i+3]!=vb[i+3]
      if cx-3<=px+.5<=cx+3 and y0-3<=py+.5<=y1+3:
       stat['target']+=1;cols[px]=cols.get(px,0)+1
      else:stat['outside']+=1;stat['outsideMaxRGB']=max(stat['outsideMaxRGB'],*(abs(va[i+j]-vb[i+j])for j in range(3)))
     stat['focalColumns']=sorted(cols.items());q['views'][key]['delta']=stat;save()
     need(stat['target']>=5 and stat['alpha']==0 and stat['outsideMaxRGB']<=2,'visual difference beyond expected narrow black stroke; hold with captured pair')
   finally:br.close()
  need(len(q['views'])==2 and all('delta' in v and not any('error' in v[a] for a in 'AB') for v in q['views'].values()),'incomplete evidence; see individual recorded errors')
  q['status']='ACTUAL_PC_M_WEST_PAIRS_READY_FOR_VISUAL_REVIEW_NOT_RELEASE'
 finally:save()
if __name__=='__main__':
 if sys.argv[1:]==['--verify-binding']:bind()
 else:main(Path(sys.argv[1]))
