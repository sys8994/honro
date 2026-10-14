"""Real desktop/mobile inputs on the authored lower court support.
Actors begin at a controlled observation pose; this is not a traversal/fullplay.
HONRO_BASE_URL can point at the final deployed GitHub Pages directory.
"""
import hashlib
import json
import os
import base64
import subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/bell-anomaly-browser'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('HONRO_BASE_URL', 'http://127.0.0.1:8765').rstrip('/')
SETUP = r'''mobile => {
 const a=HonroApp;a.close();a.stopBattle();a.debugMode=false;
 const profile=HONRO_TOOLS.fresh();for(let i=1;i<18;i++)profile.cleared[i]={visits:1,rounds:5};
 profile.recruited=['archer','mage','knight','occultist'];profile.party=[...profile.recruited];
 profile.settings.sound=false;profile.settings.music=false;profile.settings.playerSpeed=1;
 for(const cls of profile.recruited)profile.heroes[cls].xp=HONRO_CORE.xpAtLevel(16);
 a.profile=profile;a.normalProfile=profile;a.launch(18);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;
 const e=a.engine,b=e.b,u=e.unit('p-archer');
 Object.assign(b,{active:u.id,side:0,phase:'aim'});Object.assign(u,{x:4300,y:5770,vx:0,vy:0,acted:false,moving:0,jumping:false,airborne:false,angle:-15,lastPower:.55,focus:71,prepared:{rank:3,expires:b.round+2},cooldowns:{A04:b.round+3}});
 // A controlled observation fixture keeps the encounter actors in place and
 // leaves every original terrain, HP, objective and skill definition intact.
 a.selected='A01';a.power=.55;a.selectedByUnit[u.id]='A01';
 a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.focusId=null;a.scene.focusUntil=0;a.scene.speakerUntil=0;
 const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;
 a.scene.x=mobile?4750:4850;a.scene.y=5620;a.scene.scale=mobile?.32:.58;a.scene.manual=true;
 window.bellObserved={};
 const fire=e.fire.bind(e);e.fire=(...args)=>{
  window.bellObserved.before=JSON.stringify(HonroBellAnomaly.capture(b));
  window.bellObserved.objectives=JSON.stringify(b.honroState.act2);
  window.bellObserved.input={skill:args[0],angle:args[1],power:args[2],ai:!!args[3]};
  const result=fire(...args);window.bellObserved.started=result&&HonroBellAnomaly.blocked(b);return result;
 };
 const emit=e.emit.bind(e);e.emit=(type,...rest)=>{
  if(type==='change'&&b.honroState.bellAnomaly?.status==='RESOLVED'&&!window.bellObserved.after){
   window.bellObserved.after=JSON.stringify(HonroBellAnomaly.capture(b));
   window.bellObserved.dialogue=!!a.dialogue?.bellAnomaly;
   window.bellObserved.objectivesAfter=JSON.stringify(b.honroState.act2);
  }return emit(type,...rest);
 };
 a.updateHUD(true);a.scene.render(e,0,a.selected,a.power,false,0,true);
 const canvas=document.getElementById('battlecanvas');canvas.tabIndex=0;canvas.focus();
 return {revision:b.honroBellAnomalyRevision,environment:b.honroStoryAnomalyEnvironment?.kind,grounded:e.grounded(u),region:HonroBellAnomaly.zone(b),eligible:HonroBellAnomaly.eligible(e,'A01',-15,.55,false),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id};
}'''
checks = []
errors = []
html_hashes = []
with sync_playwright() as p:
 browser = launch(p)
 for mobile in [False, True]:
  label = 'mobile' if mobile else 'desktop'
  viewport = {'width':390,'height':844} if mobile else {'width':1440,'height':900}
  context = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile)
  page = context.new_page()
  page.on('pageerror', lambda error: errors.append(str(error)))
  response=page.goto(BASE+'/HONRO.html')
  assert response and response.ok
  # The large self-contained HTML exceeds Chromium's inspector body cache.
  # Read the same static URL immediately and verify response identity headers.
  artifact=context.request.get(response.url)
  assert artifact.ok
  for header in ['etag','last-modified']:
   if response.headers.get(header):
    assert artifact.headers.get(header)==response.headers[header],header
  html_hashes.append(hashlib.sha256(artifact.body()).hexdigest())
  page.wait_for_function('window.HonroApp && window.HonroBellAnomaly')
  page.locator('.title-actions button').first.click()
  setup = page.evaluate(SETUP, mobile)
  assert setup['revision']==1 and setup['grounded'] and setup['eligible'],setup
  assert setup['environment']=='bell-projectiles' and setup['support']=='sb-court-lower-step',setup
  # Chromium's standard screencast records the actual page including DOM story.
  # Encode with the installed system ffmpeg; no Playwright download is required.
  frames=[]
  directory=OUT/(label+'-frames');directory.mkdir(exist_ok=True)
  session=context.new_cdp_session(page)
  def capture(frame):
   path=directory/('%05d.png'%len(frames));path.write_bytes(base64.b64decode(frame['data']))
   frames.append((path,frame['metadata'].get('timestamp',0)))
   session.send('Page.screencastFrameAck',{'sessionId':frame['sessionId']})
  session.on('Page.screencastFrame',capture)
  session.send('Page.startScreencast',{'format':'png','maxWidth':viewport['width'],'maxHeight':viewport['height'],'everyNthFrame':1})
  page.screenshot(path=str(OUT/(label+'-before.png')))
  if mobile:
   box=page.locator('#fire').bounding_box()
   assert box
   page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2)
   page.mouse.down()
  else:
   page.keyboard.down('Space')
  page.wait_for_function('HonroApp.charging && HonroApp.chargePower()>=.53', polling=10)
  if mobile:
   page.mouse.up()
  else:
   page.keyboard.up('Space')
  page.wait_for_function('bellObserved.started && HonroBellAnomaly.blocked(HonroApp)')
  during=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return {phase:b.phase,count:b.projectiles.length,input:bellObserved.input,canInput:a.canInput(),objectives:JSON.stringify(b.honroState.act2)===bellObserved.objectives}}''')
  assert during['count']==1 and during['phase']=='flight' and not during['canInput'] and during['objectives'],during
  page.screenshot(path=str(OUT/(label+'-flight.png')))
  page.wait_for_function('bellObserved.after && HonroApp.dialogue?.bellAnomaly')
  result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return {exactRefund:bellObserved.before===bellObserved.after,objectives:bellObserved.objectives===bellObserved.objectivesAfter,dialogue:bellObserved.dialogue,speaker:a.dialogue.lines[0][0],count:b.honroState.bellAnomaly.count,state:b.honroState.bellAnomaly.status,profile:a.profile.honroStoryEvents['act2-bell-anomaly-v1'],hp:a.engine.active.hp,focus:a.engine.active.focus,acted:a.engine.active.acted}}''')
  assert result['exactRefund'] and result['objectives'] and result['dialogue'],result
  assert result['speaker']=='설오' and result['count']==1 and result['state']=='RESOLVED' and result['profile'],result
  assert result['focus']==71 and result['acted'] is False,result
  assert page.locator('#story-line').inner_text()=='맞았어야 할 자리에 닿지 않았습니다.'
  page.wait_for_timeout(650)  # Capture the settled dialogue, after its entry fade.
  page.screenshot(path=str(OUT/(label+'-dialogue.png')))
  page.locator('[data-action="dialogue-skip"]').click()
  page.wait_for_function('!HonroApp.dialogue && HonroApp.canInput()')
  assert page.evaluate('HonroApp.engine.b.honroState.bellAnomaly.count')==1
  page.wait_for_timeout(650)  # The normal story camera release is 450 ms.
  page.screenshot(path=str(OUT/(label+'-return.png')))
  session.send('Page.stopScreencast')
  assert len(frames)>8,('screencast needs actual intermediate frames',len(frames))
  concat=directory/'frames.txt'
  concat.write_text(''.join("file '%s'\nduration %.6f\n"%(path.name,max(.008,min(.5,frames[min(i+1,len(frames)-1)][1]-stamp))) for i,(path,stamp) in enumerate(frames))+"file '%s'\n"%frames[-1][0].name)
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c:v','libvpx-vp9','-pix_fmt','yuv420p','-b:v','900k',str(OUT/(label+'.webm'))],check=True)
  checks.append({'viewport':label,'fixture':setup,'input':during['input'],'result':result,
                 'checks':['real Space hold/release' if not mobile else 'real pointer hold/release on mobile fire button',
                           'one actual arrow','runtime objectives frozen','exact cast refund before story',
                           'immediate readable story and actual skip','HUD/input restored'],
                 'screenshots':[label+'-'+name+'.png' for name in ['before','flight','dialogue','return']],
                 'video':{'file':label+'.webm','actualPageFrames':len(frames),'method':'Chromium CDP screencast + system ffmpeg'}})
  print('PASS',label,result,flush=True)
  context.close()
 browser.close()
assert not errors,errors
assert len(set(html_hashes))==1,('HTML changed between viewport runs',html_hashes)
summary={'status':'passed','url':BASE+'/HONRO.html','checks':checks,'errors':errors,
         'htmlSha256':html_hashes[0],
         'htmlHashMethod':'Immediate same-URL HTTP read, matching any ETag/Last-Modified header and identical hashes across viewports.',
         'limits':['Controlled supported observation pose, not normal traversal or combat completion.',
                   'Mobile viewport uses actual pointer input; physical-device touch/latency are not tested.',
                   'Initial native Playwright recording lacked its ffmpeg bundle; the official CDN download returned Domain forbidden 403. Recorded actual page frames with supported CDP and installed system ffmpeg instead.',
                   'No performance benchmark.']}
(OUT/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
