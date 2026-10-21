"""Only the four skillGeometry users. Separate emission, visible pixels, and combat assertions."""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
from skill_preview_audit_support import SETUP
OUT=ROOT/'_local/reports/skill-preview-geometry';OUT.mkdir(parents=True,exist_ok=True)
PIXELS=r'''()=>{const p=auditP,g=p.metrics.geometryDetails[0],cv=p.canvas,ctx=cv.getContext('2d'),r=cv.getBoundingClientRect(),sx=cv.width/r.width,sy=cv.height/r.height,data=ctx.getImageData(0,0,cv.width,cv.height).data,points=[];
for(const path of HONRO_CORE.geometryPaths(g))for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/12));for(let j=0;j<n;j++)points.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});}
let sampled=0,lit=0,inside=0;for(const v of points){if(p.b.units.some(u=>Math.abs(u.x-v.x)<u.r+14&&v.y>=u.y-u.h-14&&v.y<=u.y+14))continue;const x=Math.round((r.width/2+(v.x-p.scene.x)*p.scene.scale)*sx),y=Math.round((r.height/2+(v.y-p.scene.y)*p.scene.scale)*sy);sampled++;if(x<3||x>=cv.width-3||y<3||y>=cv.height-3)continue;inside++;let white=false;for(let dy=-3;dy<=3&&!white;dy++)for(let dx=-3;dx<=3;dx++){const i=((y+dy)*cv.width+x+dx)*4,a=data[i],b=data[i+1],c=data[i+2];if(Math.min(a,b,c)>185&&Math.max(a,b,c)-Math.min(a,b,c)<50){white=true;break;}}if(white)lit++;}
return{kind:g.kind,sampled,inside,lit,litFraction:lit/Math.max(1,sampled),insideFraction:inside/Math.max(1,sampled),age:p.age,scale:p.scene.scale};}'''
rows=[];errors=[]
with sync_playwright() as pw, serve_game() as base_url:
 b=launch(pw);p=b.new_page(viewport={'width':1280,'height':1000});p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base_url+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate(SETUP)
 p.add_script_tag(content=(ROOT/'tests/skill-preview-expectations.mjs').read_text().replace('export function','function'))
 for width in [1280,360]:
  p.set_viewport_size({'width':width,'height':1000 if width==1280 else 800})
  for id in ['M03','M12','M14','M15']:
   p.evaluate('id=>startSkill(id)',id);p.wait_for_function('HonroApp.preview');p.evaluate('prepareAudit();auditP.precise=true');shell=p.locator('.skill-preview-shell');shell.scroll_into_view_if_needed()
   emitted=p.evaluate("()=>{while(auditP.age<12&&!auditP.metrics.geometryDetails.length)HonroSkillPreview.tick(HonroApp,auditP,1/60);return auditP.age}")
   assert p.evaluate('auditP.metrics.geometryDetails.length>0'),id
   emission=p.evaluate(PIXELS);shell.screenshot(path=str(OUT/f'{id}-{width}-emission.png'))
   p.evaluate('t=>advanceAudit(t)',emitted+.12);visible=p.evaluate(PIXELS);shell.screenshot(path=str(OUT/f'{id}-{width}-visible.png'))
   p.evaluate('t=>advanceAudit(t)',emitted+.32);linger=p.evaluate(PIXELS);shell.screenshot(path=str(OUT/f'{id}-{width}-linger.png'))
   r=p.evaluate('finishAudit()');row={'id':id,'width':width,'emission':emission,'visible':visible,'linger':linger,'combatChecks':r['checks'],'grounded':r['grounded'],'unchanged':r['unchanged']}
   row['pixelAssertion']=visible['insideFraction']>.90 and visible['litFraction']>.35 and visible['litFraction']>emission['litFraction']+.1
   rows.append(row);print('PASS' if row['pixelAssertion'] else 'FAIL',id,width,'emission',emission,'visible',visible,flush=True)
 b.close()
(OUT/'checks.json').write_text(json.dumps({'ids':['M03','M12','M14','M15'],'rows':rows,'errors':errors},ensure_ascii=False,indent=2))
assert not errors,errors
assert len(rows)==8 and all(r['pixelAssertion'] and all(c['ok'] for c in r['combatChecks']) and r['grounded'] and r['unchanged'] for r in rows),'Geometry pixels and real combat must both be verified'
