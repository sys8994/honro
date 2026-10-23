"""Local built Chromium: prepared old-soul mid Continue; actual reader and automatic camera."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/act2-time-farewell-20261023';saved=json.loads((OUT/'old-soul-mid.json').read_text());errors=[];rows=[]
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw)
 def open_scene(view):
  c=b.new_context(viewport=view,has_touch=True,is_mobile=True);p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(saved))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').tap();p.wait_for_function('HonroApp.engine?.b.honroStage===19&&!!HonroApp.dialogue',timeout=90000);return c,p
 def report(p):return p.evaluate('({row:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,camera:{x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale},manual:HonroApp.scene.manual,frame:HonroApp.scene.storyFrameReport,size:HonroApp.scene.size(),returnCamera:HonroApp.storyCamera})')
 def fit(r):
  f=r['frame'];assert f['chapter19Landscape'];s=f['camera']['scale'];assert s<=.78001
  for box in f['boxes']:
   x=r['size']['w']/2+(box['x']-f['camera']['x'])*s;y=r['size']['h']/2+(box['y']-f['camera']['y'])*s;rect=f['rect'];assert x>=rect['x']-.5 and x+box['w']*s<=rect['x']+rect['w']+.5,box;assert y>=rect['y']-.5 and y+box['h']*s<=rect['y']+rect['h']+.5,box
 def previous_to_start(p):
  while p.evaluate('HonroApp.dialogue.index')>0:p.locator('[data-action=dialogue-prev]').tap()
 def camera_return(p,how):
  expected=p.evaluate('structuredClone(HonroApp.storyCamera)');assert expected;p.evaluate('''()=>{const s=HonroApp.scene,old=s.storyRelease.bind(s);s.storyRelease=(camera,...args)=>{window.__returnRequested=structuredClone(camera);return old(camera,...args)}}''')
  if how=='skip':
   for _ in range(5):
    if not p.evaluate('!!HonroApp.dialogue'):break
    p.locator('[data-action=dialogue-skip]').tap();p.wait_for_timeout(100)
  else:
   while p.evaluate('!!HonroApp.dialogue'):p.locator('[data-action=dialogue-next]').tap()
  p.wait_for_function('!HonroApp.dialogue&&!HonroApp.scene.storyFrame&&!HonroApp.scene.storyTween',timeout=10000);requested=p.evaluate('window.__returnRequested');assert all(requested[k]==expected[k]for k in ['x','y','scale']),(requested,expected);actual=p.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale,manual:HonroApp.scene.manual})');assert actual['manual']==bool(expected.get('manual')),(expected,actual)
  assert abs(actual['scale']-expected['scale'])<.002,(expected,actual)
  # Normal follow/bounds may subsequently constrain the restored center; record both.
  rows.append({'return':how,'expected':expected,'actual':actual,'noFrameOrTween':True})
 c,p=open_scene({'width':844,'height':390});previous_to_start(p);p.wait_for_timeout(650);r=report(p);fit(r);rows.append(r);p.screenshot(path=str(OUT/'844-old-souls-narration-auto-landscape.jpg'),type='jpeg',quality=90)
 while p.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')!='19.beats.old-soul:wrong-door':p.locator('[data-action=dialogue-next]').tap()
 p.wait_for_timeout(650);r=report(p);fit(r);assert r['camera']['scale']>.5;rows.append(r);p.screenshot(path=str(OUT/'844-old-souls-dialogue-auto.jpg'),type='jpeg',quality=90);camera_return(p,'normal');c.close()
 c,p=open_scene({'width':844,'height':390});p.wait_for_timeout(650);camera_return(p,'skip');c.close()
 c,p=open_scene({'width':390,'height':844});p.wait_for_timeout(650);r=report(p);assert not r['frame'].get('chapter19Landscape');before=p.evaluate('HonroStoryFraming.targetFrame(HonroApp.scene,HonroApp.engine)');baseline=p.evaluate('(()=>{const F=HonroStage19Farewell,old=F.landscapeFrame;F.landscapeFrame=()=>null;try{return HonroStoryFraming.targetFrame(HonroApp.scene,HonroApp.engine)}finally{F.landscapeFrame=old}})()');assert before==baseline;rows.append({'portraitExactPriorPlan':True,'report':r});c.close()
 assert not errors,errors
 (OUT/'landscape-camera-browser.json').write_text(json.dumps({'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'rows':rows,'errors':errors,'scope':'Local built Chromium touch844x390 and390x844. Prepared old-soul-mid Continue, actual previous/next/skip controls and automatic production framing. No manual camera, public or physical device claim.'},ensure_ascii=False,indent=2));b.close();print('PASS old-soul automatic landscape dialogue/narration six bounds fit, portrait exact, normal/skip player camera return')
