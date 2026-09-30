"""A short live Sodan turn sequence in both HTML shells, plus the busiest echo cast."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'_local/reports/sodan-redesign';OUT.mkdir(parents=True,exist_ok=True)
errors=[]
SUITE=r'''()=>{
 const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 a.trainingClass='occultist';a.trainingSkill='O15';a.trainingRanks.O15=8;a.launch(1,true,'O15');a.dialogue=null;a.turnNotice=null;
 const e=a.engine,b=e.b,u=e.heroesAlive().find(v=>v.cls==='occultist');e.checkEnd=()=>false;
 Object.assign(b,{width:3200,height:1800,practiceCombat:true,enemyLimit:0,wind:0,fields:[],drafts:[],waters:[],terrain:[{id:'floor',x:0,y:1400,w:3200,h:400,mat:'rock',hp:99999,maxHp:99999}]});
 b.units=[u];Object.assign(u,{x:330,y:1400,spawnX:330,spawnY:1400,h:100,r:20,hp:3000,maxHp:3000,attack:1,focus:999,maxFocus:999,acted:false,loadout:['O01','O06','O11','O15','O16'],ranks:{O01:1,O06:1,O11:8,O15:8,O16:8},angle:12,lastPower:.55});
 for(let i=0;i<20;i++)b.units.push(C.makeUnit('knight',1,980+i%5*65,1400-Math.floor(i/5)*30,{id:'sodan-target-'+i,name:'표적',fixed:true,awake:true,hp:99999,maxHp:99999,h:100,r:20,armor:0,loadout:['LS09']}));
 b.active=u.id;b.side=0;b.phase='aim';Object.assign(a.scene,{manual:true,x:740,y:1180,scale:.65});
 const marks=[],target=b.units[1],advance=()=>{const round=b.round;for(let i=0;i<3500&&!(b.round>round&&b.phase==='aim');i++)e.tick(C.STEP);if(!(b.round>round&&b.phase==='aim'))throw Error('Sodan turn did not advance: '+b.phase);u.focus=999;};
 const statusKeys=HonroCombatStatus.entries(b,{...target,manifested:true,manifestedUntil:b.round+2,earthbind:{owner:u.id,until:b.round+2,damage:5},enthrall:{owner:u.id,actions:2,captureRatio:1,originalMaxHp:target.maxHp,originalAttack:target.attack,originalArmor:target.armor,power:.7},soulRemnants:3}).map(v=>v.key);
 function place(id,x,y){u.loadout=[...new Set([...u.loadout,id])];u.ranks[id]??=8;const aim=e.bestShot(u,C.SKILLS[id],target);if(!e.fire(id,aim.angle,aim.power))throw Error('fire '+id);const p=b.projectiles.find(p=>p.skill===id&&!p.echoSource);e.impact(p,{x,y,t:0,n:{x:0,y:-1},...(id==='O06'?{unit:target}:{terrain:b.terrain[0]})});advance();marks.push({id,round:b.round,phase:b.phase});}
 u.loadout.push('O06');place('O06',target.x,target.y-50);const cursed=target.curseTurns>0;
 place('O11',610,1320);const stalker=b.units.find(v=>v.summonKind==='stalker');const immediate=stalker?.summonActionRound===b.round-1;
 for(let i=0;i<3;i++)place('O15',500+i*130,1200-i*60);
 const echoes=b.units.filter(v=>!v.dead&&v.summonKind==='echo');
 const aim=e.bestShot(u,C.SKILLS.O01,target);if(!e.fire('O01',aim.angle,aim.power))throw Error('basic');
 const root=b.projectiles.find(p=>p.skill==='O01'&&!p.echoSource),copies=b.projectiles.filter(p=>p.skill==='O01'&&p.echoSource);
 const sameTarget=copies.length===3&&copies.every(p=>p.targetPoint.x===root.targetPoint.x&&p.targetPoint.y===root.targetPoint.y&&p.launchX!==root.launchX);
 advance();
 const ultAim=e.bestShot(u,C.SKILLS.O16,target);if(!e.fire('O16',ultAim.angle,ultAim.power))throw Error('ultimate');
 const representatives=b.projectiles.filter(p=>p.skill==='O16'&&p.mode==='spiritConverge');
 const guide=document.createElement('canvas');guide.width=960;guide.height=540;guide.style.width='960px';guide.style.height='540px';document.body.appendChild(guide);
 const pr=HonroSkillPreview.setup(a,'O16',a.profile.heroes.occultist,guide);HonroSkillPreview.tick(a,pr,.66);for(let i=0;i<18;i++)HonroSkillPreview.tick(a,pr,.05);
 const preview={units:pr.b.units.length,echoes:pr.b.units.filter(v=>v.summonKind==='echo').length,scale:pr.scene.scale,canvas:guide.toDataURL().length};
 for(const p of [...representatives]){p.echoDelay=0;p.x=p.targetPoint.x;p.y=p.targetPoint.y;e.stepProjectile(p,C.STEP);}
 const children=b.projectiles.filter(p=>p.mode==='convergeSpirit').length;
 const t=performance.now();for(let i=0;i<80;i++){e.tick(C.STEP);a.scene.render(e,C.STEP,'O16',.5,false,0);}const elapsed=performance.now()-t;
 return {cursed,immediate,marks,statusKeys,echoes:echoes.length,sameTarget,copies:copies.length,representatives:representatives.length,children,elapsed,preview,phase:b.phase,round:b.round};
}'''

with sync_playwright() as pw:
 browser=launch(pw)
 for shell,file in [('Game','HONRO.html'),('Workshop','HONRO_WORKSHOP.html')]:
  page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(f'{shell}: {e}'))
  page.goto((ROOT/file).as_uri())
  if shell=='Workshop':
   page.wait_for_function('window.HonroWorkshopAPI');page.click('[data-tab=play]');page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');host=page.frames[1]
  else:
   page.wait_for_function('window.HonroApp');host=page
  result=host.evaluate(SUITE)
  assert result['cursed'] and result['immediate'],result
  assert {'manifest','earthbind','enthrall','remnant'}<=set(result['statusKeys']),result
  assert result['echoes']==3 and result['sameTarget'] and result['copies']==3,result
  assert result['representatives']==4 and result['children']>=40,result
  assert result['preview']['echoes']==2 and result['preview']['scale']>.15 and result['preview']['canvas']>2000,result
  assert result['elapsed']<10000,result
  host.locator('canvas').last.screenshot(path=str(OUT/(shell.lower()+'-preview.png')))
  page.screenshot(path=str(OUT/(shell.lower()+'.png')))
  print('PASS',shell,json.dumps(result,ensure_ascii=False),flush=True)
  page.close()
 browser.close()
assert not errors,errors
