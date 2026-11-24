      const mounted54=new WeakMap(),charts54Steps=Object.freeze(['N>L','L>C','C>L']);
      const scope54=(app,e,s)=>s===active.get(app)&&!!s?.normal51&&app.engine===e&&app.stageId===54&&s.b===e.b&&mounted54.get(e)===s&&
        app.profile===app.normalProfile&&e.b.mode==='campaign'&&e.b.honroCanonical===true&&e.b.honroCustom===false&&normal51Provider.content(e.b)===e.stage&&
        e.b.honroGrowth?.limit.total===0&&e.b.honroGrowth?.limit.combat===0&&runtime(app);
      async function prepareNormal54(packet,known){
        const chart=await createStage54ChartOwner({C,domain:G.HonroTerrainDomain,charts:packet.charts,
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
          same(t.external,prev.incoming53.external),'Actual 53 chart predecessor changed');
        const spawn=grant.packet.spawn,support=grant.packet.charts.N.terrain.find(x=>x.id===spawn.support),y=C.topAt(support,spawn.x);
        check(spawn.x===250&&spawn.support==='foothill'&&Number.isFinite(y),'Invalid native foothill arrival');
        const st={...m,metadata:{stageId:54,campaign:true,act:6,actStage:4},units:[{id:mage.id,kind:'mage',team:'player',x:spawn.x,y}]};
        const project={...G.HONRO_PROJECT,stages:[st],library:grant.packet.library},p=structuredClone(app.profile);
        const content=Object.freeze({...e.stage,id:54,local:54,actStage:4,active:1,requires:[53],name:'거꾸로 선 처마',goal:'처마의 세 방향 확인',
          objective:'act6-gallery-charts',w:st.width,h:st.height,wind:[0],victoryRule:{kind:'scripted',target:'act6-native-54'}});
        const budget=normal51Provider.budget(e.b);check(budget?.id===53,'Missing 53 budget quote');
        const b=normal51Provider.begin(st,project,p,content,Object.freeze({...budget,id:54}),o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b&&b.stageId===54&&b.honroStage===54&&Array.isArray(b.units)&&b.units.length===1&&b.units[0]?.id===mage.id,'Wrong normal 54 bodies');
        for(const [v,h] of [[b.terrain,grant.known[0][1]],[b.honroWorldTerrain,grant.known[1][1]]]){
          const k=JSON.stringify(v);check(new Map(grant.known).get(k)===h,'Stage54 N terrain mismatch');fingerprints.set(k,h);
        }
        const u=b.units[0];
        for(const k of [...carryFields,'equipmentIds','gearBonuses','attack','armor','maxMove','walkSpeed','regen']){
          if(Object.hasOwn(mage,k))u[k]=structuredClone(mage[k]);else delete u[k];
        }
        Object.assign(u,{x:spawn.x,y,spawnX:spawn.x,spawnY:y,vx:0,vy:0,moveLeft:u.maxMove,airborne:false,jumping:false});
        check(C.validTerrainContactPose(b.terrain,u),'Original Damheo cannot stand on 54 foothill');
        b.honroGeometryReady=true;b.honroGeometryRevision=2;b.honroContactRevision=2;
        app.stopBattle();
        const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
        const s={old,b,packet:grant.packet,previous:t,terminal:null,ordinaryRest:true,normal51:true,owner54:grant.chart};
        active.set(app,s);app.close();
        Object.assign(app,{stageId:54,stage:content,training:false,selectedByUnit:{}});
        try{
          app.mount(b,{freshReport:true,reportScope:'custom'});
          check(app.engine===s.engine&&app.engine.stage===content&&app.scene&&app.screen==='battle','Normal 54 chart mount failed');
          const ui=appUI(app);check(ui,'Normal 54 controls absent');const button=document.createElement('button');
          button.type='button';button.dataset.act6QaLookout='';styleAction(button);button.textContent='첫 받침에서 건너기';
          button.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===button)action(app,event);});s.button=button;ui.append(button);return true;
        }catch(error){app.stopBattle();app.showTitle();throw error;}
      }
      function bindNormal54(app,e,s){
        mounted54.set(e,s);
        check(s.owner54.mount(app,e,s),'Normal 54 chart owner refused');
        s.engine=e;e.checkEnd=()=>app.checkMission(e);return true;
      }
      function chart54Input(app,s,e){
        const i=s.owner54.inspect(app,e),id=charts54Steps[i?.chart.length];if(!id||i?.pending)return false;
        const q=s.owner54.chart(app,e,id);if(!q.ok)app.notify(q.reason);if(q.ok)app.updateHUD(true);return q.ok;
      }
      function chart54Aim(app,e,u){
        const s=active.get(app),c=s?.owner54?.inspect(app,e);
        return !!c&&e.active===u&&c.frame==='L'&&!c.pending&&c.chart.length===3&&!c.m09&&e.grounded(u)&&u.x>=2334&&u.x<=2340&&
          e.contactSurface(u.x,u.y-4,u.y+4)?.t.id==='mid-contact';
      }
      function tick54(app){
        const s=active.get(app),e=app.engine;
        if(e?.b.honroStage!==54||!s?.owner54)return;
        const landed=s.owner54.observe(app,e), p=s.owner54.project(app,e),info=s.owner54.inspect(app,e);
        if(landed&&s.button)s.button.textContent=info.chart.length===3?'돌턱에 진목 놓기':'다음 받침에서 건너기';
        if(landed)app.updateHUD(true);
        if(p.complete&&!app.done)e.checkEnd();
      }
