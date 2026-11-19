"""Initial Stage42 stock actor/support inspection, read-only camera only."""
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
CAMERA="""v=>{const a=HonroApp,s=a.scene;
s.manual=v.manual;s.x=v.x;s.y=v.y;s.scale=v.zoom;HonroBounds.constrain(s,a.engine.b);
return {x:s.x,y:s.y,zoom:s.scale,manual:s.manual};
}"""
def capture_initial(page,out,label,exact=None):
    out=Path(out);before=page.evaluate(API)
    pick=next((u for u in before['actors'] if u['id']==exact),None) if exact else next(
      (u for u in before['actors'] if u['side']==1 and u['support']=='a5-palisade' and u['grounded']
       and not u['flying'] and 1700<=u['x']<=3800 and u['cls']=='archer'),None)
    result={'stage_actors':before,'selected':pick,'shots':[],
            'scope':'initial stock existing actors; read-only camera; no traversed player/case claimed'}
    try:
        probes=[]
        if pick is not None:
            assert pick['support']=='a5-palisade' and pick['grounded'] and not pick['flying']
            probes.append(('actual-grounded-upper-actor',pick['x'],pick['y']-66))
        else:result['actor_evidence']='No qualifying natural grounded upper actor; no actor claim'
        for ident,cx,cy in [*probes,('narrow-west-bend',1360,1970),('narrow-east-bend',1566,1970),('upper-dock',3940,1570)]:
            requested={'x':cx,'y':cy,'zoom':.74,'manual':True}
            clamped=page.evaluate(CAMERA,requested)
            page.wait_for_timeout(100)
            snap=page.evaluate(API)
            assert snap['state']==before['state'] and snap['actors']==before['actors'],'Read-only camera unexpectedly changed actors/objectives'
            assert abs(snap['cam']['x']-clamped['x'])<.01 and abs(snap['cam']['y']-clamped['y'])<.01,'Scene moved off controlled pose'
            page.screenshot(path=str(out/f'{label}-{ident}.png'))
            result['shots'].append({'name':ident,'actual':snap['cam']})
    finally:
        page.evaluate(CAMERA,before['cam'])
        (out/f'{label}-actor-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    return result
