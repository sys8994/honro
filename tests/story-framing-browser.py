"""Enumerate authored battle sequences and capture every displayed page.
Positions/progress are inspection fixtures, never a normal campaign playthrough.
"""
import sys,json,html,os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT
OUT=ROOT/'_local/reports/story-framing';OUT.mkdir(parents=True,exist_ok=True)
CATALOG=r'''()=>{const a=HonroApp,b=a.engine.b,st=a.stage,seq=[];
 const add=(key,lines,options={})=>{if(lines?.length)seq.push({key,lines:JSON.parse(JSON.stringify(lines)),options});};
 add('entry',a.dialogue?.lines||[],{title:st.name,after:'entry',compiled:true,staging:a.dialogue?.staging});
 for(const [i,q]of (b.honroState.deferredStory||[]).entries())add('deferred-'+i,q.lines,{title:st.name});
 add('outcome',st.outro,{title:st.name,after:'outcome'});
 for(const ev of b.honroEvents||[])add('event-'+ev.id,HonroStoryContent.eventLines(a,ev),{title:st.name});
 for(const [id,lines]of Object.entries(st.beats||{}))add('beat-'+id,lines.map(([w,t,m={}])=>[w,t,{...m,storyId:`act${st.act}-${st.id}-${id}`,storyTitle:st.name,...(st.act===3?{evidenceGoal:id}:{})}]),{title:st.name});
 const walk=(v,path)=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)&&v.length&&v.every(l=>Array.isArray(l)&&typeof l[0]==='string'&&typeof l[1]==='string')){add(path,v,{title:st.name});return;}for(const [k,x]of Object.entries(v))walk(x,path+'-'+k);};
 walk(st.storyFollowups,'followup');walk(b.honroEntryVariant,'entry-variant');walk(b.honroRouteSpec,'route');
 const map=HONRO_PROJECT.stages.find(m=>m.metadata.stageId===st.id);walk(map?.interactions,'map-interaction');walk(map?.initialState?.honroEntryVariants,'authored-entry-variant');
 for(const m of b.honroMarkers||[])if(['ledger','ritual','receiver','rescue'].includes(m.action))for(const count of m.action==='receiver'?[1,2]:[0]){const old=b.honroState.receivers;b.honroState.receivers=count;add('interaction-'+m.id+'-'+count,HonroStoryContent.interaction(a,m),{title:st.name});b.honroState.receivers=old;}
 if(st.id===10)for(const name of ['cooperation','cooperationDefense','finaleMidpoint'])add(name,HonroStoryContent[name](),{title:st.name});
 const ids=st.id===9?['act1-sodan-first-receiver-v1','act1-sodan-upper-yard-departure-v1']:st.id===24?['act3-split-departure-v1','act3-split-departure-v2']:st.id===28?['act3-party-reunion-v2']:[];
 for(const id of ids){const def=HonroStoryStaging.describe(id);if(def)add('staging-'+id,[['서술',def.title,{stagingRequest:{id,context:{marker:b.honroMarkers.find(m=>m.action==='receiver')?.id}}}]],{title:def.title});}
 return seq;}'''
PREP=r'''q=>{const a=HonroApp;a.dialogue=null;HonroStoryFraming.clear(a.scene);a.turnNotice=null;a.modal.classList.remove('open');a.canSpeak=()=>true;
 // Restore each fresh stage inspection snapshot. Completed actors are exposed
 // for pixel inspection only; gameplay roster/progress remain independent.
 a.engine.b=JSON.parse(JSON.stringify(window.framingBase));a.scene.battle=a.engine.b;
 const options=JSON.parse(JSON.stringify(q.options));delete options.compiled;
 if(q.options.compiled){options.index=0;options.staging=JSON.parse(JSON.stringify(q.options.staging||null));}
 const b=a.engine.b;if(q.key.startsWith('event-')){const ev=b.honroEvents.find(ev=>'event-'+ev.id===q.key),x=ev?.when?.progress,u=a.engine.active;if(Number.isFinite(x)&&u){u.x=x+5;u.y=HonroWorld.top(b,u.x,u.y);}}for(const [id,u]of Object.entries(b.honroStaging?.hidden||{})){if(!b.units.some(v=>v.id===id))b.units.push(u);delete b.honroStaging.hidden[id];}
 HonroStory.start(a,q.lines,options);return a.dialogue?.lines.length||0;}'''
FRAME=r'''()=>{const a=HonroApp,s=a.scene,d=a.dialogue;if(!d)return null;
 HonroStoryStaging.lineEnd(a);a.updateHUD(true);s.render(a.engine,0,a.selected,0,false,0,true);
 const r=s.storyFrameReport||null,{w,h}=s.size();const include=r?r.boxes.every(p=>{const x=(p.x-s.x)*s.scale+w/2,y=(p.y-s.y)*s.scale+h/2;return x>=r.rect.x-1&&y>=r.rect.y-1&&x+p.w*s.scale<=r.rect.x+r.rect.w+1&&y+p.h*s.scale<=r.rect.y+r.rect.h+1;}):false;
 return{index:d.index,who:d.lines[d.index]?.[0],text:d.lines[d.index]?.[1],meta:d.lines[d.index]?.[2],framing:r,included:include,viewport:{w:innerWidth,h:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth};}'''
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
      name=f'{qi:02}-{i:02}-{label}.jpg';page.screenshot(path=str(stage_dir/name),type='jpeg',quality=48);row.update({'stage':sid,'sequence':q['key'],'sequenceIndex':qi,'label':label,'image':f'stage-{sid:02}/{name}'});allrows.append(row)
      if i+1<count:page.evaluate('HonroStory.next(HonroApp)')
   (OUT/'inventory.json').write_text(json.dumps({'catalog':catalog,'pages':allrows,'errors':errors},ensure_ascii=False,indent=2))
   print(f'stage {sid}: {len(seqs)} sequences, {len([r for r in allrows if r["stage"]==sid])} captures',flush=True)
  browser.close()
  print('DONE',len(allrows),'missing',sum(bool(r.get('framing',{}).get('missing')) for r in allrows),'failed',sum(not r['included'] for r in allrows),'errors',errors,flush=True)
if __name__=='__main__':run()
