"""Browser-only check of training persistence, ground prison, curse icons and guides.

The prison fixture exercises production Engine and Scene. JSON restoration below
checks Engine persistence; actual App Continue/export/import is covered separately
by eater-app-resume.mjs. This file requires a working browser and is not a native
rendering or syntax-only PASS substitute."""
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

def check(page, label):
    result = page.evaluate(r'''() => {
      const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.trainingClass='occultist';a.trainingSkill='O14';a.trainingRanks={O14:8};a.launch(1,true,'O14');
      const b=a.engine.b,e=a.engine,hero=e.active;
      // A deterministic ground arena isolates the current one-shot capture contract.
      b.width=3000;b.height=2000;b.terrain=[{id:'floor',x:0,y:1500,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999}];
      b.units=[hero];b.projectiles=[];b.fields=[];b.zones=[];b.waters=[];
      Object.assign(hero,{x:250,y:1500,level:15,critChance:0,attack:1});
      for(let i=0;i<3;i++)b.units.push(C.makeUnit('archer',1,960+i*40,1500,{id:'capture-'+i,hp:2000,maxHp:2000,armor:0,shield:0,awake:true}));
      const eater=e.spawnSummon(hero,'eater',1000,1500,1,8);
      if(!eater||eater.side!==1||eater.eaterCaptureCount!==3)throw Error('ground prison did not capture once');
      if(eater.y!==1500||eater.summonFloating||eater.attack!==0||eater.maxMove!==0)throw Error('prison ground/action contract');
      if(eater.maxHp!==Math.round(205*1.49*(.78+15*.027)))throw Error('rank/level HP contract');
      if(b.units.filter(u=>u.eaterCapturedBy===eater.id).length!==3)throw Error('missing original captives');
      const oldWorld=b,oldEnemy=b.units.find(u=>u.eaterCapturedBy===eater.id),oldEater=eater,oldCamera=a.scene;
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
      const a=HonroApp,C=HONRO_CORE,e=a.engine,u=e.b.units.find(v=>v.summonKind==='eater');
      const held=e.b.units.filter(v=>v.eaterCapturedBy===u.id),feet=u.y,shape={h:u.h,r:u.r,hits:u.summonGrowthHits};
      const before=held.map(v=>v.hp),hp=u.hp;
      e.hurt(u,20,u.summonOwner,false);
      if(u.hp!==hp-20||held.some((v,i)=>v.hp!==before[i]-20))throw Error('each captive must receive actual allied HP loss');
      const late=C.makeUnit('archer',1,u.x,u.y,{id:'late',hp:2000,maxHp:2000});e.b.units.push(late);
      const restored=new C.Engine(JSON.parse(JSON.stringify(e.b))),saved=restored.unit(u.id);
      if(saved.hp!==u.hp||saved.summonExpires!==u.summonExpires||saved.eaterCaptureCount!==3)throw Error('persisted prison changed on restore');
      if(restored.unit('late').eaterCapturedBy||held.some(v=>restored.unit(v.id).eaterCapturedBy!==u.id))throw Error('restore recaptured or lost originals');
      // Overkill copies no more than the prison HP remaining, then releases survivors.
      const heldHp=held.map(v=>restored.unit(v.id).hp),cap=saved.hp;
      restored.hurt(saved,10000,saved.summonOwner,false);
      if(!saved.dead||held.some((v,i)=>restored.unit(v.id).hp!==heldHp[i]-cap||restored.unit(v.id).eaterCapturedBy))throw Error('HP cap or release failed');
      u.hurt=0;a.scene.render(e,0,a.selected,a.power,false,0);
      return {hits:u.summonGrowthHits,height:u.h,radius:u.r,feetShift:u.y-feet,unchanged:u.h===shape.h&&u.r===shape.r&&u.summonGrowthHits===shape.hits,art:HonroActorVisual.kind(u)};
    }''')
    assert growth['hits']==3 and abs(growth['height']-136.32)<.001 and abs(growth['radius']-52.256)<.001 and growth['feetShift']==0 and growth['unchanged'] and growth['art']=='summon_eater',(label,growth)
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
    print('PASS',label,'capture growth preserves grounded feet; allied HP transfer/cap, release and Engine JSON restoration',flush=True)
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
