"""Single-stage public stock exact read-only canary. No routing, replacements or product source writes."""
import base64,io,json,math,os,re,statistics,subprocess,sys,time
from pathlib import Path
from hashlib import sha256
from io import BytesIO
from urllib.request import Request,build_opener,HTTPRedirectHandler
REL='acb51f4ee1c5afa90751dc256d6ad8d900732779'
TREE='5cc36cfd7ef62fc801dc967605260610596d8061'
MANIFEST='web/manifest.json'; MF={'bytes':6458505,'sha256':'e274ee2d3dbfee5ce35dfccd6055bfa1a898e3804bde80b687fd49f890c4079b'}
CAMPAIGN='web/data/campaign.7140da5d3649e4ab.json'
SHELL='HONRO.html'; ENTRY='web/entries/game.b0b1e648c2c03457.js'
SHELL_FACT={'bytes':17379,'sha256':'7f0b08897737d44f4f7d9a436e703b7ec48659fcb121098ea1cffd5b1f93d46d'}
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
API='sys8994/honro'
BASE='https://sys8994.github.io/honro/'
REF='refs/heads/qa/acb51-stage12-east-stock-r2'
RUN,JOB=44918541021,136889673324
PATHS={'.github/workflows/acb51-stage12-east-stock.yml',*(f'tools/acb51-stage12-east-stock/{x}'for x in ('stock.py','park.js','PINS.json'))}
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f\d-]{36}')
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
def save(p,x):
 tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');tmp.replace(p)
def git(*k):return subprocess.check_output(['git',*k],timeout=90).decode().strip()
def gh(path):return obj(subprocess.check_output(['gh','api','repos/'+API+'/'+path],timeout=25))
def authority(w):
 head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(API,REF,'push')
 assert git('rev-list','--parents','-n1','HEAD').split()==[head,REL]
 assert git('rev-parse',REL+'^{tree}')==TREE and git('status','--porcelain=v1')==''
 assert set(git('diff','--name-status','--no-renames',REL,head).splitlines())=={'A\t'+x for x in PATHS}
 assert all(git('ls-tree',head,'--',x).split()[0]=='100644'for x in PATHS)
 assert gh('git/ref/heads/master')['object']['sha']==REL
 p=gh(f'actions/runs/{RUN}');j=gh(f'actions/jobs/{JOB}')
 assert p['repository']['full_name']==p['head_repository']['full_name']==API
 assert (p['id'],p['head_sha'],p['head_branch'],p['name'],p['status'],p['conclusion'])==(RUN,REL,'master','pages build and deployment','completed','success')
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(JOB,RUN,'deploy','completed','success')
 assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success'for x in j['steps'])
 assert facts(subprocess.check_output(['git','show',REL+':'+MANIFEST],timeout=30))==MF
 save(w/'out'/'AUTHORITY.json',{'release':REL,'tree':TREE,'pages':[RUN,JOB],'manifest':MF,'head':head,'verified':True})
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*v,**k):raise RuntimeError('unexpected redirect')
def exact_public(path,info):
 with build_opener(NoRedirect).open(Request(BASE+path,headers={'Accept-Encoding':'identity'}),timeout=30)as r:
  assert r.status==200 and r.url==BASE+path
  return known(path,r.read(info['bytes']+1),info)

