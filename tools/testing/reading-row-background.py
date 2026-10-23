"""Production 14/R1 objective guide + all current reading row kinds."""
from pathlib import Path
import json,sys,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/reading-row-background';OUT.mkdir(parents=True,exist_ok=True)
before='--before'in sys.argv;phase='before'if before else'after';rows=[]
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,14)})
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');')
 entry='/'+json.loads(subprocess.check_output(['git','show','5987f6db:web/manifest.json'],text=True))['playtest'].split('?')[0]if before else'/HONRO.html'
 p.goto(base+entry);p.wait_for_function('window.HonroApp?.screen==="title"');p.evaluate('HonroApp.launch(14)');p.wait_for_function('HonroApp.engine?.b.honroStage===14')
 p.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);window.guideLine=HonroObjectives.entry(a,{interlude:false}).find(l=>l[0]==='안내');if(!guideLine)throw Error('missing production guide');window.heroLine=['휘겸',guideLine[1]];}''')
 for w,h in ([(390,844)]if before else [(320,640),(390,844),(844,390),(568,320)]):
  p.set_viewport_size({'width':w,'height':h})
  for kind in (['guide']if before else ['guide','story','narration','document']):
   for long in ([False]if before else [False,True]):
    p.evaluate('''([kind,long])=>{const first=kind==='guide'?guideLine:kind==='story'?heroLine:[kind==='narration'?'서술':'기록',guideLine[1],{kind:kind==='narration'?'narration':'document'}];HonroStory.start(HonroApp,[[first[0],first[1].repeat(long?60:1),first[2]],heroLine],{title:HonroApp.stage.name});}''',[kind,long]);p.wait_for_timeout(250)
    for at in ([0,.5,1]if long else [0]):
     p.evaluate('at=>{const e=document.querySelector("#dialogue-root #story-line");e.scrollTop=(e.scrollHeight-e.clientHeight)*at}',at)
     r=p.evaluate('''()=>{const panel=document.querySelector('#dialogue-root section'),line=panel.querySelector('#story-line'),a=panel.querySelector('.story-actions'),r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,w:b.width,h:b.height};},ar=r(a),lr=r(line),sr=r(panel),range=document.createRange();range.selectNodeContents(line);const text=[...range.getClientRects()].map(b=>({x:Math.max(b.x,lr.x),y:Math.max(b.y,lr.y),right:Math.min(b.right,lr.right),bottom:Math.min(b.bottom,lr.bottom)})).filter(b=>b.right>b.x&&b.bottom>b.y),overlap=text.filter(b=>b.x<ar.right&&b.right>ar.x&&b.y<ar.bottom&&b.bottom>ar.y);return{guide:panel.classList.contains('story-guide'),title:panel.querySelector('h2').textContent,line:line.textContent,round:HonroApp.engine.b.round,rowBackground:getComputedStyle(a).backgroundColor,panelBackground:getComputedStyle(panel).backgroundColor,scene:sr,lineRect:lr,action:ar,overlap,scroll:{body:[line.scrollHeight,line.clientHeight,line.scrollTop],panel:[panel.scrollHeight,panel.clientHeight,panel.scrollTop]},buttons:[...a.querySelectorAll('button')].map(e=>{const b=r(e);return{action:e.dataset.action,disabled:e.disabled,inside:b.x>=0&&b.right<=innerWidth&&b.y>=0&&b.bottom<=innerHeight&&b.y>=sr.y&&b.bottom<=sr.bottom,hit:e.disabled||document.elementFromPoint(b.x+b.w/2,b.y+b.h/2)?.closest('button')===e};})};}''');r.update(kind=kind,long=long,at=at,view=[w,h]);rows.append(r)
     if not before:assert r['lineRect']['h']>=20 and r['rowBackground']=='rgba(0, 0, 0, 0)' and not r['overlap'] and all(x['inside']and x['hit']for x in r['buttons']),r
     if w==390 and kind=='guide'and not long or not before and w==568 and kind=='guide'and long and at==.5:p.screenshot(path=str(OUT/(phase+'-'+str(w)+'-'+kind+('-long'if long else'')+'.jpg')),type='jpeg',quality=92)
    p.locator('[data-action=dialogue-next]').tap();p.wait_for_function('HonroApp.dialogue?.index===1');p.locator('[data-action=dialogue-prev]').tap();p.wait_for_function('HonroApp.dialogue?.index===0');p.locator('[data-action=dialogue-next]').tap();p.locator('[data-action=dialogue-skip]').tap();p.wait_for_function('!HonroApp.dialogue')
 compat=[]
 if not before:
  for w,h in [(390,844),(568,320)]:
   p.set_viewport_size({'width':w,'height':h});r=p.evaluate('''()=>{const n=document.createElement('section');n.className='story-document';n.style.cssText='position:fixed;left:12px;top:12px;width:calc(100vw - 24px);z-index:400';const header=document.createElement('header');header.className='document-header';header.textContent='기록';const body=document.createElement('div');body.className='document-scroll';const text=document.createElement('p');text.textContent=guideLine[1].repeat(60);body.append(text);const actions=document.createElement('div');actions.className='story-actions';actions.innerHTML='<button>확인</button>';n.append(header,body,actions);document.getElementById('app').append(n);body.scrollTop=body.scrollHeight;const b=body.getBoundingClientRect(),a=actions.getBoundingClientRect(),r=n.getBoundingClientRect(),answer={view:[innerWidth,innerHeight],kind:'legacy document CSS fixture only',background:getComputedStyle(actions).backgroundColor,bodyHeight:b.height,bodyBottom:b.bottom,actionsTop:a.top,panelBottom:r.bottom};n.remove();return answer;}''');assert r['background']=='rgba(0, 0, 0, 0)' and r['bodyHeight']>=20 and r['bodyBottom']<=r['actionsTop']+.5 and r['panelBottom']<=h,r;compat.append(r)
 assert not errors,errors;b.close()
(OUT/(phase+'.json')).write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'entry':entry,'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'rows':rows,'legacyDocumentCSSFixtures':compat,'errors':errors},ensure_ascii=False,indent=2));print('PASS',phase,len(rows),'reading positions')
