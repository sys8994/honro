import type {Battle} from './types';

/** A replay receives the complete detached battle and runs exactly once. */
export function withPredictionBattle<T>(b:Battle,run:(copy:Battle)=>T):T {
 return run(structuredClone(b));
}
