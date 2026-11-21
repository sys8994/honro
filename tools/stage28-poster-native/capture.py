"""Exact normal compiled A/B via native camera, no served payload interception."""
import base64,io,math,os,re,sys,time,json,traceback
from pathlib import Path
from PIL import Image
from statistics import median
from guard import Q,P,MF,sha,facts,save
from playwright.sync_api import sync_playwright
DIRECTIONS={'north':(0,-1),'east':(1,0),'south':(0,1),'west':(-1,0),'northwest':(-1,-1),'northeast':(1,-1),'southwest':(-1,1),'southeast':(1,1)}
OBS=json.loads((Q/'stock-observer.json').read_bytes())
PARK=(Q/'park.js').read_text(); VERIFY=(Q/'observe.js').read_text()
WARM_NORTH={'witnessArtifact': 14716303705, 'phase1': {'bytes': 148895, 'sha256': '341178607e56844ac7c95de31c3e897e868a173776a8c71533c1c3b89e9b7bf8'}, 'phase2': {'bytes': 148896, 'sha256': '25663b11decb190899b1d45122ad2fb7a683af00c679433c38a2a1faac104595'}, 'phase1BackgroundBytes': 0, 'phase2BackgroundBytes': 1010880, 'phase2BackgroundSize': [390, 648], 'diagnosticRelease': 'acb51f4ee1c5afa90751dc256d6ad8d900732779'}  # Independent actual stock stage28 mobile north witness.
SCREEN=r"""() => {
 const s=HonroApp.scene,c=s.canvas,r=s.renderCacheStats();
 const caches=['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache'].map(k=>{
  const q=s[k]; return {registered:typeof q?.key==='string',size:q?.canvas?[q.canvas.width,q.canvas.height]:null,bytes:q?.bytes??null};
 });
 const fields=['worldBuilds','bgBuilds','screenBuilds','screenWorldBytes','screenBackgroundBytes','screenForegroundBytes',
   'worldBytes','worldScale','backgroundBytes','domainCanvasAllocations','domainTileBuilds'];
 if(fields.some(k=>r[k]!=null&&!Number.isFinite(r[k])))throw Error('invalid native cache counters');
 return {caches,structural:Object.fromEntries(fields.map(k=>[k,r[k]??0])),
   hits:Object.fromEntries(['worldHits','bgHits','screenHits'].map(k=>[k,r[k]??0])),
   backing:[c.width,c.height]};
}"""
PREFIX_WITNESSES={14714262330: '892433b4d9a6d4e92a522d38ed931af8c6c3e368587269c1a5b766e3bd81ceb6', 14715185043: '47551547c819b5a9764575b3ab86553a0c9b5be0a2dd362fbbe7b5b670092382'}
CONTROL_PREFIX={'s03-1440x900': {'north': {'png': {'bytes': 1230690, 'sha256': '4fabb8c43cb0c62d287f07c31d441fdff667055e97dc3167036a6298dede18b9'}, 'physics': {'actual': {'x': 2865.01, 'y': 0, 'scale': 0.21176470588235294}, 'actualDrawOwnerIDs': ['act1-site:3:body', 'act1-site:3:ferry', 'act1-site:3:landmarks', 'act1-site:3:lantern', 'act1-site:3:spirit-flame'], 'actualTerrainIDs': ['ferry-ground', 'naru-bank', 'naru-west-pier', 'naru-east-pier', 'naru-shore', 'naru-stone-a', 'naru-stone-b', 'naru-approach-step'], 'backing': [1440, 769], 'css': [1440, 769.1875], 'dpr': 1, 'focus': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'phase': 'aim', 'physics': 'd0c3fe6c5df8aeeb1c1cfa0d06b240f6cdf15abdc003a64353c4a6c763d120e7', 'play': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -1200, 'top': -900, 'right': 6930.02, 'bottom': 4535.01}, 'unitCount': 16, 'viewport': {'left': -534.9899999999998, 'right': 6265.01, 'top': -1816.1371527777778, 'bottom': 1816.1371527777778}}, 'artifact': 14714262330, 'archivedDecodedImages': 89}, 'east': {'png': {'bytes': 1072862, 'sha256': '411fb632894bf753d3d8169152b68ea90ca1bbfa899f14ee1c73640eba65b0e5'}, 'physics': {'actual': {'x': 5730.02, 'y': 1517.505, 'scale': 0.21176470588235294}, 'actualDrawOwnerIDs': ['act1-site:3:body', 'act1-site:3:ferry', 'act1-site:3:landmarks', 'act1-site:3:lantern', 'act1-site:3:spirit-flame'], 'actualTerrainIDs': ['ferry-ground', 'naru-bank', 'naru-west-pier', 'naru-east-pier', 'naru-shore', 'naru-stone-a', 'naru-stone-b', 'naru-approach-step'], 'backing': [1440, 769], 'css': [1440, 769.1875], 'dpr': 1, 'focus': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'phase': 'aim', 'physics': 'd0c3fe6c5df8aeeb1c1cfa0d06b240f6cdf15abdc003a64353c4a6c763d120e7', 'play': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -1200, 'top': -900, 'right': 6930.02, 'bottom': 4535.01}, 'unitCount': 16, 'viewport': {'left': 2330.0200000000004, 'right': 9130.02, 'top': -298.6321527777777, 'bottom': 3333.642152777778}}, 'artifact': 14714262330, 'archivedDecodedImages': 89}, 'south': {'png': {'bytes': 571812, 'sha256': '2b21cc5ab8c19e7a57fafe03390032d37b14b673a4a65fc78570bd4b6891941b'}, 'physics': {'actual': {'x': 2865.01, 'y': 3035.01, 'scale': 0.21176470588235294}, 'actualDrawOwnerIDs': ['act1-site:3:body', 'act1-site:3:ferry', 'act1-site:3:landmarks', 'act1-site:3:lantern', 'act1-site:3:spirit-flame'], 'actualTerrainIDs': ['ferry-ground', 'naru-bank', 'naru-west-pier', 'naru-east-pier', 'naru-shore', 'naru-stone-a', 'naru-stone-b', 'naru-approach-step'], 'backing': [1440, 769], 'css': [1440, 769.1875], 'dpr': 1, 'focus': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'phase': 'aim', 'physics': 'd0c3fe6c5df8aeeb1c1cfa0d06b240f6cdf15abdc003a64353c4a6c763d120e7', 'play': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -1200, 'top': -900, 'right': 6930.02, 'bottom': 4535.01}, 'unitCount': 16, 'viewport': {'left': -534.9899999999998, 'right': 6265.01, 'top': 1218.8728472222224, 'bottom': 4851.147152777778}}, 'artifact': 14714262330, 'archivedDecodedImages': 89}}, 's03-390x844': {'north': {'png': {'bytes': 247588, 'sha256': '03ed698f4966f415e7f11c99f0ae9c13fb97703716489b76d1ff23bc30b22d72'}, 'physics': {'actual': {'x': 2865.01, 'y': 0, 'scale': 0.057352941176470586}, 'actualDrawOwnerIDs': ['act1-site:3:body', 'act1-site:3:ferry', 'act1-site:3:landmarks', 'act1-site:3:lantern', 'act1-site:3:spirit-flame'], 'actualTerrainIDs': ['ferry-ground', 'naru-bank', 'naru-west-pier', 'naru-east-pier', 'naru-shore', 'naru-stone-a', 'naru-stone-b', 'naru-approach-step'], 'backing': [390, 648], 'css': [390, 647.609375], 'dpr': 1, 'focus': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'phase': 'aim', 'physics': 'd0c3fe6c5df8aeeb1c1cfa0d06b240f6cdf15abdc003a64353c4a6c763d120e7', 'play': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -1200, 'top': -900, 'right': 6930.02, 'bottom': 4535.01}, 'unitCount': 16, 'viewport': {'left': -534.9899999999998, 'right': 6265.01, 'top': -5645.82532051282, 'bottom': 5645.82532051282}}, 'artifact': 14714262330, 'archivedDecodedImages': 89}, 'east': {'png': {'bytes': 208339, 'sha256': 'caa1eb29043280006e1636fcf1942ae9a8e0a95d4289ed82133376b681db794f'}, 'physics': {'actual': {'x': 5730.02, 'y': 1517.505, 'scale': 0.057352941176470586}, 'actualDrawOwnerIDs': ['act1-site:3:body', 'act1-site:3:ferry', 'act1-site:3:landmarks', 'act1-site:3:lantern', 'act1-site:3:spirit-flame'], 'actualTerrainIDs': ['ferry-ground', 'naru-bank', 'naru-west-pier', 'naru-east-pier', 'naru-shore', 'naru-stone-a', 'naru-stone-b', 'naru-approach-step'], 'backing': [390, 648], 'css': [390, 647.609375], 'dpr': 1, 'focus': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'phase': 'aim', 'physics': 'd0c3fe6c5df8aeeb1c1cfa0d06b240f6cdf15abdc003a64353c4a6c763d120e7', 'play': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -1200, 'top': -900, 'right': 6930.02, 'bottom': 4535.01}, 'unitCount': 16, 'viewport': {'left': 2330.0200000000004, 'right': 9130.02, 'top': -4128.32032051282, 'bottom': 7163.33032051282}}, 'artifact': 14714262330, 'archivedDecodedImages': 89}, 'south': {'png': {'bytes': 173115, 'sha256': '5cdd1d4fccccf3f108a23b56096ea80aa43b74110cfbfb137cbce032e498b00b'}, 'physics': {'actual': {'x': 2865.01, 'y': 3035.01, 'scale': 0.057352941176470586}, 'actualDrawOwnerIDs': ['act1-site:3:body', 'act1-site:3:ferry', 'act1-site:3:landmarks', 'act1-site:3:lantern', 'act1-site:3:spirit-flame'], 'actualTerrainIDs': ['ferry-ground', 'naru-bank', 'naru-west-pier', 'naru-east-pier', 'naru-shore', 'naru-stone-a', 'naru-stone-b', 'naru-approach-step'], 'backing': [390, 648], 'css': [390, 647.609375], 'dpr': 1, 'focus': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'phase': 'aim', 'physics': 'd0c3fe6c5df8aeeb1c1cfa0d06b240f6cdf15abdc003a64353c4a6c763d120e7', 'play': {'left': 0, 'top': 0, 'right': 5730.02, 'bottom': 3035.01}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -1200, 'top': -900, 'right': 6930.02, 'bottom': 4535.01}, 'unitCount': 16, 'viewport': {'left': -534.9899999999998, 'right': 6265.01, 'top': -2610.81532051282, 'bottom': 8680.83532051282}}, 'artifact': 14714262330, 'archivedDecodedImages': 89}}, 's27-1440x900': {'north': {'png': {'bytes': 183319, 'sha256': 'dfda86c63451594cbf5215b8d727c463d92f90af7aa962fdccba658d59159f2f'}, 'physics': {'actual': {'x': 4100, 'y': -1800, 'scale': 0.21176470588235294}, 'actualDrawOwnerIDs': ['a3-waterworks-v3:27:broken-haul-bridge', 'a3-waterworks-v3:27:entry-haul-stairs', 'a3-waterworks-v3:27:far-passage-buttress', 'a3-waterworks-v3:27:far-passage-wall', 'a3-waterworks-v3:27:gallery-lamp-0', 'a3-waterworks-v3:27:gallery-lamp-1', 'a3-waterworks-v3:27:gallery-lamp-2', 'a3-waterworks-v3:27:gallery-lamp-3', 'a3-waterworks-v3:27:gallery-lamp-4', 'a3-waterworks-v3:27:gallery-lamp-5', 'a3-waterworks-v3:27:gallery-lamp-6', 'a3-waterworks-v3:27:gallery-lamp-7', 'a3-waterworks-v3:27:haul-number-0', 'a3-waterworks-v3:27:haul-number-1', 'a3-waterworks-v3:27:haul-number-2', 'a3-waterworks-v3:27:haul-number-3', 'a3-waterworks-v3:27:haul-number-4', 'a3-waterworks-v3:27:haul-number-5', 'a3-waterworks-v3:27:haul-number-6', 'a3-waterworks-v3:27:haul-number-7', 'a3-waterworks-v3:27:household-inspection-dais', 'a3-waterworks-v3:27:inspection-lamp', 'a3-waterworks-v3:27:ledger-room-west-wall', 'a3-waterworks-v3:27:loading-office-east-wall', 'a3-waterworks-v3:27:loading-oil-lamp', 'a3-waterworks-v3:27:manifest-bundle', 'a3-waterworks-v3:27:manifest-stairs', 'a3-waterworks-v3:27:masonry-vault', 'a3-waterworks-v3:27:numbered-family-bundle', 'a3-waterworks-v3:27:return-inspection-stairs', 'a3-waterworks-v3:27:sunk-family-tools', 'act3-handoff:27:west-quay-masonry', 'stage27-depot-r1:cargo-incline', 'stage27-depot-r1:loading-hoist', 'stage27-depot-r1:quay-face-1', 'stage27-depot-r1:quay-face-3', 'stage27-depot-r1:quay-face-7', 'stage27-depot-r3:far-passage-roof', 'stage27-depot-r3:far-sealed-store', 'stage27-depot-r3:gallery-0', 'stage27-depot-r3:gallery-1', 'stage27-depot-r3:gallery-2', 'stage27-depot-r3:gallery-3', 'stage27-depot-r3:gallery-4', 'stage27-depot-r3:gallery-5', 'stage27-depot-r3:gallery-6', 'stage27-depot-r3:gallery-7', 'stage27-depot-r3:ledger-room-roof', 'stage27-depot-r3:ledger-vault', 'stage27-depot-r3:loading-office-roof', 'stage27-depot-r4:misconnected-rear'], 'actualTerrainIDs': ['deep-unwalkable-basin', 'masonry-vault:collision:0', 'gallery-0:collision:0', 'gallery-1:collision:0', 'gallery-2:collision:0', 'gallery-3:collision:0', 'gallery-4:collision:0', 'gallery-5:collision:0', 'gallery-6:collision:0', 'gallery-7:collision:0', 'entry-haul-stairs:collision:0', 'return-inspection-stairs:collision:0', 'manifest-stairs:collision:0', 'loading-office-roof:collision:0', 'loading-office-east-wall:collision:0', 'far-passage-roof:collision:0', 'far-passage-wall:collision:0', 'far-passage-buttress:collision:0', 'ledger-room-roof:collision:0', 'ledger-room-west-wall:collision:0', 'broken-haul-bridge:collision:0', 'stage27-depot-r1:quay-face-1:collision:0', 'stage27-depot-r1:quay-face-3:collision:0', 'stage27-depot-r1:quay-face-7:collision:0', 'stage27-depot-r1:cargo-incline:collision:0'], 'backing': [1440, 769], 'css': [1440, 769.1875], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 8520, 'bottom': 7440}, 'phase': 'aim', 'physics': '8bb4884c06fe75d7f17fd9a58272decda19e9549c87694d96b9b495d6d9c31df', 'play': {'left': 0, 'top': 0, 'right': 8200, 'bottom': 7200}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 14200, 'bottom': 31200}, 'unitCount': 17, 'viewport': {'left': 700, 'right': 7500, 'top': -3616.137152777778, 'bottom': 16.13715277777783}}, 'artifact': 14715185043, 'archivedDecodedImages': 5}, 'east': {'png': {'bytes': 899088, 'sha256': 'f72afaf0b86581501842f2d7d48fa4e9c5031e6b893ab5bce55ca25e65a261bf'}, 'physics': {'actual': {'x': 8520, 'y': 3600, 'scale': 0.21176470588235294}, 'actualDrawOwnerIDs': ['a3-waterworks-v3:27:broken-haul-bridge', 'a3-waterworks-v3:27:entry-haul-stairs', 'a3-waterworks-v3:27:far-passage-buttress', 'a3-waterworks-v3:27:far-passage-wall', 'a3-waterworks-v3:27:gallery-lamp-0', 'a3-waterworks-v3:27:gallery-lamp-1', 'a3-waterworks-v3:27:gallery-lamp-2', 'a3-waterworks-v3:27:gallery-lamp-3', 'a3-waterworks-v3:27:gallery-lamp-4', 'a3-waterworks-v3:27:gallery-lamp-5', 'a3-waterworks-v3:27:gallery-lamp-6', 'a3-waterworks-v3:27:gallery-lamp-7', 'a3-waterworks-v3:27:haul-number-0', 'a3-waterworks-v3:27:haul-number-1', 'a3-waterworks-v3:27:haul-number-2', 'a3-waterworks-v3:27:haul-number-3', 'a3-waterworks-v3:27:haul-number-4', 'a3-waterworks-v3:27:haul-number-5', 'a3-waterworks-v3:27:haul-number-6', 'a3-waterworks-v3:27:haul-number-7', 'a3-waterworks-v3:27:household-inspection-dais', 'a3-waterworks-v3:27:inspection-lamp', 'a3-waterworks-v3:27:ledger-room-west-wall', 'a3-waterworks-v3:27:loading-office-east-wall', 'a3-waterworks-v3:27:loading-oil-lamp', 'a3-waterworks-v3:27:manifest-bundle', 'a3-waterworks-v3:27:manifest-stairs', 'a3-waterworks-v3:27:masonry-vault', 'a3-waterworks-v3:27:numbered-family-bundle', 'a3-waterworks-v3:27:return-inspection-stairs', 'a3-waterworks-v3:27:sunk-family-tools', 'act3-handoff:27:west-quay-masonry', 'stage27-depot-r1:cargo-incline', 'stage27-depot-r1:loading-hoist', 'stage27-depot-r1:quay-face-1', 'stage27-depot-r1:quay-face-3', 'stage27-depot-r1:quay-face-7', 'stage27-depot-r3:far-passage-roof', 'stage27-depot-r3:far-sealed-store', 'stage27-depot-r3:gallery-0', 'stage27-depot-r3:gallery-1', 'stage27-depot-r3:gallery-2', 'stage27-depot-r3:gallery-3', 'stage27-depot-r3:gallery-4', 'stage27-depot-r3:gallery-5', 'stage27-depot-r3:gallery-6', 'stage27-depot-r3:gallery-7', 'stage27-depot-r3:ledger-room-roof', 'stage27-depot-r3:ledger-vault', 'stage27-depot-r3:loading-office-roof', 'stage27-depot-r4:misconnected-rear'], 'actualTerrainIDs': ['deep-unwalkable-basin', 'masonry-vault:collision:0', 'gallery-0:collision:0', 'gallery-1:collision:0', 'gallery-2:collision:0', 'gallery-3:collision:0', 'gallery-4:collision:0', 'gallery-5:collision:0', 'gallery-6:collision:0', 'gallery-7:collision:0', 'entry-haul-stairs:collision:0', 'return-inspection-stairs:collision:0', 'manifest-stairs:collision:0', 'loading-office-roof:collision:0', 'loading-office-east-wall:collision:0', 'far-passage-roof:collision:0', 'far-passage-wall:collision:0', 'far-passage-buttress:collision:0', 'ledger-room-roof:collision:0', 'ledger-room-west-wall:collision:0', 'broken-haul-bridge:collision:0', 'stage27-depot-r1:quay-face-1:collision:0', 'stage27-depot-r1:quay-face-3:collision:0', 'stage27-depot-r1:quay-face-7:collision:0', 'stage27-depot-r1:cargo-incline:collision:0'], 'backing': [1440, 769], 'css': [1440, 769.1875], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 8520, 'bottom': 7440}, 'phase': 'aim', 'physics': '8bb4884c06fe75d7f17fd9a58272decda19e9549c87694d96b9b495d6d9c31df', 'play': {'left': 0, 'top': 0, 'right': 8200, 'bottom': 7200}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 14200, 'bottom': 31200}, 'unitCount': 17, 'viewport': {'left': 5120, 'right': 11920, 'top': 1783.8628472222222, 'bottom': 5416.137152777777}}, 'artifact': 14715185043, 'archivedDecodedImages': 24}}, 's27-390x844': {'north': {'png': {'bytes': 80351, 'sha256': '9302d760a24b0a105ce13e66ac0adb1b0bdbeecbe8c4173e46bade3ae84ab1e0'}, 'physics': {'actual': {'x': 4100, 'y': -1800, 'scale': 0.057352941176470586}, 'actualDrawOwnerIDs': ['a3-waterworks-v3:27:broken-haul-bridge', 'a3-waterworks-v3:27:entry-haul-stairs', 'a3-waterworks-v3:27:far-passage-buttress', 'a3-waterworks-v3:27:far-passage-wall', 'a3-waterworks-v3:27:gallery-lamp-0', 'a3-waterworks-v3:27:gallery-lamp-1', 'a3-waterworks-v3:27:gallery-lamp-2', 'a3-waterworks-v3:27:gallery-lamp-3', 'a3-waterworks-v3:27:gallery-lamp-4', 'a3-waterworks-v3:27:gallery-lamp-5', 'a3-waterworks-v3:27:gallery-lamp-6', 'a3-waterworks-v3:27:gallery-lamp-7', 'a3-waterworks-v3:27:haul-number-0', 'a3-waterworks-v3:27:haul-number-1', 'a3-waterworks-v3:27:haul-number-2', 'a3-waterworks-v3:27:haul-number-3', 'a3-waterworks-v3:27:haul-number-4', 'a3-waterworks-v3:27:haul-number-5', 'a3-waterworks-v3:27:haul-number-6', 'a3-waterworks-v3:27:haul-number-7', 'a3-waterworks-v3:27:household-inspection-dais', 'a3-waterworks-v3:27:inspection-lamp', 'a3-waterworks-v3:27:ledger-room-west-wall', 'a3-waterworks-v3:27:loading-office-east-wall', 'a3-waterworks-v3:27:loading-oil-lamp', 'a3-waterworks-v3:27:manifest-bundle', 'a3-waterworks-v3:27:manifest-stairs', 'a3-waterworks-v3:27:masonry-vault', 'a3-waterworks-v3:27:numbered-family-bundle', 'a3-waterworks-v3:27:return-inspection-stairs', 'a3-waterworks-v3:27:sunk-family-tools', 'act3-handoff:27:west-quay-masonry', 'stage27-depot-r1:cargo-incline', 'stage27-depot-r1:loading-hoist', 'stage27-depot-r1:quay-face-1', 'stage27-depot-r1:quay-face-3', 'stage27-depot-r1:quay-face-7', 'stage27-depot-r3:far-passage-roof', 'stage27-depot-r3:far-sealed-store', 'stage27-depot-r3:gallery-0', 'stage27-depot-r3:gallery-1', 'stage27-depot-r3:gallery-2', 'stage27-depot-r3:gallery-3', 'stage27-depot-r3:gallery-4', 'stage27-depot-r3:gallery-5', 'stage27-depot-r3:gallery-6', 'stage27-depot-r3:gallery-7', 'stage27-depot-r3:ledger-room-roof', 'stage27-depot-r3:ledger-vault', 'stage27-depot-r3:loading-office-roof', 'stage27-depot-r4:misconnected-rear'], 'actualTerrainIDs': ['deep-unwalkable-basin', 'masonry-vault:collision:0', 'gallery-0:collision:0', 'gallery-1:collision:0', 'gallery-2:collision:0', 'gallery-3:collision:0', 'gallery-4:collision:0', 'gallery-5:collision:0', 'gallery-6:collision:0', 'gallery-7:collision:0', 'entry-haul-stairs:collision:0', 'return-inspection-stairs:collision:0', 'manifest-stairs:collision:0', 'loading-office-roof:collision:0', 'loading-office-east-wall:collision:0', 'far-passage-roof:collision:0', 'far-passage-wall:collision:0', 'far-passage-buttress:collision:0', 'ledger-room-roof:collision:0', 'ledger-room-west-wall:collision:0', 'broken-haul-bridge:collision:0', 'stage27-depot-r1:quay-face-1:collision:0', 'stage27-depot-r1:quay-face-3:collision:0', 'stage27-depot-r1:quay-face-7:collision:0', 'stage27-depot-r1:cargo-incline:collision:0'], 'backing': [390, 648], 'css': [390, 647.609375], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 8520, 'bottom': 7440}, 'phase': 'aim', 'physics': '8bb4884c06fe75d7f17fd9a58272decda19e9549c87694d96b9b495d6d9c31df', 'play': {'left': 0, 'top': 0, 'right': 8200, 'bottom': 7200}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 14200, 'bottom': 31200}, 'unitCount': 17, 'viewport': {'left': 700, 'right': 7500, 'top': -7445.82532051282, 'bottom': 3845.8253205128203}}, 'artifact': 14715185043, 'archivedDecodedImages': 15}, 'east': {'png': {'bytes': 123954, 'sha256': '57ea276f4f78e7a8fa00a5d20b81cf8480b400fee606122e5609880391b7016a'}, 'physics': {'actual': {'x': 8520, 'y': 3600, 'scale': 0.057352941176470586}, 'actualDrawOwnerIDs': ['a3-waterworks-v3:27:broken-haul-bridge', 'a3-waterworks-v3:27:entry-haul-stairs', 'a3-waterworks-v3:27:far-passage-buttress', 'a3-waterworks-v3:27:far-passage-wall', 'a3-waterworks-v3:27:gallery-lamp-0', 'a3-waterworks-v3:27:gallery-lamp-1', 'a3-waterworks-v3:27:gallery-lamp-2', 'a3-waterworks-v3:27:gallery-lamp-3', 'a3-waterworks-v3:27:gallery-lamp-4', 'a3-waterworks-v3:27:gallery-lamp-5', 'a3-waterworks-v3:27:gallery-lamp-6', 'a3-waterworks-v3:27:gallery-lamp-7', 'a3-waterworks-v3:27:haul-number-0', 'a3-waterworks-v3:27:haul-number-1', 'a3-waterworks-v3:27:haul-number-2', 'a3-waterworks-v3:27:haul-number-3', 'a3-waterworks-v3:27:haul-number-4', 'a3-waterworks-v3:27:haul-number-5', 'a3-waterworks-v3:27:haul-number-6', 'a3-waterworks-v3:27:haul-number-7', 'a3-waterworks-v3:27:household-inspection-dais', 'a3-waterworks-v3:27:inspection-lamp', 'a3-waterworks-v3:27:ledger-room-west-wall', 'a3-waterworks-v3:27:loading-office-east-wall', 'a3-waterworks-v3:27:loading-oil-lamp', 'a3-waterworks-v3:27:manifest-bundle', 'a3-waterworks-v3:27:manifest-stairs', 'a3-waterworks-v3:27:masonry-vault', 'a3-waterworks-v3:27:numbered-family-bundle', 'a3-waterworks-v3:27:return-inspection-stairs', 'a3-waterworks-v3:27:sunk-family-tools', 'act3-handoff:27:west-quay-masonry', 'stage27-depot-r1:cargo-incline', 'stage27-depot-r1:loading-hoist', 'stage27-depot-r1:quay-face-1', 'stage27-depot-r1:quay-face-3', 'stage27-depot-r1:quay-face-7', 'stage27-depot-r3:far-passage-roof', 'stage27-depot-r3:far-sealed-store', 'stage27-depot-r3:gallery-0', 'stage27-depot-r3:gallery-1', 'stage27-depot-r3:gallery-2', 'stage27-depot-r3:gallery-3', 'stage27-depot-r3:gallery-4', 'stage27-depot-r3:gallery-5', 'stage27-depot-r3:gallery-6', 'stage27-depot-r3:gallery-7', 'stage27-depot-r3:ledger-room-roof', 'stage27-depot-r3:ledger-vault', 'stage27-depot-r3:loading-office-roof', 'stage27-depot-r4:misconnected-rear'], 'actualTerrainIDs': ['deep-unwalkable-basin', 'masonry-vault:collision:0', 'gallery-0:collision:0', 'gallery-1:collision:0', 'gallery-2:collision:0', 'gallery-3:collision:0', 'gallery-4:collision:0', 'gallery-5:collision:0', 'gallery-6:collision:0', 'gallery-7:collision:0', 'entry-haul-stairs:collision:0', 'return-inspection-stairs:collision:0', 'manifest-stairs:collision:0', 'loading-office-roof:collision:0', 'loading-office-east-wall:collision:0', 'far-passage-roof:collision:0', 'far-passage-wall:collision:0', 'far-passage-buttress:collision:0', 'ledger-room-roof:collision:0', 'ledger-room-west-wall:collision:0', 'broken-haul-bridge:collision:0', 'stage27-depot-r1:quay-face-1:collision:0', 'stage27-depot-r1:quay-face-3:collision:0', 'stage27-depot-r1:quay-face-7:collision:0', 'stage27-depot-r1:cargo-incline:collision:0'], 'backing': [390, 648], 'css': [390, 647.609375], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 8520, 'bottom': 7440}, 'phase': 'aim', 'physics': '8bb4884c06fe75d7f17fd9a58272decda19e9549c87694d96b9b495d6d9c31df', 'play': {'left': 0, 'top': 0, 'right': 8200, 'bottom': 7200}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 14200, 'bottom': 31200}, 'unitCount': 17, 'viewport': {'left': 5120, 'right': 11920, 'top': -2045.8253205128203, 'bottom': 9245.82532051282}}, 'artifact': 14715185043, 'archivedDecodedImages': 32}}, 's29-1440x900': {'north': {'png': {'bytes': 191096, 'sha256': 'f4ea0c77853892bf1f3d35e1dbc5d9388a424cc154de3055255342e4b13ebb56'}, 'physics': {'actual': {'x': 3600, 'y': -1800, 'scale': 0.21176470588235294}, 'actualDrawOwnerIDs': ['act3-handoff:29:west-bank', 'stage29:record-actual-stone-faces', 'stage29:record-archive-eaves', 'stage29:record-far-river-bank', 'stage29:record-inspection-eaves', 'stage29:record-keeper-hut', 'stage29:record-letter-room', 'stage29:record-rear-retaining-work', 'stage29:record-sluice-bearing', 'stage29:record-upper-rear-rail'], 'actualTerrainIDs': ['a3-foundation', 'r29-record-vault', 'old-door', 'r29-upper-ascent', 'r29-high-road', 'r29-inspection-roof', 'r29-inspection-deck', 'r29-low-screen', 'stage29-fallen-door', 'stage29-fallen-stone'], 'backing': [1440, 769], 'css': [1440, 769.1875], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 7520, 'bottom': 3740}, 'phase': 'aim', 'physics': '4331563bed6cefc825ca1d72de5aaefbb3ced53b9a1b76352ec17122c6007abb', 'play': {'left': 0, 'top': 0, 'right': 7200, 'bottom': 3500}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 13200, 'bottom': 27500}, 'unitCount': 36, 'viewport': {'left': 200, 'right': 7000, 'top': -3616.137152777778, 'bottom': 16.13715277777783}}, 'artifact': 14715185043, 'archivedDecodedImages': 12}, 'east': {'png': {'bytes': 260504, 'sha256': 'a3c1e3909ff7c9fd0fca8ff132930130533cd662c5327df9ac441d6f79bf55e6'}, 'physics': {'actual': {'x': 7520, 'y': 1750, 'scale': 0.21176470588235294}, 'actualDrawOwnerIDs': ['act3-handoff:29:west-bank', 'stage29:record-actual-stone-faces', 'stage29:record-archive-eaves', 'stage29:record-far-river-bank', 'stage29:record-inspection-eaves', 'stage29:record-keeper-hut', 'stage29:record-letter-room', 'stage29:record-rear-retaining-work', 'stage29:record-sluice-bearing', 'stage29:record-upper-rear-rail'], 'actualTerrainIDs': ['a3-foundation', 'r29-record-vault', 'old-door', 'r29-upper-ascent', 'r29-high-road', 'r29-inspection-roof', 'r29-inspection-deck', 'r29-low-screen', 'stage29-fallen-door', 'stage29-fallen-stone'], 'backing': [1440, 769], 'css': [1440, 769.1875], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 7520, 'bottom': 3740}, 'phase': 'aim', 'physics': '4331563bed6cefc825ca1d72de5aaefbb3ced53b9a1b76352ec17122c6007abb', 'play': {'left': 0, 'top': 0, 'right': 7200, 'bottom': 3500}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 13200, 'bottom': 27500}, 'unitCount': 36, 'viewport': {'left': 4120, 'right': 10920, 'top': -66.13715277777783, 'bottom': 3566.137152777778}}, 'artifact': 14715185043, 'archivedDecodedImages': 29}}, 's29-390x844': {'north': {'png': {'bytes': 111843, 'sha256': 'cb7ef5f03579172f1ad04676cc5e4bb3a796a47139e88809823f9c56c9e3f893'}, 'physics': {'actual': {'x': 3600, 'y': -1800, 'scale': 0.057352941176470586}, 'actualDrawOwnerIDs': ['act3-handoff:29:west-bank', 'stage29:record-actual-stone-faces', 'stage29:record-archive-eaves', 'stage29:record-far-river-bank', 'stage29:record-inspection-eaves', 'stage29:record-keeper-hut', 'stage29:record-letter-room', 'stage29:record-rear-retaining-work', 'stage29:record-sluice-bearing', 'stage29:record-upper-rear-rail'], 'actualTerrainIDs': ['a3-foundation', 'r29-record-vault', 'old-door', 'r29-upper-ascent', 'r29-high-road', 'r29-inspection-roof', 'r29-inspection-deck', 'r29-low-screen', 'stage29-fallen-door', 'stage29-fallen-stone'], 'backing': [390, 648], 'css': [390, 647.609375], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 7520, 'bottom': 3740}, 'phase': 'aim', 'physics': '4331563bed6cefc825ca1d72de5aaefbb3ced53b9a1b76352ec17122c6007abb', 'play': {'left': 0, 'top': 0, 'right': 7200, 'bottom': 3500}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 13200, 'bottom': 27500}, 'unitCount': 36, 'viewport': {'left': 200, 'right': 7000, 'top': -7445.82532051282, 'bottom': 3845.8253205128203}}, 'artifact': 14715185043, 'archivedDecodedImages': 8}, 'east': {'png': {'bytes': 74943, 'sha256': 'fdca438ed8986ba90c8be7a4fab9e5084b37d5c8bbc76845c5786faeeec6b201'}, 'physics': {'actual': {'x': 7520, 'y': 1750, 'scale': 0.057352941176470586}, 'actualDrawOwnerIDs': ['act3-handoff:29:west-bank', 'stage29:record-actual-stone-faces', 'stage29:record-archive-eaves', 'stage29:record-far-river-bank', 'stage29:record-inspection-eaves', 'stage29:record-keeper-hut', 'stage29:record-letter-room', 'stage29:record-rear-retaining-work', 'stage29:record-sluice-bearing', 'stage29:record-upper-rear-rail'], 'actualTerrainIDs': ['a3-foundation', 'r29-record-vault', 'old-door', 'r29-upper-ascent', 'r29-high-road', 'r29-inspection-roof', 'r29-inspection-deck', 'r29-low-screen', 'stage29-fallen-door', 'stage29-fallen-stone'], 'backing': [390, 648], 'css': [390, 647.609375], 'dpr': 1, 'focus': {'left': -320, 'top': -1800, 'right': 7520, 'bottom': 3740}, 'phase': 'aim', 'physics': '4331563bed6cefc825ca1d72de5aaefbb3ced53b9a1b76352ec17122c6007abb', 'play': {'left': 0, 'top': 0, 'right': 7200, 'bottom': 3500}, 'round': 1, 'sceneTime': 2, 'terrain': {'left': -6000, 'top': -24000, 'right': 13200, 'bottom': 27500}, 'unitCount': 36, 'viewport': {'left': 4120, 'right': 10920, 'top': -3895.8253205128203, 'bottom': 7395.82532051282}}, 'artifact': 14715185043, 'archivedDecodedImages': 21}}}
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
def rgba(raw): return Image.open(io.BytesIO(raw)).convert('RGBA')
def document(f):return json.loads(f.read_bytes())
def stamp(out,r):save(out/'BROWSER.json',r)
def exact_navigation_document(page,origin,expected):
 url=origin+'HONRO.html'
 response=page.goto(url,wait_until='domcontentloaded',timeout=50000)
 assert response and response.status==200 and response.url==url and not response.from_service_worker, 'wrong exact main document response'
 request=response.request
 assert request.url==url and request.method=='GET' and request.resource_type=='document' and request.is_navigation_request() and request.frame==page.main_frame
 assert request.redirected_from is None and request.redirected_to is None, 'unexpected navigation redirect'
 found=facts(response.body())
 assert found==expected,(url,'main document body differs',found,expected)
 return {'path':'HONRO.html','url':url,'status':response.status,'body':found,'proof':'exact-main-frame-page.goto-body'}
