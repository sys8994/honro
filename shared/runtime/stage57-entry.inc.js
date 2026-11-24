      const mounting57=new WeakMap(),mounted57=new WeakMap(),signed57=new WeakMap(),cold57=new WeakMap();
      const scope57=(a,e,s)=>s===active.get(a)&&s?.normal51===true&&mounted57.get(e)===s&&s.engine===e&&a.engine===e&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&inNormalStage(a,e,57)&&runtime(a);
      const eligible57=(a,s)=>a.screen==='battle'&&scope56(a,a.engine,s)&&s.b.phase==='won'&&a.done&&s.terminal?.stage===56&&
        s.terminal.won===true&&s.terminal.flags?.['act6.firstGarmjinFailed']===true&&s.terminal.flags?.['act6.temporaryPassageEscaped']===true&&s.terminal.settlement===false;
      const descriptor57=Object.freeze({id:57,authoredId:'a6-local-playable-07',
        playSHA:'7cc7d894a8d4457db0aae331bf3eb2904d8af96c682f9a1c4393246a1bf30f72',worldSHA:'aeeeaa1f19a136072193545e5a668c97a57fea941c18ddb65968f474c6c57f99'});
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
        const prepared=await adapter57.prepare({descriptor:descriptor57,packet,compiled,previous});
        check(prepared&&stays(),'56 owner expired during preparation');
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
        const s={old,b,packet,previous,terminal:null,ordinaryRest:true,normal51:true,prepared57:prepared,lease57:lease};
        a.close();active.set(a,s);Object.assign(a,{stageId:57,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(scope57(a,a.engine,s)&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 57 mount failed');
          const ui=appUI(a);check(ui,'Normal 57 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);
          btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);
          const alt=document.createElement('button');alt.type='button';alt.dataset.act6QaAlt='';styleAction(alt);alt.textContent='두 인물이 나누어 결속 잇기';
          alt.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===alt&&scope57(a,a.engine,s))stage57UI(a,s,a.engine,true);});
          s.alt=alt;ui.append(alt);tick57(a);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}
      }
      function bindNormal57(a,e,s){
        s.engine=e;mounted57.set(e,s);
        check(scope57(a,e,s),'Native 57 scope changed');
        s.owner57=adapter57.attach({app:a,engine:e,prepared:s.prepared57,receipt:s.previous,grant:s.lease57});
        check(s.owner57,'Native 57 owner refused');e.checkEnd=()=>a.checkMission(e);return true;
      }
      function stage57UI(a,s,e,split=false){
        if(!scope57(a,e,s)||a.done||a.dialogue||a.modal.classList.contains('open'))return;
        const actions=s.owner57.project()?.appActions,id=split?actions?.alt:actions?.mission;if(!id)return;
        const q=s.owner57.interact(id);a.notify(q.ok?q.label:q.reason);e.checkEnd();tick57(a);a.updateHUD(true);
      }
      function tick57(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==57||!scope57(a,e,s)||!s.owner57)return;
        s.owner57.tick();const r=s.owner57.project();
        if(s.button){s.button.textContent=r.summary;s.button.disabled=r.complete||r.failed;s.button.dataset.act6Mission=r.appActions?.mission??'';}
        if(s.alt){s.alt.hidden=!r.appActions?.alt;s.alt.disabled=s.alt.hidden;}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();
      }
      function terminalNormal57(a,s){
        if(!scope57(a,s.engine,s)||s.b.phase!=='won')return null;
        const e=s.engine,r=s.owner57.terminal();if(!r?.won||!r.association?.seamReady||!r.flags?.['act6.fourCorporealJoined'])return null;
        const active=e.b.units.filter(u=>u.side===0&&!u.summoned),full=Object.fromEntries(active.map(u=>[u.cls,structuredClone(u)]));
        if(active.length!==4||Object.keys(full).length!==4||!r.body.every(row=>{const u=e.unit(row.id);return u?.cls===row.role&&u.x-3200===row.receiving[0]&&u.y+758===row.receiving[1]&&e.grounded(u)&&
          e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==='local-07-08-exact-receiving-slice';}))return null;
        return {stage:57,won:true,settlement:false,flags:r.flags,crew:full,boundary:{full,receiving:Object.fromEntries(r.body.map(row=>[row.role,{x:row.receiving[0],y:row.receiving[1]}])),guard:r.guard,association:r.association}};
      }
