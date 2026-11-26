      const signed60=new WeakMap(),mounted60=new WeakMap(),cold60=new WeakSet();
      const scope60=(a,e,s)=>s===active.get(a)&&s?.normal51===true&&mounted60.get(e)===s&&s.engine===e&&a.engine===e&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&inNormalStage(a,e,60)&&runtime(a)&&e.b.honroGrowth?.limit.total===0&&e.b.honroGrowth?.limit.combat===0;
      const eligible60=(a,s)=>a.screen==='battle'&&scope59(a,a.engine,s)&&s.b.phase==='won'&&a.done&&s.terminal?.stage===59&&s.terminal.won===true&&
        s.terminal.flags?.['act6.garmjinCompleted']===true&&s.terminal.flags?.['act6.finalThreatResolved']===true&&s.terminal.settlement===false&&s.owner59.boundaryProof(s.terminal)?.closed===true;
      async function enterNormal60(a,grant,prev){
        check(eligible60(a,prev)&&active.get(a)===prev&&grant.owns(),'No live 59 closure authority');
        const e=prev.engine,original=prev.terminal,physical=prev.owner59.boundaryProof(original),{packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const live=e.b.units.filter(u=>u.side===0&&!u.summoned),fresh=Object.fromEntries(original.actors.map(u=>[u.cls,u]));
        check(live.length===4&&live.every(u=>same(u,fresh[u.cls])&&e.grounded(u))&&physical.guardAftermath?.seenBy===fresh.knight.id&&
          signed60.get(packet)===compiled,'Native 59 outgoing bodies or guard witness changed');
        return mountFrom59(a,grant,original,physical,fresh,e.stage,normal51Provider.budget(e.b),()=>grant.owns()&&eligible60(a,prev)&&active.get(a)===prev&&prev.terminal===original);
      }
      async function mountCold60(a,grant,body,stays,key){
        if(!cold60.has(key)||!stays()||body.from!==59||body.to!==60)return false;
        cold60.delete(key);
        return mountFrom59(a,grant,body.terminal,body.custody.physical,body.custody.full,body.stageSeed,body.budget,stays);
      }
      async function mountFrom59(a,grant,original,physical,fresh,stageSeed,budget,stays){
        const {packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        check(signed60.get(packet)===compiled,'Native 60 signed packet changed');
        const id=await sha(new TextEncoder().encode(JSON.stringify(original)));
        check(stays(),'59 owner expired during preparation');
        const [gwakjin,...guardWitnesses]=physical.guardAftermath.poses.map(o=>({actorId:o.id,name:packet.guardRegistry[o.id],event:physical.guardAftermath.source}));
        check(gwakjin.name==='곽진'&&guardWitnesses.length===2&&guardWitnesses.every(r=>r.name&&r.event),'Missing authored return-guard names');
        const runId=a.profile?.equipment?.runId,gids=[gwakjin.actorId,...guardWitnesses.map(z=>z.actorId)];
        const names60=Object.freeze({gwakjin:Object.freeze(gwakjin),guardWitnesses:Object.freeze(guardWitnesses.map(Object.freeze))});
        if(normal60Stock)check(typeof runId==='string'&&runId.length>0&&JSON.stringify(gids)===JSON.stringify([
          'local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay'
        ]),'Native 59/60 slot lineage absent');
        const endingKey=(normal60Stock?'act6-ending:'+runId+':':'private-no-write:')+id;
        const proof60=normal60Stock?Object.freeze({rawSHA:id,runId,endingKey,names:names60,
          guard:Object.freeze({roleIds:Object.freeze(gids),actor:physical.guardAftermath.seenBy})}):null;
        const quiet={...packet.quiet,readyFlag:'localAct6QuietExitVerified'};
        const units=quiet.start.map(({cls,x,y})=>{
          const u=structuredClone(fresh[cls]);check(u?.hp>0&&u.side===0,'Stage60 original role absent');
          Object.assign(u,{x,y,spawnX:x,spawnY:y,vx:0,vy:0,jumping:false,airborne:false,acted:false,moveTarget:undefined,fallApexY:undefined,moveLeft:u.maxMove});
          check(C.validTerrainContactPose(compiled.terrain,u),'Native 60 grounded role placement absent');return u;
        });
        const st={...m,id:'stage-60',metadata:{stageId:60,campaign:true,act:6,actStage:10}};
        const content=Object.freeze({...stageSeed,id:60,local:60,actStage:10,active:4,requires:[59],name:'다시 흐르는 길',goal:'마지막 두 혼과 네 사람이 산문에 도착하기',
          objective:'act6-quiet-exit',w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-60'}});
        const project={...G.HONRO_PROJECT,stages:[st],library:packet.library};
        check(budget?.id===59,'Missing native 59 budget');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:60}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.stageId===60&&b.honroStage===60&&b.mode==='campaign'&&normal51Provider.content(b)===content&&b.honroJourneyReplay!==true,'No native Stage60');
        const expected=new Map(grant.known);
        for(const [v,h] of [[b.terrain,D60.playSHA],[b.honroWorldTerrain,D60.worldSHA]]){
          const src=JSON.stringify(v);check(expected.get(src)===h,'Native 60 shape drift');fingerprints.set(src,h);
        }
        b.units=units;b.active=units[0].id;b.queue=units.map(u=>u.id);
        b.honroActiveLimit=4;b.enemyLimit=4;b.honroJourneyReplay=false;b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        a.stopBattle();
        const old={profile:a.profile,stage:a.stage,stageId:a.stageId,training:a.training,selectedByUnit:a.selectedByUnit,done:a.done};
        const s={old,b,packet,previous:Object.freeze({rawSHA:id,endingKey,flags:{'act6.garmjinCompleted':true,finalThreatResolved:true},body:original.actors}),
          terminal:null,ordinaryRest:true,normal51:true,quiet60:quiet,names60,proof60};
        a.close();active.set(a,s);Object.assign(a,{stageId:60,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(scope60(a,a.engine,s)&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 60 mount failed');
          const ui=appUI(a);check(ui,'Normal 60 controls absent');
          function button(kind,label,fn){
            const btn=document.createElement('button');btn.type='button';btn.dataset[kind]='';styleAction(btn);btn.textContent=label;
            btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn&&scope60(a,a.engine,s)&&!a.dialogue&&!a.modal.classList.contains('open'))return fn();});
            ui.append(btn);return btn;
          }
          s.guide=button('act6QaLookout','담허 또는 소단으로 마지막 두 혼을 인도한다',()=>stage60UI(a,s,a.engine));
          s.walk=button('act6QaWalk','다른 동행에게 걸음을 넘긴다',()=>{return a.canInput()&&s.owner60.nativeInteraction('end-walk');});
          s.memorial=button('act6QaMemorial','휘겸이 곽진과 곁에 남은 사람의 이름을 기록한다',()=>memorial60(a,s));s.memorial.hidden=true;
          s.advance=button('act6QaEndingNext','다음',()=>advance60(a,s));s.advance.hidden=true;
          tick60(a,1/120);showAct6Milestone(a,s,'arrival',finale60Dialogue.arrival);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}
      }
      function bindNormal60(a,e,s){
        s.engine=e;mounted60.set(e,s);check(scope60(a,e,s),'Native 60 scope changed');
        const b=e.b,q=s.quiet60,packet=s.packet,floor=b.terrain.find(z=>z.id===q.support),top=x=>C.topAt(floor,x),t=Object.freeze({});
        const lease=Object.freeze({app:a,engine:e,packet,scope:'normal-private-stage60',previous:s.previous});
        const mount=createStage60Owner({C,authorize:r=>r===lease&&scope60(a,e,s),authorizeFrame:(r,proof,accepted)=>normal60Stock&&r===lease&&proof===s.final60Seal&&accepted===s.ready60&&endingScope60(a,e,s,s.proof60),
          worldFor:()=>({battle:b,floor:q.support,readyFlag:q.readyFlag,dest:q.souls.map(r=>r.to),destY:q.souls.map(r=>top(r.to)),gate:[q.gate,top(q.gate)],
            gateRadius:[182,150],y:top,acceptTick:(clock,E)=>clock===t&&E===e&&s.inTick60===true}),
          createSouls:()=>q.souls.map(r=>G.HonroUnits.create({id:r.id,kind:'ghost',team:'npc',x:r.from,y:top(r.from),label:r.label,stageOverrides:{fixed:false,loadout:[]}},b,a.profile,G.HONRO_CONTENT.stages[0])),
          endingWriter:()=>req=>{
            if(!normal60Stock)throw Error('No-write Act6 QA host');
            const f=s.writing60;
            return f&&req.frameProof===s.final60Seal&&endingScope60(a,e,s,s.proof60)?
              normal60Surface.write(a,e,s.proof60,{...req,frameProof:f}):{ok:false,reason:'normal-60-unowned-panel'};
          },namesFor:r=>r===s.previous?s.names60:null});
        s.owner60=mount.mount(lease);check(s.owner60,'Native 60 owner refused');
        s.guide60=dt=>{s.inTick60=true;try{return s.owner60.nativeGuide(dt,t);}finally{s.inTick60=false;}};
        e.checkEnd=()=>a.checkMission(e);return true;
      }
      function goal60(a,e){
        const s=active.get(a);if(!scope60(a,e,s)||!s.owner60)return null;
        s.ready60??=s.owner60.nativePosition();
        return {complete:!!s.ready60,objectiveReady:!!s.ready60,targets:[],summary:s.ready60?'마지막 두 혼과 모두가 산문에 닿았습니다.':'마지막 두 혼을 인도하고 네 사람이 산문에 닿으십시오.'};
      }
      const finale60Dialogue=Object.freeze({
        arrival:[
          ['설오','여기까지는 소리가 따라오지 않습니다. 다리 끝에도 더는 서 있는 것이 없습니다.'],
          ['소단','둘이 아직 남아 있어요. 저희가 길을 막고 있으면 못 따라 나갈 것 같아요.'],
          ['휘겸','이번에는 다리를 비우겠소. 화살부터 꺼내지 마시오.'],
          ['담허','손이 닿을 만큼만 가까이 가게. 앞서 걷고, 함께 움직이는지 한번 돌아보면 되네.'],
          ['설오','두 분 중 한 분이 먼저 가십시오. 여기서는 제가 다른 사람들 발을 보겠습니다.'],
          ['휘겸','다 도착하면 돌아가는 길에서 이름을 적겠소. 모르는 사람이라고 그냥 비워 둘 수는 없소.']
        ],
        sodan:[
          ['소단','제가 먼저 걸을게요. 두 분이 멈추면 저도 설게요.'],
          ['담허','급할 일 없네. 나머지는 여기서 뒤따라가겠네.'],
          ['설오','산문까지 먼저 뛰어가 있지는 않겠습니다. 나란히 보이면 같이 가겠습니다.'],
          ['설오','가던 쪽을 다시 보네요. 어느 쪽으로 가야 할지 못 알아들은 건 아닙니까?'],
          ['소단','아니에요. 따라오는 사람이 있는지 뒤돌아보는 것 같아요.'],
          ['휘겸','그렇다면 나는 여기 서 있겠소. 앞길은 저 혼이 고르게 두시오.'],
          ['담허','그래. 앞에서 끌지 말고, 우리 쪽으로 다시 꺾일 때만 길을 보여 주게.'],
          ['소단','네. 다 건너기 전까지는 제 말이 꼭 필요한 때에만 부를게요.']
        ],
        damheo:[
          ['담허','먼저 가겠네. 발 아래 돌이 끊기면 너도 나를 불러 주게.'],
          ['소단','네. 두 분 다 걷는 게 보일 때만 뒤따라갈게요.'],
          ['휘겸','바닥부터 보시오. 먼저 걷는 사람보다 앞서 가지는 맙시다.']
        ]
      });
      function stage60UI(a,s,e){
        if(!scope60(a,e,s)||!a.canInput()||!s.owner60.nativeInteraction('guide'))return false;
        a.notify('마지막 두 혼과 함께 천천히 이동하십시오.');
        const id=e.active?.cls==='occultist'?'sodan':'damheo';showAct6Milestone(a,s,id,finale60Dialogue[id]);return true;
      }
      function ending60(a,s){
        const canvas=a.scene?.canvas??document.getElementById?.('battlecanvas');
        return s.owner60.endingView(canvas?.width||innerWidth,canvas?.height||innerHeight);
      }
      function endingControls60(a,s){
        const view=ending60(a,s);if(!view||!s.advance)return;
        if(normal60Stock){for(const ctl of [s.guide,s.walk,s.memorial,s.advance])ctl.hidden=true;return;}
        if(s.guide)s.guide.hidden=true;if(s.walk)s.walk.hidden=true;
        s.advance.hidden=view.scene==='later-return';s.advance.disabled=view.scene==='bridge-record'&&!view.memorial;
        s.memorial.hidden=view.scene!=='bridge-record'||view.memorial;
        s.advance.textContent=view.scene==='last-souls'?'남은 이름을 기억한다':view.scene==='bridge-record'?'새벽을 맞는다':'후일담';
      }
      function tick60(a,dt){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==60||!scope60(a,e,s)||!s.owner60)return;
        if(a.done)return;
        s.guide60(dt);if(goal60(a,e)?.complete)e.checkEnd();
      }
      function memorial60(a,s){
        const k=a.engine.b.units.find(u=>u.side===0&&u.cls==='knight');
        const ok=s.owner60.nativeInteraction('name-the-bridge-guard',k);
        if(ok)a.notify('곽진, 박문돌, 이만복. 세 이름을 남겼습니다.');
        endingControls60(a,s);return ok;
      }
      async function advance60(a,s){
        const view=ending60(a,s);if(!view)return false;
        const q=await s.owner60.advanceScene(view.scene);
        if(scope60(a,a.engine,s))endingControls60(a,s);return q.ok;
      }
      function terminalNormal60(a,s){
        const e=s.engine;
        if(!scope60(a,e,s)||e.b.phase!=='won'||goal60(a,e)?.complete!==true)return null;
        const flags=s.owner60.settlement(s.ready60);
        if(!flags)return null;endingControls60(a,s);
        if(s.terminal60)return s.terminal60;
        return s.terminal60=Object.freeze({stage:60,won:true,settlement:false,flags,endingWrite:false,
          ...(normal60Stock?{actors:s.ready60.body}:{}),physical:structuredClone(s.ready60)});
      }

      function endingScope60(a,e,s,p){
        return normal60Stock&&!!p&&p===s.proof60&&scope60(a,e,s)&&a.done&&a.screen==='battle'&&
          !a.debugMode&&!a.customMap&&e.b===s.b&&e.b.phase==='won'&&a.profile?.equipment?.runId===p.runId&&
          s.terminal60?.stage===60&&s.terminal60.won===true&&s.terminal60.settlement===false&&s.ready60?.lineage===p.rawSHA;
      }
      const normal60Surface=normal60Stock?createNormal60Presentation(G,endingScope60):null;
      function mountEndingNormal60(a,s,terminal){
        const e=s.engine,p=s.proof60;
        if(!endingScope60(a,e,s,p)||terminal!==s.terminal60||!normal60Surface||s.closeEnding60)return false;
        const panel=new WeakMap();
        const view=(w,h)=>{
          if(!endingScope60(a,e,s,p)||!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1)return null;
          const v=s.owner60.endingView(w,h);
          if(v?.scene!=='daybreak')return v;
          const card=w/h<.95?normal60Cards.Portrait:normal60Cards.Wide;
          return {...v,asset:card};
        };
        const ui=Object.freeze({view,
          async confirmPanel(display,viewport){
            const v=view(viewport.w,viewport.h);if(!v)return null;
            const raw=normal60Surface.read(a,e,p,v,display,viewport);
            if(!raw)return null;
            const ticket=Object.freeze({});panel.set(ticket,{display,viewport,raw,scene:v.scene});return ticket;
          },
          async input(kind,{event,control,frame}={}){
            if(!normal60Surface.trust(a,e,event,control,kind)||!endingScope60(a,e,s,p))return {ok:false,reason:'normal-60-untrusted-action'};
            const f=panel.get(frame),v=f&&view(f.viewport.w,f.viewport.h);
            if(!v||v.scene!==f.scene||normal60Surface.read(a,e,p,v,f.display,f.viewport)!==f.raw)return {ok:false,reason:'normal-60-stale-panel'};
            if(kind==='record'){
              if(v.scene!=='bridge-record')return {ok:false,reason:'normal-60-not-record'};
              const ok=s.owner60.nativeInteraction('name-the-bridge-guard',e.unit(p.guard.actor));
              if(ok)panel.delete(frame);return {ok};
            }
            if(kind!=='continue')return {ok:false,reason:'normal-60-unknown-control'};
            if(v.scene==='later-return'&&!s.final60Seal){
              s.final60Seal=Object.freeze({});
              if(!s.owner60.acceptFinalFrame(s.final60Seal)){s.final60Seal=null;return {ok:false,reason:'normal-60-final-frame-closed'};}
            }
            if(s.writing60)return {ok:false,reason:'normal-60-busy'};
            s.writing60=f.raw;
            try{const result=await s.owner60.advanceScene(v.scene);if(result.ok)panel.delete(frame);return result;}
            finally{s.writing60=null;}
          }
        });
        s.closeEnding60=normal60Surface.mount(a,e,s,p,terminal,ui);
        return !!s.closeEnding60;
      }
