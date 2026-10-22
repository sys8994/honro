"""Check deployed restoration and real file-import/Continue of a legacy baked save."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/narrative-voice-v2-integration';OUT.mkdir(parents=True,exist_ok=True)
expected={name:json.loads((ROOT/'shared/data'/file).read_text()) for name,file in [('HONRO_WATERWORKS_V2','waterworks-v2-content.json'),('HONRO_NARRATIVE_CATALOGUE','narrative-current.json'),('HONRO_NARRATIVE_COMPAT','narrative-compat-v1.json'),('HONRO_STAGE_CONTRACTS','stage-contracts.json')]}
with serve_game() as base,sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady')
 actual=page.evaluate('names=>Object.fromEntries(names.map(name=>[name,globalThis[name]]))',list(expected));assert actual==expected,'Browser-restored current/compat/contracts differ from canonical JSON'
 page.get_by_role('button',name='설정',exact=True).click()
 data=page.evaluate('''async()=>{const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let n=1;n<12;n++)p.cleared[n]={visits:1,rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;for(const cls of p.recruited)p.heroes[cls].xp=HONRO_CORE.xpAtLevel(20);a.profile=p;a.normalProfile=p;await HonroCampaignLoader.ensureStage(12);a.launch(12);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;const battle=a.engine.b;delete battle.honroNarrativeCatalogueRevision;delete battle.honroNarrativeContent;battle.honroQuarryRevision=1;battle.honroQuarryContent=structuredClone(HONRO_NARRATIVE_COMPAT.effective[11]);const rows=structuredClone(battle.honroQuarryContent.story);HonroStory.start(a,rows,{id:'pooled-import-baked'});a.dialogue.index=1;const hero=battle.units.find(u=>u.side===0&&!u.summoned);hero.hp-=7;hero.focus-=3;hero.cooldowns={A06:2};HonroStory.save(a);a.persist();return {profile:JSON.parse(localStorage.getItem('honro-first-act-profile-1')),lines:a.dialogue.lines,index:a.dialogue.index,vitals:battle.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,hp:u.hp,focus:u.focus,cooldowns:u.cooldowns})),markers:battle.honroMarkers};}''')
 page.evaluate('HonroApp.showTitle()')
 page.locator('#file-import').set_input_files({'name':'legacy-baked.json','mimeType':'application/json','buffer':json.dumps(data['profile'],ensure_ascii=False).encode()})
 page.wait_for_function('HonroApp.screen==="title"&&HonroApp.profile.honroBattle?.honroStory?.id==="pooled-import-baked"')
 page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"&&!!HonroApp.dialogue')
 restored=page.evaluate('''()=>({lines:HonroApp.dialogue.lines,index:HonroApp.dialogue.index,vitals:HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,hp:u.hp,focus:u.focus,cooldowns:u.cooldowns})),markers:HonroApp.engine.b.honroMarkers})''')
 for key in ['lines','index','vitals','markers']:assert restored[key]==data[key],key
 assert not errors,errors;b.close()
(OUT/'pool-browser.json').write_text(json.dumps({'restoredGlobalsEqual':list(expected),'legacyStage12BakedFileImportContinue':True,'preserved':['lines','cursor','HP','MP','cooldowns','quest markers'],'errors':errors},indent=2)+'\n')
print('PASS deployed globals equal canonical JSON; real legacy stage12 baked file import/Continue preserves rows, cursor, vitals and quest markers')
