"""Read and hash each actual Workshop response immediately; no manual repair/re-fetch."""
import asyncio,hashlib,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
from guard import P,need,fact,read,save
W=Path(sys.argv[1]);out=W/'out';d=Path(__file__).resolve().parent
q=json.loads(read(W,'CARRY.json'));g=json.loads(read(out,'GRAPH.json'))
obs=json.loads(read(d,'observer.json'));q['workshop']={}
def persist():save(out/'WORKSHOP-OBSERVED.json',q['workshop'])
origins={'A':'http://127.0.0.1:18961/','B':'http://127.0.0.1:18962/'}
async def read_arm(pw,arm):
 br=await pw.chromium.launch(headless=True)
 need(br.version==P['chromium'],'wrong exact Chromium')
 c=await br.new_context(**P['devices']['PC'],service_workers='block')
 await c.add_init_script(obs['INIT_SEED'])
 h=g[arm.lower()];m=h['manifest'];root=origins[arm]
 expected=(m['workshopEntry'],m['playtest'],m['gameEntry'])
 guards={root+n:h['active'][n.split('?',1)[0]]for n in expected};jobs={};errors=[]
 async def witness(r):
  need(r.status==200 and not r.from_service_worker and r.request.method=='GET','not actual successful native workshop request '+r.url)
  b=await r.body()
  proven=fact(b)
  need(proven==guards[r.url],'actual first body digest mismatch '+r.url)
  return proven
 def on_response(r):
  if r.url in guards and r.url not in jobs:jobs[r.url]=asyncio.create_task(witness(r))
 p=await c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',on_response)
 row=q['workshop'][arm]={'status':'STARTED','HTTP':{}};persist()
 try:
  resp=await p.goto(root+'HONRO_WORKSHOP.html',wait_until='domcontentloaded',timeout=55000)
  need(resp and resp.url==root+'HONRO_WORKSHOP.html' and resp.status==200 and not resp.from_service_worker,'wrong actual workshop shell navigation')
  row['shell']=fact(await asyncio.wait_for(resp.body(),10))
  need(row['shell']==g['ordered']['workshopShell'][arm.lower()],'native workshop shell mismatch')
  await p.wait_for_function("()=>typeof HonroWorkshopAPI?.startPlaytest==='function' && typeof HONRO_READY?.then==='function'",timeout=55000)
  actual=await p.evaluate("async()=>{await Promise.race([HONRO_READY,new Promise((_,r)=>setTimeout(()=>r(Error('native startup deadline')),12000))]);return HONRO_PLAYTEST_URL;}")
  need(actual==m['playtest'],'native workshop globals read wrong playtest route')
  first=expected[0]
  need(root+first in jobs,'actual workshop JS request missing')
  row['HTTP'][first]=await asyncio.wait_for(asyncio.shield(jobs[root+first]),12)
  counts=await p.evaluate("()=>{const p=HonroWorkshopAPI.getProject();return {stages:p.stages.length,library:p.library.length};}")
  need(counts['stages']==50 and type(counts['library']) is int and counts['library']>0,'native workshop map/library empty')
  await p.evaluate("()=>{HonroWorkshopAPI.selectStage('stage-1');HonroWorkshopAPI.startPlaytest();}")
  await p.wait_for_function("""()=>{const f=document.querySelector('#runtimeFrame'),a=f?.contentWindow?.HonroApp;
    return a?.customMap?.stageId==='stage-1'&&a?.engine?.b?.units?.length>0&&f.contentWindow.HONRO_EMBEDDED===true;}""",timeout=50000)
  view=await p.evaluate("""()=>{const f=document.querySelector('#runtimeFrame'),a=f.contentWindow.HonroApp,b=a.engine.b;
    return {frame:f.src,embedded:f.contentWindow.HONRO_EMBEDDED,stage:a.customMap.stageId,started:a.stageId,
    battle:JSON.stringify([b.width,b.height,b.terrain,b.units,b.honroObjectives,b.honroGoalState,b.objectives])};}""")
  need(view['frame']==root+m['playtest'] and view['embedded'] is True and view['started']==1 and not errors,'native embedded launcher wrong or page errors')
  need(set(jobs)==set(guards),'some actual embedded data routes missing')
  for n,result in zip(expected,await asyncio.wait_for(asyncio.gather(*(jobs[root+n]for n in expected)),15)):
   row['HTTP'][n]=result
  state=hashlib.sha256(view.pop('battle').encode()).hexdigest()
  row.update(view,**counts,stateSHA=state,status='OBSERVED');persist()
  return (state,counts)
 finally:
  for t in jobs.values():
   if not t.done():t.cancel()
  await asyncio.gather(*jobs.values(),return_exceptions=True)
  await c.close();await br.close()
async def main():
 async with async_playwright() as pw:
  a=await read_arm(pw,'A');b=await read_arm(pw,'B')
 need(a==b,'true editor embedded starter battle state or 50-stage library changed')
 q['previousR1Errors']=q.pop('errors');q['errors']=[]
 q['status']='NATIVE_EQUIVALENCE_TIMING_QUALIFIED'
 save(out/'ACCEPTANCE.json',q)
 data={'status':'PASS_COMBINED_NO_REBUILD_R1_FAILED_WORKSHOP_TRANSPORT_ONLY','prior':P['failedUnion'],
       'r1RemainsFailed':True,'normalBuildRerun':False,'graph':fact(read(out,'GRAPH.json')),'custody':fact(read(out,'B-NATIVE-CLOSURE.zip')),
       'combinedAcceptance':fact(read(out,'ACCEPTANCE.json')),'workshop':q['workshop']}
 save(out/'CONTINUATION.json',data)
try:asyncio.run(main())
except Exception as e:
 save(out/'WORKSHOP-HOLD.json',{'error':repr(e),'r1RemainsFailed':True,'normalBuildRerun':False,'workshop':q['workshop']})
 raise
