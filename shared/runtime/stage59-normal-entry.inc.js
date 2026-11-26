      const signed59=new WeakMap(),mounting59=new WeakMap(),mounted59=new WeakMap(),cold59=new WeakSet();
      const descriptor59=Object.freeze({id:59,scope:'normal-baseline-only',authoredId:D59.authoredId,playSHA:D59.playSHA,worldSHA:D59.worldSHA});
      const scope59=(a,e,s)=>s===active.get(a)&&s?.normal51===true&&mounted59.get(e)===s&&s.engine===e&&a.engine===e&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&inNormalStage(a,e,59)&&runtime(a)&&e.b.honroGrowth?.limit.total===0&&e.b.honroGrowth?.limit.combat===0;
      const eligible59=(a,s)=>a.screen==='battle'&&scope58(a,a.engine,s)&&s.b.phase==='won'&&a.done&&s.terminal?.stage===58&&s.terminal.won===true&&
        ['act6.daedosaStopped','act6.innerRevisionReady','act6.fourCorporealReturned'].every(x=>s.terminal.flags?.[x]===true)&&!!s.terminal.returnGate&&s.terminal.settlement===false;
      const adapter59=stage59Adapter(G,{
        verifyPrevious:r=>{
          const p=mounting59.get(r);if(!p||p.previous!==r)return false;
          const s=active.get(p.app);
          return p.stays()&&(!p.key||cold59.has(p.key))||s?.source59===p&&scope59(p.app,p.app.engine,s);
        },
        verifyNormal:(a,e)=>scope59(a,e,active.get(a))
      });
      async function enterNormal59(a,grant,prev){
        check(eligible59(a,prev)&&active.get(a)===prev,'No live 58 final rite authority');
        const e=prev.engine,original=prev.terminal,{packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const live=e.b.units.filter(u=>u.side===0&&!u.summoned),fresh=Object.fromEntries(original.actors.map(u=>[u.cls,u]));
        check(live.length===4&&live.every(u=>same(u,fresh[u.cls])&&e.grounded(u))&&e.unit('a6-c08-boss')?.dead===true&&e.unit('a6-c08-expansion-node')?.dead===true&&
          same(original.guard,prev.previous.boundary.guard),'Native 58 outgoing body, boss, node or guard changed');
        return mountFrom58(a,grant,original,fresh,e.stage,normal51Provider.budget(e.b),()=>eligible59(a,prev)&&active.get(a)===prev,undefined,live);
      }
      async function mountCold59(a,grant,data,stays,key){
        if(!cold59.has(key)||!stays()||data.from!==58||data.to!==59||!runtime(a))return false;
        try{return await mountFrom58(a,grant,data.terminal,data.custody.full,data.stageSeed,data.budget,stays,key);}
        finally{cold59.delete(key);}
      }
      async function mountFrom58(a,grant,original,fresh,stageSeed,budget,stays,key,live=null){
        const {packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const previous=Object.freeze({...original,crew:fresh,boundary:{full:fresh,guard:original.guard,association:original.association}}),
          source=Object.freeze({app:a,previous,original,packet,stays,key});
        check(signed59.get(packet)===compiled,'Incorrect signed 59 packet');
        check(!Object.hasOwn(original,'returnGate')||verifyReturnGate(original.returnGate,fresh),'Invalid R traversal proof');
        mounting59.set(previous,source);let prepared;
        try{prepared=await adapter59.prepare({descriptor:descriptor59,packet,compiled,previous});}catch(error){mounting59.delete(previous);throw error;}
        if(!prepared||!stays()){mounting59.delete(previous);throw Error('58 owner expired during preparation');}
        const st={...m,id:'stage-59',metadata:{stageId:59,campaign:true,act:6,actStage:9}};
        const content=Object.freeze({...stageSeed,id:59,local:59,actStage:9,active:4,requires:[58],name:'마지막 마당',goal:'가름진을 연결하고 교각을 되찾기',
          objective:D59.objective,w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-59'}});
        const project={...G.HONRO_PROJECT,stages:[st],library:packet.library};
        check(budget?.id===58,'Missing native 58 budget');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:59}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.stageId===59&&b.honroStage===59&&b.mode==='campaign'&&normal51Provider.content(b)===content&&b.honroJourneyReplay!==true,'No native Stage59');
        const expected=new Map(grant.known);
        for(const [v,h] of [[b.terrain,D59.playSHA],[b.honroWorldTerrain,D59.worldSHA]]){
          const src=JSON.stringify(v);check(expected.get(src)===h,'Native 59 shape drift');fingerprints.set(src,h);
        }
        b.units=prepared.units;b.active=prepared.units[0].id;b.queue=prepared.units.map(u=>u.id);
        b.honroActiveLimit=8;b.enemyLimit=8;b.honroJourneyReplay=false;b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        a.stopBattle();
        if(live){
          for(const [i,seat] of prepared.units.entries()){
            const actor=live.find(u=>u.id===seat.id);
            check(actor&&actor.cls===seat.cls,'Original body was not present at R');
            prepared.units[i]=Object.assign(actor,seat);
          }
        }
        const old={profile:a.profile,stage:a.stage,stageId:a.stageId,training:a.training,selectedByUnit:a.selectedByUnit,done:a.done};
        const s={old,b,packet,previous,terminal:null,ordinaryRest:true,normal51:true,prepared59:prepared,source59:source};
        a.close();active.set(a,s);Object.assign(a,{stageId:59,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(scope59(a,a.engine,s)&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 59 mount failed');
          if(original.returnGate){
            s.return59=mountReturnGate({G,e:a.engine,scene:a.scene,crew:prepared.units.filter(u=>u.side===0&&!u.summoned),
              proof:original.returnGate,installArt:installHallArt,onExit:()=>{s.return59=null;a.updateHUD(true);startAct6Opening(a,s,59);}});
            check(s.return59,'Native R support did not match the return receipt');
          }
          const ui=appUI(a);check(ui,'Normal 59 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);
          tick59(a);if(!s.return59)startAct6Opening(a,s,59);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}finally{mounting59.delete(previous);}
      }
      function bindNormal59(a,e,s){
        s.engine=e;mounted59.set(e,s);
        check(scope59(a,e,s),'Native 59 scope changed');
        s.owner59=adapter59.attach({app:a,engine:e,prepared:s.prepared59});
        check(s.owner59,'Native 59 owner refused');e.checkEnd=()=>a.checkMission(e);return true;
      }
      function option59(s,e){
        return (s.owner59.project()?.targets??[]).find(t=>t.kind==='interaction'&&Math.abs(t.x-e.active?.x)<96);
      }
      function stage59UI(a,s,e){
        if(!scope59(a,e,s)||s.return59)return;
        const item=option59(s,e);if(!item)return;
        const q=s.owner59.interact(item.id);if(!q.ok)a.notify(q.reason);e.checkEnd();tick59(a);a.updateHUD(true);
      }
      function defend59(a,act){
        const s=active.get(a);
        return s?.owner59&&scope59(a,a.engine,s)?s.owner59.defend(act):act();
      }
      function tick59(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==59||!scope59(a,e,s)||!s.owner59)return;
        if(s.return59){
          if(s.button){s.button.textContent=`동행마다 서쪽 석단 끝까지 걸으십시오 · ${s.return59.remaining()}명`;s.button.disabled=true;s.button.dataset.act6Mission='';}
          return;
        }
        s.owner59.tick();const r=s.owner59.project();if(!r)return;
        const item=option59(s,e);
        if(s.button){s.button.textContent=item?.label??r.summary??'휘겸과 함께 교각 아래를 살핀다';s.button.disabled=!item;s.button.dataset.act6Mission=item?.id??'';}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();
      }
      function terminalNormal59(a,s){
        if(!scope59(a,s.engine,s)||s.b.phase!=='won'||s.owner59.project()?.complete!==true)return null;
        const r=s.owner59.terminal();return r&&s.owner59.boundaryProof(r)?r:null;
      }