def case(browser,w,out,report,v,arm,g,target=None):
 a=arm=='A';origin='http://127.0.0.1:'+('18891'if a else '18892')+'/'; blob=re.compile('blob:'+re.escape(origin)+r'[\da-f-]{36}')
 known=g['active'+arm]; alias=dict(g['aliases']); required={k if a else alias.get(k,k)for k in v['requests']}|{g['runtime'+arm]}
 for k,val in v['requests'].items():
  if a or k not in alias and k!='HONRO.html':assert known[k]==val
 report['visits'].append(entry:={'arm':arm,'stage':v['stage'],'device':v['device'],'target':target,'prefix':[],'views':[],'state':'pending'})
 stamp(out,report)
 ctx=browser.new_context(viewport=dict(zip(('width','height'),v['device'])),device_scale_factor=1,service_workers='block')
 try:
  assert ctx.storage_state()=={'cookies':[],'origins':[]}
  page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script('('+OBS['INIT']+')()')
  errors=[];todo=set();hits=[];checked={};listenerChecked=set();seen=set();i=0
  def path(url):return url[len(origin):]if url.startswith(origin) and '?' not in url and '#' not in url else None
  def request(r):
   k=path(r.url)
   if r.method!='GET' or not(k in known or k in MEDIA and r.resource_type=='media' or blob.fullmatch(r.url)or r.url.startswith('data:')):
    errors.append(('unknown request',r.method,r.url))
   if k in known:todo.add(r)
  def failed(r):
   todo.discard(r)
   if not(path(r.url) in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):errors.append(('failed',r.url,r.failure))
  def response(r):
   k=path(r.url)
   if k in known and r.status==200:hits.append((k,r))
   elif blob.fullmatch(r.url)and r.status==200:seen.add(r.url)
   elif k in MEDIA and r.request.resource_type=='media' and r.status in (200,206):return
   elif not r.url.startswith('data:'):errors.append(('unknown response',r.url,r.status))
  for k,f in [('request',request),('requestfinished',lambda r:todo.discard(r)),('requestfailed',failed),('response',response),('pageerror',lambda e:errors.append(('page error',str(e))))]:page.on(k,f)
  def drain():
   nonlocal i
   q=0;expiry=time.monotonic()+20
   while time.monotonic()<expiry:
    assert not errors,errors
    while i<len(hits)and hits[i][1].request not in todo:
     k,r=hits[i];assert facts(r.body())==known[k],(arm,k);checked[k]=known[k];listenerChecked.add(k);i+=1
    before=(i,len(seen));page.wait_for_timeout(105)
    q=q+1 if before==(len(hits),len(seen))and not todo and required<=checked.keys()and required-{'HONRO.html'}<=listenerChecked else 0
    if q==3:
     assert seen<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'));return
   raise RuntimeError(('missing normal response bodies',sorted(required-checked.keys()),errors))
  navigation=exact_navigation_document(page,origin,known['HONRO.html'])
  checked['HONRO.html']=navigation['body']
  entry['navigationDocument']=navigation;stamp(out,report)
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  stage=v['stage']; id=v['provider']['stage'];dim=[v['provider'][k]for k in ('width','height')]
  assert page.evaluate(OBS['LAUNCH'],{'stage':stage,'catalogID':id,'activeDeclaredDimensions':dim})==v['provider']
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  def png():return base64.b64decode(page.evaluate(OBS['RAW']),validate=True)
  rawDIR=out/('mobile'if v['device'][0]==390 else 'pc-target'if stage==28 else 'pc-control')
  rawDIR.mkdir(exist_ok=True)
  def request_pose(name):
   x,y=DIRECTIONS[name];return {'stage':stage,'id':id,'name':name,'dx':x,'dy':y,'readback':False}
  if target is not None:
   control=CONTROL_PREFIX[f's{stage:02d}-{v["device"][0]}x{v["device"][1]}']
   names=list(DIRECTIONS)[:list(DIRECTIONS).index(target)]
   assert names==(['north','east','south'] if target=='west'else ['north','east'])
   for name in names:
    p0=request_pose(name);prior=control[name]
    # Same exact historical traversal call order. No VERIFY, no extra draw.
    f0=page.evaluate(PARK,p0);dec0=page.evaluate(OBS['DECODE'])
    again=page.evaluate(PARK,{**p0,'readback':True})
    raw=png();actual=facts(raw)
    state={k:f0[k]for k in prior['physics']}
    claim={'name':name,'archive':prior['artifact'],'png':actual,'expected':prior['png'],'observedDecodedImages':dec0,
     'archivedDecodedImages':prior['archivedDecodedImages'],'exactCameraPhysics':again==f0 and state==prior['physics'],
     'exactArchive':actual==prior['png']}
    entry['prefix'].append(claim);stamp(out,report)
    if not (claim['exactArchive'] and claim['exactCameraPhysics'] and dec0>0):
     problem=rawDIR/f'{arm}-s{stage:02d}-{v["device"][0]}x{v["device"][1]}-for-{target}-prefix-{name}-HOLD.png'
     problem.write_bytes(raw);claim['failurePNG']=str(problem.relative_to(out));claim['actualPhysics']=state;stamp(out,report)
     raise AssertionError((arm,stage,v['device'],target,'unaltered exact historical route prefix',name))
  for name in ([target] if target is not None else v['directions']):
   k=f's{stage:02d}-{v["device"][0]}x{v["device"][1]}-{name}'; x,y=DIRECTIONS[name];p={'stage':stage,'id':id,'name':name,'dx':x,'dy':y,'readback':False}
   start=page.evaluate(PARK,p);dec=page.evaluate(OBS['DECODE']);assert dec>0
   ref=P['frames'][k];sig={o:start[o]for o in ref.keys()-{'referencePNG','positive'}}
   law={'stage':stage,'depth':9000 if a else 27400}
   rec={'arm':arm,'physics':sig,'images':dec,'phases':{'repeats':[]}}
   report['frames'][f'{arm}-{k}']=rec
   def take(label):
    camera=page.evaluate(PARK,{**p,'readback':True})
    native=page.evaluate(VERIFY,law)
    snap=png()
    suffix='' if label=='phase1' else '-'+label
    frame_path=rawDIR/f'{arm}-{k}{suffix}-raw.png'
    frame_path.write_bytes(snap)
    row={'path':str(frame_path.relative_to(out)),'png':facts(snap),'native':native,'sameCameraAndPhysics':camera==start}
    if label.startswith('repeat'):rec['phases']['repeats'].append(row)
    else:rec['phases'][label]=row
    stamp(out,report)
    # Gather screen-cache evidence only after saving the exact original raw.
    row['screen']=page.evaluate(SCREEN)
    assert list(rgba(snap).size)==ref['backing'] and row['screen']['backing']==ref['backing']
    stamp(out,report)
    return snap,row,frame_path
   snap,first,_=take('phase1')
   # Preserve the R2 exact archive guard for every accepted baseline first snapshot.
   if a:assert first['png']==ref['referencePNG'],(arm,k,'already observed public baseline PNG SHA drift',first['png'],ref['referencePNG'])
   assert sig=={o:ref[o]for o in sig},(arm,k,'camera/state/owner/physics differs',[(o,sig[o],ref[o])for o in sig if sig[o]!=ref[o]])
   assert first['sameCameraAndPhysics'],(arm,k,'phase1 same readback')
   warm,second,_=take('phase2')
   assert second['sameCameraAndPhysics'],(arm,k,'phase2 same readback')
   # The exact stock same-pose transition is certified independently; do not
   # accept changes in this prior known evidence or waive phase-matching A/B.
   if a and k=='s28-390x844-north':
    assert first['png']==WARM_NORTH['phase1'] and second['png']==WARM_NORTH['phase2'],(arm,k,'known native north phases differ from independent actual stock')
    assert first['screen']['structural']['screenBackgroundBytes']==WARM_NORTH['phase1BackgroundBytes']
    assert second['screen']['structural']['screenBackgroundBytes']==WARM_NORTH['phase2BackgroundBytes']
    assert second['screen']['caches'][1]['size']==WARM_NORTH['phase2BackgroundSize']
    report['phaseWitness'].update({'A-mobile-north-cold-qualified':True,'A-mobile-north-settled-qualified':True});stamp(out,report)
   assert first['native']==second['native'],(arm,k,'cache allocation/material/state drift between phases')
   screen_semantic=lambda f:{i:x for i,x in f['screen'].items()if i!='hits'}
   for i in (1,2):
    restored,r,img=take(f'repeat{i}')
    assert r['sameCameraAndPhysics'] and r['native']==second['native'],(arm,k,'settled repeat camera/physics/native bounded tile drift',i)
    assert screen_semantic(r)==screen_semantic(second),(arm,k,'settled repeat changes native structural screen cache',i)
    assert restored==warm,(arm,k,'settled native render does not reproduce byte for byte',i)
    # Evidence retains both qualified images and per-repeat receipts; preserve
    # unexpected failure raw frames above, drop only byte-identical duplicates.
    img.unlink();r['path']=second['path'];r['identicalDuplicateNotArchived']=True
   rec.update(path=first['path'],png=first['png'],native=first['native'])
   entry['views'].append(k);stamp(out,report)
  drain()
  assert required-{'HONRO.html'}<=listenerChecked
  entry.update(state='NETWORK_AND_CAPTURE_EXACT',requiredObserved=sorted(required),observedCount=len(checked),
   listenerVerifiedRequired=sorted(required&listenerChecked),navigationAlsoSeenByListener='HONRO.html'in listenerChecked);stamp(out,report)
 finally:ctx.close()
