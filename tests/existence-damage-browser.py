"""Run the shared damage pipeline in both built game shells."""
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch

JS=r'''()=>{
 const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 a.trainingClass='archer';a.trainingSkill='A01';a.launch(1,true,'A01');a.dialogue=null;a.turnNotice=null;
 const e=a.engine,b=e.b,hero=e.heroesAlive().find(u=>u.cls==='archer');e.checkEnd=()=>false;
 const human=C.makeUnit('knight',1,920,hero.y,{id:'exist-human',name:'사람',honroVariant:'human',role:'bow',hp:10000,maxHp:10000,armor:0,fixed:true,awake:true,loadout:['LS09']});
 const spirit=C.makeUnit('occultist',1,1120,hero.y,{id:'exist-spirit',name:'떠도는 혼',honroVariant:'ghost',role:'fire',hp:10000,maxHp:10000,armor:0,fixed:true,awake:true,loadout:['LO08']});
 const medium=C.makeUnit('occultist',0,hero.x+60,hero.y,{id:'exist-medium',name:'소단',attack:1,critChance:0,loadout:['O01'],ranks:{O01:1}});
 const daoist=C.makeUnit('mage',0,hero.x+90,hero.y,{id:'exist-daoist',name:'담허',attack:1,critChance:0,loadout:['M01'],ranks:{M01:1}});
 b.units=[hero,medium,daoist,human,spirit];b.active=hero.id;b.side=0;b.phase='aim';hero.critChance=0;e.random=()=>.99;
 globalThis.HONRO_DEBUG_DAMAGE=true;globalThis.HONRO_DAMAGE_TRACE=[];
 const arrow={skill:'A01',owner:hero.id,side:0,shot:1,skillRank:1,damage:100,x:hero.x,y:hero.y-40,launchX:hero.x,apexY:hero.y-300,vx:800,vy:0,mode:'arrow',hit:[]};
 e.hurt(human,100,hero.id,true,arrow,{x:human.x,y:human.y-40});e.hurt(spirit,100,hero.id,true,arrow,{x:spirit.x,y:spirit.y-40});
 const physical=[10000-human.hp,10000-spirit.hp];
 const qi={...arrow,skill:'M01',owner:daoist.id,mode:'qiPulse'};e.hurt(spirit,100,daoist.id,true,qi,{x:spirit.x,y:spirit.y-40});
 const qiDamage=10000-physical[1]-spirit.hp;
 const soul={...arrow,skill:'O01',owner:medium.id,mode:'spiritBolt'};e.hurt(spirit,100,medium.id,true,soul,{x:spirit.x,y:spirit.y-40});
 const soulDamage=10000-physical[1]-qiDamage-spirit.hp;
 Object.assign(a.scene,{manual:true,x:940,y:hero.y-120,scale:.7});a.scene.render(e,C.STEP,'A01',.5,false,0);
 const trace=globalThis.HONRO_DAMAGE_TRACE.map(t=>({skill:t.skill,existence:t.existenceMultiplier,final:t.finalDamage}));
 globalThis.HONRO_DEBUG_DAMAGE=false;
 return {physical,qiDamage,soulDamage,trace,canvas:document.querySelector('canvas')?.toDataURL().length||0};
}'''

errors=[]
with sync_playwright() as pw:
 browser=launch(pw)
 for shell,file in [('Game','HONRO.html'),('Workshop','HONRO_WORKSHOP.html')]:
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda err:errors.append(f'{shell}: {err}'))
  page.goto((ROOT/file).as_uri())
  if shell=='Workshop':
   page.wait_for_function('window.HonroWorkshopAPI')
   page.click('[data-tab=play]')
   page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
   host=page.frames[1]
  else:
   page.wait_for_function('window.HonroApp')
   host=page
  result=host.evaluate(JS)
  assert result['physical'][0]>result['physical'][1]*3,result
  assert result['qiDamage']>result['physical'][1]*3 and result['soulDamage']>result['qiDamage'],result
  assert len(result['trace'])==4 and result['canvas']>1000,result
  print('PASS',shell,result,flush=True)
  page.close()
 browser.close()
assert not errors,errors
