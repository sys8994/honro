"""Small BASE4 dialogue crop review, production UI. No source image edits.
Run --before on the baseline, then without it on the final build.
"""
import hashlib,json,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/dialogue-portrait-zoomout';OUT.mkdir(parents=True,exist_ok=True)
label='before' if '--before' in sys.argv else 'after';target=OUT/label;target.mkdir(exist_ok=True)
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());checks=[];rows=[]
def check(name,ok,detail=None):
 checks.append({'name':name,'passed':bool(ok),'detail':detail});assert ok,(name,detail);print('PASS',name,flush=True)
def geometry(p):
 return p.evaluate('''()=>{const s=document.querySelector('.story-scene'),rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(v=>Math.round(v*100)/100);},buttons=[...s.querySelectorAll('button')];return {scene:rect(s),portrait:s.querySelector('.story-portrait')?rect(s.querySelector('.story-portrait')):null,line:rect(s.querySelector('#story-line')),buttons:buttons.map(e=>({action:e.dataset.action,rect:rect(e),visible:(()=>{const r=e.getBoundingClientRect(),b=s.getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&(e.disabled||document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e);})()}))};}''')
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let seed=8994;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);')
 p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;HonroApp.launch(11)');p.wait_for_function('HonroApp.engine?.b.honroStage===11');p.evaluate('()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);}');p.wait_for_function('HonroPortraits.stats().decodes===4&&HonroPortraits.stats().pending===0')
 p.evaluate('''()=>{const a=HonroApp,lines=s=>[...(s.story||[]),...Object.values(s.beats||{}).flat(),...(s.outro||[])];window.reviewLines={};for(const who of ['설오','담허','휘겸','소단']){const line=[...lines(a.stage),...HONRO_CONTENT.stages.flatMap(lines)].find(l=>l[0]===who);if(!line)throw Error('missing authored line '+who);reviewLines[who]=line.slice(0,2);}window.canvasHash=async c=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',c.getContext('2d').getImageData(0,0,c.width,c.height).data))].map(v=>v.toString(16).padStart(2,'0')).join('');}''')
 hud=p.evaluate('async()=>Promise.all([...document.querySelectorAll("#hero-switches canvas")].map(canvasHash))');start=p.evaluate('HonroPortraits.stats()')
 for width,height,view in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':width,'height':height})
  for who in ['설오','담허','휘겸','소단']:
   p.evaluate('who=>HonroStory.start(HonroApp,[reviewLines[who],reviewLines[who]],{title:HonroApp.stage.name})',who);p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"');p.wait_for_timeout(250)
   info=p.evaluate('''async who=>{const c=document.getElementById('story-portrait-canvas'),u=HonroApp.engine.b.units.find(u=>u.name===who),info=HonroPortraits.draw(c,u,u.cls,{identity:who,surface:'dialogue'});return {who,identity:info.identity,crop:info.crop,head:info.head,pixels:await canvasHash(c),text:document.querySelector('#story-line').textContent};}''',who);info.update({'view':view,'geometry':geometry(p)});rows.append(info);check(view+' '+who+' buttons/head',all(v['visible'] for v in info['geometry']['buttons']) and info['crop']['x']<=info['head']['left'] and info['crop']['x']+info['crop']['width']>=info['head']['right'] and info['crop']['y']<=info['head']['top'] and info['crop']['y']+info['crop']['height']>=info['head']['bottom'],info)
   p.screenshot(path=str(target/(view+'-'+info['identity']+'.jpg')),type='jpeg',quality=93);p.locator('.story-scene').screenshot(path=str(target/(view+'-'+info['identity']+'-panel.png')));p.locator('#story-portrait-canvas').screenshot(path=str(target/(view+'-'+info['identity']+'-portrait.png')))
   p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('HonroApp.dialogue.index===1');p.locator('[data-action="dialogue-prev"]').tap();p.wait_for_function('HonroApp.dialogue.index===0')
 # Three representative boundaries, both aspect ratios. Reuse existing text only.
 special=[]
 for width,height,view in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':width,'height':height})
  for who,long in [('설오',True),('주민',False),('새 주민',True)]:
   p.evaluate('([who,long])=>HonroStory.start(HonroApp,[[who,reviewLines["설오"][1].repeat(long?35:1)],reviewLines["설오"]],{title:HonroApp.stage.name})',[who,long]);p.wait_for_timeout(250)
   g=geometry(p);check(view+' '+who+' special buttons',all(v['visible']for v in g['buttons']),g)
   c=p.locator('#story-portrait-canvas');pixel=p.evaluate('async()=>{const c=document.getElementById("story-portrait-canvas");return c?await canvasHash(c):null;}');special.append({'view':view,'who':who,'geometry':g,'pixels':pixel})
   if long:
    tail=p.evaluate('''()=>{const s=document.querySelector('.story-scene');s.scrollTop=s.scrollHeight;return s.querySelector('#story-line').getBoundingClientRect().bottom<=s.querySelector('.story-actions').getBoundingClientRect().top+1;}''');check(view+' '+who+' tail and fixed buttons',tail and all(v['visible'] for v in geometry(p)['buttons']))
   if view=='mobile':p.screenshot(path=str(target/('special-'+who+'.jpg')),type='jpeg',quality=91)
   p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('HonroApp.dialogue.index===1');p.locator('[data-action="dialogue-skip"]').tap();p.wait_for_function('!HonroApp.dialogue')
 end=p.evaluate('HonroPortraits.stats()');check('all clicks/lines reuse requests and decode',start['requests']==end['requests']==4 and start['decodes']==end['decodes']==4 and end['waiters']==0,{'start':start,'end':end});check('no browser errors',not errors,errors);b.close()
report={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'portraitSourceSha256':hashlib.sha256((ROOT/'shared/runtime/portraits.js').read_bytes()).hexdigest(),'hudPixels':hud,'rows':rows,'special':special,'checks':checks,'errors':errors}
if label=='after':
 before=json.loads((OUT/'before.json').read_text());assert hud==before['hudPixels'],'HUD pixels changed'
 for old,new in zip(before['rows'],rows):
  assert old['who']==new['who'] and old['view']==new['view'] and old['text']==new['text']
  assert abs(old['crop']['height']/new['crop']['height']-.88)<1e-10 and abs(old['crop']['width']/new['crop']['width']-.88)<1e-10
  for field in ['scene','portrait','line']:assert all(abs(a-b)<1.1 for a,b in zip(old['geometry'][field],new['geometry'][field])),(new['who'],field)
  assert old['pixels']!=new['pixels'],'dialogue pixels did not change'
 for old,new in zip(before['special'],special):
  if new['who']=='주민':assert old['pixels']==new['pixels'],'NPC vector pixels changed'
 report['beforeAfter']={'dialogueScale':.88,'all8PortraitPixelsChanged':True,'hudPixelsIdentical':True,'residentVectorPixelsIdentical':True,'containersAndLineRectsPreserved':True}
(OUT/(label+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DONE',label,len(checks),'checks')
