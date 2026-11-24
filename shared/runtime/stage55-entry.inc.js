      const mounted55=new WeakMap(),cold55=new WeakSet();
      const scope55=(a,e,s)=>s===active.get(a)&&!!s?.normal51&&s.b===e.b&&mounted55.get(e)===s&&a.engine===e&&a.stageId===55&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&e.b.mode==='campaign'&&e.b.honroAuthoredId==='stage-55'&&runtime(a);
      const eligible55=(a,s)=>a.screen==='battle'&&s?.normal51&&s.b.honroStage===54&&a.engine===s.engine&&s.b.phase==='won'&&a.done&&
        s.terminal?.stage===54&&s.terminal.flags?.['act6.invertedGalleryCrossed']===true&&s.terminal.settlement===false;
      async function prepareNormal55(packet,known,compiled){
        const bell=await createNormalBellOwner({C,packet:{terrain:compiled.terrain,world:compiled.worldTerrain},
          verifyMounted:(a,e,s)=>scope55(a,e,s)&&s.owner55===bell,
          verifyIncoming:(a,e,s)=>scope55(a,e,s)&&s.owner55===bell?s.previous:null,
          verifyImpact:(a,e,p,h,before,after)=>{
            const s=active.get(a),hit=s?.nativeHit;
            return scope55(a,e,s)&&s.owner55===bell&&hit?.p===p&&hit.h===h&&hit.before===before&&hit.after===after;
          }
        });
        return {packet,known,compiled,bell};
      }
      function enterNormal55(a,grant,prev){
        const t=prev.terminal,e=prev.engine,u=e.active,m=grant.packet.map,p=structuredClone(a.profile);
        check(eligible55(a,prev)&&active.get(a)===prev&&a.profile===a.normalProfile&&e.stage.id===54&&normal51Provider.content(e.b)===e.stage&&
          t.mage.id===u?.id&&u.cls==='mage'&&e.grounded(u)&&u.hp>0&&!u.dead&&same(t.mage,u)&&same(t.external,prev.previous.external)&&
          ['N>L','L>C','C>L'].every((id,i)=>t.chart[i]?.id===id&&t.chart[i].actor===u.id&&t.chart[i].grounded===true)&&
          e.b.stakes.some(v=>v.owner===u.id&&v.shot===t.relay.shot&&v.skill==='M09'&&v.y===2930),'Actual 54 completed chart required');
        return mountFrom54(a,grant,t,e.stage,normal51Provider.budget(e.b));
      }
      function mountCold55(a,grant,data,stays,key){
        if(!cold55.has(key)||!stays()||data.from!==54||data.to!==55||!runtime(a))return false;
        cold55.delete(key);
        return mountFrom54(a,grant,data.terminal,data.stageSeed,data.budget);
      }
      function mountFrom54(a,grant,t,stageSeed,budget){
        const m=grant.packet.map,p=structuredClone(a.profile);
        const party=[],exactFields=[...carryFields,'equipmentIds','gearBonuses','attack','armor','maxMove','walkSpeed','regen'];
        for(const [role,x,y] of grant.packet.slots){
          const old=t.external[role],auth=D55.entry[role];
          check(old?.cls===role&&old.side===0&&!old.dead&&old.hp>0&&auth?.[0]===x,'Unverified external actor or 55 role slot');
          const u=C.makeUnit(role,0,x,y,{...structuredClone(old),id:old.id,x,y,spawnX:x,spawnY:y,vx:0,vy:0,acted:false,airborne:false,jumping:false});
          for(const k of exactFields){if(Object.hasOwn(old,k))u[k]=structuredClone(old[k]);else delete u[k];}
          u.moveLeft=u.maxMove;party.push(u);
        }
        const foes=grant.packet.foes.map(({origin,...u})=>C.makeUnit(u.cls,1,u.x,u.y,{...structuredClone(u),spawnX:u.x,spawnY:u.y,vx:0,vy:0,airborne:false,jumping:false,awake:true,acted:false}));
        check(party.length===3&&party[0].cls==='knight'&&new Set(party.map(v=>v.id)).size===3&&foes.length===4,'Invalid bell formation');
        const st={...m,metadata:{stageId:55,campaign:true,act:6,actStage:5},
          units:[...party,...foes].map(q=>({id:q.id,kind:q.cls,team:q.side?'enemy':'player',x:q.x,y:q.y}))};
        const content=Object.freeze({...stageSeed,id:55,local:55,actStage:5,active:3,requires:[54],name:m.name,goal:'휘겸으로 빈 종터 방어선에 닿으십시오.',
          objective:D55.objective,w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-55'}});
        const project={...G.HONRO_PROJECT,stages:[st],library:grant.packet.library};
        check(budget?.id===54,'Missing native 54 budget');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:55}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.stageId===55&&b.honroStage===55&&b.mode==='campaign'&&normal51Provider.content(b)===content,'No native Stage55');
        const expected=new Map(grant.known);
        for(const [v,h] of [[b.terrain,D55.shape.playSHA],[b.honroWorldTerrain,D55.shape.worldSHA]]){
          const text=JSON.stringify(v);check(expected.get(text)===h,'Native 55 shape drift');fingerprints.set(text,h);
        }
        b.units=[...party,...foes];b.active=party[0].id;b.queue=party.map(u=>u.id);
        check(b.units.every(q=>C.validTerrainContactPose(b.terrain,q)&&C.terrainSurface(b.terrain,q.x,q.y-2,q.y+2,Infinity)),'Original 55 role support changed');
        b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        a.stopBattle();
        const old={profile:a.profile,stage:a.stage,stageId:a.stageId,training:a.training,selectedByUnit:a.selectedByUnit,done:a.done};
        const s={old,b,packet:grant.packet,previous:t,terminal:null,ordinaryRest:true,normal51:true,owner55:grant.bell,nativeHit:null};
        a.close();active.set(a,s);
        Object.assign(a,{stageId:55,stage:content,training:false,selectedByUnit:{}});
        try{
          a.mount(b,{freshReport:true,reportScope:'custom'});
          check(a.engine===s.engine&&a.engine.stage===content&&a.scene&&a.screen==='battle','Native normal 55 mount failed');
          const ui=appUI(a);check(ui,'Normal 55 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);btn.textContent=s.owner55.project(a,a.engine).summary;
          btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);return true;
        }catch(error){a.stopBattle();a.showTitle();throw error;}
      }
      function bindNormal55(a,e,s){
        mounted55.set(e,s);
        check(s.owner55.mount(a,e,s),'Native 55 bell owner refused');
        const fire=e.fire.bind(e),impact=e.impact.bind(e);
        e.fire=(...args)=>{const res=fire(...args);if(res&&scope55(a,e,s))for(const p of e.b.projectiles)s.owner55.observeRelease(a,e,p);return res;};
        e.impact=(p,h)=>{const before=h?.unit?.hp,res=impact(p,h);if(h?.unit&&scope55(a,e,s)){const after=h.unit.hp;s.nativeHit={p,h,before,after};try{s.owner55.observeImpact(a,e,{projectile:p,hit:h,beforeHp:before,afterHp:after});}finally{s.nativeHit=null;}}return res;};
        s.engine=e;e.checkEnd=()=>a.checkMission(e);return true;
      }
      function bell55UI(a,s,e){
        const r=s.owner55.project(a,e),id=r?.targets?.[0]?.id;
        if(!id)return;
        const q=s.owner55.interact(a,e,id);a.notify(q.ok?q.label:q.reason);
        e.checkEnd();tick55(a);a.updateHUD(true);
      }
      function tick55(a){
        const s=active.get(a),e=a.engine;
        if(e?.b.honroStage!==55||!s?.owner55)return;
        const r=s.owner55.project(a,e);if(!r)return;
        if(s.button){s.button.textContent=r.summary;s.button.disabled=r.complete||r.failed;s.button.dataset.act6Binding=r.binding;s.button.dataset.act6Mark=r.targets?.[0]?.id??'';}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();
      }
