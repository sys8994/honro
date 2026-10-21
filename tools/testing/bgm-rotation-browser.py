"""Actual local MP3 playback; ended events accelerated, not a listening review."""
import json,sys
from pathlib import Path
from urllib.parse import unquote,urlsplit
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from story_browser_server import story_base_url
from playwright.sync_api import sync_playwright
OUT=ROOT/'game/docs/evidence/intro-bar-bgm-2026-10-21';OUT.mkdir(parents=True,exist_ok=True);rows=[]
with sync_playwright() as p:
 b=launch(p)
 for width,height in [(390,844),(1280,800)]:
  c=b.new_context(viewport={'width':width,'height':height},is_mobile=width<700,has_touch=width<700);pg=c.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)));pg.goto(story_base_url()+'/HONRO.html');pg.wait_for_function('document.documentElement.dataset.honroReady');pg.get_by_role('button',name='설정',exact=True).click()
  def playing(n):
   pg.wait_for_function('n=>HonroApp.audio.music.status().track===n&&HonroApp.audio.music.current.currentTime>.05&&!HonroApp.audio.music.current.paused',arg=n)
   pg.wait_for_function('(title)=>document.getElementById("bgm-now-playing").textContent===title',arg=['떠나지 못한 이들을 위해','고갯길의 징조','머리 위의 불길','재가 흩날리는 밤','산 자와 남은 자'][n-1])
   return pg.evaluate('HonroApp.audio.music.current.currentSrc')
  playing(1);pg.locator('#modal button.close').click();pg.evaluate('HonroApp.debugMode=true;HonroApp.launch(1)');playing(2)
  order=[2]
  for n in [3,4,5,2]:
   pg.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))");playing(n);order.append(n);assert pg.evaluate('HonroApp.audio.music.current.loop') is False
  pg.evaluate('HonroApp.launch(10)');playing(3);assert pg.evaluate('HonroApp.audio.music.state')=='battle'
  pg.evaluate('HonroApp.launch(21)');playing(4);pg.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))");src=playing(5)
  pg.wait_for_function('HonroAuthoredFarArt.ready(21)');pg.wait_for_function('HonroApp.audio.music.outgoing===null')
  pg.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp)');pg.locator('#turn-banner').wait_for(state='hidden');pg.screenshot(path=str(OUT/f'bgm05-stage21-{width}.png'))
  pg.evaluate('window.keptAudio=HonroApp.audio.music.current;window.keptTime=keptAudio.currentTime;HonroApp.settings()');assert pg.evaluate('keptAudio===HonroApp.audio.music.current&&keptAudio.currentTime>=keptTime')
  pg.locator('#setting-music').uncheck();pg.wait_for_function('HonroApp.audio.music.current.paused');pg.locator('#setting-music').check();playing(5);assert pg.evaluate('keptAudio===HonroApp.audio.music.current')
  pg.evaluate('HonroApp.profile.settings.musicVolume=0;HonroApp.audio.configure(HonroApp.profile.settings)');assert pg.evaluate('HonroApp.audio.music.current.paused');pg.evaluate('HonroApp.profile.settings.musicVolume=.4;HonroApp.audio.configure(HonroApp.profile.settings)');playing(5)
  pg.locator('#modal button.close').click();pg.evaluate('HonroApp.showRest()');playing(1);assert not errors;assert not pg.evaluate('HonroApp.audio.music.errors')
  rows.append({'width':width,'order':order,'stage10Track':3,'stage21Track':5,'stage21File':unquote(urlsplit(src).path),'settingsMuteVolumePreserved':True,'restTrack':1,'pageerrors':errors});c.close()
 # Real failed fetch on 05 advances to the next available battle song.
 c=b.new_context();pg=c.new_page()
 def route(r):
  if unquote(urlsplit(r.request.url).path).split('/')[-1].startswith('05 '):r.abort()
  else:r.continue_()
 pg.route('**/*.mp3',route);pg.goto(story_base_url()+'/HONRO.html');pg.wait_for_function('document.documentElement.dataset.honroReady');pg.get_by_role('button',name='설정',exact=True).click();pg.evaluate('HonroApp.close();HonroApp.launch(1)');pg.wait_for_function('HonroApp.audio.music.status().track===2')
 for n in [3,4]:pg.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))");pg.wait_for_function('n=>HonroApp.audio.music.status().track===n',arg=n)
 pg.evaluate("HonroApp.audio.music.current.dispatchEvent(new Event('ended'))");pg.wait_for_function('HonroApp.audio.music.errors.length>0&&HonroApp.audio.music.status().track===2&&HonroApp.audio.music.current.currentTime>.05');rows.append({'failed05SkippedTo02':True,'error':pg.evaluate('HonroApp.audio.music.errors')});c.close();b.close()
(OUT/'bgm-checks.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps(rows,ensure_ascii=False))
