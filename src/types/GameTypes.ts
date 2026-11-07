export type GameState = 'AUTH' | 'CHARACTER_CREATION' | 'PLAYING';

export type RoleType = 'NOVICE' | 'KNIGHT' | 'MAGICIAN' | 'ASSASSIN' | 'HEALER' | 'NECROMANCER';

export interface CharacterCostume {
  id: number;
  name: string;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
  hairStyle: 'short' | 'spiky' | 'long' | 'hood';
  hatColor?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  role: RoleType;
  unlockLevel: number;
  manaCost: number;
  cooldown: number; // in seconds
  currentCooldown: number;
  iconSymbol: string;
  color: string;
  isAbnormal?: boolean;
}

export interface PlayerStats {
  level: number;
  exp: number;
  maxExp: number;
  mp: number;
  maxMp: number;
  role: RoleType;
}
