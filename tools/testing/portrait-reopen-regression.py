"""No draw polling: late onload must paint the pooled reopened dialogue itself."""
from pathlib import Path
import json,sys,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/portrait-variants';profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,31)});line=next(x for x in json.loads((ROOT/'shared/data/narrative-current.json').read_text())['stages']['1']['story']if x[0]=='설오');line[2]['portraitExpression']='emotion.anger'
results=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw)
 for phase in ['ce951a8','current']:
  for mode,lifecycle in [(m,l)for m in ['primary','fallback']for l in ['story-finish','component']]:
   c=b.new_context(viewport={'width':390,'height':844});p=c.new_page();p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');anger=[];bases=[];hits=[]
   def route(r):
    hits.append(r.request.url)
    if mode=='fallback'and len(hits)==1:r.fulfill(status=404,body='fixture primary failure')
    else:anger.append(r)
   p.route('**/portrait-seoro-emotion-anger.*.webp',route)
   if mode=='fallback':p.route('**/portrait-seoro-base.*.webp',lambda r:bases.append(r))
   p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"')
   if phase=='ce951a8':p.evaluate(subprocess.check_output(['git','show','ce951a8:shared/runtime/portraits.js'],text=True))
   p.evaluate('''async line=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(1);a.launch(1);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);HonroStory.start(a,[line,line],{index:0});}''',line);p.wait_for_selector('#story-portrait-canvas');p.wait_for_timeout(120)
   if lifecycle=='story-finish':
    lifetime=p.evaluate('''line=>{const before=document.getElementById('story-portrait-canvas');for(let i=0;HonroApp.dialogue&&i<40;i++)HonroStory.finish(HonroApp);if(HonroApp.dialogue)throw Error('fixture did not close');HonroStory.start(HonroApp,[line,line],{index:0});return{sameCanvas:before===document.getElementById('story-portrait-canvas'),stats:HonroPortraits.stats()};}''',line)
   else:
    lifetime=p.evaluate('''line=>{const root=document.getElementById('dialogue-root'),before=document.getElementById('story-portrait-canvas');HonroPortraits.release(root);root.replaceChildren();const host=document.createElement('div');root.append(host);HonroPortraits.mount(host,null,'archer',{identity:'설오',portraitExpression:'emotion.anger',surface:'dialogue',framing:'dialogue'});return{dialogue:HonroApp.dialogue.lines[0],sameCanvas:before===document.getElementById('story-portrait-canvas'),stats:HonroPortraits.stats()};}''',line)
   assert lifetime['sameCanvas'],lifetime
   if mode=='fallback':
    p.wait_for_timeout(950);assert anger and bases
    for r in bases:r.continue_()
    p.wait_for_function('HonroPortraits.stats().pending===1',timeout=10000)
   else:
    for r in anger:r.continue_()
    p.wait_for_function('HonroPortraits.stats().pending===0',timeout=10000)
   observed=p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas');return{state:c.dataset.portraitState,pixels:c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0),stats:HonroPortraits.stats()};}''');assert (observed['state']=='ready'and observed['pixels'])==(phase=='current'),(phase,mode,observed);results.append({'phase':phase,'mode':mode,'lifecycle':lifecycle,'retainedOwnerComponentLifecycle':lifetime,**observed})
   if mode=='fallback':
    for r in anger:r.abort()
    p.wait_for_timeout(50)
   c.close()
 b.close()
(OUT/'reopen.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'runtimeSha256':hashlib.sha256((ROOT/'shared/runtime/portraits.js').read_bytes()).hexdigest(),'noDrawPolling':True,'results':results},indent=2));print('PASS actual story finish and retained-component primary/base fallback close/reopen/onload: ce951 stuck loading, current async ready without draw polling')
