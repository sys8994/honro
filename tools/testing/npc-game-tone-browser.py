"""Nine approved replacements, actual dialogue UI, plus encoding fixtures only."""
from pathlib import Path
import sys,json,subprocess,base64
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/npc-game-tone-v3';OUT.mkdir(parents=True,exist_ok=True)
D=json.loads((ROOT/'shared/data/narrative-current.json').read_text());C=json.loads((ROOT/'game/config/npc-portraits.json').read_text());cases={}
def visit(x,stage):
 if isinstance(x,list):
  if len(x)>=3 and isinstance(x[0],str)and isinstance(x[1],str)and isinstance(x[2],dict):
   who,_,meta=x[:3];binding=C['rows'].get(meta.get('rowId'),{});asset=binding.get('asset')if binding.get('speaker')==who else C['named'].get(who)
   if asset in C['assets']and asset not in cases:cases[asset]={'stage':stage,'line':x}
  else:
   for v in x:visit(v,stage)
 elif isinstance(x,dict):
  for v in x.values():visit(v,stage)
for stage,content in D['stages'].items():visit(content,int(stage))
assert set(cases)==set(C['assets']),set(C['assets'])-set(cases)
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,31)})
def show(p,q):
 p.evaluate('''async q=>{const a=HonroApp;if(a.stage?.id!==q.stage||a.screen!=="battle"){await HonroCampaignLoader.ensureStage(q.stage);a.launch(q.stage);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);}HonroStory.start(a,[q.line,q.line],{title:a.stage.name,index:0});}''',q)
 p.wait_for_function('document.getElementById("story-portrait-canvas")?.dataset.portraitState==="ready"')
def snap(p):return p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),bytes=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return{state:c.dataset.portraitState,hasPixels:bytes.some((v,i)=>i%4===3&&v>0),topAlpha:Math.max(...Array.from(bytes.slice(0,c.width*4)).filter((v,i)=>i%4===3)),buttons:[...document.querySelectorAll('.story-scene button')].every(e=>{const r=e.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&(e.disabled||document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e)}),stats:HonroPortraits.stats()};}''')
rows=[];comparison=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');requests=[];errors=[];p.on('request',lambda q:requests.append(q.url)if'npc-portrait-'in q.url else None);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"');assert not requests
 for asset,q in cases.items():
  show(p,q)
  for w,h in [(390,844),(844,390)]+([(320,640)]if asset=='worker_mature'else[])+([(1280,800)]if asset=='keeper_ritual'else[]):
   p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(180);r=snap(p);assert r['hasPixels']and r['topAlpha']<=1 and r['buttons'],(asset,r);r.update(asset=asset,view=[w,h],rowId=q['line'][2].get('rowId'));rows.append(r);p.screenshot(path=str(OUT/(str(w)+'-'+asset+'.jpg')),type='jpeg',quality=93)
 assert len(set(requests))==9,(len(set(requests)),requests)
 # All candidates use the same approved master/row; no test art is registered.
 for asset in ['worker_mature','yeonsil','keeper_ritual']:
  for width,quality in [(512,94),(768,94),(768,'lossless')]:
   name='keeper'if asset=='keeper_ritual'else asset;src=base+'/_local/reports/npc-game-tone-v3/'+name+'-'+str(width)+'-'+str(quality)+'.webp'
   p.evaluate('''({id,width,src})=>{window.toneOriginal??={};const a=HONRO_NPC_PORTRAITS.assets[id];toneOriginal[id]??=structuredClone(a);Object.assign(a,structuredClone(toneOriginal[id]));const k=width/a.width;for(const box of[a.head,a.bust,a.framing.dialogue.face])for(const x in box)box[x]*=k;a.framing.dialogue.maxHeight*=k;a.width=width;a.height=width*1.5;a.src=src;}''',{'id':asset,'width':width,'src':src})
   p.set_viewport_size({'width':390,'height':844});show(p,cases[asset]);image=p.evaluate('document.getElementById("story-portrait-canvas").toDataURL().split(",")[1]');(OUT/(asset+'-'+str(width)+'-'+str(quality)+'-canvas.png')).write_bytes(base64.b64decode(image));p.screenshot(path=str(OUT/(asset+'-'+str(width)+'-'+str(quality)+'-ui.jpg')),type='jpeg',quality=94);comparison.append({'asset':asset,'width':width,'quality':quality})
  p.evaluate('id=>Object.assign(HONRO_NPC_PORTRAITS.assets[id],toneOriginal[id])',asset)
 show(p,cases['worker_mature']);repeat=p.evaluate('''()=>{const c=document.getElementById('story-portrait-canvas'),x=c.getContext('2d'),draw=x.drawImage,clear=x.clearRect;let paints=0,clears=0;x.drawImage=function(...a){paints++;return draw.apply(this,a)};x.clearRect=function(...a){clears++;return clear.apply(this,a)};const before=HonroPortraits.stats(),q=HonroApp.dialogue.lines[0],asset=HonroNPCPortraits.resolve(HonroApp,q[0],q[2]);for(let i=0;i<120;i++)HonroPortraits.draw(c,null,null,{npcAsset:asset,framing:'dialogue'});return{before,after:HonroPortraits.stats(),paints,clears};}''');assert repeat['before']==repeat['after']and repeat['paints']==repeat['clears']==0,repeat
 assert not errors,errors;b.close()
(OUT/'browser.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'condition':'HEAD plus v3 asset install and proportional source padding; resume-row display fixtures, no combat replay','rows':rows,'comparison':comparison,'repeat120':repeat,'errors':errors},ensure_ascii=False,indent=2));print('PASS nine identities /20 actual UI views, three encoding comparisons, cold title0 NPC /9 distinct production assets, repeat120 unchanged')
