from pathlib import Path
import sys,json,hashlib,subprocess
ROOT=Path.cwd();sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
out=ROOT/'_local/reports';profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,13)});checks=[]
def check(n,v):assert v,n;checks.append(n)
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');check('title no approved image preload',p.evaluate('HonroPortraits.stats().requests===0'))
 p.evaluate('HonroApp.launch(1,true,"A01")');p.wait_for_function('HonroApp.training');p.evaluate('HonroTraining.open(HonroApp)');p.wait_for_function('HonroPortraits.stats().pending===0&&HonroPortraits.stats().decodes===4');check('training4 ready shared bust',p.evaluate('[...document.querySelectorAll(".training-heroes canvas")].length===4&&[...document.querySelectorAll(".training-heroes canvas")].every(c=>c.dataset.portraitState==="ready"&&c.dataset.portraitFraming==="bust")'))
 p.evaluate('HonroApp.close();HonroApp.showCamp("mage")');check('camp5 ready shared bust',p.evaluate('[...document.querySelectorAll(".hero-tabs canvas,.summary-identity canvas")].length===5&&[...document.querySelectorAll(".hero-tabs canvas,.summary-identity canvas")].every(c=>c.dataset.portraitState==="ready")'))
 p.evaluate('HonroApp.launch(13)');p.wait_for_function('HonroApp.engine?.b.honroStage===13');p.evaluate('()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);const s=HonroApp.stage,lines=[...(s.story||[]),...Object.values(s.beats||{}).flat(),...(s.outro||[])],line=lines.find(l=>l[0]==="담허");HonroStory.start(HonroApp,[["담허",line[1].repeat(35)],line.slice(0,2)],{title:s.name});}')
 for w,h in [(390,844),(844,390)]:
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(220)
  for at in [0,.5,1]:
   ok=p.evaluate('''at=>{const p=document.querySelector('#story-line'),a=document.querySelector('.story-actions');p.scrollTop=(p.scrollHeight-p.clientHeight)*at;const r=p.getBoundingClientRect(),b=a.getBoundingClientRect();return r.bottom<=b.top+1&&getComputedStyle(a).backgroundColor==='rgba(0, 0, 0, 0)'&&[...a.querySelectorAll('button')].every(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&(e.disabled||document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e);});}''',at);check(str(w)+' text above transparent controls '+str(at),ok)
 p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('HonroApp.dialogue.index===1');p.locator('[data-action="dialogue-prev"]').tap();p.wait_for_function('HonroApp.dialogue.index===0');check('back/next after live resize',True)
 check('same4 request/decode cache',p.evaluate('HonroPortraits.stats().requests===4&&HonroPortraits.stats().decodes===4'));check('no browser errors',not errors);b.close()
(out/'dialogue-row-o05-smoke.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'checks':checks,'errors':errors},ensure_ascii=False,indent=2));print('PASS final merged UI smoke',len(checks))
