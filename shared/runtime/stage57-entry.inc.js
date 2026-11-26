      const mounting57=new WeakMap(),mounted57=new WeakMap(),signed57=new WeakMap(),cold57=new WeakMap();
      const scope57=(a,e,s)=>s===active.get(a)&&s?.normal51===true&&mounted57.get(e)===s&&s.engine===e&&a.engine===e&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&inNormalStage(a,e,57)&&runtime(a);
      const eligible57=(a,s)=>a.screen==='battle'&&scope56(a,a.engine,s)&&s.b.phase==='won'&&a.done&&s.terminal?.stage===56&&
        s.terminal.won===true&&s.terminal.flags?.['act6.firstGarmjinFailed']===true&&s.terminal.flags?.['act6.temporaryPassageEscaped']===true&&s.terminal.settlement===false;
      const port57=createNormalWarmPort({
        verifyPacket:q=>signed57.get(q.packet)===q.compiled&&q.descriptor===descriptor57,
        authorizeCold:(key,a,p,id)=>{const m=cold57.get(key);return id===57&&m?.a===a&&m.p===p&&m.stays()&&runtime(a);},
        stillOwnsPredecessor:(a,p,id)=>id===56&&mounting57.get(a)===p&&p===active.get(a)?.terminal&&eligible57(a,active.get(a))
      }),adapter57=stage57Adapter(G,{normalPort:port57});
      async function enterNormal57(a,grant,prev){
        check(eligible57(a,prev)&&active.get(a)===prev,'No live 56 terminal authority');
        const e=prev.engine,previous=prev.terminal,{packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        check(previous.boundary.fullMage.id===e.active?.id&&e.grounded(e.active)&&same(previous.boundary.fullMage,e.active)&&
          same(previous.boundary.fullOuter,prev.previous.boundary.fullOuter),'Native 56 outgoing body or parked row changed');
        return mountFrom56(a,grant,previous,e.stage,normal51Provider.budget(e.b),()=>eligible57(a,prev)&&active.get(a)===prev,undefined);
      }
      async function mountCold57(a,grant,body,stays,key){
        if(!cold57.has(key)||!stays()||body.from!==56||body.to!==57)return false;
        cold57.set(key,{a,p:body.terminal,stays});
        try{return await mountFrom56(a,grant,body.terminal,body.stageSeed,body.budget,stays,key);}
        finally{cold57.delete(key);}
      }
      async function mountFrom56(a,grant,previous,stageSeed,budget,stays,coldLease){
        const {packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const mage=previous.boundary.fullMage,interiorD=previous.boundary.interiorD;
        check(interiorD?verifyHallD56(C,capturedHallSlice,mage,interiorD,{atExit:true}):legacyHallExit56(mage),
          '56 interior threshold or legacy E exit is invalid');
        const prepared=await adapter57.prepare({descriptor:descriptor57,packet,compiled,previous});
        check(prepared&&stays(),'56 owner expired during preparation');
        check(debitSodanThread(prepared.heroes.find(u=>u.cls==='occultist'),previous.sodanThread,56,54),'Deep support cost exceeds the returning body reserve');
        mounting57.set(a,previous);let lease;
        try{lease=port57.prepare({id:57,app:a,previous,packet,descriptor:descriptor57,compiled,coldLease});}finally{mounting57.delete(a);}
        check(lease,'No private 57 parent lease');
        const st={...m,id:'stage-57',metadata:{stageId:57,campaign:true,act:6,actStage:7},
          units:prepared.units.filter(u=>u.side!==2).map(u=>({id:u.id,kind:u.cls,team:u.side?'enemy':'player',x:u.x,y:u.y}))};
        const content=Object.freeze({...stageSeed,id:57,local:57,actStage:7,active:3,requires:[56],name:m.name,goal:'원래 돌단에서 네 사람 모으기',
          objective:'act6-fallback-reunite',w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-57'}});
        const project={...G.HONRO_PROJECT,stages:[st],library:packet.library};
        check(budget?.id===56,'Missing native 56 budget');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:57}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.stageId===57&&b.honroStage===57&&b.mode==='campaign'&&normal51Provider.content(b)===content&&b.honroJourneyReplay!==true,'No native Stage57');
        const expected=new Map(grant.known);
        for(const [v,h] of [[b.terrain,descriptor57.playSHA],[b.honroWorldTerrain,descriptor57.worldSHA]]){
          const src=JSON.stringify(v);check(expected.get(src)===h,'Native 57 shape drift');fingerprints.set(src,h);
        }
        b.units=prepared.units;b.terrain=prepared.terrain;b.active=prepared.heroes[0].id;b.queue=prepared.heroes.map(u=>u.id);
        b.honroActiveLimit=4;b.enemyLimit=4;b.honroJourneyReplay=false;b.honroState??={flags:{}};Object.assign(b.honroState.flags,prepared.entryFlags);
        b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        a.stopBattle();
        const old={profile:a.profile,stage:a.stage,stageId:a.stageId,training:a.training,selectedByUnit:a.selectedByUnit,done:a.done};
        const s={old,b,packet,previous,terminal:null,ordinaryRest:true,normal51:true,prepared57:prepared,lease57:lease,interiorD};
        a.close();active.set(a,s);Object.assign(a,{stageId:57,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(scope57(a,a.engine,s)&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 57 mount failed');
          s.exterior=installExteriorEncounters(a,a.engine,()=>!!s.hallSill57);
          const ui=appUI(a);check(ui,'Normal 57 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);
          btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);
          const alt=document.createElement('button');alt.type='button';alt.dataset.act6QaAlt='';styleAction(alt);alt.textContent='두 인물이 나누어 결속 잇기';
          alt.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===alt&&scope57(a,a.engine,s))stage57UI(a,s,a.engine,true);});
          s.alt=alt;ui.append(alt);tick57(a);startAct6Opening(a,s,57);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}
      }
      function bindNormal57(a,e,s){
        s.engine=e;mounted57.set(e,s);
        check(scope57(a,e,s),'Native 57 scope changed');
        s.owner57=adapter57.attach({app:a,engine:e,prepared:s.prepared57,receipt:s.previous,grant:s.lease57});
        check(s.owner57,'Native 57 owner refused');
        const sodan=s.prepared57.heroes.find(u=>u.cls==='occultist'),allowed=e.skillAllowed.bind(e),reason=e.monsterSkillReason.bind(e);
        const bound=(u,skill)=>u===sodan&&!e.b.honroState.flags[s.packet.bridge.required.marker]&&skill?.id!==sodanSkills.body;
        e.skillAllowed=(skill,u=e.active)=>!bound(u,skill)&&allowed(skill,u);
        e.monsterSkillReason=(skill,u=e.active)=>bound(u,skill)?'담허가 돌아올 때까지 혼줄을 붙듭니다.':reason(skill,u);
        e.checkEnd=()=>a.checkMission(e);return true;
      }
      const field57Dialogue=Object.freeze({
        warnBell:[
          ['소단','받침 아래에 금이 갔어요. 줄을 옮기기 전에 저기가 주저앉으면 제가 놓치게 돼요.'],
          ['휘겸','그 자리에서 힘으로만 버티려 하지 마시오. 가까이 있는 사람이 먼저 잇도록 하겠소.'],
          ['설오','여기서 돌단이 보입니다. 옆에서 다가오는 것은 제가 막겠습니다. 누가 손을 보태야 하면 먼저 부르십시오.'],
          ['소단','저한테 한 사람만 오거나, 두 분이 나눠서 잡아 주세요. 제가 어느 쪽이 느슨한지 말할게요.']
        ],
        repairRelay:[
          ['소단','지금은 당겨도 버텨요. 그래도 더 오래 여기서 붙들면 받침이 못 견뎌요.'],
          ['휘겸','그동안 내가 석교 난간을 보겠소. 사람을 빼기 전에 돌부터 떨구면 안 되오.'],
          ['설오','석교에 닿으면 고개부터 들겠습니다. 아래에 서 있는 사람을 보지 못하면 부르겠습니다.']
        ],
        warnRailing:[
          ['휘겸','난간이 아래쪽으로 먼저 기울었소. 넘기기 전에 그 밑에서 모두 나오시오.'],
          ['설오','떨어지는 데까지 생각하면 난간 바로 앞도 비켜야 합니다. 저 턱을 넘어오면 부르십시오.'],
          ['소단','뛰어내리지 마세요. 버텨야 한다고 뒤에 남아 있어도 제가 끌어올릴 순 없어요.']
        ],
        openRetreat:[
          ['설오','난간이 떨어졌습니다. 지금 그 자리에 서 있던 사람은 없습니다.'],
          ['휘겸','그럼 반대쪽으로 사람을 옮기겠소. 가장 뒤에 있던 사람이 먼저 건너시오.'],
          ['소단','움직일 때 저랑 줄을 같이 봐 주세요. 헐거워지면 그 발판에서 멈춰요.']
        ],
        assistKeeper:[
          ['곽진','형님, 저 표지까지 제가 가겠습니다. 거기 서 있으면 들어오던 데가 막혀도 나올 자리가 보일 겁니다.'],
          ['휘겸','여기 남아도 되겠나? 둘 다 들어가 버리면 나올 쪽에서 부를 사람이 없소.'],
          ['곽진','그래서 남는 겁니다. 병사들하고 다리 건너는 데만 보겠습니다. 안쪽까지 따라갈 일은 없소.'],
          ['설오','표지 옆에 닿으면 저희가 여기서 보겠습니다. 발이 놓일 돌을 확인하시고 와 주십시오.'],
          ['곽진','알겠소. 여기서는 걷는 게 더 빠릅니다. 어디에 설지도 이제 알겠소.'],
          ['휘겸','그래. 대답할 수 있을 때는 꼭 하게. 우린 지나갈 때 다시 부르겠네.']
        ],
        receiveKeeperWatch:[
          ['휘겸','곽진, 이제부터 돌아오는 표지는 자네 몫이오. 안까지 따라오라는 뜻이 아니네.'],
          ['설오','돌아올 때 먼저 표지를 찾겠습니다. 우리가 늦어도 혼자 들어오지 말라고 전하십시오.'],
          ['휘겸','그래. 병사들은 자네 곁에 남기게. 그 사람들을 데리고 돌아가는 것도 자네 일이오.'],
          ['소단','저는 이제 담허님한테 갑니다. 다시 줄을 잡아야 하면 그쪽에서 먼저 불러 주세요.']
        ],
        reuniteAtWard:[
          ['소단','담허님, 대답 말고 손을 움직여 봐요. 손가락 하나만 움직여도 제가 알아요.'],
          ['담허','이 손에 아직 감각이 있네. 돌이 이렇게 찼던가.'],
          ['설오','기다리십시오. 바로 일어나면 넘어지십니다. 제 팔 잡고 서 보십시오.'],
          ['휘겸','네 사람 다 있소. 이제 누가 먼저 갔더라도 따라가느라 뛰지 마시오. 같이 건너겠소.'],
          ['소단','그럼 줄은 놓을게요. 걸어가실 때 옆에 있을게요.']
        ]
      });
      function show57FieldDialogue(a,e,id){
        const rows=field57Dialogue[id==='splitRepair'?'repairRelay':id];
        if(!rows||a.engine!==e||a.done||a.dialogue||e.b.phase!=='aim')return false;
        const dlg='act6-field-57-'+id;
        return G.HonroStory.start(a,rows.map(([who,line],i)=>[who,line,{kind:'character',storyId:dlg,rowId:dlg+'-'+i}]),
          {id:dlg,title:a.stage.name,presentationOnly:true});
      }
      function stage57UI(a,s,e,split=false){
        if(!scope57(a,e,s)||a.dialogue||a.modal.classList.contains('open'))return;
        if(a.done){presentNormal57Loss(a,s);return;}
        const actions=s.owner57.project()?.appActions,id=split?actions?.alt:actions?.mission;if(!id)return;
        const q=s.owner57.interact(id);a.notify(q.ok?q.label:q.reason);e.checkEnd();tick57(a);a.updateHUD(true);if(q.ok)show57FieldDialogue(a,e,id);
      }
      function tick57(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==57||!scope57(a,e,s)||!s.owner57)return;
        s.owner57.tick();const r=s.owner57.project();
        const id='stage57-rail-clearance',target=r.targets?.find(t=>t.id==='openRetreat'&&Number.isFinite(t.y));
        const targets=a.scene.missionTargets??[],present=targets.find(t=>t.id===id);
        if(target&&(present?.x!==target.x||present?.y!==target.y)){
          a.scene.missionTargets=[...targets.filter(t=>t.id!==id),{...target,id,label:'난간 밖 안전한 발판'}];
        }else if(!target&&present)a.scene.missionTargets=targets.filter(t=>t.id!==id);
        if(!s.hallSill57&&e.b.honroState.flags[s.packet.bridge.required.marker]){
          const slice=s.packet.bridge.additions.terrain.find(t=>t.id===hallSill.source);
          check(slice&&same(e.b.terrain.find(t=>t.id===hallSill.source),slice),'Folded receiving slice was revised');
          const bridge=s.packet.bridge.additions.terrain.find(t=>t.id==='local-07-08-folded-ward-bridge');
          const lead=hallLead57(bridge),approach=G.HonroGeometry.terrain(lead.terrain,e.b.height);
          e.b.terrain=[...e.b.terrain,approach];e.b.honroWorldTerrain=[...e.b.honroWorldTerrain,approach];
          e.invalidateTerrainCollisionIndex();
          installHallArt(e,a.scene,[hallSillArt(slice,true),lead.landmark]);
          if(s.interiorD){
            check(verifyHallD56(C,slice,e.unit(s.interiorD.actor),s.interiorD),'The exterior branch no longer meets D');
            e.b.honroState.localHallDOrigin=structuredClone(s.interiorD);
            e.message('담허: 안쪽 돌길에서 닿았던 문턱이다. 바깥 길도 여기에서 만나는군.');
          }
          s.hallSill57=true;
        }
        if(s.button){
          const retry=r.failed&&a.done;
          s.button.textContent=retry?'결과와 다시 걷기':s.hallSill57&&!r.complete&&!r.appActions?.mission?'서쪽 징검석에 뛰어올라 네 사람이 산문을 건너십시오.':r.summary;
          s.button.disabled=r.complete||(r.failed&&!retry);
          s.button.dataset.act6Mission=r.appActions?.mission??'';
        }
        if(s.alt){s.alt.hidden=!r.appActions?.alt;s.alt.disabled=s.alt.hidden;}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();
      }
      function terminalNormal57(a,s){
        if(!scope57(a,s.engine,s)||s.b.phase!=='won')return null;
        const e=s.engine,r=s.owner57.terminal();if(!r?.won||!r.association?.seamReady||!r.flags?.['act6.fourCorporealJoined'])return null;
        const active=e.b.units.filter(u=>u.side===0&&!u.summoned),full=Object.fromEntries(active.map(u=>[u.cls,structuredClone(u)]));
        if(active.length!==4||Object.keys(full).length!==4||!r.body.every(row=>{const u=e.unit(row.id);return u?.cls===row.role&&u.x-3200===row.receiving[0]&&u.y+758===row.receiving[1]&&e.grounded(u)&&
          e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==='local-07-08-exact-receiving-slice';}))return null;
        return {stage:57,won:true,settlement:false,flags:r.flags,crew:full,boundary:{full,receiving:Object.fromEntries(r.body.map(row=>[row.role,{x:row.receiving[0],y:row.receiving[1]}])),guard:r.guard,association:r.association,...(s.interiorD?{interiorD:structuredClone(s.interiorD)}:{})}};
      }
      function failedNormal57(a,s){
        return !!(s&&scope57(a,s.engine,s)&&a.done&&s.b.phase==='lost'&&s.owner57.project().failed);
      }
      function presentNormal57Loss(a,s){
        if(!failedNormal57(a,s))return false;
        a.open('<header class="result-fixed"><div class="result-title">길에서 물러났다</div></header><div class="result-body"><p data-act6-loss-57></p><p>쉼터에서 6막 7장 기록을 다시 이어갈 수 있습니다.</p></div><div class="actions result-actions"><button type="button" class="primary" data-act6-retry-57>쉼터에서 다시 걷기</button></div>','result');
        a.modal.querySelector('[data-act6-loss-57]').textContent=s.b.winnerReason;
        a.modal.querySelector('[data-act6-retry-57]').addEventListener('click',event=>{
          if(!event.isTrusted||!failedNormal57(a,s))return;
          if(typeof retryBoundary57==='function'&&!retryBoundary57(a)){
            a.notify('6막 7장 기록을 확인할 수 없습니다.');return;
          }
          a.showRest();
        });
        a.audio?.play('lose');
        return true;
      }
