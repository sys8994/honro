"""Stage21 identity control at the two approved west poses, both fresh normal arms."""
import base64, hashlib, io, json, re, sys, time
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

H=Path(__file__).resolve().parent; W=Path(sys.argv[1]); O=W/'out'
P=json.loads((H/'STAGE21-OFFICIAL.json').read_bytes())
J=json.loads((H/'stage21-observer.json').read_bytes())
G=json.loads((O/'GRAPH.json').read_bytes())
N=(H/'native-witness.js').read_text()
C={'scope':'Same independently approved Stage21 west (2 CSS viewports × ordinary+west × 2 arms). No user saves or response substitution.',
   'reference':P['authority'],'records':{},'cases':{},'complete':False,'mismatches':[]}
MEDIA={'assets/bgm/'+n+'.mp3' for n in ('main','battle-1','battle-2','battle-3')}
def sha(b):return hashlib.sha256(b).hexdigest()
def stamp(b):return {'bytes':len(b),'sha256':sha(b)}
def rgba(b):
 with Image.open(io.BytesIO(b)) as i:
  pic=i.convert('RGBA');return {'rgba':sha(pic.tobytes()),'size':list(pic.size)}
def persist():
 (O/'STAGE21-CONTROL.json').write_text(json.dumps(C,indent=2)+'\n')
def expect(value,truth,*why):
 if value!=truth:C['mismatches'].append({'check':why,'expected':truth,'observed':value})
