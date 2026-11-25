import sys
from pathlib import Path
p=Path(sys.argv[1])
for n in (58,59):
 f=p/f'browser-normal{n}.js'
 s=f.read_text()
 js="\nconst images=globalThis.__finaleFrames={};\nconst snap=()=>{try{\n const boss=e.unit('a6-c08-boss'), node=e.unit('a6-c08-expansion-node');\n const enemies=b.units.filter(u=>u.side===1&&!u.dead);\n const ctx=state(), p=ctx?.phase??ctx?.flags?.phase;\n let k=null,x,y,z;\n if(b.honroStage===58&&boss&&!boss.dead){\n  k=p===3&&node&&!node.dead?'58-phase3':p===2?'58-phase2':'58-boss';\n  x=(boss.x+(e.active?.x??boss.x-200))/2;y=boss.y-130;z=.48;\n }else if(b.honroStage===59){\n  if(enemies.length>=8&&b.round>=2){k='59-second-wave';x=3250;y=2820;z=.24;}\n  else if(enemies.length>=5){k='59-first-wave';x=3800;y=2630;z=.29;}\n  else if(enemies.length>1){k='59-bridge-before-wave';x=3300;y=2820;z=.39;}\n }\n if(!k||images[k])return;\n const scene=a.scene, canvas=scene?.canvas??a.root.querySelector('canvas');if(!canvas?.toDataURL)return;\n const saved={x:scene.x,y:scene.y,scale:scene.scale,manual:scene.manual,focusUntil:scene.focusUntil,speakerUntil:scene.speakerUntil};\n const mobile=window.innerWidth<500;\n const render=()=>scene.render(e,0,'',0,false,0);\n render();\n const normal=canvas.toDataURL('image/png');\n try {Object.assign(scene,{x,y,scale:mobile?z*.83:z,manual:true,focusUntil:0,speakerUntil:0});render();\n  images[k]={normal,focus:canvas.toDataURL('image/png'),round:b.round,phase:p,side:b.side,shot:b.shot,active:e.active?.id,enemies:enemies.map(u=>[u.id,u.x,u.y,u.hp,u.level]),camera:[scene.x,scene.y,scene.scale],warning:ctx?.warning??null};\n } finally {Object.assign(scene,saved);}\n }catch(error){globalThis.__finaleCaptureError=String(error);}};\n"
 s=s.replace('return (function*()',js+'\nreturn (function*()',1)
 if n==58:
  s=s.replace('function tick(){totalTicks++;a.missionTick(1/120);}','function tick(){totalTicks++;a.missionTick(1/120);if(totalTicks%4===0)snap();}')
 else:
  s=s.replace('a.missionTick(dt);};','a.missionTick(dt);if(ticks%4===0)snap();};')
 f.write_text(s)
f=p/'normal_late_witness.py'
s=f.read_text()
s='import base64\n'+s
point='    page.evaluate("delete globalThis.__normalLate")'
assert point in s
s=s.replace(point,'''    frames=page.evaluate("()=>globalThis.__finaleFrames||{}")
    error=page.evaluate("()=>globalThis.__finaleCaptureError||null")
    for name, record in frames.items():
        for field in ('normal','focus'):
            uri=record.pop(field)
            assert uri.startswith('data:image/png;base64,')
            (out/f'{case}-frame-{name}-{field}.png').write_bytes(base64.b64decode(uri.split(',',1)[1]))
    (out/f'{case}-frame-{stage}-index.json').write_text(json.dumps({'frames':frames,'captureError':error},ensure_ascii=False,indent=2))
    page.evaluate("()=>{delete globalThis.__finaleFrames; delete globalThis.__finaleCaptureError}")'''+chr(10)+point)
f.write_text(s)
