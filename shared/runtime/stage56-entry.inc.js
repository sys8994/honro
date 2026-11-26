      const mounting56=new WeakMap(), mounted56=new WeakMap(), cold56=new WeakMap();
      const scope56=(a,e,s)=>s===active.get(a)&&s?.normal51===true&&mounted56.get(e)===s&&s.engine===e&&a.engine===e&&a.profile===a.normalProfile&&
        normal51Provider.content(e.b)===e.stage&&inNormalStage(a,e,56)&&runtime(a);
      const eligible56=(a,s)=>a.screen==='battle'&&s?.normal51===true&&s.b.honroStage===55&&s.b===s.engine?.b&&a.engine===s.engine&&
        normal51Provider.content(s.b)===s.engine.stage&&s.b.phase==='won'&&a.done&&s.terminal?.stage===55&&s.terminal.won===true&&
        s.terminal.flags?.['act6.outerAnchorBellReady']===true&&s.terminal.flags?.['act6.outerThreeAnchorsReady']===true&&s.terminal.settlement===false;
      const port56=createNormalWarmPort({
        verifyPacket:q=>signed56.get(q.packet)===q.compiled&&q.descriptor===descriptor56,
        authorizeCold:(key,a,p,id)=>{const m=cold56.get(key);return id===56&&m?.a===a&&m.p===p&&m.stays()&&runtime(a);},
        stillOwnsPredecessor:(a,p,id)=>id===55&&mounting56.get(a)===p&&eligible56(a,active.get(a))
      }), adapter56=stage56Adapter(G,{normalPort:port56});
      const signed56=new WeakMap(),descriptor56=Object.freeze({id:56,authoredId:owner56.authoredId,playSHA:owner56.playSHA,worldSHA:owner56.worldSHA});
      async function enterNormal56(a,grant,prev){
        check(eligible56(a,prev)&&active.get(a)===prev&&a.profile===a.normalProfile,'No live 55 settlement capability');
        const e=prev.engine,t=prev.terminal,packet=grant.packet,compiled=grant.compiled,m=packet.map,p=structuredClone(a.profile);
        const fullOuter=Object.fromEntries(t.actors.map(row=>[row.cls,row]));
        check(Object.keys(fullOuter).length===3&&Object.entries(fullOuter).every(([role,row])=>same(row,e.b.units.find(u=>u.id===row.id&&u.cls===role)))&&
          same(t.parkedMage,prev.previous.mage)&&!e.b.units.some(u=>u.id===t.parkedMage.id),'55 carry contacts or parked row drift');
        const previous=Object.freeze({stage:55,won:true,flags:t.flags,crew:{...fullOuter,mage:t.parkedMage},boundary:{fullParkedMage:t.parkedMage,fullOuter},eave:t.eave,sodanThread:t.sodanThread});
        return mountFrom55(a,grant,previous,e.stage,normal51Provider.budget(e.b),()=>eligible56(a,prev)&&active.get(a)===prev,undefined);
      }
      async function mountCold56(a,grant,body,stays,key){
        if(!cold56.has(key)||!stays()||body.from!==55||body.to!==56)return false;
        const t=body.terminal,{outer:fullOuter,mage:fullParkedMage}=body.custody;
        const previous=Object.freeze({stage:55,won:true,flags:t.flags,crew:{...fullOuter,mage:fullParkedMage},boundary:{fullParkedMage,fullOuter},eave:t.eave,sodanThread:t.sodanThread});
        cold56.set(key,{a,p:previous,stays});
        try{return await mountFrom55(a,grant,previous,body.stageSeed,body.budget,stays,key);}
        finally{cold56.delete(key);}
      }
      async function mountFrom55(a,grant,previous,stageSeed,budget,stays,coldLease){
        const {packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const prepared=await adapter56.prepare({descriptor:descriptor56,packet,compiled,previous});
        check(prepared&&stays(),'55 owner expired during preparation');
        mounting56.set(a,previous);
        let lease;
        try{lease=port56.prepare({id:56,app:a,previous,packet,descriptor:descriptor56,compiled,coldLease});}finally{mounting56.delete(a);}
        check(lease,'No private 56 parent lease');
        const st={...m,id:'stage-56',metadata:{stageId:56,campaign:true,act:6,actStage:6},
          units:prepared.units.map(u=>({id:u.id,kind:u.cls,team:u.side?'enemy':'player',x:u.x,y:u.y}))};
        const content=Object.freeze({...stageSeed,id:56,local:56,actStage:6,active:1,requires:[55],name:m.name,goal:'깊은 경계 출구 찾기',
          objective:'authored',w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-56'}});
        const project={...G.HONRO_PROJECT,stages:[st],library:packet.library};
        check(budget?.id===55,'Missing native 55 budget');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:56}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.stageId===56&&b.honroStage===56&&b.mode==='campaign'&&normal51Provider.content(b)===content&&b.honroJourneyReplay!==true,'No native Stage56');
        const expected=new Map(grant.known);
        for(const [v,h] of [[b.terrain,owner56.playSHA],[b.honroWorldTerrain,owner56.worldSHA]]){
          const src=JSON.stringify(v);check(expected.get(src)===h,'Native 56 shape drift');fingerprints.set(src,h);
        }
        b.units=prepared.units;b.active=prepared.units[0].id;b.queue=[b.active];b.honroActiveLimit=4;b.enemyLimit=4;b.honroJourneyReplay=false;
        b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        a.stopBattle();
        const old={profile:a.profile,stage:a.stage,stageId:a.stageId,training:a.training,selectedByUnit:a.selectedByUnit,done:a.done};
        const s={old,b,packet,previous,terminal:null,ordinaryRest:true,normal51:true,prepared56:prepared,compiled56:compiled,lease56:lease};
        a.close();active.set(a,s);
        Object.assign(a,{stageId:56,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(scope56(a,a.engine,s)&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 56 mount failed');
          s.exterior=installExteriorEncounters(a,a.engine,()=>!!s.eave56||!!s.d56);
          const nearby=a.engine.combatEnemies.bind(a.engine);
          // During the marked shelf evasion, the original reflow actor gets
          // its attack before the separated banks resume their own turns.
          a.engine.combatEnemies=()=>s.owner56.project()?.missionStep==='evade'
            ?nearby().filter(u=>u===s.prepared56.reserved):nearby();
          if(previous.eave)mountEave56(a,s,previous.eave);
          const ui=appUI(a);check(ui,'Normal 56 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);
          btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);
          attachSodanSpirit(a,s,previous.boundary.fullOuter.occultist,previous.sodanThread,56);tick56(a);startAct6Opening(a,s,56);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}
      }
      function bindNormal56(a,e,s){
        s.engine=e;mounted56.set(e,s);
        check(scope56(a,e,s),'Native 56 scope changed');
        s.owner56=adapter56.attach({app:a,engine:e,prepared:s.prepared56,receipt:s.previous,packet:s.packet,compiled:s.compiled56,grant:s.lease56,exitGate:mage=>{
          if(!s.d56){
            s.d56=mountHallD56({C,e,scene:a.scene,mage,slice:capturedHallSlice});
            check(s.d56,'D branch did not meet the original E floor');
            e.b.honroState.localHallD56={edge:hallSill.id,support:s.d56.support.id};
          }
          return s.d56.proof();
        }});
        check(s.owner56,'Native 56 owner refused');e.checkEnd=()=>a.checkMission(e);return true;
      }
      function mountEave56(a,s,proof){
        const e=s.engine,u=e.active,room=composeTornEave(s.packet.map);
        check(validTornEave(u.id,proof),'Invalid shared C receiving contact');
        const compiled=G.HonroMaps.compile(room.map,{library:room.library});
        const received={normal:null,restore:swapTornEave(e,room.map,compiled),units:e.b.units,axis:null};
        // Bodies in the approved main hall are kept on their own map until it
        // opens. The temporary chamber never updates or normalizes their poses.
        e.b.units=[u];
        s.eave56=received;
        received.axis=installTornEave({C,e,scene:a.scene,u,receiving:proof,onReturn:pose=>{received.normal=pose;}});
        check(e.grounded(u)&&same(received.axis.sample(),proof.exit),'C landed contact differs from 54');
        focusChart54(a,u,{x:u.x,y:u.y+95});
      }
      function projectNormal56(a,e,s){
        if(s?.d56&&!s.owner56.project().complete)return {complete:false,objectiveReady:false,summary:'오른쪽 돌문턱에 발을 디디십시오.',targets:[]};
        if(!s?.eave56)return s?.owner56?.project();
        return {complete:false,objectiveReady:false,summary:'같은 처마를 따라 오른쪽으로 이동해 난간에 내려서세요.',targets:[]};
      }
      function stage56UI(a,s,e){
        if(!scope56(a,e,s)||s.eave56)return;
        const id=s.owner56.project()?.appActions?.mission;if(!id)return;
        const q=s.owner56.interact(id);a.notify(q.ok?q.label:q.reason);e.checkEnd();tick56(a);a.updateHUD(true);if(q.ok)showAct6Milestone(a,s,id,field56Dialogue[id]);
      }
      const field56Dialogue=Object.freeze({
        stakeA:[
          ['담허','첫 돌은 버티는군. 아래쪽으로 굴러가던 것이 멈추지는 않았네.'],
          ['소단','네. 이쪽에서는 같은 소리로 들려요. 담허님이 움직여도 저는 저 아래를 계속 볼게요.'],
          ['담허','그럼 둘째 돌에 닿을 때는 네가 먼저 불러. 이 자리에는 되돌아올 수 있게 그대로 두겠네.']
        ],
        stakeB:[
          ['소단','둘째 돌 아래는 길이 더 좁아요. 한 사람이 들어가면 다른 사람은 못 비켜요.'],
          ['담허','먼저 거기서 발을 옮겨 놓겠네. 진을 다 펴고 나서 빠질 곳을 찾으면 늦어.'],
          ['소단','네. 그쪽 말고 다른 데서 소리가 끊기면 움직이던 방향도 같이 봐 주세요.']
        ],
        activate:[
          ['담허','당기기는 하는군. 지금은 더 박을 일은 없어. 저쪽이 어떻게 바뀌는지 보고 오지.'],
          ['소단','거리가 벌어져도 바로 잡아당기진 않을게요. 어디로 흐르는지 보신 다음에 대답해 주세요.'],
          ['담허','그래. 그릇 안에 가둔 물이 아니라 길을 지나는 흐름이니, 서 있던 돌부터 확인하며 가세.']
        ],
        readNarrowing:[
          ['담허','멎은 줄 알았더니 지나갈 자리를 내가 막았네. 지금 서 있는 데까지 밀려오겠어.'],
          ['소단','다시 세게 잡아당겨서 맞출 수는 없어요. 아래 낮은 턱이 움직이기 전에 비켜야 해요.'],
          ['담허','이 자리에서는 풀 수도 없군. 한 걸음 옮길 때까지는 아무도 줄을 당기지 마.'],
          ['소단','알겠어요. 저도 반대편에서 더 지켜볼게요. 저희가 서 있던 데로 몰리는 것만 먼저 볼게요.']
        ],
        warnShelf:[
          ['소단','흐르던 것보다 한 박자 늦게 무거운 것이 따라와요. 조금 전 길을 다시 막은 것 같아요.'],
          ['담허','저 낮은 턱에는 아직 발 디딜 수 있네. 역류가 밀기 전에 먼저 옮기겠어.'],
          ['소단','바로 돌아오지 마요. 저쪽이 요동치는 동안은 거기서 계속 버텨 주세요.'],
          ['담허','알겠네. 되돌아와 다시 세우는 게 아니고, 옆의 얕은 틈에서 다시 열어 볼게.'],
          ['소단','제 쪽에서도 바로 안 보이면 잡아당기지 않을게요. 먼저 담허님 발소리가 들리는지 볼게요.'],
          ['담허','내가 디딘 쪽을 말하겠네. 그 말을 듣고 나서 줄을 조금 넘겨 주게.']
        ],
        open:[
          ['담허','비켜난 쪽은 아직 그대로네. 그쪽으로만 작게 열어 보지.'],
          ['소단','이번엔 돌아서지 않아요. 지나가는 것들이 동쪽으로 펴져요.'],
          ['담허','그럼 여기서는 손을 떼겠네. 열린 곳을 좁히려다가 같은 일을 되풀이할 필요는 없어.'],
          ['소단','동쪽에 닿으시면 부르세요. 발 디딜 데가 살아 있는지만 보고 가요.']
        ],
        returnEast:[
          ['담허','돌아왔네. 앞쪽 돌에는 아직 발을 붙일 수 있어. 맞은편까지 통하는지는 저기서 봐야겠어.'],
          ['소단','줄을 따라갈게요. 바깥에 있는 사람이랑 닿으면 제가 먼저 알려 드릴게요.'],
          ['담허','그래. 먼저 보인 문턱을 지나기 전엔 서두르지 않겠네. 오늘은 되돌아올 자리를 먼저 보고 가세.']
        ]
      });
      function tick56(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==56||!scope56(a,e,s)||!s.owner56)return;
        updateSodanSpirit(s);
        if(s.eave56){
          const r=s.eave56,u=e.active;
          if(!r.normal){
            if(s.button){s.button.disabled=true;s.button.dataset.act6TornEave='receive';s.button.textContent=projectNormal56(a,e,s).summary;}
            return;
          }
          r.axis.dispose();r.restore();e.b.units=r.units;s.eave56=null;
          e.refreshActivation();
          const support=e.contactSurface(u.x,u.y-3,u.y+4);
          check(u.x===928&&u.y===1136&&e.grounded(u)&&support?.t.id==='A-upper-veranda'&&
            fingerprints.get(JSON.stringify(e.b.terrain))===owner56.playSHA&&fingerprints.get(JSON.stringify(e.b.honroWorldTerrain))===owner56.worldSHA,
            'The approved veranda contact or mask changed');
          if(s.button)delete s.button.dataset.act6TornEave;
          focusChart54(a,u);a.updateHUD(true);
        }
        s.owner56.tick();const r=projectNormal56(a,e,s);
        if(s.button){s.button.textContent=r.summary;s.button.disabled=r.complete||r.failed;s.button.dataset.act6Mission=r.appActions?.mission??'';if(s.d56)s.button.dataset.act6HallD='approach';}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();
      }
      function terminalNormal56(a,s){
        if(!scope56(a,s.engine,s))return null;
        const e=s.engine,result=s.owner56.terminal();
        if(!s.d56||e.contactSurface(e.active.x,e.active.y-4,e.active.y+5)?.t!==s.d56.support||
          !verifyHallD56(C,capturedHallSlice,e.active,result?.interiorD,{atExit:true}))return null;
        const t=native56Handoff({app:a,engine:e,result,previous:s.previous,isTerminal:(aa,ee,rr)=>aa===a&&ee===e&&rr===result});
        return t?{...t,sodanThread:s.spirit.record()}:null;
      }
