      function enterNormal51(app,grant,carried){
        const m=grant.packet.map,d=grant.packet.mission;
        check(carried.profile===app.profile&&app.profile===app.normalProfile&&!app.engine,'Normal Stage51 rest changed');
        const p=structuredClone(app.profile),roles=grant.packet.owner.actors.filter(u=>u.side===1);
        const fields=['level','h','r','focus','maxFocus','loadout','ranks','armor','name','honroType','honroVariant','fixed','flying','facing','hp','maxHp','attack','combatBaseHp','combatBaseAttack','honroDifficulty','honroAirborneBalanceRevision','honroCampaignEnemyDamageRevision'];
        const st={...m,id:'stage-51',metadata:{stageId:51,campaign:true,act:6,actStage:1},units:m.units.map(u=>{
          if(u.team!=='enemy')return u;
          const a=roles.find(x=>x.id===u.id);check(a&&a.cls===u.kind&&a.x===u.x&&a.y===u.y,'Signed normal foe recipe mismatch');
          return {...u,stageOverrides:Object.fromEntries(fields.filter(k=>Object.hasOwn(a,k)).map(k=>[k,structuredClone(a[k])]))};
        })};
        const project={...G.HONRO_PROJECT,stages:[st],library:grant.packet.library};
        const content=Object.freeze({id:51,local:51,region:6,act:6,actStage:1,active:4,requires:[50],name:d.name,goal:d.marks[0].label,objective:d.objective,w:st.width,h:st.height,story:[],outro:[],wind:[0],victoryRule:{kind:'scripted',target:'act6-owned-51'}});
        const progression=G.HonroProgression;
        for(let i=46;i<=50;i++){
          const q=progression.plan(i),r=progression.budget(i);
          check(q?.act===5&&q.rewardCurve==='current'&&q.entryLevel===q.exitLevel&&r?.start===r?.end&&r?.total===0&&r.combat===0,'Failed existing zero-increment horizon');
        }
        const {entryLevel,exitLevel,rewardCurve}=progression.plan(50);
        const budget=Object.freeze({id:51,act:6,entryLevel,exitLevel,rewardCurve,balanceStatus:'detached-zero-increment-horizon'});
        const b=normal51Provider.begin(st,project,p,content,budget,o=>G.HonroMaps.createBattle(st,project,p,o));
        check(b?.mode==='campaign'&&b.stageId===51&&normal51Provider.content(b)===content&&b.honroGrowth?.limit.total===0&&b.honroGrowth.limit.combat===0,'No exact stock campaign battle');
        const actors=b.units.filter(u=>u.side===0&&!u.summoned);
        const identity=u=>[u.id,u.cls,u.hp,u.maxHp,u.focus,u.maxFocus,u.shield,u.level,u.loadout,u.ranks,u.equipmentState??null];
        check(same(actors.map(identity),carried.actors.map(identity)),'Campaign factory changed trained rest bodies');
        const projections=[[b.terrain,d.shape.playSHA],[b.honroWorldTerrain,d.shape.worldSHA]];
        for(const [value,expected] of projections){
          const key=JSON.stringify(value);check(new Map(grant.known).get(key)===expected,'Stock campaign projection drift');fingerprints.set(key,expected);
        }
        const mission={...d,runtimeReleaseEnabled:true}, packet={...grant.packet,mission};
        const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
        const state={old,b,packet,terminal:null,ordinaryRest:true,normal51:true};
        app.close();active.set(app,state);manifest.rows[51]=mission;
        Object.assign(app,{stageId:51,stage:content,training:false,selectedByUnit:{}});
        try{
          app.mount(b,{freshReport:true,reportScope:'custom'});
          check(state.engine===app.engine&&app.engine.stage===content&&app.profile===app.normalProfile&&app.scene&&app.screen==='battle','Stock normal Stage51 mount refused');
          const ui=appUI(app);check(ui,'Normal battle objective owner is absent');
          const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';styleAction(button);
          button.textContent=d.marks[0].label;button.addEventListener('click',event=>{if(event.isTrusted&&event.currentTarget===button)action(app,event);});
          state.button=button;ui.append(button);return true;
        }catch(error){app.stopBattle();app.showTitle();throw error;}
      }