def compare(A,B,ref):
 assert A.size==B.size and list(A.size)==ref['backing']; w,h=A.size
 u=ref['viewport'];z=ref['actual']['scale'];skin=ref['positive']
 diff,alpha,bad,peak=0,0,0,0;yr=[]
 pa,pb=A.load(),B.load()
 for y in range(h):
  yt=u['top']+y/z
  for x in range(w):
   a,b=pa[x,y],pb[x,y]
   if a==b:continue
   diff+=1;peak=max(peak,max(abs(i-j)for i,j in zip(a,b)));yr.append(y)
   alpha+=(a[3]!=b[3])
   bad+=not (skin and yt>=8900 and -9000<=u['left']+x/z and u['left']+(x+1)/z<=16200)
 good=False;diagnostics={}
 if skin:
  y0=math.ceil((9000-u['top'])*z)+2
  bot=(y0,h)
  levels=lambda pp,y:median(sum(pp[x,y][:3])/3 for x in range(w))
  # Archived original exposes continuous lighter FAR after y9000. Predeclared
  # below-cut stock vs B uses in-plane occupancy, not tuning a visual difference.
  old=min(levels(pa,y)for y in range(*bot));new=max(levels(pb,y)for y in range(*bot))
  above=levels(pb,max(0,y0-7)); uniform=max(abs(levels(pb,y)-levels(pb,y+1))for y in range(max(0,y0-7),h-1))
  diagnostics={'lowerBandRows':list(bot),'stockBrightMinMedian':old,'candidateDarkMaxMedian':new,'candidateAboveLuma':above,'largestNewAdjacentMedianStep':uniform}
  good=old-new>=20 and uniform<=8
 else:good=diff==0
 return {'pass':not(alpha or bad)and good and (diff>0 if skin else True),'signedPositive':skin,'changed':diff,'unsigned':bad,
         'alpha':alpha,'maxRGBADN':peak,'changedRows':([min(yr),max(yr)]if yr else None),'noReplacementLineInNativeMinimumCamera':diagnostics}
