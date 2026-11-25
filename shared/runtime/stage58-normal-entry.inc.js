      const signed58=new WeakMap(),mounting58=new WeakMap(),mounted58=new WeakMap(),cold58=new WeakSet();
      const descriptor58=Object.freeze({id:58,scope:'normal-private-pilot',authoredId:'stage-58',
        playSHA:'901721de1ae340238e5b0a081861fb8fee3650d93e1496c519c50073439f7aec',worldSHA:'858974a56d2e448bde0149f9b3c4bad487b1fdf0ba459981144d71784f495f54'});
      const scope58=(a,e,s)=>s===active.get(a)&&s?.normal51===true&&mounted58.get(e)===s&&s.engine===e&&a.engine===e&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&inNormalStage(a,e,58)&&runtime(a)&&e.b.honroGrowth?.limit.total===0&&e.b.honroGrowth?.limit.combat===0;
      const eligible58=(a,s)=>a.screen==='battle'&&scope57(a,a.engine,s)&&s.b.phase==='won'&&a.done&&s.terminal?.stage===57&&
        s.terminal.won===true&&s.terminal.flags?.['act6.fourCorporealJoined']===true&&s.terminal.flags?.['act6.fallbackRelaySecured']===true&&
        s.terminal.boundary?.association?.seamReady===true&&s.terminal.settlement===false;
      const adapter58=stage58Adapter(G,{
        verifyPrevious:(r,d,p)=>{const s=mounting58.get(r);return d===descriptor58&&signed58.has(p)&&s?.packet===p&&(s.stays()&&(!s.coldLease||cold58.has(s.coldLease)));},
        verifyAdmission:(a,e,q)=>{const s=active.get(a);return scope58(a,e,s)&&s.prepared58===q&&q.units.every((u,i)=>e.b.units[i]===u||e.b.units.includes(u));}
      });
      async function enterNormal58(a,grant,prev){
        check(eligible58(a,prev)&&active.get(a)===prev,'No live 57 reunion authority');
        const e=prev.engine,previous=prev.terminal,{packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        const full=e.b.units.filter(u=>u.side===0&&!u.summoned);
        check(full.length===4&&full.every(u=>same(u,previous.boundary.full[u.cls])&&u.x-3200===previous.boundary.receiving[u.cls].x&&
          u.y+758===previous.boundary.receiving[u.cls].y&&e.grounded(u)),'Native 57 outgoing body/crossing changed');
        return mountFrom57(a,grant,previous,e.stage,normal51Provider.budget(e.b),()=>eligible58(a,prev)&&active.get(a)===prev&&prev.terminal===previous,undefined,full);
      }
      async function mountCold58(a,grant,body,stays,key){
        if(!cold58.has(key)||!stays()||body.from!==57||body.to!==58)return false;
        try{return await mountFrom57(a,grant,body.terminal,body.stageSeed,body.budget,stays,key);}finally{cold58.delete(key);}
      }
      async function mountFrom57(a,grant,previous,stageSeed,budget,stays,coldLease,live=null){
        const {packet,compiled}=grant,m=packet.map,p=structuredClone(a.profile);
        mounting58.set(previous,{app:a,packet,stays,coldLease});let prepared;
        try{prepared=await adapter58.prepare({descriptor:descriptor58,packet,compiled,previous});}finally{mounting58.delete(previous);}
        check(prepared&&stays(),'57 owner expired during preparation');
        const st={...m,id:'stage-58',metadata:{stageId:58,campaign:true,act:6,actStage:8}};
        const content=Object.freeze({...stageSeed,id:58,local:58,actStage:8,active:4,requires:[57],name:m.name,goal:'대도사와 술법 유지점을 막고 네 사람이 돌아오기',
          objective:'act6-daedosa-revision',w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-58'}});
        const project={...G.HONRO_PROJECT,stages:[st],library:packet.library};
        check(budget?.id===57,'Missing native 57 budget');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:58}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.stageId===58&&b.honroStage===58&&b.mode==='campaign'&&normal51Provider.content(b)===content&&b.honroJourneyReplay!==true,'No native Stage58');
        const expected=new Map(grant.known);
        for(const [v,h] of [[b.terrain,descriptor58.playSHA],[b.honroWorldTerrain,descriptor58.worldSHA]]){
          const src=JSON.stringify(v);check(expected.get(src)===h,'Native 58 shape drift');fingerprints.set(src,h);
        }
        b.units=prepared.units;b.active=prepared.units[0].id;b.queue=prepared.units.map(u=>u.id);
        b.honroActiveLimit=4;b.enemyLimit=4;b.honroJourneyReplay=false;b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        a.stopBattle();
        if(live){
          for(const [i,seat] of prepared.units.entries()){
            const actor=live.find(u=>u.id===seat.id);
            check(actor&&actor.cls===seat.cls,'Original body was not present at D');
            prepared.units[i]=Object.assign(actor,seat);
          }
        }
        const old={profile:a.profile,stage:a.stage,stageId:a.stageId,training:a.training,selectedByUnit:a.selectedByUnit,done:a.done};
        const s={old,b,packet,previous,terminal:null,ordinaryRest:true,normal51:true,prepared58:prepared};
        a.close();active.set(a,s);Object.assign(a,{stageId:58,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(scope58(a,a.engine,s)&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 58 mount failed');
          mountHallB58(a,s);
          s.exterior=installExteriorEncounters(a,a.engine,()=>s.owner58.project()?.skipReturn===true);
          const ui=appUI(a);check(ui,'Normal 58 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);
          btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);
          const move=document.createElement('button');move.type='button';move.dataset.act6QaReturn='';styleAction(move);move.textContent='다른 동행에게 이동 순서 넘기기';
          move.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===move&&scope58(a,a.engine,s)&&a.canInput()&&s.owner58.project()?.skipReturn){
            s.owner58.noncombatReturn();a.updateHUD(true);
          }});
          s.move=move;ui.append(move);tick58(a);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}
      }
      function bindNormal58(a,e,s){
        s.engine=e;mounted58.set(e,s);
        check(scope58(a,e,s),'Native 58 scope changed');
        s.owner58=adapter58.attach({app:a,engine:e,prepared:s.prepared58,returnRoute:()=>s.return58,
          isVanguard:u=>scope58(a,e,s)&&s.exterior?.owns(u)===true});
        check(s.owner58,'Native 58 owner refused');e.checkEnd=()=>a.checkMission(e);return true;
      }
      function mountHallB58(a,s){
        const e=s.engine,b=e.b,from=capturedHallSlice;
        const base=b.terrain.find(t=>t.id===hallSill.destination);
        check(base&&s.prepared58.units.every(u=>e.grounded(u)&&
          e.contactSurface(u.x,u.y-3,u.y+4)?.t===base&&Math.abs(C.topAt(from,u.x+hallSill.offset.x)-hallSill.offset.y-u.y)<1e-8),
          'D receiving faces do not coincide');
        const interiorD=s.previous.boundary.interiorD;
        if(interiorD){
          check(verifyHallD56(C,from,e.unit(interiorD.actor),interiorD)&&
            Math.abs(C.topAt(base,interiorD.contact.junctionX)-interiorD.contact.junctionY)<1e-8,
            'The interior route does not meet the 58 receiving ground');
          b.honroState.localHallDOrigin=structuredClone(interiorD);
        }
        const H=hallB58(),near=H.terrain.map(t=>G.HonroGeometry.terrain(t,b.height));
        b.terrain=[...b.terrain,...near];b.honroWorldTerrain=[...b.honroWorldTerrain,...near];
        e.invalidateTerrainCollisionIndex();
        installHallArt(e,a.scene,[hallSillArt(from),...H.visual,returnGateArt()]);
        const crew=s.prepared58.units.slice();
        installHallAxes({C,e,scene:a.scene,crew});
        s.return58=watchReturnGate(e,C,crew);
      }
      function stage58UI(a,s,e){
        if(!scope58(a,e,s))return;
        const id=s.owner58.project()?.targets?.[0]?.id;if(!id)return;
        const q=s.owner58.interact(id);if(!q.ok)a.notify(q.reason);e.checkEnd();tick58(a);a.updateHUD(true);
      }
      function tick58(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==58||!scope58(a,e,s)||!s.owner58)return;
        s.owner58.tick();const r=s.owner58.project();if(!r)return;
        if(s.button){s.button.textContent=r.summary;s.button.disabled=!r.targets.length;s.button.dataset.act6Mission=r.targets?.[0]?.id??'';}
        if(s.move){s.move.hidden=!r.skipReturn;s.move.disabled=s.move.hidden;}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();
      }
      function terminalNormal58(a,s){
        if(!scope58(a,s.engine,s)||s.b.phase!=='won'||s.owner58.project()?.complete!==true)return null;
        return s.owner58.terminal();
      }
