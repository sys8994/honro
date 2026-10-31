#!/usr/bin/env python3
"""Disposable Chromium diagnostic: one deliberate reward write failure, UI kill and reload.
Seed is the exact saved round-10 battle recorded in STAGE36-37-PLAY-STATUS.md.
Never run this fault injector against a real player profile or production build.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,hashlib,os
root=Path(os.environ['HONRO_RUN_DIR']);root.mkdir(parents=True,exist_ok=True);raw=Path(os.environ['HONRO_FAULT_SEED']).read_text();assert hashlib.sha256(raw.encode()).hexdigest()=='f8f6342892d32594824e23fe4472f4c686c65376a629cdf6e94eb1856f5f3894', 'Use the recorded round-10 diagnostic seed' 
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8771')+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate("v=>localStorage.setItem('honro-first-act-profile-1',v)",raw);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===36');p.wait_for_timeout(1000)
 p.evaluate('''()=>{const original=Storage.prototype.setItem;window.qaWriteFault={attempts:0};Storage.prototype.setItem=function(k,v){if(k==='honro-first-act-profile-1'){let z;try{z=JSON.parse(v)}catch{};if(z?.equipment?.rewardLedger?.eq_hw_t3b?.state==='committed'&&!window.qaWriteFault.attempts){window.qaWriteFault.attempts++;Storage.prototype.setItem=original;throw new DOMException('QA injected write failure','QuotaExceededError');}}return original.call(this,k,v)}}''')
 p.keyboard.press('Control');p.keyboard.down('d');p.wait_for_timeout(900);p.keyboard.up('d');p.wait_for_function("()=>HonroApp.engine.grounded(HonroApp.engine.active)",timeout=10000);p.wait_for_timeout(1500);p.keyboard.press('2');p.keyboard.down('Space');p.wait_for_timeout(500);p.keyboard.up('Space')
 p.wait_for_function("()=>window.qaWriteFault.attempts===1&&HonroApp.engine.b.units.find(u=>u.id==='a4-36-b-1').dead&&HonroApp.profile.equipment.rewardLedger.eq_hw_t3b?.state==='committed'",timeout=30000);p.wait_for_timeout(1000)
 def inspect():return p.evaluate("""()=>{let a=HonroApp,b=a.engine.b,p=a.profile,t=b.units.find(x=>x.id==='a4-36-b-1');return {round:b.round,target:{hp:t.hp,dead:t.dead},ledger:p.equipment.rewardLedger.eq_hw_t3b,count:p.equipment.ownedItemIds.filter(x=>x==='itm_hw_06').length,facts:b.honroAct4FactEvents}}""")
 before=inspect();print('FAULT',p.evaluate('()=>window.qaWriteFault'),flush=True);print('BEFORE',json.dumps(before),flush=True);saved=p.evaluate("()=>localStorage.getItem('honro-first-act-profile-1')");(root/'fault-retry-before-reload.json').write_text(saved);print('RAW_SHA256',hashlib.sha256(saved.encode()).hexdigest(),flush=True)
 p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===36');p.wait_for_timeout(1000);after=inspect();print('AFTER',json.dumps(after),flush=True);assert before==after,(before,after);assert after['count']==1;print('FAULT_RETRY_SAME_CONTEXT_RELOAD_PASS',flush=True);b.close()
