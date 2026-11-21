"""Native stock A/A Stage29 west at two legal cameras; no candidate, no compilation or release."""
import base64,json,math,os,re,sys,time,traceback
from pathlib import Path
from preflight import D as HERE,PACK as CF,MAP,CANDIDATE_PACK
from guard import P,facts,save
from capture import exact_navigation_document,OBS,VERIFY,SCREEN,MEDIA,rgba
from playwright.sync_api import sync_playwright
WATCH=(HERE/'watch.js').read_text();PARK=(HERE.parent/'stage29-stock-face-observer/PARK-NEAR.js').read_text();OWNER=(HERE/'owner.js').read_text()
ORIGINAL_WEST={'1440x900': {'actual': {'x': -320, 'y': 1750, 'scale': 0.21176470588235294}, 'viewport': {'left': -3720, 'right': 3080, 'top': -66.13715277777783, 'bottom': 3566.137152777778}, 'css': [1440, 769.1875], 'backing': [1440, 769], 'physics': '4331563bed6cefc825ca1d72de5aaefbb3ced53b9a1b76352ec17122c6007abb'}, '390x844': {'actual': {'x': -320, 'y': 1750, 'scale': 0.057352941176470586}, 'viewport': {'left': -3720, 'right': 3080, 'top': -3895.8253205128203, 'bottom': 7395.82532051282}, 'css': [390, 647.609375], 'backing': [390, 648], 'physics': '4331563bed6cefc825ca1d72de5aaefbb3ced53b9a1b76352ec17122c6007abb'}}
CORRIDOR=[-500,2611.1328125,0,3370] # rectangle evidence coordinates; actual land-side profile additionally recorded
def stamp(out,q):save(out/'STOCK-AA-STAGE29.json',q)
def case(browser,out,report,v,arm,g,name):
 assert v['stage']==29 and arm in ('A1','A2','B') and name in ('west','west-near','east')
 live='B'if arm=='B'else 'A'; origin='http://127.0.0.1:'+('18892'if live=='B'else '18891')+'/'
 blob=re.compile('blob:'+re.escape(origin)+r'[\da-f-]{36}')
 known=g['active'+live]; alias=dict(g['aliases']) if live=='B'else {}
 required={alias.get(k,k)for k in v['requests']}|{alias.get(CF,CF),MAP,'web/runtime/ordered-common-17.9a592f68229e4289.js',P['baseCompiledRuntime']}
 for k,val in v['requests'].items():
  if k not in alias and (live=='A'or k!='HONRO.html'):assert known[k]==val
 dev=f'{v["device"][0]}x{v["device"][1]}';key=dev+'-'+name
 report['visits'].append(entry:={'arm':arm,'key':key,'state':'HOLD_NOT_COMPLETE','frames':[]})
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
  if arm!='A1':assert page.evaluate(WATCH) is True; installed=True
  assert page.evaluate(OBS['LAUNCH'],{'stage':stage,'catalogID':id,'activeDeclaredDimensions':dim})==v['provider']
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  def png():return base64.b64decode(page.evaluate(OBS['RAW']),validate=True)
  rawdir=out/dev;rawdir.mkdir(exist_ok=True)
  q={'id':id,'stage':29,'name':name,'dx':1 if name=='east'else -1,'dy':0,'readback':False}
  pose=page.evaluate(PARK,q);dec=page.evaluate(OBS['DECODE']);assert dec>0
  if name=='west-near':assert pose['actual']=={'x':-120,'y':2960,'scale':.5}
  elif name=='west':assert {k:pose[k]for k in ORIGINAL_WEST[dev]}==ORIGINAL_WEST[dev]
  else:assert pose['actual']['x']==7520
  base=P['frames'][f's29-{dev}-south']
  keep=('physics','phase','round','sceneTime','actualTerrainIDs','actualDrawOwnerIDs','unitCount')
  assert {k:pose[k]for k in keep}=={k:base[k]for k in keep}
  entry['poses']=pose;entry['decodedImages']=dec;entry['realOwners']=page.evaluate(OWNER,arm)
  x0,y0,x1,y1=CORRIDOR;vport=pose['viewport'];z=pose['actual']['scale']
  clip=[max(0,math.floor((x0-vport['left'])*z)),max(0,math.floor((y0-vport['top'])*z)),min(pose['backing'][0],math.ceil((x1-vport['left'])*z)),min(pose['backing'][1],math.ceil((y1-vport['top'])*z))]
  if name!='east':assert clip[0]<clip[2] and clip[1]<clip[3]
  entry['signedCorridorDiagnosticOnly']={'rectWU':CORRIDOR,'pixelBBox':clip,'landSlope':[[-500,2611.1328125],[0,2700]],'fullFrameScopeUnchanged':True}
  stamp(out,report)
  for label in ('phase1','phase2','repeat1','repeat2'):
   entry['activePhase']=label;stamp(out,report)
   actual=page.evaluate(PARK,{**q,'readback':True})
   n=page.evaluate(VERIFY,{'stage':29,'depth':0});pp=png()
   fn=rawdir/f'{arm}-{dev}-{name}-{label}-raw.png';fn.write_bytes(pp)
   f={'path':str(fn.relative_to(out)),'png':facts(pp),'samePose':actual==pose,'native':n,'screen':page.evaluate(SCREEN)}
   entry['frames'].append(f);stamp(out,report)
   assert f['samePose'] and list(rgba(pp).size)==pose['backing']
  s=entry['frames'][1]
  for t in entry['frames'][2:]:
   assert s['png']==t['png'] and s['native']==t['native'] and all(s['screen'][k]==t['screen'][k] for k in s['screen'] if k!='hits'), 'same native phase did not settle'
  # Query exactly once only after all raw App frame writes, so a browser
  # readback strategy cannot alter those samples or the stock positive.
  if installed:
   src=page.evaluate('()=>__honroStage29OldFaceStockWitness.read()')
   entry['nativeFaceTileAfterOriginalFade']=src['tiles']
   entry['nativeDecodedImageDraws']=src['images'];stamp(out,report)
   def witnessed(kind):return any(a['maxAlpha']==255 and a['paintedPixels']>0 and any(r['kind']==kind for r in a['draws'])for a in src['tiles'])
   if name!='east':
    assert witnessed('stock-first'), 'stock first F bitmap not witnessed under actual canonical render'
    assert witnessed('new-west')==(arm=='B'),'new F bitmap has no genuine native paint or is unexpectedly active'
   else:assert not witnessed('new-west')

   assert page.evaluate('()=>__honroStage29OldFaceStockWitness.restore()') is True
   installed=False
  drain();assert required-{'HONRO.html'}<=listenerChecked
  if arm!='A1':
   decoded={}
   for img in entry['nativeDecodedImageDraws']:
    p=path(img['url'])
    if p:
     assert p in checked and img['decoded']
     decoded[p]={'width':img['width'],'height':img['height'],'http':checked[p]}
    else:
     assert img['url'].startswith(('blob:','data:'))
     # Blob IDs are transport-generated, never a substitute for registered byte SHA.
   assert decoded,'no registered image drew into native app'
   entry['nativeRegisteredDecodedRelevantImages']=decoded
  entry.update(state='EXACT_STOCK_VISIT',net=sorted(required&listenerChecked));stamp(out,report)
 finally:
  try:
   if installed:page.evaluate('()=>__honroStage29OldFaceStockWitness.restore()')
  finally:ctx.close()
