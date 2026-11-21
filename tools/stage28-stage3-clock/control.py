"""Strict independent controlled native Stage3, never a product/release seal."""
import base64,json,os,re,sys,time,traceback,hashlib
from pathlib import Path
from preflight import HERE,CLOUD_ROLE
from capture import DIRECTIONS,OBS,PARK,VERIFY,SCREEN,CONTROL_PREFIX,PREFIX_WITNESSES,MEDIA,exact_navigation_document,rgba,compare,compare_phase
from guard import P,facts,save
from playwright.sync_api import sync_playwright
CLOCK=(HERE/'clock.js').read_text();CLOUD=(HERE/'observe-cloud.js').read_text()
def stamp(out,q):save(out/'DETERMINISTIC-STAGE3.json',q)
def sha(data):return hashlib.sha256(data).hexdigest()
def case(browser,w,out,report,v,arm,g,target):
 live='B'if arm=='B'else 'A'
 origin='http://127.0.0.1:'+('18891'if live=='A' else '18892')+'/'
 blob=re.compile('blob:'+re.escape(origin)+r'[\da-f-]{36}')
 known=g['active'+live]; alias=dict(g['aliases'])
 required={k if live=='A'else alias.get(k,k)for k in v['requests']}|{g['runtime'+live],CLOUD_ROLE}
 for k,val in v['requests'].items():
  if live=='A' or k not in alias and k!='HONRO.html':assert known[k]==val
 assert v['stage']==3 and target in ('south','west')
 dev=f'{v["device"][0]}x{v["device"][1]}';kid=f's03-{dev}'
 route=['north','east','south']+(['west']if target=='west'else [])
 report['visits'].append(entry:={'arm':arm,'device':dev,'target':target,'route':route,'stages':{},'state':'HOLD_NOT_COMPLETE'})
 stamp(out,report)
 installed=False
 ctx=browser.new_context(viewport=dict(zip(('width','height'),v['device'])),device_scale_factor=1,service_workers='block')
 try:
  assert ctx.storage_state()=={'cookies':[],'origins':[]}
  page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script('('+OBS['INIT']+')()')
  errors=[];todo=set();hits=[];checked={};listenerChecked=set();seen=set();i=0
  def path(url):return url[len(origin):]if url.startswith(origin) and '?' not in url and '#' not in url else None
  def request(r):
   k=path(r.url)
   if r.method!='GET' or not(k in known or k in MEDIA and r.resource_type=='media' or blob.fullmatch(r.url)or r.url.startswith('data:')):
    errors.append(('unknown request',r.method,r.url))
   if k in known:todo.add(r)
  def failed(r):
   todo.discard(r)
   if not(path(r.url) in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):errors.append(('failed',r.url,r.failure))
  def response(r):
   k=path(r.url)
   if k in known and r.status==200:hits.append((k,r))
   elif blob.fullmatch(r.url)and r.status==200:seen.add(r.url)
   elif k in MEDIA and r.request.resource_type=='media' and r.status in (200,206):return
   elif not r.url.startswith('data:'):errors.append(('unknown response',r.url,r.status))
  for k,f in [('request',request),('requestfinished',lambda r:todo.discard(r)),('requestfailed',failed),('response',response),('pageerror',lambda e:errors.append(('page error',str(e))))]:page.on(k,f)
  def drain():
   nonlocal i
   q=0;expiry=time.monotonic()+20
   while time.monotonic()<expiry:
    assert not errors,errors
    while i<len(hits)and hits[i][1].request not in todo:
     k,r=hits[i];assert facts(r.body())==known[k],(arm,k);checked[k]=known[k];listenerChecked.add(k);i+=1
    before=(i,len(seen));page.wait_for_timeout(105)
    q=q+1 if before==(len(hits),len(seen))and not todo and required<=checked.keys()and required-{'HONRO.html'}<=listenerChecked else 0
    if q==3:
     assert seen<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'));return
   raise RuntimeError(('missing normal response bodies',sorted(required-checked.keys()),errors))
  navigation=exact_navigation_document(page,origin,known['HONRO.html'])
  checked['HONRO.html']=navigation['body']
  entry['navigationDocument']=navigation;stamp(out,report)
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  stage=v['stage']; id=v['provider']['stage'];dim=[v['provider'][k]for k in ('width','height')]
  entry['providerPreload']=page.evaluate("async()=>{await HonroCampaignLoader.ensureStage(3);const s=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===3);return [s.id,s.width,s.height,s.pending??false]}")
  assert entry['providerPreload']==[id,*dim,False], 'earlier first stage3 draw/preload not established'
  entry['clockInstalled']=page.evaluate(CLOCK)
  assert entry['clockInstalled']=={'phase':0,'ms':60000,'sameStandardTimers':True}
  installed=True; stamp(out,report)

  assert page.evaluate(OBS['LAUNCH'],{'stage':stage,'catalogID':id,'activeDeclaredDimensions':dim})==v['provider']
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  def png():return base64.b64decode(page.evaluate(OBS['RAW']),validate=True)
  rawDIR=out/dev;rawDIR.mkdir(exist_ok=True)
  def take(name,label,state,ms):
   raw=png(); path=rawDIR/f'{arm}-{dev}-{target}-route-{name}-{label}.png';path.write_bytes(raw)
   row={'file':str(path.relative_to(out)),'png':facts(raw),'camera':state}
   view['captures'][label]=row;stamp(out,report)
   img=rgba(raw);assert list(img.size)==state['backing']
   row.update(rgbaSHA256=sha(img.tobytes()),cloud=page.evaluate(CLOUD,{'ms':ms}),screen=page.evaluate(SCREEN))
   stamp(out,report)
   return row
  def moved(q,ms,label):
   state=page.evaluate(PARK,{**q,'readback':True}); native=page.evaluate(VERIFY,{'stage':3,'depth':0}); shot=take(q['name'],label,state,ms)
   shot['native']=native;return shot
  for i,name in enumerate(route,1):
   entry['activeRouteStep']=name; stamp(out,report)
   ms=60000+i*16
   assert page.evaluate('i=>__honroStage3Clock.set(i)',i)=={'phase':i,'ms':ms,'sameStandardTimers':True}
   x,y=DIRECTIONS[name];q={'stage':3,'id':id,'name':name,'dx':x,'dy':y,'readback':False}
   st=page.evaluate(PARK,q);dec=page.evaluate(OBS['DECODE'])
   current=page.evaluate(PARK,{**q,'readback':True})
   view=entry['stages'][name]={'decodedImages':dec,'captures':{},'readbackCameraEqual':current==st}
   if name!=target:
    # Original historical route draw/decode/readback/raw order, without
    # consulting any old visible PNG. Only its state/geometry is the anchor.
    row=take(name,'prefix',current,ms)
    anchor=CONTROL_PREFIX[kid][name]['physics']
    view['historicalStateReference']='exact prior camera/geometry only'
    assert dec>0 and current==st and {k:st[k]for k in anchor}==anchor
    continue
   ref=P['frames'][kid+'-'+name];anchor={k:v for k,v in ref.items()if k not in ('referencePNG','positive')}
   native=page.evaluate(VERIFY,{'stage':3,'depth':0});first=take(name,'phase1',current,ms);first['native']=native
   assert dec>0 and current==st and {k:st[k]for k in anchor}==anchor
   for lab in ('phase2','repeat1','repeat2'):
    entry['activePhase']=lab; stamp(out,report)
    current=page.evaluate(PARK,{**q,'readback':True}); native=page.evaluate(VERIFY,{'stage':3,'depth':0})
    row=take(name,lab,current,ms);row['native']=native;stamp(out,report)
    assert current==st and native==first['native'] and row['cloud']==first['cloud']
    if lab!='phase2':
     settled=view['captures']['phase2']
     assert row['png']==settled['png'] and row['rgbaSHA256']==settled['rgbaSHA256']
     assert {k:z for k,z in row['screen'].items()if k!='hits'}=={k:z for k,z in settled['screen'].items()if k!='hits'}
   if arm=='A1' and target=='west':
    prior=view['captures']['repeat2']; originShot=prior
    view['liveMotionSamples']=[]
    for sz in range(10): # +32ms then at most nine +100ms steps; no adjustment during A1/A2/B comparison.
     advanced=60096+100*sz;label=f'motionAdvance{sz}'
     assert page.evaluate('i=>__honroStage3Clock.set(i).ms',5+sz)==advanced
     witnessed=moved(q,advanced,label)
     cx=prior['cloud']['cloud'];cy=witnessed['cloud']['cloud'];dt=(cy['at']-cx['at'])/1000
     expected_v=cx['v']+(prior['cloud']['wind']*1.6-cx['v'])*min(1,dt*.25)
     assert dt==(.032 if sz==0 else .1) and abs(cy['v']-expected_v)<1e-12 and abs(cy['x']-(cx['x']+(cy['v']+4)*dt))<1e-12 and cy['x']!=cx['x']
     assert witnessed['camera']==prior['camera'] and witnessed['native']==prior['native'] and witnessed['cloud']['wind']==prior['cloud']['wind']
     assert {k:z for k,z in witnessed['screen'].items()if k!='hits'}=={k:z for k,z in prior['screen'].items()if k!='hits'}
     pix=compare(rgba((out/originShot['file']).read_bytes()),rgba((out/witnessed['file']).read_bytes()),ref)
     assert pix['alpha']==0
     motion={'monotonicDeltaMS':advanced-60064,'changedPixels':pix['changed'],'maxRGBADN':pix['maxRGBADN'],'samePhysics':True,'exactNativeCloudIntegration':True}
     view['liveMotionSamples'].append(motion);stamp(out,report)
     if pix['changed']>0:view['liveMotionPositive']=motion;break
     prior=witnessed
    assert view.get('liveMotionPositive'), 'native cloud state moved but no actual render change confirmed'
   stamp(out,report)
  drain()
  assert required-{'HONRO.html'}<=listenerChecked
  entry.update(state='EXACT_NATIVE_VISIT',listenerVerifiedRequired=sorted(required&listenerChecked),observedCount=len(checked))
  assert page.evaluate('()=>__honroStage3Clock.restore()') is True
  installed=False;entry['clockRestored']=True;stamp(out,report)
 finally:
  try:
   if installed:
    try:entry['clockRestoredAfterFailedCounter']=page.evaluate('()=>__honroStage3Clock.restore()')
    except Exception as e:entry['restoreError']=repr(e)
    stamp(out,report)
  finally:ctx.close()
