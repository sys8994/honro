"""Initial Stage42 stock actor/support inspection, read-only camera only."""
import base64
import json
from pathlib import Path
API="""()=>{
const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,s=a.scene;
if(b.honroStage!==42||b.honroCustom||!HonroAct5.active(b)||a.dialogue||b.round!==1||b.side!==0||b.phase!=='aim'||(b.honroState.act5?.step??0)!==0)throw Error('Expected untouched stock initial aim');
const actors=b.units.filter(u=>!u.dead&&u.hp>0&&!u.honroAct5Reserve).map(u=>{
 const grounded=!!e.grounded(u),contact=grounded?e.contactSurface(u.x,u.y-4,u.y+4):null;
 return{ id:u.id,cls:u.cls,side:u.side,x:u.x,y:u.y,h:u.h,fixed:!!u.fixed,flying:!!C.flyingEnemy(u),kind:u.honroType??null,
  airborne:!!u.airborne,grounded,support:contact?.t.id??null,footY:contact?.y??null };
});
return {state:[b.round,b.side,b.phase,b.active,b.shot??b.shots??0],actors,cam:{x:s.x,y:s.y,zoom:s.scale,manual:s.manual},view:{width:s.canvas.clientWidth,height:s.canvas.clientHeight}};
}"""
SHOT="""({request,exact,w,h})=>{
 const read=(SNAPSHOT), before=read();
 const live=HonroApp, engine=live.engine, b=engine.b;
 const cv=document.createElement('canvas');
 Object.assign(cv.style,{position:'fixed',left:'-200vw',width:w+'px',height:h+'px'});
 cv.width=w;cv.height=h; document.body.append(cv);
 let png=null, actual=null, target=null, renderError=null;
 try {
  const sc=new HonroScene(cv);
  Object.assign(sc,{manual:true,x:request.x,y:request.y,scale:request.zoom,time:2,editorView:false,skillPreview:false});
  HonroBounds.constrain(sc,b);
  sc.render(engine,0,'',.6,false,0);
  actual={x:sc.x,y:sc.y,zoom:sc.scale,manual:sc.manual};
  const selected=before.actors.find(u=>u.id===exact);
  if(selected)target={screenX:(selected.x-sc.x)*sc.scale+w/2,
    screenY:(selected.y-sc.y)*sc.scale+h/2};
  png=cv.toDataURL('image/png');
 } catch(e){renderError=String(e.message||e);}
 finally{cv.remove();}
 return{requested:request,actual,target,png,before,after:read(),renderError};
}""".replace('SNAPSHOT',API)

def _diff(before,after):
    x={u['id']:u for u in before['actors']}; y={u['id']:u for u in after['actors']}
    return {k:[x.get(k),y.get(k)] for k in sorted(x.keys() | y.keys()) if x.get(k)!=y.get(k)}

def capture_initial(page,out,label,exact='a5-foe-7'):
    out=Path(out); before=page.evaluate(API)
    pick=next((u for u in before['actors'] if u['id']==exact),None)
    result={'stage_actors':before,'selected':pick,'shots':[],'failures':[],
        'scope':'same mounted stock engine, independent camera canvas, no input/mutation; initial view only'}
    views=[('narrow-west-bend',1360,1970),('narrow-east-bend',1566,1970),('upper-dock',3940,1570)]
    if pick: views.insert(0,('actual-grounded-upper-actor',pick['x'],pick['y']-66))
    tests=result['failures']
    if not (pick and pick['support']=='a5-palisade' and pick['grounded'] and not pick['flying'] and not pick['airborne']
            and pick['cls']=='archer' and abs(pick['y']-pick['footY'])<=.01):
        tests.append('named natural archer not grounded on expected physical support')
    try:
        for ident,cx,cy in views:
            vals={'request':{'x':cx,'y':cy,'zoom':.74},'exact':exact,'w':1280,'h':800}
            shot=page.evaluate(SHOT,vals)
            png=shot.pop('png')
            if png and png.startswith('data:image/png;base64,'):
                (out/f'{label}-{ident}.png').write_bytes(base64.b64decode(png.split(',',1)[1],validate=True))
            a,b=shot.pop('before'),shot.pop('after')
            changes=_diff(a,b)
            flags={'stock_phase_equal':a['state']==b['state']==before['state'],
              'live_camera_equal_during_render':a['cam']==b['cam'],
              'full_actor_roster_equal_during_render':not changes,
              'named_actor_start_equal':next((u for u in a['actors'] if u['id']==exact),None)==pick,
              'preview_camera_manual':bool(shot['actual'] and shot['actual']['manual']),
              'screenshot_saved':bool(png)}
            if ident=='actual-grounded-upper-actor':
                t=shot['target']
                flags['named_actor_in_frame']=bool(t and 0<=t['screenX']<1280 and 0<=t['screenY']<800)
            result['shots'].append({'name':ident,**shot,'checks':flags,'exact_actor_deltas':changes,
              'live_camera_before':a['cam'],'live_camera_after':b['cam'],
              'state_before':a['state'],'state_after':b['state']})
            tests.extend(ident+': '+k for k,ok in flags.items() if not ok)
            if shot['renderError']: tests.append(ident+': '+shot['renderError'])
    finally:
        (out/f'{label}-actor-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    if tests: raise RuntimeError('; '.join(tests))
    return result