def signed_delta(a,b,pose):
 assert a.size==b.size
 v=pose['viewport'];z=pose['actual']['scale'];w,h=a.size
 left,top,right,bottom=CORRIDOR
 p0,p1=a.load(),b.load()
 d={'changed':0,'outside':0,'alpha':0,'max':0}
 for y in range(h):
  wy=v['top']+(y+.5)/z
  for x in range(w):
   p,q=p0[x,y],p1[x,y]
   if p==q:continue
   wx=v['left']+x/z;nx=wx+1/z
   roof=2700+min(nx,0)*(2700-2611.1328125)/500
   d['changed']+=1;d['alpha']+=p[3]!=q[3];d['max']=max(d['max'],*(abs(a-b)for a,b in zip(p,q)))
   d['outside']+=not (wx>=left and nx<=right and wy>=roof and wy<=bottom)
 return d
def aggregate(out,report):
 for dev in ('1440x900','390x844'):
  for name in ('west','west-near','east'):
   k=dev+'-'+name
   rows=[r for r in report['visits']if r['key']==k]
   assert len(rows)==3 and [r['arm']for r in rows]==['A1','A2','B'] and all(r['state']=='EXACT_STOCK_VISIT'for r in rows)
   a,b,c=rows
   for key in ('poses','signedCorridorDiagnosticOnly'):assert a[key]==b[key]==c[key],(k,key)
   assert a['realOwners']==b['realOwners']
   co=c['realOwners'].copy();co['F']=co['F'][1:];assert a['realOwners']==co
   assert b['nativeRegisteredDecodedRelevantImages']==c['nativeRegisteredDecodedRelevantImages']
   if name!='east':
    images=lambda r:{t['rgbaSHA'] for t in r['nativeFaceTileAfterOriginalFade']if any(p['kind']=='stock-first'for p in t['draws'])}
    assert images(b)==images(c)=={'d70162b0c877013ecfed669f4aabbdbc36afd537ed81ab7fa62cbc9e6ff18fe7'},(k,'stock owner raster changed')
   assert len(a['frames'])==len(b['frames'])==len(c['frames'])==4
   t=report['pairs'][k]={'pass':False,'phases':[],'rawImageObjectCounts':[r['decodedImages']for r in rows]}
   for x,y,z in zip(a['frames'],b['frames'],c['frames']):
    i,j,l=[rgba((out[f['path']]).read_bytes())for f in (x,y,z)]
    full=i.size==j.size and i.tobytes()==j.tobytes()
    r={n:v for n,v in x.items()if n!='path'}=={n:v for n,v in y.items()if n!='path'}
    excl={'registeredMaterials'}; nn=lambda x:{n:v for n,v in x['native'].items()if n not in excl}
    structural=nn(x)==nn(z) and x['screen']==z['screen'] and z['samePose']
    law=signed_delta(i,l,a['poses']);t['phases'].append({'stockAAFullExact':full and r,'otherNativeExact':structural,'AB':law});stamp(out,report)
    assert full and r and structural,(k,'stock or protected native physics/cache drift')
    assert law['outside']==law['alpha']==0 and ((law['changed']>0)==(name!='east')),(k,'signed candidate pixel scope failed')
   t['pass']=True;stamp(out,report)
