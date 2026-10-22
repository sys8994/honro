"""Count actual target Canvas calls after warm, aborted and timed-out loading.
Vector source cache hits and final target raster paints are separate counters.
"""
import json,sys,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/approved-portraits';OUT.mkdir(parents=True,exist_ok=True)
expect='--expect-repaint' in sys.argv;rows=[]
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw)
 for mode in (['abort'] if '--abort-only' in sys.argv else ['ready','abort','timeout']):
  c=b.new_context(viewport={'width':1280,'height':800});p=c.new_page();held=[]
  if mode=='abort':p.route('**/portrait-hwigyeom-base.*.webp',lambda r:r.abort())
  if mode=='timeout':p.route('**/portrait-hwigyeom-base.*.webp',lambda r:held.append(r))
  p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate("HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;HonroStory.start(HonroApp,[['휘겸','폴백 paint 계측']],{title:'검수'})")
  target='ready' if mode=='ready' else 'error';p.wait_for_function('s=>document.getElementById("story-portrait-canvas")?.dataset.portraitState===s',arg=target,timeout=12000)
  result=p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage,clear=ctx.clearRect,calls={drawImage:0,clearRect:0};ctx.drawImage=function(...args){calls.drawImage++;return draw.apply(this,args);};ctx.clearRect=function(...args){calls.clearRect++;return clear.apply(this,args);};const before=HonroPortraits.stats(),pixelsBefore=c.toDataURL();for(let i=0;i<120;i++)HonroPortraits.draw(c,null,'knight',{identity:'휘겸'});const same={...calls},after=HonroPortraits.stats(),samePixels=pixelsBefore===c.toDataURL();c.width+=2;HonroPortraits.draw(c,null,'knight',{identity:'휘겸'});const resized={drawImage:calls.drawImage-same.drawImage,clearRect:calls.clearRect-same.clearRect};const second={...calls};for(let i=0;i<120;i++)HonroPortraits.draw(c,null,'knight',{identity:'휘겸'});return {before,after,samePixels,identical120:same,resizeOnce:resized,afterResize120:{drawImage:calls.drawImage-second.drawImage,clearRect:calls.clearRect-second.clearRect}};}''')
  result['mode']=mode;rows.append(result);assert result['before']['requests']==result['after']['requests'] and result['before']['decodes']==result['after']['decodes'] and result['samePixels']
  n=120 if expect and mode!='ready' else 0
  assert result['identical120']=={'drawImage':n,'clearRect':n},result
  assert result['resizeOnce']=={'drawImage':1,'clearRect':1},result
  assert result['afterResize120']=={'drawImage':n,'clearRect':n},result
  if not expect and mode=='abort':
   appearance=p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),ctx=c.getContext('2d'),draw=ctx.drawImage;let count=0;ctx.drawImage=function(...args){count++;return draw.apply(this,args);};const actor={id:'qa-hwig',name:'휘겸',cls:'knight',side:2,honroAlly:true,boss:true},go=()=>HonroPortraits.draw(c,actor,'knight',{identity:'휘겸'});go();const changed=count;for(let i=0;i<120;i++)go();const stable=count-changed;actor.x=123;actor.hp=11;go();const irrelevant=count-changed-stable;actor.boss=false;const at=count;go();return {sourceChangeOnce:changed,sameSource120:stable,combatFields:irrelevant,sourceReturnOnce:count-at};}''')
   assert appearance=={'sourceChangeOnce':1,'sameSource120':0,'combatFields':0,'sourceReturnOnce':1},appearance;result['appearanceInvalidation']=appearance
   p.evaluate("HonroStory.start(HonroApp,[['설오','clean source alpha 검수']],{title:'검수'})");p.wait_for_function('document.getElementById("story-portrait-canvas").dataset.portraitState==="ready"')
   corners=p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),ctx=c.getContext('2d'),a=HONRO_STORY_PORTRAITS['설오'].approvedPortrait.expressions.base;return {topLeftAlpha:ctx.getImageData(0,0,1,1).data[3],topRightAlpha:ctx.getImageData(c.width-1,0,1,1).data[3],source:a.source,sourceSha256:a.sourceSha256,identityMasterSha256:a.identityMasterSha256};}''');assert corners['topLeftAlpha']==0 and corners['topRightAlpha']==0,corners;result['cleanSeoroCanvas']=corners
  for route in held:route.abort()
  c.close();print(mode,result['identical120'],flush=True)
 b.close()
result={'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'expectedOldRepaint':expect,'rows':rows};(OUT/('repaint-before.json' if expect else 'repaint-after.json')).write_text(json.dumps(result,indent=2))
