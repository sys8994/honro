"""Actual frozen browser Workshop boot: no request rewrites or editor data writes."""
import json,sys
from pathlib import Path
from guard import P,check,fact
from playwright.sync_api import sync_playwright
W=Path(sys.argv[1]); out=W/'out';g=json.loads((out/'GRAPH.json').read_bytes())
rec={'status':'HOLD','scopes':{}}
def write():(out/'WORKSHOP.json').write_text(json.dumps(rec,indent=2)+'\n')
def opened(br,arm):
 u='http://127.0.0.1:'+('18981'if arm=='A'else'18982')+'/'
 pins=g[arm];s=pins['workshop']; archive=pins['legacy']; observed={}; requested=[]; errors=[]
 c=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
 try:
  p=c.new_page()
  p.on('pageerror',lambda e:errors.append(str(e)))
  p.on('request',lambda r:requested.append(r.url.split('?',1)[0]))
  def observe(r):
   k=r.url.split('?',1)[0]
   if k in {u+i for i in (s["entry"],pins["project"],*pins["parts"],archive) if i}:observed[k]=r
  p.on('response',observe)
  nav=p.goto(u+'HONRO_WORKSHOP.html',wait_until='domcontentloaded',timeout=50000)
  check(nav and nav.url==u+'HONRO_WORKSHOP.html' and nav.status==200 and not nav.from_service_worker and fact(nav.body())==s['shell'],'actual canonical Workshop shell')
  p.wait_for_function("()=>window.HONRO_READY instanceof Promise&&window.HONRO_PROJECT_MODE==='full'",timeout=90000)
  p.evaluate("()=>Promise.race([HONRO_READY,new Promise((_,reject)=>setTimeout(()=>reject(Error('Workshop ready deadline')),150000))])")
  proj=p.evaluate("""ids=>{
   const p=HONRO_PROJECT,all=p.library.map(a=>a.id);if(!p||p.stages.length!==50||p.stages.some(s=>s.pending))throw Error('full editor missing chap profile');
   const mac=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16);};
   return {originalLegacy:Object.fromEntries(ids.map(id=>{const m=p.library.filter(x=>x.id===id);if(m.length!==1)throw Error('legacy owner absent or duplicate');return [id,mac(m[0])];})),allIds:all,hasNamespace:all.some(id=>id.startsWith('act4compat32:v1:')),mapIds:p.stages.map(s=>s.id)};
 }""",list(P['testedLosslessRefs']))
  check(proj['originalLegacy']==P['testedLosslessRefs'] and not proj['hasNamespace'] and not errors,'Workshop historical authored objects, colors or namespace changed')
  for k in (s['entry'],pins['project'],*pins['parts']):
   q=observed.get(u+k)
   check(q and q.status==200 and not q.from_service_worker and fact(q.body())==pins['active'][k],f'Workshop exact owner fetched {k}')
  cnt=requested.count(u+archive) if archive else 0
  if arm=='B':
   q=observed.get(u+archive)
   check(cnt==1 and q and q.status==200 and not q.from_service_worker and fact(q.body())==P['archive'],'Workshop whole original library archive not exactly once')
  pressure=dict(normalArchiveGETs=cnt,libraryLength=len(proj['allIds']),libraryIds=proj['allIds'],mapIds=proj['mapIds'],exactOriginalProviderSignatures=proj['originalLegacy'])
  rec['scopes'][arm]=pressure;write()
  return proj
 finally:c.close()
write()
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True);rec['chromium']=b.version
  check(b.version=='151.0.7922.34','unapproved Workshop fixture browser')
  A,B=(opened(b,x)for x in 'AB')
  check(A['allIds']==B['allIds'] and A['mapIds']==B['mapIds'],'Workshop full authored asset/map ordering changed')
  b.close()
 rec['status']='PASS_ACTUAL_WORKSHOP_FULL_ORIGINAL_AND_ORDER'
finally:write()
