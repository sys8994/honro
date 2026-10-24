"""Production DOM differential and narrow layout/input checks, normal App frames."""
import json,subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/story-presentation-p11b';OUT.mkdir(parents=True,exist_ok=True)
old=subprocess.check_output(['git','show','d1e45a0fe72507a695dbdcf00f1141fee357b1dd:shared/runtime/story.js'],text=True)
new=(ROOT/'shared/runtime/story.js').read_text()
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate("()=>{HonroApp.close();HonroApp.canSpeak=()=>true;window.framesObserved=0;requestAnimationFrame(function count(){framesObserved++;requestAnimationFrame(count)})}")
 # Instrument only lifecycle boundaries; production draw/DOM, portraits and camera remain real.
 p.evaluate("""()=>{window.calls=[];const a=HonroApp,insert=Element.prototype.insertAdjacentHTML,focus=HTMLElement.prototype.focus,snapshot=HonroStoryStaging.snapshot,play=a.audio.play;
 Element.prototype.insertAdjacentHTML=function(where,html){if(html.includes('dialogue-prev'))calls.push('controls');return insert.call(this,where,html)};
 HTMLElement.prototype.focus=function(options){if(this.dataset.action==='dialogue-next')calls.push('focus:'+options?.preventScroll);return focus.call(this,options)};
 HonroStoryStaging.snapshot=function(app){calls.push('save');return snapshot.call(this,app)};a.audio.play=function(id){if(id==='dialogue')calls.push('audio');return play.call(this,id)};
 window.compareDraw=({kind,index=0})=>{const meta={kind:kind==='explicit'?'narration':kind==='guide'?'guide':kind.includes('document')?'document':undefined},who={portrait:'설오',missing:'fixture',explicit:'fixture',legacy:'길 위의 기록',guide:'안내',document:'기록','document19':'기록','documentOther19':'기록'}[kind],a=HonroApp,b=a.engine.b;
 if(kind.includes('19')){meta.rowId=kind==='document19'?'19.beats.old-soul:20ded77694':'unrelated';meta.documentTitle='& < >';}
 const stage=b.honroStage,mode=b.mode;if(kind.includes('19')){b.honroStage=19;b.mode='campaign';}
 const text='& < > " \\u0027',line=[who,text,meta];a.dialogue={lines:[line,line],index};a.storySoundDialogue=null;a.storySoundKey=null;calls=[];HonroStory.draw(a);
 const node=document.getElementById('dialogue-root'),clone=node.cloneNode(true);for(const c of clone.querySelectorAll('canvas')){c.removeAttribute('data-portrait-state');c.removeAttribute('aria-busy');}
 const result={html:clone.innerHTML,body:node.querySelector('#story-line').textContent,calls:[...calls],previous:node.querySelectorAll('[data-action=dialogue-prev]').length,disabled:node.querySelector('[data-action=dialogue-prev]').disabled,focus:document.activeElement.dataset.action,portrait:!!node.querySelector('.story-portrait')};
 calls=[];HonroStory.draw(a);result.redrawCalls=[...calls];result.redrawPrevious=node.querySelectorAll('[data-action=dialogue-prev]').length;b.honroStage=stage;b.mode=mode;return result;};} """)
 rows={}
 for kind in ['portrait','missing','explicit','legacy','guide','document19','documentOther19','document']:
  p.evaluate(old);before=p.evaluate('compareDraw',{'kind':kind})
  p.evaluate(new);after=p.evaluate('compareDraw',{'kind':kind})
  assert before==after,(kind,before,after)
  assert after['body']=='& < > " \u0027',after['body']
  assert after['calls']==['controls','audio','focus:true','save'],after['calls']
  assert after['redrawCalls']==['controls','focus:true','save'] and after['redrawPrevious']==after['previous']==1
  assert after['disabled'] and after['focus']=='dialogue-next'
  rows[kind]={k:v for k,v in after.items() if k!='html'}
  (OUT/(kind+'.html')).write_text(after['html'])
 assert rows['portrait']['portrait'] and not rows['missing']['portrait']
 p.evaluate("compareDraw({kind:'explicit',index:1})");assert not p.locator('[data-action=dialogue-prev]').is_disabled()
 # A true staging draw must keep its own skip focus and must not add save/next focus.
 rows['staging']=[]
 for code in [old,new]:
  p.evaluate(code)
  result=p.evaluate("""()=>{const a=HonroApp,original=HonroStoryStaging.draw;HonroStoryStaging.draw=(app,node)=>{node.innerHTML='<div class="story-actions"><button data-action="dialogue-skip">skip</button><button data-action="dialogue-next">next</button></div>';node.querySelector('[data-action=dialogue-skip]').focus();return true;};a.dialogue={lines:[['서술','&']],index:0,staging:{complete:false,cursor:0}};a.storySoundDialogue=null;calls=[];HonroStory.draw(a);const result={calls:[...calls],focus:document.activeElement.dataset.action};HonroStoryStaging.draw=original;return result;}""")
  assert result=={'calls':['controls','audio'],'focus':'dialogue-skip'},result
  rows['staging'].append(result)
 p.evaluate(new)
 rows['layouts']=[]
 for w,h in [(360,780),(1280,900)]:
  p.set_viewport_size({'width':w,'height':h})
  for kind in ['portrait','explicit','guide','document19']:
   p.evaluate('compareDraw',{'kind':kind});p.wait_for_timeout(350)
   result=p.locator('#story-line').evaluate("n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),a=n.closest('section').querySelector('.story-actions').getBoundingClientRect();return {width:r.width,height:r.height,visible:s.display!=='none'&&s.visibility==='visible'&&+s.opacity>0&&r.width>0&&r.height>0,separateControls:r.bottom<=a.top+1||r.right<=a.left+1||r.left>=a.right-1}}");assert result['visible'] and result['separateControls'],(w,kind,result)
   p.screenshot(path=str(OUT/f'{w}-{kind}.jpg'),type='jpeg',quality=80)
   p.locator('[data-action=dialogue-next]').click();assert p.evaluate('HonroApp.dialogue.index===1')
   p.locator('[data-action=dialogue-prev]').click();assert p.evaluate('HonroApp.dialogue.index===0')
   if kind=='guide':
    p.locator('[data-action=dialogue-next]').click();p.locator('[data-action=dialogue-next]').click()
   else:p.locator('[data-action=dialogue-skip]').click()
   assert p.evaluate('HonroApp.dialogue===null')
   rows['layouts'].append({'view':[w,h],'kind':kind,**result,'nextPreviousSkip':True})
 assert p.evaluate('framesObserved>10');rows['framesObserved']=p.evaluate('framesObserved');assert not errors,errors;rows['errors']=errors;rows['browser']=b.version;b.close()
(OUT/'browser.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print('PASS production DOM8 variants exact; lifecycle/audio/focus/staging; mobile/desktop layout and next/previous/skip')
