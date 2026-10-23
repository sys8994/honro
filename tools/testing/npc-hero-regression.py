"""Actual browser RGBA comparison against aa4 portrait implementation (four heroes)."""
from pathlib import Path
import json,sys,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
rows=[]
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page();p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"')
 for phase in ['current','aa4']:
  if phase=='aa4':p.evaluate(subprocess.check_output(['git','show','aa4b7ab7:shared/runtime/portraits.js'],text=True))
  p.evaluate('''phase=>{window.compareCanvases=[];for(const [who,cls]of [['설오','archer'],['담허','mage'],['휘겸','knight'],['소단','occultist']])for(const purpose of ['dialogue','bust','icon']){const c=document.createElement('canvas');c.width=purpose==='icon'?88:400;c.height=purpose==='icon'?108:440;document.body.append(c);HonroPortraits.draw(c,null,cls,{identity:who,framing:purpose});compareCanvases.push({c,who,cls,purpose,phase});}}''',phase)
  p.wait_for_function('compareCanvases.every(x=>x.c.dataset.portraitState==="ready")');rows+=p.evaluate('''async()=>Promise.all(compareCanvases.map(async({c,who,purpose,phase})=>{const bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data,digest=await crypto.subtle.digest('SHA-256',bytes);return{who,purpose,phase,rgba:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};}))''')
 for x,y in zip(rows[:12],rows[12:]):assert x['who']==y['who']and x['purpose']==y['purpose']and x['rgba']==y['rgba'],(x,y)
 b.close()
(ROOT/'_local/reports/npc-plain-v2/hero-regression.json').write_text(json.dumps({'rows':rows,'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()},ensure_ascii=False,indent=2));print('PASS 4 heroes x dialogue/bust/icon: RGBA exact to aa4')
