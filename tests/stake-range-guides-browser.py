"""Actual canvas guide strokes: all stake types, ownership, expiry, selection and zoom."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
from skill_preview_audit_support import SETUP
OUT=ROOT/'_local/reports/mage-volley-gate/guides';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw,serve_game() as url:
 browser=launch(pw);page=browser.new_page(viewport={'width':1280,'height':900});page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP);page.evaluate("startSkill('M07')");page.wait_for_function("HonroApp.preview?.id==='M07'")
 result=page.evaluate('''()=>{const p=HonroApp.preview,C=HONRO_CORE,e=p.e,b=p.b,c=p.canvas.getContext('2d');p.hold=true;const rows=[],hero=p.hero;
 for(const id of ['M07','M08','M09','M10','M99'])for(const side of [0,1])for(const zoom of [.2,1]){
  const enemy={...hero,id:'guide-enemy',side:1};b.units=[hero,enemy];b.active=hero.id;b.round=1;const owner=side===0?hero:enemy;
  const z={id:77,skill:id,owner:owner.id,side,x:700,y:1000,rank:8,damage:100,shot:0,expires:4};b.stakes=[z];const strokes=[],arcs=[],texts=[],stroke=c.stroke.bind(c),arc=c.arc.bind(c),text=c.fillText.bind(c);
  c.stroke=()=>{strokes.push({dash:c.getLineDash(),color:c.strokeStyle,alpha:c.globalAlpha,width:c.lineWidth});return stroke();};c.arc=(...args)=>{arcs.push(args);return arc(...args);};c.fillText=(...args)=>{texts.push(args[0]);return text(...args);};
  c.save();c.setTransform(zoom,0,0,zoom,0,0);C.drawStakes(c,e,0,zoom,id);c.restore();
  const guides=strokes.filter(s=>s.dash.length),ranges=C.stakeRanges(e,z),ok=guides.length>0&&Math.abs(guides[0].width*zoom-1.2)<1e-6&&Math.abs(guides[0].alpha-(side===0?.54:.24))<1e-6&&guides.every(s=>side===0?s.color!=='#d6988b':s.color==='#d6988b')&&texts.some(t=>t.includes('3턴'))&&(id==='M09'||arcs.some(a=>Math.abs(a[2]-ranges.effect)<1e-8));
  const count=strokes.length;z.expires=b.round;C.drawStakes(c,e,0,zoom,id);const expired=strokes.length===count;
  c.stroke=stroke;c.arc=arc;c.fillText=text;rows.push({id,side,zoom,ranges,guides,ok,expired});
 }return rows;}''')
 browser.close()
assert all(r['ok'] and r['expired'] for r in result),result
(OUT/'canvas-strokes.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('PASS 20 actual canvas cases: five stakes × two owners × two zooms, selected/deselected and expired visibility')