def one(browser,arm,w,h):
 key=f'{arm}-{w}x{h}'; record=C['records'][key]={}
 base='http://127.0.0.1:'+('18841' if arm=='A' else '18842')+'/'
 receipt=G[arm]; required={*P['mapAndPacket'],*P['common17'],'HONRO.html'}
 required|={k for k in receipt if re.fullmatch(r'web/entries/game\.[a-f0-9]{16}\.js',k)}
 assert len(required)==5
 assert all(receipt[k]==v for k,v in {**P['mapAndPacket'],**P['common17']}.items())
 valid=[]; pending=set(); errors=[]; visits={}; blobs=set()
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 ctx.set_default_timeout(30000)
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 view=ctx.new_page()
 view.add_init_script('('+J['INIT']+')()')
 def path(u):
  return u[len(base):] if u.startswith(base) and '?' not in u and '#' not in u else None
 def on_req(q):
  rel=path(q.url)
  if q.method=='GET' and (rel in receipt or (rel in MEDIA and q.resource_type=='media') or
      q.url.startswith(('blob:'+base,'data:'))):
   if rel in receipt:pending.add(q)
  else:errors.append(['unexpected request',q.method,q.resource_type,q.url])
 def on_resp(r):
  q=r.request; rel=path(r.url)
  if rel in receipt and q.method=='GET' and r.status==200:valid.append((rel,r));return
  if rel in MEDIA and q.method=='GET' and q.resource_type=='media' and r.status in (200,206):return
  if r.url.startswith('blob:'+base) and q.method=='GET' and r.status==200:
   blobs.add(r.url);return
  if not r.url.startswith('data:'):errors.append(['unexpected response',q.method,r.status,r.url])
 def fail(q):
  pending.discard(q)
  if not (path(q.url) in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
   errors.append(['failed request',q.url,q.failure])
 view.on('request',on_req);view.on('response',on_resp);view.on('requestfailed',fail)
 view.on('requestfinished',lambda q:pending.discard(q))
 view.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 record['errors']=errors
 try:
  shell=view.goto(base+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert shell and shell.url==base+'HONRO.html' and shell.status==200 and stamp(shell.body())==receipt['HONRO.html']
  view.wait_for_function("""()=>Boolean((document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader)
     || document.querySelector('[data-startup-retry]'))""",timeout=90000)
  assert view.evaluate("()=>Boolean(document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader)")
  # Reuse accepted Stage21 launcher/clock/camera without editing shipped code, modes both canonical Stage21 approved B.
  view.evaluate(J['LAUNCH'],21)
  canvas=view.locator('#battlecanvas');canvas.wait_for(state='visible')
  view.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
            return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=9000)
  view.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);}")
  for name,dx in [('ordinary',0),('west',-1)]:
   ref=P['frames'][f'B-s21-{w}x{h}-{name}']
   q={'id':21,'mapId':'stage-21','name':name,'dx':dx,'dy':0,'ordinary':P['ordinary'],'readback':False}
   f=view.evaluate(J['PARK'],q)
   d=view.evaluate(J['DECODE']);assert d['registered']>0 and not d['failed']
   assert view.evaluate(J['PARK'],{**q,'readback':True})==f,'post-decode Stage21 state/camera drift'
   ph=sha(f.pop('signature').encode())
   label=f'{key}-{name}'; short=C['cases'][label]={'frame':{**f,'physicsSHA256':ph}}
   dom=canvas.screenshot(animations='disabled',timeout=30000)
   raw=base64.b64decode(view.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]"),validate=True)
   (O/(label+'-s21-dom.png')).write_bytes(dom);(O/(label+'-s21-raw.png')).write_bytes(raw)
   short['pngs']={'raw':stamp(raw),'dom':stamp(dom)};persist()
   # Same approved ordinary owner check on both arms. Save the two real captures first.
   owner=view.evaluate(J['OWN'],{'stage':21,'front':P['owner'],'back':P['baseOwner'],'variant':'B'})
   again=view.evaluate(J['PARK'],{**q,'readback':True})
   assert sha(again.pop('signature').encode())==ph and again==f
   short['owner']=owner;persist()
   expect(owner,P['owners'][str(w)],label,'preserved actual F/B owner')
   for k,v in ref['frame'].items():expect(({**f,'physicsSHA256':ph})[k],v,label,'signed actual pose/state',k)
   expect(rgba(raw),ref['rgba']['raw'],label,'exact official raw RGBA')
   expect(rgba(dom),ref['rgba']['png'],label,'exact official DOM RGBA')
   n=view.evaluate(N,{'frame':{**f,'DPR':1},'support':P['support']['supportPath'],'box':P['support']['bounds']})
   masks=n.pop('pngs');n['masks']={k:sha(base64.b64decode(v.split(',',1)[1],validate=True))for k,v in masks.items()}
   expect(n,ref['native'],label,'replayed real tile/rim/mask identity')
   short['native']=n;persist()
  i=0; idle=0; until=time.monotonic()+15
  while time.monotonic()<until:
   prior=(len(valid),i,len(blobs))
   assert not errors,errors
   while i<len(valid) and valid[i][1].request not in pending:
    p,r=valid[i];i+=1
    s=stamp(r.body());assert s==receipt[p],('HTTP asset mismatch',p)
    visits[p]=s
   idle=idle+1 if prior==(len(valid),i,len(blobs)) and i==len(valid) and not pending else 0
   if idle>=4 and required<=visits.keys():break
   view.wait_for_timeout(100)
  assert idle>=4 and not errors and not pending and i==len(valid) and required<=visits.keys(),('required Stage21 final HTTP set incomplete',required-visits.keys(),errors,len(valid),i)
  assert blobs<=set(view.evaluate("()=>[...window.__honroObserver.blobs]"))
  record['observed']=dict(sorted(visits.items()));record['required']=sorted(required)
 finally:
  try:record['restoredIsolatedApp']=view.evaluate('()=>{if(window.__honroQAUndo){window.__honroQAUndo();delete window.__honroQAUndo;return true;}return false;}')
  finally:ctx.close();persist()
def main():
 with sync_playwright() as p:
  b=p.chromium.launch()
  assert b.version==P['browser']
  try:
   for w,h in [(1440,900),(390,844)]:
    for a in ('A','B'):one(b,a,w,h)
  finally:b.close()
 # The known idle optional Chapter2 preload is not part of this explicit Stage21
 # owner gate. R2 handles its own strict identical normalized network sets.
 assert len(C['cases'])==8 and len(C['records'])==4
 assert all(v['restoredIsolatedApp'] and not v['errors'] for v in C['records'].values())
 C['complete']=not C['mismatches'];persist()
 assert C['complete'],('Stage21 normal approved reference mismatch',len(C['mismatches']))
if __name__=='__main__':main()
