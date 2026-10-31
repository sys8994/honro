#!/usr/bin/env python3
"""Import immutable RC5 clear into a new Chromium context; no state injection."""
import base64, hashlib, json, lzma, pathlib
from playwright.sync_api import sync_playwright
R=pathlib.Path(__file__).resolve().parents[2]; D=R/'tools/qa-stage35-fullplay/evidence/rc5'; O=R/'_local/reports/stage35-rc5-latest'; O.mkdir(parents=True,exist_ok=True)
src=next(D.glob('007-*.raw.xz.b64')); raw=lzma.decompress(base64.b64decode(src.read_bytes())); sha=hashlib.sha256(raw).hexdigest();assert sha=='67ea8ae574a4a0dd8bc50a6125f1d7db7aaa3334bd16782a342ba8540f6e7f60';original=json.loads(raw);path=O/'original-clear.json';path.write_bytes(raw)
log={'sourceCommit':'4ebe01b0bde5438782a7bd37e5dffdf89984f8ba','originalRawSha256':sha,'context':'new isolated context; original RC5 context was closed','steps':[],'errors':[]}
def proj(p):
 return p.evaluate('''()=>{const a=HonroApp,p=a.profile,b=a.engine?.b;return {screen:a.screen,last:p.lastStage,clear:p.cleared['35'],proof:p.honroAct4,equipment:p.equipment,heroes:p.heroes,loadouts:p.loadouts,pendingDirect:p.honroJourney?.pendingDirect,battleStage:b?.honroStage,savedStage:p.honroBattle?.honroStage,round:b?.round,phase:b?.phase,units:b?.units?.map(u=>({id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),dialogue:!!a.dialogue}}''')
def check(x):
 assert x['clear']==original['cleared']['35'] and x['proof']==original['honroAct4']; assert x['heroes']==original['heroes'] and x['loadouts']==original['loadouts'];q=x['equipment'];assert q['ownedItemIds'].count('itm_co_15')==1 and len(q['ownedItemIds'])==len(set(q['ownedItemIds'])); assert q['rewardLedger']['eq_co_t3_choice']['state']=='committed' and q['rewardLedger']['eq_co_t3_choice']['selectedItemId']=='itm_co_15'
def close_dialogue(p):
 for _ in range(15):
  if not p.evaluate('!!HonroApp.dialogue'):break
  p.keyboard.press('Enter');p.wait_for_timeout(600)
 p.wait_for_timeout(800)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']); c=b.new_context(viewport={'width':1440,'height':900});p=c.new_page();p.on('pageerror',lambda e:log['errors'].append(str(e)))
 p.goto('http://127.0.0.1:8793/HONRO.html');p.wait_for_function('window.HonroApp');p.locator('#file-import').set_input_files(str(path));p.wait_for_timeout(2000);x=proj(p)
 assert x['clear']==original['cleared']['35'] and x['proof']==original['honroAct4'] and x['heroes']==original['heroes'] and x['loadouts']==original['loadouts'] and x['equipment']==original['equipment'] and x['pendingDirect']==36
 log['steps'].append({'step':'ui-import-original','state':x});p.screenshot(path=str(O/'01-import.png'))
 p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===36',timeout=60000);p.wait_for_timeout(1500);close_dialogue(p);x=proj(p);assert x['battleStage']==36 and x['round']==1 and x['equipment']['rewardLedger']['eq_co_t3_choice']['state']=='pending';log['steps'].append({'step':'actual-entry-36','state':x});p.screenshot(path=str(O/'02-stage36-pending.png'))
 p.get_by_text('보상 고르기 · 1',exact=True).click();p.get_by_text('묵향 부적집',exact=True).click();p.screenshot(path=str(O/'03-choice.png'));p.get_by_text('선택 확정',exact=True).click();p.wait_for_timeout(1200);x=proj(p);check(x);log['steps'].append({'step':'ui-choice-committed','state':x});p.screenshot(path=str(O/'04-reward.png'))
 saved=p.evaluate("localStorage.getItem('honro-first-act-profile-1')"); savedpath=O/'post-choice-actual-storage.json';savedpath.write_text(saved); log['postChoiceRawSha256']=hashlib.sha256(saved.encode()).hexdigest();sp=json.loads(saved);assert sp['equipment']['rewardLedger']['eq_co_t3_choice']['selectedItemId']=='itm_co_15' and sp['honroBattle']['honroStage']==36
 before=proj(p);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===36',timeout=60000);p.wait_for_timeout(1500);close_dialogue(p);x=proj(p);check(x);assert x['battleStage']==36 and x['round']==before['round'] and x['units']==before['units'] and x['equipment']==before['equipment'];log['steps'].append({'step':'same-new-context-reload-continue','state':x});p.screenshot(path=str(O/'05-reloaded.png'))
 # Normal movement confirms continued input in the restored run.
 assert p.evaluate('HonroApp.canInput()');u=p.evaluate('HonroApp.engine.active.x');p.keyboard.down('ArrowRight');p.wait_for_timeout(500);p.keyboard.up('ArrowRight');p.wait_for_timeout(700);v=p.evaluate('HonroApp.engine.active.x');assert v>u;log['movement']={'beforeX':u,'afterX':v}
 # A second, independent context imports the real post-choice storage via the UI.
 c2=b.new_context(viewport={'width':1440,'height':900});q=c2.new_page();q.on('pageerror',lambda e:log['errors'].append(str(e)));q.goto('http://127.0.0.1:8793/HONRO.html');q.wait_for_function('window.HonroApp');q.locator('#file-import').set_input_files(str(savedpath));q.wait_for_timeout(1800);z=proj(q);check(z);assert z['savedStage']==36;log['steps'].append({'step':'separate-context-ui-import-committed','state':z});q.reload();q.wait_for_function('window.HonroApp');q.get_by_text('이어서 걷기',exact=True).click();q.wait_for_function('HonroApp.engine?.b?.honroStage===36',timeout=60000);q.wait_for_timeout(1500);close_dialogue(q);z=proj(q);check(z);assert z['battleStage']==36;log['steps'].append({'step':'separate-context-reload-continue','state':z});q.screenshot(path=str(O/'06-separate-resume.png'));assert not log['errors'];assert hashlib.sha256(path.read_bytes()).hexdigest()==sha
 c2.close();c.close();b.close()
(O/'result.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'ok':True,'steps':[v['step'] for v in log['steps']],'originalSha':sha,'postChoiceSha':log['postChoiceRawSha256'],'movement':log['movement'],'errors':log['errors']},ensure_ascii=False))
