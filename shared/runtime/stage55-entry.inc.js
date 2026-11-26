      const mounted55=new WeakMap(),cold55=new WeakSet();
      const scope55=(a,e,s)=>s===active.get(a)&&!!s?.normal51&&s.b===e.b&&mounted55.get(e)===s&&a.engine===e&&a.stageId===55&&
        a.profile===a.normalProfile&&normal51Provider.content(e.b)===e.stage&&e.b.mode==='campaign'&&e.b.honroAuthoredId==='stage-55'&&runtime(a);
      const eligible55=(a,s)=>a.screen==='battle'&&s?.normal51&&s.b.honroStage===54&&a.engine===s.engine&&s.b.phase==='won'&&a.done&&
        s.terminal?.stage===54&&s.terminal.flags?.['act6.invertedGalleryCrossed']===true&&s.terminal.settlement===false;
      async function prepareNormal55(packet,known,compiled){
        const bell=await createNormalBellOwner({C,packet:{terrain:compiled.terrain,world:compiled.worldTerrain},
          verifyRelay:r=>verifyStage54Relay(C,relaySill54,r,true),
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
        const t=prev.terminal,e=prev.engine,u=e.active;
        check(eligible55(a,prev)&&active.get(a)===prev&&a.profile===a.normalProfile&&e.stage.id===54&&normal51Provider.content(e.b)===e.stage&&
          t.mage.id===u?.id&&u.cls==='mage'&&e.grounded(u)&&u.hp>0&&!u.dead&&same(t.mage,u)&&same(t.external,prev.previous.external)&&
          ['N>L','L>C','C>L'].every((id,i)=>t.chart[i]?.id===id&&t.chart[i].actor===u.id&&t.chart[i].grounded===true)&&
          validTornEave(u.id,t.eave)&&same(prev.eave54?.axis.sample(),t.eave.exit)&&verifyStage54Relay(C,relaySill54,t.relay)&&
          e.b.stakes.some(v=>v.id===t.relay.id&&v.owner===u.id&&v.shot===t.relay.shot&&v.skill==='M09'&&v.x===t.relay.x&&v.y===t.relay.y),'Actual 54 completed chart required');
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
        const foes=grant.packet.foes.map(({origin,...u})=>C.makeUnit(u.cls,1,u.x,u.y,{
          ...structuredClone(u),spawnX:u.x,spawnY:u.y,vx:0,vy:0,airborne:false,jumping:false,awake:true,acted:false,
          ...(u.id===D55.gate.id?{groundedSentry:true}:{})
        }));
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
          const body=party.find(u=>u.cls==='occultist');
          check(debitSodanThread(body,t.sodanThread,54,0),'Inner support cost exceeds the seated body reserve');
          s.seated55=mountSeatedSodan({C,e:a.engine,scene:a.scene,body});
          s.exterior=installExteriorEncounters(a,a.engine);
          const ui=appUI(a);check(ui,'Normal 55 controls absent');const btn=document.createElement('button');
          btn.type='button';btn.dataset.act6QaLookout='';styleAction(btn);btn.textContent=s.owner55.project(a,a.engine).summary;
          btn.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===btn)action(a,event);});s.button=btn;ui.append(btn);
          const support=document.createElement('button');support.type='button';support.dataset.act6SodanBody='';styleAction(support);
          support.addEventListener('click',event=>{if(event.isTrusted&&scope55(a,a.engine,s)&&a.canInput()&&s.seated55.release())a.updateHUD(true);});
          s.support55=support;ui.append(support);tick55(a);startAct6Opening(a,s,55);return true;
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
        e.checkEnd();tick55(a);a.updateHUD(true);if(q.ok){const cue=id==='reach-bell'?'reached':id==='rebind-bell'?'rebound':null;if(cue)showAct6Milestone(a,s,cue,field55Dialogue[cue]);}
      }
      const field55Dialogue=Object.freeze({
        reached:[
          ['휘겸','돌단 앞에 왔소. 여기서 보니 저놈 몸보다 종 있던 자리가 더 크게 흔들리오.'],
          ['소단','저쪽이 울릴 때마다 이 줄도 같이 잡아당겨요. 두 번 연달아 울리면 손이 떨어질 것 같아요.'],
          ['설오','둘이 같은 사선에 있지 않게 자리를 옮기겠습니다. 소단 씨 앞에서 쏘지 않겠습니다.'],
          ['휘겸','나는 이 돌을 비우지 않겠소. 뒤에서 소리가 나더라도 소단 쪽을 먼저 보시오.'],
          ['소단','네. 헤지기 시작하면 제가 바로 말할게요. 그때 한 번만 곁을 봐 주세요.']
        ],
        frayed:[
          ['소단','지금이에요. 잡고 있는데도 이쪽으로 미끄러져 나가요. 제가 다시 묶는 동안 도와주세요.'],
          ['휘겸','알겠소. 매듭 옆에서 기다리게. 칼 내려놓고 방어할 테니 뒤에서 쏘지는 마시오.'],
          ['설오','먼저 닿는 쪽은 제가 보겠습니다. 정면으로 들어가는 게 있으면 바로 부르겠습니다.'],
          ['소단','막아 주셔도 저는 여기서 못 일어나요. 제 쪽이 조용해도 일이 끝난 건 아니에요.']
        ],
        rebound:[
          ['소단','다시 잡았어요. 아까처럼 줄이 손에서 밀리지는 않아요.'],
          ['휘겸','그럼 조금만 더 그렇게 계시오. 놈이 쓰러지면 내가 빈 받침으로 다시 가겠소.'],
          ['설오','종터 뒤로 넘어오는 것은 제가 맡겠습니다. 줄이 또 울리면 몸 돌리지 말고 말부터 해 주세요.'],
          ['소단','그럴게요. 담허님 쪽에서도 당길 수 있게 이번엔 너무 단단히 조이지 않을게요.']
        ]
      });
      function tick55(a){
        const s=active.get(a),e=a.engine;
        if(e?.b.honroStage!==55||!s?.owner55)return;
        const r=s.owner55.project(a,e);if(!r)return;
        if(s.button){s.button.textContent=r.summary;s.button.disabled=r.complete||r.failed;s.button.dataset.act6Binding=r.binding;s.button.dataset.act6Mark=r.targets?.[0]?.id??'';}
        if(s.support55){const reason=s.seated55.unavailableReason();
          s.support55.disabled=!!reason||r.complete||r.failed;
          const body=e.b.units.find(u=>u.side===0&&u.cls==='occultist');
          const label=body.loadout.includes(sodanSkills.body)?reason||'소단 · 좌정한 채 호혼령 부르기':'소단 · 좌정해 혼줄 유지 · 직접 공격과 이동 봉인';
          if(s.support55.textContent!==label)s.support55.textContent=label;
          s.support55.style.opacity=s.support55.disabled?'.88':'';}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();else if(r.binding==='frayed')showAct6Milestone(a,s,'frayed',field55Dialogue.frayed);
      }
      function terminalNormal55(a,s){
        const t=s.owner55.terminal(a,s.engine),proof=s.previous?.eave;
        if(!t)return t;
        if(s.previous.sodanThread)t.sodanThread=structuredClone(s.previous.sodanThread);
        if(!proof)return t;
        check(validTornEave(t.parkedMage.id,proof)&&t.parkedMage.x===proof.exit.x&&t.parkedMage.y===proof.exit.y,'Parked ceiling witness changed');
        return {...t,eave:structuredClone(proof)};
      }
