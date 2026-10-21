"""A13 only: observe real steering, descending impact, persistence, and the modal shell."""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
from skill_preview_audit_support import SETUP
OUT=ROOT/'_local/reports/skill-preview-a13';OUT.mkdir(parents=True,exist_ok=True)
OBSERVE=r'''()=>{const p=auditP,steer=p.e.steer.bind(p.e);window.a13={turns:[],path:[],apex:Infinity,drop:0,totalTurn:0};
p.e.steer=(...v)=>{const q=steer(...v),delta=Math.atan2(Math.sin(Math.atan2(q.vy,q.vx)-Math.atan2(v[3],v[2])),Math.cos(Math.atan2(q.vy,q.vx)-Math.atan2(v[3],v[2])))*180/Math.PI;
if(Math.abs(delta)>.001){a13.totalTurn+=Math.abs(delta);a13.turns.push({age:p.age,x:v[0],y:v[1],before:{vx:v[2],vy:v[3]},after:{vx:q.vx,vy:q.vy},delta});}return q;};}'''
STEP=r'''()=>{const p=auditP;HonroSkillPreview.tick(HonroApp,p,1/60);const q=p.b.projectiles.find(q=>q.skill==='A13');if(q){a13.apex=Math.min(a13.apex,q.y);a13.drop=Math.max(a13.drop,q.y-a13.apex);a13.path.push({age:p.age,x:q.x,y:q.y,vx:q.vx,vy:q.vy,drop:q.y-a13.apex});}
return{age:p.age,apex:!!q&&q.vy>=0,steering:!!q&&q.y-a13.apex>75&&a13.totalTurn>20,descent:!!q&&q.y-a13.apex>200,hit:p.metrics.damage>0};}'''
rows=[];errors=[]
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);page=b.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP)
 page.add_script_tag(content=(ROOT/'tests/skill-preview-expectations.mjs').read_text().replace('export function','function'))
 for width in [1280,360]:
  page.set_viewport_size({'width':width,'height':1000 if width==1280 else 800})
  for rank in [1,8]:
   page.evaluate('''rank=>{startSkill('A13');HonroApp.profile.heroes.archer.ranks.A13=rank;HonroApp.talent('A13');auditProfile=JSON.stringify(HonroApp.profile);auditStorage=JSON.stringify(localStorage);}''',rank)
   page.wait_for_function('HonroApp.preview');page.evaluate('prepareAudit();auditP.precise=true');page.evaluate(OBSERVE);page.evaluate('advanceAudit(.3)');shell=page.locator('.skill-preview-shell');shell.scroll_into_view_if_needed();prefix=f'A13-r{rank}-{width}'
   shell.screenshot(path=str(OUT/f'{prefix}-start.png'));page.screenshot(path=str(OUT/f'{prefix}-modal.png'))
   milestones={}
   for frame in range(720):
    s=page.evaluate(STEP)
    for label in ['apex','steering','descent','hit']:
     if s[label] and label not in milestones:
      shell.screenshot(path=str(OUT/f'{prefix}-{label}.png'));milestones[label]=s['age']
    if s['hit']:break
   page.evaluate('t=>advanceAudit(t)',s['age']+.6);shell.screenshot(path=str(OUT/f'{prefix}-result.png'))
   r=page.evaluate('''()=>{const r=finishAudit(),head=document.querySelector('.skill-detail-controls').getBoundingClientRect(),body=document.querySelector('.skill-modal-body').getBoundingClientRect(),x=document.querySelector('.skill-modal-title .close').getBoundingClientRect();return{...r,observation:a13,aim:auditP.aim,ui:{headerAboveBody:body.top>=head.bottom-1,closeTouch:x.width>=43&&x.height>=43,closeVisible:x.top>=0&&x.bottom<=innerHeight},casts:auditP.metrics.casts};}''')
   r.update({'width':width,'rank':rank,'milestones':milestones});rows.append(r)
   ok=len(milestones)==4 and r['observation']['totalTurn']>20 and r['observation']['drop']>200 and r['unchanged'] and r['grounded'] and all(c['ok'] for c in r['checks']) and all(r['ui'].values()) and len(r['casts'])==1 and r['aim']=={'angle':65,'power':.55}
   r['passed']=ok;print('PASS' if ok else 'FAIL',width,rank,'turn',round(r['observation']['totalTurn'],2),'drop',round(r['observation']['drop'],2),r['milestones'],r['ui'],flush=True)
   (OUT/'checks.json').write_text(json.dumps({'skill':'A13','rows':rows,'errors':errors},ensure_ascii=False,indent=2))
 b.close()
assert not errors,errors
assert len(rows)==4 and all(r['passed'] for r in rows)
