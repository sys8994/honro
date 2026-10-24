"""Focused P1.1a Chromium checks; fixtures use isolated storage and normal App frames.
Reuses icon-cache-journey-browser.py instrumentation without its unrelated cases.
"""
import ast,json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/camp-renderer-p11a';OUT.mkdir(parents=True,exist_ok=True)
source=ast.parse((ROOT/'tests/icon-cache-journey-browser.py').read_text())
shared={n.targets[0].id:ast.literal_eval(n.value) for n in source.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ('INIT','SETUP','WATCH')}
rows={}
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 p=ctx.new_page();p.add_init_script(shared['INIT']);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp')
 assert p.evaluate("!('patch' in HonroSkillImages)&&typeof HonroCampRenderer.patch==='function'")
 p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate(shared['SETUP'])
 p.wait_for_function("[...document.querySelectorAll('#combat-skills .skill-art')].every(e=>e.dataset.imageState==='ready')")
 p.wait_for_function('HonroSkillImages.status().cached===84&&HonroSkillImages.status().active===0&&HonroSkillImages.status().queued===0')
 p.evaluate(shared['WATCH'])
 for i in range(12):
  p.locator('#combat-skills>button').nth(i%4).click(force=True)
  p.evaluate("i=>{const a=HonroApp,u=a.engine.active;u.focus=i%2?u.maxFocus:0;u.cooldowns={A02:i%3};a.updateHUD(true)}",i)
 p.wait_for_timeout(100)
 rows['hud']=p.evaluate("({sameButtons:identity.every((n,i)=>n===document.querySelectorAll('#combat-skills>button')[i]),sameArt:artIdentity.every((n,i)=>n===document.querySelectorAll('#combat-skills .skill-art')[i]),mutations,decodeDelta:iconStats.decode-before.decode,loadDelta:iconStats.load-before.load,requestDelta:performance.getEntriesByType('resource').filter(e=>/skill-icon/.test(e.name)).length-before.resources})")
 assert rows['hud']=={'sameButtons':True,'sameArt':True,'mutations':{'created':0,'removed':0,'flash':0},'decodeDelta':0,'loadDelta':0,'requestDelta':0},rows['hud']
 p.evaluate("()=>{mo.disconnect();const a=HonroApp;a.profile.recruited=['archer','knight','mage','occultist'];a.profile.heroes.archer.xp=HONRO_CORE.xpAtLevel(30);a.showCamp('archer');window.frameCount=0;requestAnimationFrame(function count(){frameCount++;requestAnimationFrame(count)})}")
 p.wait_for_function("document.querySelector('#armory')&&[...document.querySelectorAll('#app .skill-art')].filter(e=>e.getBoundingClientRect().top<844&&e.getBoundingClientRect().bottom>0).every(e=>e.dataset.imageState==='ready')")
 p.evaluate("()=>{window.campArt=[...document.querySelectorAll('#app .skill-art')];window.campButtons=[...document.querySelectorAll('#app .tree-node,#app .slot-card')];window.countsBefore=HonroSkillImages.status();window.rankBefore=HonroApp.profile.heroes.archer.ranks.A14||0}")
 # Actual production UI inputs, after fixture provides level/SP in this fresh context.
 p.locator('[data-action=rank-plus][data-skill=A14]').click()
 assert p.evaluate('(HonroApp.profile.heroes.archer.ranks.A14||0)===rankBefore+1')
 p.locator('[data-action=invest-stat]').click()
 rows['campStable']=p.evaluate("({icons:campArt.every(n=>n.isConnected),buttons:campButtons.every(n=>n.isConnected),requests:HonroSkillImages.status().requests-countsBefore.requests,decodes:HonroSkillImages.status().decodes-countsBefore.decodes,srcWrites:HonroSkillImages.status().srcWrites-countsBefore.srcWrites,rank:HonroApp.profile.heroes.archer.ranks.A14,stat:HonroApp.profile.heroes.archer.statTraining})")
 assert rows['campStable']['icons'] and rows['campStable']['buttons']
 assert all(rows['campStable'][k]==0 for k in ('requests','decodes','srcWrites')),rows['campStable']
 p.evaluate("()=>{window.focusNode=document.querySelector('[data-action=branch][data-id=\"0\"]');focusNode.focus({preventScroll:true});document.getElementById('armory').scrollTop=120;window.scrollBefore=document.getElementById('armory').scrollTop;HonroApp.showCamp('archer')}")
 rows['context']=p.evaluate("({sameFocus:document.activeElement===focusNode,scrollBefore,scrollAfter:document.getElementById('armory').scrollTop,liveDetails:document.querySelectorAll('#armory details').length})")
 # Compare any focus behavior with the exact pre-move algorithm, not a new UI policy.
 old=subprocess.check_output(['git','show','5154db899d3c9f62012c87b4f943cd44f2c3e676:shared/runtime/skill-images.js'],text=True)
 block=old[old.index('// Scoped armory reconciliation.'):old.index('function retry(){')]
 p.evaluate("code=>{window.oldCampPatch=eval('(()=>{const scan=HonroSkillImages.scan;'+code+';return patch;})()')}",block)
 rows['context']['baselineSameFocus']=p.evaluate("()=>{const current=HonroCampRenderer.patch;HonroCampRenderer.patch=oldCampPatch;focusNode.focus({preventScroll:true});HonroApp.showCamp('archer');HonroCampRenderer.patch=current;return document.activeElement===focusNode}")
 assert rows['context']['sameFocus']==rows['context']['baselineSameFocus'],rows['context']
 assert rows['context']['scrollBefore']>0 and rows['context']['scrollBefore']==rows['context']['scrollAfter'],rows['context']
 p.locator('[data-action=branch][data-id="1"]').click();assert p.evaluate('HonroApp.branch===1')
 p.locator('[data-action=hero][data-class=mage]').click();assert p.evaluate("HonroApp.cls==='mage'")
 assert p.locator('.tree-node[data-skill^=M]').count()>0
 p.locator('[data-action=hero][data-class=archer]').click();p.locator('[data-action=branch][data-id="0"]').click()
 p.wait_for_timeout(250);assert p.evaluate('frameCount>5')
 rows['branchAndClass']={'actualClicks':True,'normalFrames':p.evaluate('frameCount')}
 p.screenshot(path=str(OUT/'camp-rank-mobile.jpg'),type='jpeg',quality=82)
 # Two identical icons in distinct slots: scoped DOM fixture, not a campaign loadout edit.
 rows['duplicateSlots']=p.evaluate("""()=>{const f=document.createElement('div');f.id='camp-subset-fixture';document.body.append(f);
 const button=(slot,cls='old')=>`<button data-action="slot" data-slot="${slot}" data-skill="A01" class="${cls}" aria-label="slot-${cls}"><span class="skill-art" data-skill-icon="A01"><img><b>old</b></span><em>${cls}</em></button>`;
 const html=(reverse=false)=>`<details open><summary>fixture</summary>${button(reverse?2:1,reverse?'new':'old')}${button(reverse?1:2,reverse?'new':'old')}</details>`;
 HonroCampRenderer.patch(f,html());const slots=[...f.querySelectorAll('button')],art=slots.map(n=>n.querySelector('.skill-art')),images=art.map(n=>n.querySelector('img')),details=f.firstElementChild;
 HonroCampRenderer.patch(f,html(true));const result={distinctSlots:slots[0]!==slots[1],reordered:f.querySelectorAll('button')[0]===slots[1],sameButtons:slots.every(n=>n.isConnected),sameHosts:slots.every((n,i)=>n.querySelector('.skill-art')===art[i]),sameImages:art.every((n,i)=>n.querySelector('img')===images[i]),attributes:slots.every(n=>n.className==='new'&&n.getAttribute('aria-label')==='slot-new'),text:slots.every(n=>n.querySelector('em').textContent==='new'),details:details===f.firstElementChild&&details.open};
 HonroCampRenderer.patch(f,'<details><summary>fixture</summary></details>');result.detailsClose=details===f.firstElementChild&&!details.open;result.removed=slots.every(n=>!n.isConnected);f.remove();return result;}""")
 assert all(rows['duplicateSlots'].values()),rows['duplicateSlots']
 assert not errors,errors;rows['pageErrors']=errors;ctx.close()
 # A pending host is removed before its image response, exercising observer target cleanup.
 ctx=b.new_context(viewport={'width':390,'height':844});p=ctx.new_page();held=[];lateErrors=[]
 p.on('pageerror',lambda e:lateErrors.append(str(e)));p.route('**/*skill-icon-A01*.webp',lambda r:held.append(r))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp')
 assert p.evaluate('HonroSkillImages.status().requests===0')
 p.evaluate("()=>{window.f=document.createElement('div');f.style='position:fixed;top:0;left:0;width:80px;height:80px';document.body.append(f);HonroCampRenderer.patch(f,'<span data-skill-icon=\"A01\"><img></span>');window.removedHost=f.firstChild}")
 p.wait_for_function('HonroSkillImages.status().targets===1')
 p.evaluate("HonroCampRenderer.patch(f,'')");p.wait_for_function('HonroSkillImages.status().targets===0')
 assert len(held)==1,len(held)
 held[0].continue_();p.unroute('**/*skill-icon-A01*.webp');p.wait_for_function("HonroSkillImages.readyURL('A01')!==''")
 rows['removedPendingHost']=p.evaluate("({detached:!removedHost.isConnected,targets:HonroSkillImages.status().targets,notReinserted:f.children.length===0,noDetachedSrc:!removedHost.querySelector('img').getAttribute('src')})")
 assert rows['removedPendingHost']=={'detached':True,'targets':0,'notReinserted':True,'noDetachedSrc':True},rows['removedPendingHost']
 assert not lateErrors,lateErrors;ctx.close();rows['browser']=b.version;b.close()
(OUT/'browser.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print(json.dumps(rows,ensure_ascii=False))
