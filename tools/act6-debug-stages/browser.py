import json,sys,mimetypes
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit
root_arg=sys.argv[1];root=Path(root_arg).resolve() if root_arg!='live' else None
out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
ORIGIN='https://sys8994.github.io/honro/'
def route_local(ctx):
 def intercept(route):
  u=urlsplit(route.request.url)
  if u.netloc!='sys8994.github.io' or u.scheme!='https' or not u.path.startswith('/honro/'):
   route.abort();return
  rel=u.path[len('/honro/'):];p=(root/rel).resolve()
  if not p.is_relative_to(root) or rel.startswith('shared/') or not p.is_file():
   route.fulfill(status=404,body='not published');return
  mime={'.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm'}.get(p.suffix) or mimetypes.guess_type(p)[0] or 'application/octet-stream'
  route.fulfill(status=200,path=str(p),content_type=mime)
 ctx.route('**/*',intercept)
store='''()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))'''
targets={51:(4,4),52:(4,4),53:(1,2),54:(1,0),55:(3,4),56:(1,3),57:(3,2),58:(4,0),59:(4,1),60:(4,0)}
results={}
with sync_playwright() as pw:
 b=pw.chromium.launch(chromium_sandbox=True)
 for dev,w,h,mobile in [('PC',1440,900,False),('M',390,844,True)]:
  with b.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1) as ctx:
   if root is not None:route_local(ctx)
   ctx.add_init_script("""()=>{const init=Storage.prototype.setItem;const rm=Storage.prototype.removeItem;
    window.qaWrites=[];
    Storage.prototype.setItem=function(k,v){qaWrites.push(['set',k]);return init.call(this,k,v);};
    Storage.prototype.removeItem=function(k){qaWrites.push(['remove',k]);return rm.call(this,k);};
   }""")
   t=ctx.new_page(); failures=[]; requests=[]
   t.on('pageerror',lambda e:failures.append(str(e)))
   t.on('console',lambda m:failures.append(m.type+': '+m.text) if m.type in ('error','warning') and 'Debug chapter' in m.text else None)
   t.on('response',lambda r:requests.append([r.status,r.url]) if r.status>=400 else None)
   def tap(sel):
    el=t.locator(sel);el.wait_for(state='visible',timeout=18000)
    el.tap(timeout=12000) if mobile else el.click(timeout=12000)
   def ready():t.wait_for_function("globalThis.HonroApp?.screen==='title'&&!!globalThis.HONRO_READY",timeout=65000)
   def settings():
    tap('#app [data-action=settings]')
    tap('#modal [data-action=settings-page][data-id=records]')
    tap('#modal [data-action=settings-page][data-id=debug]')
   t.goto(ORIGIN+'HONRO.html',wait_until='domcontentloaded',timeout=45000);ready()
   normal=t.evaluate(store)
   assert t.evaluate("()=>!HonroApp.debugMode&&HonroApp.launch(58,false,null,{})!==true")
   settings();assert t.locator('[data-act6-debug-stage]').count()==0
   tap('#debug-mode-setting')
   t.wait_for_function("HonroApp.debugMode&&HonroApp.profile!==HonroApp.normalProfile",timeout=15000)
   for _ in range(25):
    if not t.evaluate("()=>!!HonroApp.dialogue"):break
    t.wait_for_timeout(270);tap('[data-action=dialogue-next]')
   settings()
   assert t.locator('[data-act6-debug-stage]').count()==10
   t.screenshot(path=out/f'{dev}-debug-menu.png')
   saved=t.evaluate(store)
   t.evaluate("()=>{window.qaWrites.length=0; window.realNormal=HonroApp.normalProfile;window.realStore=HonroApp.profileStore;window.realDebug=HonroApp.profile;}")
   result={}
   for stage,(party,npcs) in targets.items():
    sel=f'[data-act6-debug-stage="{stage}"]'
    t.locator(sel).evaluate('e=>e.click()')
    assert not t.evaluate("()=>!!HonroApp.engine")
    tap(sel)
    try:
     t.locator(f'[data-act6-debug-active="{stage}"]').wait_for(state='visible',timeout=32000)
    except Exception:
     print('READBACK',dev,stage,t.evaluate("()=>({text:document.body.innerText.slice(-1000),screen:HonroApp.screen,stage:HonroApp.stageId,errors:qaWrites})"),failures,requests,flush=True)
     t.screenshot(path=out/f'{dev}-failure-{stage}.png');raise
    v=t.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b;return {id:b.honroStage,phase:b.phase,
      terrain:b.terrain.length,scene:!!a.scene,isolation:a.normalProfile!==realNormal&&a.profileStore!==realStore,
      target:!!document.querySelector('[data-act6-qa-lookout]'),party:b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly).length,
      enemies:b.units.filter(u=>u.side===1&&!u.dead).length};}''')
    assert v['id']==stage and v['phase']=='aim' and v['scene'] and v['isolation'] and v['target'] and v['terrain']>0 and (v['party'],v['enemies'])==(party,npcs),v
    assert t.evaluate("()=>HonroApp.persist()===false")
    t.evaluate("()=>HonroApp.flushBattleSave()")
    if stage in (51,58,59,60):t.screenshot(path=out/f'{dev}-debug-stage-{stage}.png')
    result[stage]=v
    tap('[data-act6-debug-back]')
    t.locator('[data-act6-debug-list]').wait_for(state='visible')
    assert t.evaluate("()=>HonroApp.debugMode&&HonroApp.normalProfile===realNormal&&HonroApp.profileStore===realStore&&HonroApp.profile===realDebug")
    assert t.evaluate(store)==saved and t.evaluate("()=>qaWrites.length===0"),t.evaluate("()=>qaWrites")
   assert not failures,failures
   results[dev]={'stages':result,'persistentChanges':False,'errors':failures}
 b.close()
(out/'BROWSER-DEBUG.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
