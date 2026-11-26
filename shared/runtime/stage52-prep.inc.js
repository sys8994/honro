      const prepSlots=['personal','common'];
      const prepNames={archer:'설오',mage:'담허',knight:'휘겸',occultist:'소단'};
      function add52Preparation(app,state,controls){
        const button=document.createElement('button');
        button.type='button';button.dataset.act6ThresholdPrep='';button.hidden=true;
        button.textContent='전열 정비';styleAction(button);
        controls.append(button);
        state.prepButton=button;
        button.addEventListener('click',event=>{
          if(!event.isTrusted||active.get(app)!==state||!runtime(app)||app.done||app.dialogue||
            app.modal.classList.contains('open'))return;
          const e=state.engine,actors=owner.thresholdParty(app,e);
          if(!actors){app.notify('네 사람이 종터에 모이면 정비할 수 있습니다.');return;}
          app.open('<h2 id="act6-prep-title">전열 정비</h2><p>담허가 안으로 들기 전, 네 사람의 장비와 기예를 바꿀 수 있습니다. 체력과 혼기는 회복되지 않습니다.</p><div data-prep-roster></div><p data-prep-feedback role="status"></p><div class="actions"><button type="button" data-prep-clear>변경 없이 닫기</button><button type="button" class="primary" data-prep-apply>정비 적용</button></div>','act6-threshold-prep');
          app.modal.querySelector('.dialog').setAttribute('aria-labelledby','act6-prep-title');
          const roster=app.modal.querySelector('[data-prep-roster]'),inputs=Object.create(null);
          const select=(name,values,current)=>{
            const label=document.createElement('label'),field=document.createElement('select');
            label.style.cssText='display:grid;gap:3px;margin-block:8px';
            field.style.cssText='min-height:44px;width:100%;max-width:100%;color:#e5d7b6;background:#17231e;border:1px solid #7b6a48;padding:4px 8px';
            label.append(name,field);
            for(const [id,text] of values){const option=new Option(text,id,id===current,id===current);field.add(option);}
            return {label,field};
          };
          for(const u of actors){
            const details=document.createElement('details'),title=document.createElement('summary');
            details.style.cssText='padding-block:8px;border-bottom:1px solid #91878155';
            title.textContent=prepNames[u.cls];details.append(title);roster.append(details);
            const before=state.prepDraft?.[u.cls],available=thresholdPrepChoices(C,app.profile,actors,u);
            inputs[u.cls]={skills:[],gear:[]};
            for(const [i,slot] of prepSlots.entries()){
              const current=before?.gear[i]??u.equipmentIds?.find(id=>C.EQUIPMENT_MAP[id]?.slot===slot)??'';
              const values=available.equipment.filter(id=>C.EQUIPMENT_MAP[id].slot===slot);
              const {label,field}=select(i===0?'전용 장비':'공용 장비',[['','장착 안 함'],...values.map(id=>[id,C.EQUIPMENT_MAP[id].name])],current);
              details.append(label);inputs[u.cls].gear.push(field);
            }
            for(let i=0;i<3;i++){
              const current=before?.skills[i]??u.loadout[i+1]??'';
              const {label,field}=select('기예 '+(i+1),[['','비워 둠'],...available.known.map(id=>[id,C.SKILLS[id].name])],current);
              details.append(label);inputs[u.cls].skills.push(field);
            }
            if(u.cls==='mage')details.open=true;
          }
          app.modal.querySelector('[data-prep-clear]').textContent=state.prepDraft?'정비 취소':'변경 없이 닫기';
          const open=()=>active.get(app)===state&&app.modalKind==='act6-threshold-prep'&&runtime(app);
          app.modal.querySelector('[data-prep-clear]').addEventListener('click',ev=>{
            if(!ev.isTrusted||!open())return;
            state.prepDraft=null;button.textContent='전열 정비';app.close();
          });
          app.modal.querySelector('[data-prep-apply]').addEventListener('click',ev=>{
            if(!ev.isTrusted||!open())return;
            const draft=Object.fromEntries(Object.entries(inputs).map(([key,v])=>[key,{skills:v.skills.map(f=>f.value),gear:v.gear.map(f=>f.value)}]));
            const changes=planThresholdPrep(C,app.profile,actors,draft);
            if(!changes){app.modal.querySelector('[data-prep-feedback]').textContent='같은 기예나 장비가 중복되지 않았는지 확인해 주세요.';return;}
            state.prepDraft=changes.length?draft:null;
            button.textContent=changes.length?'전열 정비 변경':'전열 정비';app.close();
            if(changes.length)app.notify('의식을 시작하면 정비한 구성이 적용됩니다.');
          });
        });
      }
