#!/usr/bin/env python3
"""Reproduce exact 40 profile UI import failure; preloading is diagnostic only."""
import argparse, hashlib, json
from pathlib import Path
from playwright.sync_api import sync_playwright
EXPECTED='c3724ff6ff7e2417489147457c0956c1642af3907b8b5bd923b4843c41675f6f'
ap=argparse.ArgumentParser();ap.add_argument('--profile',required=True);ap.add_argument('--out',required=True);ap.add_argument('--url',default='http://127.0.0.1:8772/HONRO.html');o=ap.parse_args()
source=Path(o.profile).resolve();data=source.read_bytes();sha=hashlib.sha256(data).hexdigest()
if sha!=EXPECTED:raise SystemExit('unexpected profile SHA-256: '+sha)
out=Path(o.out).resolve();out.mkdir(parents=True,exist_ok=False)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':900});p=ctx.new_page();p.goto(o.url);p.wait_for_function('window.HonroApp&&window.HonroCampaignLoader')
 before=p.evaluate("()=>({revision:HonroCampaignMapRevision.current(40),library:HONRO_PROJECT.library.length,hasBody:HONRO_PROJECT.library.some(a=>a.id==='approved40:body')})")
 p.locator('#file-import').set_input_files(str(source));p.wait_for_timeout(4000);p.screenshot(path=str(out/'ui-import.png'))
 actual=p.evaluate("()=>({notice:document.querySelector('#notice')?.innerText,store:HonroApp.profileStore.state,hasStorage:localStorage.getItem('honro-first-act-profile-1')!==null,screen:HonroApp.screen})")
 # Pure inspection of the original input and compaction result. No write/import on this branch.
 def inspect():return p.evaluate('''s=>{let p=JSON.parse(s),c=HonroProfileStore.compactBattleArt(p.honroBattle);return {library:HONRO_PROJECT.library.length,hasBody:HONRO_PROJECT.library.some(a=>a.id==='approved40:body'),chars:JSON.stringify({...p,honroBattle:c}).length,refs:[...(c.honroLandmarks||[]),...(c.honroElements||[])].filter(v=>v.asset?.honroStaticAssetRef===1).length}}''',data.decode())
 compact_before=inspect();p.evaluate('async()=>await HonroCampaignLoader.ensureStage(40)');compact_after=inspect()
 result={'scope':'unmodified real UI import; subsequent ensureStage is isolated read-only diagnosis and is not a successful UI import','sourceSha256':sha,'inputBytes':len(data),'titleProvider':before,'actualUI':actual,'compactBefore':compact_before,'compactAfterDiagnosticLoad':compact_after}
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False),flush=True);ctx.close();browser.close()
