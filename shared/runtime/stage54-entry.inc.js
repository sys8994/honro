      const mounted54=new WeakMap(),cold54=new WeakSet(),charts54Steps=Object.freeze(['N>L','L>C','C>L']);
      const rail54Assets=new WeakMap();
      const scope54=(app,e,s)=>s===active.get(app)&&!!s?.normal51&&app.engine===e&&app.stageId===54&&s.b===e.b&&mounted54.get(e)===s&&
        app.profile===app.normalProfile&&e.b.mode==='campaign'&&e.b.honroCanonical===true&&e.b.honroCustom===false&&normal51Provider.content(e.b)===e.stage&&
        e.b.honroGrowth?.limit.total===0&&e.b.honroGrowth?.limit.combat===0&&runtime(app);
      async function prepareNormal54(packet,known){
        const B=brokenRail,m=packet.map,rail={...m,width:B.width,height:B.height,terrains:B.terrain,materials:[],elements:B.elements,
          playBounds:{left:0,top:0,right:B.width,bottom:B.height},terrainBounds:{left:-320,top:-320,right:B.width+320,bottom:B.height+320}};
        const data=G.HonroMaps.compile(rail,{library:B.assets});
        const source=composeGallery54(m,packet.library),gallery=G.HonroMaps.compile(source.map,{library:source.library});
        const eave=composeTornEave(m),eaveMap=G.HonroMaps.compile(eave.map,{library:eave.library});
        rail54Assets.set(packet,{rail,data,gallery,eave,eaveMap});
        const chart=await createStage54ChartOwner({C,domain:G.HonroTerrainDomain,charts:packet.charts,
          gallery,observatory:observatory54,
          verifyEave:(a,e,u,proof)=>{
            const s=active.get(a);
            return scope54(a,e,s)&&s.eave54?.axis&&e.b.terrain===eaveMap.terrain&&same(s.eave54.axis.sample(),proof.exit)&&validTornEave(u.id,proof);
          },
          verifyMounted:(app,e,s)=>scope54(app,e,s)&&s.owner54===chart,
          verifyIncoming:(app,e,s)=>scope54(app,e,s)&&s.owner54===chart?s.previous:null,
          fireMissionSkill:(app,e,q)=>{
            const s=active.get(app);
            if(!scope54(app,e,s)||s.owner54!==chart||q.owner!=='stage-54'||q.actor!==e.active||q.skill!=='M09')return false;
            const load=q.actor.loadout,old=Object.getOwnPropertyDescriptor(load,'includes'),original=load.includes,before=JSON.stringify(load);
            try{Object.defineProperty(load,'includes',{configurable:true,value:(x,...more)=>x==='M09'||original.call(load,x,...more)});return e.fire(q.skill,q.angle,q.power);}
            finally{if(old)Object.defineProperty(load,'includes',old);else delete load.includes;check(JSON.stringify(load)===before,'Scoped 54 M09 altered loadout');}
          }
        });
        return {packet,known,chart};
      }
      function eligible54(app,s){
        return app.screen==='battle'&&s?.normal51&&s.b.honroStage===53&&app.engine===s.engine&&s.b.phase==='won'&&app.done&&
          s.terminal?.stage===53&&s.terminal.flags?.['act6.innerStakeAReady']===true&&s.terminal.settlement===false;
      }
      function enterNormal54(app,grant,prev){
        const t=prev.terminal,e=prev.engine,mage=e.active,m=grant.packet.map;
        check(eligible54(app,prev)&&active.get(app)===prev&&app.profile===app.normalProfile&&e.stage.id===53&&normal51Provider.content(e.b)===e.stage&&
          mage?.cls==='mage'&&e.grounded(mage)&&mage.hp>0&&!mage.dead&&t?.mage?.id===mage.id&&carryFields.every(k=>same(t.mage[k],mage[k]))&&
          same(t.external,prev.incoming53.external)&&canLeaveHall53(e,mage)&&validBrokenRailCrossing(brokenRail,mage.id,t.bridge)&&
          same(prev.wallAxis.contact(mage),t.bridge.to),'Actual 53 chart predecessor changed');
        return mountFrom53(app,grant,t,mage,e.stage,normal51Provider.budget(e.b),{x:app.scene.x,y:app.scene.y,zoom:app.scene.zoom});
      }
      function mountCold54(app,grant,data,stays,key){
        if(!cold54.has(key)||!stays()||data.from!==53||data.to!==54||!runtime(app))return false;
        cold54.delete(key);
        return mountFrom53(app,grant,data.terminal,data.custody.mage,data.stageSeed,data.budget);
      }
      function mountFrom53(app,grant,t,mage,stageSeed,budget,view=null){
        const m=grant.packet.map;
        const spawn=grant.packet.spawn,support=grant.packet.charts.N.terrain.find(x=>x.id===spawn.support),y=C.topAt(support,spawn.x);
        check(spawn.x===250&&spawn.support==='foothill'&&Number.isFinite(y),'Invalid native foothill arrival');
        const st={...m,metadata:{stageId:54,campaign:true,act:6,actStage:4},units:[{id:mage.id,kind:'mage',team:'player',x:spawn.x,y}]};
        const project={...G.HONRO_PROJECT,stages:[st],library:grant.packet.library},p=structuredClone(app.profile);
        const content=Object.freeze({...stageSeed,id:54,local:54,actStage:4,active:1,requires:[53],name:'거꾸로 선 처마',goal:'처마의 세 방향 확인',
          objective:'act6-gallery-charts',w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-54'}});
        check(budget?.id===53,'Missing 53 budget quote');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:54}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b&&b.stageId===54&&b.honroStage===54&&Array.isArray(b.units)&&b.units.length===1&&b.units[0]?.id===mage.id,'Wrong normal 54 bodies');
        for(const [v,h] of [[b.terrain,grant.known[0][1]],[b.honroWorldTerrain,grant.known[1][1]]]){
          const k=JSON.stringify(v);check(new Map(grant.known).get(k)===h,'Stage54 N terrain mismatch');fingerprints.set(k,h);
        }
        const u=b.units[0];
        for(const k of [...carryFields,'equipmentIds','gearBonuses','attack','armor','critChance','critMultiplier','maxMove','walkSpeed','regen']){
          if(Object.hasOwn(mage,k))u[k]=structuredClone(mage[k]);else delete u[k];
        }
        Object.assign(u,{x:spawn.x,y,spawnX:spawn.x,spawnY:y,vx:0,vy:0,moveLeft:u.maxMove,airborne:false,jumping:false});
        check(C.validTerrainContactPose(b.terrain,u),'Original Damheo cannot stand on 54 foothill');
        b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        app.stopBattle();
        if(view){
          for(const key of Object.keys(mage))if(!Object.hasOwn(u,key))delete mage[key];
          Object.assign(mage,u);b.units[0]=mage;
        }
        const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
        const s={old,b,packet:grant.packet,previous:t,terminal:null,ordinaryRest:true,normal51:true,owner54:grant.chart};
        active.set(app,s);app.close();
        Object.assign(app,{stageId:54,stage:content,training:false,selectedByUnit:{}});
        try{
          app.mount(b,{freshReport:true,reportScope:'custom'});
          check(app.engine===s.engine&&app.engine.stage===content&&app.scene&&app.screen==='battle','Normal 54 chart mount failed');
          if(t.bridge)mountBrokenReceive54(app,s,t.bridge,view);
          const ui=appUI(app);check(ui,'Normal 54 controls absent');const button=document.createElement('button');
          button.type='button';button.dataset.act6QaLookout='';styleAction(button);button.textContent='첫 받침에서 건너기';
          button.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===button)action(app,event);});s.button=button;
          if(s.wallAxis){button.disabled=true;button.textContent='벽에 발을 붙여 수문지기와 싸우세요.';}
          ui.append(button);attachSodanSpirit(app,s,t.external.occultist,t.sodanThread,54);startAct6Opening(app,s,54);return true;
        }catch(error){app.stopBattle();app.showTitle();throw error;}
      }
      function bindNormal54(app,e,s){
        mounted54.set(e,s);
        check(s.owner54.mount(app,e,s),'Normal 54 chart owner refused');
        s.engine=e;e.checkEnd=()=>app.checkMission(e);return true;
      }
      function mountBrokenReceive54(app,s,receipt,view){
        const e=s.engine,b=s.b,hero=e.active,B=brokenRail,to=receipt.to,origin={x:hero.x,y:hero.y};
        check(validBrokenRailCrossing(B,hero.id,receipt),'Broken rail receipt refused');
        const {rail,data}=rail54Assets.get(s.packet),[x,y]=B.guard;
        const guard=C.makeUnit('archer',1,x,y,{id:'mumyeongsa-b-wall-guard',name:'기둥그림자',h:88,r:23,hp:600,maxHp:600,
          focus:140,maxFocus:140,loadout:['LA01'],ranks:{LA01:1},awake:true,role:'bow',attack:.9,walkSpeed:290,maxMove:420,moveLeft:420});
        check(s.owner54.admitGuard(app,e,s,guard),'The signed wall guard was refused');
        const company=[
          ['occultist','mumyeongsa-b-aperture-ghost','처마 구멍의 잔향',128,'HGS01','ghost'],
          ['occultist','mumyeongsa-b-rear-shade','뒤쪽 매듭귀',548,'HSH01','shade'],
          ['archer','mumyeongsa-b-rear-guard','아랫 돌턱 순라',661,'LA01','marksman']
        ].map(([kind,id,name,y,skill,honroType])=>C.makeUnit(kind,1,x,y,{id,name,h:78,r:19,hp:325,maxHp:325,
          focus:170,maxFocus:170,loadout:[skill],ranks:{[skill]:1},honroType,awake:true,role:kind==='archer'?'bow':'fire',
          attack:.85,walkSpeed:250,maxMove:280,moveLeft:280}));
        for(const u of company){check(s.owner54.admitCompany(app,e,s,u,'wall'),'Unverified B support foe');b.units.push(u);}
        b.honroActiveLimit=b.enemyLimit=4;
        if(b.honroCounters)b.honroCounters.initialEnemies=4;
        const layout={terrain:data.terrain,honroWorldTerrain:data.worldTerrain,honroLandmarks:data.landmarks,honroElements:data.elements,
          honroSurfaceZones:data.materials,honroPlayBounds:rail.playBounds,honroTerrainBounds:rail.terrainBounds,width:rail.width,height:rail.height};
        s.foothill54={origin,layout:Object.fromEntries(Object.keys(layout).map(k=>[k,b[k]]))};
        Object.assign(b,layout,{sceneVersion:(b.sceneVersion??0)+1});
        Object.assign(hero,{x:to.x,y:to.y,vx:to.vx,vy:to.vy,airborne:false,jumping:false,spawnX:to.x,spawnY:to.y});
        s.guardB=guard;
        s.wallAxis=installBrokenRail({C,e,scene:app.scene,B,hero,foe:guard});
        s.wallAxis.adopt(hero);
        for(const u of [guard,...company]){s.wallAxis.adopt(u);u.airborne=true;}
        e.refreshActivation();focusChart54(app,hero,view);
      }
      function focusChart54(app,u,view){
        const scene=app.scene;
        scene._releaseDomainTiles();scene._releaseScreenCaches?.();scene.manual=false;
        scene.x=Number.isFinite(view?.x)?view.x:u.x;
        scene.y=Number.isFinite(view?.y)?view.y:u.y-120;
        if(Number.isFinite(view?.zoom))scene.zoom=view.zoom;
        scene.focusUnit(u.id,700,false);
      }
      function projectNormal54(app,e,s){
        if(!s?.wallAxis)return s?.owner54?.project(app,e);
        const still=s.guardB.dead?'벽을 따라 위쪽 처마에 닿으세요.':'같은 벽에 선 수문지기를 쓰러뜨리세요.';
        return {complete:false,objectiveReady:false,summary:still,targets:[]};
      }
      function mountEave54(app,e,s){
        const {eave,eaveMap}=rail54Assets.get(s.packet),u=e.active;
        swapTornEave(e,eave.map,eaveMap);
        const room={landed:null,approach:null,exit:null,axis:null};
        s.eave54=room;
        room.axis=installTornEave({C,e,scene:app.scene,u,onContact:pose=>{
          if(!scope54(app,e,s)||room.exit)return;
          if(!room.landed&&pose.x===tornEave.start)room.landed=pose;
          if(pose.x<tornEave.seam){room.approach=pose;return;}
          if(pose.x!==tornEave.receive)return;
          const proof={edge:tornEave.id,clearWidth:tornEave.clearWidth,gravity:{x:0,y:tornEave.gravity},landed:room.landed,approach:room.approach,exit:pose};
          if(s.owner54.recordEave(app,e,s,proof))room.exit=pose;
        }});
        focusChart54(app,u,{x:u.x,y:u.y+95});
        if(s.button){s.button.disabled=true;s.button.dataset.act6TornEave='send';s.button.textContent='처마 밑면을 따라 오른쪽으로 이동하세요.';}
        app.updateHUD(true);
      }
      function leaveBrokenReceive54(app,s){
        const e=s.engine,u=e.active,B=brokenRail;
        if(!scope54(app,e,s)||u?.cls!=='mage'||!e.canAct()||!s.wallAxis.isWall(u)||!e.grounded(u)||u.y>B.exitY||!s.owner54.readyAfterGuard(app,e))return;
        const {origin,layout}=s.foothill54,{gallery}=rail54Assets.get(s.packet);
        s.wallAxis.dispose();s.wallAxis=null;
        Object.assign(e.b,layout,{terrain:gallery.terrain,honroWorldTerrain:gallery.worldTerrain,honroLandmarks:gallery.landmarks,
          honroElements:gallery.elements,honroSurfaceZones:gallery.materials,sceneVersion:(e.b.sceneVersion??0)+1});
        const x=origin.x+B.exitY-u.y,y=C.topAt(e.b.terrain.find(t=>t.id==='foothill'),x);
        Object.assign(u,{x,y,spawnX:x,spawnY:y,vx:0,vy:0,airborne:false,jumping:false});
        check(e.grounded(u)&&C.validTerrainContactPose(e.b.terrain,u),'Unmatched foothill receiving face');
        check(s.owner54.beginGallery(app,e,s),'Gallery owner did not receive the wall passage');
        s.exterior=installExteriorEncounters(app,e,()=>s.owner54.inspect(app,e)?.frame!=='N',u=>s.owner54.admitCompany(app,e,s,u,'gallery'));
        focusChart54(app,u);
        if(s.button){s.button.disabled=true;s.button.textContent='회랑 끝 관측턱으로';}
        app.updateHUD(true);
      }
      function chart54Input(app,s,e){
        if(s.wallAxis||s.eave54)return false;
        const i=s.owner54.inspect(app,e),id=charts54Steps[i?.chart.length];if(!id||i?.pending)return false;
        const q=s.owner54.chart(app,e,id);if(!q.ok)app.notify(q.reason);if(q.ok)app.updateHUD(true);return q.ok;
      }
      function chart54Aim(app,e,u){
        const s=active.get(app),c=s?.owner54?.inspect(app,e);
        return !!c&&e.active===u&&c.frame==='L'&&!c.pending&&c.chart.length===3&&!c.m09&&e.grounded(u)&&u.x>=2334&&u.x<=2340&&
          e.contactSurface(u.x,u.y-4,u.y+4)?.t.id==='mid-contact';
      }
      const field54Dialogue=Object.freeze({
        gallery:[
          ['담허','발을 놓는 자리마다 기와가 다른 쪽에 보이네. 끝까지 가서 어디가 우리 쪽인지 먼저 봐야겠어.'],
          ['소단','전에 걷던 면이 뒤에 남아 있어요. 제가 줄을 풀어 버리면 돌아올 때 못 찾을 수도 있겠어요.'],
          ['담허','짧게만 풀게. 좋은 받침을 보더라도 멀리 뛰어 옮길 생각은 없네.'],
          ['소단','그럼 먼저 보러 가 주세요. 제가 같은 자리에서 보이는지만 알려 드릴게요.'],
          ['담허','좋네. 저 턱을 봤다고 바로 건너지는 않을게. 첫 돌로 돌아올 수 있는지부터 보지.']
        ],
        chart:[
          ['소단','아까 그 기둥이 그대로 보여요. 담허님 발만 다른 데에 붙었어요.'],
          ['담허','기둥을 기준으로 보면 돌아갈 길은 안 잃겠네. 이제 옆의 받침을 보겠어.'],
          ['소단','발을 움직이기 전에 줄이 당기는 데를 한 번만 더 말해 주세요. 제가 안 보이는 쪽을 잡을게요.'],
          ['담허','그래. 여기서는 저 받침이 아래가 됐네. 네 쪽에서 보이던 바닥으로 당기지 마.'],
          ['소단','알겠어요. 소리보다 줄이 먼저 움직이면 부를게요. 건너편에서도 대답해 주세요.']
        ],
        stake:[
          ['담허','이제 진목을 놓을 면이 보이네. 얇은 장식에는 박지 말고 돌이 두꺼운 끝을 잡겠어.'],
          ['소단','제가 보이는 쪽에서는 저게 옆으로 서 있어요. 거길 맞힐 때까지 줄을 누르고 있을게요.'],
          ['담허','맞히고 나서 바닥이 흔들리면 그대로 밟지 않겠네. 내려서도 괜찮은 돌부터 가름하세.'],
          ['소단','제가 먼저 바깥에서 부르는 소리가 나더라도 그쪽으로 가면 안 돼요. 지금은 여기 붙들고 있어요.'],
          ['담허','네가 놓으라고 하기 전엔 기대지 않겠네. 처마가 가까워져도 한 번 더 보고 갈게.']
        ]
      });
      function tick54(app){
        const s=active.get(app),e=app.engine;
        if(e?.b.honroStage!==54||!s?.owner54)return;
        updateSodanSpirit(s);
        if(s.wallAxis){leaveBrokenReceive54(app,s);return;}
        if(s.eave54){if(s.eave54.exit&&!app.done)e.checkEnd();return;}
        if(s.owner54.enterEave(app,e,s)){mountEave54(app,e,s);return;}
        if(s.owner54.observeGallery(app,e)&&s.button){s.button.disabled=false;s.button.textContent='첫 받침으로 돌아가 건너기';app.updateHUD(true);showAct6Milestone(app,s,'gallery',field54Dialogue.gallery);}
        const landed=s.owner54.observe(app,e), p=s.owner54.project(app,e),info=s.owner54.inspect(app,e);
        if(landed&&s.button)s.button.textContent=info.chart.length===3?'돌턱에 진목 놓기':'다음 받침에서 건너기';
        if(landed){app.updateHUD(true);if(info?.chart?.length===1)showAct6Milestone(app,s,'landed',field54Dialogue.chart);else if(info?.chart?.length===3&&!info.m09)showAct6Milestone(app,s,'stake',field54Dialogue.stake);}
        if(p.complete&&!app.done)e.checkEnd();
      }

      function terminalNormal54(app,s){
        const t=s.owner54.terminal(app,s.engine);
        return t?{...t,sodanThread:s.spirit.record()}:null;
      }
      function attachSodanSpirit(app,s,body,previous,stage){
        const e=s.engine,hero=e.active;
        s.spirit=mountSodanSpirit({C,e,scene:app.scene,hero,body,previous,stage,isWall:u=>s.wallAxis?.isWall(u)===true,
          preferredTarget:()=>s.wallAxis&&s.guardB?.id});
        const btn=document.createElement('button');btn.type='button';btn.dataset.act6SodanSpirit='';styleAction(btn);
        btn.textContent='소단의 혼 · 주박부';
        btn.addEventListener('click',event=>{
          if(!event.isTrusted||active.get(app)!==s||app.engine!==e||!app.canInput())return;
          if(!s.spirit.cast())app.notify('혼줄이 닿는 적에게 가까이 다가가세요.');
          app.updateHUD(true);
        });
        s.spiritButton=btn;appUI(app).append(btn);updateSodanSpirit(s);
      }
      function updateSodanSpirit(s){
        if(!s.spiritButton)return;
        const reason=s.spirit.unavailableReason(),label=reason||'소단의 혼 · 주박부';
        s.spiritButton.disabled=!!reason;
        if(s.spiritButton.textContent!==label)s.spiritButton.textContent=label;
        s.spiritButton.style.opacity=reason?'.88':'';
      }
