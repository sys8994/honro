#!/usr/bin/env python3
"""Isolated UI key timing diagnostic; no game state writes or completion claims."""
import argparse, hashlib, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--profile',required=True);p.add_argument('--out',required=True);a=p.parse_args();raw=Path(a.profile).read_bytes();sha=hashlib.sha256(raw).hexdigest();assert sha=='c3724ff6ff7e2417489147457c0956c1642af3907b8b5bd923b4843c41675f6f'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.goto(a.url);page.wait_for_function('window.HonroApp&&window.HonroCampaignLoader');page.locator('#file-import').set_input_files(str(Path(a.profile).resolve()));page.wait_for_timeout(5000);page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function("HonroApp.engine?.b?.honroStage===40&&HonroApp.canInput()",timeout=60000)
 page.evaluate('''()=>{window.__chargeKeyEvents=[];for(const type of ['keydown','keyup'])document.addEventListener(type,e=>{if(e.code==='Space')window.__chargeKeyEvents.push({type,t:performance.now(),trusted:e.isTrusted})},true)}''')
 rows=[]
 for duration in (120,250,400):
  actor=page.evaluate('()=>HonroApp.engine.active.id');start=time.monotonic();page.keyboard.down('Space');page.wait_for_timeout(duration);page.keyboard.up('Space');elapsed=(time.monotonic()-start)*1000
  page.wait_for_function('(id)=>!!HonroApp.engine.b.lastShots?.[id]',arg=actor,timeout=20000)
  row=page.evaluate('(id)=>({shot:HonroApp.engine.b.lastShots[id],events:window.__chargeKeyEvents.slice(-2)})',actor);row.update(actor=actor,requestedMs=duration,hostElapsedMs=elapsed);rows.append(row)
  page.wait_for_function('(id)=>HonroApp.engine.active?.id!==id&&HonroApp.canInput()',arg=actor,timeout=60000)
 Path(a.out).write_text(json.dumps({'inputSha256':sha,'rows':rows,'scope':'isolated normal key input diagnostic; not gameplay completion'},ensure_ascii=False,indent=2)+'\n');print(Path(a.out).read_text());ctx.close();b.close()
