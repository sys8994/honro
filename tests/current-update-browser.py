"""Focused camera and objective-pointer checks in both generated game shells."""
from pathlib import Path
import math
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch

OUT=ROOT/'_local/reports/current-update';OUT.mkdir(parents=True,exist_ok=True)

def inspect(page,label):
    result=page.evaluate(r'''()=>{
      const a=HonroApp;a.frame=()=>{};a.launchMap(HONRO_PROJECT,'stage-5');
      let count=0;
      while(a.dialogue&&a.dialogue.lines[a.dialogue.index]?.[2]?.focus!=='seal'&&count++<12)HonroStory.next(a);
      if(!a.dialogue)throw Error('Stage 5 target line was not shown');
      const scene=a.scene,target=scene.goalFocus,tween=scene.storyTween;
      tween.start=performance.now()-tween.duration-1;
      scene.render(a.engine,0,a.selected,a.power,false,0);
      const camera={kind:tween.kind,target:target?.kind,x:scene.x,y:scene.y,expectedX:target?.x,expectedY:target?.y-scene.size().h*.10/scene.scale};
      const originalTargets=scene.missionTargets;scene.goalFocus=null;scene.storyTween=null;scene.missionTargets=[];
      const c=scene.ctx,old=c.rotate,rotations=[];c.rotate=function(v){rotations.push(v);return old.call(this,v);};
      try{for(const [name,dx,dy] of [['left',-9000,0],['right',9000,0],['up',0,-9000],['down',0,9000]]){
        scene.missionTargets=[{kind:'interact',id:name,x:scene.x+dx,y:scene.y+dy,label:'방향 시험'}];
        HonroObjectives.draw(scene,a.engine);
      }}finally{c.rotate=old;scene.goalFocus=target;scene.missionTargets=originalTargets;scene.render(a.engine,0,a.selected,a.power,false,0);}
      return{camera,rotations};
    }''')
    camera=result['camera'];angles=result['rotations']
    assert camera['kind']=='static' and camera['target']=='seal' and abs(camera['x']-camera['expectedX'])<1 and abs(camera['y']-camera['expectedY'])<1,(label,camera)
    assert len(angles)==4 and 1<angles[0]<2 and -2<angles[1]<-1 and abs(abs(angles[2])-math.pi)<.2 and abs(angles[3])<.2,(label,angles)
    (page if hasattr(page,'screenshot') else page.page).screenshot(path=str(OUT/(label+'-target-focus.png')))
    stale=page.evaluate(r'''()=>{
      const a=HonroApp;HonroStory.finish(a);const b=a.engine.b,hs=b.honroState;
      hs.storyQueue=HonroStoryContent.scene('entry-follow-5-0','', [['설오','받이진을 세우면 고리쇠는 내가 쏘겠습니다.']]);
      for(const line of hs.storyQueue)line[2].afterAction=0;
      for(const t of b.terrain)if(t.honroSeal)t.broken=true;
      a.actorBoundary=a.engine.active.id;
      const shown=HonroStory.drain(a);a.actorBoundary=null;
      return{shown,dialogue:!!a.dialogue,remaining:hs.storyQueue.length};
    }''')
    assert stale=={'shown':False,'dialogue':False,'remaining':0},(label,stale)
    print('PASS',label,'target camera, four pointer directions and late saved dialogue',flush=True)

with sync_playwright() as p:
    browser=launch(p)
    game=browser.new_page(viewport={'width':1440,'height':900})
    game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp')
    inspect(game,'game')
    editor=browser.new_page(viewport={'width':1440,'height':900})
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI')
    editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
    inspect(editor.frames[1],'workshop')
    browser.close()
