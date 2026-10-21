"""Selected visual-review repairs only; never rerun the entire registry implicitly."""
import json,sys
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
from skill_preview_audit_support import SETUP
ids=sys.argv[1:]
assert ids,'Pass the affected skill IDs explicitly'
OUT=ROOT/'_local/reports/skill-preview-focused';OUT.mkdir(parents=True,exist_ok=True)
milestones={
 'AP01':{'complete-volley':'auditP.age>4.5&&!auditP.b.volley&&!auditP.b.projectiles.length'},
 'A10':{'prepared':'!!auditP.hero.prepared'},
 'A11':{'apex':'auditP.b.projectiles.some(q=>q.apex)'},
 'A12':{'outbound':'auditP.b.projectiles.some(q=>!q.returning&&q.x>650)','returning':'auditP.b.projectiles.some(q=>q.returning&&q.x>650)'},
 'A13':{'flight':'auditP.b.projectiles.some(q=>q.x>650&&q.x<900)'},
 'A15':{'split':'auditP.b.projectiles.filter(q=>q.child).length>1'},
 'M02':{'bounce':'auditP.b.projectiles.some(q=>q.bounces>0)'},
 'M06':{'secondary':'auditP.b.projectiles.some(q=>q.secondary&&q.age>.12)'},
 'MP01':{'secondary':'auditP.b.projectiles.some(q=>q.secondary&&q.age>.12)'},
 'MP02':{'regeneration':'auditP.b.round>=2&&auditP.hero.focus>auditP.initial.hero.focus'},
 'S04':{'dive':'auditP.follow&&auditP.b.projectiles.some(q=>q.body)'},
 'S09':{'flight':'auditP.b.projectiles.some(q=>q.x>600&&q.x<800)'},
 'S13':{'followup':'auditP.metrics.hits.filter(h=>h.target.startsWith("preview-target")).length>=2'},
 'O02':{'explosion':'auditP.metrics.damage>50'},
 'O04':{'through-wall':'auditP.b.projectiles.some(q=>q.x>740&&q.x<810)'},
 'O05':{'returning':'auditP.b.projectiles.some(q=>q.wraithState==="return"&&q.x<1200&&q.x>1050)','return-hit':'auditP.metrics.hits.length>2'},
 'O11':{'summoned':'auditP.b.units.some(u=>u.summonKind==="stalker")'},
 'O12':{'summon-shot':'auditP.b.projectiles.some(q=>q.mode==="summonBolt"&&q.age>.03)'},
 'O15':{'echo-shot':'auditP.b.projectiles.some(q=>q.echoSource)&&auditP.b.projectiles.length>=2'},
 'O16':{'converging':'auditP.b.projectiles.filter(q=>q.curve&&Math.hypot(q.x-q.curve.goal.x,q.y-q.curve.goal.y)<150&&q.age-(q.curve.delay||0)>q.curve.duration*.75).length>=4'},
 'OP01':{'trap':'auditP.b.occultTraps?.length>0'},
 'OP04':{'alive-summon':'auditP.b.units.some(u=>u.summoned&&!u.dead)'},
}
rows=[];errors=[]
with sync_playwright() as pw,serve_game() as base_url:
 b=launch(pw);p=b.new_page(viewport={'width':1280,'height':1000});p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base_url+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate(SETUP)
 p.add_script_tag(content=(ROOT/'tests/skill-preview-expectations.mjs').read_text().replace('export function','function'))
 for width in [1280,360]:
  p.set_viewport_size({'width':width,'height':1000 if width==1280 else 800})
  for id in ids:
   p.evaluate('id=>startSkill(id)',id);p.wait_for_function('HonroApp.preview');p.evaluate('prepareAudit();auditP.precise=true');shell=p.locator('.skill-preview-shell');shell.scroll_into_view_if_needed();p.evaluate('advanceAudit(.3)');shell.screenshot(path=str(OUT/f'{id}-{width}-start.png'))
   pending=dict(milestones.get(id,{}));captured={};core=None;render_checks=[]
   for frame in range(1440):
    status=p.evaluate('''()=>{HonroSkillPreview.tick(HonroApp,auditP,1/60);return {age:auditP.age,ok:auditPreview(HonroSkillPreview.snapshot(auditP)).every(c=>c.ok)};}''')
    for label,predicate in list(pending.items()):
     if p.evaluate(predicate):
      shell.screenshot(path=str(OUT/f'{id}-{width}-{label}.png'));captured[label]=p.evaluate('HonroSkillPreview.snapshot(auditP)');del pending[label]
      if id=='OP01' and label=='trap':
       pixels=p.evaluate('''()=>{const p=auditP,t=p.b.occultTraps[0],r=p.canvas.getBoundingClientRect(),d=p.canvas.width/r.width,z=p.scene.scale,size=Math.max(1,.65/z),x=r.width/2+(t.x-p.scene.x)*z,y=r.height/2+(t.y-15*size-p.scene.y)*z,ctx=p.canvas.getContext('2d'),a=ctx.getImageData(Math.round((x-7)*d),Math.round((y-9)*d),Math.round(14*d),Math.round(18*d)).data;let n=0;for(let i=0;i<a.length;i+=4)if(a[i]>180&&a[i+1]>160&&a[i+2]>110&&a[i+2]<185)n++;return n;}''')
       render_checks.append({'name':'actual residual charm marker has visible parchment pixels','pixels':pixels,'ok':pixels>10})
    if status['ok'] and core is None:
     core=status['age'];shell.screenshot(path=str(OUT/f'{id}-{width}-core.png'))
     if id in ['M04','M05']:
      p.evaluate('t=>advanceAudit(t)',core+.12);shell.screenshot(path=str(OUT/f'{id}-{width}-visible.png'))
    if core is not None and status['age']>core+1.5 and not pending:break
   shell.screenshot(path=str(OUT/f'{id}-{width}-result.png'));r=p.evaluate('finishAudit()');r.update({'id':id,'width':width,'coreAt':core,'milestones':captured,'missingMilestones':list(pending),'renderChecks':render_checks});rows.append(r);print(id,width,core,'missing',list(pending),flush=True)
   (OUT/('checks-'+ '-'.join(ids)+'.json')).write_text(json.dumps({'ids':ids,'rows':rows,'errors':errors},ensure_ascii=False,indent=2))
 b.close()
assert not errors,errors
assert all(r['coreAt'] is not None and not r['missingMilestones'] and r['grounded'] and r['unchanged'] and all(c['ok'] for c in r['checks']+r['renderChecks']) for r in rows)
