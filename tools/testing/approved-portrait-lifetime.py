"""Real browser async ownership: stale completion, detached reuse and timeout.
Uses dialogue UI on the title's idle app; no campaign state/stat fixture edits.
"""
import json,sys,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/approved-portraits';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':1280,'height':800});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));held={}
 def hold(route):held[route.request.url.split('portrait-')[1].split('-base')[0]]=route
 p.route('**/portrait-seoro-base.*.webp',hold);p.route('**/portrait-hwigyeom-base.*.webp',hold);p.route('**/portrait-sodan-base.*.webp',hold)
 p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false')
 show="name=>HonroStory.start(HonroApp,[[name,'비동기 표시 수명 검수']],{title:'검수'})"
 p.evaluate(show,'설오');p.wait_for_function('HonroPortraits.stats().pending===1');p.evaluate('window.kept=document.getElementById("story-portrait-canvas")');p.evaluate(show,'담허');p.wait_for_function('document.getElementById("story-portrait-canvas").dataset.portraitState==="ready"');before=p.evaluate('kept.toDataURL()');held['seoro'].continue_();p.wait_for_function('HonroPortraits.stats().pending===0');after=p.evaluate('kept.toDataURL()');assert before==after and p.evaluate('kept===document.getElementById("story-portrait-canvas")');checks.append({'name':'old Seoro completion does not repaint current Damheo','passed':True})
 p.evaluate(show,'휘겸');p.wait_for_function('HonroPortraits.stats().pending===1');p.evaluate('HonroStory.finish(HonroApp)');assert not p.evaluate('kept.isConnected');held['hwigyeom'].continue_();p.wait_for_function('HonroPortraits.stats().pending===0');p.evaluate(show,'휘겸');p.wait_for_function('document.getElementById("story-portrait-canvas").dataset.portraitState==="ready"');assert p.evaluate('kept===document.getElementById("story-portrait-canvas")');checks.append({'name':'detached pending canvas paints ready asset exactly on remount','passed':True})
 p.evaluate(show,'소단');p.wait_for_function('HonroPortraits.stats().pending===1');p.wait_for_function('document.getElementById("story-portrait-canvas").dataset.portraitState==="error"',timeout=12000);stats=p.evaluate('HonroPortraits.stats()');assert stats['errors']==1 and stats['waiters']==0 and stats['requests']==4 and stats['decodes']==3,stats;checks.append({'name':'stalled image reaches bounded vector fallback without blocking app','passed':True,'stats':stats})
 held['sodan'].continue_();p.wait_for_timeout(400);late=p.evaluate('HonroPortraits.stats()');assert late['decodes']==stats['decodes'] and late['requests']==stats['requests'] and p.evaluate('document.getElementById("story-portrait-canvas").dataset.portraitState==="error"');checks.append({'name':'late completion after timeout never overwrites fallback/retries','passed':True})
 assert not errors,errors;b.close()
meta={'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'checks':checks,'errors':errors};(OUT/'lifetime.json').write_text(json.dumps(meta,indent=2));print(json.dumps(meta,indent=2))
