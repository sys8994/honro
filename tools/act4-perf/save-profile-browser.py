"""Measure normal movement autosave and render overlap in a single QA browser."""
import json, math, os, subprocess, time
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile']
f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,40)}
f.update(lastStage=40,mapNode=40);f.pop('honroBattle',None)
out=root/'_local/act4-perf';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);c=b.new_context(viewport={'width':1440,'height':900},device_scale_factor=1);p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(f,ensure_ascii=False))+');')
 p.goto('http://127.0.0.1:8770/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000)
 p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(40);HonroApp.launch(40)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===40',timeout=90000)
 for i in range(30):
  if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');p.wait_for_timeout(250)
  else:
   p.wait_for_timeout(500)
   if not p.evaluate('!!HonroApp.dialogue'):break
 p.evaluate('''()=>{window.qa={events:[],frames:[],active:false};const app=HonroApp;let phase='';const wrap=(obj,key,label)=>{const f=obj[key];obj[key]=function(...a){const start=performance.now(),prev=phase;phase=label;try{return f.apply(this,a)}finally{qa.events.push({label,start,duration:performance.now()-start,parent:prev});phase=prev}}};wrap(app,'flushBattleSave','flush');wrap(app,'persist','persist');wrap(HonroProfileStore,'compactBattleArt','compact-public');wrap(HonroScene.prototype,'render','render');for(const key of ['stringify','parse']){const f=JSON[key];JSON[key]=function(...a){const start=performance.now();try{return f.apply(this,a)}finally{if(phase==='flush'||phase==='persist')qa.events.push({label:key,start,duration:performance.now()-start,parent:phase,chars:typeof a[0]==='string'?a[0].length:undefined,stack:performance.now()-start>20?(new Error()).stack:undefined})}}}qa.active=true;let last=null;requestAnimationFrame(function tick(t){if(!qa.active)return;if(last!==null)qa.frames.push({start:last,duration:t-last});last=t;requestAnimationFrame(tick)})}''')
 p.keyboard.down('ArrowRight');p.wait_for_timeout(9000);p.keyboard.up('ArrowRight');p.wait_for_timeout(1500)
 result=p.evaluate('''()=>{qa.active=false;return {...qa,stage:HonroApp.engine?.b?.honroStage,screen:HonroApp.screen,dialogue:!!HonroApp.dialogue,rawChars:JSON.stringify(HonroApp.profile.honroBattle).length,storedChars:localStorage.getItem('honro-first-act-profile-1')?.length}}''')
 result['equivalence']=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,key='honro-first-act-profile-1';HonroProgression.syncRoster(a.profile,b);a.profile.honroBattle=JSON.parse(JSON.stringify(b));a.persist();const old=localStorage.getItem(key);a.dirty=true;a.flushBattleSave();const now=localStorage.getItem(key);return {sameStoredBytes:old===now,oldLength:old.length,newLength:now.length,reader:b.honroAct4PreviewState?.reader||null}}''')
 result['exportProbe']=p.evaluate('''()=>{const a=HonroApp,fn=a.downloadProfile;let text;try{a.downloadProfile=s=>{text=s};a.export()}finally{a.downloadProfile=fn}const saved=JSON.parse(text),raw=JSON.stringify(a.engine.b);return {matchesBattle:JSON.stringify(saved.honroBattle)===raw,chars:text.length,hasRefs:text.includes('honroStaticAssetRef')}}''')
 result['compactProbe']=p.evaluate('''()=>{const b=HonroApp.engine.b,raw=JSON.stringify(b),t=performance.now(),compact=HonroProfileStore.compactBattleArt(b),compactMs=performance.now()-t,t2=performance.now(),copy=JSON.parse(JSON.stringify(compact)),cloneMs=performance.now()-t2,t3=performance.now(),restored=HonroProfileStore.restoreBattleArt(copy),restoreMs=performance.now()-t3;return {compactMs,cloneMs,restoreMs,restored,sameRaw:JSON.stringify(copy)===raw,compactChars:JSON.stringify(compact).length}}''')
 result['signatureProbe']=p.evaluate('''()=>{const b=HonroApp.engine.b,library=new Map(HONRO_PROJECT.library.map(a=>[a.id,a])),ids=new Set();for(const list of [b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements])for(const item of list||[])if(item.asset?.vector&&library.has(item.asset.id))ids.add(item.asset.id);const rows=[];for(const id of ids){const text=JSON.stringify(library.get(id));let h=2166136261,t=performance.now();for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}rows.push({id,chars:text.length,ms:performance.now()-t,signature:text.length+':'+(h>>>0).toString(16)})}return rows}''')
 result.update(errors=errors,scope='synthetic 40 entry; actual keyboard movement and live App frame; headless Chromium; nested durations not additive',host={'loadavg':os.getloadavg(),'meminfo':Path('/proc/meminfo').read_text().splitlines()[:3],'chromiumProcesses':int(subprocess.check_output("pgrep -c chromium || true",shell=True,text=True).strip() or 0),'cpuCount':len(os.sched_getaffinity(0)),'chromiumLive':sum(not x.startswith('Z') for x in subprocess.check_output(['ps','-C','chromium','-o','stat='],text=True).splitlines())})
 (out/'save-profile-40.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ('events','frames')}));print('events',len(result['events']),'frames',len(result['frames']))
 c.close();b.close()
