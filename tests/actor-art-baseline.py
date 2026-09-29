"""One-time source measurement and full-size visual input for the actor design pass."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/actor-forge'
with sync_playwright() as p:
    b=launch(p);page=b.new_page(viewport={'width':1500,'height':1000});page.goto((OUT/'baseline.html').as_uri())
    result=page.evaluate(r'''()=>{
      const cv=document.createElement('canvas');cv.width=1600;cv.height=1500;document.body.append(cv);const c=cv.getContext('2d');c.fillStyle='#192a2c';c.fillRect(0,0,1600,1500);const scene=Object.create(HonroScene.prototype);scene.time=scene.walkTime=0;
      const rows=ActorCatalog.map((d,i)=>{let anchors=0,controls=0,paths=0,ellipses=0;const proxy=new Proxy(c,{get(t,k){const v=t[k];if(typeof v!=='function')return v;return(...args)=>{if(k==='moveTo'||k==='lineTo')anchors++;if(k==='quadraticCurveTo'){anchors++;controls++;}if(k==='bezierCurveTo'){anchors++;controls+=2;}if(k==='beginPath')paths++;if(k==='arc'||k==='ellipse')ellipses++;if(k==='fillRect'||k==='strokeRect')anchors+=4;return v.apply(t,args);};},set(t,k,v){t[k]=v;return true;}});
        const x=i%5*320+160,y=Math.floor(i/5)*370+323,u={x,y,h:220,r:24,facing:1,angle:0,hp:100,maxHp:100,...d.unit};scene.unitBody(proxy,u);c.fillStyle='#dedbc8';c.font='17px sans-serif';c.fillText(d.name,x-140,y+30);return{id:d.id,name:d.name,anchors,controls,paths,ellipses,unit:d.unit,family:d.family};});
      return{sources:ActorBaselineSources,assets:Object.fromEntries(rows.map(r=>[r.id,r])),image:cv.toDataURL()};}''')
    import base64
    (OUT/'before-roster.png').write_bytes(base64.b64decode(result.pop('image').split(',')[1]));b.close()
path=ROOT/'tests/fixtures/actor-baseline.json'
assert not path.exists(),'Do not overwrite the original baseline'
path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v['anchors'] for k,v in result['assets'].items()},ensure_ascii=False))