H=Path(__file__).resolve().parent
P=obj((H/'PINS.json').read_bytes())
PARK=(H/'park.js').read_text()
INIT=r"""()=>{
 const images=new Set(),blobs=new Set(),o=HTMLImageElement.prototype,d=Object.getOwnPropertyDescriptor(o,'src');
 Object.defineProperty(o,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const mk=URL.createObjectURL;URL.createObjectURL=function(...args){const u=Reflect.apply(mk,this,args);blobs.add(u);return u;};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async q=>{
 const a=window.HonroApp,id=q.stage;
 if(!a||typeof a.launch!=='function')throw Error('normal app not ready');
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await Promise.race([HonroCampaignLoader.ensureStage(id),new Promise((_,bad)=>setTimeout(()=>bad(Error('ensureStage deadline')),90000))]);
 const st=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===id), expected=q.activeDeclaredDimensions;
 if(!st||st.id!==q.catalogID||st.pending||st.width!==expected[0]||st.height!==expected[1])
   throw Error('active declared stage differs from exact current provider: '+st?.id);
 const c=q.compactWitness||null;
 if(c){
   const pkg=id===11?window.HONRO_STAGE11_COMPACT_DATA:window.HONRO_ACT2_COMPACT_PACKAGES?.[id];
   const on=id===11?window.HonroStage11Compact?.enabled():window.HonroAct2Compact?.enabled(id);
   if(on!==true||!pkg||JSON.stringify(st)!==JSON.stringify(pkg.stage)||pkg.mapRevision!==c.revision||
      st.width!==c.width||st.height!==c.height||(st.metadata.compactStatus??null)!==c.status)
     throw Error('active compact art provider exact check failed');
   if(JSON.stringify(pkg.assets.map(x=>x.id))!==JSON.stringify(c.packageAssetIDs))throw Error('compact source scope mismatch');
   for (const asset of pkg.assets){
     const found=HONRO_PROJECT.library.filter(x=>x.id===asset.id);
     if(found.length!==1||JSON.stringify(found[0])!==JSON.stringify(asset))throw Error('compact live asset mismatch: '+asset.id);
   }
 }
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 const b=a.engine?.b;
 if(!b||b.honroStage!==id||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.width!==st.width||b.height!==st.height)
    throw Error('not normal canonical stage launch');
 if(c&&(b.honroCampaignMapRevision!==c.revision||(id===11&&window.HonroStage11Compact?.active(b)!==true)))
    throw Error('wrong live compact revision');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('dialogue remains after isolated entry');
 a.close();HonroStoryFraming.clear(a.scene);
 return {stage:st.id,compact:c?{revision:c.revision,matched:true,assetCount:c.packageAssetIDs.length}:null,width:st.width,height:st.height};
}"""
DECODE=r"""async()=>{
 const imgs=[...new Set([...document.images,...__honroObserver.images])].filter(x=>x.currentSrc||x.src);
 await Promise.race([Promise.all([document.fonts.ready,...imgs.map(x=>x.decode())]),
    new Promise((_,bad)=>setTimeout(()=>bad(Error('active image decode deadline')),30000))]);
 if(document.fonts.status!=='loaded'||!imgs.length||imgs.some(x=>!x.complete||!x.naturalWidth))throw Error('incomplete actual renderer assets');
 return imgs.length;
}"""
RAW="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
def profile_line(im,f):
    # CSS world transform on the DPR1 backing canvas; virtual floor/ceil rows leave diagnostics visible in the raw image.
    rect=f['view'];z=f['actual']['scale'];w,h=im.size;x=6400
    seam=(x-rect['left'])*z;pix=math.floor(seam)
    assert 8 < seam < w-8 and rect['left']<x<rect['right']
    # Old PC defect rows 642..703 are world y~3715..4006. Report actual near window intersection too.
    lo=max(0,math.ceil((3715-rect['top'])*z));hi=min(h,math.floor((4006-rect['top'])*z)+1)
    assert hi-lo>=25,('approved y ROI offscreen',lo,hi,rect)
    p=im.load()
    def one(center):
        med=[statistics.median(p[center,j][c]-min(p[center-1,j][c],p[center+1,j][c])for j in range(lo,hi))for c in range(3)]
        def notch(j):
            a,b,c=p[center-1,j],p[center,j],p[center+1,j]
            return sum((a[k]-c[k])**2 for k in range(3))<=4 and all(b[k]<=min(a[k],c[k])-5 for k in range(3))
        return {'column':center,'medianRGBVsDarkerFlank':med,'symmetricDarkNotchRows':sum(notch(j)for j in range(lo,hi))}
    return {'boundaryWorldX':x,'boundaryCSSX':seam,'dpr':f['dpr'],'windowCSSy':[lo,hi], 'worldY':[rect['top']+lo/z,rect['top']+(hi-1)/z],
       'profiles':[one(i)for i in range(pix-4,pix+5)],
       'rawSamples':[[j,[list(p[i,j])for i in range(pix-5,pix+6)]]for j in range(lo,hi)]}

