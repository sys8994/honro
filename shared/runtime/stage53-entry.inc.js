      const declared53=Object.create(null),verified53=new WeakMap();
      const trust53=(app,e,s)=>s===active.get(app)&&s?.normal51&&s.b===e.b&&s.source53===verified53.get(e)&&
        app.engine===e&&app.stageId===53&&app.profile===app.normalProfile&&e.b.mode==='campaign'&&e.b.honroAuthoredId==='stage-53'&&
        e.b.honroCanonical===true&&e.b.honroCustom===false&&normal51Provider.content(e.b)===e.stage&&app.stage?.id===53&&app.stage?.objective===e.stage.objective&&
        e.b.honroGrowth?.limit.total===0&&e.b.honroGrowth?.limit.combat===0&&runtime(app);
      const indoor53=createInnerMissionOwner({C,manifest:declared53,
        verifyMounted:(app,e,s,d)=>trust53(app,e,s)&&declared53[53]===d,
        verifyIncoming:(app,e,s,n)=>n===52&&trust53(app,e,s)?s.incoming53:null,
        verifyChart:(app,e,frame)=>frame==='hall'&&trust53(app,e,active.get(app))&&
          fingerprints.get(JSON.stringify(e.b.terrain))===declared53[53].playSHA&&fingerprints.get(JSON.stringify(e.b.honroWorldTerrain))===declared53[53].worldSHA});
      const actions53=createStage53PhysicalActions({C,authenticate:trust53});
      function enterNormal53(app,grant,predecessor){
        const t=predecessor?.terminal,e=predecessor?.engine,{packet,known}=grant,m=packet.map,d=packet.mission;
        check(predecessor?.normal51&&active.get(app)===predecessor&&app.engine===e&&e.b===predecessor.b&&e.b.phase==='won'&&app.done&&
          app.profile===app.normalProfile&&e.stage.id===52&&normal51Provider.content(e.b)===e.stage&&t?.stage===52&&t.settlement===false&&
          t.flags?.['act6.outerSitesPrepared']===true&&t.flags?.['act6.darmheoInTemple']===true,'Previous normal 52 owner absent');
        const real=e.b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly),mage=real.find(a=>a.cls==='mage'),mageView=t.actors.find(a=>a.cls==='mage');
        check(real.length===4&&t.actors.length===4&&t.actors.every(v=>real.some(u=>u.id===v.id&&carryFields.every(k=>same(u[k],v[k]))&&u.hp>0&&!u.dead)),'Real 52 bodies changed');
        const external=Object.fromEntries(real.filter(a=>a!==mage).map(x=>[x.cls,structuredClone(x)]));
        check(Object.keys(external).sort().join(',')==='archer,knight,occultist','External three required');
        const roles={
          'draft-lower-lane-guard':{kind:'ghost',name:'바닥을 더듬는 잔향',hp:290,walk:35,intent:'낮은 통로를 따라 울리는 제자리 혼령'},
          'draft-upper-side-guard':{kind:'shade',name:'문지방의 매듭귀',hp:520,walk:0,intent:'진목 주변에 매듭실을 묶는 수의귀'}
        };
        const st={...m,id:'stage-53',metadata:{stageId:53,campaign:true,act:6,actStage:3},units:m.units.map(u=>{
          if(u.team==='player'){check(u.kind==='mage','Only physical Damheo');return {...u,id:mage.id};}
          const spec=roles[u.id],a=spec&&G.HonroWorld.archetypes[spec.kind];check(a&&u.team==='enemy','Exact two alternate authored guards only');
          const loadout=spec.kind==='shade'?['HSH02']:a.skills.slice();
          const native=C.makeUnit(a.cls,1,u.x,u.y,{id:u.id,facing:u.facing,role:a.role,name:spec.name,h:a.h,r:a.r,hp:spec.hp,maxHp:spec.hp,
            attack:a.attack,walkSpeed:spec.walk,maxMove:spec.walk,moveLeft:spec.walk,intent:spec.intent,loadout,ranks:Object.fromEntries(loadout.map(k=>[k,1])),
            honroType:spec.kind,honroVariant:a.look,...(spec.kind==='shade'?{honroMonsterEffectSkill:'HSH02'}:{})});
          return {...native,...u,cls:a.cls,runtimeTemplate:true};
        })};
        const p=structuredClone(app.profile),project={...G.HONRO_PROJECT,stages:[st],library:packet.library};
        const content=Object.freeze({...e.stage,id:53,local:53,actStage:3,active:1,requires:[52],name:'끝없이 이어지는 법당',goal:'담허의 진목을 지정 받침에 설치하세요.',
          w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-53'}});
        const budget=normal51Provider.budget(e.b);check(budget?.id===52,'Missing normal 52 budget quote');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:53}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b&&b.stageId===53&&b.honroStage===53&&b.honroGrowth?.limit.total===0&&b.honroGrowth.limit.combat===0,'Native 53 factory refused');
        for(const [value,expected] of [[b.terrain,d.playSHA],[b.honroWorldTerrain,d.worldSHA]]){
          const key=JSON.stringify(value);check(new Map(known).get(key)===expected,'Native 53 collisions changed');fingerprints.set(key,expected);
        }
        const raw=b.units.filter(u=>u.side===0&&!u.summoned);
        check(raw.length===1&&raw[0].id===mage.id,'Damheo must be the original solo body');
        for(const k of [...carryFields,'equipmentIds','gearBonuses','attack','armor','maxMove','walkSpeed','regen']){
          if(Object.hasOwn(mage,k))raw[0][k]=structuredClone(mage[k]);else delete raw[0][k];
        }
        raw[0].moveLeft=raw[0].maxMove;
        const entrance=st.units.find(u=>u.team==='player'),deck=b.terrain.find(t=>t.id==='south');
        check(entrance?.x===425&&deck&&Math.abs(C.topAt(deck,425)-entrance.y)<=3,'Signed 53 arrival seat is invalid');
        Object.assign(raw[0],{x:425,y:C.topAt(deck,425),spawnX:425,spawnY:C.topAt(deck,425),vx:0,vy:0,airborne:false,jumping:false});
        b.honroMonsterEffectsRevision=1;
        b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        check(C.validTerrainContactPose(b.terrain,raw[0]),'Damheo body does not fit the hall');
        app.stopBattle();
        const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done},
          incoming53=Object.freeze({stage:52,won:true,flags:structuredClone(t.flags),mage:structuredClone(mageView),external});
        const s={old,b,packet,previous:t,terminal:null,ordinaryRest:true,normal51:true,source53:Object.freeze({}),incoming53,kind:'normal-53-private'};
        active.set(app,s);declared53[53]={...d,allowCanonical:true,quotedZeroPilot:true,authoredAlias:'stage-53'};app.close();
        Object.assign(app,{stageId:53,stage:content,training:false,selectedByUnit:{}});
        try{
          app.mount(b,{freshReport:true,reportScope:'custom'});
          check(app.engine===s.engine&&app.engine.stage===content&&app.scene&&app.screen==='battle','Normal 53 mount failed');
          const ui=appUI(app);check(ui,'Normal controls absent');
          const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';styleAction(button);
          button.textContent='남은 진목 사이 건너기';button.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===button)action(app,event);});
          s.button=button;ui.append(button);return true;
        }catch(error){app.stopBattle();app.showTitle();throw error;}
      }
      function bindNormal53(app,e,s){
        verified53.set(e,s.source53);
        check(trust53(app,e,s),'Native 53 scoped owner refused '+JSON.stringify([s===active.get(app),s?.normal51,s.b===e.b,s.source53===verified53.get(e),app.engine===e,app.stageId,app.profile===app.normalProfile,e.b.mode,e.b.honroAuthoredId,e.b.honroCanonical,e.b.honroCustom,normal51Provider.content(e.b)===e.stage&&app.stage?.id===53&&app.stage?.objective===e.stage.objective,e.b.honroGrowth?.limit,runtime(app)]));check(indoor53.mount(app,e,s),'Native 53 mission refused');check(actions53.mount(app,e,s),'Native 53 actions refused '+JSON.stringify([e.active?.x,e.active?.y,e.active?.airborne,e.canAct(),e.grounded(e.active),e.b.stakes?.length,e.b.phase]));
        s.engine=e;e.checkEnd=()=>app.checkMission(e);return true;
      }
      function contextualStakeIds(app,e,ids,allowed){
        const state=active.get(app),full=ids.slice(0,4).filter(Boolean).length===4;
        const dedicated=!!(state&&allowed&&full&&!ids.includes('M09'));
        if(dedicated&&!state.stakeControl){
          const host=appUI(app);
          if(host){
            const button=document.createElement('button');
            button.type='button';button.dataset.act6QaContextStake='';
            button.dataset.action='combat-skill';button.dataset.skill='M09';
            button.textContent='축지진목 조준';styleAction(button);host.append(button);
            state.stakeControl=button;
          }
        }
        if(state?.stakeControl){
          state.stakeControl.hidden=!dedicated;state.stakeControl.disabled=!dedicated;
          state.stakeControl.setAttribute('aria-pressed', String(dedicated&&app.selected==='M09'));
        }
        if(!allowed||ids.includes('M09'))return ids;
        if(full)return [...ids,'M09']; // normal HUD keeps its four; the visible contextual button selects the same skill
        const shown=ids.slice(),blank=Array.from({length:4},(_,i)=>i).find(i=>!shown[i]);
        shown[blank]='M09';return shown;
      }
      function context53(app,u,ids){
        const e=app.engine;
        return e?.b?.honroStage===53&&e.active===u&&actions53.aim(app,e)
          ?contextualStakeIds(app,e,ids,true):contextualStakeIds(app,e,ids,false);
      }
      function release53(app,u){
        const e=app.engine;
        if(e?.b?.honroStage!==53||e.active!==u||app.selected!=='M09')return false;
        if(!actions53.aim(app,e))return true;
        const q=actions53.cast(app,e,u.angle,app.power);if(!q.ok)app.notify(q.reason);app.updateHUD(true);return true;
      }
