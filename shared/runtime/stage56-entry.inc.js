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
        const previous=Object.freeze({stage:55,won:true,flags:t.flags,crew:{...fullOuter,mage:t.parkedMage},boundary:{fullParkedMage:t.parkedMage,fullOuter}});
        return mountFrom55(a,grant,previous,e.stage,normal51Provider.budget(e.b),()=>eligible56(a,prev)&&active.get(a)===prev,undefined);
      }
      async function mountCold56(a,grant,body,stays,key){
        if(!cold56.has(key)||!stays()||body.from!==55||body.to!==56)return false;
        const t=body.terminal,{outer:fullOuter,mage:fullParkedMage}=body.custody;
        const previous=Object.freeze({stage:55,won:true,flags:t.flags,crew:{...fullOuter,mage:fullParkedMage},boundary:{fullParkedMage,fullOuter}});
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
          const ui=appUI(a);check(ui,'Normal 56 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);
          btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);tick56(a);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}
      }
      function bindNormal56(a,e,s){
        s.engine=e;mounted56.set(e,s);
        check(scope56(a,e,s),'Native 56 scope changed');
        s.owner56=adapter56.attach({app:a,engine:e,prepared:s.prepared56,receipt:s.previous,packet:s.packet,compiled:s.compiled56,grant:s.lease56});
        check(s.owner56,'Native 56 owner refused');e.checkEnd=()=>a.checkMission(e);return true;
      }
      function stage56UI(a,s,e){
        if(!scope56(a,e,s))return;
        const id=s.owner56.project()?.appActions?.mission;if(!id)return;
        const q=s.owner56.interact(id);a.notify(q.ok?q.label:q.reason);e.checkEnd();tick56(a);a.updateHUD(true);
      }
      function tick56(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==56||!scope56(a,e,s)||!s.owner56)return;
        s.owner56.tick();const r=s.owner56.project();
        if(s.button){s.button.textContent=r.summary;s.button.disabled=r.complete||r.failed;s.button.dataset.act6Mission=r.appActions?.mission??'';}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();
      }
      function terminalNormal56(a,s){
        if(!scope56(a,s.engine,s))return null;
        const e=s.engine,result=s.owner56.terminal();
        return native56Handoff({app:a,engine:e,result,previous:s.previous,isTerminal:(aa,ee,rr)=>aa===a&&ee===e&&rr===result});
      }
