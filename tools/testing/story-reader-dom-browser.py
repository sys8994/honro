"""Prepared19 save/approach, actual route/reader/Continue; canonical mode fixtures for DOM audit."""
import json,sys,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ.get('HONRO_STORY_ROOT',Path(__file__).resolve().parents[2]));sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/narration-body-20261023';OUT.mkdir(parents=True,exist_ok=True)
profile=json.loads(Path(os.environ.get('HONRO_STORY_PROFILE',ROOT/'_local/reports/act2-time-farewell-20261023/route-before.json')).read_text());catalog=json.loads((ROOT/'shared/data/narrative-current.json').read_text());route=catalog['stages']['19']['beats']['route'];document=next(r for r in catalog['stages']['19']['beats']['old-soul']if r[2].get('rowId')=='19.beats.old-soul:20ded77694');rows=[];errors=[]
AUDIT=r'''(()=>{const a=HonroApp,n=document.getElementById('story-line'),r=n.getBoundingClientRect(),style=getComputedStyle(n),range=document.createRange();range.selectNodeContents(n);const glyph=range.getBoundingClientRect(),ancestors=[];let clip={left:Math.max(0,r.left),top:Math.max(0,r.top),right:Math.min(innerWidth,r.right),bottom:Math.min(innerHeight,r.bottom)};for(let x=n;x;x=x.parentElement){const s=getComputedStyle(x),b=x.getBoundingClientRect();ancestors.push({tag:x.tagName,id:x.id,cls:x.className,hidden:x.hidden,display:s.display,visibility:s.visibility,opacity:s.opacity,overflowX:s.overflowX,overflowY:s.overflowY,minHeight:s.minHeight,maxHeight:s.maxHeight,zIndex:s.zIndex,inline:x.getAttribute('style'),rect:b.toJSON()});if(x!==n&&['hidden','clip','auto','scroll'].includes(s.overflowY)){clip.top=Math.max(clip.top,b.top);clip.bottom=Math.min(clip.bottom,b.bottom)}if(x!==n&&['hidden','clip','auto','scroll'].includes(s.overflowX)){clip.left=Math.max(clip.left,b.left);clip.right=Math.min(clip.right,b.right)}}const hit=document.elementFromPoint((clip.left+clip.right)/2,(clip.top+clip.bottom)/2),panel=n.closest('.story-scene,.story-guide'),buttons=[...document.querySelectorAll('#dialogue-root .story-actions button')].map(x=>{const b=x.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return{text:x.textContent,rect:b.toJSON(),hit:x===hit||x.contains(hit),disabled:x.disabled,scroll:x.scrollWidth,client:x.clientWidth}});return{text:n.textContent,expected:a.dialogue.lines[a.dialogue.index][1],row:a.dialogue.lines[a.dialogue.index][2]?.rowId,kind:panel.dataset.speakerKind||'guide',index:a.dialogue.index,total:a.dialogue.lines.length,rect:r.toJSON(),glyph:glyph.toJSON(),clip,hit:n===hit||n.contains(hit),font:style.fontSize,lineHeight:parseFloat(style.lineHeight),scrollHeight:n.scrollHeight,clientHeight:n.clientHeight,scrollTop:n.scrollTop,inlineLimit:n.style.getPropertyValue('--story-copy-limit'),roots:document.querySelectorAll('#dialogue-root').length,lines:document.querySelectorAll('#story-line').length,overlays:document.querySelectorAll('#dialogue-root>.story-overlay').length,portraits:document.querySelectorAll('#dialogue-root .story-portrait').length,buttons,ancestors}})()'''
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);c=b.new_context(viewport={'width':360,'height':780},is_mobile=True,has_touch=True,device_scale_factor=2,user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').tap();p.wait_for_function('HonroApp.canInput()&&!HonroApp.turnNotice',timeout=90000)
 def watch_frames():p.evaluate('''()=>{window.__readerDraws=0;const s=HonroApp.scene,draw=s.render.bind(s);s.render=(...args)=>{__readerDraws++;return draw(...args)}}''')
 def audit(label,kind=None):
  frames=p.evaluate('window.__readerDraws||0');p.wait_for_timeout(240)
  try:p.wait_for_function('(n)=>window.__readerDraws>n',arg=frames,timeout=5000)
  except Exception:
   print(label,p.evaluate('({frames:window.__readerDraws,error:HonroApp.lastError,screen:HonroApp.screen,phase:HonroApp.engine?.b.phase,modal:HonroApp.modalKind})'),flush=True);raise
  r=p.evaluate(AUDIT);r['realRenderFrames']=p.evaluate('__readerDraws')-frames;r['label']=label;r['view']=p.viewport_size
  assert r['text'].strip() and r['text']==(p.evaluate('HonroActionPrompts?.text(HonroApp.dialogue.lines[HonroApp.dialogue.index][1])')if kind=='guide' else r['expected']),(label,'data mismatch',r['text'])
  assert r['roots']==r['lines']==r['overlays']==1,(label,'duplicate DOM')
  assert r['rect']['height']>=min(12,r['lineHeight']*.5) and r['glyph']['height']>0,(label,'zero body',r)
  assert r['clip']['bottom']-r['clip']['top']>=min(12,r['lineHeight']*.5) and r['clip']['right']>r['clip']['left'] and r['hit'],(label,'clipped or covered',r)
  assert all(x['display']!='none' and x['visibility']=='visible' and float(x['opacity'])>.98 and not x['hidden'] for x in r['ancestors']),(label,'hidden ancestor',r)
  assert os.environ.get('HONRO_READER_BASELINE')=='1' or not r['inlineLimit'],(label,'measured cap leaked')
  assert all(x['rect']['height']>0 and x['rect']['x']>=-.5 and x['rect']['right']<=p.viewport_size['width']+.5 and x['rect']['y']>=-.5 and x['rect']['bottom']<=p.viewport_size['height']+.5 and x['hit']for x in r['buttons']),(label,'button clipped/covered',r)
  if kind:assert r['kind']==kind,(label,'mode mismatch',r['kind'])
  if kind in ['narration','guide','document']:assert r['portraits']==0,(label,'portrait leaked')
  rows.append(r);
  if len(rows)%10==0:print('reader audits',len(rows),label,flush=True)
  return r
 def capture(name):p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=82,scale='css')
 def skip():
  for _ in range(8):
   if not p.evaluate('!!HonroApp.dialogue'):return
   p.locator('[data-action=dialogue-skip]'if p.locator('[data-action=dialogue-skip]').count() else '[data-action=dialogue-next]').tap();p.wait_for_timeout(50)
  raise AssertionError('skip did not reach boundary')
 watch_frames()
 p.evaluate('''()=>{const a=HonroApp,m=a.engine.b.honroMarkers.find(m=>m.id==='route');Object.assign(a.engine.active,{x:m.x-48,y:m.y,vx:0,vy:0});a.updateHUD(true)}''');p.locator('[data-context-interact=route]').tap();audit('actual-route-first','narration')
 p.set_viewport_size({'width':360,'height':150});p.evaluate('HonroStory.draw(HonroApp)');p.wait_for_timeout(100);p.set_viewport_size({'width':360,'height':780});
 if os.environ.get('HONRO_READER_BASELINE')=='1':
  p.wait_for_timeout(500);r=p.evaluate(AUDIT);assert r['text']==route[0][1] and r['rect']['height']==0 and r['inlineLimit']=='0.00px';capture('before-route-1-android');(OUT/'baseline-reproduction.json').write_text(json.dumps({'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'row':r,'scope':'Actual9ed built App/normal render, prepared transient150px viewport then restored360x780. Same canonical route/DOM text remains; exact physical Android trigger unconfirmed.'},ensure_ascii=False,indent=2));b.close();print('PASS baseline reproduction: source/DOM text present but0px body persists after viewport restoration');sys.exit(0)
 audit('short-viewport-restored','narration');capture('after-route-1-android');held=p.evaluate('__readerDraws');p.wait_for_function('(n)=>window.__readerDraws>=n+90',arg=held,timeout=15000);audit('sustained-normal-frame-route','narration')
 p.evaluate('document.getElementById("dialogue-root").hidden=true;HonroStory.draw(HonroApp)');p.wait_for_timeout(50);p.evaluate('document.getElementById("dialogue-root").hidden=false');audit('hidden-host-restored','narration')
 p.reload();p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').tap();p.wait_for_function('!!HonroApp.dialogue',timeout=90000);watch_frames();r=audit('Continue-route-first','narration');assert r['text']==route[0][1] and r['index']==0 and r['total']==3
 p.locator('[data-action=dialogue-next]').tap();audit('route-next-character','character');capture('after-route-2-damheo');p.locator('[data-action=dialogue-prev]').tap();audit('route-prev-narration','narration');p.locator('[data-action=dialogue-next]').tap();p.locator('[data-action=dialogue-next]').tap();audit('route-next-sodan','character');capture('after-route-3-sodan');skip()
 # The following mode/long-body sequences prepare only the reader with exact existing prose.
 p.evaluate('''rows=>{const ledger=HonroStoryContent.ledgerPages[0];window.__readerRows=[rows[1],rows[0],rows[2],['안내',HonroApp.stage.guide||HonroApp.stage.goal,{kind:'guide'}],rows[3],['기록',ledger[1],{kind:'document',documentTitle:ledger[0]}],rows[1]];}''',route+[document])
 for view in [(320,694),(360,780),(390,844),(480,1040),(844,390),(780,360)]:
  p.set_viewport_size({'width':view[0],'height':view[1]});p.evaluate('HonroStory.start(HonroApp,structuredClone(__readerRows))')
  for i,kind in enumerate(['character','narration','character','guide','document','narration','character']):
   r=audit('mode-'+str(view)+'-'+str(i),kind)
   if i==1 and view==(390,844):capture('after-route-1-390')
   if i==1 and view==(844,390):capture('after-route-1-landscape')
   if i<6:p.locator('[data-action=dialogue-next]').tap()
  p.locator('[data-action=dialogue-prev]').tap();audit('back-legacy-record-'+str(view),'narration');p.locator('[data-action=dialogue-next]').tap();audit('back-to-character-'+str(view),'character');skip();assert p.locator('#dialogue-root').inner_text()==''
  p.evaluate('HonroStory.start(HonroApp,structuredClone(__readerRows.slice(0,3)))');audit('repeat-open-'+str(view),'character');skip()
 for view in [(360,780),(844,390)]:
  p.set_viewport_size({'width':view[0],'height':view[1]});p.evaluate('document.documentElement.style.webkitTextSizeAdjust="125%"')
  for index,kind in [(0,'character'),(1,'narration'),(3,'guide'),(4,'document')]:
   p.evaluate('i=>{const row=structuredClone(__readerRows[i]);row[1]=Array(30).fill(row[1]).join(" ");HonroStory.start(HonroApp,[row]);}',index)
   for where in [0,.5,1]:
    p.locator('#story-line').evaluate('(n,k)=>n.scrollTop=(n.scrollHeight-n.clientHeight)*k',where);r=audit('long-'+str(view)+'-'+kind+'-'+str(where),kind);assert r['scrollHeight']>r['clientHeight'],('No body scrolling',r)
   if kind=='narration'and view==(360,780):capture('after-long-narration')
   skip()
  p.evaluate('document.documentElement.style.webkitTextSizeAdjust="100%"')
 # Fresh row/Continue and repeated mode sequences above exercise a shared single host, without modal residue.
 assert not errors,errors
 (OUT/'dom-browser.json').write_text(json.dumps({'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'rows':rows,'errors':errors,'scope':'Local built Chromium Android UA/touch and listed viewports; prepared route-before save and marker approach. Actual route/previous/next/skip/reload. Canonical reader-only mode bundles and repeated-text long/125% autosizing fixtures, not authored prose changes or physical Android evidence.'},ensure_ascii=False,indent=2));b.close();print('PASS reader DOM ownership/text/pixel rect/styles/clipping/hit targets, recovery/Continue/mode transitions/long scrolling:',len(rows),'audits')
