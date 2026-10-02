import type {Unit} from './types';
export type SummonKind=NonNullable<Unit['summonKind']>;
/** Summon action budgets. Ground-bound spirits follow terrain in Engine. */
export const SUMMON_TUNING:Record<SummonKind,{move:number;speed:number;reach:number;damage:number}>={
  stalker:{move:1660,speed:1760,reach:330,damage:32},
 charger:{move:3200,speed:2600,reach:640,damage:54},
 host:{move:2850,speed:2350,reach:760,damage:60},
  lantern:{move:1240,speed:1600,reach:1920,damage:32},
 warden:{move:1800,speed:1700,reach:1500,damage:0},
 eater:{move:0,speed:0,reach:0,damage:0},echo:{move:0,speed:0,reach:0,damage:0},earthbound:{move:0,speed:0,reach:180,damage:0}
};