def paired(out,report):
 rows=report['visits']; assert len(rows)==12 and all(x['state']=='EXACT_NATIVE_VISIT' and x['clockRestored']for x in rows)
 for dev in ('1440x900','390x844'):
  for target in ('south','west'):
   key=dev+'-'+target
   base,rep,candidate=[next(q for q in rows if (q['arm'],q['device'],q['target'])==(arm,dev,target))for arm in ('A1','A2','B')]
   assert len({tuple(x['route'])for x in (base,rep,candidate)})==1
   entry=report['pairs'][key]={'pass':False,'frames':{},'archiveReferenceNotReplaced':True}
   if target=='west':assert base['stages'][target]['liveMotionPositive']['changedPixels']>0
   for name in base['route']:
    assert len({p['stages'][name]['decodedImages']for p in (base,rep,candidate)})==1
    for phase in base['stages'][name]['captures']:
     if phase.startswith('motionAdvance'):continue
     a,s,b=[x['stages'][name]['captures'][phase] for x in (base,rep,candidate)]
     pixA, pixS, pixB=[rgba((out/x['file']).read_bytes())for x in (a,s,b)]
     A1A2=pixA.size==pixS.size and pixA.tobytes()==pixS.tobytes()
     A1B=pixA.size==pixB.size and pixA.tobytes()==pixB.tobytes()
     leaf={k:v for k,v in a.items()if k!='file'}
     equal=all({k:v for k,v in x.items()if k!='file'}==leaf for x in (s,b))
     entry['frames'][name+'-'+phase]={'fullRGBA-A1-A2':A1A2,'fullRGBA-A1-B':A1B,'rawCameraWorldCacheAndCloudExact':equal}
     stamp(out,report)
     assert A1A2 and A1B and equal, (key,name,phase,'full deterministic control not reproduced')
   entry['pass']=True;stamp(out,report)
