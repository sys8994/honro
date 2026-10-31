#!/usr/bin/env python3
"""Import an unmodified UI export; verify post-win page.reload in that context."""
import argparse, hashlib, json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--profile',required=True);p.add_argument('--sha256',required=True);p.add_argument('--out',required=True);a=p.parse_args()
data=Path(a.profile).read_bytes(); assert hashlib.sha256(data).hexdigest()==a.sha256
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=b.new_context(viewport={'width':1440,'height':900});page=ctx.new_page()
 page.goto(a.url,wait_until='domcontentloaded');page.wait_for_function('window.HonroApp&&window.HonroCampaignLoader',timeout=60000)
 page.locator('#file-import').set_input_files(str(Path(a.profile).resolve()));page.wait_for_timeout(4000)
 def snapshot():return page.evaluate('''()=>{let p=HonroApp.profile;return {cleared:p.cleared,heroes:p.heroes,equipment:p.equipment,act4:p.honroAct4,progress:p.honroProgress,screen:HonroApp.screen,body:document.body.innerText}}''')
 def cont():
  label='이어서 걷기' if page.get_by_text('이어서 걷기',exact=True).count() else '여정 이어가기'
  page.get_by_text(label,exact=True).click();page.wait_for_function("HonroApp.screen==='rest'",timeout=60000);page.wait_for_timeout(1000)
 cont();before=snapshot();assert '다음 여정은 준비 중입니다' in before['body'];assert before['cleared']['40']['rounds']==21
 page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp&&window.HonroCampaignLoader',timeout=60000);cont();after=snapshot()
 for k in ('cleared','heroes','equipment','act4','progress'):assert before[k]==after[k],k
 assert '다음 여정은 준비 중입니다' in after['body']
 Path(a.out).write_text(json.dumps({'result':'passed','inputSha256':a.sha256,'screen':after['screen'],'stage40':after['cleared']['40'],'body':after['body'],'compared':['cleared','heroes','equipment','act4','progress']},ensure_ascii=False,indent=2)+'\n')
 print(Path(a.out).read_text());ctx.close();b.close()
