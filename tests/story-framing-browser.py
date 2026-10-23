"""Enumerate authored battle sequences and capture every displayed page.
Positions/progress are inspection fixtures, never a normal campaign playthrough.
"""
import sys,json,html,os,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT
SOURCE=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
OUT=ROOT/'_local/reports/story-framing';OUT.mkdir(parents=True,exist_ok=True)
CATALOG=r'''()=>{const a=HonroApp,b=a.engine.b,st=a.stage,seq=[];
 const add=(key,lines,options={})=>{if(lines?.length)seq.push({key,lines:JSON.parse(JSON.stringify(lines)),options});};
 add('entry',a.dialogue?.lines||[],{title:st.name,after:'entry',compiled:true,staging:a.dialogue?.staging});
 for(const [i,q]of (b.honroState.deferredStory||[]).entries())add('deferred-'+i,q.lines,{title:st.name});
 add('outcome',st.outro,{title:st.name,after:'outcome'});
 for(const ev of b.honroEvents||[]){const lines=HonroStoryContent.eventLines(a,ev);add('event-'+ev.id,lines.length?lines:ev.text?[['서술',ev.text,{kind:'narration',eventSource:'encounter:'+ev.id}]]:[],{title:st.name});}
 for(const [id,lines]of Object.entries(st.beats||{}))add('beat-'+id,lines.map(([w,t,m={}])=>[w,t,{...m,storyId:`act${st.act}-${st.id}-${id}`,storyTitle:st.name,...(st.act===3?{evidenceGoal:id}:{})}]),{title:st.name});
 const walk=(v,path)=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)&&v.length&&v.every(l=>Array.isArray(l)&&typeof l[0]==='string'&&typeof l[1]==='string')){add(path,v,{title:st.name});return;}for(const [k,x]of Object.entries(v))walk(x,path+'-'+k);};
 walk(st.storyFollowups,'followup');walk(b.honroEntryVariant,'entry-variant');walk(b.honroRouteSpec,'route');
 const map=HONRO_PROJECT.stages.find(m=>m.metadata.stageId===st.id);walk(map?.interactions,'map-interaction');walk(map?.initialState?.honroEntryVariants,'authored-entry-variant');
 for(const m of b.honroMarkers||[])if(['ledger','ritual','receiver','rescue'].includes(m.action))for(const count of m.action==='receiver'?[1,2]:[0]){const old=b.honroState.receivers;b.honroState.receivers=count;add('interaction-'+m.id+'-'+count,HonroStoryContent.interaction(a,m),{title:st.name});b.honroState.receivers=old;}
 if(st.id===10)for(const name of ['cooperation','cooperationDefense','finaleMidpoint'])add(name,HonroStoryContent[name](),{title:st.name});
 const ids=HonroStoryStaging.list().filter(d=>d.stage===st.id).map(d=>d.id);
 for(const id of ids){const def=HonroStoryStaging.describe(id);if(def&&!HonroStoryStaging.matchesSplit(b,def)){seq.push({key:'staging-'+id,lines:[],options:{},excluded:'incompatible split version',requiredVersion:def.requireSplit,currentVersion:b.honroSplit?.version});continue;}if(def)add('staging-'+id,[['서술',def.title,{stagingRequest:{id,context:{marker:b.honroMarkers.find(m=>m.action==='receiver')?.id}}}]],{title:def.title});}
 if(st.id===18)for(const status of ['suspended','settled'])add('bell-anomaly-'+status,HonroBellAnomaly.lines.map(([w,t])=>[w,status==='settled'?t.replace('우선 저 종부터 안전하게 내려야 해.','우선 남은 혼부터 살펴야 해.'):t,{storyId:'bell-anomaly-18',source:'bell-anomaly',storyTitle:'묵종 곁의 빈자리'}]),{title:'묵종 곁의 빈자리'});
 if(st.id===27)add('void-return',HonroAct3Void.returnLines.map(([w,t])=>[w,t,{storyId:HonroAct3Void.KEY+'-return',storyTitle:st.name}]),{title:st.name});
 if([11,18].includes(st.id)){const saved=JSON.stringify(a.engine.b),profile=JSON.stringify(a.profile),dialogue=a.dialogue;
  for(const mode of st.id===11?['manifest','soul-only']:['lamp']){a.engine.b=JSON.parse(saved);a.profile=JSON.parse(profile);a.dialogue=null;delete a.profile.seen['act2:first-spirit-encounter'];const test=a.engine.b,lamps=test.honroMarkers.filter(m=>m.id?.startsWith('spirit-lamp')&&m.action==='act2'),spirits=test.units.filter(u=>u.honroSpirit&&!u.dead),spirit=mode==='lamp'?spirits.sort((a,b)=>Math.min(...lamps.map(m=>Math.hypot(a.x-m.x,a.y-m.y)))-Math.min(...lamps.map(m=>Math.hypot(b.x-m.x,b.y-m.y))))[0]:spirits[0],sodan=test.units.find(u=>u.cls==='occultist'&&u.side===0),u=a.engine.active;if(!spirit||!sodan)continue;u.x=spirit.x-100;u.y=spirit.y;sodan.loadout=mode==='manifest'?['O01','O08']:['O01'];sodan.focus=999;if(mode==='soul-only')test.honroMarkers=test.honroMarkers.filter(m=>!m.id?.startsWith('spirit-lamp'));HonroAct2.tick(a,0);const lines=[...(test.honroState.storyQueue||[]),...(a.dialogue?.lines||[])].filter(l=>l[2]?.storyId==='act2:first-spirit-encounter');add('first-spirit-'+mode,lines,{title:'첫 혼령의 기척'});}
  a.engine.b=JSON.parse(saved);a.profile=JSON.parse(profile);a.dialogue=dialogue;}
 const narrative={2:[['escort-handoff','남은 호위가 상여채를 이어받았다.'],['escort-road-cleared','호위대가 길을 막은 뿌리를 잘라냈다.']],5:[['ritual-held','담허가 받이진을 유지한다.'],['ritual-released','담허가 물길진에서 벗어나 낙수가 다시 화살을 쓸어 내린다.']],6:[['refugee-following','뒤처진 피란민이 일행을 따라오기 시작한다.']],10:[['sodan-binding-loosened','바깥 주박이 느슨해졌다. 소단이 양옆 진을 살핀다.']],11:[['resident-shelters','분리된 주민이 가까운 짐 뒤로 몸을 피합니다.']],12:[['quarry-gate-open','길표 뒤의 내리막이 이어졌다. 동굴까지 돌아 나올 수 있다.']],15:[['drain-revealed','물이 빠진 바위 가장자리가 드러났다. 아래 물길로 걸어갈 수 있다.']],17:[['brace-restored','낙석을 치웠다. 인양축에 다시 접근할 수 있다.'],['quarry-collapse','버팀목 없이 돌이 무너졌다. 안전 지지대를 세우고 낙석을 치워야 한다.']],18:[['bell-settled','대종이 받침에 멎었다. 아래 귀환길과 동쪽 측면길이 열려 있다.']],19:[['soul-released','혼이 임시 그릇을 떠나 바깥 길로 흘러간다.']],23:[['cargo-settled','큰 화물묶음이 낮은 턱에 멎었다. 위 창고의 사선과 아래 엄폐가 바뀌었다.']],30:[['ferry-settled','배가 여울에 멎었다. 낮은 퇴로로도 돌아갈 수 있다.']]};
 for(const [source,text]of narrative[st.id]||[])add('narration-'+source,[['서술',text,{kind:'narration',eventSource:source}]],{title:st.name});
 for(const step of st.steps||[])if(!st.beats?.[step.id]?.length)add('objective-'+step.id,[['서술',step.label+' · 완료',{kind:'narration',eventSource:'objective:'+step.id}]],{title:st.name});
 for(const m of b.honroMarkers||[])if(m.type==='relic')add('narration-relic-'+m.id,[['서술','길에 남은 기록을 주웠다.',{kind:'narration',eventSource:'relic-found'}]],{title:st.name});
 return seq;}'''
