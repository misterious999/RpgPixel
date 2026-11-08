export type GameState = 'AUTH' | 'CHARACTER_CREATION' | 'PLAYING';

export type RoleType = 'NOVICE' | 'KNIGHT' | 'MAGICIAN' | 'ASSASSIN' | 'HEALER' | 'NECROMANCER';

export type MagicElement = 'FIRE' | 'ICE' | 'LIGHTNING' | 'WIND' | 'EARTH';

export interface MagicianAffinities {
  primary: MagicElement;
  secondaries: MagicElement[]; // max 2
}

export interface CharacterCostume {
  id: number;
  name: string;
  hairColor: string;
  outfitColor: string;
  accentColor: string;
  hairStyle: 'short' | 'spiky' | 'long' | 'hood' | 'ponytail' | 'wild' | 'helmet' | 'crown' | 'bandana';
  hatColor?: string;
  // Head-to-toe detailed customization
  skinTone?: string;      // Warna kulit wajah & tangan
  eyeColor?: string;      // Warna pupil iris mata
  headgear?: 'none' | 'hood' | 'helmet' | 'crown' | 'bandana' | 'headband';
  outfitStyle?: 'tunic' | 'plate' | 'robe' | 'gi' | 'noble' | 'leather';
  capeStyle?: 'none' | 'cape' | 'mantle' | 'scarf';
  capeColor?: string;
  pantsColor?: string;
  pantsStyle?: 'trousers' | 'shorts' | 'armored';
  bootColor?: string;
  bootStyle?: 'boots' | 'sabatons' | 'tabi' | 'shoes';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  role: RoleType;
  element?: MagicElement;
  isPrimaryElement?: boolean;
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
  magicianAffinities?: MagicianAffinities;
}
