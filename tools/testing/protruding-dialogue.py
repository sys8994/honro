"""Revised dialogue silhouette preview: actual Stage14 rest talk and viewport gates."""
from pathlib import Path
import sys,json,subprocess,hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
phase='before'if '--before'in sys.argv else 'after';OUT=ROOT/'_local/reports/dialogue-silhouette';OUT.mkdir(parents=True,exist_ok=True);shots=OUT/phase;shots.mkdir(exist_ok=True);rows=[]
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,14)});profile['lastStage']=14
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');entry='/'+json.loads(subprocess.check_output(['git','show','970b9647:web/manifest.json'],text=True))['playtest'].split('?')[0]if phase=='before'else'/HONRO.html';p.goto(base+entry);p.wait_for_function('!!window.HonroRestJourney&&window.HonroApp?.screen==="title"');p.evaluate('HonroCampaignLoader.ensureStage(14)');p.evaluate('HonroRestJourney.state(HonroApp.profile).restStageId=14;HonroApp.showRest()');p.wait_for_function('HonroApp.screen==="rest"');p.evaluate('()=>{for(let i=0;HonroApp.dialogue&&i<24;i++)HonroStory.finish(HonroApp);if(HonroApp.dialogue)throw Error("rest queue did not settle");}')
 for w,h in [(320,780),(360,780),(390,844),(720,1560),(844,390),(568,320)]:
  p.set_viewport_size({'width':w,'height':h})
  for cls in ['archer','mage','knight','occultist']:
   p.evaluate('cls=>{if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroRestJourney.talk(HonroApp,cls)}',cls);p.wait_for_function('!!HonroApp.dialogue');p.locator('.story-scene').evaluate('e=>Promise.all((e.closest(".dialogue-presentation")||e).getAnimations().map(a=>a.finished.catch(()=>{})))');p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"')
   row=p.evaluate('''cls=>{const a=HonroApp,s=document.querySelector('.story-scene'),h=document.querySelector('#story-speaker'),c=document.getElementById('story-portrait-canvas'),host=c.parentElement,r=host.getBoundingClientRect(),box=s.getBoundingClientRect(),line=s.querySelector('#story-line').getBoundingClientRect(),who=HONRO_CONTENT.hero[cls].name,v=HonroPortraits.draw(c,null,cls,{identity:who,framing:c.dataset.portraitFraming}),ctx=c.getContext('2d'),alpha=(x,y,w,h)=>Math.max(...Array.from(ctx.getImageData(x,y,w,h).data).filter((_,i)=>i%4===3));return {cls,title:a.dialogue.title,restKind:a.dialogue.restKind,restClass:a.dialogue.restClass,lineWidth:line.width,locationRows:s.querySelectorAll('.story-location').length,progressInHeading:!!h.querySelector('.story-progress'),photo:{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom},panel:{x:box.x,y:box.y,w:box.width,h:box.height,bottom:box.bottom},head:{left:r.x+(v.head.left-v.crop.x)/v.crop.width*r.width,right:r.x+(v.head.right-v.crop.x)/v.crop.width*r.width,top:r.y+(v.head.top-v.crop.y)/v.crop.height*r.height,bottom:r.y+(v.head.bottom-v.crop.y)/v.crop.height*r.height},framing:v.framing,edgeAlpha:{top:alpha(0,0,c.width,1),left:alpha(0,0,1,c.height),right:alpha(c.width-1,0,1,c.height)},crop:v.crop,faceHeight:HONRO_STORY_PORTRAITS[who].approvedPortrait.expressions.base.framing?.dialogue?.face.height/v.crop.height*r.height,guardBottom:r.y+(v.head.bottom-v.crop.y)/v.crop.height*r.height,pointer:getComputedStyle(host).pointerEvents,canvasInside:s.contains(c)};}''',cls);row['view']=[w,h];row['lines']=p.evaluate('HonroApp.dialogue.lines.length');rows.append(row)
   if phase=='after':
    assert row['framing']=='dialogue' and not any(row['edgeAlpha'].values()) and row['crop']['x']<=0 and row['crop']['y']<=0 and row['crop']['x']+row['crop']['width']>=1024,row
    assert row['locationRows']==0 and row['progressInHeading'] and not row['canvasInside']
    assert row['photo']['y']>=-.1 and row['photo']['x']>=0 and row['photo']['right']<=w+.1,row
    assert row['head']['top']>=0 and row['head']['left']>=0 and row['head']['right']<=w and row['pointer']=='none',row
    if w<h:assert row['guardBottom']<=row['panel']['y']+1,row
    else:assert row['photo']['right']<w-row['lineWidth']-20 and row['photo']['bottom']>row['panel']['y']+80,row
    old=p.evaluate('HonroApp.dialogue.index');p.touchscreen.tap(row['photo']['x']+row['photo']['w']/2,(row['photo']['y']+row['guardBottom'])/2);assert p.evaluate('HonroApp.dialogue.index')==old
   if cls=='knight' or w in (390,844):p.screenshot(path=str(shots/(str(w)+'-'+cls+'.jpg')),type='jpeg',quality=93)
   
   if row['lines']>1:
    p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('HonroApp.dialogue?.index===1');p.locator('[data-action="dialogue-prev"]').tap();p.wait_for_function('HonroApp.dialogue?.index===0')
   else:
    p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('!HonroApp.dialogue');p.evaluate('cls=>HonroRestJourney.talk(HonroApp,cls)',cls);p.wait_for_function('!!HonroApp.dialogue')
   p.locator('[data-action="dialogue-skip"]').tap();p.wait_for_function('!HonroApp.dialogue')
 if phase=='after':
  for view in ([320,780],[360,780],[390,844],[720,1560],[844,390],[568,320]):
   faces=[r['faceHeight']for r in rows if r['view']==view];assert max(faces)/min(faces)<1.02,faces
 assert not errors,errors;b.close()
(OUT/(phase+'.json')).write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'entry':entry,'rows':rows,'errors':errors,'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest()},ensure_ascii=False,indent=2));print('PASS',phase,len(rows),'actual rest14 talks, bounds and touch')
