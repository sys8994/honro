// Ownership move: retain the existing algorithm and image lifecycle byte for byte.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='5154db899d3c9f62012c87b4f943cd44f2c3e676';
const original=execFileSync('git',['show',`${base}:shared/runtime/skill-images.js`],{encoding:'utf8'});
const current=readFileSync('shared/runtime/skill-images.js','utf8');
const renderer=readFileSync('shared/runtime/camp-renderer.js','utf8');
const start=original.indexOf('// Scoped armory reconciliation.'),end=original.indexOf('function retry(){',start);
const moved=original.slice(start,end).replace("if(old.matches('[data-skill-icon]')&&old.dataset.skillIcon===next.dataset.skillIcon)return;","if(G.HonroSkillImages.canRetainHost(old,next))return;").replace('sync(root,shell);scan(root);','sync(root,shell);G.HonroSkillImages.scan(root);');
assert.equal(renderer,"(function(G){'use strict';\n"+moved+"G.HonroCampRenderer={patch};\n})(globalThis);\n");
const contract="// Camp reconciliation may retain this host without touching image/decode state.\nfunction canRetainHost(old,next){return old.matches('[data-skill-icon]')&&old.dataset.skillIcon===next.dataset.skillIcon;}\n";
assert.equal(current, (original.slice(0,start)+contract+original.slice(end)).replace('={readyURL,patch,retry,status:','={readyURL,canRetainHost,scan,retry,status:'));
const main=readFileSync('shared/runtime/main.js','utf8'),oldMain=execFileSync('git',['show',`${base}:shared/runtime/main.js`],{encoding:'utf8'});
assert.equal(main,oldMain.replace('if(G.HonroSkillImages)G.HonroSkillImages.patch(this.root,html);else this.root.innerHTML=html;','G.HonroCampRenderer.patch(this.root,html);'));
const build=readFileSync('shared/build.mjs','utf8');
assert(build.indexOf("file('shared/runtime/skill-images.js')")<build.indexOf("file('shared/runtime/camp-renderer.js')"));
assert(build.indexOf("file('shared/runtime/camp-renderer.js')")<build.indexOf("for(const name of ['campaign-entry'"));
console.log('PASS exact camp reconciliation move, unchanged image lifecycle, mandatory owner/order and no legacy alias');
