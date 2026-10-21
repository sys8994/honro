"""Every registered player skill: real render, trigger, grounding, isolated persistence.
Core assertions are shared with the 168 execution native audit. No result is painted.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'_local/reports/skill-preview-audit';OUT.mkdir(parents=True,exist_ok=True)
from skill_preview_audit_support import SETUP
rows=[];errors=[]
with sync_playwright() as pw, serve_game() as base_url:
 b=launch(pw);p=b.new_page(viewport={'width':1280,'height':1000});p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base_url+'/HONRO.html');p.wait_for_function('window.HonroApp')
 p.add_script_tag(content=(ROOT/'tests/skill-preview-expectations.mjs').read_text().replace('export function','function'))
 p.evaluate(SETUP);ids=p.evaluate('auditIds');assert len(ids)==84
 for width in [1280,360]:
  p.set_viewport_size({'width':width,'height':1000 if width==1280 else 800})
  for id in ids:
   p.evaluate('id=>startSkill(id)',id);p.wait_for_function('HonroApp.preview');p.evaluate('prepareAudit()');p.evaluate("id=>auditP.precise=['M03','M12','M14','M15'].includes(id)",id);p.evaluate('advanceAudit(.3)')
   shell=p.locator('.skill-preview-shell') if p.locator('.skill-preview-shell').count() else p.locator('#previewcanvas')
   shell.scroll_into_view_if_needed()
   if width==1280:shell.screenshot(path=str(OUT/f'{id}-start.png'))
   core=p.evaluate("""()=>{const p=auditP;let core=null;while(p.age<24){HonroSkillPreview.tick(HonroApp,p,1/60);if(auditPreview(HonroSkillPreview.snapshot(p)).every(c=>c.ok)){core=p.age;break;}}p.force=true;HonroSkillPreview.tick(HonroApp,p,0);p.force=false;return core;}""")
   # Geometry fades in from zero opacity; capture actual visible animation, not only damage emission.
   if core is not None and id in ['M03','M12','M14','M15']:p.evaluate('t=>advanceAudit(t)',core+.12)
   visible_at=p.evaluate('auditP.age')
   if width==1280:shell.screenshot(path=str(OUT/f'{id}-core.png'))
   p.evaluate('t=>advanceAudit(t)',min(24,(core or 22)+1.5))
   shell.screenshot(path=str(OUT/f'{id}-result-{width}.png'))
   r=p.evaluate('finishAudit()');r.update({'id':id,'width':width,'coreAt':core,'visibleAt':visible_at});rows.append(r)
   ok=core is not None and r['grounded'] and r['unchanged'] and all(c['ok'] for c in r['checks']);print('PASS' if ok else 'FAIL',width,id,'core',core,[c['name'] for c in r['checks'] if not c['ok']],flush=True)
   (OUT/'browser.json').write_text(json.dumps({'registered':ids,'executions':len(rows),'rows':rows,'errors':errors},ensure_ascii=False,indent=2))
 b.close()
assert not errors,errors
assert len(rows)==168 and all(r['coreAt'] is not None and r['grounded'] and r['unchanged'] and all(c['ok'] for c in r['checks']) for r in rows),'Every registered skill must satisfy the real browser contract at both widths'