def capture(browser,w,row,device,proof,active):
 from PIL import Image
 out=w/'out';stage=row['stage']; key=f"s12-{device[0]}x{device[1]}"
 ctx=browser.new_context(viewport={'width':device[0],'height':device[1]},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 p=ctx.new_page();p.set_default_timeout(30000);p.add_init_script('('+INIT+')()')
 errors=[]; state={'stage':stage,'device':list(device),'status':'INIT','errors':errors,'views':{}}
 proof['visits'][key]=state
 def emit():save(out/'STOCK-STAGE12.json',proof)
 hits=[];todo=set();observed={};blobs=set();pos=0
 valid={**active,SHELL:SHELL_FACT,MANIFEST:MF}
 def path(url):return url[len(BASE):] if url.startswith(BASE)and '?'not in url and '#'not in url else None
 def asked(q):
  z=path(q.url)
  if not(q.method=='GET' and (z in valid or z in MEDIA and q.resource_type=='media' or BLOB.fullmatch(q.url) or q.url.startswith('data:'))):
   errors.append(['noncanonical request',q.method,q.url])
  if z in valid:todo.add(q)
 def fail(q):
  todo.discard(q)
  if not(path(q.url)in MEDIA and q.resource_type=='media'and q.failure=='net::ERR_ABORTED'):errors.append(['failed',q.url,q.failure])
 def received(r):
  z=path(r.url)
  if z in valid and r.status==200:hits.append((z,r))
  elif BLOB.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif z in MEDIA and r.status in (200,206) and r.request.resource_type=='media':return
  elif not r.url.startswith('data:'):errors.append(['bad response',r.status,r.url])
 p.on('request',asked);p.on('requestfinished',lambda q:todo.discard(q));p.on('requestfailed',fail);p.on('response',received)
 p.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 keys=set(row['requiredExactHTTP'])|{SHELL}|P['exactLinkedRuntime'].keys()
 def drain():
  nonlocal pos
  until=time.monotonic()+20
  quiet=0
  while time.monotonic()<until:
   assert not errors, errors
   while pos<len(hits)and hits[pos][1].request not in todo:
    z,r=hits[pos];body=r.body();known(z,body,valid[z]);observed[z]=valid[z];pos+=1
   before=(pos,len(blobs));p.wait_for_timeout(105)
   ok=before==(len(hits),len(blobs))and not todo and keys<=observed.keys()
   quiet=quiet+1 if ok else 0
   if quiet==3:
    assert blobs<=set(p.evaluate('()=>Array.from(__honroObserver.blobs)'))
    return
  raise RuntimeError(('actual exact response closure',sorted(keys-observed.keys()),sorted(x.url for x in todo),errors))
 try:
  r=p.goto(BASE+SHELL,wait_until='domcontentloaded',timeout=50000)
  assert r and r.status==200 and r.url==BASE+SHELL
  known(SHELL,r.body(),SHELL_FACT);state['status']='SHELL_EXACT';emit()
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  state['provider']=p.evaluate(LAUNCH,row);state['status']='CANONICAL_LAUNCH_CHECKED';emit()
  p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  assert state['provider']==P['previousDesktop']['provider']
  poses=('minimum','east-near') if device[0]==1440 else ('east-near',)
  for name in poses:
   q={'stage':12,'name':name,'readback':False}
   f=p.evaluate(PARK,q)
   decoded=p.evaluate(DECODE)
   stable=p.evaluate(PARK,{**q,'readback':True})
   assert f['stable']==stable['stable'], ('actual repeat stable readback mismatch',name,f,stable)
   assert f['stable']['physics']==P['previousDesktop']['frame']['physics']
   assert f['stable']['actualTerrainIDs']==P['previousDesktop']['frame']['actualTerrainIDs']
   raw=base64.b64decode(p.evaluate(RAW),validate=True)
   rawName=key+'-'+name+'-raw.png'
   (out/rawName).write_bytes(raw)
   with Image.open(BytesIO(raw))as im:
    im.load()
    assert im.format=='PNG' and list(im.size)==f['stable']['backing'] and im.convert('RGB').getextrema()!=((0,0),(0,0),(0,0))
    profile=profile_line(im.convert('RGB'),f['stable'])
   fact=facts(raw)
   state['views'][name]={**f,'stationary':stable['observation'],'decodeCount':decoded,'raw':rawName,'image':fact,'profile':profile}
   emit()
   if name=='minimum':
    old=P['previousDesktop']
    state['minimumControl']={'archivedPNGExact':fact['sha256']==old['rawSHA256'],'archivedRawSHA256':old['rawSHA256'],
       'archivedFixture':old['archive'],'archivedStatus':old['status']}
    emit()
    assert all(f['stable'][k]==old['frame'][k]for k in ('actual','desired','view','focus','css','backing','phase','round','time','physics'))
    assert state['minimumControl']['archivedPNGExact'], 'same camera/stage but archived PC PNG mismatch'
  drain()
  assert not errors and tuple(state['views'])==poses
  state.update(status='PASS_STOCK_OBSERVATION_ONLY',requiredObserved={z:observed[z]for z in sorted(keys)}, observedCount=len(observed))
 except Exception as e:state.update(status='HOLD',error=repr(e),observedPartial=observed)
 finally:emit();ctx.close()

def app(w):
  from playwright.sync_api import sync_playwright
  assert not (os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
  out=w/'out';meta=obj((out/'AUTHORITY.json').read_bytes())
  assert meta=={'release':REL,'tree':TREE,'pages':[RUN,JOB],'manifest':MF,'head':os.environ['GITHUB_SHA'],'verified':True}
  row=P['row'];assert row['stage']==12 and row['activeDeclaredDimensions']==[6400,5000]
  m=obj(exact_public(MANIFEST,MF));active={i['path']:{k:i[k]for k in ('bytes','sha256')}for i in m['files']}
  assert len(active)==len(m['files'])==810
  assert all(active[k]==v for k,v in {**P['exactLinkedRuntime'],**row['boundFacts']}.items())
  for p in (CAMPAIGN,ENTRY,SHELL):exact_public(p,SHELL_FACT if p==SHELL else active[p])
  q={'release':REL,'manifest':MF,'stage':12,'status':'INIT','visits':{},
    'scope':'Unmodified anonymous stock camera readback. No gameplay, preview, candidate, pixels threshold, or product file edits.'}
  try:
   with sync_playwright()as pw:
    b=pw.chromium.launch(headless=True);q['chrome']=b.version
    try:
     assert b.version==P['browser']
     for dev in ((1440,900),(390,844)):
      capture(b,w,row,dev,q,active)
      assert not b.contexts
    finally:b.close()
   exact_public(MANIFEST,MF)
   assert set(q['visits'])=={'s12-1440x900','s12-390x844'}
   assert all(v['status']=='PASS_STOCK_OBSERVATION_ONLY'for v in q['visits'].values()),'at least one authentic device visit held'
   assert {r['raw']for v in q['visits'].values()for r in v['views'].values()}=={p.name for p in out.glob('*-raw.png')}
   assert sum(len(v['views'])for v in q['visits'].values())==3
   q['status']='PASS_STOCK_EAST_NEAR_PC_MOBILE_PLUS_PC_MIN_CONTROL'
  except Exception as e:q.update(status='HOLD',error=repr(e));raise
  finally:save(out/'STOCK-STAGE12.json',q)
if __name__=='__main__':
  assert len(sys.argv)==3 and sys.argv[1] in ('authority','app')
  w=Path(sys.argv[2]).resolve();temp=Path(os.environ['RUNNER_TEMP']).resolve()
  assert w!=temp and w.is_relative_to(temp)
  (authority if sys.argv[1]=='authority'else app)(w)
