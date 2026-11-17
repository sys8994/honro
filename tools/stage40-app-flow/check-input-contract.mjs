import fs from 'node:fs';import assert from 'node:assert/strict';
for(const name of ['play.py','escort_inputs.py']){
 const s=fs.readFileSync('tools/stage40-app-flow/'+name,'utf8');
 for(const re of [/\b(?:e|engine)\.fire\s*\(/,/\.tick\s*\(/,/HonroStory\.finish\s*\(/,/localStorage\.setItem\s*\(/,/\b(?:b\.phase|u\.hp|q\.complete|q\.returnEscort)\s*=(?!=)/]){
  assert(!re.test(s),name+' contains forbidden direct battle/input mutation '+re);
 }
}
const p=fs.readFileSync('tools/stage40-app-flow/play.py','utf8');
for(const token of ["aim_with_joystick(p,plan['angle'],state)","p.keyboard.down('Space')","p.keyboard.up('Space')","p.keyboard.press('Digit'","새 지형에서 다시 걷기"])assert(p.includes(token),token+' missing');
assert(!p.includes("get_by_text('전투 처음부터'"),'No battle reset path');
console.log('UI-only input contract passed; read-only trajectory helpers allowed.');
