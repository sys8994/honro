"""Isolated production browser scenes, historical art comparison and live AP01 regression."""
import json,subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/eater-revision/browser';OUT.mkdir(parents=True,exist_ok=True)
SETUP=r'''()=>{
 const C=HONRO_CORE; if(window.HonroApp)HonroApp.frame=()=>{};
 const canvas=document.createElement('canvas');canvas.id='review';document.body.replaceChildren(canvas);document.body.style.margin='0';
 window.review=(count=3)=>{canvas.width=innerWidth;canvas.height=innerHeight;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';const b=C.createBattle(1,C.defaults(),'practice',{party:['archer'],wind:0});b.waters=[];b.fields=[];b.zones=[];b.units=b.units.slice(0,1);b.terrain=[{id:'floor',x:0,y:800,w:b.width,h:500,hp:99999,maxHp:99999,mat:'rock',broken:false}];const u=b.units[0];Object.assign(u,{x:480,y:800,hp:1000,maxHp:1000,attack:1,ranks:{A01:1,AP01:4},loadout:['A01','AP01'],focus:1000,maxFocus:1000,cooldowns:{}});for(let i=0;i<count;i++)b.units.push(C.makeUnit('archer',1,635+i*5,800,{id:'foe'+i,hp:1000,maxHp:1000,armor:0,shield:0,awake:true,loadout:['LA01']}));const scene=new HonroScene(canvas),events=[],e=new C.Engine(b,ev=>{events.push(ev);scene.event(ev)});scene.time=2;const s=e.spawnSummon(u,'eater',650,800,1,1);s.eaterSwallow=0;e.random=()=>.5;Object.assign(scene,{x:620,y:690,scale:innerWidth<600?.7:1,manual:true,skillPreview:true});window.q={b,u,e,s,scene,events};scene.render(e,0,'',.5,false,0);};
 window.paint=(zoom=0)=>{const {e,scene}=q;if(zoom)scene.scale=zoom;scene.render(e,0,'',.5,false,0)};
}'''
rows=[]
with sync_playwright() as p:
 browser=launch(p)
 for shell in ['HONRO.html','HONRO_WORKSHOP.html']:
  context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();page.goto('http://127.0.0.1:8000/'+shell);page.wait_for_function('window.HonroScene && window.HONRO_CORE');page.evaluate(SETUP)
  for size in [(1280,800),(390,700)]:
   page.set_viewport_size({'width':size[0],'height':size[1]})
   for version,commit in [('previous','6819cd9'),('current','1902844'),('final',None)]:
    page.goto('http://127.0.0.1:8000/'+shell);page.wait_for_function('window.HonroScene && window.HONRO_CORE');page.evaluate(SETUP)
    runtime=(ROOT/'shared/assets/actors/actors.runtime.js').read_text() if commit is None else subprocess.check_output(['git','show',commit+':shared/assets/actors/actors.runtime.js'],cwd=ROOT,text=True)
    # The visual object keeps the shared asset map; replace only the eater entry.
    page.evaluate('(src)=>{const saved=HONRO_ACTORS;eval(src);HonroActorVisual.assets.summon_eater=HONRO_ACTORS.assets.summon_eater;window.HONRO_ACTORS=saved;}',runtime)
    page.evaluate('review(5)');page.screenshot(path=str(OUT/f'{shell}-{size[0]}-{version}.png'))
    page.evaluate('paint(2)');page.screenshot(path=str(OUT/f'{shell}-{size[0]}-{version}-zoom.png'))
   page.evaluate('review(1)');page.evaluate('q.s.hp=1;q.e.fire("A01",0,.5);')
   result=page.evaluate('''()=>{let firstHP;const ids=[];for(let i=0;i<480;i++){q.e.stepVolley(1/120);for(const p of [...q.b.projectiles]){if(!ids.includes(p.id))ids.push(p.id);if(q.b.projectiles.includes(p))q.e.stepProjectile(p,1/120);}if(q.s.dead&&firstHP===undefined)firstHP=q.b.units.find(v=>v.id==='foe0').hp;}return{firstHP,finalHP:q.b.units.find(v=>v.id==='foe0').hp,dead:q.s.dead,ids,releases:q.events.filter(v=>v.name==='eaterRelease').length}}''')
   assert result['dead'] and result['finalHP']<result['firstHP'] and result['releases']==1,result
   rows.append({'shell':shell,'width':size[0],**result})
   for age in [.05,.18,.38,.6]:
    page.evaluate('(age)=>{q.scene.time=2+age;paint()}',age);page.screenshot(path=str(OUT/f'{shell}-{size[0]}-rupture-{age}.png'))
   page.evaluate('paint(2)');page.screenshot(path=str(OUT/f'{shell}-{size[0]}-rupture-zoom.png'))
  context.close()
 browser.close()
(OUT/'report.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