PREP=r'''q=>{const a=HonroApp;a.dialogue=null;HonroStoryFraming.clear(a.scene);a.turnNotice=null;a.modal.classList.remove('open');a.canSpeak=()=>true;
 // Restore each fresh stage inspection snapshot. Completed actors are exposed
 // for pixel inspection only; gameplay roster/progress remain independent.
 a.engine.b=JSON.parse(JSON.stringify(window.framingBase));a.scene.battle=a.engine.b;
 const options=JSON.parse(JSON.stringify(q.options));delete options.compiled;
 if(q.options.compiled){options.index=0;options.staging=JSON.parse(JSON.stringify(q.options.staging||null));}
 const b=a.engine.b;if(q.key.startsWith('narration-relic-')){const m=b.honroMarkers.find(m=>'narration-relic-'+m.id===q.key),u=a.engine.active;if(m&&u){u.x=m.x;u.y=m.y;}}if(q.key.startsWith('event-')){const ev=b.honroEvents.find(ev=>'event-'+ev.id===q.key),x=ev?.when?.progress,u=a.engine.active;if(Number.isFinite(x)&&u){u.x=x+5;u.y=HonroWorld.top(b,u.x,u.y);}}for(const [id,u]of Object.entries(b.honroStaging?.hidden||{})){if(!b.units.some(v=>v.id===id))b.units.push(u);delete b.honroStaging.hidden[id];}
 HonroStory.start(a,q.lines,options);return a.dialogue?.lines.length||0;}'''
