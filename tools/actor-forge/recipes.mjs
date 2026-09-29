import {actorCatalog} from './catalog.mjs';
import {human} from './humans.mjs';
import {spirit} from './spirits.mjs';
import {object} from './objects.mjs';
import {matureHuman,matureSpirit} from './anatomy.mjs';
export const actors=actorCatalog.map(d=>d.family==='human'?matureHuman(human(d)):d.family==='summon'?matureSpirit(spirit(d)):object(d));
