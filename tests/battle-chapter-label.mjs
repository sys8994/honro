import assert from 'node:assert/strict';
import {appHarness,report} from './app-regression-helpers.mjs';
const h=await appHarness(),a=h.load(h.profileThrough(29)),checks=[];
for(const st of h.g.HONRO_CONTENT.stages){a.stage=st;a.stageId=st.id;const html=a.battleTitleMarkup();assert(html.includes(`${st.act||1}막 ${st.actStage||st.id}장`));assert.equal((html.match(/battle-chapter/g)||[]).length,1);assert(html.indexOf('battle-chapter')<html.indexOf('<b>'));assert(html.includes(`<b>${st.name}</b>`));}
checks.push('All 30 canonical chapter labels appear once, to the left of the unchanged place name');
a.training=true;assert.equal(a.battleTitleMarkup(),'<b>허공터</b>');a.training=false;
a.customMap={stageId:'custom',project:{stages:[{id:'custom',metadata:{}}]}};a.stage={name:'긴 사용자 지도 <장소>'};assert(!a.battleTitleMarkup().includes('battle-chapter'));assert(a.battleTitleMarkup().includes('&lt;장소&gt;'));a.customMap.project.stages[0].metadata.campaign=true;assert(a.battleTitleMarkup().includes('3막 10장'));
checks.push('Training and noncampaign custom maps have no false campaign label; authored names are escaped');
await report('battle-chapter-label',checks);console.log(checks.join('\n'));
