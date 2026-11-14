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
        const vector = structuredClone(asset.vector);
        for (const [path, key, value] of entry.paths) {
          const node = path.reduce((value, part) => value?.[part], vector);
          if (node?.tag !== 'path' || !['d','dParts'].includes(key) || !Object.hasOwn(node,key))
            throw Error('Invalid terrain optimization path: '+asset.id);
          node[key] = value;
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
