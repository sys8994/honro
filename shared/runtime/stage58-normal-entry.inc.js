      const signed58=new WeakMap(),mounting58=new WeakMap(),mounted58=new WeakMap(),cold58=new WeakSet();
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
          s.move=move;ui.append(move);tick58(a);startAct6Opening(a,s,58);return true;
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
      const finale58Dialogue=Object.freeze({
        column:[
          ['소단','기둥 뒤에서 잡아당기던 게 풀렸어요. 문턱 쪽은 아직 그대로예요.'],
          ['설오','그럼 여기서는 사선을 똑바로 잡겠습니다. 문턱을 넘기 전에 한 번 더 손을 들어 주세요.'],
          ['담허','문 너머에서 먼저 대답하는 것이 있는지 들어 보겠네. 다들 내 뒤로 오게.'],
          ['휘겸','들어갈 사람과 돌아올 사람이 같아야 하오. 우리끼리 먼저 넷부터 셉시다.']
        ],
        threshold:[
          ['대도사','그 진목을 뽑아라. 현묵도 거기서 시작했지. 내가 무엇을 들으려 했는지는 한 번도 묻지 않더군.'],
          ['담허','묻겠습니다. 저문골에서는 그렇게 많은 사람이 죽었는데, 그날 무슨 소리를 들으셨습니까?'],
          ['대도사','처음엔 아무것도. 방을 비워야 들린다 하여, 더 비울 곳을 찾았지.'],
          ['휘겸','당신이 비웠다는 방에 살던 이들에게도 이름이 있었소. 그 사람들을 옮겼다는 기록을 내가 들고 있소.'],
          ['대도사','그 종이에서는 소리가 나지 않는다. 이제 여기서 귀를 기울여 봐라.'],
          ['소단','저한텐 대답으로 안 들려요. 문 밖으로 나가려고 돌을 긁는 것 같아요.'],
          ['설오','말을 더 해도 저 사람은 놓지 않겠습니다. 먼저 제 쪽에서 보이는 것을 끊겠습니다.'],
          ['담허','그래. 문을 조금 더 벌려 보자는 말에는 우리가 대답하지 않겠네.'],
          ['대도사','너희는 저 문이 열리면 누구든 제 갈 곳이 생긴다고 믿는가.'],
          ['소단','누구든 어디로 가야 하는지 제가 정하진 못해요. 그렇다고 여기서 줄을 당기고 있을 수는 없어요.'],
          ['대도사','네가 손을 놓아 잃은 것이 있거든, 다시 와서 나를 탓해라.'],
          ['담허','이 일을 마치고 나면 탓할 사람부터 찾지는 않겠습니다. 제가 아직 바로잡을 수 있는 데부터 돌아보겠습니다.']
        ],
        second:[
          ['설오','방금 같은 데를 겨눴는데 사선이 지난번과 달랐습니다.'],
          ['소단','발 아래도 밀려요. 저 사람 쪽으로 끌려가면 바로 일어나 뛰지 마세요.'],
          ['담허','먼저 진목으로 발밑 한곳만 잡겠네. 저 사람까지 당기려고 넓히지는 말게.'],
          ['휘겸','그러면 붙들린 쪽으로 다 모이지 맙시다. 바깥 턱에 한 사람은 남아야 하오.'],
          ['대도사','위를 보아라. 거기 발 디딜 데가 없다고 누가 가르쳤느냐.'],
          ['설오','저 사람부터 위를 보게 하려는 겁니다. 제가 선 턱으로 오십시오. 여기서는 발이 밀리지 않습니다.'],
          ['소단','한 번 돌아선 사선은 아까 궤적이 아니에요. 쏘기 전에 날아간 재부터 보세요.'],
          ['휘겸','한꺼번에 옮기면 어느 쪽에서 밀렸는지 모르오. 맨 뒤에서 내가 남아 보겠소.']
        ],
        third:[
          ['소단','저 사람이 있는 쪽 말고, 옆에 걸린 매듭도 계속 당겨요.'],
          ['담허','사람에게 이어진 힘이 아니네. 저 받침이 남으면 사람만 멎어도 틈은 그대로야.'],
          ['설오','둘 중 다른 하나가 쓰러져도 사선을 풀지 않겠습니다. 저 매듭을 먼저 볼 수 있는 데로 가겠습니다.'],
          ['휘겸','먼저 맞히겠다고 같은 쪽으로 뛰어들지는 마시오. 문이 또 꺾이면 돌아갈 곳부터 잃소.'],
          ['대도사','내가 쓰러져도 저것은 열릴 것이다. 한 사람의 몸에 문을 건 것은 아니니까.'],
          ['휘겸','그 말을 하는 동안에도 저기서 올라오고 있소. 대답을 들으려면 먼저 거기 선 사람부터 보시오.'],
          ['소단','선 게 아니에요. 갈 데를 찾을 때마다 그 자리에 다시 돌아와요.'],
          ['담허','그러면 사람을 붙잡는 줄부터 끊어야겠네. 저것이 또 불러들일 때까지 기다리진 말게.']
        ],
        stillWorking:[
          ['휘겸','쓰러졌소. 아직 가까이 가지 마시오.'],
          ['소단','사람은 더 안 움직여요. 그런데 옆에 서 있던 매듭은 아직 떨려요.'],
          ['담허','그게 남아 있으면 자리도 남는 걸세. 저 사람이 일어날까 기다릴 게 아니라 그쪽을 끊어야 하네.'],
          ['설오','저쪽이 보입니다. 몸 가까이 모이지 마십시오. 한 번 더 겨누겠습니다.']
        ],
        bothStopped:[
          ['설오','사람도, 옆에 걸려 있던 것도 둘 다 움직이지 않습니다.'],
          ['소단','저 소리는 남아 있어요. 끊은 쪽 말고, 그 너머에서 계속 들려요.'],
          ['담허','누가 부르는지 확인하러 더 안으로 들어갈 일은 없네. 벌어진 데만 우리가 바로잡고 나가세.'],
          ['휘겸','저 사람한테 할 말이 더 있었소. 이제 그 말은 밖에 남은 사람한테 하겠소.'],
          ['소단','그럼 진목을 놓는 동안 제가 틈을 볼게요. 떠나는 것은 지나가게 두세요.'],
          ['담허','이 절까지 오면 윗대에 무슨 일이 있었는지 낱낱이 물을 수 있을 줄 알았네. 그럴 사람도 이미 다 가고 없군.'],
          ['설오','지금은 들어올 때 우리를 지켜 준 사람들한테 먼저 돌아갑시다.'],
          ['휘겸','내가 이쪽을 보겠소. 곽진이 문을 못 열고 있더라도 밖에서 그를 부르지는 마시오. 내가 먼저 찾겠소.'],
          ['소단','저도 돌아가요. 이번에는 밖에서 줄 잡고 계신 분이 아무도 없잖아요.']
        ],
        stake:[
          ['담허','이번엔 붙잡아 둘 만큼만 박았네. 나가려는 혼을 막지 않도록 저 뜬 곳은 그대로 두게.'],
          ['소단','네. 줄을 놓친 것들이 저 틈을 보고 있어요. 제가 다시 잡지는 않을게요.'],
          ['휘겸','곽진이 지켜 준 문으로 갑시다. 지나갈 때마다 뒤를 돌아보시오.'],
          ['설오','각자 넘어가신 뒤에 부르십시오. 마지막 대답을 듣고 저도 나오겠습니다.']
        ]
      });
      function speak58State(a,s,r){
        const f=r.flags;if(!f?.bossManifested||f.stake||r.failed||r.complete)return;
        const key=f.bossDead&&f.nodeDead?'bothStopped':f.bossDead&&!f.nodeDead?'stillWorking':!f.bossDead&&r.phase===3&&!f.nodeDead?'third':!f.bossDead&&r.phase===2?'second':null;
        if(key)showAct6Milestone(a,s,key,finale58Dialogue[key]);
      }
      function stage58UI(a,s,e){
        if(!scope58(a,e,s))return;
        const id=s.owner58.project()?.targets?.[0]?.id;if(!id)return;
        const q=s.owner58.interact(id);if(!q.ok)a.notify(q.reason);e.checkEnd();tick58(a);a.updateHUD(true);if(q.ok)showAct6Milestone(a,s,id,finale58Dialogue[id]);
      }
      function tick58(a){
        const s=active.get(a),e=a.engine;if(e?.b?.honroStage!==58||!scope58(a,e,s)||!s.owner58)return;
        s.owner58.tick();const r=s.owner58.project();if(!r)return;
        if(s.button){s.button.textContent=r.summary;s.button.disabled=!r.targets.length;s.button.dataset.act6Mission=r.targets?.[0]?.id??'';}
        if(s.move){s.move.hidden=!r.skipReturn;s.move.disabled=s.move.hidden;}
        if((r.complete||r.failed)&&!a.done)e.checkEnd();else speak58State(a,s,r);
      }
      function terminalNormal58(a,s){
        if(!scope58(a,s.engine,s)||s.b.phase!=='won'||s.owner58.project()?.complete!==true)return null;
        return s.owner58.terminal();
      }
