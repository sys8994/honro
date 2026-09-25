import type {Unit} from './types';
export type SummonKind=NonNullable<Unit['summonKind']>;
/** Ghost locomotion is truly two-dimensional. Values are shared with UI/tests. */
export const SUMMON_TUNING:Record<SummonKind,{move:number;speed:number;reach:number;damage:number}>={
 stalker:{move:2600,speed:2200,reach:520,damage:42},
 charger:{move:3200,speed:2600,reach:640,damage:54},
 host:{move:2850,speed:2350,reach:760,damage:60},
 lantern:{move:1550,speed:1600,reach:2400,damage:32},
 warden:{move:1800,speed:1700,reach:1500,damage:0}
};