def main(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 out=w/'out';g=json.loads((out/'GRAPH.json').read_bytes())
 report={'status':'HOLD','scope':'strict detached two-source normal Stage29 QA; no release seal or publication','base':g['base'],'visits':[],'pairs':{},'errors':[]}
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True);report['browser']=browser.version
   try:
    assert browser.version=='151.0.7922.34'
    for side in ('A1','A2','B'):
     for d in ('1440x900','390x844'):
      for name in ('west','west-near','east'):
       try:case(browser,out,report,P['visits']['s29-'+d],side,g,name)
       except Exception as e:
        report['errors'].append({'arm':side,'device':d,'pose':name,'error':repr(e)})
        with (out/'TRACEBACK.txt').open('a')as f:f.write(traceback.format_exc()+'\n')
        stamp(out,report)
   finally:browser.close()
  assert not report['errors']
  aggregate(out,report)
  assert len(report['pairs'])==6 and all(t['pass']for t in report['pairs'].values())
  report['status']='PASS_STAGE29_ACTUAL_SCOPE_ONLY_PENDING_HUMAN_ART_REVIEW'
 except Exception as e:
  report['failure']=repr(e)
  with (out/'TRACEBACK.txt').open('a') as f:f.write(traceback.format_exc()+'\n')
  raise
 finally:stamp(out,report)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
