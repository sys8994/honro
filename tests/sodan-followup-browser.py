"""Focused live check of training persistence, curse icons and summon rendering."""
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

def check(page, label):
    result = page.evaluate(r'''() => {
      const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.trainingClass='occultist';a.trainingSkill='O14';a.trainingRanks={O14:8};a.launch(1,true,'O14');
      const b=a.engine.b,e=a.engine,hero=e.active;
      if(!e.fire('O14',57,.55))throw Error('cannot fire O14');
      for(let i=0;i<500&&b.projectiles.some(p=>p.mode==='summonEater');i++)for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);
      const eater=b.units.find(u=>u.summonKind==='eater');if(!eater)throw Error('eater not spawned');
      const oldWorld=b,oldEnemy=b.units.find(u=>u.side===1),oldEater=eater,oldCamera=a.scene;
      HonroTraining.open(a);Object.assign(a.trainingDraft,{cls:'mage',id:'M09',active:'M09',branch:1});
      document.querySelector('[data-training-action="apply"]').click();
      const paths=['O06','O07','O08','O09','O10'].map(id=>C.icon('skill:'+id).match(/<path d="([^"]+)/)[1]);
      a.scene.x=eater.x;a.scene.y=eater.y;a.scene.scale=.7;a.scene.render(a.engine,0,a.selected,a.power,false,0);
      return {sameWorld:a.engine.b===oldWorld,sameScene:a.scene===oldCamera,sameEnemy:b.units.includes(oldEnemy),sameSummon:b.units.includes(oldEater),owner:oldEater.summonOwner,heroId:a.engine.active.id,heroClass:a.engine.active.cls,skill:a.selected,uniquePaths:new Set(paths).size,art:HonroActorVisual.kind(eater),radius:200+eater.summonRank*15,enemyHp:oldEnemy.hp};
    }''')
    assert result['sameWorld'] and result['sameScene'] and result['sameEnemy'] and result['sameSummon'], (label,result)
    assert result['owner']==result['heroId'] and result['heroClass']=='mage' and result['skill']=='M09', (label,result)
    assert result['uniquePaths']==5 and result['art']=='summon_eater' and result['radius']==320, (label,result)
    page.locator('#battlecanvas').screenshot(path=str(ROOT/f'_local/reports/{label}-eater-training.png'))
    growth=page.evaluate(r'''() => {
      const a=HonroApp,e=a.engine,u=e.b.units.find(v=>v.summonKind==='eater'),foe=e.b.units.find(v=>v.side===1),center=u.y-u.h*.5;
      for(let i=0;i<3;i++)e.hurt(u,20,foe.id);
      u.hurt=0;
      a.scene.render(e,0,a.selected,a.power,false,0);
      return {hits:u.summonGrowthHits,height:u.h,radius:u.r,centerShift:u.y-u.h*.5-center,art:HonroActorVisual.kind(u)};
    }''')
    assert growth['hits']==3 and abs(growth['height']-136.32)<.001 and abs(growth['radius']-52.256)<.001 and abs(growth['centerShift'])<.001 and growth['art']=='summon_eater',(label,growth)
    page.locator('#battlecanvas').screenshot(path=str(ROOT/f'_local/reports/{label}-eater-grown.png'))
    guides=page.evaluate(r'''() => {
      const a=HonroApp,C=HONRO_CORE,c=document.createElement('canvas').getContext('2d'),original=c.stroke.bind(c),rows=[];
      for(const cls of ['archer','mage','knight','occultist']){
        const id=C.baseSkill(cls),s=C.SKILLS[id],u=C.makeUnit(cls,0,400,1300,{id:'guide-'+cls,loadout:[id],ranks:{[id]:1},angle:42,lastPower:.6});
        const strokes=[];c.stroke=()=>{strokes.push({color:c.strokeStyle,width:c.lineWidth,dash:c.getLineDash()});original();};
        a.engine.b.units.push(u);
        a.scene.arcFx.scale=.7;a.scene.arcFx.predictionGuide(c,a.engine,u,id,.6,false);
        a.engine.b.units.pop();
        rows.push({cls,color:C.CLASSES[cls].color,strokes});
      }
      return rows.map(({cls,color,strokes})=>({cls,primary:strokes.find(v=>String(v.color).toLowerCase()===color.toLowerCase()&&v.dash.length===2&&Math.abs(v.width-1.35/.7)<.01)}));
    }''')
    assert all(row['primary'] and len(row['primary']['dash'])==2 for row in guides),(label,guides)
    assert len({(round(row['primary']['width'],3),tuple(round(v,3) for v in row['primary']['dash'])) for row in guides})==1,(label,guides)
    print('PASS',label,'training world and eater persist; five curse icons differ',flush=True)
    print('PASS',label,'eater grows from enemy hits while preserving its field center',flush=True)
    print('PASS',label,'four heroes share semantic-color trajectory width and dash',flush=True)

with sync_playwright() as p:
    browser=launch(p)
    game=browser.new_page(viewport={'width':1440,'height':900})
    game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp')
    check(game,'game')
    editor=browser.new_page(viewport={'width':1440,'height':900})
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI')
    editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    check(editor.frames[1],'playtest')
    browser.close()