def paired(out,q):
 for k,f in P['frames'].items():
  a,b=[q['frames'][side+'-'+k]for side in ('A','B')]
  assert a['physics']==b['physics']
  phases={}
  for label in ('phase1','phase2'):
   aa=a['phases'][label];bb=b['phases'][label];n,m=aa['native'],bb['native']
   assert aa['sameCameraAndPhysics'] and bb['sameCameraAndPhysics']
   assert {i:x for i,x in n.items()if i!='deep'}=={i:x for i,x in m.items()if i!='deep'},(k,label,'native draw/physics/bounded tile cache changed',n,m)
   assert bool(n['deep'])==bool(m['deep'])
   if n['deep']:assert {**n['deep'],'renderY':27400}==m['deep']
   assert aa['screen']==bb['screen'],(k,label,'phase-matched native screen state differs',aa['screen'],bb['screen'])
   phases[label]=compare(rgba((out/aa['path']).read_bytes()),rgba((out/bb['path']).read_bytes()),f)
   # Preserve R2 phase1 status fields for downstream read-only retainer, while
   # release seal now requires both exact independent same-phase comparisons.
   q['paired'][k]={**phases['phase1'],'pass':False,'phases':phases};stamp(out,q)
  q['paired'][k]['pass']=all(x['pass']for x in phases.values());stamp(out,q)
 assert len(q['paired'])==24 and all(r['pass']for r in q['paired'].values()),'a cache phase/camera or unsigned pixel/visual cutoff gate failed'
def main(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 out=w/'out';g=document(out/'GRAPH.json')
 q={'status':'HOLD','release':P['base'],'scope':'Official isolated A public compiled and B normally rebuilt; new native render observations, not playthrough or publication.',
    'witness':P['witness'],'stockPhaseEvidence':WARM_NORTH,'prefixArchiveReceiptSHA256s':PREFIX_WITNESSES,'phaseWitness':{},'visits':[],'frames':{},'paired':{}}
 try:
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['chrome']=br.version
   try:
    assert br.version=='151.0.7922.34'
    for side in ('A','B'):
     for v in P['visits'].values():
      for target in ([None] if v['stage']==28 else v['directions']):case(br,w,out,q,v,side,g,target)
   finally:br.close()
  paired(out,q);q['status']='PASS_ACTUAL_STAGE28_SIGNED_POSTER_ONLY'
 except Exception as e:
  q['firstFailedGate']=repr(e);(out/'BROWSER.traceback.txt').write_text(traceback.format_exc());raise
 finally:stamp(out,q)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
