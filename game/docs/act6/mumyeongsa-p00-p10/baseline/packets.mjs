import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {FRONTS59} from '../../../../../shared/runtime/stage59-owner.mjs';
import {BOSS58} from '../../../../../shared/runtime/stage58-owner.mjs';

const source = new URL('../../../../../', import.meta.url);
const packet = name => new URL('shared/data/act6-qa/'+name+'.json', source);
const json = path => JSON.parse(readFileSync(path));
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
function geometry(map, library) {
  return {
    mapId: map.id,
    play: map.playBounds ?? {left:0,top:0,right:map.width,bottom:map.height},
    terrain: map.terrainBounds ?? null,
    authoredUnitIds: map.units.map(u=>u.id),
    colliderPoints: map.terrains.map(t=>({id:t.id, points:t.points.length, type:t.type})),
    assets: library.length
  };
}

const first = json(packet('first-two'));
const rows = Object.entries(first.rows).map(([id,{entry}])=>({
  id:+id, packet:'first-two', sha256:hash(packet('first-two')),
  ...geometry(JSON.parse(entry.mapBytesUTF8),JSON.parse(entry.assetBytesUTF8))
}));
for(const name of ['third','fourth','fifth','sixth','seventh','eighth','ninth','tenth']){
  const d=json(packet(name));
  const roster=d.foes??d.roles??d.provisionalTwoStockEnemies??[];
  rows.push({
    id:d.id??d.rule.id, packet:name, sha256:hash(packet(name)),
    ...geometry(d.map??JSON.parse(d.mapText),d.library??JSON.parse(d.libraryText)),
    rosterRows:Array.isArray(roster)?roster.map(unit=>unit.id??unit.owner?.id??unit.kind):Object.keys(roster),
    ...(name==='fourth'?{charts:Object.fromEntries(Object.entries(d.charts).map(([key,c])=>[
      key,{width:c.width,height:c.height,play:c.play,terrain:c.terra}
    ]))}:{}),
    ...(d.spawn?{authoredSpawn:d.spawn}:{})
  });
}
const sources = {
  stage56: {
    sourceSHA: rows.find(r=>r.id===56).sha256,
    authority: 'shared/runtime/stage56-owner.mjs',
    bodyAsset: json(packet('sixth')).library.map(a=>({id:a.id,visualFaces:a.visual.length}))
  },
  stage58: {
    reservedCombatIds:json(packet('eighth')).roles.filter(u=>u.side===1).map(u=>u.id),
    grotesqueTotal:BOSS58.grot.total,
    grotesqueMaxAlive:BOSS58.grot.maxAlive
  },
  stage59: {
    frontCounts:FRONTS59.fronts.map(f=>({id:f.id,count:f.squads.reduce((n,squad)=>n+squad.length,0)})),
    perFrontCap:FRONTS59.perFrontCap,
    totalCap:FRONTS59.totalCap
  }
};
process.stdout.write(JSON.stringify({rows,sources},null,2)+'\n');