FRAME=r'''()=>{const a=HonroApp,s=a.scene,d=a.dialogue;if(!d)return null;
 HonroStoryStaging.lineEnd(a);a.updateHUD(true);s.render(a.engine,0,a.selected,0,false,0,true);
 const r=s.storyFrameReport||null,{w,h}=s.size();const include=r?r.boxes.every(p=>{const x=(p.x-s.x)*s.scale+w/2,y=(p.y-s.y)*s.scale+h/2;return x>=r.rect.x-1&&y>=r.rect.y-1&&x+p.w*s.scale<=r.rect.x+r.rect.w+1&&y+p.h*s.scale<=r.rect.y+r.rect.h+1;}):false;
 const who=d.lines[d.index]?.[0],meta=d.lines[d.index]?.[2]||{},speaker=HonroStoryFraming.bounds(a,{speaker:who}),onScreen=speaker&&r?(()=>{const x=(speaker.x-s.x)*s.scale+w/2,y=(speaker.y-s.y)*s.scale+h/2;return x>=r.rect.x-1&&y>=r.rect.y-1&&x+speaker.w*s.scale<=r.rect.x+r.rect.w+1&&y+speaker.h*s.scale<=r.rect.y+r.rect.h+1;})():null,portrait=!!document.querySelector('#dialogue-root .story-portrait')&&(document.querySelector('#story-speaker .story-speaker-name')||document.getElementById('story-speaker'))?.textContent?.trim()===who,policy=meta.camera?.speakerPolicy||'none',speakerPass=policy==='none'||onScreen===true||policy==='context-portrait'&&portrait;
 return{worldSpeakerContained:onScreen,speakerPolicy:policy,speakerPortrait:portrait,speakerPass,index:d.index,who:d.lines[d.index]?.[0],text:d.lines[d.index]?.[1],meta:d.lines[d.index]?.[2],framing:r,included:include,viewport:{w:innerWidth,h:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth};}'''
def run():
 with sync_playwright() as p:
  browser=launch(p);ctx=browser.new_context(viewport={'width':1280,'height':800});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://localhost:8014/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();for(let i=1;i<=30;i++)a.profile.cleared[i]={rounds:5};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=a.profile.recruited.slice();window.framingProfile=JSON.parse(JSON.stringify(a.profile));}''')
  allrows=[];catalog=[]
  selected=[int(x) for x in os.environ.get('HONRO_FRAME_STAGES',','.join(map(str,range(1,31)))).split(',')]
  if len(selected)<30 and (OUT/'inventory.json').exists():
   previous=json.loads((OUT/'inventory.json').read_text());allrows=[r for r in previous['pages'] if r['stage'] not in selected];catalog=[r for r in previous['catalog'] if r['stage'] not in selected]
  for sid in selected:
   page.evaluate('id=>{const a=HonroApp;a.dialogue=null;a.profile=JSON.parse(JSON.stringify(window.framingProfile));a.launch(id);}',sid);page.wait_for_function('id=>HonroApp.engine?.b.honroStage===id&&HonroApp.dialogue',arg=sid,timeout=120000)
   seqs=page.evaluate(CATALOG);page.evaluate('window.framingBase=JSON.parse(JSON.stringify(HonroApp.engine.b))');catalog.append({'stage':sid,'sequences':seqs})
   stage_dir=OUT/f'stage-{sid:02}';stage_dir.mkdir(exist_ok=True)
   for qi,q in enumerate(seqs):
    for label,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
     page.set_viewport_size(size);count=page.evaluate(PREP,q)
     for i in range(count):
      row=page.evaluate(FRAME)
      if not row:break
      name=f'{qi:02}-{i:02}-{label}.jpg';page.screenshot(path=str(stage_dir/name),type='jpeg',quality=48);row.update({'source':SOURCE,'stage':sid,'sequence':q['key'],'sequenceIndex':qi,'label':label,'image':f'stage-{sid:02}/{name}'});allrows.append(row)
      if i+1<count:page.evaluate('HonroStory.next(HonroApp)')
   (OUT/'inventory.json').write_text(json.dumps({'source':SOURCE,'catalog':catalog,'pages':allrows,'errors':errors},ensure_ascii=False,indent=2))
   print(f'stage {sid}: {len(seqs)} sequences, {len([r for r in allrows if r["stage"]==sid])} captures',flush=True)
  browser.close()
  print('DONE',len(allrows),'missing',sum(bool(r.get('framing',{}).get('missing')) for r in allrows),'failed',sum(not r['included'] for r in allrows),'speakerFailures',sum(not r.get('speakerPass',True) for r in allrows),'errors',errors,flush=True)
  assert not errors
  assert all(r['included'] and not r['overflow'] and r.get('speakerPass',True) for r in allrows)
if __name__=='__main__':run()
