import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const file = new URL('./data/terrain-path-optimization.json', import.meta.url);
const sha = text => createHash('sha256').update(text).digest('hex');

export async function terrainPathOptimization() {
  const entries = JSON.parse(await readFile(file, 'utf8'));
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  if (byId.size !== entries.length) throw Error('Duplicate terrain optimization asset');
  return {
    apply(assets) {
      for (const asset of assets) {
        const entry = byId.get(asset.id);
        if (!entry) continue;
        const raw = JSON.stringify(asset.vector);
        if (sha(raw) !== entry.original) throw Error('Terrain art changed before optimization: '+asset.id);
        // Geometry hidden by the Act 3 strip mapping may become visible after a route edit.
        if (entry.contactMapping && sha(JSON.stringify(asset.params?.contactMapping ?? null)) !== entry.contactMapping)
          throw Error('Terrain contact mapping changed before optimization: '+asset.id);
        const vector = structuredClone(asset.vector);
        for (const [path, key, value] of entry.paths) {
          const node = path.reduce((value, part) => value?.[part], vector);
          // A long re-traced leaf may move from one 'd' string to chunked 'dParts'.
          const promote = key === 'dParts' && Object.hasOwn(node,'d') && !Object.hasOwn(node,'dParts');
          if (node?.tag !== 'path' || !['d','dParts'].includes(key) || !(Object.hasOwn(node,key) || promote))
            throw Error('Invalid terrain optimization path: '+asset.id);
          if (promote) delete node.d;
          node[key] = value;
        }
        // Clip silhouettes may be replaced by versions cropped to the window they actually show.
        for (const [name, value] of Object.entries(entry.clips || {})) {
          if (!Array.isArray(vector.clips?.[name]) || !Array.isArray(value) || !value.every(d => typeof d === 'string' && d.length && d.length <= 60000))
            throw Error('Invalid terrain optimization clip: '+asset.id+' '+name);
          vector.clips[name] = value;
        }
        if (Buffer.byteLength(JSON.stringify(vector)) >= Buffer.byteLength(raw))
          throw Error('Optimized terrain did not get smaller: '+asset.id);
        asset.vector = vector;
      }
    },
    previousAct4Signatures: Object.fromEntries(entries.filter(entry => entry.act4)
      .map(entry => [entry.id, entry.act4])),
  };
}
