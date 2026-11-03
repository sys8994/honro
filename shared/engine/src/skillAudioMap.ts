import type {Material} from './types';
/** Closed player catalogue. Event meaning is supplied by Engine, never by UI/render text. */
export type SkillAudioPhase='launch'|'swing'|'hit'|'block'|'reflect'|'burst'|'terrain-break'|'plant'|'trigger'|'status'|'summon'|'depart'|'heal'|'gate-depart'|'gate-arrive'|'landing';
export type SkillAudioSignal={phase:SkillAudioPhase;actor:string;skill:string;cast:string;autonomous:boolean;target?:string;material?:Material};
type Profile={charge?:'bow'|'qi';launch?:string;hit:string;burst?:string;block?:string;status?:string;plant?:string;trigger?:string;ground?:string;family:string};
export const PLAYER_SKILL_AUDIO:Record<string,Profile>={};
function group(ids:string[],profile:Profile){for(const id of ids)PLAYER_SKILL_AUDIO[id]={...profile};}
group(Array.from({length:15},(_,i)=>'A'+String(i+1).padStart(2,'0')).concat('A99'),{charge:'bow',launch:'bow_release',hit:'bow_hit',block:'arrow_block',family:'bow'});
PLAYER_SKILL_AUDIO.A10={charge:'bow',hit:'bow_hit',status:'qi_launch',family:'bow'};
group(['M01','M03','M11','M12','M14','M15'],{charge:'qi',launch:'qi_launch',hit:'qi_hit',burst:'qi_hit',block:'qi_hit',family:'qi'});
for(const [id,hit]of Object.entries({M02:'ice_hit',M04:'thunder_hit',M05:'cheonroe_thunder',M06:'fire_hit',M13:'fire_hit'}))group([id],{charge:'qi',launch:'gourd_throw',hit,burst:hit,block:'qi_hit',family:'gourd'});
group(['M07','M08','M09','M10','M99'],{charge:'qi',launch:'qi_launch',hit:'stake_trigger',plant:'stake_plant',trigger:'stake_trigger',family:'stake'});
group(['S00','S02','S03','S05','S07','S08'],{hit:'sword_hit',family:'sword'});
group(['S01','S04','S06','S13','S15'],{launch:'sword_swing',hit:'sword_hit',ground:'rock_impact',family:'sword'});
group(['S09','S10','S11','S12','S14'],{launch:'blade_launch',hit:'sword_hit',burst:'sword_hit',family:'blade'});
group(Array.from({length:16},(_,i)=>'O'+String(i+1).padStart(2,'0')),{charge:'qi',launch:'sodan_release',hit:'spirit_hit',burst:'spirit_hit',block:'spirit_hit',status:'curse_attach',family:'spirit'});
/** Per-asset trims (dB) measured as max 100ms RMS so cues land on tiers: impact -17, launch -18.5, support -22. */
export const SKILL_AUDIO_TRIM_DB:Record<string,number>={"bow_hit":2.5,"sword_hit":0.4,"qi_hit":1.6,"spirit_hit":0.9,"ice_hit":0.5,"fire_hit":-0.5,"stake_trigger":1.8,"rock_impact":3.2,"arrow_block":2.9,"sword_parry":5.7,"thunder_hit":2.1,"cheonroe_thunder":-2.0,"bow_release":0.6,"qi_launch":-1.6,"gourd_throw":3.4,"sodan_release":1.5,"sword_swing":-2.0,"blade_launch":1.2,"stake_plant":-4.3,"curse_attach":0.2,"summon_appear":-1.4,"spirit_depart":3.2,"heal":2.3,"gate_depart":-4.3,"gate_arrive":-3.0};
export const CHARGE_AUDIO_TRIM_DB:Record<string,number>={bow:23.7,qi:18.9};
/** Recorded (CC0) replacements for engine synth cues; gains land on tiers (impact -17, attack -18.5, layer -20, support -22). */
export const RECORDED_SFX:Record<string,{asset:string;gain:number}>={hit:{asset:'enemy_hit',gain:.741},impact:{asset:'enemy_impact',gain:.359},wing:{asset:'enemy_wing',gain:.61},clatter:{asset:'enemy_clatter',gain:.507},jump:{asset:'step_jump',gain:1.06},arrowhit:{asset:'bow_hit',gain:1},arrow:{asset:'bow_release',gain:1},sword:{asset:'sword_swing',gain:.596}};
export const trimGain=(db:number|undefined)=>Math.pow(10,(db||0)/20);
export function skillAudioCue(e:SkillAudioSignal){const p=PLAYER_SKILL_AUDIO[e.skill];if(!p)return null;let asset:string|undefined,gain=.75;
 switch(e.phase){case'launch':asset=e.autonomous&&p.family==='spirit'?'qi_launch':p.launch;gain=e.autonomous?.55:asset==='sodan_release'?1:asset==='bow_release'?.95:.8;break;case'swing':asset='sword_swing';break;case'hit':asset=p.family==='stake'?undefined:p.hit;gain=e.autonomous?.6:.75;break;case'burst':asset=p.family==='stake'?undefined:p.burst||p.hit;break;case'block':asset=p.block;gain=.6;break;case'reflect':asset=p.family==='qi'||p.family==='gourd'?'qi_hit':p.block;gain=.5;break;case'landing':asset=p.ground;break;case'terrain-break':asset=e.skill==='A07'?'rock_impact':undefined;break;case'plant':asset=p.plant;break;case'trigger':asset=p.trigger;break;case'status':asset=p.status;break;case'summon':asset='summon_appear';break;case'depart':asset='spirit_depart';gain=.6;break;case'heal':asset='heal';gain=.55;break;case'gate-depart':asset='gate_depart';break;case'gate-arrive':asset='gate_arrive';break;}
 if(e.phase==='block'&&e.skill==='S08')asset='sword_parry';
 if(e.phase==='block'&&p.family==='bow'&&['wood','support'].includes(e.material||''))gain=.45;
 if(asset==='cheonroe_thunder'&&e.skill==='M05')gain=.90;
 return asset?{asset,gain:gain*trimGain(SKILL_AUDIO_TRIM_DB[asset]),family:asset==='sodan_release'?'bell':p.family}:null;
}
export function skillAudioAssets(skill:string){const p=PLAYER_SKILL_AUDIO[skill];if(!p)return[];const phases:SkillAudioPhase[]=['launch','swing','hit','block','reflect','burst','terrain-break','plant','trigger','status','summon','depart','heal','gate-depart','gate-arrive','landing'];const names=new Set<string>(p.charge?[p.charge+'_charge',p.charge+'_charge_loop']:[]);for(const phase of phases){if(['swing'].includes(phase)&&!['sword','blade'].includes(p.family))continue;if(['summon','depart'].includes(phase)&&!['O11','O12','O13','O14'].includes(skill))continue;if(['gate-depart','gate-arrive'].includes(phase)&&skill!=='M09')continue;if(phase==='heal'&&!['M10','O13'].includes(skill))continue;const cue=skillAudioCue({phase,actor:'',skill,cast:'',autonomous:false});if(cue)names.add(cue.asset);}if(p.family==='spirit')names.add('qi_launch');return[...names];}
