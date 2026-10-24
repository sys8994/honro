"""Isolated local cold Game startup; fault-injected optional SVG fetches, real browser timers and strict required JSON. No user save/frame freeze."""
import json,re,sys,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/optional-far-svg-p03b';OUT.mkdir(parents=True,exist_ok=True);before='--before'in sys.argv;m=json.loads((ROOT/'web/manifest.json').read_text());svg=re.compile(r'/honro_act1_far_data-[^/]+\.svg$');datafile=next(f['path']for f in m['files']if f['path'].startswith('web/data/HONRO_ACT1_FAR_DATA.'));svgpaths=[v['$honroAsset']for v in json.loads((ROOT/datafile).read_text()).values()];loader=next(f['path']for f in m['files']if f['path'].startswith('web/runtime/load-data.'));rows=[]
with serve_game()as base,sync_playwright()as pw:
 browser=launch(pw)
 def new():
  context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=context.new_page();errors=[];hits=[];stamps=[];page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script('window.optionalUnhandled=[];addEventListener("unhandledrejection",e=>optionalUnhandled.push(String(e.reason)))');page.on('request',lambda r:(hits.append(r.url),stamps.append(time.monotonic()))if svg.search(r.url)else None);return context,page,errors,hits,stamps
 def ready(p):p.wait_for_function('window.HonroApp&&document.documentElement.dataset.honroReady',timeout=30000)
 def noerrors(p,errors):assert not errors,errors;assert p.evaluate('optionalUnhandled.length')==0
 def exact(p):
  registered=p.evaluate('({...HONRO_SVG_SOURCES})');assert len(registered)==4
  for path in svgpaths:assert registered[base+'/'+path]==(ROOT/path).read_text()
 def repeat(p):
  p.route('**/__svg_repeat_*.json',lambda route:route.fulfill(content_type='application/json',body=json.dumps({'source':{'$honroAsset':svgpaths[0]}})))
  p.evaluate('''async({loader,base})=>{const m=await import(loader);for(const file of['a','b'])await m.loadData(base+'/__svg_repeat_'+file+'.json',null,{svgSources:'optional'})}''',dict(loader=base+'/'+loader,base=base))
 if before:
  c,p,errors,hits,stamps=new();p.route(svg,lambda route:route.fulfill(status=503,body='fixture 503',headers={'Cache-Control':'no-store'}));p.goto(base+'/HONRO.html');p.locator('[data-startup-retry]').wait_for(timeout=30000);assert not p.evaluate('!!document.documentElement.dataset.honroReady');rows.append({'svg503RejectsStartup':True,'requests':len(hits),'errors':errors});c.close()
 else:
  c,p,errors,hits,stamps=new();p.route(svg,lambda route:route.fulfill(status=503,body='fixture 503',headers={'Cache-Control':'no-store'}));p.goto(base+'/HONRO.html');ready(p);noerrors(p,errors);repeat(p);assert len(hits)==len(set(hits))==4;rows.append({'svg503Ready':True,'fourFailedRequestsDeduped':True});p.unroute(svg);p.reload();ready(p);p.wait_for_function('Object.keys(HONRO_SVG_SOURCES).length===4');exact(p);assert len(hits)==8;noerrors(p,errors);rows.append({'refreshNewAttemptAndExactNormalSources':True});c.close();print('PASS SVG503 startup, failure dedup, refresh and exact normal text',flush=True)
  for mode in ('no-response','late-success','late-failure'):
   c,p,errors,hits,stamps=new();held=[];p.route(svg,lambda route:held.append(route));p.goto(base+'/HONRO.html');ready(p);elapsed=round((time.monotonic()-stamps[0])*1000,2);assert len(held)==len(set(hits))==4;assert p.evaluate('Object.keys(HONRO_SVG_SOURCES).length')==0;p.evaluate('window.savedOptionalApp=HonroApp;window.savedOptionalRoot=document.getElementById("app").firstChild');row={'scenario':mode,'readyAfterFirstSvgRequestMs':elapsed,'pendingSourceRequestsAtReady':len(held),'batchDeadlineMs':1500}
   if mode=='no-response':
    # Release held test routes only after startup/pending measurements, before context teardown.
    for route in held:route.abort()
    p.wait_for_timeout(50)
   elif mode=='late-success':
    for route in held:route.fulfill(content_type='image/svg+xml',body=(ROOT/urlparse(route.request.url).path.lstrip('/')).read_text())
    p.wait_for_function('Object.keys(HONRO_SVG_SOURCES).length===4');exact(p);repeat(p)
   elif mode=='late-failure':
    for route in held:route.fulfill(status=503,body='fixture late503')
    p.wait_for_timeout(250);repeat(p);assert p.evaluate('Object.keys(HONRO_SVG_SOURCES).length')==0
   assert p.evaluate('savedOptionalApp===HonroApp&&savedOptionalRoot===document.getElementById("app").firstChild');assert len(hits)==4;noerrors(p,errors);row.update(appAndTitleKept=True,noUnhandledRejection=True);rows.append(row);c.close();print('PASS',mode,elapsed,'ms first SVG request to ready (includes later bootstrap work)',flush=True)
  for mode in ('503','invalid-json'):
   c,p,errors,hits,stamps=new();p.route('**/'+datafile,lambda route:route.fulfill(status=503 if mode=='503'else 200,content_type='application/json',body='fixture503'if mode=='503'else '{invalid'));p.goto(base+'/HONRO.html');p.locator('[data-startup-retry]').wait_for(timeout=30000);assert not p.evaluate('!!document.documentElement.dataset.honroReady');rows.append({'requiredJSON':mode,'startupStillRejected':True,'expectedErrors':errors});c.close();print('PASS required JSON remains strict:',mode,flush=True)
 report={'entry':m['gameEntry'],'rows':rows,'scope':__doc__+' Ready elapsed is observed from first source request and includes remaining module/author/UI work; it is not an exact1500ms total startup promise. Four sources share one batch timer. Generic/rest cache is checked separately with exact production source/VM data.'};(OUT/('before.json'if before else 'browser.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));browser.close();print('PASS',len(rows),'browser checks')