def main(w):
 assert not(os.getenv('GITHUB_TOKEN')or os.getenv('GH_TOKEN'))
 out=w/'out';g=json.loads((out/'GRAPH.json').read_bytes())
 report={'status':'HOLD','scope':'read-only isolated new Stage3 control; historic R6 aggregate remains HOLD','noReleaseSeal':True,
  'R6Actual':{'run':44931823134,'artifact':14718321360,'browserReceiptSHA256':'c1a8dfa7214abacd24406c4a4ee6d0b451e2a250bd58eecf8e581b771a33a1dd'},
  'priorArchiveAsStateOnly':PREFIX_WITNESSES[14714262330],'visits':[],'pairs':{},'errors':[]}
 try:
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);report['chrome']=br.version; assert br.version=='151.0.7922.34'
   try:
    for arm in ('A1','A2','B'):
     for dev in ('1440x900','390x844'):
      v=P['visits']['s03-'+dev]
      for target in ('south','west'):
       try:case(br,w,out,report,v,arm,g,target)
       except Exception as e:
        row={'arm':arm,'device':dev,'target':target,'exception':repr(e)};report['errors'].append(row)
        with (out/'TRACEBACK.txt').open('a') as f:f.write(json.dumps(row)+'\n'+traceback.format_exc()+'\n')
        stamp(out,report)
   finally:br.close()
  assert not report['errors']
  paired(out,report);assert len(report['pairs'])==4 and all(x['pass']for x in report['pairs'].values())
  report['status']='PASS_UNCHANGED_STAGE3_NEW_CONTROL_ONLY_R6_HISTORICAL_HOLD_UNCHANGED'
 except Exception as e:
  report['failure']=repr(e)
  with (out/'TRACEBACK.txt').open('a') as f:f.write(traceback.format_exc()+'\n')
  raise
 finally:stamp(out,report)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
