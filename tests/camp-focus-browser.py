"""Camp-only focus restoration under real App frames; progression is an isolated fixture."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/camp-focus';OUT.mkdir(parents=True,exist_ok=True)
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate("()=>{const a=HonroApp;a.profile.recruited=['archer','mage','knight','occultist'];for(const h of Object.values(a.profile.heroes))h.xp=HONRO_CORE.xpAtLevel(30);a.close();a.showCamp('archer');window.focusRestores=[];const f=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(o){if(o?.preventScroll)focusRestores.push(this.dataset.action);return f.call(this,o)}}")
 p.wait_for_function('HonroSkillImages.status().cached===84&&HonroSkillImages.status().active===0&&HonroSkillImages.status().queued===0')
 plus=p.locator('[data-action=rank-plus][data-skill=A14]');plus.focus();p.evaluate("()=>{window.plus=document.activeElement;window.imageBefore=HonroSkillImages.status();document.getElementById('armory').scrollTop=120;window.scrollBefore=document.getElementById('armory').scrollTop}")
 p.keyboard.press('Enter');p.keyboard.press('Enter')
 rows={'enterTwice':p.evaluate("({rank:HonroApp.profile.heroes.archer.ranks.A14,same:document.activeElement===plus,connected:plus.isConnected,scroll:document.getElementById('armory').scrollTop===scrollBefore})")};assert rows['enterTwice']=={'rank':2,'same':True,'connected':True,'scroll':True},rows
 p.evaluate("HonroApp.profile.heroes.archer.ranks.A14=7;HonroApp.showCamp('archer')");p.keyboard.press('Enter')
 rows['cap']=p.evaluate("({rank:HonroApp.profile.heroes.archer.ranks.A14,disabled:plus.disabled,local:document.activeElement.dataset.action==='rank-minus'&&document.activeElement.dataset.skill==='A14'})");assert rows['cap']=={'rank':8,'disabled':True,'local':True},rows['cap']
 prep=p.evaluate("()=>{const a=HonroApp,C=HONRO_CORE,h=a.profile.heroes.archer=C.defaults().heroes.archer;h.xp=C.xpAtLevel(30);C.autoTrain(h,'archer');const before=C.pointsLeft(h,'archer'),ok=C.untrain(h,'A14');a.showCamp('archer');return{before,ok,sp:C.pointsLeft(h,'archer')}}");assert prep=={'before':0,'ok':True,'sp':1},prep
 p.locator('[data-action=invest-stat]').focus();p.keyboard.press('Enter')
 rows['spExhaustion']=p.evaluate("({sp:HONRO_CORE.pointsLeft(HonroApp.profile.heroes.archer,'archer'),disabled:document.querySelector('[data-action=invest-stat]').disabled,local:document.activeElement.dataset.action==='refund-stat'})");assert rows['spExhaustion']=={'sp':0,'disabled':True,'local':True},rows['spExhaustion']
 p.locator('[data-action=branch][data-id="1"]').click();assert p.evaluate("document.activeElement===document.querySelector('[data-action=branch][data-id=\"1\"]')&&HonroApp.branch===1")
 p.locator('[data-action=hero][data-class=mage]').click();assert p.evaluate("document.activeElement===document.querySelector('[data-action=hero][data-class=mage]')&&HonroApp.cls==='mage'")
 rows['branchHeroRetained']=True
 talent=p.locator('.tree-node[data-skill]:visible').first;talent.focus();p.evaluate('window.talentFocus=document.activeElement');talent.click();p.wait_for_selector('#modal.open')
 p.evaluate("()=>{window.modalFocus=document.querySelector('#modal button');modalFocus.focus();HonroCampRenderer.patch(HonroApp.root,HonroApp.root.innerHTML)}")
 assert p.evaluate('document.activeElement===modalFocus');p.locator('#modal [data-action=close]').first.click();assert p.evaluate('document.activeElement===talentFocus')
 p.evaluate('HonroApp.showCamp()');assert p.evaluate('document.activeElement===talentFocus');rows['modalNotStolenAndReturn']=True
 rows['localFixtures']=p.evaluate("""()=>{const root=document.createElement('div');document.body.append(root);const html=(mode='')=>`<main class="camp-screen"><div class="node-stepper"><button data-action="minus">minus</button>${mode==='removed'?'':`<button data-action="plus" ${mode==='disabled'?'disabled':''} ${mode==='hidden'?'hidden':''}>plus</button>`}</div></main>`;const result={};for(const mode of ['disabled','hidden','removed']){HonroCampRenderer.patch(root,html());root.querySelector('[data-action=plus]').focus();const minus=root.querySelector('[data-action=minus]');HonroCampRenderer.patch(root,html(mode));result[mode]=document.activeElement===minus;}root.remove();return result;}""");assert all(rows['localFixtures'].values()),rows['localFixtures']
 rows['images']=p.evaluate("({requests:HonroSkillImages.status().requests-imageBefore.requests,decodes:HonroSkillImages.status().decodes-imageBefore.decodes})");assert rows['images']=={'requests':0,'decodes':0},rows['images']
 rows['preventScrollRestores']=p.evaluate('focusRestores.length');assert rows['preventScrollRestores']>0
 p.screenshot(path=str(OUT/'camp-focus-mobile.jpg'),type='jpeg',quality=80);assert not errors,errors;rows['errors']=errors;rows['browser']=b.version;b.close()
(OUT/'browser.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print(json.dumps(rows,ensure_ascii=False))
